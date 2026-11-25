import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import BibleCta from '../components/BibleCta';
import { BOOK_BY_ID } from '../data/exegesis';
import { GREEK_GUIDE, HEBREW_GUIDE } from '../data/guiaLectura';
import { guiaLecturaSeo } from '../lib/guiaSeo';
import { useSeo, useSite } from '../lib/site';

import './Estudio.css';
import './GuiaLectura.css';

const GUIDES = {
  griego: GREEK_GUIDE,
  hebreo: HEBREW_GUIDE
};

const TABS = [
  { id: 'griego', label: GREEK_GUIDE.tabLabel, glyph: 'Α ω' },
  { id: 'hebreo', label: HEBREW_GUIDE.tabLabel, glyph: 'א ת' }
];

function CodexWord({ text, ns = false }) {
  if (!ns) return <>{text}</>;
  return <span className="guia__overline">{text}</span>;
}

/* -------------------------------------------------------------------------- */
/* Explorador del alfabeto / alefato                                          */
/* -------------------------------------------------------------------------- */

function AlphabetExplorer({ guide, isHebrew }) {
  const [filter, setFilter] = useState('todas');
  const [selectedKey, setSelectedKey] = useState(null);

  const items = useMemo(() => {
    if (filter === 'todas') return guide.alphabet;
    if (!isHebrew) {
      if (filter === 'vocal') return guide.alphabet.filter(item => item.isVowel);
      return guide.alphabet.filter(item => item.group === filter);
    }
    return guide.alphabet.filter(item => item.tags.includes(filter));
  }, [guide.alphabet, filter, isHebrew]);

  const itemKey = item => (isHebrew ? item.name : item.upper);
  const activeItem =
    items.find(item => itemKey(item) === selectedKey) || items[0] || guide.alphabet[0];

  return (
    <div className="guia-alpha">
      <div className="chips guia-alpha__filters" role="group" aria-label="Filtrar letras">
        {guide.filters.map(f => (
          <button
            key={f.id}
            type="button"
            className="chip guia-chip"
            aria-pressed={filter === f.id}
            onClick={() => {
              setFilter(f.id);
              setSelectedKey(null);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {activeItem && (
        <div className="guia-focus" aria-live="polite">
          <div
            className={`guia-focus__glyph${isHebrew ? ' guia-script guia-script--he' : ' guia-script guia-script--el'}`}
            lang={isHebrew ? 'he' : 'el'}
            dir={isHebrew ? 'rtl' : 'ltr'}
          >
            {isHebrew ? (
              <>
                <span>{activeItem.letter}</span>
                {activeItem.sofit && (
                  <span className="guia-focus__sofit" title="Forma final (sofit)">
                    {' · '}
                    {activeItem.sofit}
                  </span>
                )}
              </>
            ) : (
              <>
                <span>{activeItem.upper}</span> <span>{activeItem.lower}</span>
              </>
            )}
          </div>

          <div className="guia-focus__info">
            <div className="guia-focus__head">
              <h3>{activeItem.name}</h3>
              <span className="guia-pill">{activeItem.sound}</span>
              <span className="guia-pill guia-pill--muted">Transcripción: {activeItem.translit}</span>
              {!isHebrew && activeItem.variant && (
                <span className="guia-pill guia-pill--accent">{activeItem.variant}</span>
              )}
              {isHebrew && activeItem.sofit && (
                <span className="guia-pill guia-pill--accent">Final (sofit): {activeItem.sofit}</span>
              )}
            </div>
            <p className="guia-focus__tip">{activeItem.tip}</p>
            <p className="guia-focus__example">
              Ejemplo bíblico:{' '}
              <strong
                className={isHebrew ? 'guia-script guia-script--he' : 'guia-script guia-script--el'}
                lang={isHebrew ? 'he' : 'el'}
                dir={isHebrew ? 'rtl' : 'ltr'}
              >
                {activeItem.example.word}
              </strong>{' '}
              <span className="guia-focus__read">({activeItem.example.read})</span> —{' '}
              <span className="muted">«{activeItem.example.gloss}»</span>
            </p>
          </div>
        </div>
      )}

      <ul className="guia-letters" aria-label="Cuadrícula del alfabeto">
        {items.map(item => {
          const key = itemKey(item);
          const isSelected = key === itemKey(activeItem);
          const isTrap = !isHebrew ? item.group === 'falso-amigo' : item.tags.includes('parecida');

          return (
            <li key={key}>
              <button
                type="button"
                className={`guia-letter${isSelected ? ' is-selected' : ''}${isTrap ? ' is-caution' : ''}`}
                aria-pressed={isSelected}
                onClick={() => setSelectedKey(key)}
              >
                <span
                  className={`guia-letter__char${isHebrew ? ' guia-script guia-script--he' : ' guia-script guia-script--el'}`}
                  lang={isHebrew ? 'he' : 'el'}
                  dir={isHebrew ? 'rtl' : 'ltr'}
                >
                  {isHebrew ? item.letter : `${item.upper} ${item.lower}`}
                </span>
                <span className="guia-letter__name">{item.name}</span>
                <span className="guia-letter__sound">{item.sound}</span>
                {!isHebrew && item.variant && <span className="guia-letter__badge">{item.variant}</span>}
                {isHebrew && item.sofit && <span className="guia-letter__badge">Final: {item.sofit}</span>}
                {!item.variant && !item.sofit && isTrap && (
                  <span className="guia-letter__badge">{isHebrew ? 'Ojo forma' : 'Falso amigo'}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Lectura guiada de un versículo palabra por palabra                         */
/* -------------------------------------------------------------------------- */

function VerseInspector({
  title,
  refLabel,
  exegesisHref,
  intro,
  words,
  isHebrew,
  codexDefault = false
}) {
  const [index, setIndex] = useState(0);
  const [altView, setAltView] = useState(codexDefault);

  const current = words[index] || words[0];

  return (
    <div className="guia-walk">
      <div className="guia-walk__top">
        <div>
          <h3>{title}</h3>
          {intro && <p className="muted">{intro}</p>}
        </div>
        <div className="guia-walk__controls">
          <button
            type="button"
            className="chip guia-chip"
            aria-pressed={altView}
            onClick={() => setAltView(v => !v)}
          >
            {isHebrew
              ? altView
                ? 'Mostrando sin vocales (rollo)'
                : 'Probar sin vocales'
              : altView
                ? 'Viendo Codex Sinaiticus'
                : 'Ver como en el Codex'}
          </button>
          <Link className="btn btn--ghost guia-btn" to={exegesisHref}>
            Abrir {refLabel} en Exégesis <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {isHebrew && (
        <p className="guia-rtl-cue">
          <span aria-hidden="true">←</span> Lectura de derecha a izquierda (empieza por la primera palabra a la derecha)
        </p>
      )}

      <div
        className={`guia-walk__verse${isHebrew ? ' is-rtl' : ''}`}
        dir={isHebrew ? 'rtl' : 'ltr'}
        lang={isHebrew ? 'he' : 'el'}
        role="group"
        aria-label={`Palabras de ${refLabel}`}
      >
        {words.map((w, i) => {
          const shown = isHebrew
            ? altView
              ? w.noPoints
              : w.printed
            : altView
              ? w.codex
              : w.printed;
          const useNs = !isHebrew && altView && w.codexNs;

          return (
            <button
              key={w.id}
              type="button"
              className={`guia-word${i === index ? ' is-active' : ''}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            >
              <span className={isHebrew ? 'guia-script guia-script--he' : 'guia-script guia-script--el'}>
                <CodexWord text={shown} ns={useNs} />
              </span>
              <span className="guia-word__num" dir="ltr">
                {i + 1}
              </span>
            </button>
          );
        })}
      </div>

      {current && (
        <div className="guia-walk__card" aria-live="polite">
          <div className="guia-walk__wordrow">
            <div
              className={`guia-walk__specimen${isHebrew ? ' guia-script guia-script--he' : ' guia-script guia-script--el'}`}
              lang={isHebrew ? 'he' : 'el'}
              dir={isHebrew ? 'rtl' : 'ltr'}
            >
              {current.printed}
            </div>
            {!isHebrew && (
              <div className="guia-walk__alt" lang="el">
                <span className="guia-walk__alt-label">Codex Sinaiticus:</span>{' '}
                <strong className="guia-script guia-script--el">
                  <CodexWord text={current.codex} ns={current.codexNs} />
                </strong>
              </div>
            )}
            {isHebrew && (
              <div className="guia-walk__alt" lang="he" dir="rtl">
                <span className="guia-walk__alt-label" dir="ltr">
                  Solo consonantes:
                </span>{' '}
                <strong className="guia-script guia-script--he">{current.noPoints}</strong>
              </div>
            )}
          </div>

          <dl className="guia-walk__meta">
            <div>
              <dt>Cómo suena</dt>
              <dd>
                <strong>{current.read}</strong> <span className="muted">({current.syllables})</span>
              </dd>
            </div>
            <div>
              <dt>Sentido</dt>
              <dd>«{current.gloss}»</dd>
            </div>
            <div>
              <dt>Gramática</dt>
              <dd>{current.grammar}</dd>
            </div>
          </dl>

          <p className="guia-walk__note">{current.note}</p>

          <div className="guia-walk__foot">
            <div className="guia-walk__step">
              <button
                type="button"
                className="btn btn--ghost guia-btn"
                disabled={index === 0}
                onClick={() => setIndex(i => Math.max(0, i - 1))}
              >
                ← Palabra anterior
              </button>
              <button
                type="button"
                className="btn btn--ghost guia-btn"
                disabled={index >= words.length - 1}
                onClick={() => setIndex(i => Math.min(words.length - 1, i + 1))}
              >
                Siguiente palabra →
              </button>
            </div>

            {!isHebrew && current.strong && (
              current.inLexico ? (
                <Link className="guia-link" to={`${exegesisHref}&dic=${current.strong}`}>
                  Ver {current.strong} en el diccionario griego →
                </Link>
              ) : (
                <span className="guia-pill guia-pill--muted">Strong {current.strong} (próximamente en el diccionario)</span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Práctica interactiva de lectura                                            */
/* -------------------------------------------------------------------------- */

function ReadingPractice({ items, isHebrew }) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [altScript, setAltScript] = useState(false);

  const q = items[step];

  const handlePick = idx => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.correctIndex) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (step + 1 >= items.length) {
      setDone(true);
    } else {
      setStep(s => s + 1);
      setPicked(null);
    }
  };

  const restart = () => {
    setStep(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    return (
      <div className="guia-practice guia-practice--done" role="status" aria-live="polite">
        <p className="guia-practice__kicker">Práctica completada</p>
        <h3>
          Acertaste {score} de {items.length} palabras
        </h3>
        <p className="muted">
          {score >= items.length - 1
            ? 'Ya lees el alfabeto con soltura. Prueba ahora pulsar palabras reales en Exégesis comparada.'
            : 'Buen comienzo. Repasa las letras «falsos amigos» o parecidas y vuelve a intentarlo.'}
        </p>
        <div className="guia-practice__actions">
          <button type="button" className="btn btn--primary guia-btn" onClick={restart}>
            Volver a practicar
          </button>
          <Link
            className="btn btn--ghost guia-btn"
            to={isHebrew ? '/biblia/hebreo?libro=genesis&cap=1' : '/exegesis?libro=juan&cap=1'}
          >
            {isHebrew ? 'Abrir la Biblia Hebrea →' : 'Ir a Exégesis comparada →'}
          </Link>
        </div>
      </div>
    );
  }

  const shownWord = isHebrew
    ? altScript
      ? q.unpointed
      : q.printed
    : altScript
      ? q.codex
      : q.printed;

  return (
    <div className="guia-practice">
      <div className="guia-practice__bar">
        <span className="guia-practice__progress">
          Palabra {step + 1} de {items.length} · Aciertos: {score}
        </span>
        <button
          type="button"
          className="chip guia-chip"
          aria-pressed={altScript}
          onClick={() => setAltScript(v => !v)}
        >
          {isHebrew
            ? altScript
              ? 'Modo sin vocales activo'
              : 'Reto sin vocales'
            : altScript
              ? 'Viendo estilo Codex'
              : 'Probar con estilo Codex'}
        </button>
      </div>

      <div className="guia-practice__prompt">
        <p className="guia-practice__label">¿Cómo se lee esta palabra?</p>
        <div
          className={`guia-practice__word${isHebrew ? ' guia-script guia-script--he' : ' guia-script guia-script--el'}`}
          lang={isHebrew ? 'he' : 'el'}
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          <CodexWord text={shownWord} ns={!isHebrew && altScript && q.codexNs} />
        </div>
      </div>

      <div className="guia-practice__options" role="group" aria-label="Opciones de pronunciación">
        {q.options.map((opt, idx) => {
          const isPicked = picked === idx;
          const isCorrect = idx === q.correctIndex;
          let stateClass = '';
          if (picked !== null) {
            if (isCorrect) stateClass = ' is-right';
            else if (isPicked) stateClass = ' is-wrong';
          }
          return (
            <button
              key={opt}
              type="button"
              className={`guia-option${stateClass}`}
              disabled={picked !== null}
              onClick={() => handlePick(idx)}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="guia-practice__feedback" role="status" aria-live="polite">
          <p className="guia-practice__verdict">
            {picked === q.correctIndex ? 'Correcto.' : `Casi: se lee «${q.options[q.correctIndex]}».`}{' '}
            <span className="muted">Significa «{q.meaning}».</span>
          </p>
          <p className="guia-practice__breakdown">{q.breakdown}</p>
          <div className="guia-practice__next">
            <button type="button" className="btn btn--primary guia-btn" onClick={handleNext}>
              {step + 1 >= items.length ? 'Ver resultado →' : 'Siguiente palabra →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Página principal                                                           */
/* -------------------------------------------------------------------------- */

export default function GuiaLectura() {
  const site = useSite();
  const [params, setParams] = useSearchParams();
  const baseId = useId();
  const tabRefs = useRef({});

  useSeo(guiaLecturaSeo(site.marca.nombre));

  const langParam = params.get('lengua');
  const lang = langParam === 'hebreo' ? 'hebreo' : 'griego';
  const guide = GUIDES[lang];
  const isHebrew = lang === 'hebreo';

  const rawBack = params.get('volver') || '';
  const fromHebreo = params.get('origen') === 'hebreo';
  const backBook = BOOK_BY_ID.get(rawBack);
  const backCap = Math.max(1, Number(params.get('cap')) || 1);
  const backHref = fromHebreo
    ? backBook && backBook.testament === 'AT' && !backBook.codexOnly
      ? `/biblia/hebreo?libro=${backBook.id}&cap=${backCap}`
      : '/biblia/hebreo'
    : backBook
      ? `/exegesis?libro=${backBook.id}&cap=${backCap}`
      : '/exegesis';
  const backLabel = fromHebreo
    ? backBook && backBook.testament === 'AT' && !backBook.codexOnly
      ? `Volver a ${backBook.name} ${backCap} (hebreo)`
      : 'Volver a la Biblia Hebrea'
    : backBook
      ? `Volver a ${backBook.name} ${backCap}`
      : 'Abrir Exégesis comparada';

  useEffect(() => {
    if (langParam && !GUIDES[langParam]) {
      const next = new URLSearchParams(params);
      next.set('lengua', 'griego');
      setParams(next, { replace: true });
    }
  }, [langParam, params, setParams]);

  const selectLang = nextLang => {
    const next = new URLSearchParams(params);
    next.set('lengua', nextLang);
    setParams(next, { replace: true });
  };

  const handleTabKey = (e, currentIdx) => {
    let targetIdx = null;
    if (e.key === 'ArrowRight') targetIdx = (currentIdx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') targetIdx = (currentIdx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') targetIdx = 0;
    else if (e.key === 'End') targetIdx = TABS.length - 1;
    if (targetIdx === null) return;
    e.preventDefault();
    const targetTab = TABS[targetIdx];
    selectLang(targetTab.id);
    tabRefs.current[targetTab.id]?.focus();
  };

  const panelId = id => `${baseId}-panel-${id}`;
  const tabId = id => `${baseId}-tab-${id}`;
  const otherLang = isHebrew ? 'griego' : 'hebreo';

  const sectionAnchors = isHebrew
    ? [
        { href: '#alfabeto', label: '1. Alefato (22)' },
        { href: '#sonidos', label: '2. Vocales y marcas' },
        { href: '#claves', label: '3. Raíz, prefijos y arameo' },
        { href: '#versiculo', label: '4. Leer Génesis 1:1' },
        { href: '#practica', label: '5. Práctica' }
      ]
    : [
        { href: '#alfabeto', label: '1. Alfabeto (24)' },
        { href: '#sonidos', label: '2. Diptongos y acentos' },
        { href: '#claves', label: '3. Claves del Codex' },
        { href: '#versiculo', label: '4. Leer Juan 1:1' },
        { href: '#practica', label: '5. Práctica' }
      ];

  return (
    <main id="main" className="guia">
      <header className="page-head guia__head">
        <div className="container">
          <nav className="breadcrumb" aria-label="Migas de pan">
            <Link to="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link to="/biblia">Biblia</Link>
            <span aria-hidden="true">/</span>
            <Link to={backHref}>{fromHebreo ? 'Biblia Hebrea' : 'Exégesis comparada'}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Guía de lectura</span>
          </nav>

          <div className="guia__top-actions">
            <Link className="btn btn--ghost guia-btn" to={backHref}>
              ← {backLabel}
            </Link>
            {isHebrew ? (
              !fromHebreo && (
                <Link className="btn btn--ghost guia-btn" to="/biblia/hebreo?libro=genesis&cap=1">
                  Abrir Biblia Hebrea (WLC)
                </Link>
              )
            ) : (
              <Link className="btn btn--ghost guia-btn" to={`${backHref}${backHref.includes('?') ? '&' : '?'}dic=`}>
                Abrir diccionario griego
              </Link>
            )}
          </div>

          <p className="eyebrow">{guide.eyebrow}</p>
          <h1>{guide.title}</h1>
          <p className="lead">{guide.lead}</p>

          <div className="guia__tabs" role="tablist" aria-label="Idioma de la guía">
            {TABS.map((t, idx) => {
              const active = lang === t.id;
              return (
                <button
                  key={t.id}
                  ref={el => {
                    tabRefs.current[t.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={tabId(t.id)}
                  aria-selected={active}
                  aria-controls={panelId(t.id)}
                  tabIndex={active ? 0 : -1}
                  className={`guia__tab${active ? ' is-active' : ''}`}
                  onClick={() => selectLang(t.id)}
                  onKeyDown={e => handleTabKey(e, idx)}
                >
                  <span className="guia__tab-glyph" aria-hidden="true">
                    {t.glyph}
                  </span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <nav className="guia__anchors" aria-label="Secciones de esta guía">
            {sectionAnchors.map(a => (
              <a key={a.href} href={a.href} className="guia__anchor">
                {a.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div
        id={panelId(lang)}
        role="tabpanel"
        aria-labelledby={tabId(lang)}
        className="guia__body"
      >
        {/* ---------------------- 0 · Primeras claves ------------------------ */}
        <section className="section guia-sec" aria-label="Primeras claves para empezar">
          <div className="container">
            <h2 className="guia-sec__title">Antes de empezar: {isHebrew ? 'cuatro' : 'tres'} ideas claras</h2>
            <div className="guia-cards guia-cards--intro">
              {guide.intro.map(card => (
                <article key={card.title} className="guia-card">
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------- 1 · Alfabeto / Alefato --------------------- */}
        <section id="alfabeto" className="section section--alt guia-sec" aria-label="Alfabeto completo">
          <div className="container">
            <div className="guia-sec__head">
              <h2>{isHebrew ? '1. El alefato hebreo y arameo (22 consonantes)' : '1. El alfabeto griego (24 letras)'}</h2>
              <p className="muted">
                {isHebrew
                  ? 'Se ordena de Álef a Tav. Las tarjetas con borde dorado señalan letras que suelen confundirse por su trazo; pulsa cualquiera para ampliarla arriba.'
                  : 'Las tarjetas marcadas con «Falso amigo» parecen letras latinas, pero suenan distinto (Η = e, Ν = n, Ρ = r, Χ = j). Pulsa cualquiera para ver el detalle arriba.'}
              </p>
            </div>
            <AlphabetExplorer key={guide.id} guide={guide} isHebrew={isHebrew} />
          </div>
        </section>

        {/* ---------------------- 2 · Vocales / Diptongos -------------------- */}
        <section id="sonidos" className="section guia-sec" aria-label={isHebrew ? 'Vocales y signos masoréticos' : 'Diptongos, espíritus y acentos'}>
          <div className="container">
            {isHebrew ? (
              <>
                <div className="guia-sec__head">
                  <h2>2. Cómo se leen las vocales (niqqud) y otras marcas</h2>
                  <p className="muted">
                    Los puntos y rayitas alrededor de cada consonante indican la vocal. Aquí van ordenados por los cinco sonidos del español usando como modelo la letra{' '}
                    <span className="guia-script guia-script--he" lang="he" dir="rtl">ב</span>.
                  </p>
                </div>

                <div className="guia-vowels">
                  {guide.vowels.map(group => (
                    <article key={group.vowel} className="guia-vowel-group">
                      <h3 className="guia-vowel-group__title">Sonido «{group.vowel}»</h3>
                      <ul className="guia-vowel-list">
                        {group.forms.map(f => (
                          <li key={f.name} className="guia-vowel-item">
                            <span className="guia-vowel-item__glyph guia-script guia-script--he" lang="he" dir="rtl">
                              {f.glyph}
                            </span>
                            <div>
                              <strong>{f.name}</strong> · <span className="guia-accent">{f.read}</span>
                              <p className="muted">{f.note}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>

                <div className="guia-cards guia-cards--three" style={{ marginTop: 'var(--sp-5)' }}>
                  {guide.extraMarks.map(m => (
                    <article key={m.name} className="guia-card">
                      <div className="guia-card__mark guia-script guia-script--he" lang="he" dir="rtl">
                        {m.glyph}
                      </div>
                      <h3>{m.name}</h3>
                      <p>{m.text}</p>
                    </article>
                  ))}
                </div>

                <div className="guia-subblock">
                  <h3>No las confundas: 6 pares visuales parecidos</h3>
                  <div className="guia-confusables">
                    {guide.confusables.map(pair => (
                      <article key={pair.names} className="guia-confusable">
                        <div className="guia-confusable__chars guia-script guia-script--he" lang="he" dir="rtl">
                          {pair.chars.join('  ·  ')}
                        </div>
                        <div className="guia-confusable__body">
                          <h4>{pair.names}</h4>
                          <p className="muted">{pair.clue}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="guia-sec__head">
                  <h2>2. Vocales juntas (diptongos), espíritus y acentos</h2>
                  <p className="muted">
                    Una vez conoces las 24 letras, solo necesitas recordar cómo se pronuncian estas combinaciones frecuentes y tres signos sobre las vocales.
                  </p>
                </div>

                <div className="guia-diph-grid">
                  {guide.diphthongs.map(d => (
                    <article key={d.pair} className="guia-card">
                      <div className="guia-diph__head">
                        <span className="guia-diph__pair guia-script guia-script--el" lang="el">
                          {d.pair}
                        </span>
                        <span className="guia-pill">{d.read}</span>
                      </div>
                      <p className="guia-diph__example">
                        <span className="guia-script guia-script--el" lang="el">
                          {d.example}
                        </span>
                      </p>
                      <p className="muted">{d.note}</p>
                    </article>
                  ))}
                </div>

                <div className="guia-cards guia-cards--three" style={{ marginTop: 'var(--sp-5)' }}>
                  {guide.diacritics.map(item => (
                    <article key={item.name} className="guia-card">
                      <div className="guia-card__mark guia-script guia-script--el" lang="el">
                        {item.mark}
                      </div>
                      <h3>{item.name}</h3>
                      <p>{item.text}</p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ---------------------- 3 · Claves del Codex / Hebreo-Arameo ------- */}
        <section id="claves" className="section section--alt guia-sec" aria-label={isHebrew ? 'Estructura de palabras y arameo' : 'Claves del Codex Sinaiticus y casos'}>
          <div className="container">
            {isHebrew ? (
              <>
                <div className="guia-sec__head">
                  <h2>3. Cómo se forman las palabras y qué cambia en arameo</h2>
                  <p className="muted">
                    Entender las raíces de tres letras y los prefijos pegados desbloquea decenas de palabras con poco esfuerzo.
                  </p>
                </div>

                <div className="guia-split">
                  <article className="guia-card">
                    <h3>{guide.wordStructure.rootsTitle}</h3>
                    <p className="muted">{guide.wordStructure.rootsText}</p>
                    <div className="guia-roots">
                      {guide.wordStructure.roots.map(r => (
                        <div key={r.root} className="guia-root">
                          <div className="guia-root__head">
                            <span className="guia-root__chars guia-script guia-script--he" lang="he" dir="rtl">
                              {r.root}
                            </span>
                            <span className="muted">Idea base: «{r.sense}»</span>
                          </div>
                          <ul className="guia-root__list">
                            {r.derivatives.map(d => (
                              <li key={d.word}>
                                <strong className="guia-script guia-script--he" lang="he" dir="rtl">
                                  {d.word}
                                </strong>{' '}
                                <span className="muted">
                                  ({d.read}) — {d.gloss}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="guia-card">
                    <h3>{guide.wordStructure.prefixesTitle}</h3>
                    <p className="muted">{guide.wordStructure.prefixesText}</p>
                    <ul className="guia-prefixes">
                      {guide.wordStructure.prefixes.map(p => (
                        <li key={p.form}>
                          <strong className="guia-script guia-script--he" lang="he" dir="rtl">
                            {p.form}
                          </strong>
                          <span>«{p.meaning}»</span>
                          <span className="muted" lang="he">
                            {p.example}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="guia-anatomy">
                      <p className="guia-anatomy__title">Ejemplo desmontado pieza a pieza:</p>
                      <div className="guia-anatomy__word">
                        <strong className="guia-script guia-script--he" lang="he" dir="rtl">
                          {guide.wordStructure.anatomy.full}
                        </strong>
                        <span>
                          {guide.wordStructure.anatomy.read} — {guide.wordStructure.anatomy.gloss}
                        </span>
                      </div>
                      <div className="guia-anatomy__pieces" dir="rtl">
                        {guide.wordStructure.anatomy.pieces.map(pc => (
                          <div key={`${pc.label}-${pc.meaning}`} className="guia-piece">
                            <span className="guia-piece__char guia-script guia-script--he" lang="he">
                              {pc.part}
                            </span>
                            <span className="guia-piece__meta" dir="ltr">
                              <small>{pc.label}</small>
                              <b>{pc.meaning}</b>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                </div>

                <article className="guia-callout" aria-label={guide.wordStructure.tetragrammaton.title}>
                  <div className="guia-callout__glyph guia-script guia-script--he" lang="he" dir="rtl">
                    {guide.wordStructure.tetragrammaton.glyph}
                  </div>
                  <div>
                    <h3>{guide.wordStructure.tetragrammaton.title}</h3>
                    <p>{guide.wordStructure.tetragrammaton.text}</p>
                  </div>
                </article>

                <div className="guia-subblock">
                  <h3>El arameo bíblico: dónde aparece y cuatro pistas rápidas</h3>
                  <p className="muted">{guide.aramaic.intro}</p>

                  <div className="guia-aramaic-passages">
                    {guide.aramaic.passages.map(p => (
                      <Link key={p.ref} to={p.href} className="guia-aramaic-link">
                        <strong>{p.ref}</strong>
                        <span className="muted">{p.desc}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="guia-cards guia-cards--intro" style={{ marginTop: 'var(--sp-4)' }}>
                    {guide.aramaic.clues.map(c => (
                      <article key={c.title} className="guia-card">
                        <h4>{c.title}</h4>
                        <p>{c.text}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="guia-sec__head">
                  <h2>3. Claves para leer el Codex Sinaiticus y entender la función de cada palabra</h2>
                  <p className="muted">{guide.codexKeys.intro}</p>
                </div>

                <div className="guia-split">
                  <article className="guia-card">
                    <h3>Nomina sacra: nombres sagrados abreviados</h3>
                    <p className="muted">
                      Los escribas cristianos abreviaban nombres sagrados tomando primera y última letra con una línea encima (<span className="guia__overline">θϲ</span>). Al leerlos en voz alta se dicen completos.
                    </p>
                    <table className="guia-table">
                      <thead>
                        <tr>
                          <th>En el Codex</th>
                          <th>Palabra completa</th>
                          <th>Sentido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guide.codexKeys.nominaSacra.map(row => (
                          <tr key={row.abbr}>
                            <td className="guia-script guia-script--el" lang="el">
                              <span className="guia__overline">{row.abbr}</span>
                            </td>
                            <td>
                              <span className="guia-script guia-script--el" lang="el">
                                {row.full}
                              </span>{' '}
                              <span className="muted">({row.read})</span>
                            </td>
                            <td>{row.gloss}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </article>

                  <article className="guia-card">
                    <h3>Los 5 casos: por qué cambia el final de los nombres</h3>
                    <p className="muted">
                      El español indica quién hace la acción por el orden («El hombre ve al perro»). El griego lo indica cambiando el final de la palabra y del artículo, por eso puede variar el orden sin perder el sentido:
                    </p>
                    <ul className="guia-cases">
                      {guide.codexKeys.cases.map(c => (
                        <li key={c.name}>
                          <div>
                            <strong>{c.name}:</strong> {c.role}
                          </div>
                          <div className="muted" lang="el">
                            {c.clue}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="guia-tip-inline">
                      <strong>Nota sobre sigma y aparato:</strong> en el Codex toda sigma es lunada (<code className="guia-code">ϲ</code>) y las estrellas <code className="guia-code">∗</code> en rojo abren variantes de correctores antiguos.
                    </p>
                  </article>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ---------------------- 4 · Versículo guiado ----------------------- */}
        <section id="versiculo" className="section guia-sec" aria-label="Lectura guiada palabra por palabra">
          <div className="container">
            <div className="guia-sec__head">
              <h2>4. Tu primer versículo palabra por palabra</h2>
            </div>

            <VerseInspector
              key={guide.id}
              title={guide.walkthrough.title}
              refLabel={guide.walkthrough.refLabel}
              exegesisHref={guide.walkthrough.exegesisHref}
              intro={guide.walkthrough.intro}
              words={guide.walkthrough.words}
              isHebrew={isHebrew}
              codexDefault={!isHebrew}
            />

            {isHebrew && guide.walkthrough.aramaicSample && (
              <div style={{ marginTop: 'var(--sp-5)' }}>
                <VerseInspector
                  key="aramaic-dn7"
                  title="Frase célebre en arameo bíblico: Daniel 7:13"
                  refLabel={guide.walkthrough.aramaicSample.refLabel}
                  exegesisHref={guide.walkthrough.aramaicSample.exegesisHref}
                  intro="Misma escritura que el hebreo, pero aquí verás términos puramente arameos como בַר (bar = hijo)."
                  words={guide.walkthrough.aramaicSample.words}
                  isHebrew
                />
              </div>
            )}
          </div>
        </section>

        {/* ---------------------- 5 · Práctica interactiva ------------------- */}
        <section id="practica" className="section section--alt guia-sec" aria-label="Práctica rápida">
          <div className="container">
            <div className="guia-sec__head">
              <h2>5. Practica en dos minutos</h2>
              <p className="muted">
                {isHebrew
                  ? 'Lee de derecha a izquierda estas ocho palabras bíblicas reales y comprueba cómo se pronuncian (también puedes retarte quitando las vocales).'
                  : 'Comprueba cuánto recuerdas leyendo ocho palabras fundamentales del Nuevo Testamento en edición impresa o al estilo del Codex.'}
              </p>
            </div>
            <ReadingPractice key={guide.id} items={guide.practice} isHebrew={isHebrew} />
          </div>
        </section>
      </div>

      {/* Panel inactivo vacío para mantener `aria-controls` válido sin duplicar IDs de sección */}
      <div id={panelId(otherLang)} role="tabpanel" aria-labelledby={tabId(otherLang)} hidden />

      <div className="container" style={{ paddingBlock: 'var(--sp-6)' }}>
        <BibleCta
          passage={isHebrew ? 'Génesis 1:1' : 'Juan 1:1'}
          title="Ponlo en práctica en los lectores"
        />
      </div>
    </main>
  );
}
