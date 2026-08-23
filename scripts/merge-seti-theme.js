const fs = require('fs');
const path = require('path');

// Locate VS Code's built-in seti theme
const vsCodeDir = 'C:\\Program Files\\Microsoft VS Code';
let setiDir = null;

const subdirs = fs.readdirSync(vsCodeDir);
for (const sub of subdirs) {
    const candidate = path.join(vsCodeDir, sub, 'resources/app/extensions/theme-seti/icons');
    if (fs.existsSync(candidate)) {
        setiDir = candidate;
        break;
    }
}

if (!setiDir) {
    console.error('Could not find Seti theme directory in VS Code.');
    process.exit(1);
}

console.log('Found Seti directory:', setiDir);

const setiJsonPath = path.join(setiDir, 'vs-seti-icon-theme.json');
const setiWoffPath = path.join(setiDir, 'seti.woff');

const setiTheme = JSON.parse(fs.readFileSync(setiJsonPath, 'utf8'));

// Copy seti.woff font to our icons directory
const targetIconsDir = path.join(__dirname, '../icons');
if (!fs.existsSync(targetIconsDir)) fs.mkdirSync(targetIconsDir, { recursive: true });

fs.copyFileSync(setiWoffPath, path.join(targetIconsDir, 'seti.woff'));
console.log('Copied seti.woff font.');

// Add our custom NanoSDK icon definitions (image-based)
setiTheme.iconDefinitions['_nsp_file'] = {
    iconPath: './nsp_icon.png'
};
setiTheme.iconDefinitions['_mpi_file'] = {
    iconPath: './mpi_icon.png'
};
setiTheme.iconDefinitions['_wrt_file'] = {
    iconPath: './wrt_icon.png'
};
setiTheme.iconDefinitions['_nsa_file'] = {
    iconPath: './nsa_icon.png'
};

// Override fileExtensions in Seti so nsa is our custom icon, not audio!
setiTheme.fileExtensions = setiTheme.fileExtensions || {};
setiTheme.fileExtensions['nsp'] = '_nsp_file';
setiTheme.fileExtensions['mpi'] = '_mpi_file';
setiTheme.fileExtensions['wrt'] = '_wrt_file';
setiTheme.fileExtensions['nsa'] = '_nsa_file';

// Also languageIds
setiTheme.languageIds = setiTheme.languageIds || {};
setiTheme.languageIds['nanosdk'] = '_nsp_file';
setiTheme.languageIds['micropaint'] = '_mpi_file';
setiTheme.languageIds['microwrite'] = '_wrt_file';
setiTheme.languageIds['nanoapp'] = '_nsa_file';

// Write combined icon-theme.json
const outputJsonPath = path.join(targetIconsDir, 'icon-theme.json');
fs.writeFileSync(outputJsonPath, JSON.stringify(setiTheme, null, 2), 'utf8');

console.log('Successfully generated full Seti + NanoSDK icon-theme.json!');
