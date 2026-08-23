#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { SerialProtocolClient } from './serialProtocolClient';

// Resolved once at startup from --port=<path> / NANOCODE_SERIAL_PORT so the
// server can be launched either from the extension (which knows the
// configured nanosdk.mcp.serialPort setting) or by hand for local testing.
function resolveSerialPortPath(): string {
    const argPort = process.argv.find((a) => a.startsWith('--port='));
    const path = (argPort && argPort.slice('--port='.length)) || process.env.NANOCODE_SERIAL_PORT;
    if (!path) {
        throw new Error('No serial port given. Pass --port=<path> or set NANOCODE_SERIAL_PORT.');
    }
    return path;
}

function textResult(text: string) {
    return { content: [{ type: 'text' as const, text }] };
}

function errorResult(message: string) {
    return { content: [{ type: 'text' as const, text: message }], isError: true };
}

async function main() {
    const serialPath = resolveSerialPortPath();
    const client = new SerialProtocolClient(serialPath);

    const server = new McpServer({ name: 'nanocode-mcp', version: '1.0.0' });

    server.registerTool(
        'get_open_project',
        {
            title: 'Get Open NanoCode Project',
            description:
                "Returns the name and line count of the NanoSDK project currently open in the MicroOS device's on-device NanoCode editor. " +
                "Reflects live unsaved edits, not just what's on disk. Reports not-open if NanoCode isn't the foreground app on the device.",
            inputSchema: {},
        },
        async () => {
            try {
                await client.connect();
                const status = await client.request('editor.status');
                if (!status.open) {
                    return textResult('NanoCode is not open on the device.');
                }
                return textResult(`Project: ${status.name}\nLines: ${status.lineCount}`);
            } catch (e: any) {
                return errorResult(`Failed to get open project: ${e.message}`);
            }
        }
    );

    server.registerTool(
        'read_file',
        {
            title: 'Read Open Project Lines',
            description:
                'Reads lines [line_start, line_end] (1-indexed, inclusive) from the NanoSDK project currently open in the device NanoCode editor. ' +
                'Errors if NanoCode is not open on the device.',
            inputSchema: {
                line_start: z.number().int().min(1).describe('First line to read (1-indexed, inclusive).'),
                line_end: z.number().int().min(1).describe('Last line to read (1-indexed, inclusive).'),
            },
        },
        async ({ line_start, line_end }) => {
            try {
                await client.connect();
                const result = await client.request('editor.read', { line_start, line_end });
                const numbered = (result.lines as string[])
                    .map((l, i) => `${result.line_start + i}: ${l}`)
                    .join('\n');
                return textResult(numbered);
            } catch (e: any) {
                return errorResult(`Failed to read file: ${e.message}`);
            }
        }
    );

    server.registerTool(
        'edit_file',
        {
            title: 'Edit Open Project',
            description:
                'Replaces the single exact occurrence of old_string with new_string in the NanoSDK project currently open in the device ' +
                'NanoCode editor. old_string must match exactly once against the full file text (lines joined with \\n) -- errors if it ' +
                "matches zero or multiple times. Edits the device's live editor buffer immediately (the human still controls when it's " +
                'saved to disk via the on-device Save action). Errors if NanoCode is not open on the device.',
            inputSchema: {
                old_string: z.string().min(1).describe('Exact text to find; must be unique in the file.'),
                new_string: z.string().describe('Text to replace it with.'),
            },
        },
        async ({ old_string, new_string }) => {
            try {
                await client.connect();
                const result = await client.request('editor.edit', { old_string, new_string });
                return textResult(`Edited '${result.name}'. New line count: ${result.lineCount}`);
            } catch (e: any) {
                return errorResult(`Failed to edit file: ${e.message}`);
            }
        }
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((err) => {
    process.stderr.write(`nanocode-mcp fatal error: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
});
