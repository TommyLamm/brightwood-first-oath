import Phaser from 'phaser';
import { createWorldRenderer } from '../render/index.js';
import { GameApp } from './app.js';
import { makeWorldSnapshot } from './gameplay.js';
import { shouldAttemptMapVisualLoad } from './map-load-retry.js';
import type { MapDef } from '../contracts/definitions.js';
import type { WorldRenderer, WorldRendererFactory } from '../contracts/ports.js';

export type AppStatusReporter = (title: string, details: string) => void;

/** All Phaser scenes are created and transitioned by the app entry point. */
export function createAppScenes(app: GameApp, reportStatus: AppStatusReporter) {
  class BootScene extends Phaser.Scene {
    private statusText?: Phaser.GameObjects.Text;

    constructor() {
      super({ key: 'boot' });
    }

    create(): void {
      this.statusText = this.add.text(480, 270, '正在檢查遊戲內容與資產套件…', {
        color: '#f4eddd',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        align: 'center',
        wordWrap: { width: 840 },
      }).setOrigin(0.5);

      void app.initialize().then((result) => {
        if (!this.sys.isActive()) return;
        if (!result.ready) {
          const details = result.issues.join('\n');
          this.statusText?.setText(`開發中：內容尚未完成\n${details}`);
          reportStatus('資產或內容尚未完成', details);
          return;
        }
        this.scene.start('world');
      });
    }
  }

  class WorldScene extends Phaser.Scene {
    private worldRenderer: WorldRenderer | null = null;
    private rendererReady = false;
    private transitionKey: string | null = null;
    private activeMapId: string | null = null;
    private readonly failedMapIds = new Set<string>();
    private loadedWorldRevision = 0;
    private statusText?: Phaser.GameObjects.Text;

    constructor() {
      super({ key: 'world' });
    }

    create(): void {
      this.statusText = this.add.text(480, 270, '正在載入地圖資產…', {
        color: '#f4eddd',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        align: 'center',
        wordWrap: { width: 840 },
      }).setOrigin(0.5);
      const catalog = app.state.catalog;
      const manifests = app.state.assetManifests;
      const heroAnchors = app.state.heroAnchors;
      this.loadedWorldRevision = app.state.worldRevision;
      if (!catalog || !manifests || !heroAnchors) {
        app.reportRuntimeIssue('World Scene 缺少已驗證的 catalog、manifest、hero anchors 或 camp map。');
        this.statusText.setText('開發中：遊戲內容尚未完成');
        reportStatus('遊戲內容尚未完成', 'World Scene 缺少 catalog、manifest 或 hero anchors。');
        return;
      }

      const rendererFactory: WorldRendererFactory = createWorldRenderer;
      this.worldRenderer = rendererFactory(this, manifests, catalog, heroAnchors);
      const initialMap = app.state.gameplay
        ? catalog.world.maps[app.state.gameplay.saveData.location.mapId]
        : null;
      if (initialMap) this.loadMapVisual(initialMap, false, app, reportStatus);
      else this.statusText.setText('請開始新遊戲或繼續既有角色。');
      this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    }

    update(_time: number, delta: number): void {
      app.update(delta);
      const state = app.state;
      const catalog = state.catalog;
      const gameplay = state.gameplay;
      const explicitRetry = state.worldRevision !== this.loadedWorldRevision;
      if (catalog && gameplay && this.worldRenderer && !gameplay.pendingTransition && explicitRetry) {
        this.loadedWorldRevision = state.worldRevision;
        const map = catalog.world.maps[gameplay.saveData.location.mapId];
        if (map && shouldAttemptMapVisualLoad(map.id, this.activeMapId, this.failedMapIds, true)) {
          this.loadMapVisual(map, false, app, reportStatus);
        }
      }
      if (catalog && gameplay?.pendingTransition && this.worldRenderer && !this.transitionKey) {
        const pending = gameplay.pendingTransition;
        const map = catalog.world.maps[pending.mapId];
        const key = `${pending.mapId}:${pending.spawnId}:${pending.after}`;
        this.transitionKey = key;
        if (!map) {
          app.failMapTransition(`找不到地圖 ${pending.mapId}。`);
          this.transitionKey = null;
        } else {
          void this.worldRenderer.loadMap(map).then(() => {
            if (!this.sys.isActive() || this.transitionKey !== key) return;
            app.completeMapTransition();
            this.activeMapId = map.id;
            this.failedMapIds.delete(map.id);
            this.transitionKey = null;
            this.rendererReady = true;
          }).catch((error: unknown) => {
            if (!this.sys.isActive() || this.transitionKey !== key) return;
            const message = error instanceof Error ? error.message : String(error);
            app.failMapTransition(message);
            app.reportRuntimeIssue(`地圖載入失敗：${message}`);
            this.statusText?.setText(`地圖載入失敗\n${message}`);
            reportStatus('地圖載入失敗', message);
            this.transitionKey = null;
          });
        }
      }
      if (catalog && gameplay && !gameplay.pendingTransition && this.worldRenderer
        && !this.transitionKey
        && shouldAttemptMapVisualLoad(gameplay.saveData.location.mapId, this.activeMapId, this.failedMapIds, false)) {
        const map = catalog.world.maps[gameplay.saveData.location.mapId];
        if (!map) {
          app.reportRuntimeIssue(`找不到地圖 ${gameplay.saveData.location.mapId}。`);
          return;
        }
        this.loadMapVisual(map, false, app, reportStatus);
      }
      if (gameplay?.pendingTransition) return;
      if (!this.rendererReady || !this.worldRenderer || !catalog || !gameplay
        || this.activeMapId !== gameplay.saveData.location.mapId) return;
      this.worldRenderer.resize(this.scale.gameSize.width, this.scale.gameSize.height);
      this.worldRenderer.render(makeWorldSnapshot(gameplay, catalog, state.gameTimeMs));
    }

    private shutdown(): void {
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
      this.worldRenderer?.dispose();
      this.worldRenderer = null;
      this.rendererReady = false;
      this.transitionKey = null;
      this.activeMapId = null;
      this.failedMapIds.clear();
    }

    private loadMapVisual(
      map: MapDef,
      _isTransition: boolean,
      app: GameApp,
      report: AppStatusReporter,
    ): void {
      if (!this.worldRenderer || this.transitionKey) return;
      const key = `initial:${map.id}`;
      this.transitionKey = key;
      this.failedMapIds.delete(map.id);
      void this.worldRenderer.loadMap(map).then(() => {
        if (!this.sys.isActive() || this.transitionKey !== key) return;
        this.activeMapId = map.id;
        this.failedMapIds.delete(map.id);
        this.rendererReady = true;
        this.transitionKey = null;
        this.statusText?.setText('地圖資產已載入。');
        report('地圖資產已載入', '目前地圖資產已接入 renderer。');
      }).catch((error: unknown) => {
        if (!this.sys.isActive() || this.transitionKey !== key) return;
        const message = error instanceof Error ? error.message : String(error);
        this.transitionKey = null;
        this.failedMapIds.add(map.id);
        app.reportRuntimeIssue(`地圖載入失敗：${message}`);
        this.statusText?.setText(`地圖載入失敗\n${message}`);
        report('地圖載入失敗', message);
      });
    }
  }

  return [BootScene, WorldScene];
}
