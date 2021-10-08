import Phaser from 'phaser';

import { buildMusicInfo } from './MusicInfo';
import DebugInfo from './object/DebugInfo';
import TimeInfoObject from './object/TimeInfoObject';
import UIPauseButtonObject from './object/UIPauseButtonObject';
import TextaliveApiManager from './TextaliveApiManager';

import uiImage from './assets/ui/*.png';

export default class TestScene extends Phaser.Scene {
    public api: TextaliveApiManager;

    // 曲の進行時間（表示位置：左下）
    private timeInfo: TimeInfoObject;

    // ポーズボタン（表示位置：右下）
    private pauseButton: UIPauseButtonObject;

    // 曲開始処理用
    private musicStartState: string;
    private musicStartRequestTime: number;


    // --------------------------------
    // デバッグ用（表示位置：左上）
    private enableDebugInfo: boolean;
    private debugInfo: DebugInfo;

    constructor() {
        super({ key: "TestScene" });
    }

    public init(): void {
        // MisicInfo.ts からどの曲を再生させるか選択
        // 1: 夏をなぞって
        // 2: First Note
        // 3: その心に灯る色は
        // 4: Freedom!
        // 5: 密かなる交信曲
        // 6: 嘘も本当も君だから
        const selectedMusicId = 1;
        const selectedMusic = buildMusicInfo().find((music) => music.id === selectedMusicId);

        this.api = new TextaliveApiManager(
            selectedMusic.url,
            selectedMusic.playerVideoOptions
        );
        this.api.init();

        // 曲の進行時間
        this.timeInfo = new TimeInfoObject();
        // ボタン
        this.pauseButton = new UIPauseButtonObject();

        // 曲開始処理用
        this.musicStartState = "";
        this.musicStartRequestTime = 0;


        // --------------------------------
        // デバッグ用
        this.enableDebugInfo = true;
        if (this.enableDebugInfo) {
            this.debugInfo = new DebugInfo();
        } else {
            this.debugInfo = null;
        }
    }

    // アセットの読み込み
    public preload(): void {
        // ボタン
        this.load.image("button_play", uiImage["play"]);
        this.load.image("button_pause", uiImage["pause"]);
        this.load.image("button_start", uiImage["start"]);
        this.load.image("btton_attention_start", uiImage["attention_start"]);
    }

    // 表示オブジェクトの生成
    public create(): void {
        // --------------------------------
        // オブジェクトの生成

        this.timeInfo.create({
            scene: this,
            posX: 87,
            posY: 695,
            textalivePlayer: this.api,
        });
        this.timeInfo.setVisible(true);

        this.pauseButton.create({
            scene: this,
            pauseImageKey: "button_pause",
            playImageKey: "button_play",
            startImageKey: "button_start",
            attentionStartImageKey: "btton_attention_start",
            posX: 1200,
            posY: 670,
            attentionPosX: 1140,
            attentionPosY: 570,
            textaliveManager: this.api,
        });
        this.pauseButton.setVisible(false);

        // --------------------------------
        // デバッグ用
        if (this.enableDebugInfo) {
            this.debugInfo.create({
                scene: this,
                textaliveAppApi: this.api,
            });
            this.debugInfo.setVisible(true);
        }
    }

    // 毎フレームの更新処理
    public update(): void {
        // 曲の開始（自動再生）処理
        this.updateStartSeq();

        // 曲の再生が終了した際の処理
        if (typeof this.api.player.data.song != "undefined") {
            if (this.api.player.data.song.length - 0.5 < this.api.getPositionTime() / 1000) {
                this.api.player.requestStop();
                this.api.player.requestMediaSeek(0);
            }
        }

        this.timeInfo.update();

        if (this.musicStartState != "") {
            this.pauseButton.setStatus(this.api.player.isPlaying ? "pause" : "play");
        }

        // --------------------------------
        // デバッグ用
        if (this.enableDebugInfo) {
            this.debugInfo.update();
        }
    }

    // 楽曲の自動再生処理
    private updateStartSeq(): void {
        // ロードが終わり次第、楽曲をスタート
        if (!this.api.player.isPlaying && !this.api.player.isLoading && this.musicStartState == "") {
            this.api.player.requestPlay();
            this.musicStartState = "requestedPlay";
            this.musicStartRequestTime = performance.now();

            // 一時停止ボタンの表示
            this.pauseButton.setVisible(true);

            // 曲の進行時間の表示
            this.timeInfo.songLength = this.api.player.data.song.length * 1000;
            this.timeInfo.dispTime = true;

            // 楽曲情報をコンソール出力
            if (this.enableDebugInfo) {
                this.debugInfo.dispConsoleSongInfo();
            }
        } else if (this.musicStartState == "requestedPlay") {
            if (this.api.player.isPlaying) {
                // 自動再生に成功
                this.pauseButton.setStatus("pause");
                this.musicStartState = "musicStarted";
            } else if (this.pauseButton.status != "start" && performance.now() - this.musicStartRequestTime > 1000) {
                // Phaser と TextAlive App API の更新処理が同期取れないので1秒以上開始できていなければ、自動再生に失敗したとみなす
                // 再生処理が単に遅い場合もこの処理に入るがその場合は再生開始時に元の状態に戻す
                this.pauseButton.setStatus("start");
                this.musicStartState = "musicWaitTouchStartButton";
            }
        }

        // 自動再生に失敗したと判断したものの自動再生された場合、元の状態に戻す処理
        if (this.musicStartState == "musicWaitTouchStartButton" && this.api.player.isPlaying) {
            this.pauseButton.setStatus("pause");
            this.musicStartState = "musicStarted";
        }
    }
}
