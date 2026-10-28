import {useState, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Estructura from '@site/static/img/estructura.svg';
import content from '../../generated/content.json';
import styles from './styles.module.css';

const stages = [
  {label: 'Fundamentos', route: content.navigation.credits, className: styles.fundamentos},
  {label: 'Plan de Estudios', route: content.navigation.plan, className: styles.plan},
  {label: 'Trayectoria académica', route: content.navigation.curriculum, className: styles.trayectoria},
];

export default function InteractiveStructure(): ReactNode {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(1);
  return (
    <section className={styles.diagram} aria-label="Ejemplo de SVG interactivo">
      <div className={styles.controls} role="group" aria-label="Resaltar etapa">
        {stages.map((stage, index) => (
          <button key={stage.label} type="button" className="button button--secondary button--sm"
            aria-pressed={active === index} onClick={() => setActive(index)}>
            {stage.label}
          </button>
        ))}
      </div>
      <label className={styles.zoom}>
        Zoom ({Math.round(zoom * 100)} %)
        <input type="range" min="1" max="2" step="0.1" value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))} />
      </label>
      <div className={styles.viewport} tabIndex={0} role="region" aria-label="Diagrama desplazable">
        <div className={stages[active].className} style={{width: `${zoom * 100}%`}}>
          <Estructura role="img" aria-label={`Etapa resaltada: ${stages[active].label}`} />
        </div>
      </div>
      <Link to={stages[active].route}>Consultar: {stages[active].label}</Link>
    </section>
  );
}
