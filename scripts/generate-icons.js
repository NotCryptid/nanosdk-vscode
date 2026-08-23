const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// MicroOS 16-Color Palette RGBA values
const PALETTE = {
    '0': [0, 0, 0, 0],         // Transparent
    '1': [255, 255, 255, 255], // White
    '2': [89, 0, 148, 255],    // Dark Purple (#590094)
    '3': [122, 0, 179, 255],   // Purple (#7A00B3)
    '4': [1, 72, 239, 255],    // Blue (#0148EF)
    '5': [0, 145, 255, 255],   // Light Blue (#0091FF)
    '6': [128, 61, 0, 255],    // Brown (#803D00)
    '7': [182, 124, 254, 255], // Lavender (#B67CFE)
    '8': [0, 128, 51, 255],    // Green (#008033)
    '9': [239, 158, 255, 255], // Pinkish (#EF9EFF)
    'A': [255, 0, 174, 255],   // Magenta (#FF00AE)
    'B': [255, 174, 0, 255],   // Orange (#FFAE00)
    'C': [50, 0, 143, 255],    // Deep Blue (#32008F)
    'D': [150, 150, 150, 255], // Gray (#969696)
    'E': [55, 55, 55, 255],    // Dark Gray (#373737)
    'F': [0, 0, 0, 255]        // Black (#000000)
};

// CRC32 table for PNG chunk validation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
}

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createPngChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const typeAndData = buf.subarray(4, 8 + len);
    const crc = crc32(typeAndData);
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
}

function generatePng(hexString, targetSize = 256) {
    const raw = hexString.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    const srcSize = 8;
    const scale = targetSize / srcSize;

    // Build raw RGBA scanlines with filter byte 0
    const rawScanlines = Buffer.alloc(targetSize * (1 + targetSize * 4));
    let offset = 0;

    for (let y = 0; y < targetSize; y++) {
        rawScanlines[offset++] = 0; // PNG filter byte None
        const srcY = Math.floor(y / scale);

        for (let x = 0; x < targetSize; x++) {
            const srcX = Math.floor(x / scale);
            const idx = srcY * srcSize + srcX;
            const hexKey = idx < raw.length ? raw.charAt(idx) : '0';
            const rgba = PALETTE[hexKey] || [0, 0, 0, 0];

            rawScanlines[offset++] = rgba[0];
            rawScanlines[offset++] = rgba[1];
            rawScanlines[offset++] = rgba[2];
            rawScanlines[offset++] = rgba[3];
        }
    }

    const compressed = zlib.deflateSync(rawScanlines, { level: 9 });

    // PNG Signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR Chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(targetSize, 0);
    ihdrData.writeUInt32BE(targetSize, 4);
    ihdrData[8] = 8;
    ihdrData[9] = 6;
    ihdrData[10] = 0;
    ihdrData[11] = 0;
    ihdrData[12] = 0;
    const ihdrChunk = createPngChunk('IHDR', ihdrData);

    // IDAT Chunk
    const idatChunk = createPngChunk('IDAT', compressed);

    // IEND Chunk
    const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function generateIco(pngBuffersBySize) {
    const count = pngBuffersBySize.length;
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(count, 4);

    let currentOffset = 6 + (16 * count);
    const directoryEntries = [];
    const imageDatas = [];

    for (const item of pngBuffersBySize) {
        const entry = Buffer.alloc(16);
        entry[0] = item.size >= 256 ? 0 : item.size;
        entry[1] = item.size >= 256 ? 0 : item.size;
        entry[2] = 0;
        entry[3] = 0;
        entry.writeUInt16LE(1, 4);
        entry.writeUInt16LE(32, 6);
        entry.writeUInt32LE(item.png.length, 8);
        entry.writeUInt32LE(currentOffset, 12);

        directoryEntries.push(entry);
        imageDatas.push(item.png);
        currentOffset += item.png.length;
    }

    return Buffer.concat([header, ...directoryEntries, ...imageDatas]);
}

function generateIconSet(name, hexString) {
    const sizes = [256, 128, 64, 48, 32, 16];
    const pngs = sizes.map(size => ({
        size,
        png: generatePng(hexString, size)
    }));

    const icoBuffer = generateIco(pngs);
    const png256 = pngs[0].png;

    const iconsDir = path.join(__dirname, '../icons');
    if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

    const icoPath = path.join(iconsDir, `${name}.ico`);
    const pngPath = path.join(iconsDir, `${name}.png`);

    fs.writeFileSync(icoPath, icoBuffer);
    fs.writeFileSync(pngPath, png256);

    console.log(`✅ Generated ${name}: ${icoPath} & ${pngPath}`);
    return { icoBuffer, png256 };
}

// 1. NanoSDK App Icon (.nsp) - Also used for Extension Logo
const NSP_HEX = '0AAAABB0AA1AB1B3AA11B133AA11B133AB1B1132BB131122BB13312203332220';
// 2. Micro Paint Image Icon (.mpi)
const MPI_HEX = '011118801111188811551188155441111554B11A11111D1A1111161D0DDDDD60';
// 3. Write File Icon (.wrt)
const WRT_HEX = '00D11D00773EE3773111111331FEDE133111111331DEFD13311111132DFFEED2';
// 4. NanoSDK Compiled Application Icon (.nsa)
const NSA_HEX = '0FFFFFF0F1FFFFFFFF1FFFFFF1FFFFFFF88888FFFFFFFFFFF888FFFF0FFFFFF0';

console.log('🖼️ Generating 256px PNG and ICO files for NanoSDK, Micro Paint, Write, and NSA...');

const nspSet = generateIconSet('nsp_icon', NSP_HEX);
const mpiSet = generateIconSet('mpi_icon', MPI_HEX);
const wrtSet = generateIconSet('wrt_icon', WRT_HEX);
const nsaSet = generateIconSet('nsa_icon', NSA_HEX);

// Set extension logo to NSP icon
fs.writeFileSync(path.join(__dirname, '../icon.png'), nspSet.png256);

// Convenience copies at root
fs.writeFileSync(path.join(__dirname, '../nsp_icon.ico'), nspSet.icoBuffer);
fs.writeFileSync(path.join(__dirname, '../nsp_icon.png'), nspSet.png256);
fs.writeFileSync(path.join(__dirname, '../mpi_icon.ico'), mpiSet.icoBuffer);
fs.writeFileSync(path.join(__dirname, '../mpi_icon.png'), mpiSet.png256);
fs.writeFileSync(path.join(__dirname, '../wrt_icon.ico'), wrtSet.icoBuffer);
fs.writeFileSync(path.join(__dirname, '../wrt_icon.png'), wrtSet.png256);
fs.writeFileSync(path.join(__dirname, '../nsa_icon.ico'), nsaSet.icoBuffer);
fs.writeFileSync(path.join(__dirname, '../nsa_icon.png'), nsaSet.png256);

console.log('🎉 All icons successfully generated!');
