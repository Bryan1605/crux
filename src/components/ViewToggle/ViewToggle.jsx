import './ViewToggle.css';

/**
 * Conmutador de vista del índice (Tarjetas · Lista · Carrusel).
 * Es un grupo de botones con `aria-pressed`, no un tablist: las vistas no
 * esconden paneles con nombre propio, cambian la presentación del mismo índice.
 */

const OPTIONS = [
  {
    id: 'cards',
    label: 'Tarjetas',
    icon: (
      <>
        <rect x="2.5" y="3" width="5" height="5" rx="1.2" />
        <rect x="8.5" y="3" width="5" height="5" rx="1.2" />
        <rect x="2.5" y="9" width="5" height="5" rx="1.2" />
        <rect x="8.5" y="9" width="5" height="5" rx="1.2" />
      </>
    )
  },
  {
    id: 'list',
    label: 'Lista',
    icon: (
      <>
        <rect x="2.5" y="3.5" width="11" height="2" rx="1" />
        <rect x="2.5" y="7.5" width="11" height="2" rx="1" />
        <rect x="2.5" y="11.5" width="11" height="2" rx="1" />
      </>
    )
  },
  {
    id: 'carousel',
    label: 'Carrusel',
    icon: (
      <>
        <rect x="6.25" y="2.5" width="3.5" height="11" rx="1.2" />
        <rect x="1.5" y="5" width="3" height="6" rx="1.1" />
        <rect x="11.5" y="5" width="3" height="6" rx="1.1" />
      </>
    )
  }
];

export default function ViewToggle({ value, onChange, label = 'Cambiar vista del índice' }) {
  return (
    <div className="view-toggle" role="group" aria-label={label}>
      {OPTIONS.map(option => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            className="view-toggle__btn"
            aria-pressed={active}
            title={`Vista: ${option.label}`}
            onClick={() => onChange(option.id)}
          >
            <svg
              className="view-toggle__icon"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              {option.icon}
            </svg>
            <span className="view-toggle__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
