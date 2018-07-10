import {Flashbang} from "../../../flashbang/core/Flashbang";
import {KeyCode} from "../../../flashbang/input/KeyCode";
import {Dialog} from "../../ui/Dialog";
import {TextInputPanel} from "../../ui/TextInputPanel";
import {SubmitPoseDetails} from "./SubmitPoseDetails";

/** Prompts the player for a title and comment */
export class SubmitPoseDialog extends Dialog<SubmitPoseDetails> {
    /**
     * Returns a new Promise that will resolve if the dialog is confirmed, and fail otherwise.
     * If the Dialog has already been closed, the Promise will never resolve.
     */
    public get promise(): Promise<SubmitPoseDetails> {
        return new Promise((resolve, reject) => {
            this.closed.connect((value) => {
                if (value != null) {
                    resolve(value);
                } else {
                    reject();
                }
            });
        });
    }

    protected added(): void {
        super.added();

        const TITLE = "Title";
        const COMMENT = "Comment";

        let inputPanel = new TextInputPanel();
        inputPanel.set_title("Submit your design");
        let title = inputPanel.add_field(TITLE, 200);
        inputPanel.add_field(COMMENT, 200, true);
        this.addObject(inputPanel, this.container);

        title.setFocus();

        inputPanel.display.position.x = (Flashbang.stageWidth - inputPanel.get_panel_width()) * 0.5;
        inputPanel.display.position.y = (Flashbang.stageHeight - inputPanel.get_panel_height()) * 0.5;

        inputPanel.set_hotkeys(null, null, KeyCode.Escape, null);

        inputPanel.cancelClicked.connect(() => this.close(null));
        inputPanel.okClicked.connect(() => {
            let dict = inputPanel.get_dictionary();
            this.close({title: dict.get(TITLE), comment: dict.get(COMMENT)});
        });
    }
}