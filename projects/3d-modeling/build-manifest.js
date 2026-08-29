/* Regenerate manifest.json with every image, video, STL and SLDPRT
   in this folder. Run after adding or removing files:

       node build-manifest.js

   The manifest is what the homepage uses to discover files for the
   "3D Modeling" gallery section, since browsers can't list
   directory contents from JavaScript. */

const fs = require('fs');
const path = require('path');

const EXT = /\.(png|jpe?g|webp|gif|mp4|webm|mov|stl|sldprt)$/i;
const dir = __dirname;
const out = path.join(dir, 'manifest.json');

// Files used for the gallery — exclude the cover image and any helper
// scripts that happen to live in this folder.
const RESERVED = new Set(['overview.png', 'manifest.json', 'build-manifest.js', 'README.txt']);

const files = fs.readdirSync(dir)
  .filter(f => EXT.test(f) && !f.startsWith('.') && !RESERVED.has(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

fs.writeFileSync(out, JSON.stringify({ files }, null, 2) + '\n', 'utf8');
console.log(`Wrote ${files.length} files to ${path.relative(process.cwd(), out)}`);
