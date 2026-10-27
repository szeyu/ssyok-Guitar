# Always With Me (Spirited Away), the simpler fingerstyle tab (yunus guitarist) the user pasted: capo 4, 3/4, quarter = 115, 77 bars.
# The tab is all quarters and eighths, so one tab bar is one app bar of six eighth-slots. One bar per line.
# Notes are "string:fret" joined by '+', 1 = high e. Hammer-ons, pull-offs and the 3-to-5 slide are written as their two notes.
# The tab's ending is held: bar 76 starts with a dotted quarter and bar 77 is one chord ringing.
import json
from pathlib import Path

SLUG = 'always-with-me-capo4'
SONG = {'title': 'Always With Me (simple, capo 4)', 'bpm': 115, 'capo': 4, 'beats': 3}
CHORDS = {}

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

def p(notes):   # {slot: notes} -> a pluck line, '.' on the empty slots
    return ' '.join(notes.get(i, '.') for i in range(SLOTS))

# bars the tab repeats, named by the tab bar they first appear in
C1  = p({0: '5:3', 2: '2:1+3:0', 4: '1:0+2:1'})
C5  = p({0: '1:0+5:3', 1: '2:1', 2: '1:3', 4: '3:0', 5: '1:0'})
G6  = p({0: '2:3+6:3', 2: '1:3', 4: '2:3'})
Am7 = p({0: '2:1+5:0', 1: '3:2', 2: '1:0', 4: '4:2', 5: '2:1'})
Em8 = p({0: '2:0+6:0', 2: '4:2', 4: '2:1', 5: '2:0'})
F9  = p({0: '3:2+4:3', 2: '2:0', 4: '2:1', 5: '2:3'})
C10 = p({0: '3:0+5:3', 2: '2:1', 4: '2:3', 5: '1:0'})
Dm11 = p({0: '1:1+4:0', 2: '1:1', 3: '1:0', 4: '2:3', 5: '2:1'})
G12 = p({0: '2:3+6:3', 2: '4:0', 4: '2:1', 5: '2:3'})
Am15 = p({0: '2:1+5:0', 1: '3:2', 2: '3:2', 4: '2:0', 5: '2:1'})
Em16 = p({0: '3:0+6:0', 2: '4:2', 4: '3:0'})
Dm19 = p({0: '1:1+4:0', 2: '1:1', 3: '1:0', 4: '2:3+6:3', 5: '2:1'})
C20 = p({0: '2:1+5:3', 2: '4:2', 4: '3:0'})
C21 = p({0: '5:3', 2: '4:2', 4: '3:0'})
C23 = p({0: '5:3', 2: '4:2', 4: '1:0', 5: '1:1'})
C24 = p({0: '1:3+5:3', 2: '1:3', 4: '1:3'})
G25 = p({0: '1:3+6:3', 2: '1:3', 3: '1:5', 4: '1:3', 5: '1:1'})
Am26 = p({0: '1:0+5:0', 2: '1:0', 4: '1:0'})
Em27 = p({0: '1:0+6:0', 2: '1:0', 3: '1:1', 4: '1:0', 5: '2:3'})
F29 = p({0: '3:2+4:3', 2: '2:0', 4: '2:0', 5: '2:1'})
Dm30 = p({0: '2:3+4:0', 2: '2:3', 3: '1:0', 4: '2:3', 5: '1:0'})
Em35 = p({0: '1:0+6:0', 1: '1:1', 2: '1:0', 3: '2:3', 4: '2:1', 5: '2:0'})
C62 = p({0: '1:3+5:3', 2: '1:3', 3: '3:0', 4: '1:3', 5: '3:0'})
Am64 = p({0: '1:0+5:0', 2: '1:0', 3: '3:2', 4: '1:0', 5: '3:2'})

# ---- Verse 1 ----
bar('C',  pluck=C1, section='Verse 1')
bar('C',  pluck=C1)
bar('C',  pluck=C1)
bar('C',  pluck=p({0: '5:3', 2: '3:0', 4: '2:1', 5: '2:3'}))
bar('C',  pluck=C5)
bar('G',  pluck=G6)
bar('Am', pluck=Am7)
bar('Em', pluck=Em8)
bar('F',  pluck=F9)
bar('C',  pluck=C10)
bar('Dm', pluck=Dm11)
bar('G',  pluck=G12)
bar('C',  pluck=C5)
bar('G',  pluck=G6)
bar('Am', pluck=Am15)
bar('Em', pluck=Em16)
bar('F',  pluck=F9)
bar('C',  pluck=C10)
bar('Dm Dm G', pluck=Dm19)
bar('C',  pluck=C20)
bar('C',  pluck=C21)
bar('C',  pluck=C21)
bar('C',  pluck=C23)
# ---- Chorus 1 ----
bar('C',  pluck=C24, section='Chorus 1')
bar('G',  pluck=G25)
bar('Am', pluck=Am26)
bar('Em', pluck=Em27)
bar('Am', pluck=p({0: '2:1+5:0', 2: '2:1', 4: '2:1', 5: '2:0'}))
bar('F',  pluck=F29)
bar('Dm', pluck=Dm30)
bar('G',  pluck=p({0: '2:3+6:3', 2: '4:0', 4: '1:0', 5: '1:1'}))
bar('C',  pluck=C24)
bar('G',  pluck=G25)
bar('Am', pluck=Am26)
bar('Em', pluck=Em35)
bar('F',  pluck=p({0: '3:2+4:3', 1: '2:0', 2: '2:1', 4: '2:3'}))
bar('C',  pluck=C10)
bar('Dm Dm G', pluck=p({0: '2:3+4:0', 2: '2:3', 3: '2:3', 4: '2:3+6:3', 5: '2:1'}))
bar('C',  pluck=C20)
bar('C',  pluck=C21)
bar('C',  pluck=C21)
bar('C',  pluck=p({0: '5:3', 2: '4:2', 4: '2:1', 5: '2:3'}))
# ---- Verse 2 ----
bar('C',  pluck=C5, section='Verse 2')
bar('G',  pluck=G6)
bar('Am', pluck=Am7)
bar('Em', pluck=Em8)
bar('F',  pluck=F9)
bar('C',  pluck=C10)
bar('Dm Dm G', pluck=Dm11)
bar('G',  pluck=G12)
bar('C',  pluck=C5)
bar('G',  pluck=G6)
bar('Am', pluck=Am15)
bar('Em', pluck=Em16)
bar('F',  pluck=F9)
bar('C',  pluck=C10)
bar('Dm Dm G', pluck=Dm19)
bar('C',  pluck=C20)
bar('C',  pluck=C21)
bar('C',  pluck=C21)
bar('C',  pluck=C23)
# ---- Chorus 2 ----
bar('C',  pluck=C62, section='Chorus 2')
bar('G',  pluck=G25)
bar('Am', pluck=Am64)
bar('Em', pluck=Em27)
bar('Am', pluck=p({0: '2:1+5:0', 2: '2:1', 3: '3:2', 4: '2:1', 5: '2:0'}))
bar('F',  pluck=F29)
bar('Dm', pluck=Dm30)
bar('G',  pluck=p({0: '2:3+6:3', 2: '4:0', 3: '3:0', 4: '1:0', 5: '1:1'}))
bar('C',  pluck=C62)
bar('G',  pluck=G25)
bar('Am', pluck=Am64)
bar('Em', pluck=Em35)
bar('F',  pluck=p({0: '4:3', 2: '3:2', 3: '2:0', 4: '2:1', 5: '2:3'}))
bar('C',  pluck=C10)
bar('Dm Dm G', pluck=p({0: '2:3+4:0', 3: '2:3', 4: '2:3+6:3', 5: '2:1'}))
bar('C',  pluck=p({0: '2:1+3:0+5:3'}))   # the last chord rings

assert len(bars) == 77, len(bars)
root = next(p for p in Path(__file__).resolve().parents if (p / 'app/songs/index.json').exists())
out = root / 'app/songs' / f'{SLUG}.json'
head = ''.join(f' {json.dumps(k)}: {json.dumps(v)},\n' for k, v in SONG.items())
if CHORDS: head += f' "chords": {json.dumps(CHORDS)},\n'
out.write_text('{\n' + head + ' "bars": [\n' + ',\n'.join('  ' + json.dumps(b) for b in bars) + '\n ]\n}\n')
print(f'{out.relative_to(root)}: {len(bars)} bars')
