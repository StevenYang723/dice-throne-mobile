import fs from 'node:fs/promises';
const root = new URL('./', import.meta.url);
const files = ['index.html', 'style.css', 'art-effects.css', 'art.mjs', 'effects.mjs', 'effects-model.mjs', 'ART-CREDITS.md', 'art-sources.json', 'app.mjs', 'presentation.mjs', 'engine.mjs', 'common.mjs', 'rules.json', 'icon.svg', 'manifest.webmanifest', '.nojekyll'];
const rules = JSON.parse(await fs.readFile(new URL('rules.json', root), 'utf8'));
if (rules.heroes.length !== 24 || new Set(rules.heroes.map(h => h.id)).size !== 24) throw new Error('Expected 24 unique hero records');
for (const h of rules.heroes) {
  if (new Set(h.cards.map(c => c.id)).size !== h.cards.length) throw new Error(`Duplicate card in ${h.id}`);
}
const art=JSON.parse(await fs.readFile(new URL('art-sources.json',root),'utf8'));
if(art.images.length!==24 || new Set(art.images.map(a=>a.id)).size!==24)throw Error('Expected 24 hero portraits');
for(const a of art.images){if(!/^art-[a-z-]+\.png$/.test(a.file))throw Error('Invalid art filename');files.push(a.file)}
await fs.mkdir(new URL('dist/', root), { recursive: true });
for (const file of files) await fs.copyFile(new URL(file, root), new URL(`dist/${file}`, root));
console.log(`Built ${files.length} static files; ${rules.heroes.filter(h => h.playable).length}/24 playable development heroes.`);
