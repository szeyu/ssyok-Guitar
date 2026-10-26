# <Title> (<artist>), from the chart the user supplied: <where it came from>. One bar per line.
# Copy to app/songs/src/<slug>.py, set the fields below, replace the bars, run: python3 app/songs/src/<slug>.py
# Write down here anything the format could not say and how it was approximated; it goes in the report.
import json
from pathlib import Path

SLUG = 'template-example'          # the file is app/songs/<SLUG>.json
SONG = {'title': 'Template example', 'bpm': 90, 'capo': 0, 'beats': 3}   # add 'compound': True for 6/8
CHORDS = {}                        # own voicings: {'Bm': [{'name': ..., 'frets': [...6], 'fingers': [...6], 'tip': ...}]}

SLOTS = SONG.get('beats', 4) * 2
bars = []

def bar(chord, strum=None, pluck=None, section=None, lyric=None, syllables=None, tune=None):
    at = f'bar {len(bars) + 1}'
    assert strum or pluck, f'{at}: needs a strum or a pluck'
    if strum:
        assert len(strum) == SLOTS, f'{at}: strum {strum!r} has {len(strum)} slots, not {SLOTS}'
        if not SONG.get('compound'):   # the pendulum: D on the numbers, U on the "&"
            assert all(c != 'UD'[i % 2] for i, c in enumerate(strum)), f'{at}: strum {strum!r} breaks the pendulum'
    for name, value in (('pluck', pluck), ('syllables', syllables), ('tune', tune)):
        if value: assert len(value.split()) == SLOTS, f'{at}: {name} {value!r} has {len(value.split())} entries, not {SLOTS}'
    assert SLOTS % len(chord.split()) == 0, f'{at}: {len(chord.split())} chords cannot split {SLOTS} slots evenly'
    b = {'chord': chord}
    for k, v in (('strum', strum), ('pluck', pluck), ('section', section), ('lyric', lyric), ('syllables', syllables), ('tune', tune)):
        if v: b[k] = v
    bars.append(b)

# ---- the bars, in playing order, one call per bar ----
bar('C',   pluck='5 3 2 1 2 3', section='Intro')
bar('G',   strum='D.DUDU', section='Verse')
bar('Am F', strum='D.DUDU')
bar('C',   strum='D.....')

root = next(p for p in Path(__file__).resolve().parents if (p / 'app/songs/index.json').exists())
out = root / 'app/songs' / f'{SLUG}.json'
head = ''.join(f' {json.dumps(k)}: {json.dumps(v)},\n' for k, v in SONG.items())
if CHORDS: head += f' "chords": {json.dumps(CHORDS)},\n'
out.write_text('{\n' + head + ' "bars": [\n' + ',\n'.join('  ' + json.dumps(b) for b in bars) + '\n ]\n}\n')
print(f'{out.relative_to(root)}: {len(bars)} bars')
