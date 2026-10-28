import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {sources} from './content.config.mjs';
import {generateDocs, headings, splitDocument} from './generate-docs.mjs';

test('analiza encabezados, identificadores explícitos y bloques de código', () => {
  const markdown = '# Plan {#plan}\n\n## **Perfil**\n\n```md\n# No es sección\n```\n\n~~~\n## Tampoco\n~~~\n\n## Perfil\n';
  assert.deepEqual(headings(markdown).map(({level, label, anchor}) => ({level, label, anchor})), [
    {level: 1, label: 'Plan', anchor: 'plan'},
    {level: 2, label: 'Perfil', anchor: 'perfil'},
    {level: 2, label: 'Perfil', anchor: 'perfil-1'},
  ]);
});

test('divide por secciones sin perder ni reordenar un solo carácter de las fuentes', async () => {
  for (const source of sources) {
    const raw = await readFile(new URL(`../${source.file}`, import.meta.url), 'utf8');
    const pages = splitDocument(raw, source);
    assert.equal(pages.map((page) => page.body).join(''), raw);
    assert.equal(new Set(pages.map((page) => page.id)).size, pages.length);
    assert.ok(pages.length > 1);
  }
});

test('genera navegación, figuras, enlaces, descargas y edición sobre fuentes intactas', async () => {
  const before = await Promise.all(sources.map((source) => readFile(new URL(`../${source.file}`, import.meta.url))));
  const manifest = await generateDocs();
  for (const [index, source] of sources.entries()) {
    const after = await readFile(new URL(`../${source.file}`, import.meta.url));
    assert.deepEqual(after, before[index]);
    const download = await readFile(new URL(`../static/documentos/${source.id}.md`, import.meta.url));
    assert.deepEqual(download, before[index]);
    assert.equal(manifest.sources[index].sha256, createHash('sha256').update(after).digest('hex'));
    const raw = after.toString('utf8');
    for (const page of splitDocument(raw, source)) {
      const generated = await readFile(new URL(`../docs/generated/${page.id}.md`, import.meta.url), 'utf8');
      assert.equal(manifest.pages[`generated/${page.id}`].source, source.file);
      assert.ok(generated.includes(`slug: "/${page.id}"`));
      for (const reference of generated.matchAll(/!\[[^\]]*\]\[([^\]]+)\]/g)) {
        assert.ok(generated.includes(`[${reference[1]}]:`), `Falta definición de imagen en ${page.id}`);
      }
    }
  }
  assert.equal(manifest.navigation.curriculum, '/docs/parte-2/estructura-curricular');
  assert.equal(manifest.navigation.plan, '/docs/parte-2/identificación-de-la-carrera');
  assert.equal(manifest.navigation.credits, '/docs/parte-1/introducción');
  assert.match(manifest.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
  const index = await readFile(new URL('../docs/generated/parte-2.md', import.meta.url), 'utf8');
  assert.ok(index.includes('](/docs/parte-2/estructura-curricular)'));
  assert.ok(index.includes('#matemáticas-i-\\(01\\))'));
});
