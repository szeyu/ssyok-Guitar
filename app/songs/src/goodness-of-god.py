# Goodness of God (Bethel Music & Jenn Johnson), from the chord chart the user supplied as screenshots. Guitar part only, no melody. One bar per line.
# Run: python3 app/songs/src/goodness-of-god.py
# Approximations (for the report):
# - Sixteenth strum D D D DU D D D DU at 63 bpm: reference.md's sixteenth rule, two app bars per chart bar at bpm 126,
#   each app bar one half of the chart bar on sixteenths: D.D.D.DU (D on 1, 1&, 2, 2&, U on the "a" of 2). Bar counts read double.
# - Chart bar k is app bars 2k-1 and 2k; a chord change on beat 3 starts the second app bar.
# - Bar lines are mine: about two chart bars per lyric line; bridge and instrumental one chord per chart bar.
# - Passing chords after the last word ("head [D/F#] [Em]") get the bar after the G in the verse (D/F# beat 1, Em beat 3),
#   and beats 3 and 4 of the G bar in the chorus ("able [D/F#] [Em]") so the chorus stays 8 bars.
# - "father [C]": C takes the next chart bar.
# - D/F# could not be read from the chart: written as 2x0232.
# - The final G rings: one down stroke, then the bar held.
import json
from pathlib import Path

SLUG = 'goodness-of-god'
SONG = {'title': 'Goodness of God', 'bpm': 126, 'capo': 1, 'beats': 4}
CHORDS = {   # G, C, D match the library's first shapes; Em is the library's 0-1-2 fingering
    'Em': [{'name': 'Open, fingers 1-2', 'frets': [0, 2, 2, 0, 0, 0], 'fingers': [0, 1, 2, 0, 0, 0], 'tip': 'As the chart fingers it. Leaves finger 3 free to land on C next.'}],
    'Gsus4': [{'name': 'Open', 'frets': [3, 3, 0, 0, 1, 3], 'fingers': [2, 3, 0, 0, 1, 4], 'tip': 'From G: finger 3 to the A string 3rd fret, finger 1 to the B string 1st fret.'}],
    'D/F#': [{'name': 'Open, F# bass', 'frets': [2, -1, 0, 2, 3, 2], 'fingers': [1, 0, 0, 2, 4, 3], 'tip': 'D shape with F# in the bass; let finger 1 touch the A string to mute it, or fret the F# with your thumb.'}],
    'G/B': [{'name': 'Open, B bass', 'frets': [-1, 2, 0, 0, 0, 3], 'fingers': [0, 1, 0, 0, 0, 2], 'tip': 'Do not strum the low E string.'}],
}

SLOTS = SONG.get('beats', 4) * 2
FIELDS = ('strum', 'pluck', 'section', 'lyric', 'syllables', 'tune')
SLOTTED = {'pluck', 'syllables', 'tune'}
bars = []

def bar(chord, **fields):
    where = f'bar {len(bars) + 1}'
    fields.setdefault('strum', S)
    for name, value in fields.items():
        assert name in FIELDS, f'{where}: unknown field {name!r}'
        if name not in SLOTTED | {'strum'}: continue
        count = len(value) if name == 'strum' else len(value.split())
        assert count == SLOTS, f'{where}: {name} {value!r} has {count} slots, not {SLOTS}'
    bars.append({'chord': chord, **{name: fields[name] for name in FIELDS if fields.get(name)}})

S = 'D.D.D.DU'   # half a chart bar on sixteenths: D D D DU

def chorus(next_words='', tag=False, last=False):
    bar('C',         section='Chorus', lyric='All my life')
    bar('C',         lyric='you have been')
    bar('G',         lyric='faithful.')
    bar('G')
    bar('C',         lyric='All my life')
    bar('C',         lyric='you have been')
    bar('G',         lyric='so, so')
    bar('D',         lyric='good.')
    bar('C',         lyric='With every breath')
    bar('C',         lyric='that I am')
    bar('G',         lyric='able')
    bar('D/F# Em',   lyric='I will')
    bar('C',         lyric='sing of the')
    bar('D',         lyric='goodness of')
    if tag:
        bar('Em',    lyric='God.')
        bar('Em',    lyric='I will')
        bar('C',     lyric='sing of the')
        bar('D',     lyric='goodness of')
    bar('G',         lyric='God.', strum='D.......' if last else S)
    bar('G',         lyric=next_words, strum='........' if last else S)

def bridge_line(end, keeps=False, pickup='', section=None):
    bar('G/B',       section=section, lyric='Your goodness is')
    bar('G/B')
    bar('C',         lyric='running after,')
    bar('C',         lyric='it' if keeps else "it's")
    bar('D',         lyric='keeps running after' if keeps else 'running after')
    bar('D')
    bar('G',         lyric=end)
    bar('G',         lyric=pickup)

def bridge_block(keeps, first=False):
    bridge_line('me.', section='Bridge' if first else None)
    bridge_line('me.', pickup='With my')
    bar('G/B',       lyric='life laid down,')
    bar('G/B',       lyric="I'm")
    bar('C',         lyric='surrendered now,')
    bar('C',         lyric='I')
    bar('D',         lyric='give you every-')
    bar('D')
    bar('Em',        lyric='thing.')
    bar('Em')
    bridge_line('me.', keeps=keeps)

# ---- Intro ----
bar('G',     section='Intro')
bar('G')
bar('Gsus4')
bar('Gsus4')
bar('G')
bar('G')
bar('Gsus4')
bar('Gsus4', lyric='I love you,')

# ---- Verse 1 ----
bar('G',      section='Verse 1', lyric='Lord,')
bar('G')
bar('G')
bar('G',      lyric='for your')
bar('C',      lyric='mercy')
bar('C',      lyric='never')
bar('G',      lyric='fails me.')
bar('G')
bar('D/F#',   lyric='All my')
bar('Em',     lyric="days, I've been")
bar('C',      lyric='held in your')
bar('D',      lyric='hands. From the moment that I')
bar('Em',     lyric='wake')
bar('Em')
bar('C',      lyric='up.')
bar('C',      lyric='Until I')
bar('G',      lyric='lay my head')
bar('G')
bar('D/F#')
bar('Em',     lyric='I will')
bar('C',      lyric='sing of the')
bar('D',      lyric='goodness of')
bar('G',      lyric='God.')
bar('G')
chorus('I love your')

# ---- Verse 2 ----
bar('G',      section='Verse 2', lyric='voice.')
bar('G')
bar('G')
bar('G',      lyric='You have')
bar('C',      lyric='led me')
bar('C',      lyric='through the')
bar('G',      lyric='fire.')
bar('G',      lyric='In')
bar('D/F#',   lyric='darkest')
bar('Em',     lyric='night you are')
bar('C',      lyric='close like no')
bar('D',      lyric="other. I've known you as a")
bar('Em',     lyric='father,')
bar('Em')
bar('C')
bar('C',      lyric="I've known you as a")
bar('G',      lyric='friend.')
bar('G')
bar('D/F#')
bar('Em',     lyric='I have')
bar('C',      lyric='lived in the')
bar('D',      lyric='goodness of')
bar('G',      lyric='God.')
bar('G')
chorus()

# ---- Bridge (A then B) ----
bridge_block(keeps=False, first=True)
bridge_block(keeps=True)
chorus()

# ---- Instrumental: the bridge's chords, one per chart bar ----
for n in range(4):
    bar('G/B',   section='Instrumental' if n == 0 else None)
    bar('G/B')
    bar('C')
    bar('C')
    bar('D')
    bar('D')
    bar('G')
    bar('G')

# ---- Bridge (keeps, then A) ----
bridge_block(keeps=True, first=True)
bridge_block(keeps=False)

chorus(tag=True)
chorus(last=True)

root = next(p for p in Path(__file__).resolve().parents if (p / 'app/songs/index.json').exists())
out = root / 'app/songs' / f'{SLUG}.json'
head = ''.join(f' {json.dumps(k)}: {json.dumps(v)},\n' for k, v in SONG.items())
if CHORDS: head += f' "chords": {json.dumps(CHORDS)},\n'
out.write_text('{\n' + head + ' "bars": [\n' + ',\n'.join('  ' + json.dumps(b) for b in bars) + '\n ]\n}\n')
print(f'{out.relative_to(root)}: {len(bars)} bars')
