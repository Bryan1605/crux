import { useState } from 'react';
import { Link } from 'react-router-dom';

import { libroById } from '../../data/libros';

import './BookIntroPanel.css';

const wide = () => typeof window === 'undefined' || window.matchMedia('(min-width: 900px)').matches;

/**
 * Panel discreto con el resumen de la ficha de un libro y el enlace a ella.
 * Va en los lectores (`/exegesis`, `/biblia/ntv`). Si el libro aún no tiene
 * ficha, lo dice y enlaza al índice; nunca rompe el lector.
 * Abierto en escritorio y cerrado en móvil al cargar; después lo decide quien lee.
 */
export default function BookIntroPanel({ bookId, bookName }) {
  const ficha = libroById(bookId);
  const [open] = useState(wide);

  return (
    <details className="book-intro" open={open}>
      <summary className="book-intro__summary">
        <span className="book-intro__kicker">Sobre el libro</span>
        <span className="book-intro__name">{ficha ? ficha.title : bookName}</span>
        {ficha?.status === 'borrador' && <span className="book-intro__status">ficha en borrador</span>}
      </summary>
      {ficha ? (
        <div className="book-intro__body">
          <p>{ficha.summary}</p>
          <p>
            <Link className="book-intro__link" to={`/biblia/libros/${ficha.id}`}>
              Leer la ficha de {ficha.title}
            </Link>
          </p>
        </div>
      ) : (
        <div className="book-intro__body">
          <p>La ficha de este libro está en preparación.</p>
          <p>
            <Link className="book-intro__link" to="/biblia/libros">
              Ver las fichas disponibles
            </Link>
          </p>
        </div>
      )}
    </details>
  );
}
