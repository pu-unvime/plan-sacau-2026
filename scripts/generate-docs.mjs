import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir, readFile, readdir, rm, writeFile, copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import GithubSlugger from 'github-slugger';
import {sources} from './content.config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

export function headings(markdown) {
  const slugger = new GithubSlugger();
  const result = [];
  const pattern = /^(#{1,6})[ \t]+(.+)$/gm;
  let fence;
  for (const match of markdown.matchAll(/^.*$/gm)) {
    const line = match[0];
    const boundary = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (boundary) {
      if (!fence) fence = boundary[1];
      else if (boundary[1][0] === fence[0] && boundary[1].length >= fence.length) fence = undefined;
      continue;
    }
    if (fence) continue;
    pattern.lastIndex = 0;
    const heading = pattern.exec(line);
    if (!heading) continue;
    const explicit = heading[2].match(/\s+\{#([^}]+)\}\s*$/);
    const label = heading[2].replace(/\s+\{#[^}]+\}\s*$/, '').replace(/[*`]/g, '').trim();
    result.push({
      level: heading[1].length,
      label,
      anchor: explicit?.[1] ?? slugger.slug(label),
      offset: match.index,
    });
  }
  return result;
}

export function splitDocument(markdown, source) {
  const allHeadings = headings(markdown);
  const sections = allHeadings.filter((heading) => heading.level === 1);
  const slugger = new GithubSlugger();
  const pages = [{
    id: source.id,
    title: source.label,
    body: markdown.slice(0, sections[0]?.offset ?? markdown.length),
    headings: [],
  }];
  sections.forEach((section, index) => {
    const end = sections[index + 1]?.offset ?? markdown.length;
    pages.push({
      id: `${source.id}/${slugger.slug(section.label)}`,
      title: section.label,
      body: markdown.slice(section.offset, end),
      headings: allHeadings.filter((heading) => heading.offset >= section.offset && heading.offset < end),
    });
  });
  return pages;
}

function frontMatter(values) {
  return `---\n${Object.entries(values).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n`;
}

export async function generateDocs() {
  const output = path.join(root, 'docs/generated');
  await mkdir(output, {recursive: true});
  // El directorio es exclusivamente generado; nunca se eliminan fuentes editoriales.
  for (const entry of await readdir(output)) {
    await rm(path.join(output, entry), {recursive: true});
  }
  await mkdir(path.join(root, 'src/generated'), {recursive: true});
  await mkdir(path.join(root, 'static/documentos'), {recursive: true});
  const manifest = {sources: [], pages: {}, navigation: {}, updatedAt: ''};
  const sidebar = [];

  for (const source of sources) {
    const raw = await readFile(path.join(root, source.file), 'utf8');
    const pages = splitDocument(raw, source);
    const targets = new Map();
    for (const page of pages) {
      for (const heading of page.headings) {
        targets.set(heading.anchor, `/docs/${page.id}${heading.level === 1 ? '' : `#${heading.anchor}`}`);
      }
    }
    const definitions = raw.match(/^\[[^\]\n]+\]:[^\n]*(?:\n[ \t]+[^\n]+)*/gm) ?? [];
    const items = [];
    for (const page of pages) {
      const body = page.body.replace(/\]\(#((?:\\.|[^)\\])*)\)/g, (original, anchor) => {
        const target = targets.get(anchor.replace(/\\([()])/g, '$1'));
        if (!target) throw new Error(`Ancla inexistente en ${source.file}: ${anchor}`);
        return `](${target.replace(/[()]/g, '\\$&')})`;
      });
      // Las figuras de los originales usan referencias definidas al final del archivo.
      const references = definitions.filter((definition) => {
        const name = definition.slice(1, definition.indexOf(']'));
        return body.includes(`[${name}]`) && !body.includes(definition);
      });
      const filename = path.join(output, `${page.id}.md`);
      await mkdir(path.dirname(filename), {recursive: true});
      const route = `/docs/${page.id}`;
      await writeFile(filename, frontMatter({
        id: page.id.split('/').at(-1),
        title: page.title,
        description: `${page.title}. ${source.description}`,
        slug: `/${page.id}`,
        hide_title: page.headings.length > 0,
      }) + body + (references.length ? `\n\n${references.join('\n\n')}\n` : ''));
      const docId = `generated/${page.id}`;
      manifest.pages[docId] = {source: source.file, route};
      const subsections = page.headings.filter((heading) => heading.level === 2);
      items.push(subsections.length ? {
        type: 'category',
        label: page.title,
        link: {type: 'doc', id: docId},
        items: subsections.map((heading) => ({
          type: 'link',
          label: heading.label,
          href: encodeURI(`${route}#${heading.anchor}`),
        })),
      } : {type: 'doc', id: docId});
      if (page.title === 'Estructura Curricular') manifest.navigation.curriculum = route;
      if (page.title === 'Identificación de la Carrera') manifest.navigation.plan = route;
      if (source.id === 'parte-1' && page.title === 'Introducción') manifest.navigation.credits = route;
    }
    sidebar.push({type: 'category', label: source.label, collapsed: source.id !== 'parte-1', items});
    manifest.sources.push({
      ...source,
      sha256: createHash('sha256').update(raw).digest('hex'),
      sectionCount: pages.length - 1,
      download: `/documentos/${source.id}.md`,
    });
    await copyFile(path.join(root, source.file), path.join(root, `static/documentos/${source.id}.md`));
  }
  for (const key of ['plan', 'curriculum', 'credits']) {
    if (!manifest.navigation[key]) throw new Error(`No se encontró el destino de navegación: ${key}`);
  }
  manifest.updatedAt = execFileSync(
    'git', ['log', '-1', '--format=%cs', '--', ...sources.map((source) => source.file)], {cwd: root, encoding: 'utf8'},
  ).trim();
  if (!manifest.updatedAt) throw new Error('No se pudo determinar la fecha de actualización de los documentos.');
  await writeFile(path.join(root, 'src/generated/content.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(root, 'src/generated/sidebar.ts'),
    `import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';\n\nconst sidebars = ${JSON.stringify({planSidebar: sidebar}, null, 2)} satisfies SidebarsConfig;\n\nexport default sidebars.planSidebar;\n`);
  console.log(`Contenido generado: ${sources.length} originales, ${Object.keys(manifest.pages).length} páginas; fuentes intactas.`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateDocs();
}
