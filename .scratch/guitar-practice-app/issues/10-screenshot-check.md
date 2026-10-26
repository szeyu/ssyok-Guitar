# 10: Screenshot check

**What to build:** One command opens the app's URL-flag states in headless Chrome and saves a screenshot of each beside the Hum mockup, for side-by-side review: library, song screen, mid-song player, Tools, results, and the narrow-window layout. It is the visual check other tickets use. Add each state once the ticket building it lands; until then the state is skipped with a note.

**Blocked by:** 01 (App skeleton and library screen)

**Status:** done

- [x] One command writes the screenshots to a folder and prints their paths
- [x] It needs nothing beyond Chrome and Node
- [x] Each later ticket's states are added as they land

## Comments

Done in 9648964, review fixes in the next commit. Run `node tools/screenshots.js`; shots land in `shots/` (git-ignored). Later tickets fill in the skipped states.
