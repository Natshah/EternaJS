import {Point} from "pixi.js";
import {Fonts} from "../util/Fonts";
import {GamePanel} from "./GamePanel";

export enum FancyGamePanelType {
    NORMAL, INVISIBLE, NEW_NOVA
}

export class FancyGamePanel extends GamePanel {
    constructor(panel_type: FancyGamePanelType = FancyGamePanelType.NORMAL, alpha_val: number = 0.07, color: number = 0xffffff, outlineColor: number = 0xffffff, outline_alpha: number = 0.2) {
        super();
        this._fancy_panel_type = panel_type;
        this._alpha = alpha_val;
        this._outlineColor = outlineColor;
        this._outlineAlpha = outline_alpha;
        this._color = color;
        this._title = null;
        this._title_text = null;
    }

    /*override*/
    public set_panel_title(title: string): void {
        this._title = title;
        this.updateView();
    }

    /*override*/
    public get_title_space(): number {
        return this._title == null ? 0 : 25;
    }

    /*override*/
    protected updateView(): void {
        this._background.clear();

        if (this._width < 0 || this._height < 0 || this._fancy_panel_type == FancyGamePanelType.INVISIBLE) {
            return;
        }

        if (this._title_text != null) {
            this._title_text.destroy({children: true});
            this._title_text = null;
        }

        this._background.clear();

        if (this._fancy_panel_type == FancyGamePanelType.NEW_NOVA && this._title != null) {
            this._background.beginFill(0xC0DCE7, 1.0);
            this._background.drawRoundedRect(-1, -25, this._width + 2, this._height + 26, 8);
            this._background.endFill();

            this._title_text = Fonts.arial(this._title, 13).color(0x061F3A).build();
            this._title_text.position = new Point(3, -21);
            this.container.addChild(this._title_text);

        } else if (this._fancy_panel_type == FancyGamePanelType.NEW_NOVA && this._title == null) {
            // Draw the border by just drawing another round rectangle behind the original
            this._background.beginFill(this._outlineColor, this._outlineAlpha);
            this._background.drawRoundedRect(-1.5, -1.5, this._width + 3, this._height + 3, 8);
            this._background.endFill();
        }

        this._background.beginFill(this._color, this._alpha);
        this._background.drawRoundedRect(0, 0, this._width, this._height, 8);
        this._background.endFill();
    }

    private readonly _fancy_panel_type: FancyGamePanelType;
    private readonly _outlineColor: number;
    private readonly _outlineAlpha: number;
}