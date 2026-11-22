import { useState } from 'react';
import { Link } from 'react-router-dom';

import { BOOK_BY_ID, parsePassage } from '../../data/exegesis';

import './StudyCard.css';

/** Abreviatura del libro del pasaje («Lucas 15:11-32» → «Lc»); sin pasaje, la inicial del título. */
function bookMark(passage, title) {
  const ref = parsePassage(passage);
  const book = ref && BOOK_BY_ID.get(ref.bookId);
  return book ? book.abbr : String(title || '').trim().charAt(0);
}

/** Lo que pinta la card, igual para estudios, personajes y libros bíblicos. */
function cardData(entry) {
  const d = entry.data;
  if (entry.kind === 'personaje') {
    const images = [d.portada, ...(d.escenas || [])].filter(Boolean);
    return {
      images,
      position: 'center 18%',
      badge: d.escenas?.length ? `${d.escenas.length} ${d.escenas.length === 1 ? 'escena' : 'escenas'}` : '',
      meta: ['Personaje', d.epoca].filter(Boolean).join(' · '),
      title: d.nombre,
      sub: d.rol,
      desc: d.resumen,
      stats: [
        ['Escenas', d.escenas?.length || 0],
        ['Hitos', d.timeline?.length || 0],
        ['Época', d.epocaCorta || '—']
      ],
      cta: 'Ver la ficha'
    };
  }
  if (entry.kind === 'libro') {
    const cover = d.portada ? [d.portada] : [];
    const genre = d.genre ? `${d.genre.charAt(0).toUpperCase()}${d.genre.slice(1)}` : '';
    return {
      images: cover,
      position: 'center',
      mark: d.abbr,
      badge: d.badge || '',
      meta: d.meta || '',
      title: d.title,
      sub: genre,
      desc: d.summary || 'Ficha en preparación.',
      stats: [
        ['Capítulos', d.chapters ?? '—'],
        ['Versículos', d.versesFormatted ?? '—'],
        ['Testigos', d.witnesses || '—']
      ],
      cta: d.cta || 'Leer ficha'
    };
  }
  // Los estudios no llevan imagen: la card muestra el libro del pasaje.
  return {
    images: [],
    position: 'center',
    mark: bookMark(d.passage, d.title),
    badge: d.number ? `Nº ${d.number}` : '',
    meta: [d.category?.split('-')[0], d.categoryLabel, d.subcategory].filter(Boolean).join(' · '),
    title: d.title,
    sub: d.passage,
    desc: d.description,
    stats: [
      ['Lectura', `${d.minutes || 1} min`],
      ['Citas', d.citations ?? 0],
      ['Secciones', d.sections ?? 0]
    ],
    cta: 'Leer ficha'
  };
}

/**
 * Card común de las vistas de tarjetas (fase F del rediseño).
 *
 * `entry` es `{ kind: 'estudio'|'personaje'|'libro', data, href }`. La raíz conserva
 * `.study-card` para la aparición (`is-revealed`, `--reveal-d`) y la
 * inclinación (`--tilt-x/--tilt-y`) que gestiona `/estudio` y `/biblia/libros`.
 * Un solo enlace por card; las flechas del mini carrusel de escenas van fuera del enlace.
 * Con `linked={false}` (destacados) la card no es enlace: navega su carrusel.
 */
export default function StudyCard({ entry, headingLevel = 2, index = 0, linked = true, className = '' }) {
  const c = cardData(entry);
  const [shown, setShown] = useState(0);
  const Heading = `h${headingLevel}`;
  const Wrap = linked ? Link : 'div';
  const many = c.images.length > 1;
  const longMark = String(c.mark || '').length >= 4;

  const step = dir => event => {
    event.preventDefault();
    event.stopPropagation();
    setShown(i => (i + dir + c.images.length) % c.images.length);
  };

  return (
    <div className={`study-card ${className}`.trim()} style={{ '--reveal-d': `${(index % 9) * 55}ms` }}>
      <Wrap className="study-card__link" {...(linked ? { to: entry.href } : {})}>
        <div className="study-card__media">
          {c.images.length > 0 ? (
            <img
              className="study-card__img"
              src={c.images[shown]}
              alt=""
              loading="lazy"
              draggable={false}
              style={{ objectPosition: c.position }}
            />
          ) : (
            <span className={`study-card__mark${longMark ? ' study-card__mark--long' : ''}`} aria-hidden="true">
              {c.mark}
            </span>
          )}
          {c.badge && <span className="study-card__badge">{c.badge}</span>}
          {many && (
            <span className="study-card__dots" aria-hidden="true">
              {c.images.slice(0, 7).map((src, i) => (
                <span key={src} className={i === Math.min(shown, 6) ? 'is-on' : undefined} />
              ))}
            </span>
          )}
        </div>
        <div className="study-card__body">
          {c.meta && <p className="study-card__meta">{c.meta}</p>}
          <Heading className="study-card__title">
            {c.title}
          </Heading>
          {c.sub && <p className="study-card__sub">{c.sub}</p>}
          {c.desc && <p className="study-card__desc">{c.desc}</p>}
        </div>
        <div className="study-card__foot">
          <dl className="study-card__stats">
            {c.stats.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <span className="study-card__cta" aria-hidden="true">
            {c.cta} →
          </span>
        </div>
      </Wrap>
      {many && (
        <>
          <button type="button" className="study-card__nav study-card__nav--prev" aria-label="Imagen anterior" onClick={step(-1)}>
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" className="study-card__nav study-card__nav--next" aria-label="Imagen siguiente" onClick={step(1)}>
            <span aria-hidden="true">›</span>
          </button>
        </>
      )}
    </div>
  );
}
