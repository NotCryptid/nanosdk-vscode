"use strict";
/**
 * Micro Paint Icon Creator Webview Generator
 * Generates the self-contained HTML/CSS/JS for the pixel art icon editor.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MICROOS_PALETTE = void 0;
exports.getIconEditorHtml = getIconEditorHtml;
exports.MICROOS_PALETTE = [
    { hexKey: '0', color: 'rgba(0,0,0,0)', name: '0: Transparent' },
    { hexKey: '1', color: '#FFFFFF', name: '1: White' },
    { hexKey: '2', color: '#590094', name: '2: Dark Purple' },
    { hexKey: '3', color: '#7A00B3', name: '3: Purple' },
    { hexKey: '4', color: '#0148EF', name: '4: Blue' },
    { hexKey: '5', color: '#0091FF', name: '5: Light Blue' },
    { hexKey: '6', color: '#803D00', name: '6: Brown' },
    { hexKey: '7', color: '#B67CFE', name: '7: Lavender' },
    { hexKey: '8', color: '#008033', name: '8: Green' },
    { hexKey: '9', color: '#EF9EFF', name: '9: Pink' },
    { hexKey: 'A', color: '#FF00AE', name: 'A: Magenta' },
    { hexKey: 'B', color: '#FFAE00', name: 'B: Orange' },
    { hexKey: 'C', color: '#32008F', name: 'C: Deep Blue' },
    { hexKey: 'D', color: '#969696', name: 'D: Gray' },
    { hexKey: 'E', color: '#373737', name: 'E: Dark Gray' },
    { hexKey: 'F', color: '#000000', name: 'F: Black' }
];
function getIconEditorHtml(fileName, initialHexData) {
    const paletteJson = JSON.stringify(exports.MICROOS_PALETTE);
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Micro Paint - ${fileName}</title>
    <style>
        :root {
            --bg-color: var(--vscode-editor-background, #1e1e1e);
            --fg-color: var(--vscode-editor-foreground, #d4d4d4);
            --panel-bg: var(--vscode-sideBar-background, #252526);
            --border-color: var(--vscode-panel-border, #3c3c3c);
            --btn-bg: var(--vscode-button-background, #0e639c);
            --btn-fg: var(--vscode-button-foreground, #ffffff);
            --btn-hover: var(--vscode-button-hoverBackground, #1177bb);
            --active-border: var(--vscode-focusBorder, #007acc);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            user-select: none;
        }

        body {
            background-color: var(--bg-color);
            color: var(--fg-color);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            height: 100vh;
            overflow-y: auto;
        }

        header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 10px;
        }

        h1 {
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .badge {
            font-size: 0.75rem;
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            padding: 2px 8px;
            border-radius: 4px;
            color: #4fc1ff;
        }

        .main-layout {
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
            align-items: flex-start;
        }

        .editor-column {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .toolbar {
            display: flex;
            gap: 8px;
            background: var(--panel-bg);
            padding: 8px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
        }

        button.tool-btn {
            background: transparent;
            color: var(--fg-color);
            border: 1px solid transparent;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: background 0.15s, border-color 0.15s;
        }

        button.tool-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        button.tool-btn.active {
            background: var(--btn-bg);
            color: var(--btn-fg);
            border-color: var(--active-border);
        }

        .canvas-container {
            position: relative;
            background: repeating-conic-gradient(#222 0% 25%, #333 0% 50%) 50% / 20px 20px;
            border: 2px solid var(--border-color);
            border-radius: 6px;
            width: 320px;
            height: 320px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        #pixelCanvas {
            width: 320px;
            height: 320px;
            image-rendering: pixelated;
            cursor: crosshair;
            display: block;
        }

        .palette-column {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 340px;
        }

        .panel-box {
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .panel-box h3 {
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #888;
        }

        .palette-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
        }

        .color-swatch {
            height: 36px;
            border-radius: 4px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: bold;
            text-shadow: 0 0 2px #000, 0 0 4px #000;
            position: relative;
            transition: transform 0.1s, border-color 0.1s;
        }

        .color-swatch:hover {
            transform: scale(1.05);
            border-color: #fff;
        }

        .color-swatch.selected {
            border: 3px solid #00ffff;
            box-shadow: 0 0 8px #00ffff;
            transform: scale(1.08);
            z-index: 2;
        }

        .color-swatch[data-key="0"] {
            background: repeating-conic-gradient(#444 0% 25%, #666 0% 50%) 50% / 10px 10px !important;
            color: #fff;
        }

        .preview-box {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 8px 0;
        }

        .preview-canvas {
            image-rendering: pixelated;
            border: 1px solid var(--border-color);
            background: repeating-conic-gradient(#222 0% 25%, #333 0% 50%) 50% / 8px 8px;
        }

        .microos-preview-bar {
            background: #000;
            border-radius: 6px;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            border: 1px solid #444;
        }

        .microos-taskbar-icon {
            width: 16px;
            height: 16px;
            image-rendering: pixelated;
        }

        .microos-app-title {
            font-family: monospace;
            font-size: 0.85rem;
            color: #fff;
        }

        .actions-row {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .btn-action {
            background: #333;
            color: #ddd;
            border: 1px solid var(--border-color);
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 0.8rem;
            cursor: pointer;
        }

        .btn-action:hover {
            background: #444;
            color: #fff;
        }

        .btn-primary {
            background: var(--btn-bg);
            color: var(--btn-fg);
            border: 1px solid var(--active-border);
            padding: 6px 12px;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
        }

        .btn-primary:hover {
            background: var(--btn-hover);
        }

        .hex-dump {
            font-family: monospace;
            font-size: 0.75rem;
            background: #111;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #333;
            word-break: break-all;
            user-select: text;
        }
    </style>
</head>
<body>
    <header>
        <h1>
            <span>🎨 Micro Paint Icon Creator</span>
            <span class="badge">8x8 • 16-Color Palette</span>
        </h1>
        <div>
            <button id="btnSaveCopy" class="btn-primary">📋 Copy DAI Line</button>
        </div>
    </header>

    <div class="main-layout">
        <!-- Canvas & Tools Column -->
        <div class="editor-column">
            <div class="toolbar">
                <button class="tool-btn active" data-tool="pen">✏️ Pen</button>
                <button class="tool-btn" data-tool="eraser">🧹 Eraser</button>
                <button class="tool-btn" data-tool="fill">🪣 Fill</button>
                <button class="tool-btn" data-tool="picker">💉 Pick</button>
            </div>

            <div class="canvas-container">
                <canvas id="pixelCanvas" width="8" height="8"></canvas>
            </div>

            <div class="actions-row">
                <button class="btn-action" id="btnRotate">🔄 Rotate 90°</button>
                <button class="btn-action" id="btnFlipH">↔️ Flip H</button>
                <button class="btn-action" id="btnFlipV">↕️ Flip V</button>
                <button class="btn-action" id="btnInvert">🌗 Invert</button>
                <button class="btn-action" id="btnClear">🗑️ Clear</button>
            </div>
        </div>

        <!-- Palette & Preview Column -->
        <div class="palette-column">
            <!-- Palette Selector -->
            <div class="panel-box">
                <h3>MicroOS 16-Color Palette</h3>
                <div class="palette-grid" id="paletteGrid"></div>
            </div>

            <!-- MicroOS Desktop Live Preview -->
            <div class="panel-box">
                <h3>MicroOS Previews</h3>
                <div class="preview-box">
                    <div>
                        <canvas id="preview1x" class="preview-canvas" width="8" height="8" style="width: 16px; height: 16px;"></canvas>
                        <div style="font-size: 0.7rem; color: #888; text-align: center;">1x</div>
                    </div>
                    <div>
                        <canvas id="preview4x" class="preview-canvas" width="8" height="8" style="width: 32px; height: 32px;"></canvas>
                        <div style="font-size: 0.7rem; color: #888; text-align: center;">4x</div>
                    </div>
                    <div>
                        <canvas id="preview8x" class="preview-canvas" width="8" height="8" style="width: 64px; height: 64px;"></canvas>
                        <div style="font-size: 0.7rem; color: #888; text-align: center;">8x</div>
                    </div>
                </div>

                <div style="font-size: 0.8rem; color: #aaa; margin-top: 4px;">Taskbar & Library Preview:</div>
                <div class="microos-preview-bar">
                    <canvas id="taskbarPreview" class="microos-taskbar-icon" width="8" height="8"></canvas>
                    <span class="microos-app-title">${fileName.replace(/\\.[^/.]+$/, '')}</span>
                </div>
            </div>

            <!-- Presets & Hex export -->
            <div class="panel-box">
                <h3>Presets</h3>
                <div class="actions-row">
                    <button class="btn-action" id="presetDefault">Default App</button>
                    <button class="btn-action" id="presetGame">Gamepad</button>
                    <button class="btn-action" id="presetFile">File</button>
                    <button class="btn-action" id="presetTerminal">Terminal</button>
                    <button class="btn-action" id="presetHeart">Heart</button>
                </div>
                <h3 style="margin-top: 8px;">Hex Nibble Stream (64 Nibbles)</h3>
                <div class="hex-dump" id="hexDisplay"></div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const palette = ${paletteJson};
        const GRID_SIZE = 8;
        
        let grid = [];
        let currentColor = '1'; // Default White
        let currentTool = 'pen';
        let isMouseDown = false;

        // Initialize grid from initial data
        function loadInitialData(rawHex) {
            grid = [];
            const clean = (rawHex || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
            for (let y = 0; y < GRID_SIZE; y++) {
                const row = [];
                for (let x = 0; x < GRID_SIZE; x++) {
                    const idx = y * GRID_SIZE + x;
                    row.push(idx < clean.length ? clean.charAt(idx) : '0');
                }
                grid.push(row);
            }
        }

        loadInitialData('${initialHexData}');

        // Canvas setup
        const canvas = document.getElementById('pixelCanvas');
        const ctx = canvas.getContext('2d');

        const prev1x = document.getElementById('preview1x').getContext('2d');
        const prev4x = document.getElementById('preview4x').getContext('2d');
        const prev8x = document.getElementById('preview8x').getContext('2d');
        const taskbarPrev = document.getElementById('taskbarPreview').getContext('2d');

        function getColorCss(hexKey) {
            const entry = palette.find(p => p.hexKey === hexKey.toUpperCase());
            return entry ? entry.color : 'rgba(0,0,0,0)';
        }

        // Render Canvas and Previews
        function render() {
            ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
            prev1x.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
            prev4x.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
            prev8x.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
            taskbarPrev.clearRect(0, 0, GRID_SIZE, GRID_SIZE);

            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    const key = grid[y][x];
                    if (key !== '0') {
                        const color = getColorCss(key);
                        ctx.fillStyle = color;
                        ctx.fillRect(x, y, 1, 1);

                        prev1x.fillStyle = color;
                        prev1x.fillRect(x, y, 1, 1);

                        prev4x.fillStyle = color;
                        prev4x.fillRect(x, y, 1, 1);

                        prev8x.fillStyle = color;
                        prev8x.fillRect(x, y, 1, 1);

                        taskbarPrev.fillStyle = color;
                        taskbarPrev.fillRect(x, y, 1, 1);
                    }
                }
            }

            updateHexDisplay();
        }

        function getHexLines() {
            return grid.map(row => row.join('')).join('\\n');
        }

        function getFlatHex() {
            return grid.map(row => row.join('')).join('');
        }

        function updateHexDisplay() {
            const flat = getFlatHex();
            document.getElementById('hexDisplay').textContent = flat;
        }

        function notifyDocumentChange() {
            vscode.postMessage({
                type: 'change',
                content: getHexLines()
            });
        }

        // Build Palette Swatches
        const paletteContainer = document.getElementById('paletteGrid');
        palette.forEach(p => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch' + (p.hexKey === currentColor ? ' selected' : '');
            swatch.dataset.key = p.hexKey;
            swatch.style.backgroundColor = p.color;
            swatch.style.color = (p.hexKey === '1' || p.hexKey === '7' || p.hexKey === '9' || p.hexKey === 'B' || p.hexKey === 'D') ? '#000' : '#fff';
            swatch.textContent = p.hexKey;
            swatch.title = p.name;
            swatch.addEventListener('click', () => {
                currentColor = p.hexKey;
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                if (currentTool === 'eraser') {
                    setTool('pen');
                }
            });
            paletteContainer.appendChild(swatch);
        });

        function setTool(tool) {
            currentTool = tool;
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tool === tool);
            });
        }

        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setTool(btn.dataset.tool);
            });
        });

        // Mouse Painting Interaction
        function getCoords(e) {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor(((e.clientX - rect.left) / rect.width) * GRID_SIZE);
            const y = Math.floor(((e.clientY - rect.top) / rect.height) * GRID_SIZE);
            return {
                x: Math.max(0, Math.min(GRID_SIZE - 1, x)),
                y: Math.max(0, Math.min(GRID_SIZE - 1, y))
            };
        }

        function applyTool(x, y) {
            if (currentTool === 'pen') {
                if (grid[y][x] !== currentColor) {
                    grid[y][x] = currentColor;
                    render();
                    notifyDocumentChange();
                }
            } else if (currentTool === 'eraser') {
                if (grid[y][x] !== '0') {
                    grid[y][x] = '0';
                    render();
                    notifyDocumentChange();
                }
            } else if (currentTool === 'picker') {
                const picked = grid[y][x];
                currentColor = picked;
                document.querySelectorAll('.color-swatch').forEach(s => {
                    s.classList.toggle('selected', s.dataset.key === picked);
                });
                setTool('pen');
            } else if (currentTool === 'fill') {
                floodFill(x, y, currentColor);
                render();
                notifyDocumentChange();
            }
        }

        function floodFill(startX, startY, fillCol) {
            const targetCol = grid[startY][startX];
            if (targetCol === fillCol) return;

            const queue = [[startX, startY]];
            const visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));

            while (queue.length > 0) {
                const [cx, cy] = queue.pop();
                if (cx < 0 || cx >= GRID_SIZE || cy < 0 || cy >= GRID_SIZE) continue;
                if (visited[cy][cx]) continue;
                visited[cy][cx] = true;

                if (grid[cy][cx] === targetCol) {
                    grid[cy][cx] = fillCol;
                    queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
                }
            }
        }

        canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            const { x, y } = getCoords(e);
            applyTool(x, y);
        });

        window.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isMouseDown && (currentTool === 'pen' || currentTool === 'eraser')) {
                const { x, y } = getCoords(e);
                applyTool(x, y);
            }
        });

        // Transformations
        document.getElementById('btnRotate').addEventListener('click', () => {
            const next = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('0'));
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    next[x][GRID_SIZE - 1 - y] = grid[y][x];
                }
            }
            grid = next;
            render();
            notifyDocumentChange();
        });

        document.getElementById('btnFlipH').addEventListener('click', () => {
            grid = grid.map(row => [...row].reverse());
            render();
            notifyDocumentChange();
        });

        document.getElementById('btnFlipV').addEventListener('click', () => {
            grid = [...grid].reverse();
            render();
            notifyDocumentChange();
        });

        document.getElementById('btnInvert').addEventListener('click', () => {
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    const val = parseInt(grid[y][x], 16);
                    if (val !== 0) {
                        grid[y][x] = (15 - val).toString(16).toUpperCase();
                    }
                }
            }
            render();
            notifyDocumentChange();
        });

        document.getElementById('btnClear').addEventListener('click', () => {
            grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('0'));
            render();
            notifyDocumentChange();
        });

        // Presets
        const PRESETS = {
            default: "0AAAABB0AA1AB1B3AA11B133AA11B133AB1B1132BB131122BB13312203332220",
            game:    "00FFFF000F5555F00F1551F0FF5555FFFF85559F0F5555F00FFFFFF000000000",
            file:    "0FFFFFF00F1111F00F111FF00F1111F00F1111F00F1111F00FFFFFF000000000",
            terminal:"0EEEEEE00E0000E00E5000E00E0500E00E0050E00E0000E00EEEEEE000000000",
            heart:   "000000000AA00AA0AAAAAAA0AAAAAAAA00AAAAA0000AAA00000A00000000000"
        };

        function applyPreset(hex) {
            loadInitialData(hex);
            render();
            notifyDocumentChange();
        }

        document.getElementById('presetDefault').addEventListener('click', () => applyPreset(PRESETS.default));
        document.getElementById('presetGame').addEventListener('click', () => applyPreset(PRESETS.game));
        document.getElementById('presetFile').addEventListener('click', () => applyPreset(PRESETS.file));
        document.getElementById('presetTerminal').addEventListener('click', () => applyPreset(PRESETS.terminal));
        document.getElementById('presetHeart').addEventListener('click', () => applyPreset(PRESETS.heart));

        document.getElementById('btnSaveCopy').addEventListener('click', () => {
            vscode.postMessage({
                type: 'copyDai'
            });
        });

        // Listen for updates from VS Code extension
        window.addEventListener('message', event => {
            const msg = event.data;
            if (msg.type === 'update') {
                loadInitialData(msg.content);
                render();
            }
        });

        // Initial render
        render();
    </script>
</body>
</html>`;
}
//# sourceMappingURL=iconWebview.js.map