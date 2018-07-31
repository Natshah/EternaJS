import {PoseEditMode} from "../mode/PoseEdit/PoseEditMode";
import {Puzzle} from "../puzzle/Puzzle";
import {ROPHighlight, ROPHighlightMode} from "./ROPHighlight";
import {ROPHint} from "./ROPHint";
import {ROPPre} from "./ROPPre";
import {ROPRNA, ROPRNAType} from "./ROPRNA";
import {ROPTextbox, ROPTextboxMode} from "./ROPTextbox";
import {ROPUI} from "./ROPUI";
import {ROPWait, ROPWaitType} from "./ROPWait";
import {RScriptEnv} from "./RScriptEnv";
import {RScriptOp} from "./RScriptOp";
import {RScriptOpTree} from "./RScriptOpTree";

export class RNAScript {
    public constructor(puz: Puzzle, ui: PoseEditMode) {
        let strData: string = puz.get_rscript();

        this._env = new RScriptEnv(ui, puz);
        ui.addObject(this._env, ui.modeSprite);

        ROPWait.ClearROPWait();
        this._ops = new RScriptOpTree();

        // Convert string into instructions by splitting at semicolons.
        // If we ever make "Blocks" (i.e for IF conditionals), we'll need to make this a little
        // more complex
        let instructions: string[] = strData.split(";");

        // For each instruction, make it into an RScriptOp (OP).
        // Give it to the OpTree to handle placing it where it should go.
        for (let instruction of instructions) {
            this._ops.AddNode(this.CreateOpFromInstruction(instruction));
        }
        this._ops.FinishCreation();
    }

    /** Notify us when RNA is completed (or puzzle finishes). */
    public FinishLevel(): void {
        ROPWait.NotifyFinishRNA();
        if (this._env) {
            this._env.Cleanup();
        }
    }

    /** Executes an instruction from the RScript Instruction Stream. */
    public Tick(): void {
        // Do not allow us to start executing instructions until the RNA loads properly
        // Also serves to prevent us from positioning anything in relation to the RNA when
        // the RNA bases are in the middle of folding.
        if (this._env.GetRNA().is_folding() || !this._env.GetUI().is_playing()) {
            return;
        }

        let node: RScriptOp = this._ops.next();
        while (node) {
            node.exec();

            if (this._env.GetRNA().is_folding() || !this._env.GetUI().is_playing()) {
                return;
            }

            node = this._ops.next();
        }
    }

    private CreateOpFromInstruction(instruction: string): RScriptOp {
        instruction = instruction.replace(/^\s*/, "");
        instruction = instruction.replace(/\s*$/, "");
        if (instruction == "") {
            return null;
        }

        let instRegex: RegExp = /(\#PRE\-)?(\w+)\s*(.*)/ig;
        let regResult: RegExpExecArray;
        if ((regResult = instRegex.exec(instruction)) != null) {
            let op: string = (regResult[1] ? regResult[1] : "") + regResult[2];
            let args: string = regResult[3];
            // Based on the OP, create the proper RScriptOp.
            let ret: RScriptOp = this.OpToRScriptOp(op, args);
            if (ret) {
                ret.InitializeROP(op, args);
            }
            return ret;
        } else {
            throw new Error("Invalid instruction format :: " + instruction);
        }
    }

    private OpToRScriptOp(op: string, args: string): RScriptOp {
        // Strip op of any pre/post white space
        op = op.replace(/^\s*/, "");
        op = op.replace(/\s*$/, "");

        // Regex to detect the various commands
        let textboxRegex: RegExp = /(Show|Hide)(Textbox|Arrow)(Location|Nucleotide)?/ig;
        let highlightRegex: RegExp = /(Show|Hide)(UI)?Highlight/ig;
        let uiRegex: RegExp = /(Show|Hide|Enable|Disable)UI$/ig;
        let hintRegex: RegExp = /(Show|Hide)(Paint)?Hint/ig;
        let waitRegex: RegExp = /WaitFor(.*)/ig;
        let preRegex: RegExp = /#PRE-(.*)/g;
        let rnaRegex: RegExp = /^RNA(SetBase|ChangeMode|EnableModification|SetPainter|ChangeState|SetZoom|SetPIP)$/ig;

        let regResult: any[];
        if ((regResult = preRegex.exec(op)) != null) {
            let rop: ROPPre = new ROPPre(regResult[1], this._env);
            rop.InitArgs(args);
            rop.exec();
            // DOES NOT RETURN. WE DO NOT ADD THIS TO THE OP TREE.
            return null;
        } else if ((regResult = textboxRegex.exec(op))) {
            let textboxMode: ROPTextboxMode;
            if (regResult[2].toUpperCase() == "ARROW") {
                if (regResult[3]) {
                    textboxMode = regResult[3].toUpperCase() == "LOCATION" ?
                        ROPTextboxMode.ARROW_LOCATION :
                        ROPTextboxMode.ARROW_NUCLEOTIDE;
                } else {
                    textboxMode = ROPTextboxMode.ARROW_DEFAULT;
                }
            } else {
                if (regResult[3]) {
                    textboxMode = regResult[3].toUpperCase() == "LOCATION" ?
                        ROPTextboxMode.TEXTBOX_LOCATION :
                        ROPTextboxMode.TEXTBOX_NUCLEOTIDE;
                } else {
                    textboxMode = ROPTextboxMode.TEXTBOX_DEFAULT;
                }
            }

            let show: boolean = regResult[1].toUpperCase() == "SHOW";
            return new ROPTextbox(this._env, show, textboxMode);

        } else if ((regResult = highlightRegex.exec(op))) {
            return new ROPHighlight(
                regResult[1].toUpperCase() == "SHOW",
                regResult[2] ? ROPHighlightMode.UI : ROPHighlightMode.RNA,
                this._env);
        } else if ((regResult = uiRegex.exec(op))) {
            return new ROPUI(this._env, regResult[1].toUpperCase() != "HIDE", regResult[1].toUpperCase() == "DISABLE");
        } else if ((regResult = hintRegex.exec(op))) {
            return new ROPHint(regResult[1].toUpperCase() == "SHOW", this._env);
        } else if ((regResult = waitRegex.exec(op))) {
            let waitType: ROPWaitType = regResult[1].toUpperCase();
            return new ROPWait(waitType, this._env);
        } else if ((regResult = rnaRegex.exec(op))) {
            let ropRNAType: ROPRNAType = regResult[1].toUpperCase();
            return new ROPRNA(ropRNAType, this._env);
        }
        // Shouldn't reach here ever.
        throw new Error("Invalid operation: " + op);
    }

    private _env: RScriptEnv;
    private _ops: RScriptOpTree;
}