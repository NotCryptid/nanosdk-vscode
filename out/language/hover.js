"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NanoSDKHoverProvider = void 0;
const vscode = require("vscode");
const COMMAND_DOCS = {
    DAN: {
        name: 'DAN',
        fullName: 'Define Application Name',
        description: 'Defines the application name listed in the library and title bar. **Must be placed on the first line.**',
        syntax: 'DAN [name]',
        version: '2026.1',
        example: 'DAN Counter'
    },
    DAI: {
        name: 'DAI',
        fullName: 'Define Application Icon',
        description: 'Defines the application icon displayed in the library. **Must be placed on the second line.** Set to `default` or the name of a `.mpi` or `.wrt` icon asset file with extension.',
        syntax: 'DAI [asset_name | default]',
        version: '2026.3',
        example: 'DAI myicon.mpi'
    },
    ASM: {
        name: 'ASM',
        fullName: 'Application Submenu',
        description: 'Defines the application submenu. **Must be defined on the third line.** Can also be called later in code to dynamically change submenus.',
        syntax: 'ASM [submenu_name]',
        version: '2026.1',
        example: 'ASM main'
    },
    TXP: {
        name: 'TXP',
        fullName: 'Title X Position',
        description: 'Defines the application title X position on the title bar. **Must be defined on the fourth line.** Number should be padded to 3 digits.',
        syntax: 'TXP [x_position]',
        version: '2026.1',
        example: 'TXP 020'
    },
    PRN: {
        name: 'PRN',
        fullName: 'Print',
        description: 'Displays a pop-up window with the inputted string message. Supports variable interpolation with `!variable!`.',
        syntax: 'PRN [string]',
        version: '2026.1',
        example: 'PRN Hello World! Current count: !count!'
    },
    END: {
        name: 'END',
        fullName: 'End',
        description: 'Force closes the application. An optional error message can be added.',
        syntax: 'END [optional error message]',
        version: '2026.1',
        example: 'END'
    },
    IFB: {
        name: 'IFB',
        fullName: 'If Bracket',
        description: 'Conditional execution block. Supported conditions include `var` (variable comparison), `btn` (controller button state), `spr` (sprite state), `els` (else), and `end` (close if block).',
        syntax: 'IFB var [var_name] [eql|mor|les|moe|loe] [value]\nIFB btn [btna|btnb|dpdu|dpdd|dpdl|dpdr] [dwn|ndn]\nIFB els\nIFB end',
        version: '2026.1 / 2026.3',
        example: 'IFB var score mor 010\n  PRN You won!\nIFB end'
    },
    LOP: {
        name: 'LOP',
        fullName: 'Loop',
        description: 'Repeats a block of code. Specify a repetition count, `inf` for infinite, `ext` to break from loop, `end` to close loop, or `:BLW` for conditional loop.',
        syntax: 'LOP [count | inf | ext | end | :BLW]',
        version: '2026.1',
        example: 'LOP 005\n  VRM count add 001\nLOP end'
    },
    WHN: {
        name: 'WHN',
        fullName: 'When (Background Event Listener)',
        description: 'Registers an asynchronous background event listener. Skipped during initial pass, then evaluated continuously in the background whenever the condition is met.',
        syntax: 'WHN sel [1-based index]\nWHN btn [button] [dwn|ndn]\nWHN var [var_name] [cmp] [value]\nWHN end',
        version: '2026.1',
        example: 'WHN sel 002\n  VRM count add 001\n  LGS 000 Count: !count!\nWHN end'
    },
    CLG: {
        name: 'CLG',
        fullName: 'Create ListGUI',
        description: 'Initializes a ListGUI menu. Optional presets: `ful` (fullscreen: 160x97 at 80,58) or `scl` (scrollable: 151x97 at 76,58).',
        syntax: 'CLG [ful | scl]',
        version: '2026.2',
        example: 'CLG ful'
    },
    LGP: {
        name: 'LGP',
        fullName: 'ListGUI Position',
        description: 'Sets the center position (X, Y) of the ListGUI menu on screen.',
        syntax: 'LGP [X] [Y]',
        version: '2026.1',
        example: 'LGP 080 058'
    },
    LGD: {
        name: 'LGD',
        fullName: 'ListGUI Dimensions',
        description: 'Sets the width and height dimensions of the ListGUI menu.',
        syntax: 'LGD [Width] [Height]',
        version: '2026.1',
        example: 'LGD 160 097'
    },
    LGO: {
        name: 'LGO',
        fullName: 'ListGUI Options',
        description: 'Populates menu options from strings listed directly below the command. Expects `strN` where N is the number of option lines that follow.',
        syntax: 'LGO str[Amount]\n[Option 1]\n[Option 2]...',
        version: '2026.1',
        example: 'LGO str2\nStart Game\nOptions'
    },
    LGS: {
        name: 'LGS',
        fullName: 'ListGUI Set',
        description: 'Overwrites item text at the specified **0-based index** (`000` = 1st item).',
        syntax: 'LGS [0-based Index] [Value]',
        version: '2026.1',
        example: 'LGS 000 Score: !score!'
    },
    LGV: {
        name: 'LGV',
        fullName: 'ListGUI Value',
        description: 'Writes item text at specified **0-based index** (`000` = 1st item) to the target variable.',
        syntax: 'LGV [0-based Index] [Variable Name]',
        version: '2026.3',
        example: 'LGV 001 selectedItem'
    },
    LGR: {
        name: 'LGR',
        fullName: 'ListGUI Remove',
        description: 'Removes menu item at the specified **0-based index** (`000` = 1st item).',
        syntax: 'LGR [0-based Index]',
        version: '2026.1',
        example: 'LGR 000'
    },
    DLG: {
        name: 'DLG',
        fullName: 'Destroy ListGUI',
        description: 'Clears items and destroys active ListGUI interface element.',
        syntax: 'DLG',
        version: '2026.1',
        example: 'DLG'
    },
    LGH: {
        name: 'LGH',
        fullName: 'ListGUI Highlight',
        description: 'Sets item selection highlight mode (`off`, `auto`, or explicit 0-based index).',
        syntax: 'LGH [off | auto | 0-based Index]',
        version: '2026.1',
        example: 'LGH auto'
    },
    LGT: {
        name: 'LGT',
        fullName: 'ListGUI Theme',
        description: 'Sets ListGUI color theme (`d` for dark, `l` for light, `m` for match system theme).',
        syntax: 'LGT [d | l | m]',
        version: '2026.2',
        example: 'LGT m'
    },
    LSB: {
        name: 'LSB',
        fullName: 'ListGUI Scroll Bar',
        description: 'Toggles visibility of the scroll bar indicator (`on` / `off`).',
        syntax: 'LSB [on | off]',
        version: '2026.2',
        example: 'LSB on'
    },
    DVR: {
        name: 'DVR',
        fullName: 'Define Variable',
        description: 'Defines a new variable with an initial value.',
        syntax: 'DVR [variable_name] [initial_value]',
        version: '2026.3',
        example: 'DVR count 000'
    },
    SVR: {
        name: 'SVR',
        fullName: 'Set Variable',
        description: 'Sets the variable value.',
        syntax: 'SVR [variable_name] [new_value]',
        version: '2026.3',
        example: 'SVR count 000'
    },
    VRM: {
        name: 'VRM',
        fullName: 'Variable Math',
        description: 'Performs arithmetic on a variable and assigns the result back. Supported operators: `add`, `sub`, `mul`, `div`.',
        syntax: 'VRM [variable_name] [add|sub|mul|div] [number]',
        version: '2026.3',
        example: 'VRM count add 001'
    },
    VCJ: {
        name: 'VCJ',
        fullName: 'Variable Content Join',
        description: 'Appends a string (or value of another variable) onto the end of a variable.',
        syntax: 'VCJ [variable_name] [text or !variable!]',
        version: '2026.3',
        example: 'VCJ greeting  World'
    }
};
class NanoSDKHoverProvider {
    provideHover(document, position) {
        const wordRange = document.getWordRangeAtPosition(position, /[:!A-Za-z0-9_]+/);
        if (!wordRange)
            return null;
        const word = document.getText(wordRange);
        const upper = word.toUpperCase();
        // Check command docs
        if (COMMAND_DOCS[upper]) {
            const doc = COMMAND_DOCS[upper];
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`### ${doc.name} — **${doc.fullName}**\n\n`);
            md.appendMarkdown(`${doc.description}\n\n`);
            md.appendMarkdown(`**Syntax:** \`${doc.syntax}\`\n\n`);
            if (doc.example) {
                md.appendCodeblock(doc.example, 'nanosdk');
            }
            md.appendMarkdown(`\n*MicroOS Version:* \`${doc.version}\``);
            return new vscode.Hover(md, wordRange);
        }
        // Variable interpolation hover
        if (word.startsWith('!') || word.endsWith('!')) {
            const varName = word.replace(/!/g, '');
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`### Variable Reference: \`${varName}\`\n\n`);
            md.appendMarkdown(`Dynamically resolves to the runtime value of variable **${varName}**.`);
            return new vscode.Hover(md, wordRange);
        }
        // Continuation hover
        if (upper === ':BLW') {
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`### \`:BLW\` — **Below Continuation**\n\n`);
            md.appendMarkdown(`Allows commands or strings to extend onto the line below, bypassing the MicroOS on-screen keyboard 36-character limit.`);
            return new vscode.Hover(md, wordRange);
        }
        return null;
    }
}
exports.NanoSDKHoverProvider = NanoSDKHoverProvider;
//# sourceMappingURL=hover.js.map