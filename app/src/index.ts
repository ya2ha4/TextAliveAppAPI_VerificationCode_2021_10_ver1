// 必要なimport
import * as Phaser from "phaser";
import TestScene from "./TestScene";

// ゲームの基本設定
const config: Phaser.Types.Core.GameConfig = {
    title: "test", // タイトル
    version: "1.0.0", // バージョン
    width: 1280, // 画面幅
    height: 720, // 画面高さ
    parent: "game", // DOM上の親
    type: Phaser.AUTO, // canvasかwebGLかを自動選択
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    },
    scene: [
        TestScene,
    ],
};

// ゲームメインのクラス
export class Game extends Phaser.Game {
    constructor() {
        super(config);
    }
}

class Main {
    private game: Game;

    constructor() {}
    initialize() {
        // windowイベントで、ロードされたらゲーム開始
        window.addEventListener("load", () => {
            this.game = new Game();
        });
    }
}

new Main().initialize();
