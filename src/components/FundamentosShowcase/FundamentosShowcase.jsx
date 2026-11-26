import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MotionConfig, motion, useScroll, useSpring } from 'motion/react';

import { ntvPath, parsePassage } from '../../data/exegesis';
import { FUNDAMENTOS_BLOQUES, FUNDAMENTOS_PUNTOS } from '../../data/fundamentosDoctrina';
import { assetUrl } from '../../lib/assets';

import './FundamentosShowcase.css';

const EASE_OUT = [0.22, 1, 0.36, 1];

const HERO_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } }
};

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT }
  }
};

const pad2 = n => String(n).padStart(2, '0');

/** Cruz ortodoxa de Crux para el emblema arquitectónico del hero sin portada. */
function CruxEmblem() {
  return (
    <motion.svg
      className="fund-hero__svg"
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
    >
      <motion.circle
        cx="60"
        cy="60"
        r="52"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeOpacity="0.28"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: EASE_OUT }}
      />
      <motion.circle
        cx="60"
        cy="60"
        r="40"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeDasharray="2 4"
        strokeOpacity="0.35"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.25 }}
      />
      <g fill="currentColor">
        <rect x="57.5" y="24" width="5" height="72" rx="1" />
        <rect x="44" y="34" width="32" height="4.5" rx="1" />
        <rect x="37" y="49" width="46" height="5" rx="1" />
        <rect x="46" y="73" width="28" height="4.5" rx="1" transform="rotate(-18 60 75.25)" />
      </g>
    </motion.svg>
  );
}

/** Cita NTV estilizada con enlace directo al capítulo/versículo en el lector NTV. */
function VerseBlock({ verse }) {
  const parsed = useMemo(() => parsePassage(verse.ref), [verse.ref]);
  const href = parsed ? ntvPath(parsed) : null;

  return (
    <blockquote className="fund-verse">
      <p className="fund-verse__meta">
        <span className="fund-verse__source">NTV</span>
        {href ? (
          <Link
            className="fund-verse__ref"
            to={href}
            aria-label={`Leer ${verse.ref} en el lector de la Biblia NTV`}
          >
            <span>{verse.ref}</span>
            <span className="fund-verse__arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        ) : (
          <strong className="fund-verse__ref-static">{verse.ref}</strong>
        )}
      </p>
      <p className="fund-verse__text">«{verse.text}»</p>
    </blockquote>
  );
}

/** Cuerpo específico de cada punto según su tipo doctrinal. */
function PointSpecialContent({ punto }) {
  if (punto.layout === 'salvation-grid' && punto.salvationItems) {
    return (
      <div className="fund-salvation-grid" role="list" aria-label="Cinco liberaciones del creyente">
        {punto.salvationItems.map((item, idx) => {
          const parsed = parsePassage(item.ref);
          const href = parsed ? ntvPath(parsed) : null;
          return (
            <motion.div
              key={item.title}
              role="listitem"
              className="fund-salvation-item"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 'some' }}
              transition={{ duration: 0.32, delay: idx * 0.04, ease: EASE_OUT }}
            >
              <span className="fund-salvation-item__num" aria-hidden="true">
                {pad2(idx + 1)}
              </span>
              <h4 className="fund-salvation-item__title">{item.title}</h4>
              <p className="fund-salvation-item__quote">«{item.quote}»</p>
              <p className="fund-salvation-item__ref-wrap">
                {href ? (
                  <Link className="fund-salvation-item__ref" to={href}>
                    {item.ref} <span aria-hidden="true">↗</span>
                  </Link>
                ) : (
                  <span className="fund-salvation-item__ref-static">{item.ref}</span>
                )}
              </p>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {punto.verses?.length > 0 && (
        <div className="fund-verses">
          {punto.verses.map(v => (
            <VerseBlock key={`${punto.id}-${v.ref}`} verse={v} />
          ))}
        </div>
      )}

      {punto.negativeList && (
        <div className="fund-contrast-box">
          <div className="fund-contrast-box__neg">
            <p className="fund-contrast-box__label">{punto.negativeTitle}</p>
            <ul>
              {punto.negativeList.map(item => (
                <li key={item.label}>
                  <strong>{item.label}</strong>
                  {item.note && <span className="muted"> — {item.note}</span>}
                </li>
              ))}
            </ul>
          </div>
          {punto.positiveSummary && (
            <p className="fund-contrast-box__pos">{punto.positiveSummary}</p>
          )}
        </div>
      )}

      {punto.layout === 'comparison' && punto.comparison && (
        <div className="fund-compare" role="region" aria-label="Comparativa entre razón y revelación">
          <div className="fund-compare__col">
            <h4 className="fund-compare__head">{punto.comparison.leftTitle}</h4>
            <ul className="fund-compare__list">
              {punto.comparison.rows.map(([left]) => (
                <li key={left}>{left}</li>
              ))}
            </ul>
          </div>
          <div className="fund-compare__col fund-compare__col--accent">
            <h4 className="fund-compare__head">{punto.comparison.rightTitle}</h4>
            <ul className="fund-compare__list">
              {punto.comparison.rows.map(([, right]) => (
                <li key={right}>{right}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {punto.steps && (
        <div className="fund-steps">
          {punto.stepsTitle && <p className="fund-steps__title">{punto.stepsTitle}</p>}
          <ol className="fund-steps__list">
            {punto.steps.map((step, idx) => {
              const parsed = step.ref ? parsePassage(step.ref) : null;
              const href = parsed ? ntvPath(parsed) : null;
              return (
                <li key={step.label} className="fund-steps__item">
                  <span className="fund-steps__badge" aria-hidden="true">
                    {idx + 1}
                  </span>
                  <p className="fund-steps__text">
                    {step.label}
                    {step.ref && (
                      <>
                        {' '}
                        {href ? (
                          <Link className="fund-inline-ref" to={href}>
                            ({step.ref})
                          </Link>
                        ) : (
                          <span className="muted">({step.ref})</span>
                        )}
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {punto.traits && (
        <div className="fund-traits">
          {punto.traitsTitle && <p className="fund-traits__title">{punto.traitsTitle}</p>}
          <ul className="fund-traits__list">
            {punto.traits.map(trait => (
              <li key={trait.title}>
                <strong>{trait.title}</strong>
                {trait.detail && <span className="muted"> — {trait.detail}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/** Mapa doctrinal interactivo que reemplaza al diagrama ASCII original. */
function DoctrinalMap({ onJump }) {
  const posicionNodes = [
    { id: 'punto-01', title: 'Perdón', sub: 'Culpa y deuda quitadas' },
    { id: 'punto-02', title: 'Justificación', sub: 'Declarado justo por fe' },
    { id: 'punto-03', title: 'Reconciliación', sub: 'Relación restaurada' },
    { id: 'punto-04', title: 'Hijo de Dios', sub: 'Nuevo nacimiento + adopción' }
  ];

  const crecimientoNodes = [
    { id: 'punto-11', title: 'Santificación', sub: 'Crecer en santidad' },
    { id: 'punto-12', title: 'Purificación', sub: 'Limpieza diaria' },
    { id: 'punto-13', title: 'Consagración', sub: 'Dedicación total' }
  ];

  const vocacionNodes = [
    { id: 'punto-15', title: 'Testigo' },
    { id: 'punto-16', title: 'Obrero' },
    { id: 'punto-17', title: 'Soldado' },
    { id: 'punto-18', title: 'Ministro' },
    { id: 'punto-19', title: 'Embajador' },
    { id: 'punto-20', title: 'Discípulo' }
  ];

  return (
    <motion.section
      id="mapa-doctrinal"
      data-fund-anchor="mapa-doctrinal"
      className="fund-map"
      aria-labelledby="mapa-doctrinal-titulo"
      variants={CARD_VARIANTS}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 'some' }}
    >
      <div className="fund-map__head">
        <p className="eyebrow">Síntesis visual</p>
        <h2 id="mapa-doctrinal-titulo" tabIndex={-1}>
          Mapa doctrinal completo
        </h2>
        <p className="muted">
          Pulsa cualquier eslabón del recorrido para volver directamente a su fundamento y citas NTV.
        </p>
      </div>

      <div className="fund-map__flow">
        <div className="fund-map__chain">
          {posicionNodes.map((node, i) => (
            <div className="fund-map__step-wrap" key={node.id}>
              <a
                href={`#${node.id}`}
                className="fund-map__node"
                onClick={onJump(node.id)}
              >
                <span className="fund-map__node-num">{pad2(i + 1)}</span>
                <span className="fund-map__node-body">
                  <strong>{node.title}</strong>
                  <span>{node.sub}</span>
                </span>
              </a>
              <span className="fund-map__connector" aria-hidden="true">
                ↓
              </span>
            </div>
          ))}
        </div>

        <div className="fund-map__vault">
          <div className="fund-map__vault-head">
            <span className="fund-map__vault-eyebrow">Núcleo de la gracia</span>
            <h3>Salvo por gracia — Regalo irrevocable</h3>
          </div>
          <div className="fund-map__vault-grid">
            <a href="#punto-08" className="fund-map__vault-pill" onClick={onJump('punto-08')}>
              <strong>Salvación</strong>
              <span>Por fe, no por obras</span>
            </a>
            <a href="#punto-09" className="fund-map__vault-pill" onClick={onJump('punto-09')}>
              <strong>Filiación</strong>
              <span>Por adopción, no por mérito</span>
            </a>
            <a href="#punto-10" className="fund-map__vault-pill" onClick={onJump('punto-10')}>
              <strong>Vida eterna</strong>
              <span>Regalo, no por conducta</span>
            </a>
          </div>
        </div>

        <span className="fund-map__connector" aria-hidden="true">
          ↓
        </span>

        <div className="fund-map__triad">
          {crecimientoNodes.map((node, i) => (
            <a
              key={node.id}
              href={`#${node.id}`}
              className="fund-map__node fund-map__node--compact"
              onClick={onJump(node.id)}
            >
              <span className="fund-map__node-num">{pad2(i + 11)}</span>
              <span className="fund-map__node-body">
                <strong>{node.title}</strong>
                <span>{node.sub}</span>
              </span>
            </a>
          ))}
        </div>

        <span className="fund-map__connector" aria-hidden="true">
          ↓
        </span>

        <div className="fund-map__maturity">
          <a href="#punto-14" className="fund-map__maturity-head" onClick={onJump('punto-14')}>
            <span className="fund-map__node-num">14</span>
            <span>Madurez espiritual</span>
          </a>
          <div className="fund-map__roles">
            {vocacionNodes.map((node, i) => (
              <a
                key={node.id}
                href={`#${node.id}`}
                className="fund-map__role"
                onClick={onJump(node.id)}
              >
                <span className="fund-map__role-num">{pad2(i + 15)}</span>
                <span>{node.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default function FundamentosShowcase({ study }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 32, restDelta: 0.001 });
  const [activeAnchor, setActiveAnchor] = useState('punto-01');
  const clickLockRef = useRef(0);

  const groupedBlocks = useMemo(
    () =>
      FUNDAMENTOS_BLOQUES.map(bloque => ({
        ...bloque,
        puntos: FUNDAMENTOS_PUNTOS.filter(p => p.bloqueId === bloque.id)
      })),
    []
  );

  // Scrollspy sobre los 20 puntos y el mapa doctrinal.
  useEffect(() => {
    const anchors = Array.from(document.querySelectorAll('[data-fund-anchor]'));
    if (!anchors.length) return undefined;

    const visible = new Set();
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        if (Date.now() < clickLockRef.current) return;
        const first = anchors.find(a => visible.has(a));
        if (first) setActiveAnchor(first.dataset.fundAnchor);
      },
      { rootMargin: '-120px 0px -55% 0px' }
    );

    anchors.forEach(a => io.observe(a));
    return () => io.disconnect();
  }, []);

  const jumpTo = id => event => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    clickLockRef.current = Date.now() + 900;
    setActiveAnchor(id);
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="fund-showcase">
        <motion.div className="fund-progress" style={{ scaleX }} aria-hidden="true" />

        <motion.header
          className="fund-hero"
          variants={HERO_VARIANTS}
          initial="hidden"
          animate="visible"
        >
          {study.portada ? (
            <figure className="fund-hero__media">
              <motion.img
                src={study.portada}
                alt=""
                initial={{ scale: 1.04, opacity: 0.85 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: EASE_OUT }}
              />
              <div className="fund-hero__media-vignette" aria-hidden="true" />
            </figure>
          ) : (
            <div className="fund-hero__stage" aria-hidden="true">
              <div className="fund-hero__grid-bg" />
              <div className="fund-hero__glow" />
              <CruxEmblem />
              <span className="fund-hero__stage-caption">20 FUNDAMENTOS · NTV</span>
            </div>
          )}

          <div className="fund-hero__content">
            <p className="eyebrow">01 · Fundamentos · Recorrido doctrinal</p>
            <h1>{study.title}</h1>
            <p className="lead">
              Veinte preguntas esenciales sobre el perdón, la justificación, la gracia irrevocable,
              la santificación y la vocación cristiana — respondidas exclusivamente desde la Nueva
              Traducción Viviente.
            </p>

            <div className="study-detail__facts">
              <span className="fact">
                Recorrido <strong>20 fundamentos</strong>
              </span>
              <span className="fact">
                Estructura <strong>4 actos doctrinales</strong>
              </span>
              <span className="fact">
                Fuente <strong>NTV</strong>
              </span>
              <span className="fact">
                Actualizado <strong>{study.updated || '—'}</strong>
              </span>
            </div>

            <nav className="fund-hero__pills" aria-label="Ir a un bloque doctrinal">
              {FUNDAMENTOS_BLOQUES.map(bloque => (
                <a
                  key={bloque.id}
                  href={`#bloque-${bloque.id}`}
                  className="fund-pill"
                  onClick={jumpTo(`bloque-${bloque.id}`)}
                >
                  <span className="fund-pill__roman">{bloque.roman}</span>
                  <span>{bloque.title}</span>
                </a>
              ))}
              <a
                href="#mapa-doctrinal"
                className="fund-pill fund-pill--accent"
                onClick={jumpTo('mapa-doctrinal')}
              >
                <span>Mapa doctrinal</span>
              </a>
            </nav>
          </div>
        </motion.header>

        <div className="fund-layout">
          <aside className="fund-side" aria-label="Índice del recorrido doctrinal">
            <div className="fund-side__inner">
              <p className="fund-side__heading">Índice doctrinal</p>
              {groupedBlocks.map(bloque => (
                <div key={bloque.id} className="fund-side__group">
                  <a
                    href={`#bloque-${bloque.id}`}
                    className="fund-side__act"
                    onClick={jumpTo(`bloque-${bloque.id}`)}
                  >
                    <span>
                      {bloque.roman}. {bloque.title}
                    </span>
                    <span className="fund-side__count">{bloque.puntos.length}</span>
                  </a>
                  <ul className="fund-side__list">
                    {bloque.puntos.map(p => (
                      <li key={p.id}>
                        <a
                          href={`#${p.id}`}
                          className="fund-side__item"
                          aria-current={activeAnchor === p.id ? 'true' : undefined}
                          onClick={jumpTo(p.id)}
                        >
                          <span className="fund-side__num">{pad2(p.num)}</span>
                          <span className="fund-side__label">{p.shortTitle}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <a
                href="#mapa-doctrinal"
                className="fund-side__map-link"
                aria-current={activeAnchor === 'mapa-doctrinal' ? 'true' : undefined}
                onClick={jumpTo('mapa-doctrinal')}
              >
                <span>Mapa doctrinal completo</span>
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </aside>

          <div className="fund-stream">
            {groupedBlocks.map(bloque => (
              <section
                key={bloque.id}
                id={`bloque-${bloque.id}`}
                className="fund-act"
                aria-labelledby={`titulo-bloque-${bloque.id}`}
              >
                <motion.header
                  className="fund-act__head"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 'some' }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                >
                  <div className="fund-act__title-row">
                    <span className="fund-act__roman" aria-hidden="true">
                      {bloque.roman}
                    </span>
                    <div>
                      <p className="eyebrow">{bloque.subtitle}</p>
                      <h2 id={`titulo-bloque-${bloque.id}`} tabIndex={-1}>
                        {bloque.title}
                      </h2>
                    </div>
                  </div>
                  <p className="fund-act__summary">{bloque.summary}</p>
                  {bloque.image && (
                    <figure className="fund-act__art">
                      <img src={assetUrl(bloque.image)} alt="" loading="lazy" />
                    </figure>
                  )}
                </motion.header>

                <div className="fund-act__cards">
                  {bloque.puntos.map(punto => (
                    <motion.section
                      key={punto.id}
                      id={punto.id}
                      data-fund-anchor={punto.id}
                      tabIndex={-1}
                      className={`fund-card${punto.verdict ? ' fund-card--verdict' : ''}`}
                      aria-labelledby={`q-${punto.id}`}
                      variants={CARD_VARIANTS}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 'some' }}
                    >
                      <div className="fund-card__top">
                        <div className="fund-card__kicker">
                          <span className="fund-card__num">{pad2(punto.num)}</span>
                          <span className="fund-card__tag">
                            {punto.roleBadge || punto.shortTitle}
                          </span>
                        </div>
                        {punto.verdict && (
                          <span className="fund-card__verdict" aria-label={`Respuesta: ${punto.verdict}`}>
                            {punto.verdict}
                          </span>
                        )}
                      </div>

                      <h3 id={`q-${punto.id}`} className="fund-card__question">
                        {punto.question}
                      </h3>

                      {punto.lead && <p className="fund-card__lead">{punto.lead}</p>}

                      <PointSpecialContent punto={punto} />

                      {punto.closing && <p className="fund-card__closing">{punto.closing}</p>}

                      {punto.studySlug && (
                        <footer className="fund-card__foot">
                          <Link className="fund-card__more" to={`/estudio/${punto.studySlug}`}>
                            <span>Profundizar en la ficha completa</span>
                            <span aria-hidden="true">→</span>
                          </Link>
                        </footer>
                      )}
                    </motion.section>
                  ))}
                </div>
              </section>
            ))}

            <DoctrinalMap onJump={jumpTo} />

            <p className="fund-source-note">
              <strong>Referencia:</strong> Todas las citas son de la NTV (Nueva Traducción Viviente).
            </p>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
