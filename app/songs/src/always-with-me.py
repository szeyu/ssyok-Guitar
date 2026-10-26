# Always With Me (Spirited Away), fingerstyle, from the tab the user screenshotted. One bar per line.
# Each bar: chord name (for the hand display), then six eighth-note slots (3/4).
# A slot is '.', or notes "string:fret" joined by '+'. Strings: 1 = high e ... 6 = low E.
# H / P / slides from the tab are written as their notes on consecutive eighths. A quarter note is its note then '.'.
import json, os

bars = []
def bar(chord, *slots, section=None):
    assert len(slots) == 6, (len(bars) + 8, slots)
    b = {'chord': chord, 'pluck': ' '.join(slots)}
    if section: b['section'] = section
    bars.append(b)

# ---- tab line 2 (bars 8-13) ----
bar('F#m7', '2:2+6:2', '.',     '5:4', '3:2', '2:2', '4:2', section='Bar 8')
bar('G',    '3:4+6:3', '.',     '5:5', '2:2', '2:3', '2:5')
bar('D/F#', '3:2+6:2', '5:5',   '2:3', '4:4', '2:5', '1:2')
bar('Em',   '1:3+2:5+3:4+4:2', '.', '3:4', '1:2', '2:5', '2:3')
bar('A',    '2:5+6:5', '.',     '4:2', '3:2', '2:3', '2:5')       # 3 slides to 5
bar('D',    '1:2+5:5', '3:2',   '1:5', '.',   '3:2', '1:2')
# ---- tab line 3 (bars 14-19) ----
bar('A',    '2:5+6:5', '4:2',   '1:5', '4:2', '2:5', '4:2', section='Bar 14')
bar('Bm',   '2:3+5:2', '3:4',   '3:4', '4:4', '2:2', '2:3')
bar('F#m',  '2:2+6:2', '.',     '4:4', '3:2', '2:2', '4:4')
bar('G',    '3:4+6:3', '5:5',   '2:2', '4:5', '2:3', '2:5')
bar('D/F#', '3:2+6:2', '5:5',   '2:3', '4:4', '2:5', '1:2')
bar('Em',   '1:3+2:5+3:4+4:2', '.', '3:4', '1:2', '2:5', '2:3')
# ---- tab line 4 (bars 20-25) ----
bar('D',    '2:3+3:2+4:4+5:5', '.', '4:4', '.', '1:2', '.', section='Bar 20')
bar('D',    '2:3',     '.',     '.',   '.',   '1:2', '1:3')
bar('D',    '1:5+5:5', '3:2',   '1:5+4:4', '3:2', '1:5+4:4', '3:2')
bar('A',    '1:5+6:5', '3:2',   '1:5+4:2', '1:7', '1:5+4:2', '1:3')   # hammer 5-7, pull 5-3
bar('Bm',   '1:2+5:2', '3:4',   '1:2+4:4', '3:4', '1:2+4:4', '3:2')
bar('F#m',  '1:2+6:2', '3:2',   '1:2+4:4', '1:3', '1:2+4:4', '2:5')
# ---- tab line 5 (bars 26-31) ----
bar('G',    '1:3+6:3', '4:5',   '1:3+5:5', '4:5', '1:3+5:5', '1:2', section='Bar 26')
bar('G/D',  '3:4+5:5', '4:5',   '3:4+5:5', '1:2', '1:2+5:5', '1:3')
bar('A6',   '1:5+6:5', '3:2',   '1:5+4:4', '1:2', '1:5+4:4', '1:2')
bar('A',    '2:5+6:5', '5:4',   '4:2', '3:2', '1:2', '1:3')
bar('D',    '1:5+5:5', '3:2',   '1:5+4:4', '3:2', '1:5+4:4', '3:2')
bar('A',    '1:5+6:5', '3:2',   '1:5+4:2', '1:7', '1:5+4:2', '1:3')   # hammer 5-7, pull 5-3
# ---- tab line 6 (bars 32-37) ----
bar('Bm',   '1:2+5:2', '3:4',   '1:2+4:4', '3:4', '1:2+4:4', '3:2', section='Bar 32')
bar('F#m',  '1:2+6:2', '1:3',   '1:2+4:4', '2:5', '2:3+4:4', '2:2')
bar('G',    '3:4+6:3', '5:5',   '4:5', '2:2', '2:3', '2:5')
bar('D/F#', '3:2+6:2', '5:5',   '2:3', '4:4', '2:5', '1:2')
bar('Em',   '1:3+2:5+3:4+4:2', '.', '3:4', '1:2', '2:5', '2:3')   # strummed upward in the tab
bar('D',    '2:3+3:2+4:4+5:5', '.', '4:4', '.', '1:2', '.')
# ---- tab line 7 (bars 38-43) ----
bar('D',    '2:3',     '.',     '.',   '.',   '2:3', '2:5', section='Bar 38')   # 3 slides to 5
bar('D',    '1:2+5:5', '3:2',   '1:5', '4:4', '3:2', '1:2')
bar('A',    '2:5+6:5', '4:2',   '1:5', '4:2', '2:5', '4:2')
bar('Bm',   '2:3+5:2', '4:4',   '1:2', '4:4', '3:2', '2:3')
bar('F#m',  '1:2+6:2', '5:4',   '4:4', '3:2', '1:2', '3:2')
bar('G',    '3:4+6:3', '5:5',   '1:2', '4:5', '1:3', '1:5')
# ---- tab line 8 (bars 44-49) ----
bar('D/F#', '3:2+6:2', '5:5',   '2:3', '4:4', '2:5', '1:2', section='Bar 44')
bar('Em',   '1:3+2:5+3:4+4:2', '3:4', '2:5', '1:2', '2:5', '2:3')   # strummed upward in the tab
bar('A',    '2:5+6:5', '5:4',   '4:2', '3:2', '2:3', '2:5')       # 3 slides to 5
bar('D',    '1:2+5:5', '3:2',   '1:5', '4:4', '3:2', '1:2')
bar('A(9)', '2:5+6:5', '2:9',   '2:10', '.',  '1:7', '1:9')       # 5 slides to 9
bar('Bm(7)','1:10+2:7+3:7+4:9', '.', '3:7', '1:7', '1:7', '2:10') # strummed upward in the tab
# ---- tab line 9 (bars 50-55) ----
bar('F#m',  '1:2+6:2', '.',     '5:4', '4:4', '3:2', '2:2', section='Bar 50')
bar('G/B(7)','1:7+2:8+3:7+4:9', '3:7', '1:9', '3:7', '1:10', '1:12')   # strummed upward; 10 slides to 12
bar('D(10)','2:10+6:10', '3:11', '1:10', '3:11', '1:12', '1:14')
bar('G(12)','1:15+2:12+3:12+4:12', '.', '3:12', '1:14', '1:12', '.')    # strummed upward
bar('D(10)','1:10+6:10', '.',   '3:11', '2:10', '4:12', '3:11')
bar('D(10)','6:10',    '.',     '.',   '.',   '1:2', '1:3')

# a shape for each chord name, made from the notes of its bars (first fret seen on each string), so the hand has something to hold
chords = {}
for b in bars:
    name = b['chord']
    shape = chords.setdefault(name, [-1] * 6)
    for slot in b['pluck'].split():
        if slot == '.': continue
        for n in slot.split('+'):
            s, f = n.split(':'); i = 6 - int(s)
            if shape[i] == -1: shape[i] = int(f)
def fingers(frets):
    lo = min([f for f in frets if f > 0], default=0)
    return [0 if f <= 0 else min(4, 1 + f - lo) for f in frets]
block = {k: [{'name': 'As in the tab', 'frets': v, 'fingers': fingers(v), 'tip': 'The notes this part of the tab uses.'}] for k, v in chords.items()}

song = '{\n "title": "Always With Me (fingerstyle)",\n "bpm": 90,\n "capo": 2,\n "beats": 3,\n "chords": %s,\n "bars": [\n%s\n ]\n}\n' % (json.dumps(block), ',\n'.join('  ' + json.dumps(b) for b in bars))
out = os.path.join(os.path.dirname(__file__), '..', 'always-with-me.json')
open(out, 'w').write(song)
print(len(bars), 'bars, chords:', ', '.join(chords))
