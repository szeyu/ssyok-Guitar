# Happy Birthday (traditional), from the chord chart the user supplied (screenshot from a chord site). One bar per line.
# Guitar part alone, no melody. Capo 1 (sounds in Db), C-family shapes. 3/4, 90 bpm, strum D . D U D U.
# Approximations:
# - Pickup "Hap-py" (two eighths on beat 3) is a full bar of rests: the chart puts no chord over it, so the guitar is silent.
# - The "Happy" pickups before lines 2-4 sit on beat 3 of the bar before, under that bar's chord and strum.
# - Last line: C on "Birth-day" (beats 1-2), G7 on "to" (beat 3), written "C C G7".
# - Final C is one down-stroke left to ring for the bar.
import json
from pathlib import Path

SLUG = 'happy-birthday'
SONG = {'title': 'Happy Birthday', 'bpm': 90, 'capo': 1, 'beats': 3}
CHORDS = {'G7': [{'name': 'Open', 'frets': [3, 2, 0, 0, 0, 1], 'fingers': [3, 2, 0, 0, 0, 1],
                  'tip': 'G shape with finger 1 on the 1st fret of the high e string.'}]}

SLOTS = SONG.get('beats', 4) * 2
FIELDS = ('strum', 'pluck', 'section', 'lyric', 'syllables', 'tune')   # a bar's optional fields, in file order
SLOTTED = {'pluck', 'syllables', 'tune'}                               # space-separated, one entry per slot
bars = []

# Only slot counts are checked here; validateSong and the test catch the rest and name the bar.
def bar(chord, **fields):
    where = f'bar {len(bars) + 1}'
    for name, value in fields.items():
        assert name in FIELDS, f'{where}: unknown field {name!r}'   # a typo would drop the field silently
        if name not in SLOTTED | {'strum'}: continue
        count = len(value) if name == 'strum' else len(value.split())
        assert count == SLOTS, f'{where}: {name} {value!r} has {count} slots, not {SLOTS}'
    bars.append({'chord': chord, **{name: fields[name] for name in FIELDS if fields.get(name)}})

P = 'D.DUDU'
# ---- the bars, in playing order, one call per bar ----
bar('C',       strum='......', section='Song', syllables='. . . . Hap- py')   # pickup, guitar silent
bar('C',       strum=P, syllables='Birth- . day . to .')
bar('G7',      strum=P, syllables='You . . . Hap- py')
bar('G7',      strum=P, syllables='Birth- . day . to .')
bar('C',       strum=P, syllables='You . . . Hap- py')
bar('C',       strum=P, syllables='Birth- . day . dear .')
bar('F',       strum=P, syllables='-NAME- . . . Hap- py')
bar('C C G7',  strum=P, syllables='Birth- . day . to .')
bar('C',       strum='D.....', syllables='You . . . . .')                      # let ring

root = next(p for p in Path(__file__).resolve().parents if (p / 'app/songs/index.json').exists())
out = root / 'app/songs' / f'{SLUG}.json'
# Written by hand rather than json.dump so the file holds one bar per line.
head = ''.join(f' {json.dumps(k)}: {json.dumps(v)},\n' for k, v in SONG.items())
if CHORDS: head += f' "chords": {json.dumps(CHORDS)},\n'
out.write_text('{\n' + head + ' "bars": [\n' + ',\n'.join('  ' + json.dumps(b) for b in bars) + '\n ]\n}\n')
print(f'{out.relative_to(root)}: {len(bars)} bars')
