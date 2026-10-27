# Jingle Bells (traditional), from the chord chart the user supplied: a chord-site screenshot. Guitar part only, no melody. One bar per line.
# Run: python3 app/songs/src/jingle-bells.py
# Approximations (for the report):
# - The chart's triplet/swing strum D.U|D..|D.U|D.. is written as straight eighths DUD.DUD. (reference.md: triplets/swing -> nearest straight eighths).
# - Bar lines are mine: 16 bars a verse, 16 a chorus, as the tune is sung. Words sung before a section's first chord sit on the bar before.
# - "Oh!" at each verse end: D7 from beat 3 of the last verse bar ("G D7").
# - Verse 4 "[Am]Take the girls along and [D7]sing": the chart holds Am through "along and", so D7 starts a bar later than in verses 1-3.
# - The final G rings for the last bar (one down strum).
import json
from pathlib import Path

SLUG = 'jingle-bells'
SONG = {'title': 'Jingle Bells', 'bpm': 104, 'capo': 0, 'beats': 4}
CHORDS = {   # the library has no D7 or A7; G, C, Am, D match the library's first shapes
    'D7': [{'name': 'Open', 'frets': [-1, -1, 0, 2, 1, 2], 'fingers': [0, 0, 0, 2, 1, 3], 'tip': 'Strum only the top four strings.'}],
    'A7': [{'name': 'Open', 'frets': [-1, 0, 2, 0, 2, 0], 'fingers': [0, 0, 1, 0, 2, 0], 'tip': 'The A shape with the G string open. Do not strum the low E string.'}],
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

S = 'DUD.DUD.'   # D . U | D . . | D . U | D . . on straight eighths

def chorus(end, last=False):
    bar('G',    strum=S, section='Chorus', lyric='Jingle bells,')
    bar('G',    strum=S, lyric='jingle bells,')
    bar('G C',  strum=S, lyric='jingle all the')
    bar('G',    strum=S, lyric='way!')
    bar('C',    strum=S, lyric='Oh what fun it')
    bar('G',    strum=S, lyric='is to ride in a')
    bar('A7',   strum=S, lyric='one-horse open')
    bar('D7',   strum=S, lyric='sleigh, hey!')
    bar('G',    strum=S, lyric='Jingle bells,')
    bar('G',    strum=S, lyric='jingle bells,')
    bar('G C',  strum=S, lyric='jingle all the')
    bar('G',    strum=S, lyric='way!')
    bar('C',    strum=S, lyric='Oh what fun it')
    bar('G',    strum=S, lyric='is to ride in a')
    bar('D7',   strum=S, lyric='one-horse open')
    bar('G',    strum='D.......' if last else S, lyric=end)

# ---- Verse 1 ----
bar('G',    strum=S, section='Verse 1', lyric='Dashing through the')
bar('G',    strum=S, lyric='snow, in a')
bar('G',    strum=S, lyric='one-horse open')
bar('C',    strum=S, lyric='sleigh,')
bar('Am',   strum=S, lyric="O'er the fields we")
bar('D7',   strum=S, lyric='go,')
bar('D7',   strum=S, lyric='laughing all the')
bar('G',    strum=S, lyric='way.')
bar('G',    strum=S, lyric='Bells on bob-tails')
bar('G',    strum=S, lyric='ring,')
bar('G',    strum=S, lyric='making spirits')
bar('C',    strum=S, lyric='bright, what')
bar('Am',   strum=S, lyric='fun it is to')
bar('D',    strum=S, lyric='ride and sing a')
bar('D7',   strum=S, lyric='sleighing song to-')
bar('G D7', strum=S, lyric='night. Oh!')
chorus('sleigh! A')

# ---- Verse 2 ----
bar('G',    strum=S, section='Verse 2', lyric='day or two a-')
bar('G',    strum=S, lyric='go, I')
bar('G',    strum=S, lyric="thought I'd take a")
bar('C',    strum=S, lyric='ride, and')
bar('Am',   strum=S, lyric='soon Miss Fanny')
bar('D7',   strum=S, lyric='Bright was')
bar('D7',   strum=S, lyric='seated by my')
bar('G',    strum=S, lyric='side. The')
bar('G',    strum=S, lyric='horse was lean and')
bar('G',    strum=S, lyric='lank, mis-')
bar('G',    strum=S, lyric='fortune seemed his')
bar('C',    strum=S, lyric='lot. We')
bar('Am',   strum=S, lyric='ran into a')
bar('D',    strum=S, lyric='drifted bank and')
bar('D7',   strum=S, lyric='there we got up-')
bar('G D7', strum=S, lyric='sot. Oh!')
chorus('sleigh! A')

# ---- Verse 3 ----
bar('G',    strum=S, section='Verse 3', lyric='day or two a-')
bar('G',    strum=S, lyric='go, the')
bar('G',    strum=S, lyric='story I must')
bar('C',    strum=S, lyric='tell. I')
bar('Am',   strum=S, lyric='went out on the')
bar('D7',   strum=S, lyric='snow and')
bar('D7',   strum=S, lyric='on my back I')
bar('G',    strum=S, lyric='fell. A')
bar('G',    strum=S, lyric='gent was riding')
bar('G',    strum=S, lyric='by in a')
bar('G',    strum=S, lyric='one-horse open')
bar('C',    strum=S, lyric='sleigh. He')
bar('Am',   strum=S, lyric='laughed at me as')
bar('D',    strum=S, lyric='I there lay')
bar('D7',   strum=S, lyric='but quickly drove a-')
bar('G D7', strum=S, lyric='way. Oh!')
chorus('sleigh!')

# ---- Verse 4 ----
bar('G',    strum=S, section='Verse 4', lyric='Now the ground is')
bar('G',    strum=S, lyric='white, go it')
bar('G',    strum=S, lyric="while you're")
bar('C',    strum=S, lyric='young.')
bar('Am',   strum=S, lyric='Take the girls a-')
bar('Am',   strum=S, lyric='long and')
bar('D7',   strum=S, lyric='sing this sleighing')
bar('G',    strum=S, lyric='song. Just')
bar('G',    strum=S, lyric='bet a bobtailed')
bar('G',    strum=S, lyric='bay, two')
bar('G',    strum=S, lyric='forty as his')
bar('C',    strum=S, lyric='speed.')
bar('Am',   strum=S, lyric='Hitch him to an')
bar('D',    strum=S, lyric='open sleigh and')
bar('D7',   strum=S, lyric="crack! you'll take the")
bar('G D7', strum=S, lyric='lead. Oh!')
chorus('sleigh!', last=True)

root = next(p for p in Path(__file__).resolve().parents if (p / 'app/songs/index.json').exists())
out = root / 'app/songs' / f'{SLUG}.json'
head = ''.join(f' {json.dumps(k)}: {json.dumps(v)},\n' for k, v in SONG.items())
if CHORDS: head += f' "chords": {json.dumps(CHORDS)},\n'
out.write_text('{\n' + head + ' "bars": [\n' + ',\n'.join('  ' + json.dumps(b) for b in bars) + '\n ]\n}\n')
print(f'{out.relative_to(root)}: {len(bars)} bars')
