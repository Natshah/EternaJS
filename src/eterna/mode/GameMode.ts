import * as log from "loglevel";
import {Container, Point} from "pixi.js";
import {AppMode} from "../../flashbang/core/AppMode";
import {Flashbang} from "../../flashbang/core/Flashbang";
import {GameObjectRef} from "../../flashbang/core/GameObjectRef";
import {SceneObject} from "../../flashbang/objects/SceneObject";
import {AchievementManager} from "../achievements/AchievementManager";
import {Eterna} from "../Eterna";
import {Pose2D} from "../pose2D/Pose2D";
import {PoseField} from "../pose2D/PoseField";
import {ConfirmDialog} from "../ui/ConfirmDialog";
import {NotificationDialog} from "../ui/NotificationDialog";
import {UILockDialog} from "../ui/UILockDialog";

export abstract class GameMode extends AppMode {
    public readonly bgLayer: Container = new Container();
    public readonly poseLayer: Container = new Container();
    public readonly uiLayer: Container = new Container();
    public readonly dialogLayer: Container = new Container();
    public readonly notifLayer: Container = new Container();
    public readonly achievementsLayer: Container = new Container();

    protected setup(): void {
        super.setup();

        this.modeSprite.addChild(this.bgLayer);
        this.modeSprite.addChild(this.poseLayer);
        this.modeSprite.addChild(this.uiLayer);
        this.modeSprite.addChild(this.dialogLayer);
        this.modeSprite.addChild(this.notifLayer);
        this.modeSprite.addChild(this.achievementsLayer);

        this._achievements = new AchievementManager();
        this.addObject(this._achievements);
    }

    public get_pose(i: number): Pose2D {
        return this._poses[i];
    }

    public showConfirmDialog(prompt: string, promptIsHTML: boolean = false): ConfirmDialog {
        return this.showDialog(new ConfirmDialog(prompt, promptIsHTML));
    }

    /** Show a dialog. Removes any existing dialog. */
    public showDialog<T extends SceneObject>(dialog: T): T {
        if (this._dialogRef.isLive) {
            log.warn("Dialog already showing");
            this._dialogRef.destroyObject();
        }

        this._dialogRef = this.addObject(dialog, this.dialogLayer);
        return dialog;
    }

    /**
     * Show a notification. Removes any existing notification. Dialogs will be hidden while the notification exists.
     * Returns a Promise that will resolve when the notification is dismissed.
     */
    public showNotification(message: string, extraButtonTitle?: string): NotificationDialog {
        if (this._notifRef.isLive) {
            log.warn("Notification already showing");
            this._notifRef.destroyObject();
        }

        let notif = new NotificationDialog(message, extraButtonTitle);
        this._notifRef = this.addObject(notif, this.notifLayer);

        // Hide dialogs while a notification is showing
        this.dialogLayer.visible = false;
        notif.destroyed.connect(() => this.dialogLayer.visible = true);

        return notif;
    }

    /** Draws a dimrect over the game + UI (but below the achievements layer.) */
    public pushUILock(): void {
        if (this._uiLockRef.isLive) {
            (this._uiLockRef.object as UILockDialog).addRef();
        } else {
            this._uiLockRef = this.addObject(new UILockDialog(), this.dialogLayer, 0);
        }
    }

    /** Removes the currently-active ui lock */
    public popUILock(): void {
        if (this._uiLockRef.isLive) {
            (this._uiLockRef.object as UILockDialog).releaseRef();
        } else {
            log.warn("UILockDialog not currently active");
        }
    }

    public number_of_pose_fields(): number {
        return this._pose_fields.length;
    }

    public rop_set_pip(pip_mode: boolean): void {
        this.set_pip(pip_mode);
    }

    public is_forced_synch(): boolean {
        return this._force_synch;
    }

    public set_forced_synch(forced: boolean): void {
        this._force_synch = forced;
    }

    // overridables
    public set_multi_engines(multi: boolean): void {
    }

    public register_script_callbacks(): void {
    }

    public register_setter_callbacks(): void {
    }

    public onResized(): void {
        this.layoutPoseFields();
        super.onResized();
    }

    protected set_pose_fields(newPoseFields: PoseField[]): void {
        if (this._pose_fields != null) {
            for (let poseField of this._pose_fields) {
                poseField.destroySelf();
            }
        }

        this._pose_fields = [];
        this._poses = [];

        for (let newPoseField of newPoseFields) {
            this._pose_fields.push(newPoseField);
            this._poses.push(newPoseField.get_pose());
        }
    }

    protected toggle_pip(): void {
        this.set_pip(!this._is_pip_mode);
    }

    protected set_pip(pip_mode: boolean): void {
        this._is_pip_mode = pip_mode;
        this.layoutPoseFields();
        this.on_set_pip(pip_mode);
    }

    protected layoutPoseFields(): void {
        if (this._is_pip_mode) {
            let numFields: number = this._pose_fields.length;
            for (let ii = 0; ii < numFields; ii++) {
                let poseField = this._pose_fields[ii];
                poseField.display.position = new Point(Flashbang.stageWidth / numFields * ii, 0);
                poseField.set_size(Flashbang.stageWidth / numFields, Flashbang.stageHeight, true);
                poseField.display.visible = true;
            }
        } else {
            for (let ii = 0; ii < this._pose_fields.length; ii++) {
                let poseField = this._pose_fields[ii];
                if (ii === 0) {
                    poseField.display.position = new Point(0, 0);
                    poseField.set_size(Flashbang.stageWidth, Flashbang.stageHeight, false);
                    poseField.display.visible = true;
                } else {
                    poseField.display.visible = false;
                }
            }
        }
    }

    protected on_set_pip(pip_mode: boolean): void {
    }

    protected postScreenshot(screenshot: ArrayBuffer): void {
        this.pushUILock();

        Eterna.client.post_screenshot(screenshot)
            .then(filename => {
                let url = new URL(filename, Eterna.serverURL);
                let prompt = `Do you want to post <u><a href="${url.href}" target="_blank">this</a></u> screenshot in chat?`;
                this.showConfirmDialog(prompt, true).closed.connect(confirmed => {
                    if (confirmed) {
                        log.info("TODO: post to chat!");
                    }
                });
            })
            .catch(err => {
                this.showNotification(`There was an error posting the screenshot\n${err}`);
            })
            ./*finally*/then(() => {
                this.popUILock();
            });
    }

    protected _achievements: AchievementManager;

    protected _dialogRef: GameObjectRef = GameObjectRef.NULL;
    protected _uiLockRef: GameObjectRef = GameObjectRef.NULL;
    protected _notifRef: GameObjectRef = GameObjectRef.NULL;

    protected _pose_fields: PoseField[] = [];
    protected _poses: Pose2D[] = [];    // TODO: remove me!
    protected _is_pip_mode: boolean = false;
    protected _force_synch: boolean = false;
}
