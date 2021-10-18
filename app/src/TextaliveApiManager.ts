import { Player, PlayerVideoOptions } from "textalive-app-api";

export default class TextaliveApiManager {
    // createFromSongUrl() 用のパラメータ保存用
    private musicUrl: string;
    private options: PlayerVideoOptions;

    public player: Player;

    // position の有効な値を保持するための変数
    // Player.addListener() で登録したタイミング以外で player.timer.position を参照すると曲の長さを超える値が入る為、それの回避用
    private positionTime: number = 0;

    // player.timer.position の有効な値を保持するための変数
    private timerPositionTime: number = 0;

    private isChorus: boolean = false;

    private preFrameTime: number;

    constructor(url: string, options?: PlayerVideoOptions) {
        this.musicUrl = url;
        this.options = options ? options : null;
    }

    public init(): void {
        this.player = new Player({
            app: {
                token: "",
            },
            mediaElement: document.querySelector<HTMLElement>("#media"),
            valenceArousalEnabled: true,
            vocalAmplitudeEnabled: true,
        });
        //document.querySelector<HTMLElement>("#media").hidden = true;

        this.player.addListener({
            onAppReady: (app) => this.onAppReady(app),
            onTimeUpdate: (pos) => this.onTimeUpdate(pos),
            onThrottledTimeUpdate: (pos) => this.onThrottledTimeUpdate(pos),
        });
    }

    private onAppReady(app): void {
        if (!app.songUrl) {
            this.player.createFromSongUrl(this.musicUrl, this.options);
        }
    }

    public onThrottledTimeUpdate(position): void {
        //console.log("called onThrottledTimeUpdate()");
    }

    public onTimeUpdate(position): void {
        //console.log("called onTimeUpdate()");

        this.isChorus = this.player.findChorus(position) != null;

        const nowFrameTime = performance.now();
        if (this.preFrameTime) {
            console.log(`[TextaliveApiManager] elapsed time: ${(nowFrameTime - this.preFrameTime)}, pos:${this.player.timer.position}`)
        }
        this.preFrameTime = nowFrameTime;

        if (this.positionTime > position) {
            // この処理が実行される状況は確認できず
            console.warn(`[onTimeUpdate] position の巻き戻りが発生している pre:${this.positionTime} now:${position}`);
        }
        this.positionTime = position;
        if (this.player.data.song.length * 1000 < position) {
            // この処理が実行される状況は確認できず
            console.warn(`曲の長さを超える値が position に入っています ${position}`);
        }
        
        if (this.timerPositionTime > this.player.timer.position) {
            // この処理が実行される状況は確定ではないものの発生することがある
            console.warn(`[onTimeUpdate] Player.timer.position の巻き戻りが発生している pre:${this.timerPositionTime} now:${this.player.timer.position}`);
        }
        this.timerPositionTime = this.player.timer.position;
    }

    public getPositionTime(): number {
        return this.positionTime;
    }

    /**
     * 楽曲ががしていたポジションならTrueを返す
     */
    public getIsChorus(): boolean {
        return this.isChorus;
    }
}
