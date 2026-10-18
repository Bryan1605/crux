/**
 * Selección de texto frente a los clics de interfaz.
 *
 * Los lectores (`/exegesis`, `/biblia/ntv`) fijan el versículo al pulsar su
 * fila, y esa fila también contiene el texto que el lector quiere marcar. El
 * navegador colapsa la selección previa en el `mousedown`, así que una selección
 * viva al llegar el `click` solo puede venir del mismo gesto: un arrastre para
 * marcar. En ese caso la fila no debe hacer nada —ni fijar el versículo ni
 * mover la vista—.
 */
export function hasSelection() {
  if (typeof window === 'undefined') return false;
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return false;
  return String(sel).trim().length > 0;
}

export default hasSelection;
