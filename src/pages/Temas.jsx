import { Link } from 'react-router-dom';

import { STUDIES } from '../data/estudios';
import { CATEGORIAS, tagLabel, TEMAS } from '../data/temas';
import { useSeo, useSite } from '../lib/site';

import './Temas.css';

const plural = n => (n === 1 ? 'estudio' : 'estudios');

export default function Temas() {
  const site = useSite();
  useSeo({
    title: `${site.marca.nombre} — Temas`,
    description:
      'Todas las categorías y las etiquetas del estudio bíblico, para entrar por donde prefieras.'
  });

  return (
    <main id="main" className="temas-page">
      <header className="page-head">
        <div className="container">
          <p className="eyebrow">Índice por temas</p>
          <h1>Temas</h1>
          <p className="lead">
            Dos formas de entrar al estudio: por categoría o por etiqueta. {CATEGORIAS.length}{' '}
            categorías y {TEMAS.length} temas reparten {STUDIES.length} estudios.
          </p>
        </div>
      </header>

      <section className="section section--alt" aria-labelledby="temas-categorias">
        <div className="container">
          <h2 id="temas-categorias" className="temas__h2">
            Categorías
          </h2>
          <p className="temas__desc">
            La división principal del índice. Cada tarjeta abre <Link to="/estudio">el estudio</Link>{' '}
            filtrado por esa categoría.
          </p>

          <ul className="temas__cats">
            {CATEGORIAS.map(c => (
              <li key={c.id}>
                <Link className="temas__cat" to={`/estudio?cat=${c.id}`}>
                  <span className="temas__cat-label">{c.label}</span>
                  <span className="temas__cat-short">{c.short}</span>
                  <span className="temas__cat-count">
                    {c.count} {plural(c.count)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="temas-etiquetas">
        <div className="container">
          <h2 id="temas-etiquetas" className="temas__h2">
            Temas
          </h2>
          <p className="temas__desc">
            Las etiquetas que llevan las fichas, de la más frecuente a la menos. Cada una abre el
            índice filtrado por ese tema; el número es cuántos estudios la llevan.
          </p>

          <div className="chips temas__cloud">
            {TEMAS.map(t => (
              <Link key={t.tag} className="chip" to={`/estudio?q=${encodeURIComponent(t.tag)}`}>
                {tagLabel(t.tag)}
                <span className="chip__count">{t.count}</span>
              </Link>
            ))}
          </div>

          <p className="temas__hint">
            ¿Buscas algo más concreto? <Link to="/buscar">Usa la búsqueda global</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
