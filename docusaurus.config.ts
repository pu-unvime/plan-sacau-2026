import type {Config} from '@docusaurus/types';
import type {Options, ThemeConfig} from '@docusaurus/preset-classic';
import {themes as prismThemes} from 'prism-react-renderer';
import content from './src/generated/content.json';
import {
  BASE_URL, DEFAULT_BRANCH, ORGANIZATION_NAME, PROJECT_NAME, REPOSITORY_URL,
  SITE_DESCRIPTION, SITE_TITLE, SITE_URL, UNIVERSITY_NAME, UNIVERSITY_URL,
} from './site.config';

const sourcePages: Record<string, {source: string; route: string}> = content.pages;

const config: Config = {
  title: SITE_TITLE,
  tagline: SITE_DESCRIPTION,
  favicon: 'img/favicon.svg',
  url: SITE_URL,
  baseUrl: BASE_URL,
  organizationName: ORGANIZATION_NAME,
  projectName: PROJECT_NAME,
  trailingSlash: true,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  i18n: {defaultLocale: 'es', locales: ['es']},
  markdown: {
    format: 'detect',
    mermaid: true,
    hooks: {onBrokenMarkdownLinks: 'throw'},
  },
  presets: [
    ['classic', {
      docs: {
        sidebarPath: './sidebars.ts',
        breadcrumbs: true,
        showLastUpdateTime: false,
        editUrl: ({docPath}) => {
          const docId = docPath.replace(/\.mdx?$/, '');
          const file = sourcePages[docId]?.source ?? `docs/${docPath}`;
          return `${REPOSITORY_URL}/edit/${DEFAULT_BRANCH}/${file.split('/').map(encodeURIComponent).join('/')}`;
        },
      },
      blog: false,
      svgr: {svgrConfig: {svgo: false}},
      theme: {customCss: './src/css/custom.css'},
      sitemap: {changefreq: 'monthly', priority: 0.5},
    } satisfies Options],
  ],
  themes: [
    '@docusaurus/theme-mermaid',
    ['@easyops-cn/docusaurus-search-local', {
      hashed: 'filename',
      language: ['es', 'en'],
      indexDocs: true,
      indexBlog: false,
      indexPages: true,
      highlightSearchTermsOnTargetPage: true,
      explicitSearchResultPath: true,
      docsRouteBasePath: '/docs',
    }],
  ],
  themeConfig: {
    image: 'img/estructura.svg',
    metadata: [
      {name: 'description', content: SITE_DESCRIPTION},
      {name: 'theme-color', content: '#183653'},
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'PUS · SACAU',
      logo: {alt: 'Plan de Estudios · PUS', src: 'img/favicon.svg', width: 32, height: 32},
      items: [
        {to: '/', label: 'Inicio', position: 'left', exact: true},
        {to: '/docs/', label: 'Documentación', position: 'left', exact: true},
        {to: content.navigation.plan, label: 'Plan de Estudios', position: 'left'},
        {to: content.navigation.curriculum, label: 'Estructura Curricular', position: 'left'},
        {to: content.navigation.credits, label: 'Créditos SACAU', position: 'left'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {title: 'Universidad', items: [{label: UNIVERSITY_NAME, href: UNIVERSITY_URL}]},
        {title: 'Carrera', items: [{label: SITE_TITLE, to: content.navigation.plan}]},
        {title: 'Repositorio', items: [{label: 'Documentación y código fuente', href: REPOSITORY_URL}]},
        {title: 'Última actualización', items: [{label: content.updatedAt, href: `${REPOSITORY_URL}/commits/${DEFAULT_BRANCH}/`}]},
      ],
      copyright: `${UNIVERSITY_NAME} · Documentación académica · SACAU`,
    },
    docs: {sidebar: {hideable: true, autoCollapseCategories: true}},
    tableOfContents: {minHeadingLevel: 2, maxHeadingLevel: 3},
    prism: {theme: prismThemes.github, darkTheme: prismThemes.dracula},
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
      options: {securityLevel: 'strict'},
    },
  } satisfies ThemeConfig,
};

export default config;
