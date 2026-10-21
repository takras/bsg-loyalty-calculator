// Runs the Android Gradle wrapper with a known-good Java and SDK, so `npm run android:*` doesn't depend
// on the shell's JAVA_HOME / ANDROID_HOME. Uses Android Studio's bundled JDK (JBR) unless JAVA_HOME is set.
// (gradlew.bat passes an empty -classpath, which some standalone JDKs on PATH reject.)
// Usage: node scripts/gradle.mjs <gradle tasks/args>
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const win = process.platform === "win32";
const mac = process.platform === "darwin";
const env = { ...process.env };

const firstExisting = (paths) => paths.find((p) => p && existsSync(p));

if (!env.JAVA_HOME) {
  const jbr = firstExisting(
    win
      ? ["C:/Program Files/Android/Android Studio/jbr", join(env.LOCALAPPDATA ?? "", "Programs", "Android Studio", "jbr")]
      : mac
        ? ["/Applications/Android Studio.app/Contents/jbr/Contents/Home"]
        : ["/opt/android-studio/jbr", join(homedir(), "android-studio", "jbr")],
  );
  if (jbr) env.JAVA_HOME = jbr;
  else console.warn("JAVA_HOME is not set and Android Studio's JDK was not found – using the java on PATH.");
}

if (!env.ANDROID_HOME && !env.ANDROID_SDK_ROOT) {
  const sdk = firstExisting(
    win
      ? [join(env.LOCALAPPDATA ?? "", "Android", "Sdk")]
      : mac
        ? [join(homedir(), "Library", "Android", "sdk")]
        : [join(homedir(), "Android", "Sdk")],
  );
  if (sdk) env.ANDROID_HOME = sdk;
}

console.log(`Gradle with JAVA_HOME=${env.JAVA_HOME ?? "(PATH)"}`);
// .bat files must run through cmd.exe; calling it explicitly avoids Node's `shell: true` path.
const args = process.argv.slice(2);
const child = win
  ? spawn("cmd.exe", ["/d", "/c", ".\\gradlew.bat", ...args], { cwd: "android", env, stdio: "inherit" })
  : spawn("./gradlew", args, { cwd: "android", env, stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
