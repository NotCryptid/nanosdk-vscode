import * as vscode from 'vscode';
import * as path from 'path';
import { getIconEditorHtml } from './iconWebview';
import { parseIconFileContent } from '../compiler/compiler';

export class MicroPaintEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'nanosdk.microPaintEditor';

    constructor(private readonly context: vscode.ExtensionContext) {}

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new MicroPaintEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            MicroPaintEditorProvider.viewType,
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                },
                supportsMultipleEditorsPerDocument: false
            }
        );
        return providerRegistration;
    }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true
        };

        const fileName = path.basename(document.uri.fsPath);
        const initialHex = parseIconFileContent(document.getText());

        webviewPanel.webview.html = getIconEditorHtml(fileName, initialHex);

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
                    const updatedHex = parseIconFileContent(document.getText());
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

    private updateTextDocument(document: vscode.TextDocument, newContent: string) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            newContent + '\n'
        );
        return vscode.workspace.applyEdit(edit);
    }
}
