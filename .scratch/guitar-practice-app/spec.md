# Spec: Guitar practice app

Status: ready-for-agent

## Problem Statement

I'm learning guitar on my own and want to practise real songs the way they are played on the record, not a simplified sing-along version. Chord sheets and tab sites show what to play but not *when*. They don't show how my hands should move, what the strum feels like at speed, or whether I'm in time. Video lessons go at someone else's pace and can't loop the one chord change I keep missing. I need a practice tool that:
- shows both hands playing the actual guitar part bar by bar
- sounds it out
- lets me slow down, loop and drill the hard spots
- tells me whether my strums are landing on time

It's for personal practice. Nothing is sold.

## Solution

A browser app, written fresh in its own folder, with the look and behaviour proven in the prototype. The prototype in `prototype/` stays untouched as the reference. You pick a song from a library and land on its song screen. That screen shows the chords you need, as chord boxes with the song's own voicings, plus the distinct strum patterns, the capo, and three ways to start:
- learn the strum step by step
- play it slowly
- play along

The player shows:
- a 3D fretting-hand view and a 3D strumming-hand view
- a strum lane where strokes fall onto a hit line
- the current and next chord box
- the words under the line
- a section timeline across the top

One clock drives sound, 3D and lane together. You can loop the whole song, one bar, or one chord change, and change the tempo. You tap along with the arrow keys, or let the microphone listen. Each stroke gets a verdict word: Good, Early or Late by so many ms, or wrong direction. At the end, a results card shows your timing score and the bar that gave you the most trouble.

Each song is a file in the songs folder. It charts the recording's guitar part: riffs, passing chords, the chart's voicings and the real strum. A song can have a second version with the melody, for example a fingerstyle tab. New songs can be added in an in-app builder or pasted as a song file. The look is the Hum design: cream card stock, blue-black ink, one pear accent, and the 3D scene as a dark window.

## User Stories

1. As a learner, I want a library of songs as cards, so that I can pick what to practise.
2. As a learner, I want each song card to show its tempo, capo, time signature, bar count, chords and main strum, so that I can judge how hard it is before opening it.
3. As a learner, I want a hint that songs with few chords and no capo are the easiest start, so that I don't pick something beyond me.
4. As a learner, I want the song screen to list every chord the song uses as a chord box, so that I can learn the shapes before playing.
5. As a learner, I want chord boxes to show the song's own voicing (e.g. Rock G, Cadd9 with 3-3 on top), so that I play it the way the record does.
6. As a learner, I want finger numbers coloured by finger on every chord box, so that I know which finger goes where.
7. As a learner, I want to see when a chord has other ways to play it, and pick one, so that I can choose a fingering that suits my hand.
8. As a learner, I want a "Suggest easiest fingerings" button that picks the shapes that move my fingers least between the song's chords, avoiding barre shapes, so that changes are easier.
9. As a learner, I want the fingering I picked remembered for that song, so that I don't redo it every session.
10. As a learner, I want the song screen to show each distinct strum pattern and how many bars use it, with the one covering most of the song marked, so that I know which pattern matters most.
11. As a learner, I want to set the capo from the song screen, with a note saying which fret sounds like the record, so that I play in the right key.
12. As a learner, I want "Learn the strum" to teach the song's strum in steps over the first chords, slowly, so that I build it up gradually.
13. As a learner, I want "Play it slowly" to run the whole song at 70% tempo, so that I can get through it before speeding up.
14. As a learner, I want "Play along" at full tempo as the main action, so that I can play with the song as recorded.
15. As a learner, I want to come back to the bar I left off at, so that a break doesn't send me back to the start.
16. As a learner, I want to see the whole song on one page as bar cards grouped by section, so that I can read the structure at a glance.
17. As a learner, I want a 3D view of the fretting hand that moves finger by finger into each chord shape, so that I can copy the motion.
18. As a learner, I want fingers and their dots to land a moment before the chord sounds, so that I see the change coming.
19. As a learner, I want strings the chord skips marked as not played, so that I don't hit the wrong bass string.
20. As a learner, I want riff notes that use their own fret marked on the 3D neck, so that I can follow single-note lines.
21. As a learner, I want a 3D view of the strumming hand with arrows for each stroke, solid for a hit and hollow for a pass, so that I can see the down-up motion.
22. As a learner, I want struck strings to glow and shake, so that I can see which strings a stroke covers.
23. As a learner, I want a choice between the player's view and the audience's view of the guitar, so that the picture matches how I look at my own guitar.
24. As a learner, I want to hide the 3D hand, so that I can see the strings and frets clearly.
25. As a learner, I want a strum lane where strokes fall towards a hit line, so that I can read ahead like a rhythm game.
26. As a learner, I want each stroke tile to cover only the strings the chord plays, so that I can see skipped bass strings.
27. As a learner, I want fret numbers on the first stroke of each chord, so that I can read the shape off the lane.
28. As a learner, I want accented strokes, chucks, passes and picked notes drawn differently in the lane, so that I can read the dynamics.
29. As a learner, I want down-strokes and up-strokes in different colours, so that I can read direction at speed.
30. As a learner, I want the next chord's name to swell as the change approaches, so that changes don't catch me out.
31. As a learner, I want the count on each slot (1 & 2 & … or 1–6 in 6/8) beside the lane, so that I can count along.
32. As a learner, I want the words under the hit line, with the sung part lighting up as it is sung, so that I can sing along if I want.
33. As a learner, I want the next line of words shown below with its chord, so that I can read ahead.
34. As a learner, I want the current and next chord boxes floating over the 3D view, so that I can see both without looking away.
35. As a learner, I want a section timeline across the top that shows where I am and lets me jump to a section, so that I can find the chorus quickly.
36. As a learner, I want a one-bar count-in with big numbers before playback, so that I know when the first stroke lands.
37. As a learner, I want to play and pause with Space, so that I can keep my hands on the guitar.
38. As a learner, I want a tempo slider showing beats per minute (the dotted-quarter pulse in 6/8), so that I can set my own speed.
39. As a learner, I want to loop the whole song, the current bar, or the current chord change, so that I can drill the hard spot.
40. As a learner, I want an option that adds 5 bpm each time a loop comes round, so that I build up speed without touching the slider.
41. As a learner, I want "Strum steps" in the player to step through the strum one stage at a time, with a stepper showing the stage, so that I can drill the strum alone.
42. As a learner, I want strum steps to follow the song's meter (4/4, 3/4 or 6/8), so that the drill matches the song.
43. As a learner, I want to tap the down and up arrow keys along with my strum and get a verdict on each stroke, so that I know if I'm in time.
44. As a learner, I want verdicts that say Good, Early or Late by so many milliseconds, "Down here" or "Up here", and "No strum here" or "Rest here", so that I know exactly what to fix.
45. As a learner, I want the app to listen through the microphone and judge my real strums, so that I don't have to tap keys.
46. As a learner, I want a note to use headphones when listening, so that the app's own sound isn't judged as mine.
47. As a learner, I want a tuner that shows how far each string is from its pitch, so that I start in tune.
48. As a learner, I want a results card at the end with my on-time percentage and the bar that gave me the most trouble, so that I know what to practise next.
49. As a learner, I want the results card to offer Play again, A bit slower, Practise that bar, and Songs, so that the next step is one click.
50. As a learner, I want the song's sound to include strums, picked notes, chucks and the beat click, so that I can follow by ear.
51. As a learner, I want songs that have a melody to play the tune over the chords when Melody is on, so that I hear how the words fit.
52. As a learner, I want two versions of a song when one exists, the guitar part alone and a version with the melody, so that I can practise either.
53. As a learner, I want the app to never invent a melody a song doesn't have, so that what I learn is right.
54. As a song author, I want to add a song bar by bar in a builder: chord, strokes, picked or strummed, beats in a bar, capo and tempo, so that I can chart songs without writing JSON.
55. As a song author, I want to paste a song file instead, so that I can add songs I've charted elsewhere.
56. As a song author, I want to paste a whole song's lyrics and have them fitted to its sections, so that I don't place every line by hand.
57. As a song author, I want clear, specific errors when a song file is invalid, naming the bar and what's wrong, so that I can fix it.
58. As a song author, I want songs from the songs folder listed in order from its index, so that the library order is mine to set.
59. As a song author, I want songs I add in the browser kept between visits, and removable with a two-step Remove, so that I can tidy up without deleting by accident.
60. As a song author, I want to write a bar with more than one chord (e.g. "C E7"), split evenly, so that passing chords are charted.
61. As a song author, I want to write riff notes as string and fret (e.g. 2:3, several joined with +), so that intro riffs and fingerstyle parts are charted.
62. As a song author, I want a mixed bar that strums where the strum hits and picks elsewhere, so that I can chart patterns that mix both.
63. As a song author, I want a song to define its own chord voicings that override the library's, so that the song plays the chart's shapes.
64. As a song author, I want to mark sections, plain lyrics per bar, or timed syllables per slot, so that words land where they're sung.
65. As a song author, I want to set 6/8 (compound) time, so that songs like Perfect count in six.
66. As a learner, I want slash chords to transpose their bass correctly with the capo, so that the sounding chord names are right.
67. As a learner on a slow computer, I want the 3D views to drop resolution when frames are slow, and nothing to render when idle or off the player, so that the app stays responsive.
68. As a learner, I want Esc to close the open menu, picker or song screen, so that I can back out with the keyboard.
69. As a keyboard user, I want every control to show a visible focus ring, so that I can see where I am.
70. As a learner who prefers less motion, I want animations turned off when my system asks for reduced motion, so that the app is comfortable to use.
71. As a learner on a narrow window, I want the stage to stack and the transport to wrap, so that I can still practise on a small screen.
72. As a learner, I want the Hum look throughout (card-stock buttons that sink when pressed, cream paper, blue-black ink, one pear accent), so that the app feels calm and tactile.
73. As a developer, I want URL flags that open any screen or state directly (song, beat, capo, drill, screens, results, self-test), so that I can screenshot and check a state without clicking through.
74. As a song author working with an agent, I want a song-writing skill in the repo that teaches the agent the format and my charting rules, so that I can hand it a chart or tab screenshot and get a correct song file back without explaining the rules again.
75. As a song author, I want the agent to tell me what the format could not express and how it was approximated, so that I know where the app differs from the tab.

## Implementation Decisions

**Language and layout**
- **Language:** plain JavaScript, as ES modules, with no build step and no TypeScript. The browser loads the modules directly, and three.js comes in through an import map pinned to an exact version.
- **Tests:** they run with Node's built-in test runner. The app has no npm dependencies, and the test tooling adds none.
- **Separate folders:** the app lives in its own top-level folder, beside the prototype, not inside it. The prototype is never imported or edited.
- **One concern per file:** each folder below is one concern, and each file one module. No file mixes pure song logic with the DOM, audio or 3D.

```
app/
  index.html            the page shell: markup for the screens, loads src/main.js
  styles/
    tokens.css          the Hum design tokens: colour, type, radius, shadow
    app.css             the layout and components, using only tokens
  src/
    main.js             start-up: load songs, wire screens, URL flags
    engine/             the song engine (pure, no DOM, audio or 3D; the test seam)
      song.js           validate a song file; slot queries (bar, chord, stroke, count, syllable, note)
      chords.js         the chord library, voicing choice, easiest-fingering suggestion
      practice.js       capo and sounding notes, loops, strum steps, strum summary
      hand.js           fretting-hand timing between chords, what the strumming hand plays at a slot
      judge.js          tap verdicts, per-bar misses, the results summary
    audio/
      clock.js          the one clock and the look-ahead scheduler
      synth.js          the string model, strums, chucks, the click, the melody voice
      mic.js            microphone access, strum onsets, the tuner
      pitch.js          pitch detection (pure, tested)
    views/
      lane.js           the strum lane canvas
      chordbox.js       chord box drawing
      scene/            the 3D guitar, the hand and its poses, the two cameras
    screens/            library, song screen, player, results, whole-song sheet, builder
    store.js            loading songs from the folder; browser storage for added songs and per-song settings
  songs/
    index.json          the library order
    *.json              one song file each
    src/                the python scripts that write the hand-charted songs, one bar per line
test/                   engine, pitch, and "every song file validates" tests
tools/                  the screenshot check of every screen state
skills/                 the project's own agent skills, kept apart from installed ones in .agents/ and .claude/
  write-song/
    SKILL.md            how an agent charts a song into a song file (below)
    reference.md        the song file format, field by field
    template.py         a starting script that writes a song one bar per line
prototype/              the reference, unchanged
```

**The song-writing skill** teaches an agent to add or fix a song without being walked through it. It grows out of the prototype's song guide and the rules the user set while songs were being charted:
- Chart the recording's guitar part (intro riffs, passing chords, the chart's voicings, the real strum), not a simplified sing-along accompaniment.
- Work from a chart or tab the user supplies (an Ultimate Guitar screenshot, a fingerstyle tab). Never guess a melody; if none is given, ask for a tab.
- Write the song file with a Python script that adds one bar per line, kept in the songs folder's script folder, then run it.
- A song can have two versions: the guitar part alone, and one with the melody (for example a fingerstyle tab). They are separate song files.
- Set the capo the chart says, and use the song's own `chords` block for voicings the library lacks.
- Place lyrics only where the user supplied them.
- Run the song-file test before handing back. Name anything the format could not say (sixteenths, slides, bends, a ritardando) and how it was approximated.
- Add the song to the library index.

**Modules**
- **Song engine** (the one deep module, and the test seam). A pure module with no DOM, audio or 3D. It takes a song file plus practice settings (capo, loop, strum step, chosen fingerings) and answers questions about it:
  - **Validate:** a song file gives a list of human-readable errors, empty when valid.
  - **Slot queries:** for any slot, it returns the bar, the chord sounding there (multi-chord bars split evenly), the stroke (direction, hit, pass, accent, chuck, picked strings with fret overrides), the count label, the syllable sung, and the melody note.
  - **Sounding notes:** the frets and pitches for a stroke under the capo, including slash-chord bass transposition.
  - **Loops:** whole song, one bar or one chord change, wrapping correctly at the song's end.
  - **Strum steps:** the step sets for each meter, mapped onto the song's first bars.
  - **Summaries:** the distinct strum patterns with their bar counts and the "most of the song" pattern; the chord list; the per-chord voicing chosen (picked, then the song's preference, then the library's first); the easiest-fingering suggestion.
  - **Judging:** a tap time and direction against the scheduled strokes gives a verdict (good, early or late with ms, wrong direction, no stroke here), and per-bar misses accumulate into a results summary (on-time percentage, worst bar).
- **Chord library:** the built-in chord shapes, each with a name, frets, fingers, a tip, and a hard (barre) flag. A song's own `chords` block adds to or overrides it for that song.
- **Song loading and storage:**
  - Songs listed in the songs folder's index are fetched and validated, and a file that fails is skipped with a note naming it.
  - Browser-added songs are kept in local storage.
  - Per-song settings (fingering picks, capo, last bar) are remembered.
- **Practice clock and sound:** one audio clock advances the beat. Notes are scheduled a short window ahead. Strums and plucks come from a string model; there are chucks, a click on the pulse, and an optional melody voice. A one-bar count-in comes first. The 3D and the lane read the same beat.
- **Views:**
  - 3D fretting view and 3D strumming view (three.js; a skinned hand posed per chord shape; arrows, string glow and riff markers).
  - The strum lane (canvas).
  - The floating chord box (canvas, cached per chord pair).
  - All of them read colours and fonts from the design tokens; no colour is hard-coded in drawing code.
- **Screens:** library, song screen, player (top bar with timeline or stepper, Tools menu, stage, transport), results card, whole-song sheet, song builder dialog.
  - One function shows a screen.
  - Nothing renders behind the library or the song screen.
- **Microphone:** a tuner (pitch detection on the mic signal) and strum-onset detection that feeds the same judging as the arrow keys. The latency offset is fixed for now.
- **Design system:** the Hum tokens (paper, ink, pear accent, link blue, mint and coral, lane kraft, dark scene) declared once at the root, and card-stock buttons with a sinking press. The font is Chillax. Up and down strokes keep distinct colours, and text strokes on paper use ink, not pear.

**Song file format** (decided in the prototype; `skills/write-song/` is the authoring guide):
- Top level:
  - `title`, `bpm` (40–200: quarter notes a minute, or in 6/8 the dotted-quarter pulse, which the app multiplies by 1.5), optional `capo` (0–7), `beats` (3 or 4)
  - `compound: true` for 6/8 (needs `beats: 3`)
  - optional `chords` (name → list of `{name, frets[6], fingers[6], tip}`, thickest string first, -1 = not played)
- Each bar has `chord` (one name, or several separated by spaces, which must divide the bar's slot count) and at least one of these:
  - `strum`: one character per eighth-note slot. `D`/`U` hit, `>` accent, `x` chuck, `.` pass. In simple time the hand is a pendulum: D on the numbers, U on the "&".
  - `pluck`: one entry per slot, separated by spaces. A string number 1–6, digits together for several strings, `string:fret` for an own-fret note joined with `+`, or `.` to rest.
  - Both together make a mixed bar.
- Optional per bar: `section`, `lyric`, `syllables` (one per slot), `tune` (one note with octave per slot, `.` hold, `_` silence).
- Slots are eighth notes: `beats × 2` per bar.

**Behaviour decisions carried over from the prototype**
- "Play it slowly" is 70% of the song tempo.
- Strum steps start at 60 bpm, or the 6/8 equivalent.
- In 6/8 the tempo shown is the dotted-quarter pulse.
- A fingering the user picked beats the song's preferred shape.
- The pixel ratio is capped at 1.5, and quality drops to 0.5 when frames are slow.

## Testing Decisions

- A good test drives the **song engine** through its public questions with a song file and practice settings, and checks the answers: errors, the stroke and chord at a slot, sounding notes, loop wrapping, strum steps, verdicts and results. It never reaches into internal state or drawing code.
- **Modules tested:**
  - The song engine. Tests cover validation, slot queries, multi-chord bars, riff notes and fret overrides, mixed bars, capo and slash-chord transposition, loops at the song's end, strum steps fitting each meter, fingering suggestion avoiding barre shapes, strum-pattern summaries, and judging and results.
  - Pitch detection, as a small extra: synthetic sine tones and the string model must read back their pitch.
- **Every song file** in the songs folder must validate. This guards the hand-charted songs.
- **Prior art:** the prototype's `?selftest`. It has 16 checks: songs validate, bad songs get specific errors, picked and mixed bars, timed lyrics, note pitches, string model in tune, wrong-direction strokes, riff frets, two chords in a bar, strum steps per meter, suggestions avoid barres, and loop wrapping. Each of those becomes a test against the song engine, with synthetic songs written inline.
- **Not unit-tested:** 3D, lane and chord-box drawing, screens, and audio scheduling. They are checked by screenshots of URL-flag states (library, song screen, player mid-song, Tools, results) compared against the Hum mockup, and by ear.

## Out of Scope

- Selling, accounts, sign-in, cloud sync or sharing songs between people.
- Guessing or generating a melody, or auto-transcribing songs from audio.
- Shipping copyrighted lyrics or tabs in the repo beyond what the user charts for personal use.
- A mobile or desktop app-store build.
- Microphone latency calibration; the offset stays fixed.
- Sixteenth-note slots, slides and bends in the song format. Today they are approximated; see Further Notes.
- Editing multi-chord or mixed bars cell by cell in the builder. They stay editable as text.

## Further Notes

- **The prototype is the reference** for look and behaviour (`prototype/layout-prototype.html`, served from the repo root). The app copies its ideas, not its file: the prototype is one 1,500-line page, and the app splits that into the modules above. The song files and their scripts move into the app's songs folder. The prototype keeps its own copies. Design mockups are in `prototype/designs/`; Hum is the chosen one.
- **Charting rule:** chart the recording's guitar part, not a simplified accompaniment. Write song files bar by bar with a script, one bar per line (examples in `prototype/songs/src/`).
- **Known gap, sixteenth notes:** fingerstyle tabs with sixteenths (the capo-5 Always With Me) are written as two app bars per tab bar at double tempo. It sounds right, but the count and bar numbers read double. A sixteenth grid in the format is the clean fix and a likely next spec.
- **Known gap, high frets:** the fretting camera only frames the first few frets, so high-position notes (up to fret 15 in the D-major Always With Me) are hard to see. The camera should follow the hand up the neck.
- **Known gap, rendering:** two WebGL renderers run side by side. Merging them into one is the next step if lag persists.
