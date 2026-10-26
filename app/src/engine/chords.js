// The built-in chord library. Frets and fingers run thickest string (low E) to thinnest; -1 = not played, 0 = open.
// The first voicing of each chord is the default; hard marks barre shapes. A song's own "chords" block adds to it for that song.
export const CHORDS = {
  G: [
    { name: 'Open, fingers 2-1-3', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], tip: 'The textbook shape. Easiest to learn first.' },
    { name: 'Open, fingers 3-2-4', frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4], tip: 'Same sound. Faster change to C: fingers 2 and 3 each move one string.' },
    { name: 'Open, 4 fingers',     frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4], tip: 'Fuller sound. Fingers 3 and 4 can stay down for some other chords.' },
    { name: 'Barre, 3rd fret',     frets: [3, 5, 5, 4, 3, 3], fingers: [1, 3, 4, 2, 1, 1], hard: true, tip: 'Movable shape: slide it to play any major chord. Hard for beginners.' },
  ],
  Em: [
    { name: 'Open, fingers 2-3', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], tip: 'The textbook shape.' },
    { name: 'Open, fingers 1-2', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 1, 2, 0, 0, 0], tip: 'Same sound. Leaves finger 3 free to land on C next.' },
  ],
  C: [
    { name: 'Open',            frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], tip: 'The textbook shape. Do not strum the low E string.' },
    { name: 'Barre, 3rd fret', frets: [-1, 3, 5, 5, 5, 3], fingers: [0, 1, 3, 3, 3, 1], hard: true, tip: 'Movable shape. Finger 3 flattens across three strings.' },
  ],
  D:  [{ name: 'Open', frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], tip: 'Strum only the top four strings.' }],
  Dm: [{ name: 'Open', frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], tip: 'Strum only the top four strings.' }],
  Am: [{ name: 'Open', frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], tip: 'The E shape moved one string toward the floor. Do not strum the low E string.' }],
  E:  [{ name: 'Open', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], tip: 'All six strings ring.' }],
  A: [
    { name: 'Open, fingers 1-2-3', frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], tip: 'Three fingers in a row on the 2nd fret.' },
    { name: 'Open, one finger',    frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 1, 1, 0], tip: 'Finger 1 flattens across three strings. Quick, but it is easy to mute the thinnest string by accident.' },
  ],
  F: [
    { name: 'Small F',         frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], tip: 'Finger 1 presses the two thinnest strings together.' },
    { name: 'Barre, 1st fret', frets: [1, 3, 3, 2, 1, 1],   fingers: [1, 3, 4, 2, 1, 1], hard: true, tip: 'The full barre. The hardest of the beginner chords.' },
  ],
};
