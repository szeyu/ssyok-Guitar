# <Title> (<artist>), from the chart the user supplied: <where it came from>. One bar per line.
# Copy to app/songs/src/<slug>.py, set the fields below, replace the bars, run: python3 app/songs/src/<slug>.py
# Write down here anything the format could not say and how it was approximated; it goes in the report.
import json
from pathlib import Path

SLUG = 'template-example'          # the file is app/songs/<SLUG>.json
SONG = {'title': 'Template example', 'bpm': 90, 'capo': 0, 'beats': 3}   # add 'compound': True for 6/8
CHORDS = {}                        # own voicings: {'Bm': [{'name': ..., 'frets': [...6], 'fingers': [...6], 'tip': ...}]}

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

# ---- the bars, in playing order, one call per bar ----
bar('C',   pluck='5 3 2 1 2 3', section='Intro')
bar('G',   strum='D.DUDU', section='Verse')
bar('Am F', strum='D.DUDU')
bar('C',   strum='D.....')

root = next(p for p in Path(__file__).resolve().parents if (p / 'app/songs/index.json').exists())
out = root / 'app/songs' / f'{SLUG}.json'
# Written by hand rather than json.dump so the file holds one bar per line.
head = ''.join(f' {json.dumps(k)}: {json.dumps(v)},\n' for k, v in SONG.items())
if CHORDS: head += f' "chords": {json.dumps(CHORDS)},\n'
out.write_text('{\n' + head + ' "bars": [\n' + ',\n'.join('  ' + json.dumps(b) for b in bars) + '\n ]\n}\n')
print(f'{out.relative_to(root)}: {len(bars)} bars')
