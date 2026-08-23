"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicroPaintEditorProvider = void 0;
const vscode = require("vscode");
const path = require("path");
const iconWebview_1 = require("./iconWebview");
const compiler_1 = require("../compiler/compiler");
class MicroPaintEditorProvider {
    constructor(context) {
        this.context = context;
    }
    static register(context) {
        const provider = new MicroPaintEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(MicroPaintEditorProvider.viewType, provider, {
            webviewOptions: {
                retainContextWhenHidden: true
            },
            supportsMultipleEditorsPerDocument: false
        });
        return providerRegistration;
    }
    async resolveCustomTextEditor(document, webviewPanel, _token) {
        webviewPanel.webview.options = {
            enableScripts: true
        };
        const fileName = path.basename(document.uri.fsPath);
        const initialHex = (0, compiler_1.parseIconFileContent)(document.getText());
        webviewPanel.webview.html = (0, iconWebview_1.getIconEditorHtml)(fileName, initialHex);
        let isUpdatingFromWebview = false;
        // Message received from webview
        webviewPanel.webview.onDidReceiveMessage(async (e) => {
            switch (e.type) {
                case 'change': {
                    isUpdatingFromWebview = true;
                    await this.updateTextDocument(document, e.content);
                    isUpdatingFromWebview = false;
                    break;
                }
                case 'copyDai': {
                    const daiLine = `DAI ${fileName}`;
                    await vscode.env.clipboard.writeText(daiLine);
                    vscode.window.showInformationMessage(`Copied to clipboard: '${daiLine}'`);
                    break;
                }
            }
        });
        // Listen for document changes from outside (e.g. undo/redo or text editor)
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                if (!isUpdatingFromWebview) {
                    const updatedHex = (0, compiler_1.parseIconFileContent)(document.getText());
                    webviewPanel.webview.postMessage({
                        type: 'update',
                        content: updatedHex
                    });
                }
            }
        });
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }
    updateTextDocument(document, newContent) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), newContent + '\n');
        return vscode.workspace.applyEdit(edit);
    }
}
exports.MicroPaintEditorProvider = MicroPaintEditorProvider;
MicroPaintEditorProvider.viewType = 'nanosdk.microPaintEditor';
//# sourceMappingURL=iconEditorProvider.js.map