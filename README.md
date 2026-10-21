# BSG Companion

Quick reference for *Battlestar Galactica: The Board Game* (base + Pegasus, Exodus, Daybreak).
A pure client-side app: no server, no login. State is kept in the browser's localStorage;
**Start over** clears it.

## Sections

- **Setup** – expansions, Exodus modules, ending and variants; pick characters in seat order
  (type balance and alternate versions are enforced). Shows the exact Loyalty deck, the deal,
  starting title holders and a board/component checklist.
- **Titles** – Admiral / President / CAG lines of succession for the characters in play. Mark players
  as in the Brig or revealed Cylon and titles pass down automatically; manual "give" for card effects.
- **Combat** – die-roll hit table with ship silhouettes, filtered to your expansions.
- **Crisis icons** – what each Cylon activation icon does, and when ships go to the Cylon Fleet board.
- **Execution** – step-by-step procedure; choose human/Cylon and pick the replacement character.
- **Quick rules** – Reckless, revealing, Sleeper Agent phase, jumps and other look-ups.
- **Rulebook** – the full [unified BSG rulebook](https://jbiatek.github.io/BSGRulebook/rulebook.html),
  filtered to your setup and searchable.

## Website

Deployed to GitHub Pages at **https://bsg.takras.net/** by `.github/workflows/deploy-pages.yml` on every
push to `main` (or manually from the Actions tab). The privacy policy is `public/privacy.html`
→ https://bsg.takras.net/privacy.html (also linked from Rules → About & attributions), and the bundled
licence texts are at `/third-party-licenses.txt`.

One-time setup: repo **Settings → Pages → Source: GitHub Actions**, custom domain `bsg.takras.net`,
then **Enforce HTTPS** once the certificate is issued; DNS: `CNAME bsg → takras.github.io`.

## Look & feel

Mobile first, styled after the ship consoles in the show. Two themes, switched with the button in
the header: **CIC** (steel blue, default) and **COL** (amber Colonial computer).

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

`dist/` is plain static files with relative paths and hash routing, so it can be served from any
web server or sub-folder – no rewrites needed.

## Native apps (Capacitor)

App id `net.takras.bsg`, name "BSG Companion". The native projects live in `android/` and `ios/`
and are committed; the web build in `dist/` is copied into them by `cap sync`.

```bash
npm run android   # build web, sync, open Android Studio
npm run ios       # build web, sync, open Xcode (macOS only)
```

- **Android**: needs Android Studio (SDK + JDK 21). The `android:*` scripts run Gradle through
  `scripts/gradle.mjs`, which uses Android Studio's bundled JDK and SDK unless `JAVA_HOME` /
  `ANDROID_HOME` are set (some standalone JDKs on PATH reject `gradlew.bat`'s empty `-classpath`).
  - Debug APK: `npm run android:debug` → `android/app/build/outputs/apk/debug/app-debug.apk`
  - Play Store bundle: `npm run android:release` → `android/app/build/outputs/bundle/release/app-release.aab`
  - The release is signed with your **upload key**, configured in `android/keystore.properties`
    (copy `android/keystore.properties.example`; the file and any `*.jks` are git-ignored), or via the
    `BSG_KEYSTORE_FILE`, `BSG_KEYSTORE_PASSWORD`, `BSG_KEY_ALIAS`, `BSG_KEY_PASSWORD` environment variables.
    Without it the release build stops with an explanation.
  - Use Play App Signing: Google holds the app signing key, you only keep the upload key. Back it up.
- **Versions**: `versionName` = `package.json` version, `versionCode` = major·10000 + minor·100 + patch.
  Bump with `npm version patch` (or `minor`/`major`) before each store upload.
- **iOS**: needs a Mac with Xcode. Uses Swift Package Manager (no CocoaPods). In Xcode set your
  Team under Signing & Capabilities, then Product → Archive for App Store Connect.
  Team under Signing & Capabilities, then Product → Archive for App Store Connect.
- After changing web code, run `npm run cap:sync` (or the scripts above) before building natively.
- Icons and splash screens: edit `assets/emblem.mjs` (or replace the PNGs in `assets/`) and run `npm run icons`.
- On device, game state is stored with Capacitor Preferences as well as localStorage, so the OS
  clearing WebView storage doesn't lose a game in progress.

## Content

- `src/data/` – characters, lines of succession, combat table, attributions.
- `src/logic/` – config rules (ported from the BSGRulebook option logic), loyalty deck, setup checklist, line-up checks.
- `src/content/rulebook.md` – copy of `BSGRulebook/rulebook.md`; its images are in `public/rulebook/images/`.

## Assets

Original artwork and reference documents are kept locally and are **not in git** (large and copyrighted):

```
assets/
  source/
    board.png            main game board (ship icons are cut from its combat table)
    standees/            standee-<name>.png character standees
    icons/               Cylon activation, Skill Check Ability and Centurion icons (from the rulebook)
    qr/                  token and icon images extracted from the Complete BSG Quick Reference v2.0
    raider-render.webp   Cylon Raider renders (the three-quarter view is used in the app icon)
  reference/             Combined Rulebook v1.0 and v2.0, Complete BSG Quick Reference v2.0 (PDF)
```

The Combined Rulebook PDFs come from [BoardGameGeek](https://boardgamegeek.com/filepage/68433/battlestar-galactica-combined-rule-book);
v2.0 is the reference used to check the app's rules. The images in `assets/source/qr/` were extracted from the
Quick Reference PDF with PyMuPDF (image plus its transparency mask).

The scripts next to them turn these into the small files the app uses (committed):

| Script | Output |
| --- | --- |
| `node assets/convert-standees.mjs` | `src/assets/characters/<id>.webp` |
| `node assets/extract-ship-icons.mjs` | `src/assets/ships/<id>.webp` |
| `node assets/extract-activation-icons.mjs` | `src/assets/icons/*.webp`, `src/assets/ships/centurion.webp` |
| `node assets/build-qr-icons.mjs` | `src/assets/tokens/*.webp` (damage/trauma tokens, Activate Viper, Occupation Forces, civilian ship) |
| `node assets/theme-rulebook-images.mjs` | rulebook images in `public/rulebook/images/` (reads `../BSGRulebook/images`) |
| `node assets/raider-render.mjs` | `assets/raider-render.png` – the raider cut out of `assets/source/raider-render.webp` |
| `node assets/raider-flat.mjs` | `assets/raider-flat.png` – that raider simplified to the crest's flat cream/olive style |
| `npm run icons` | native app icons and splash screens (from `assets/emblem.mjs`, uses the flat raider) |

## Store graphics

`npm run build && node assets/store-graphics.mjs` renders the Google Play images into `store/google-play/`:
six phone screenshots (1080×1920, captured from the real app in headless Chrome with a sample game) and the
feature graphic (1024×500). All are 24-bit PNGs without transparency, as Play requires.

## Licences

`npm run build` writes `dist/third-party-licenses.txt` with the full licence text of every package bundled
in the app (see `licenses-plugin.ts`); it is shown under Rules → About & attributions.
