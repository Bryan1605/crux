import { Link } from 'react-router-dom';

import { CONCILIOS_LIST, HEREJIAS_LIST, concilioById } from '../data/concilios';
import { useSeo, useSite } from '../lib/site';

import './Concilios.css';

const ORDINALES = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export default function Concilios() {
  const site = useSite();
  useSeo({
    title: `${site.marca.nombre} — Concilios y herejías`,
    description: `${CONCILIOS_LIST.length} concilios y ${HEREJIAS_LIST.length} herejías de la historia de la Iglesia: año, decisiones y a quién condenaron.`
  });

  return (
    <main id="main" className="concilios-page">
      <header className="page-head">
        <div className="container">
          <p className="eyebrow">Historia de la fe</p>
          <h1>Concilios y herejías</h1>
          <p className="lead">
            De Jerusalén (Hechos 15) a Nicea II (787): la Iglesia definió su fe frente a las
            herejías en los concilios. Cada ficha resume qué se decidió y contra qué error;
            los estudios detallados llegan próximamente.
          </p>
        </div>
      </header>

      <section className="section section--alt" aria-labelledby="concilios-title">
        <div className="container">
          <div className="concilios__head">
            <p className="eyebrow">Los concilios</p>
            <h2 id="concilios-title">Los concilios</h2>
            <p className="concilios__desc">
              Mismo orden cronológico que la línea de tiempo del estudio: cada concilio enlaza
              desde el carrete del <Link to="/estudio">índice de estudios</Link>.
            </p>
          </div>

          <ol className="concilios__list">
            {CONCILIOS_LIST.map(c => (
              <li key={c.id} id={c.id} className="concilios__card">
                <div className="concilios__card-top">
                  <span className="concilios__date">{c.anio_label}</span>
                  {c.ordinal ? <span className="concilios__ordinal">{ORDINALES[c.ordinal]}</span> : null}
                </div>
                <h3 className="concilios__nombre">{c.nombre}</h3>
                {c.convocante && <p className="concilios__conv">Convocado por {c.convocante}</p>}
                <p className="concilios__resumen">{c.resumen}</p>
                {c.decisiones?.length > 0 && (
                  <ul className="concilios__decisiones">
                    {c.decisiones.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
                {c.herejias?.length > 0 && (
                  <div className="concilios__herejias">
                    {c.herejias.map(hid => {
                      const h = concilioById(hid);
                      return h ? (
                        <a key={hid} className="concilios__herejia-chip" href={`#${hid}`}>
                          {h.nombre} ⤳
                        </a>
                      ) : null;
                    })}
                  </div>
                )}
                <footer className="concilios__foot">
                  {c.estudio ? (
                    <Link className="concilios__estudio" to={`/estudio/${c.estudio}`}>
                      Abrir el estudio →
                    </Link>
                  ) : (
                    <span className="concilios__soon">
                      <i aria-hidden="true" />
                      Estudio próximamente
                    </span>
                  )}
                </footer>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="herejias-title">
        <div className="container">
          <div className="concilios__head">
            <p className="eyebrow">Las herejías</p>
            <h2 id="herejias-title">Las herejías</h2>
            <p className="concilios__desc">
              Los errores que los concilios respondieron: cada herejía enlaza desde la línea de
              tiempo al concilio que la condenó y, cuando existe, a su estudio.
            </p>
          </div>

          <ul className="herejias__list">
            {HEREJIAS_LIST.map(h => {
              const condena = h.condenada_en ? concilioById(h.condenada_en) : null;
              return (
                <li key={h.id} id={h.id} className="herejia__card">
                  <div className="herejia__top">
                    <h3 className="herejia__nombre">{h.nombre}</h3>
                    {h.contexto && <span className="herejia__siglo">{h.contexto}</span>}
                  </div>
                  <p className="herejia__resumen">{h.resumen}</p>
                  <footer className="herejia__foot">
                    <span className="herejia__condena">
                      {condena ? (
                        <a href={`#${condena.id}`}>
                          Condenada en el {condena.nombre}, {condena.anio_label}
                        </a>
                      ) : (
                        'Condenada en concilios locales'
                      )}
                    </span>
                    {h.estudio ? (
                      <Link className="herejia__estudio" to={`/estudio/${h.estudio}`}>
                        Estudiar →
                      </Link>
                    ) : (
                      <span className="concilios__soon">
                        <i aria-hidden="true" />
                        Estudio próximamente
                      </span>
                    )}
                  </footer>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </main>
  );
}