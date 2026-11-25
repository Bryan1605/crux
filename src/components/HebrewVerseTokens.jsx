import { Fragment } from 'react';

import { needsSpaceBefore } from '../lib/hebrew';

/**
 * Pinta los tokens de un versículo en hebreo o arameo respetando RTL, maqqef,
 * marcas palabra por palabra en arameo, ketiv/qere interactivo y parashá.
 *
 * REGLA: no normaliza el texto Unicode del WLC (sin NFC/NFD); `formatSurface`
 * aplica únicamente filtros visuales de cantilación o niqqud al renderizar.
 */
export default function HebrewVerseTokens({ tokens, verseNum, formatSurface, onKetivQere, activeKqId }) {
  if (!Array.isArray(tokens)) return null;

  return tokens.map((tok, idx) => {
    const prev = idx > 0 ? tokens[idx - 1] : null;
    const space = prev && needsSpaceBefore(prev, tok) ? ' ' : null;

    if (typeof tok === 'string') {
      return (
        <Fragment key={idx}>
          {space}
          {formatSurface(tok)}
        </Fragment>
      );
    }

    if (typeof tok.a === 'string') {
      return (
        <Fragment key={idx}>
          {space}
          <span className="heb-w heb-w--arc" lang="arc" title="Arameo bíblico">
            {formatSurface(tok.a)}
          </span>
        </Fragment>
      );
    }

    if ('k' in tok) {
      const kqId = `${verseNum}:${idx}`;
      const isArc = Boolean(tok.a);
      const lang = isArc ? 'arc' : 'he';
      const detailLabel =
        tok.k && tok.q
          ? ` — variante masorética ketiv (${tok.k}) y qere (${tok.q}), abrir explicación`
          : tok.k
            ? ` — ketiv (${tok.k}) no leído en voz alta, abrir explicación`
            : ` — qere (${tok.q}) no escrito en consonantes, abrir explicación`;

      return (
        <Fragment key={idx}>
          {space}
          <button
            type="button"
            className={`heb-kq${isArc ? ' heb-kq--arc' : ''}${activeKqId === kqId ? ' is-active' : ''}`}
            title="Ketiv / Qere · pulsar para ver detalle"
            onClick={event => {
              event.stopPropagation();
              onKetivQere(event.currentTarget, {
                id: kqId,
                verse: verseNum,
                ketiv: tok.k,
                qere: tok.q,
                aramaic: isArc
              });
            }}
          >
            {tok.k ? (
              <span className="heb-kq__k" lang={lang}>
                [{formatSurface(tok.k)}]
              </span>
            ) : null}
            {tok.k && tok.q ? (
              <span className="heb-kq__sep" aria-hidden="true">
                /
              </span>
            ) : null}
            {tok.q ? (
              <span className="heb-kq__q" lang={lang}>
                ({formatSurface(tok.q)})
              </span>
            ) : (
              <span className="heb-kq__mute">
                · sin qeré
              </span>
            )}
            <span className="sr-only">{detailLabel}</span>
          </button>
        </Fragment>
      );
    }

    if (typeof tok.p === 'string') {
      const title =
        tok.p === 'פ'
          ? 'Parashá abierta (petuhá)'
          : tok.p === 'ס'
            ? 'Parashá cerrada (setumá)'
            : 'Nun invertida masorética';
      return (
        <Fragment key={idx}>
          {space}
          <span className="heb-parashah" title={title} aria-label={title}>
            {tok.p}
          </span>
        </Fragment>
      );
    }

    return null;
  });
}
