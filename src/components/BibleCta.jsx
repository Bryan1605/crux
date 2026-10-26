import { Link } from 'react-router-dom';

import { ALL_BOOKS, exegesisPath, ntvPath, parsePassage } from '../data/exegesis';

import './BibleCta.css';

/**
 * Puente entre los tres lectores de la casa: la Biblia Patrística, la NTV y la
 * exégesis comparada con el Codex.
 *
 * Quien llega desde un estudio con una cita («Mateo 11:28») aterriza en el
 * mismo pasaje, no en la portada del lector: `parsePassage` traduce la cita a
 * `?libro=…&cap=…&v=…`.
 */
const CARDS = [
  {
    id: 'patristica',
    glyph: '✝',
    eyebrow: 'Biblia Patrística',
    title: 'La voz de los Padres',
    text: 'La compilación de las cartas, homilías y tratados de los Padres de la Iglesia, con buscador y lectura hoja a hoja.',
    to: '/biblia'
  },
  {
    id: 'ntv',
    glyph: '✦',
    eyebrow: 'Biblia NTV',
    title: 'El texto en español',
    text: 'La Nueva Traducción Viviente completa, capítulo a capítulo, con sus notas del traductor.',
    to: '/biblia/ntv'
  },
  {
    id: 'exegesis',
    glyph: '⌘',
    eyebrow: 'Exégesis comparada',
    title: 'Codex × NTV',
    text: 'El uncial griego del siglo IV con su aparato crítico, versículo a versículo, junto al español.',
    to: '/exegesis'
  }
];

export default function BibleCta({ passage = '', exclude = '', title = 'Sigue leyendo', className = '' }) {
  const parsed = passedPassage(passage);
  const meta = parsed ? ALL_BOOKS.find(book => book.id === parsed.bookId) : null;
  const cards = CARDS.filter(
    card => card.id !== exclude && (card.id !== 'ntv' || !meta?.codexOnly)
  ).map(card => ({
    ...card,
    to: card.id === 'ntv' ? ntvPath(parsed) : card.id === 'exegesis' ? exegesisPath(parsed) : card.to
  }));

  return (
    <section className={`bcta ${className}`.trim()} aria-label={title}>
      <header className="bcta__head">
        <h2 className="bcta__title">{title}</h2>
        <p className="bcta__lead">
          {parsed ? (
            <>
              El mismo pasaje, <b>{passage}</b>,{' '}
              {cards.length === 3
                ? 'en los tres lectores.'
                : cards.length === 2
                  ? 'en los dos lectores disponibles.'
                  : 'en el lector disponible.'}
            </>
          ) : passage ? (
            <>
              La cita <b>{passage}</b> no se pudo situar en el canon: abre cualquiera de los lectores
              para buscarla por palabras.
            </>
          ) : (
            'La Escritura en tres lectores: la tradición de los Padres, el texto en español y el griego del Sinaítico.'
          )}
        </p>
      </header>

      <div className="bcta__grid">
        {cards.map(card => (
          <Link key={card.id} className={`bcta__card bcta__card--${card.id}`} to={card.to}>
            <span className="bcta__glyph" aria-hidden="true">
              {card.glyph}
            </span>
            <span className="bcta__eyebrow">{card.eyebrow}</span>
            <span className="bcta__card-title">{card.title}</span>
            <span className="bcta__text">{card.text}</span>
            <span className="bcta__go">
              Abrir <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Acepta una cita en texto o un objeto ya interpretado. */
function passedPassage(passage) {
  if (!passage) return null;
  if (typeof passage === 'string') return parsePassage(passage);
  return passage.bookId ? passage : null;
}
