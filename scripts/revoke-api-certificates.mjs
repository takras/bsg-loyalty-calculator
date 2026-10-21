/**
 * Revokes the signing certificates that Xcode created through the App Store
 * Connect API ("Created via API"), leaving certificates made by hand alone.
 *
 * CI signs with -allowProvisioningUpdates on a fresh runner every time, so
 * each run creates its certificate and the private key is thrown away with the
 * runner. They pile up until Apple refuses a new one ("Your account has
 * reached the maximum number of certificates"). Nothing else can use them:
 * the private keys no longer exist.
 *
 * Usage: node scripts/revoke-api-certificates.mjs [--dry-run]
 * Needs APP_STORE_CONNECT_KEY_ID, APP_STORE_CONNECT_ISSUER_ID and the key at
 * ~/private_keys/AuthKey_<key id>.p8 (an Admin team key).
 */
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const API = "https://api.appstoreconnect.apple.com";
const CREATED_BY_XCODE = "Created via API";
const dryRun = process.argv.includes("--dry-run");

const keyId = process.env.APP_STORE_CONNECT_KEY_ID;
const issuerId = process.env.APP_STORE_CONNECT_ISSUER_ID;
if (!keyId || !issuerId) {
  console.error(
    "APP_STORE_CONNECT_KEY_ID and APP_STORE_CONNECT_ISSUER_ID are required",
  );
  process.exit(1);
}
const privateKey = createPrivateKey(
  readFileSync(path.join(os.homedir(), "private_keys", `AuthKey_${keyId}.p8`)),
);

function token() {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: "ES256", kid: keyId, typ: "JWT" })}.${encode(
    {
      iss: issuerId,
      iat: now,
      exp: now + 600,
      aud: "appstoreconnect-v1",
    },
  )}`;
  const signature = sign("sha256", Buffer.from(unsigned), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });
  return `${unsigned}.${signature.toString("base64url")}`;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!response.ok) {
    throw new Error(
      `${options.method ?? "GET"} ${url} -> ${response.status} ${await response.text()}`,
    );
  }
  return response.status === 204 ? null : response.json();
}

async function listCertificates() {
  const certificates = [];
  let url = `${API}/v1/certificates?limit=200`;
  while (url) {
    const page = await request(url);
    certificates.push(...page.data);
    url = page.links?.next ?? null;
  }
  return certificates;
}

const all = await listCertificates();
const stale = all.filter((certificate) =>
  String(certificate.attributes.name ?? "").includes(CREATED_BY_XCODE),
);
console.log(
  `${all.length} certificate(s) on the account, ${stale.length} created via API`,
);

for (const certificate of stale) {
  const { name, certificateType, expirationDate } = certificate.attributes;
  console.log(
    `${dryRun ? "Would revoke" : "Revoking"} ${certificateType} "${name}" (expires ${expirationDate})`,
  );
  if (!dryRun) {
    await request(`${API}/v1/certificates/${certificate.id}`, {
      method: "DELETE",
    });
  }
}
