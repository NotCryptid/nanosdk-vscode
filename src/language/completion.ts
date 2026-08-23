import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class NanoSDKCompletionProvider implements vscode.CompletionItemProvider {
    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        const line = document.lineAt(position.line);
        const linePrefix = line.text.substring(0, position.character).trimStart();
        const tokens = linePrefix.split(/\s+/);
        const items: vscode.CompletionItem[] = [];

        // 1. If at start of line -> Command completions
        if (tokens.length <= 1) {
            return this.getCommandCompletions(position.line);
        }

        const cmd = tokens[0].toUpperCase();
        const argIdx = tokens.length - 1;

        // 2. Contextual argument completions based on current command
        switch (cmd) {
            case 'DAI': {
                // Complete 'default' + workspace .mpi and .wrt icon files
                const defItem = new vscode.CompletionItem('default', vscode.CompletionItemKind.Value);
                defItem.detail = 'Default MicroOS app icon';
                items.push(defItem);

                const iconFiles = await this.findWorkspaceIconFiles(document.uri);
                for (const file of iconFiles) {
                    const fileItem = new vscode.CompletionItem(file, vscode.CompletionItemKind.File);
                    fileItem.detail = `MicroOS Icon Asset (${path.extname(file)})`;
                    items.push(fileItem);
                }
                return items;
            }

            case 'IFB': {
                if (argIdx === 1) {
                    return this.createKeywords(['var', 'btn', 'spr', 'els', 'end'], vscode.CompletionItemKind.Keyword);
                }
                const sub = tokens[1]?.toLowerCase();
                if (sub === 'var') {
                    if (argIdx === 2) return this.getDocumentVariables(document);
                    if (argIdx === 3) return this.createKeywords(['eql', 'mor', 'les', 'moe', 'loe'], vscode.CompletionItemKind.Operator);
                } else if (sub === 'btn') {
                    if (argIdx === 2) return this.createKeywords(['btna', 'btnb', 'dpdu', 'dpdd', 'dpdl', 'dpdr'], vscode.CompletionItemKind.EnumMember);
                    if (argIdx === 3) return this.createKeywords(['dwn', 'ndn'], vscode.CompletionItemKind.Value);
                } else if (sub === 'spr') {
                    if (argIdx === 2) return this.createKeywords(['psx', 'psy', 'psz', 'vsb'], vscode.CompletionItemKind.Property);
                    if (argIdx === 3) return this.createKeywords(['tch', 'eql', 'mor', 'les', 'moe', 'loe'], vscode.CompletionItemKind.Operator);
                }
                break;
            }

            case 'WHN': {
                if (argIdx === 1) {
                    return this.createKeywords(['sel', 'btn', 'var', 'spr', 'end'], vscode.CompletionItemKind.Keyword);
                }
                const sub = tokens[1]?.toLowerCase();
                if (sub === 'sel') {
                    if (argIdx === 2) {
                        return this.createKeywords(['001', '002', '003', '004'], vscode.CompletionItemKind.Value);
                    }
                } else if (sub === 'btn') {
                    if (argIdx === 2) return this.createKeywords(['btna', 'btnb', 'dpdu', 'dpdd', 'dpdl', 'dpdr'], vscode.CompletionItemKind.EnumMember);
                    if (argIdx === 3) return this.createKeywords(['dwn', 'ndn'], vscode.CompletionItemKind.Value);
                } else if (sub === 'var') {
                    if (argIdx === 2) return this.getDocumentVariables(document);
                    if (argIdx === 3) return this.createKeywords(['eql', 'mor', 'les', 'moe', 'loe'], vscode.CompletionItemKind.Operator);
                }
                break;
            }

            case 'LOP': {
                if (argIdx === 1) {
                    return this.createKeywords(['inf', 'ext', 'end', ':BLW', '005', '010', '100'], vscode.CompletionItemKind.Keyword);
                }
                break;
            }

            case 'CLG': {
                if (argIdx === 1) {
                    return this.createKeywords(['ful', 'scl'], vscode.CompletionItemKind.Value);
                }
                break;
            }

            case 'LGH': {
                if (argIdx === 1) {
                    return this.createKeywords(['off', 'auto', '000', '001'], vscode.CompletionItemKind.Value);
                }
                break;
            }

            case 'LGT': {
                if (argIdx === 1) {
                    return [
                        this.createSimpleItem('d', 'Dark theme'),
                        this.createSimpleItem('l', 'Light theme'),
                        this.createSimpleItem('m', 'Match system theme')
                    ];
                }
                break;
            }

            case 'LSB': {
                if (argIdx === 1) {
                    return this.createKeywords(['on', 'off'], vscode.CompletionItemKind.Value);
                }
                break;
            }

            case 'VRM': {
                if (argIdx === 1) return this.getDocumentVariables(document);
                if (argIdx === 2) return this.createKeywords(['add', 'sub', 'mul', 'div'], vscode.CompletionItemKind.Operator);
                break;
            }

            case 'DVR':
            case 'SVR':
            case 'VCJ':
            case 'LGV': {
                if (argIdx === 1 || (cmd === 'LGV' && argIdx === 2)) {
                    return this.getDocumentVariables(document);
                }
                break;
            }
        }

        // Variable interpolation suggestions (!var!)
        if (linePrefix.endsWith('!')) {
            return this.getDocumentVariables(document, true);
        }

        return items;
    }

    private getCommandCompletions(lineIndex: number): vscode.CompletionItem[] {
        const commands = [
            { label: 'DAN', detail: 'Define Application Name (Line 1)', insert: 'DAN ${1:MyApp}' },
            { label: 'DAI', detail: 'Define Application Icon (Line 2)', insert: 'DAI ${1|default,icon.mpi,icon.wrt|}' },
            { label: 'ASM', detail: 'Application Submenu (Line 3)', insert: 'ASM ${1:main}' },
            { label: 'TXP', detail: 'Title X Position (Line 4)', insert: 'TXP ${1:020}' },
            { label: 'PRN', detail: 'Print popup message', insert: 'PRN ${1:Hello World}' },
            { label: 'END', detail: 'End application', insert: 'END' },
            { label: 'IFB', detail: 'If conditional block', insert: 'IFB var ${1:varName} ${2|eql,mor,les,moe,loe|} ${3:000}\n\t$0\nIFB end' },
            { label: 'LOP', detail: 'Loop block', insert: 'LOP ${1:010}\n\t$0\nLOP end' },
            { label: 'WHN', detail: 'When event listener', insert: 'WHN sel ${1:001}\n\t$0\nWHN end' },
            { label: 'CLG', detail: 'Create ListGUI menu', insert: 'CLG ${1|ful,scl|}' },
            { label: 'LGP', detail: 'ListGUI position (X, Y)', insert: 'LGP ${1:080} ${2:058}' },
            { label: 'LGD', detail: 'ListGUI dimensions (W, H)', insert: 'LGD ${1:160} ${2:097}' },
            { label: 'LGO', detail: 'ListGUI options', insert: 'LGO str${1:2}\n${2:Option 1}\n${3:Option 2}' },
            { label: 'LGS', detail: 'ListGUI set item text', insert: 'LGS ${1:000} ${2:Item Text}' },
            { label: 'LGV', detail: 'ListGUI get item to var', insert: 'LGV ${1:000} ${2:varName}' },
            { label: 'LGR', detail: 'ListGUI remove item', insert: 'LGR ${1:000}' },
            { label: 'DLG', detail: 'Destroy ListGUI', insert: 'DLG' },
            { label: 'LGH', detail: 'ListGUI highlight mode', insert: 'LGH ${1|auto,off|}' },
            { label: 'LGT', detail: 'ListGUI theme', insert: 'LGT ${1|m,d,l|}' },
            { label: 'LSB', detail: 'ListGUI scrollbar indicator', insert: 'LSB ${1|on,off|}' },
            { label: 'DVR', detail: 'Define variable', insert: 'DVR ${1:varName} ${2:000}' },
            { label: 'SVR', detail: 'Set variable', insert: 'SVR ${1:varName} ${2:000}' },
            { label: 'VRM', detail: 'Variable math (add/sub/mul/div)', insert: 'VRM ${1:varName} ${2|add,sub,mul,div|} ${3:001}' },
            { label: 'VCJ', detail: 'Variable content join', insert: 'VCJ ${1:varName} ${2:text}' }
        ];

        return commands.map(c => {
            const item = new vscode.CompletionItem(c.label, vscode.CompletionItemKind.Function);
            item.detail = c.detail;
            item.insertText = new vscode.SnippetString(c.insert);
            return item;
        });
    }

    private createKeywords(words: string[], kind: vscode.CompletionItemKind): vscode.CompletionItem[] {
        return words.map(w => {
            const item = new vscode.CompletionItem(w, kind);
            return item;
        });
    }

    private createSimpleItem(label: string, detail: string): vscode.CompletionItem {
        const item = new vscode.CompletionItem(label, vscode.CompletionItemKind.Value);
        item.detail = detail;
        return item;
    }

    private getDocumentVariables(document: vscode.TextDocument, withClosingBang: boolean = false): vscode.CompletionItem[] {
        const vars = new Set<string>();
        const text = document.getText();
        const regex = /^\s*(DVR|SVR|VRM|VCJ|LGV)\s+([a-zA-Z0-9_]+)/gm;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
            vars.add(match[2]);
        }

        const items: vscode.CompletionItem[] = [];
        for (const v of vars) {
            const item = new vscode.CompletionItem(v + (withClosingBang ? '!' : ''), vscode.CompletionItemKind.Variable);
            item.detail = `Variable: ${v}`;
            items.push(item);
        }
        return items;
    }

    private async findWorkspaceIconFiles(currentDocUri: vscode.Uri): Promise<string[]> {
        const results: string[] = [];
        try {
            const files = await vscode.workspace.findFiles('**/*.{mpi,wrt}', '**/node_modules/**');
            const currentDir = path.dirname(currentDocUri.fsPath);

            for (const file of files) {
                // If in same directory, provide relative basename
                if (path.dirname(file.fsPath) === currentDir) {
                    results.push(path.basename(file.fsPath));
                } else {
                    results.push(path.relative(currentDir, file.fsPath).replace(/\\/g, '/'));
                }
            }
        } catch {
            // Workspace search fallback
        }
        return results;
    }
}
