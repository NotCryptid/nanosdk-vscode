"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const compiler_1 = require("./compiler/compiler");
const decompiler_1 = require("./compiler/decompiler");
const diagnostics_1 = require("./diagnostics/diagnostics");
const hover_1 = require("./language/hover");
const completion_1 = require("./language/completion");
const formatter_1 = require("./language/formatter");
const iconEditorProvider_1 = require("./iconCreator/iconEditorProvider");
const DEFAULT_ICON_MPI = `0AAAABB0
AA1AB1B3
AA11B133
AA11B133
AB1B1132
BB131122
BB133122
03332220`;
function activate(context) {
    // 1. Diagnostic Collection
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('nanosdk');
    context.subscriptions.push(diagnosticCollection);
    // Diagnostics triggers
    if (vscode.window.activeTextEditor) {
        (0, diagnostics_1.updateDiagnostics)(vscode.window.activeTextEditor.document, diagnosticCollection);
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            (0, diagnostics_1.updateDiagnostics)(editor.document, diagnosticCollection);
            updateStatusBar(editor);
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
        (0, diagnostics_1.updateDiagnostics)(e.document, diagnosticCollection);
    }));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => {
        diagnosticCollection.delete(doc.uri);
    }));
    // 2. Language Features: Hover, Completion, Formatter, Code Actions
    context.subscriptions.push(vscode.languages.registerHoverProvider('nanosdk', new hover_1.NanoSDKHoverProvider()));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('nanosdk', new completion_1.NanoSDKCompletionProvider(), ' ', '!', '.', ':'));
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('nanosdk', new formatter_1.NanoSDKDocumentFormatter()));
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider('nanosdk', new formatter_1.NanoSDKCodeActionProvider()));
    // 3. Custom Editor for Micro Paint (.mpi / .wrt)
    context.subscriptions.push(iconEditorProvider_1.MicroPaintEditorProvider.register(context));
    // 4. Status Bar Item for 1-Click Compilation
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'nanosdk.compile';
    statusBarItem.text = '$(play) Compile to NSA';
    statusBarItem.tooltip = 'Compile NanoSDK Project to MicroOS Application (.nsa)';
    context.subscriptions.push(statusBarItem);
    function updateStatusBar(editor) {
        if (editor && editor.document.languageId === 'nanosdk') {
            statusBarItem.show();
        }
        else {
            statusBarItem.hide();
        }
    }
    updateStatusBar(vscode.window.activeTextEditor);
    // 5. Command: Compile to NSA
    context.subscriptions.push(vscode.commands.registerCommand('nanosdk.compile', async (uri) => {
        let targetUri = uri;
        if (!targetUri) {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'nanosdk') {
                vscode.window.showErrorMessage('Please open a NanoSDK (.nsp) file to compile.');
                return;
            }
            targetUri = editor.document.uri;
        }
        const doc = await vscode.workspace.openTextDocument(targetUri);
        const sourceCode = doc.getText();
        const sourcePath = targetUri.fsPath;
        const res = await (0, compiler_1.compileNanoSDK)(sourceCode, {
            sourceFilePath: sourcePath
        });
        if (!res.success || !res.nsaContent) {
            const errMsg = res.errors.join('\n');
            vscode.window.showErrorMessage(`NanoSDK Compilation Failed:\n${errMsg}`);
            return;
        }
        // Write .nsa file
        const dir = path.dirname(sourcePath);
        const baseName = path.basename(sourcePath, path.extname(sourcePath));
        const nsaPath = path.join(dir, `${baseName}.nsa`);
        fs.writeFileSync(nsaPath, res.nsaContent, 'utf8');
        let msg = `Successfully compiled '${res.metadata?.appName || baseName}' to ${path.basename(nsaPath)}!`;
        if (res.warnings.length > 0) {
            msg += ` (${res.warnings.length} warning(s))`;
        }
        const action = await vscode.window.showInformationMessage(msg, 'Inspect Binary', 'Open Folder');
        if (action === 'Inspect Binary') {
            const nsaDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(nsaPath));
            await vscode.window.showTextDocument(nsaDoc, { preview: false });
        }
        else if (action === 'Open Folder') {
            vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(nsaPath));
        }
    }));
    // 6. Command: New NanoSDK Project (.nsp)
    context.subscriptions.push(vscode.commands.registerCommand('nanosdk.newProject', async () => {
        const appName = await vscode.window.showInputBox({
            prompt: 'Enter Application Name',
            placeHolder: 'MyGame',
            value: 'MyGame'
        });
        if (!appName)
            return;
        const safeName = appName.replace(/[^a-zA-Z0-9_-]/g, '');
        const folderUri = getTargetDirectoryUri();
        const nspUri = vscode.Uri.joinPath(folderUri, `${safeName}.nsp`);
        const mpiUri = vscode.Uri.joinPath(folderUri, `${safeName}.mpi`);
        // Create paired .mpi icon file
        if (!fs.existsSync(mpiUri.fsPath)) {
            fs.writeFileSync(mpiUri.fsPath, DEFAULT_ICON_MPI + '\n', 'utf8');
        }
        // Create .nsp project file
        const nspContent = `DAN ${appName}
DAI ${safeName}.mpi
ASM main
TXP 020

// NanoSDK Project: ${appName}
DVR count 000
CLG ful
LGH auto
LGO str3
Count: !count!
Increment
Reset

WHN sel 002
  VRM count add 001
  LGS 000 Count: !count!
WHN end

WHN sel 003
  SVR count 000
  LGS 000 Count: 000
WHN end

LOP inf
LOP end
`;
        fs.writeFileSync(nspUri.fsPath, nspContent, 'utf8');
        const nspDoc = await vscode.workspace.openTextDocument(nspUri);
        await vscode.window.showTextDocument(nspDoc);
        vscode.window.showInformationMessage(`Created NanoSDK project '${safeName}.nsp' with paired icon '${safeName}.mpi'!`);
    }));
    // 7. Command: New Micro Paint Icon (.mpi)
    context.subscriptions.push(vscode.commands.registerCommand('nanosdk.newIcon', async () => {
        const iconName = await vscode.window.showInputBox({
            prompt: 'Enter Icon Asset File Name',
            placeHolder: 'icon.mpi',
            value: 'icon.mpi'
        });
        if (!iconName)
            return;
        let fileName = iconName;
        if (!fileName.endsWith('.mpi')) {
            fileName += '.mpi';
        }
        const folderUri = getTargetDirectoryUri();
        const iconUri = vscode.Uri.joinPath(folderUri, fileName);
        fs.writeFileSync(iconUri.fsPath, DEFAULT_ICON_MPI + '\n', 'utf8');
        // Open with custom visual editor
        await vscode.commands.executeCommand('vscode.openWith', iconUri, iconEditorProvider_1.MicroPaintEditorProvider.viewType);
        vscode.window.showInformationMessage(`Created Micro Paint icon '${fileName}'!`);
    }));
    // 8. Command: Open Micro Paint Icon Creator
    context.subscriptions.push(vscode.commands.registerCommand('nanosdk.openIconCreator', async (uri) => {
        if (uri && uri.fsPath.endsWith('.mpi')) {
            await vscode.commands.executeCommand('vscode.openWith', uri, iconEditorProvider_1.MicroPaintEditorProvider.viewType);
        }
        else {
            await vscode.commands.executeCommand('nanosdk.newIcon');
        }
    }));
    // 9. Command: Decompile / Inspect NSA Binary
    context.subscriptions.push(vscode.commands.registerCommand('nanosdk.decompile', async (uri) => {
        let targetUri = uri;
        if (!targetUri) {
            const selected = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: { 'NanoSDK Application': ['nsa'] }
            });
            if (!selected || selected.length === 0)
                return;
            targetUri = selected[0];
        }
        const rawContent = fs.readFileSync(targetUri.fsPath, 'utf8');
        const disassembled = (0, decompiler_1.decompileNSA)(rawContent);
        let breakdown = `# Disassembly Breakdown: ${disassembled.appName}\n\n`;
        breakdown += `- **Application Name:** \`${disassembled.appName}\`\n`;
        breakdown += `- **Submenu:** \`${disassembled.submenu}\`\n`;
        breakdown += `- **Title X Position:** \`${disassembled.txp}\`\n`;
        breakdown += `- **Icon Data:** \`${disassembled.iconHex.length === 64 ? '64-nibble pixel data (' + disassembled.iconHex.substring(0, 16) + '...)' : disassembled.iconHex}\`\n`;
        breakdown += `- **Total Instructions:** ${disassembled.instructions.length}\n\n`;
        breakdown += `## Instructions\n\n`;
        breakdown += `| # | Opcode | Raw Bytecode | NanoSDK Instruction | Description |\n`;
        breakdown += `|---|---|---|---|---|\n`;
        disassembled.instructions.forEach((ins, idx) => {
            const cleanInst = ins.instruction.replace(/\n/g, ' ');
            breakdown += `| ${idx + 1} | \`${ins.opcode}\` | \`${ins.raw}\` | \`${cleanInst}\` | ${ins.description} |\n`;
        });
        const doc = await vscode.workspace.openTextDocument({
            content: breakdown,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc, { preview: false });
    }));
    // 10. Command: Format & Pad Numbers to 3 Digits
    context.subscriptions.push(vscode.commands.registerCommand('nanosdk.formatPad', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'nanosdk')
            return;
        const doc = editor.document;
        const edit = new vscode.WorkspaceEdit();
        for (let i = 0; i < doc.lineCount; i++) {
            const line = doc.lineAt(i);
            const raw = line.text;
            if (raw.trim().startsWith('//') || raw.trim().startsWith('#'))
                continue;
            // Pad stand-alone 1 or 2 digit numbers
            const replaced = raw.replace(/\b(-?\d{1,2})\b/g, (match) => {
                return (0, compiler_1.nsc_pad)(match);
            });
            if (replaced !== raw) {
                edit.replace(doc.uri, line.range, replaced);
            }
        }
        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage('Numbers formatted and padded to 3 digits.');
    }));
    // 11. Auto-compile on save listener
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (doc) => {
        if (doc.languageId === 'nanosdk') {
            const config = vscode.workspace.getConfiguration('nanosdk');
            if (config.get('compiler.autoCompileOnSave', false)) {
                await vscode.commands.executeCommand('nanosdk.compile', doc.uri);
            }
        }
    }));
}
function getTargetDirectoryUri() {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return vscode.workspace.workspaceFolders[0].uri;
    }
    const activeDoc = vscode.window.activeTextEditor?.document;
    if (activeDoc && activeDoc.uri.scheme === 'file') {
        return vscode.Uri.file(path.dirname(activeDoc.uri.fsPath));
    }
    return vscode.Uri.file(process.cwd());
}
function deactivate() { }
//# sourceMappingURL=extension.js.map