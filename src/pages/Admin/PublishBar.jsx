import { useCallback, useEffect, useState } from 'react';

import { api } from './shared';

export default function PublishBar() {
  const [status, setStatus] = useState(null); // { clean, changes }
  const [diff, setDiff] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [restoring, setRestoring] = useState('');
  const [commitMsg, setCommitMsg] = useState('');
  const [msg, setMsg] = useState(null);
  const [history, setHistory] = useState(null);

  const check = useCallback(async () => {
    try {
      const s = await api('/status');
      setStatus(s);
      setMsg(null);
    } catch {
      // no git repo: ignorar
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const loadDiff = async () => {
    try {
      const d = await api('/diff');
      setDiff(d.diff);
      setShowDiff(true);
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message) });
    }
  };

  const publish = async () => {
    if (!status || status.clean) {
      setMsg({ type: 'ok', text: 'No hay cambios que publicar.' });
      return;
    }
    if (!window.confirm('¿Publicar los cambios? Se hará commit + push y Pages se redesplegará.')) return;
    setPublishing(true);
    setMsg(null);
    try {
      const r = await api('/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMsg.trim() })
      });
      setMsg({ type: 'ok', text: '¡Publicado! ' + (r.commit || '') });
      setCommitMsg('');
      await check();
      setShowDiff(false);
    } catch (e) {
      setMsg({ type: 'error', text: `Fallo al publicar: ${e.message}. Revisa GH_TOKEN y GH_REPO en .env.local.` });
    } finally {
      setPublishing(false);
    }
  };

  const loadHistory = async () => {
    try {
      const { items } = await api('/history');
      setHistory(items);
    } catch { /* noop */ }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const restore = async backup => {
    if (!window.confirm(`¿Restaurar ${backup}? Se guardará una copia de seguridad de la versión actual.`)) return;
    setRestoring(backup);
    setMsg(null);
    try {
      const res = await api('/history/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup })
      });
      setMsg({
        type: 'ok',
        text: `Restaurado content/${res.restored}. Recarga el editor correspondiente si lo tenías abierto.`
      });
      await Promise.all([check(), loadHistory()]);
    } catch (e) {
      setMsg({ type: 'error', text: `No se pudo restaurar: ${e.message}` });
    } finally {
      setRestoring('');
    }
  };

  return (
    <section className="admin__publish">
      <div className="admin__publish-head">
        <div>
          <strong>
            {status === null
              ? 'Estado de publicación: desconocido (¿git?)'
              : status.clean
                ? 'Sin cambios pendientes'
                : `${status.changes.length} cambio(s) sin publicar`}
          </strong>
          {status && !status.clean && (
            <ul className="admin__publish-changes">
              {status.changes.slice(0, 12).map((c, i) => <li key={i}><code>{c}</code></li>)}
              {status.changes.length > 12 && <li className="muted">… y {status.changes.length - 12} más</li>}
            </ul>
          )}
        </div>
        <div className="admin__body-actions">
          <button type="button" className="admin__btn" onClick={check}>Verificar</button>
          <button type="button" className="admin__btn" onClick={loadDiff} disabled={!status || status.clean}>
            Ver diff
          </button>
          <button type="button" className="admin__btn admin__btn--accent" onClick={publish} disabled={publishing || !status || status.clean}>
            {publishing ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </div>

      {status && !status.clean && (
        <div className="admin__publish-msg">
          <input
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            placeholder="Mensaje del commit (opcional, p. ej. feat(estudios): nuevo tema)"
            aria-label="Mensaje del commit"
          />
        </div>
      )}

      {msg && (
        <p className="admin__status">
          <span className={msg.type === 'error' ? 'is-error' : 'is-ok'}>{msg.text}</span>
        </p>
      )}
      {showDiff && diff && (
        <details className="admin__diff" open>
          <summary>Diff (content/ + public/img/ + trad/)</summary>
          <pre className="admin__diff-body">{diff.slice(0, 8000)}{diff.length > 8000 ? '\n…(truncado)' : ''}</pre>
        </details>
      )}
      {history && history.length > 0 && (
        <details className="admin__diff">
          <summary>Historial de backups ({history.length})</summary>
          <ul className="admin__history-list">
            {history.slice(0, 30).map(h => (
              <li key={h} className="admin__history-item">
                <code>{h}</code>
                <button
                  type="button"
                  className="admin__btn"
                  disabled={restoring === h}
                  onClick={() => restore(h)}
                >
                  {restoring === h ? 'Restaurando…' : 'Restaurar'}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="muted admin__hint">
        Publicar hace commit + push a GitHub (necesita <code>GH_TOKEN</code> y <code>GH_REPO</code> en{' '}
        <code>.env.local</code>). El push dispara el despliegue automático de Pages.
      </p>
    </section>
  );
}
