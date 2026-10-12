import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { parseFrontmatter } from '../lib/frontmatter';
import { renderProse } from '../lib/markdown';
import ScrapbookGallery from '../components/ScrapbookGallery/ScrapbookGallery';
import { studyBySlug, STUDIES, STUDY_CATEGORIES } from '../data/estudios';
import { PERSONAJES } from '../data/personajes';
import { useSite, useSeo } from '../lib/site';

import './Estudio.css';

const contentModules = import.meta.glob('../../content/estudios/*.md', {
  query: '?raw',
  import: 'default'
});

export default function EstudioDetalle() {
  const { slug } = useParams();
  const site = useSite();
  const study = studyBySlug(slug);
  const [doc, setDoc] = useState({ status: 'idle', html: '' });

  useSeo({
    title: study ? `${study.title} — ${site.marca.nombre}` : `${site.marca.nombre} — Estudio`,
    description: study ? study.description : site.seo.description,
    ogImage: (study && study.portada) || site.seo.ogImage
  });

  useEffect(() => {
    if (!study) {
      setDoc({ status: 'idle', html: '' });
      return undefined;
    }
    let alive = true;
    setDoc({ status: 'loading', html: '' });
    const load = contentModules[`../../content/estudios/${slug}.md`];
    if (!load) {
      setDoc({ status: 'missing', html: '' });
      return undefined;
    }
    load()
      .then(raw => {
        if (!alive) return;
        const { body } = parseFrontmatter(raw);
        setDoc({ status: 'ok', html: renderProse(body) });
      })
      .catch(() => {
        if (alive) setDoc({ status: 'missing', html: '' });
      });
    return () => {
      alive = false;
    };
  }, [slug, study]);

  if (!study) {
    return (
      <main id="main" className="study-detail">
        <div className="container">
          <div className="empty-state">
            <h1 className="study-detail__missing">Estudio no encontrado</h1>
            <p>La ficha que buscas no existe o cambió de nombre.</p>
            <p>
              <Link className="btn btn--primary" to="/estudio">
                Volver al índice
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  const coveredBy = PERSONAJES.find(p => p.estudio === slug);
  if (coveredBy) {
    return <Navigate to={`/estudio/personajes/${coveredBy.slug}`} replace />;
  }

  const category = STUDY_CATEGORIES.find(c => c.id === study.category);
  const related = STUDIES.filter(s => s.category === study.category && s.slug !== slug).slice(0, 6);

  return (
    <main id="main" className="study-detail">
      <article className="container">
        <nav className="breadcrumb" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link to="/estudio">Estudio</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/estudio?cat=${study.category}`}>{study.categoryLabel}</Link>
        </nav>

        {study.portada && (
          <figure className="study-detail__hero">
            <img src={study.portada} alt="" />
          </figure>
        )}

        <header className="study-detail__head">
          <p className="eyebrow">
            {study.subcategory ? `${study.categoryLabel} · ${study.subcategory}` : study.categoryLabel}
          </p>
          <h1>{study.title}</h1>
          <p className="lead">{study.description}</p>

          <div className="study-detail__facts">
            <span className="fact">
              Pasaje clave <strong>{study.passage || '—'}</strong>
            </span>
            <span className="fact">
              Categoría <strong>{category?.label || study.categoryLabel}</strong>
            </span>
            <span className="fact">
              Actualizado <strong>{study.updated || '—'}</strong>
            </span>
          </div>
        </header>

        {(study.aliases.length > 0 || study.tags.length > 0) && (
          <div className="study-detail__meta">
            {study.aliases.length > 0 && (
              <div className="study-detail__meta-group">
                <h3>También conocido como</h3>
                <div className="tag-list">
                  {study.aliases.map(a => (
                    <span className="tag" key={a}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {study.tags.length > 0 && (
              <div className="study-detail__meta-group">
                <h3>Etiquetas</h3>
                <div className="tag-list">
                  {study.tags.map(t => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="study-detail__body">
          <div className="study-detail__main">
            {doc.status === 'loading' && (
              <div className="study-detail__loading">
                <div className="loader-pulse" role="status" aria-label="Cargando">
                  <span />
                  <span />
                  <span />
                </div>
                <p className="muted">Cargando el contenido del estudio…</p>
              </div>
            )}

            {doc.status === 'missing' && (
              <div className="empty-state">
                <h2>Este estudio aún no tiene contenido</h2>
                <p className="muted">
                  La ficha existe, pero falta el archivo Markdown. Añádelo en el panel de edición o vuelve
                  a sincronizar desde el wiki.
                </p>
              </div>
            )}

            {doc.status === 'ok' && <div className="study-prose" dangerouslySetInnerHTML={{ __html: doc.html }} />}
          </div>
        </div>

        <ScrapbookGallery
          items={related.map(s => ({
            to: `/estudio/${s.slug}`,
            title: s.title,
            caption: `${s.categoryLabel} · ${s.passage || 'Estudio'}`
          }))}
          footer={
            <Link className="btn btn--ghost" to={`/estudio?cat=${study.category}`}>
              Ver {study.categoryLabel}
            </Link>
          }
        />
      </article>
    </main>
  );
}
