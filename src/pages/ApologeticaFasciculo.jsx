import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { BOOK_BY_ID, WITNESS_ATTRIBUTION, exegesisPath, ntvPath } from '../data/exegesis';
import { apologeticaSeo } from '../lib/apologeticaSeo';
import { greekMarks, spanishMarks } from '../lib/claves';
import { splitOverline } from '../lib/greek';
import { useSeo, useSite } from '../lib/site';
import ApologeticaDoctrina from './ApologeticaDoctrina';

import './Shincheonji.css';

/*
 * Plantilla común para los fascículos de apologética («Preguntas con la Biblia»):
 * cada pregunta trae el versículo completo en el griego del Codex Sinaiticus y
 * en la NTV, y la respuesta («Lo que dice el texto») se abre aparte para pensar
 * antes. Opcionalmente incluye una segunda pestaña doctrinal con citas literales.
 */

const DEFAULT_CHIPS = [
  'Sin libros de nadie: solo el texto',
  'Versículos completos, sin recortes',
  'Puedes ver el manuscrito'
];

/** «76.2r» → «cuaderno 76 · f. 2r» (la referencia que usa el propio proyecto). */
const pageLabel = page => {
  const m = /^(\d+)\.(\d+[rv])$/.exec(page || '');
  return m ? `cuaderno ${m[1]} · f. ${m[2]}` : '';
};

/** Texto del Codex tal como se copió: nomina sacra con raya encima, sin las anclas del aparato. */
function GreekWord({ v }) {
  return splitOverline(v).map((part, j) =>
    part.overline ? (
      <span key={j} className="scj-ns">
        {part.text}
      </span>
    ) : (
      <span key={j}>{part.text}</span>
    )
  );
}

/**
 * Texto del Codex tal como se copió: nomina sacra con raya encima, sin las
 * anclas del aparato. Las palabras clave seguidas van en un solo <mark>.
 */
function Greek({ text, specs }) {
  const { tokens, marked } = greekMarks(text, specs);
  const words = tokens.map((t, i) => (t.k === 'w' ? i : -1)).filter(i => i >= 0);
  // Un espacio o signo entre dos palabras resaltadas también va dentro del resalte.
  const inMark = tokens.map((t, i) => {
    if (t.k === 'w') return marked.has(i);
    const prev = words.filter(w => w < i).pop();
    const next = words.find(w => w > i);
    return prev !== undefined && next !== undefined && marked.has(prev) && marked.has(next);
  });
  const out = [];
  let run = [];
  const flush = key => {
    if (run.length) out.push(<mark key={`m${key}`}>{run}</mark>);
    run = [];
  };
  tokens.forEach((t, i) => {
    if (t.k === 'sigil' || t.k === 'mark') return;
    const node = t.k === 'w' ? <GreekWord key={i} v={t.v} /> : <span key={i}>{t.v}</span>;
    if (inMark[i]) run.push(node);
    else {
      flush(i);
      out.push(node);
    }
  });
  flush('end');
  return out;
}

/** NTV con las frases clave resaltadas. */
function Spanish({ text, specs }) {
  return spanishMarks(text, specs).parts.map((p, i) => (p.mark ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>));
}

/** Un pasaje: griego del Codex (o aviso) al lado de la NTV. El texto viene en el JSON. */
function Passage({ r, clave }) {
  const book = BOOK_BY_ID.get(r.libro);
  const ot = book?.testament === 'AT';
  const g = r.codex ? { ...r, ...r.codex } : r;
  const grc = r.grc || [];
  const ntv = r.ntv || [];
  const facsimil =
    book?.codexNo && grc.length
      ? `https://www.codexsinaiticus.org/en/manuscript.aspx?book=${book.codexNo}&chapter=${g.cap}&verse=${g.desde}`
      : null;

  return (
    <div className="scj-pair">
      <div className="scj-col scj-col--grc" lang="grc">
        <p className="scj-lab">
          <span>{ot ? 'Griego · Septuaginta (Codex Sinaiticus)' : 'Griego · Codex Sinaiticus'}</span>
          <span>{r.pagina ? pageLabel(r.pagina) : r.label}</span>
        </p>
        {grc.length > 0 ? (
          <p className="scj-grc">
            {grc.map(v => (
              <span key={v.n}>
                {grc.length > 1 && <sup>{v.n}</sup>}
                <Greek text={v.grc} specs={clave?.grc} />{' '}
              </span>
            ))}
          </p>
        ) : (
          <p className="scj-note">El Codex Sinaiticus no conserva este pasaje.</p>
        )}
        {r.nota && <p className="scj-note">{r.nota}</p>}
        {ot && (
          <p className="scj-note">
            El Antiguo Testamento se escribió en hebreo; esto es su traducción griega antigua. El texto hebreo se
            añadirá cuando esté en Crux.
          </p>
        )}
      </div>
      <div className="scj-col scj-col--es" lang="es">
        <p className="scj-lab">
          <span>Español · NTV</span>
          <span>{r.label}</span>
        </p>
        <p className="scj-es">
          {ntv.map(v => (
            <span key={v.n}>
              {ntv.length > 1 && <sup>{v.n}</sup>}
              <Spanish text={v.text} specs={clave?.es} />{' '}
            </span>
          ))}
        </p>
        <p className="scj-mini-links">
          <Link to={ntvPath(r.label)}>Leer el capítulo</Link>
          <Link to={exegesisPath(r.label)}>Ver en Exégesis</Link>
          {facsimil && (
            <a href={facsimil} target="_blank" rel="noopener noreferrer">
              Manuscrito <span aria-hidden="true">↗</span>
            </a>
          )}
        </p>
      </div>
    </div>
  );
}

function Question({ p, claveLista }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#p-${p.n}`;
    try {
      if (navigator.share) await navigator.share({ title: `Pregunta ${p.n}`, text: p.texto, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      /* compartir cancelado */
    }
  };

  return (
    <article className="scj-q" id={`p-${p.n}`} aria-labelledby={`p-${p.n}-t`}>
      <div className="scj-q__head">
        <span className="scj-q__num" aria-hidden="true">
          {String(p.n).padStart(2, '0')}
        </span>
        <h3 className="scj-q__text" id={`p-${p.n}-t`}>
          <span className="sr-only">Pregunta {p.n}. </span>
          {p.texto}
        </h3>
      </div>

      {p.refs.map(r => (
        <Passage key={r.label} r={r} clave={claveLista?.find(c => c.ref === r.label)} />
      ))}

      <p className="scj-think">¿Qué responderías tú, con el texto delante?</p>
      <details className="scj-key">
        <summary>Lo que dice el texto</summary>
        <p>{p.clave}</p>
        {p.claveRefs.length > 0 && (
          <p className="scj-key__refs">
            Lee también:{' '}
            {p.claveRefs.map((r, i) => (
              <span key={r.label}>
                {i > 0 && ' · '}
                <Link to={exegesisPath(r.label)}>{r.label}</Link>
              </span>
            ))}
          </p>
        )}
      </details>

      <div className="scj-q__foot">
        <button type="button" className="scj-chip" onClick={share}>
          {copied ? 'Enlace copiado' : 'Compartir esta pregunta'}
        </button>
      </div>
    </article>
  );
}

export default function ApologeticaFasciculo({ slug, data, clavesData, doctrina = null, copy }) {
  const site = useSite();
  useSeo(apologeticaSeo(slug, site.marca.nombre));
  const [params, setParams] = useSearchParams();
  const hasDoctrina = Boolean(doctrina);
  const vista = hasDoctrina && params.get('vista') === 'doctrina' ? 'doctrina' : 'preguntas';
  const claves = clavesData.claves || {};
  const chips = copy.chips || DEFAULT_CHIPS;

  const setVista = next => {
    const q = new URLSearchParams(params);
    if (next === 'doctrina') q.set('vista', 'doctrina');
    else q.delete('vista');
    setParams(q);
    const tabs = document.getElementById('scj-tabs');
    if (tabs && tabs.getBoundingClientRect().top < 0) tabs.scrollIntoView({ block: 'start' });
  };

  // Al entrar con #p-12, #bloque-III o #parte-II, ir allí cuando ya está pintado
  // (y abrir la pestaña que lo contiene).
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    if (hasDoctrina) {
      const enDoctrina = /^(parte-|preguntas-)/.test(id);
      if (enDoctrina !== (vista === 'doctrina')) {
        setVista(enDoctrina ? 'doctrina' : 'preguntas');
      }
    }
    const el = document.getElementById(id);
    if (el) window.setTimeout(() => el.scrollIntoView({ block: 'start' }), 80);
    // Solo al entrar en la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keyNav = e => {
    if (!hasDoctrina) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = vista === 'preguntas' ? 'doctrina' : 'preguntas';
      setVista(next);
      document.getElementById(`scj-tab-${next}`)?.focus();
    }
  };

  const preguntasContenido = (
    <div className="scj-layout">
      <nav className="scj-side" aria-label="Temas de las preguntas">
        <ul>
          {data.bloques.map(b => (
            <li key={b.id}>
              <a href={`#bloque-${b.id}`}>
                <span>
                  {b.id}. {b.titulo}
                </span>
                <span className="scj-side__range">
                  {b.desde}–{b.hasta}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="scj-blocks">
        {data.bloques.map(b => (
          <section key={b.id} id={`bloque-${b.id}`} className="scj-block" aria-labelledby={`bloque-${b.id}-t`}>
            <h2 id={`bloque-${b.id}-t`}>
              {b.id}. {b.titulo}
            </h2>
            <p className="scj-block__count">
              Preguntas {b.desde}–{b.hasta}
            </p>
            {b.preguntas.map(p => (
              <Question key={p.n} p={p} claveLista={claves[String(p.n)]} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );

  return (
    <main id="main" className="scj-page">
      <header className="scj-head">
        <div className="container">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>
            {copy.h1Line1}
            <br />
            {copy.h1Line2}
          </h1>
          <p className="lead">{copy.lead}</p>
          <ul className="scj-chips" aria-label="Cómo está hecha esta página">
            {chips.map(c => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </header>

      <div className="container">
        <div className="scj-intro">
          <section className="scj-card" aria-labelledby="scj-como">
            <h2 id="scj-como">Qué vas a hacer aquí</h2>
            <ol className="scj-steps">
              <li>
                <span aria-hidden="true">1</span>
                <div>
                  <strong>Lee la pregunta</strong>
                  {copy.step1}
                </div>
              </li>
              <li>
                <span aria-hidden="true">2</span>
                <div>
                  <strong>Lee el versículo</strong>
                  A un lado, el texto griego tal como se copió a mano hace más de 1.600 años; al otro, la traducción
                  al español.
                </div>
              </li>
              <li>
                <span aria-hidden="true">3</span>
                <div>
                  <strong>Responde tú, y luego compara</strong>
                  Piensa tu respuesta con el texto delante. Después abre «Lo que dice el texto» y compara.
                </div>
              </li>
            </ol>
            <p className="scj-berea">
              Es lo que hacían los de Berea: «día tras día examinaban las Escrituras para ver si Pablo y Silas
              enseñaban la verdad» (<Link to={ntvPath('Hechos 17:11')}>Hechos 17:11</Link>).
            </p>
            {copy.bereaExtra}
            {data.reglas.length > 0 && (
              <div className="scj-rules">
                <h3>Las reglas del examen</h3>
                <ol>
                  {data.reglas.map(r => (
                    <li key={r}>{r}</li>
                  ))}
                </ol>
              </div>
            )}
          </section>

          <section className="scj-card scj-card--codex" aria-labelledby="scj-codex">
            <h2 id="scj-codex">¿Qué es el Codex Sinaiticus?</h2>
            <p>
              Es uno de los manuscritos de la Biblia más antiguos que se conservan, y el más antiguo con el{' '}
              <strong>Nuevo Testamento completo</strong>. Lo copiaron a mano, en griego y sobre pergamino, a mediados
              del siglo IV.
            </p>
            <dl className="scj-facts">
              <div>
                <dt>s. IV</dt>
                <dd>copiado a mano</dd>
              </div>
              <div>
                <dt>Griego</dt>
                <dd>el idioma del Nuevo Testamento</dd>
              </div>
              <div>
                <dt>En línea</dt>
                <dd>cada página fotografiada</dd>
              </div>
            </dl>
            <p>
              Lo usamos para que veas que la traducción no cambia lo que dice el original: con el enlace «Manuscrito»
              abres la página del códice en{' '}
              <a href="https://www.codexsinaiticus.org/" target="_blank" rel="noopener noreferrer">
                codexsinaiticus.org
              </a>{' '}
              y la comparas tú.
            </p>
            <div className="scj-legend">
              <h3>Cómo leer el griego</h3>
              <ul>
                <li>Está escrito como en el manuscrito: sin tildes ni mayúsculas.</li>
                <li>
                  Los nombres sagrados van abreviados con una raya encima:{' '}
                  <span lang="grc" className="scj-grc-inline">
                    <span className="scj-ns">θϲ</span>
                  </span>{' '}
                  = Dios,{' '}
                  <span lang="grc" className="scj-grc-inline">
                    <span className="scj-ns">ιϲ</span>
                  </span>{' '}
                  = Jesús,{' '}
                  <span lang="grc" className="scj-grc-inline">
                    <span className="scj-ns">πνα</span>
                  </span>{' '}
                  = Espíritu.
                </li>
                <li>
                  La letra{' '}
                  <span lang="grc" className="scj-grc-inline">
                    ϲ
                  </span>{' '}
                  es la <em>s</em> griega (sigma).
                </li>
                <li>
                  Una raya sobre una sola letra es una abreviatura del copista: suele faltar una <em>n</em> (
                  <span lang="grc" className="scj-grc-inline">
                    π<span className="scj-ns">α</span>τα
                  </span>{' '}
                  = πάντα, «todos»).
                </li>
                <li>
                  Los dos puntos sobre la{' '}
                  <span lang="grc" className="scj-grc-inline">
                    ι
                  </span>{' '}
                  o la{' '}
                  <span lang="grc" className="scj-grc-inline">
                    υ
                  </span>{' '}
                  (
                  <span lang="grc" className="scj-grc-inline">
                    ϊ, ϋ
                  </span>
                  ) son marcas de lectura del copista; no cambian la palabra.
                </li>
              </ul>
            </div>
          </section>
        </div>

        {hasDoctrina ? (
          <>
            <div className="scj-tabs" id="scj-tabs" role="tablist" aria-label="Secciones de la página">
              {[
                ['preguntas', copy.tabPreguntas || '100 preguntas'],
                ['doctrina', copy.tabDoctrina || '¿Qué cree este movimiento?']
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`scj-tab-${id}`}
                  aria-selected={vista === id}
                  aria-controls={`scj-panel-${id}`}
                  tabIndex={vista === id ? 0 : -1}
                  onClick={() => setVista(id)}
                  onKeyDown={keyNav}
                >
                  {label}
                </button>
              ))}
            </div>

            <div role="tabpanel" id="scj-panel-doctrina" aria-labelledby="scj-tab-doctrina" hidden={vista !== 'doctrina'}>
              <ApologeticaDoctrina doctrina={doctrina} />
            </div>

            <div role="tabpanel" id="scj-panel-preguntas" aria-labelledby="scj-tab-preguntas" hidden={vista !== 'preguntas'}>
              {preguntasContenido}
            </div>
          </>
        ) : (
          <div id="scj-panel-preguntas">{preguntasContenido}</div>
        )}

        <footer className="scj-credits" id="fuentes">
          <h2>Fuentes</h2>
          <p>
            <strong>Codex Sinaiticus:</strong> transcripción del{' '}
            <a href="https://www.codexsinaiticus.org/" target="_blank" rel="noopener noreferrer">
              Codex Sinaiticus Project
            </a>
            , propiedad de la British Library, la Universidad de Leipzig, el Monasterio de Santa Catalina (Sinaí) y
            la Biblioteca Nacional de Rusia. Uso personal, educativo y no comercial, con atribución.
          </p>
          <p className="scj-license">{WITNESS_ATTRIBUTION}</p>
          <p>
            <strong>Datos del recuadro «¿Qué es el Codex Sinaiticus?»:</strong> Codex Sinaiticus Project,{' '}
            <a
              href="https://www.codexsinaiticus.org/en/codex/default.aspx"
              target="_blank"
              rel="noopener noreferrer"
            >
              «About Codex Sinaiticus»
            </a>{' '}
            (consultado el 13 de noviembre de 2026).
          </p>
          {copy.libroCredito}
          {copy.credosCredito}
          {copy.fuenteExtra}
          <p>
            <strong>NTV:</strong> Nueva Traducción Viviente. Las preguntas y las respuestas son de Crux
            {data.fuente?.actualizado ? ` (revisadas el ${data.fuente.actualizado})` : ''}.
          </p>
          <p>
            <a href="#main">Volver arriba</a>
          </p>
        </footer>
      </div>
    </main>
  );
}
