# App Store listing – BSG Companion

Copy each block into App Store Connect. Character limits are Apple's; counts are checked by
`node store/check-listing.mjs`.

## App information

**Name** (30)
```
BSG Companion
```

**Subtitle** (30)
```
Setup, titles & rules helper
```

**Category**
- Primary: Reference
- Secondary: Entertainment

**Bundle ID:** `net.takras.bsg`

**Copyright**
```
2026 takras
```
(Use your full name or company name instead of "takras" if you prefer – Apple shows it as "© 2026 …".)

## URLs

| Field | URL |
| --- | --- |
| Support URL (required) | https://bsg.takras.net/support.html |
| Marketing URL (optional) | https://bsg.takras.net/ |
| Privacy Policy URL (required) | https://bsg.takras.net/privacy.html |

## Version information

**Promotional text** (170 – can be changed any time without a new review)
```
Keep your board game night moving: the exact Loyalty deck, who holds every title, combat rolls, Crisis icons and executions – offline, right at the table.
```

**Description** (4000)
```
BSG Companion is a free, unofficial companion for Battlestar Galactica: The Board Game. It keeps the fiddly parts of the game at your fingertips, so the table spends less time searching the rulebook and more time accusing each other of being Cylons.

SET UP ANY GAME
• Choose the expansions (Pegasus, Exodus, Daybreak), modules, ending and official variants.
• Enter the characters your table picked, in seat order – the app checks the line-up against the selection rules.
• Get the exact Loyalty deck for your player count and options, who receives which cards, and a checklist of board and component setup.

TRACK EVERY TITLE
• See who holds President, Admiral and CAG at a glance.
• Mark players as in the Brig or revealed Cylons – titles pass down the lines of succession automatically, following the rules.
• Full lines of succession for every character, with the next in line highlighted.

EVERY ROLL AT A GLANCE
• The complete combat table: which rolls damage or destroy each ship.
• Tap a ship for die strips, notes and damage tokens – basestar, Galactica and Pegasus.
• How to activate a viper, nukes, Scar, Mark VII vipers and assault raptors when their expansions are in play.

KNOW EVERY CRISIS ICON
• What each Cylon activation icon does, step by step.
• When ships go to the Cylon Fleet board instead of the main board, and how the pursuit track works.
• Reckless skill checks, the jump track and New Caprica activations.

EXECUTIONS MADE EASY
• A step-by-step walkthrough: choose whether the player is human or Cylon and the app tells you what happens next.
• Pick the replacement character from those still allowed; titles are redistributed for you.

RULES ON DEMAND
• Quick rules for the things every table looks up: revealing as a Cylon, a Cylon player's turn, the Sleeper Agent phase, the Brig, Miracle tokens, Mutiny cards, trauma tokens and more.
• The full community unified rulebook, filtered to your expansions and searchable.

MADE FOR THE TABLE
• Works offline once installed.
• Your game is saved on your device and survives restarts. No account, no ads, no tracking.
• Two console themes inspired by the ship's displays.

BSG Companion is a fan project. It is not affiliated with, endorsed or sponsored by Fantasy Flight Games, Universal or NBCUniversal. You need a copy of the board game to play.
```

**Keywords** (100, comma-separated, no spaces needed)
```
board game,tabletop,companion,helper,loyalty,cylon,succession,crisis,rules,setup,viper,raider,co-op
```

**What's New in This Version**
```
First release: setup and Loyalty deck helper, title succession tracking, combat table, Crisis icon guide, execution walkthrough, quick rules and the searchable rulebook.
```

## Screenshots

Upload in this order – the first three appear in App Store search results.

| Slot | Files |
| --- | --- |
| iPhone 6.1" / 6.3" (1179 × 2556) | `store/app-store/iphone-6.3/iphone-01-setup.jpg` … `iphone-06-rules.jpg` |
| iPad 12.9" / 13" (2048 × 2732) | `store/app-store/ipad-13/ipad-01-setup.jpg` … `ipad-06-rules.jpg` |

Both `.jpg` and `.png` versions exist; all have an embedded sRGB colour profile and no transparency. If
App Store Connect says "Your file couldn't be saved", try the `.jpg` files first.

Regenerate with `npm run build && node assets/store-graphics.mjs`.

## Creative assets (product page header and search results)

From Apple's creative asset specifications (images without alpha). Shown from iOS/iPadOS 27.

| Placement | File | Size |
| --- | --- | --- |
| Product page header (21:9) | `store/app-store/creative/header-21x9-3840x1646.png` | 3840 × 1646 |
| Search results (3:2) | `store/app-store/creative/search-results-3x2-3840x2560.png` | 3840 × 2560 |
| Header / search results (16:9) | `store/app-store/creative/universal-16x9-5244x2950.png` | 5244 × 2950 |

Key content is centred so device-specific cropping won't cut it. Without a search-results asset, App Store
search shows the first screenshots instead.

## App Review information

**Sign-in required:** No.

**Notes for the reviewer**
```
BSG Companion is a free reference/helper app for players of the physical board game "Battlestar Galactica: The Board Game". No account or sign-in is needed; all features are available immediately. The app makes no network requests and stores the current game only on the device.

To try it: on the Setup tab, turn on any expansions, tap 3–6 characters and press "Start game", then use the Titles, Combat, Crisis, Execute and Rules tabs.

The app is an unofficial fan project and states this in the app (Rules → About & attributions) and in its description.
```

## Age rating

Answer **None** to all content questions → **4+**. (The rules text mentions in-game "executions" of characters as a game mechanic, with no depiction.)

## App Privacy

**Data collection:** "No, we do not collect data from this app."
