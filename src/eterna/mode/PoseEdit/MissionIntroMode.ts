import {Container, Graphics, Point, Sprite} from "pixi.js";
import {AppMode} from "../../../flashbang/core/AppMode";
import {Flashbang} from "../../../flashbang/core/Flashbang";
import {DisplayObjectPointerTarget} from "../../../flashbang/input/DisplayObjectPointerTarget";
import {KeyCode} from "../../../flashbang/input/KeyCode";
import {EPars} from "../../EPars";
import {BitmapManager} from "../../resources/BitmapManager";
import {GameButton} from "../../ui/GameButton";
import {PoseThumbnail} from "../../ui/PoseThumbnail";
import {Fonts} from "../../util/Fonts";

export class MissionIntroMode extends AppMode {
    public constructor(puzzleName: string, puzzleDescription: string, puzzleThumbnails: number[][]) {
        super();

        this._background = new Graphics();
        this.modeSprite.addChild(this._background);
        this.draw_background();

        this._background.interactive = true;
        new DisplayObjectPointerTarget(this._background).pointerDown.connect(() => this.play());

        let molecule_background: Sprite = Sprite.fromImage(BitmapManager.MissionBackgroundImage);
        this.modeSprite.addChild(molecule_background);
        molecule_background.position = new Point(
            (Flashbang.stageWidth - molecule_background.width) * 0.5,
            0);

        let mission_text = Fonts.std_light("MISSION", 48).color(0xFFCC00).build();
        this.modeSprite.addChild(mission_text);
        mission_text.position = new Point(
            (Flashbang.stageWidth * 0.5) - 420.5,
            123);

        let description_label = Fonts.std_light(puzzleDescription).color(0xBCD8E3).fontSize(36).leading(50).build();
        this.modeSprite.addChild(description_label);
        description_label.position = new Point(
            (Flashbang.stageWidth * 0.5) - 420.5,
            123 + mission_text.height + 25);

        let play_button: GameButton = new GameButton()
            .up(BitmapManager.PlayImage)
            .over(BitmapManager.PlayImageOver)
            .down(BitmapManager.PlayImageHit);
        this.addObject(play_button, this.modeSprite);
        play_button.display.position = new Point(
            Flashbang.stageWidth - play_button.container.width - 91.5,
            Flashbang.stageHeight - 30 - play_button.container.height);
        this.regs.add(play_button.clicked.connect(() => this.play()));

        let bgImage: Sprite = Sprite.fromImage(BitmapManager.MissionPuzzleIdImage);
        this.modeSprite.addChild(bgImage);
        bgImage.position = new Point((Flashbang.stageWidth * 0.5) - 420.5, 0);

        let name_label = Fonts.std_light(puzzleName, 18).color(0xFFFFFF).letterSpacing(0).build();
        this.modeSprite.addChild(name_label);
        name_label.position = new Point(
            (Flashbang.stageWidth * 0.5) - 420.5 + MissionIntroMode.PUZZLE_LABEL_X_MARGIN,
            MissionIntroMode.PUZZLE_LABEL_Y_MARGIN);
        let real_width: number = name_label.width;
        if (bgImage) {
            bgImage.width = real_width + MissionIntroMode.PUZZLE_LABEL_X_MARGIN * 2;
        }

        let goals_label = Fonts.std_light("GOAL", 24).color(0xffcc00).build();
        this.modeSprite.addChild(goals_label);
        goals_label.position = new Point(
            (Flashbang.stageWidth * 0.5) - 420.5,
            367 + 15);

        this._goals_background = Sprite.fromImage(BitmapManager.MissionPuzzleThumbnailImage);
        this.modeSprite.addChild(this._goals_background);
        this._goals_background.position = new Point(
            (Flashbang.stageWidth * 0.5) - 420.5,
            367 + 60);

        this._goals_thumbnail = new Sprite();
        this.modeSprite.addChild(this._goals_thumbnail);
        this._goals_thumbnail.position = new Point(
            (Flashbang.stageWidth * 0.5) - 420.5 + 22.5,
            367 + 60 + 22.5);

        this._scroll_up_button = new GameButton().allStates(BitmapManager.ImgUpArrow).hotkey(KeyCode.ArrowUp);
        this._scroll_up_button.display.scale = new Point(0.15, 0.15);
        this._scroll_up_button.display.visible = false;
        this._scroll_up_button.display.position = new Point(
            (Flashbang.stageWidth * 0.5) + 420.5 - this._scroll_up_button.container.width - 30,
            367 + 40);
        this._scroll_up_button.clicked.connect(() => this.scroll_up());
        this.addObject(this._scroll_up_button, this.modeSprite);

        this._scroll_down_button = new GameButton().allStates(BitmapManager.ImgDownArrow).hotkey(KeyCode.ArrowDown);
        this._scroll_down_button.display.scale = new Point(0.15, 0.15);
        this._scroll_down_button.display.visible = false;
        this._scroll_down_button.display.position = new Point(
            (Flashbang.stageWidth * 0.5) + 420.5 - this._scroll_down_button.container.width - 30,
            Flashbang.stageHeight - 55 - play_button.container.height - this._scroll_down_button.container.height - 15);
        this._scroll_down_button.clicked.connect(() => this.scroll_down());
        this.addObject(this._scroll_down_button, this.modeSprite);

        this._constraintsLayer = new Container();
        this.modeSprite.addChild(this._constraintsLayer);
        this.setup_constraint_masks();

        this.set_puzzle_thumbnails(puzzleThumbnails);
    }

    // public set_constraints(constraints: ConstraintBox[]): void {
    //     this._constraints = constraints;
    //     this._constraints_container.set_pos(new UDim(0, 0, 0, 0));
    //     let constraint_height: number = 367 + 60;
    //     for (let constraintBox of this._constraints) {
    //         if (constraintBox.GetKeyword().substr(-5) == "SHAPE") {
    //             continue;
    //         }
    //
    //         constraintBox.set_min_version(true);
    //         constraintBox.refresh_content();
    //         constraintBox.visible = true;
    //         constraintBox.show_big_text(false);
    //         constraintBox.remove_all_animators();
    //         constraintBox.flare(false);
    //         constraintBox.set_pos(new UDim(0.5, 0, -420.5 + this._goals_background.width + 82, constraint_height));
    //
    //         this._constraints_container.addObject(constraintBox);
    //         constraint_height += constraintBox.height + 10;
    //     }
    //     this._constraint_height = constraint_height;
    //     this.check_constraint_scroll();
    // }
    //
    // public transfer_constraints(): void {
    //     for (let constraintBox of this._constraints) {
    //         if (constraintBox.GetKeyword().substr(-5) == "SHAPE") {
    //             continue;
    //         }
    //         constraintBox.set_min_version(false);
    //         constraintBox.refresh_content();
    //         this._constraints_container.remove_object(constraintBox);
    //     }
    // }

    /*override*/
    protected on_resize(): void {
        this.draw_background();
        this.check_constraint_scroll();
        this.setup_constraint_masks();
    }

    private draw_background(): void {
        this._background.clear();
        this._background.beginFill(0x000000);
        this._background.drawRect(0, 0, Flashbang.stageWidth, 367);
        this._background.endFill();

        this._background.beginFill(0x0A1E39, 0.95);
        this._background.drawRect(0, 367, Flashbang.stageWidth, Math.max(Flashbang.stageHeight - 367, 0));
        this._background.endFill();
    }

    private play(): void {
        this.modeStack.popMode();
    }

    private scroll_up(): void {
        // let pos: UDim = this._constraints_container.get_pos();
        // this._constraints_container.set_pos(new UDim(0, 0, pos.get_x(0), Math.min(pos.get_y(0) + 10, 0)));
    }

    private scroll_down(): void {
        // let pos: UDim = this._constraints_container.get_pos();
        // let down_limit: number = -this._constraint_height + 367 + 60 + this._constraints[this._constraints.length - 1].height;
        // this._constraints_container.set_pos(new UDim(0, 0, pos.get_x(0), Math.max(pos.get_y(0) - 10, down_limit)));
    }

    private set_puzzle_thumbnails(targets: number[][]): void {
        this._goals_targets = targets;

        // if (this._goals_targets.length > 1) {
        //     for (let ii: number = 0; ii < this._goals_targets.length; ++ii) {
        //         let new_button: GameButton = new GameButton(22);
        //         new_button.set_text((ii + 1).toString());
        //         new_button.set_pos(new UDim(0.5, 0, -420.5 + ii * (new_button.width + 20), 367 + 60 + this._goals_background.height + 10));
        //
        //         function set_hover_listener(idx: number): void {
        //             new_button.addEventListener(MouseEvent.MOUSE_MOVE, function (e: Event): void {
        //                 this.set_current_puzzle_thumbnail(idx);
        //             });
        //             this.addObject(new_button);
        //         }
        //
        //         this.set_hover_listener(ii);
        //     }
        // }

        this._current_target = -1;
        this.set_current_puzzle_thumbnail(0);
    }

    private set_current_puzzle_thumbnail(index: number): void {
        if (this._current_target == index) {
            return;
        }
        this._current_target = index;

        let target_pairs: number[] = this._goals_targets[index];
        let wrong_pairs: number[] = new Array(target_pairs.length);
        for (let ii = 0; ii < wrong_pairs.length; ii++) {
            wrong_pairs[ii] = -1;
        }
        let sequence: number[] = new Array(target_pairs.length);
        for (let ii = 0; ii < target_pairs.length; ii++) {
            sequence[ii] = EPars.RNABASE_ADENINE;
        }
        PoseThumbnail.drawToSprite(this._goals_thumbnail, sequence, target_pairs, 6, PoseThumbnail.THUMBNAIL_WRONG_COLORED, 0, wrong_pairs, false, 0);
    }

    private check_constraint_scroll(): void {
        let activate_scroll: boolean = this._constraint_height > Flashbang.stageHeight * 0.8;
        this._scroll_up_button.display.visible = activate_scroll;
        this._scroll_down_button.display.visible = activate_scroll;
    }

    private setup_constraint_masks(): void {
        // let top_position: UDim = this._scroll_up_button.get_pos();
        // let bot_position: UDim = this._scroll_down_button.get_pos();
        //
        // let cc_mask: GameObject = new GameObject();
        // cc_mask.graphics.beginFill(0x00FF00);
        // cc_mask.graphics.drawRect(
        //     0,
        //     top_position.get_y(Flashbang.stageHeight),
        //     Flashbang.stageWidth,
        //     bot_position.get_y(Flashbang.stageHeight) + this._scroll_down_button.height - top_position.get_y(Flashbang.stageHeight));
        // cc_mask.x = 0;
        // cc_mask.y = 0;
        // this._constraintsLayer.mask = cc_mask;
    }

    private readonly _background: Graphics;

    private readonly _goals_background: Sprite;
    private readonly _goals_thumbnail: Sprite;

    private _goals_targets: number[][];
    private _current_target: number;

    private readonly _constraintsLayer: Container;
    private _constraints: any[];
    private _constraint_height: number = 0.0;

    private _scroll_up_button: GameButton;
    private _scroll_down_button: GameButton;

    private static readonly PUZZLE_LABEL_X_MARGIN: number = 15;
    private static readonly PUZZLE_LABEL_Y_MARGIN: number = 12;
}