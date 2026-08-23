"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NanoSDKCodeActionProvider = exports.NanoSDKDocumentFormatter = void 0;
const vscode = require("vscode");
const compiler_1 = require("../compiler/compiler");
class NanoSDKDocumentFormatter {
    provideDocumentFormattingEdits(document, _options, _token) {
        const edits = [];
        let indentLevel = 0;
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const raw = line.text.trim();
            if (raw === '' || raw.startsWith('//') || raw.startsWith('#')) {
                continue;
            }
            // Check if line decreases indent
            const isDecreaser = /^(IFB\s+(els|end)|LOP\s+end|WHN\s+end)\b/i.test(raw);
            if (isDecreaser) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            const desiredIndent = '  '.repeat(indentLevel);
            const formattedLine = desiredIndent + raw;
            if (line.text !== formattedLine) {
                edits.push(vscode.TextEdit.replace(line.range, formattedLine));
            }
            // Check if line increases indent
            const isIncreaser = /^(IFB(?!\s+end)|LOP(?!\s+end)|WHN(?!\s+end))\b/i.test(raw);
            if (isIncreaser) {
                indentLevel++;
            }
        }
        return edits;
    }
}
exports.NanoSDKDocumentFormatter = NanoSDKDocumentFormatter;
class NanoSDKCodeActionProvider {
    provideCodeActions(document, range, context, _token) {
        const actions = [];
        for (const diagnostic of context.diagnostics) {
            if (diagnostic.code === 'PAD_NUMBER') {
                const text = document.getText(diagnostic.range);
                const padded = (0, compiler_1.nsc_pad)(text);
                const fix = new vscode.CodeAction(`Pad number to '${padded}'`, vscode.CodeActionKind.QuickFix);
                fix.edit = new vscode.WorkspaceEdit();
                fix.edit.replace(document.uri, diagnostic.range, padded);
                fix.isPreferred = true;
                actions.push(fix);
            }
            if (diagnostic.code === 'LINE_TOO_LONG') {
                const fix = new vscode.CodeAction(`Break line with :BLW`, vscode.CodeActionKind.QuickFix);
                const line = document.lineAt(diagnostic.range.start.line);
                const lineText = line.text;
                // Suggest splitting around 30 chars
                const splitPoint = lineText.lastIndexOf(' ', 30);
                if (splitPoint > 5) {
                    const firstPart = lineText.substring(0, splitPoint).trim() + ' :BLW';
                    const secondPart = '  ' + lineText.substring(splitPoint).trim();
                    fix.edit = new vscode.WorkspaceEdit();
                    fix.edit.replace(document.uri, line.range, `${firstPart}\n${secondPart}`);
                    actions.push(fix);
                }
            }
            if (diagnostic.code === 'ICON_NOT_FOUND') {
                const createIconFix = new vscode.CodeAction(`Create new icon asset with Micro Paint`, vscode.CodeActionKind.QuickFix);
                createIconFix.command = {
                    command: 'nanosdk.newIcon',
                    title: 'Create Micro Paint Icon'
                };
                actions.push(createIconFix);
                const useDefaultFix = new vscode.CodeAction(`Use default icon ('DAI default')`, vscode.CodeActionKind.QuickFix);
                const line = document.lineAt(diagnostic.range.start.line);
                useDefaultFix.edit = new vscode.WorkspaceEdit();
                useDefaultFix.edit.replace(document.uri, line.range, 'DAI default');
                actions.push(useDefaultFix);
            }
        }
        return actions;
    }
}
exports.NanoSDKCodeActionProvider = NanoSDKCodeActionProvider;
//# sourceMappingURL=formatter.js.map