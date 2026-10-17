import Phaser from 'phaser';
import { GameApp } from './app/app.js';
import { createAppScenes } from './app/scenes.js';
import { createRootStatusView } from './app/root-ui.js';
import { playroomCloudPort } from './platform/index.js';
import type { StorageLike } from './contracts/ports.js';
import { createUi } from './ui/index.js';

const gameRoot = document.querySelector<HTMLDivElement>('#game-root');
const uiRoot = document.querySelector<HTMLDivElement>('#ui-root');

if (!gameRoot || !uiRoot) {
  throw new Error('Required game and UI containers are missing from index.html.');
}

const statusView = createRootStatusView(uiRoot);
let app: GameApp;
const ui = createUi(uiRoot, (command) => app.dispatch(command));
const appStorage = browserStorage();
app = new GameApp({
  baseUrl: import.meta.env.BASE_URL,
  fetcher: (url) => fetch(url),
  gameId: 'maplewood-swordsman',
  storage: appStorage,
  cloud: playroomCloudPort,
  onStateChange: (state) => {
    statusView.update(state);
    const snapshot = app.uiSnapshot;
    if (snapshot) ui.render(snapshot);
  },
});
statusView.update(app.state);

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: gameRoot,
  width: 960,
  height: 540,
  backgroundColor: '#21323a',
  scene: createAppScenes(app, (title, details) => statusView.update(app.state, title, details)),
  render: { antialias: false },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});

app.attachKeyboard(gameRoot, uiRoot);
app.setWindowFocused(document.hasFocus());

function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.dispose();
    ui.dispose();
    statusView.dispose();
    game.destroy(true);
  });
}
