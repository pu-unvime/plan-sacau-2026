import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import Estructura from '@site/static/img/estructura.svg';
import content from '../generated/content.json';
import {SITE_DESCRIPTION, SITE_TITLE} from '../../site.config';
import styles from './index.module.css';

export default function Home(): ReactNode {
  return (
    <Layout title="Inicio" description={SITE_DESCRIPTION}>
      <main>
        <header className={styles.hero}>
          <div className="container">
            <div className={styles.heroGrid}>
              <div>
                <p className={styles.eyebrow}>DOCUMENTACIÓN ACADÉMICA · UNVIME</p>
                <Heading as="h1" className={styles.title}>{SITE_TITLE}</Heading>
                <p className={styles.subtitle}>
                  Plan de Estudios adaptado al Sistema de Asignación de Créditos Académicos Universitarios (SACAU)
                </p>
                <p className={styles.description}>{SITE_DESCRIPTION}</p>
                <div className={styles.actions}>
                  <Link className="button button--primary button--lg" to="/docs/">Comenzar lectura</Link>
                  <Link className="button button--secondary button--outline button--lg" to={content.navigation.curriculum}>
                    Ver estructura curricular
                  </Link>
                </div>
              </div>
              <div className={styles.illustration}>
                <Estructura role="img" aria-label="Esquema de lectura: fundamentos, plan de estudios y trayectoria académica" />
                <p>Un plan, una trayectoria, nuevas posibilidades.</p>
              </div>
            </div>
          </div>
        </header>
        <section className={`container ${styles.reading}`} aria-labelledby="reading-title">
          <p className={styles.eyebrow}>EL PLAN, EN CONTEXTO</p>
          <Heading as="h2" id="reading-title">Una lectura clara de la propuesta académica</Heading>
          <p className={styles.intro}>Explore los documentos y sus anexos, desde los fundamentos hasta la implementación.</p>
          <div className={styles.cards}>
            {content.sources.map((source, index) => (
              <Link key={source.id} to={`/docs/${source.id}`} className={styles.card}>
                <span className={styles.number}>0{index + 1}</span>
                <Heading as="h3">{source.label}</Heading>
                <p>{source.description}</p>
                <span className={styles.cardLink}>Leer documento <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
          <aside className={styles.note}>
            <strong>Fuentes íntegras, acceso abierto.</strong> El contenido se mantiene en Markdown y puede consultarse y editarse desde GitHub.
          </aside>
        </section>
      </main>
    </Layout>
  );
}
