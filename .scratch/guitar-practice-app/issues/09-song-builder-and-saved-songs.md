# 09: Song builder and saved songs

**What to build:** Add a song from the library's add card, or Edit song from the song screen, to open the builder:
- set the title, tempo, capo and beats in a bar
- add bars one at a time, with a chord and strokes per slot, switching between strummed and picked
- paste lyrics and fit them to the song's sections, or place them every N bars
- paste a whole song file instead

Errors name the bar and what is wrong. Mixed and multi-chord bars are edited as text. Songs added in the browser persist between visits, and their cards have a two-step Remove. Whole song opens the sheet: every bar as a card grouped by section, with a raw-data view. Each song remembers its fingering picks, capo and last bar, and the song screen offers "Back to bar N".

**Blocked by:** 03 (Song screen)

**Status:** done

- [x] A song built in the builder plays, persists after reload, and can be removed with two clicks
- [x] A pasted song file with errors lists each error by bar and is not saved
- [x] Pasted lyrics are fitted to sections: headings or blank lines split blocks; intros and instrumentals are skipped
- [x] Fingering, capo and last bar come back after reload
- [x] Tests cover the storage logic that needs no browser

## Comments

Done in c87f3b2, with review fixes after.

- Storage keys: `guitar.songs` (the saved songs) and `guitar.memory.<title>` (each song's picks, capo and last bar).
- Editing a folder song saves a browser copy in its place (its `source` names the folder song, so a renamed copy stays put). Remove restores the folder version and keeps its memory; only a song added in the browser loses its memory on Remove.
- Renaming a song moves its memory to the new title.
- Unsaved drafts are lost on Esc or reload.
- The sheet leaves out the prototype's Copy and Download.
