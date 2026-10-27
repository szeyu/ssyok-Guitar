# Feliz Navidad (José Feliciano), from the chord chart the user supplied (screenshot). Guitar part only, no melody. One bar per line.
# Key G, no capo, 4/4, 150 bpm. Strum D U x U D U x U (chucks on 2 and 4).
# Run: python3 app/songs/src/feliz-navidad.py
# Approximations (for the report):
# - Bar lines are mine, as the song is sung: each half of a verse or chorus is 8 bars, the first a pickup.
# - "N.C." pickups ("Feliz Navi-", "I wanna wish you a") are a silent bar (strum all '.'), shown under the C that follows so the hand can get ready.
# - Each chart change sits on the downbeat of the bar it starts: C/G on "dad", G/C/D on "Merry", D on "año", D7 on "bottom".
#   The [D] after "dad," and the [D]/[Em] at the start of chorus lines take the whole next bar, under the next pickup words.
# - The final G "heart" is one down strum left to ring for the bar.
import json
from pathlib import Path

SLUG = 'feliz-navidad'
SONG = {'title': 'Feliz Navidad (José Feliciano)', 'bpm': 150, 'capo': 0, 'beats': 4}
CHORDS = {   # G, C, D match the library's first shapes; the library's first Em uses fingers 2-3, and it has no D7
    'Em': [{'name': 'Open, fingers 1-2', 'frets': [0, 2, 2, 0, 0, 0], 'fingers': [0, 1, 2, 0, 0, 0], 'tip': 'Fingers 1 and 2, as the chart shows. Leaves finger 3 free to land on C next.'}],
    'D7': [{'name': 'Open', 'frets': [-1, -1, 0, 2, 1, 2], 'fingers': [0, 0, 0, 2, 1, 3], 'tip': 'Strum only the top four strings.'}],
}

SLOTS = SONG.get('beats', 4) * 2
FIELDS = ('strum', 'pluck', 'section', 'lyric', 'syllables', 'tune')
SLOTTED = {'pluck', 'syllables', 'tune'}
bars = []

def bar(chord, **fields):
    where = f'bar {len(bars) + 1}'
    for name, value in fields.items():
        assert name in FIELDS, f'{where}: unknown field {name!r}'
        if name not in SLOTTED | {'strum'}: continue
        count = len(value) if name == 'strum' else len(value.split())
        assert count == SLOTS, f'{where}: {name} {value!r} has {count} slots, not {SLOTS}'
    bars.append({'chord': chord, **{name: fields[name] for name in FIELDS if fields.get(name)}})

S = 'DUxUDUxU'   # D U chuck U D U chuck U
NC = '........'  # N.C.: the guitar is silent

def verse(name):
    for half in (0, 1):
        bar('C', strum=NC, section=name if half == 0 else None, lyric='Feliz Navi-')
        bar('C', strum=S, lyric='dad,')
        bar('D', strum=S, lyric='Feliz Navi-')
        bar('G', strum=S, lyric='dad,')
        bar('G', strum=S, lyric='Feliz Navi-')
        bar('C', strum=S, lyric='dad, próspero')
        bar('D', strum=S, lyric='año y feli-')
        bar('G', strum=S, lyric='cidad.')

def chorus(last=False):
    for half in (0, 1):
        bar('C',  strum=NC, section='Chorus' if half == 0 else None, lyric='I wanna wish you a')
        bar('C',  strum=S, lyric='Merry Christmas,')
        bar('D',  strum=S, lyric='I wanna wish you a')
        bar('G',  strum=S, lyric='Merry Christmas,')
        bar('Em', strum=S, lyric='I wanna wish you a')
        bar('C',  strum=S, lyric='Merry Christmas, from the')
        bar('D7', strum=S, lyric='bottom of my')
        bar('G',  strum='D.......' if last and half else S, lyric='heart.')

# ---- Intro: G C D G, twice ----
bar('G', strum=S, section='Intro')
bar('C', strum=S)
bar('D', strum=S)
bar('G', strum=S)
bar('G', strum=S)
bar('C', strum=S)
bar('D', strum=S)
bar('G', strum=S)

verse('Verse 1')
chorus()
verse('Verse 2')
chorus(last=True)

root = next(p for p in Path(__file__).resolve().parents if (p / 'app/songs/index.json').exists())
out = root / 'app/songs' / f'{SLUG}.json'
head = ''.join(f' {json.dumps(k)}: {json.dumps(v)},\n' for k, v in SONG.items())
if CHORDS: head += f' "chords": {json.dumps(CHORDS)},\n'
out.write_text('{\n' + head + ' "bars": [\n' + ',\n'.join('  ' + json.dumps(b) for b in bars) + '\n ]\n}\n')
print(f'{out.relative_to(root)}: {len(bars)} bars')
