import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', '.wrangler']);
const marker = '<link rel="stylesheet" href="/css/brand-theme.css" data-afwm-brand-theme="true"/>';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    if (!entry.name.toLowerCase().endsWith('.html')) continue;

    const original = await readFile(fullPath, 'utf8');
    if (original.includes('data-afwm-brand-theme="true"')) continue;
    if (!original.includes('</head>')) continue;

    const updated = original.replace('</head>', `  ${marker}\n</head>`);
    await writeFile(fullPath, updated, 'utf8');
    console.log(`Applied brand theme: ${path.relative(root, fullPath)}`);
  }
}

await walk(root);
