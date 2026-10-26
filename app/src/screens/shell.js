// Which screen is showing, and Esc. Each screen registers what Esc does on it, and what to do when it is shown and when it is left.
const IDS = { library: 'library', song: 'songScreen', player: 'player', builder: 'builder', sheet: 'sheet' };
const hooks = {};
let current = 'library';

/** Registers a screen's { esc, show, leave } handlers. */
export const onScreen = (name, handlers) => { hooks[name] = handlers; };

/** Shows one screen and hides the others; the screen being left hears leave(), the one shown show(). */
export function showScreen(name) {
  if (name !== current) hooks[current]?.leave?.();
  current = name;
  for (const [key, id] of Object.entries(IDS)) document.getElementById(id).hidden = key !== name;
  hooks[name]?.show?.();
  scrollTo(0, 0);
}

export const screenShowing = () => current;

addEventListener('keydown', e => {
  if (e.key !== 'Escape' || e.target.matches?.('input:not([type=range]), select, textarea, [contenteditable]')) return;
  hooks[current]?.esc?.();
});
