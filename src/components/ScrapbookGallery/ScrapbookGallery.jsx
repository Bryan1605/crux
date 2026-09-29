import { Link } from 'react-router-dom';

import './ScrapbookGallery.css';

const TILTS = [-3, 2.2, -1.6, 2.8, -2.4, 1.4];

export default function ScrapbookGallery({ items = [], heading = 'Seguir explorando', footer = null }) {
  if (!items.length) return null;

  return (
    <section className="scrapbook" aria-label={heading}>
      <div className="scrapbook__head">
        <h2>{heading}</h2>
        {footer}
      </div>

      <ul className="scrapbook__row">
        {items.map((it, i) => (
          <li
            key={it.to}
            className="scrapbook__item"
            style={{ '--tilt': `${TILTS[i % TILTS.length]}deg` }}
          >
            <Link className="scrapbook__card" to={it.to}>
              <div className="scrapbook__frame">
                {it.image ? (
                  <img src={it.image} alt="" loading="lazy" />
                ) : (
                  <span className="scrapbook__title">{it.title}</span>
                )}
              </div>
              <span className="scrapbook__caption">{it.caption}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
