# Always With Me (Spirited Away), second fingerstyle arrangement: C shapes, capo 5. From the tab the user screenshotted, bars 6-32 (1-5 were cut off).
# The tab is 3/4 with sixteenth notes; the app's slots are eighths. ponytail: each tab bar is written as two app bars of six
# sixteenth-slots at double tempo (130 = quarter 65). Sounds the same; the count shown reads 1&2&3& per half bar. Real fix: a sixteenth grid in the format.
# Each tab bar: bar(n, chord for the first half, chord for the second, {sixteenth: notes}). Notes are "string:fret" joined by '+', 1 = high e.
# H / P / slides are written as their notes. Up-strums (arrows) are written as the chord's notes together.
import json, os

bars = []
def bar(n, c1, c2, notes, section=None):
    slots = ['.'] * 12
    for i, v in notes.items(): slots[i] = v
    a = {'chord': c1, 'pluck': ' '.join(slots[:6])}
    if section: a['section'] = section
    bars.append(a)
    bars.append({'chord': c2, 'pluck': ' '.join(slots[6:])})

B6  = {0:'1:1+4:0', 2:'1:1+3:2', 3:'1:0', 4:'2:3', 5:'2:1', 6:'2:3+6:3', 8:'3:0+4:0', 10:'2:1+3:0', 11:'2:3+3:0'}
B7  = {0:'1:0+5:3', 1:'2:1', 2:'1:3+4:2', 4:'3:0', 5:'1:0', 6:'2:3+6:3', 8:'1:3+2:0+3:0+4:0', 10:'2:3'}
B9  = {0:'3:2+6:1', 2:'2:0+4:3', 4:'2:1', 5:'2:3', 6:'3:0+5:3', 8:'2:1+4:2', 10:'2:3', 11:'1:0'}
B10 = {0:'1:1+4:0', 2:'1:1+3:2', 3:'1:0', 4:'2:3+6:3', 5:'2:1', 6:'2:1+5:3', 8:'4:2', 10:'3:0'}
B12 = {0:'1:3+5:3', 2:'1:3+2:1+3:0', 4:'1:3', 6:'1:3+6:3', 8:'1:3+2:0+3:0', 9:'1:5', 10:'1:3', 11:'1:1'}
R = 'Refrain'

bar(6,  'Dm7', 'G', B6, section='Bar 6')
bar(7,  'C', 'G', B7)
bar(8,  'Am', 'Em', {0:'2:1+5:0', 1:'3:2', 2:'3:2+4:2', 4:'2:0', 5:'2:1', 6:'3:0+6:0', 8:'5:2', 10:'4:2', 11:'3:0'})
bar(9,  'F', 'C', B9)
bar(10, 'Dm', 'G', B10)
bar(11, 'C', 'C', {0:'5:3', 2:'4:2', 4:'3:0', 6:'5:3', 8:'4:2', 10:'1:0', 11:'1:1'}, section=R)
# refrain, first time
bar(12, 'C', 'G', B12)
bar(13, 'Am', 'Em', {0:'1:0+5:0', 2:'1:0+2:1+3:2', 4:'1:0', 6:'1:0+6:0', 8:'1:0+2:0+3:0', 9:'1:1', 10:'1:0', 11:'2:3'})
bar(14, 'Am', 'F', {0:'2:1+5:0', 2:'2:1+4:2', 4:'2:1', 5:'2:0', 6:'3:2+6:1', 8:'2:0+4:3', 10:'2:0', 11:'2:1'})
bar(15, 'Dm', 'G', {0:'2:3+4:0', 2:'2:3+3:2', 3:'1:0', 4:'2:3', 5:'1:0', 6:'2:3+6:3', 8:'3:0+4:0', 10:'1:0', 11:'1:1'})
# repeat: bar 12 again, then the second ending
bar(12, 'C', 'G', B12, section='Refrain again')
bar(16, 'Am', 'Em', {0:'1:0+5:0', 2:'1:0+2:1+3:2', 4:'1:0', 6:'1:0+6:0', 7:'1:1', 8:'1:0+2:0+3:0', 9:'2:3', 10:'2:1', 11:'2:0'})
bar(17, 'F', 'C', {0:'6:1', 2:'3:2+4:3', 3:'2:0', 4:'2:1', 5:'2:3', 6:'3:0+5:3', 8:'2:1+4:2', 10:'2:3', 11:'1:0'})
bar(18, 'F', 'G', {0:'2:3+6:1', 3:'2:3', 4:'2:3+6:3', 5:'2:1', 6:'2:1+5:3', 8:'4:2', 10:'3:0'})
bar(19, 'C', 'C', {0:'5:3', 2:'4:2', 4:'3:0', 6:'5:3', 8:'4:2', 10:'2:1+3:0', 11:'2:3+3:0'}, section='Couplet')
bar(20, 'C', 'G', B7)
bar(21, 'Am', 'Em', {0:'2:1+5:0', 1:'3:2', 2:'1:0+4:2', 4:'3:2', 5:'2:1', 6:'2:0+6:0', 8:'4:2', 10:'2:0+3:0'})
bar(22, 'F', 'C', B9)
bar(23, 'Dm7', 'G', B6)
bar(24, 'C', 'G', B7)
bar(25, 'Am', 'Em', {0:'2:1+5:0', 1:'3:2', 2:'3:2+4:2', 4:'2:0', 5:'2:1', 6:'3:0+6:0', 8:'5:2', 10:'3:0'})
bar(26, 'F', 'C', {0:'3:2+6:1', 2:'2:0+4:3', 4:'2:1', 5:'2:3', 6:'3:0+5:3', 8:'2:1+4:2', 11:'2:0'}, section='Outro')
bar(27, 'F', 'C', {0:'3:2+6:1', 2:'2:0+4:3', 4:'2:1', 5:'2:3', 6:'3:0+5:3', 8:'4:2', 10:'2:1', 11:'2:0'})
bar(28, 'F', 'C', B9)
bar(29, 'Dm', 'G', B10)
bar(30, 'C', 'C', {0:'5:3', 2:'4:2', 4:'3:0', 6:'5:3', 8:'4:2', 10:'3:0'})
bar(31, 'C', 'C', {0:'3:0+5:3', 2:'2:1+4:2', 4:'1:0+3:0', 6:'1:0+2:1+3:0+4:2+5:3'})
bar(32, 'C', 'C', {})   # the last chord rings

chords = {'Dm7': [{'name': 'Open', 'frets': [-1, -1, 0, 2, 1, 1], 'fingers': [0, 0, 0, 2, 1, 1], 'tip': 'Finger 1 lies across the two thinnest strings at the 1st fret.'}]}
song = '{\n "title": "Always With Me (fingerstyle, capo 5)",\n "bpm": 130,\n "capo": 5,\n "beats": 3,\n "chords": %s,\n "bars": [\n%s\n ]\n}\n' % (json.dumps(chords), ',\n'.join('  ' + json.dumps(b) for b in bars))
open(os.path.join(os.path.dirname(__file__), '..', 'always-with-me-capo5.json'), 'w').write(song)
print(len(bars), 'app bars')
