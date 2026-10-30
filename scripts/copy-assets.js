// Copies SVG icons and codex JSON metadata next to the compiled JS in dist/.
// Keeps the build free of extra dependencies (no gulp/copyfiles).
const fs = require('fs');
const path = require('path');

const SRC_ROOT = __dirname + '/..';
const ASSET_EXTENSIONS = ['.svg', '.json'];

function walk(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...walk(full));
		} else if (ASSET_EXTENSIONS.includes(path.extname(entry.name))) {
			files.push(full);
		}
	}
	return files;
}

let copied = 0;
for (const srcDir of ['credentials', 'nodes']) {
	for (const file of walk(path.join(SRC_ROOT, srcDir))) {
		const relative = path.relative(SRC_ROOT, file);
		const target = path.join(SRC_ROOT, 'dist', relative);
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.copyFileSync(file, target);
		copied++;
	}
}
console.log(`Copied ${copied} asset file(s) to dist/`);
