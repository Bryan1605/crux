import { useEffect, useMemo, useState } from 'react';

import { assetUrl } from '../../lib/assets';

let cachedIndex = null;
const bookCache = new Map();

function cleanWitnessText(text, witness) {
  let t = String(text || '').trim();
  if (witness === 'ntv') t = t.replace(/\[[a-z]+\]/g, '').replace(/\s+/g, ' ').trim();
  if (witness === 'codex') t = t.replace(/§\d+/g, '').replace(/\s+/g, ' ').trim();
  return t;
}

/**
 * Selector de pasajes bíblicos reales (NTV, Codex Sinaiticus y Trad) desde los
 * JSON ya generados en public/textos/exegesis/.
 */
export default function VersePickerModal({ onInsert, onClose }) {
  const [index, setIndex] = useState(cachedIndex);
  const [bookId, setBookId] = useState('juan');
  const [cap, setCap] = useState(3);
  const [fromV, setFromV] = useState(16);
  const [toV, setToV] = useState(16);
  const [witness, setWitness] = useState('ntv');
  const [bookData, setBookData] = useState({ ntv: null, codex: null, trad: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (cachedIndex) return;
    fetch(assetUrl('/textos/exegesis/index.json'))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        cachedIndex = data;
        setIndex(data);
      })
      .catch(e => setError(`No se pudo cargar el índice bíblico: ${e.message}`));
  }, []);

  const books = useMemo(() => [...(index?.books || [])].sort((a, b) => a.order - b.order), [index]);
  const meta = useMemo(() => books.find(b => b.id === bookId) || books[0], [books, bookId]);

  useEffect(() => {
    if (!meta) return;
    let alive = true;
    setLoading(true);
    setError('');

    const fetchWitness = async kind => {
      const has = meta[kind]?.chapters?.length > 0;
      if (!has) return null;
      const key = `${kind}:${meta.id}`;
      if (bookCache.has(key)) return bookCache.get(key);
      const res = await fetch(assetUrl(`/textos/exegesis/${kind}/${meta.id}.json`));
      if (!res.ok) return null;
      const json = await res.json();
      bookCache.set(key, json);
      return json;
    };

    Promise.all([fetchWitness('ntv'), fetchWitness('codex'), fetchWitness('trad')])
      .then(([ntv, codex, trad]) => {
        if (!alive) return;
        setBookData({ ntv, codex, trad });
        const availCaps = ntv?.chapters?.map(c => c.num) || codex?.chapters?.map(c => c.num) || [1];
        setCap(prev => (availCaps.includes(prev) ? prev : availCaps[0] || 1));
      })
      .catch(e => alive && setError(String(e.message)))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [meta]);

  const chapters = useMemo(() => {
    const nums = new Set();
    for (const src of [bookData.ntv, bookData.codex, bookData.trad]) {
      for (const ch of src?.chapters || []) nums.add(ch.num);
    }
    return [...nums].sort((a, b) => a - b);
  }, [bookData]);

  const chapterWitnesses = useMemo(() => {
    const list = [];
    if (bookData.ntv?.chapters?.some(c => c.num === cap)) list.push({ id: 'ntv', label: 'NTV' });
    if (bookData.trad?.chapters?.some(c => c.num === cap)) list.push({ id: 'trad', label: 'Traducción de trabajo (Codex)' });
    if (bookData.codex?.chapters?.some(c => c.num === cap)) list.push({ id: 'codex', label: 'Codex Sinaiticus (griego)' });
    if (list.some(w => w.id === 'codex') && list.some(w => w.id === 'ntv')) {
      list.push({ id: 'codex+ntv', label: 'Codex + NTV' });
    }
    if (list.some(w => w.id === 'codex') && list.some(w => w.id === 'trad')) {
      list.push({ id: 'codex+trad', label: 'Codex + Trad' });
    }
    return list;
  }, [bookData, cap]);

  useEffect(() => {
    if (!chapterWitnesses.length) return;
    if (!chapterWitnesses.some(w => w.id === witness)) {
      setWitness(chapterWitnesses[0].id);
    }
  }, [chapterWitnesses, witness]);

  const verses = useMemo(() => {
    const pick = witness.startsWith('codex+') ? 'codex' : witness;
    const ch = bookData[pick]?.chapters?.find(c => c.num === cap)
      || bookData.ntv?.chapters?.find(c => c.num === cap)
      || bookData.codex?.chapters?.find(c => c.num === cap)
      || bookData.trad?.chapters?.find(c => c.num === cap);
    return ch?.verses || [];
  }, [bookData, cap, witness]);

  useEffect(() => {
    if (!verses.length) return;
    const ns = verses.map(v => v.n);
    setFromV(prev => (ns.includes(prev) ? prev : ns[0]));
    setToV(prev => (ns.includes(prev) ? prev : ns[0]));
  }, [verses]);

  const markdown = useMemo(() => {
    if (!meta || !verses.length) return '';
    const lo = Math.min(fromV, toV);
    const hi = Math.max(fromV, toV);
    const ref = lo === hi ? `${meta.name} ${cap}:${lo}` : `${meta.name} ${cap}:${lo}-${hi}`;

    const slice = kind => {
      const ch = bookData[kind]?.chapters?.find(c => c.num === cap);
      if (!ch) return '';
      return ch.verses
        .filter(v => v.n >= lo && v.n <= hi)
        .map(v => `${lo === hi ? '' : `${v.n} `}${cleanWitnessText(v.text, kind)}`)
        .join(' ')
        .trim();
    };

    if (witness === 'codex+ntv') {
      const cText = slice('codex');
      const nText = slice('ntv');
      return `> **${ref}** (NTV) — *"${nText}"*\n>\n> **Codex Sinaiticus:** \`${cText}\``;
    }
    if (witness === 'codex+trad') {
      const cText = slice('codex');
      const tText = slice('trad');
      return `> **${ref}** (Codex · Traducción de trabajo) — *"${tText}"*\n>\n> **Codex Sinaiticus:** \`${cText}\``;
    }
    const text = slice(witness);
    if (!text) return '';
    if (witness === 'codex') return `> **${ref}** (Codex Sinaiticus) — \`${text}\``;
    if (witness === 'trad') return `> **${ref}** (Codex · Borrador) — *"${text}"*`;
    return `> **${ref}** (NTV) — *"${text}"*`;
  }, [meta, verses, fromV, toV, cap, witness, bookData]);

  return (
    <div className="rte__modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="rte__modal" role="dialog" aria-modal="true" aria-labelledby="vp-title">
        <div className="rte__modal-head">
          <strong id="vp-title">Insertar pasaje bíblico</strong>
          <button type="button" className="admin__btn" onClick={onClose}>✕</button>
        </div>

        {error && <p className="admin__status"><span className="is-error">{error}</span></p>}

        <div className="admin__row">
          <label className="admin__field">
            <span>Libro</span>
            <select value={bookId} onChange={e => setBookId(e.target.value)} disabled={!books.length}>
              {books.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.abbr})</option>
              ))}
            </select>
          </label>
          <label className="admin__field">
            <span>Capítulo</span>
            <select value={cap} onChange={e => setCap(Number(e.target.value))} disabled={!chapters.length}>
              {chapters.map(num => (
                <option key={num} value={num}>Cap. {num}</option>
              ))}
            </select>
          </label>
          <label className="admin__field">
            <span>Desde</span>
            <select value={fromV} onChange={e => { const v = Number(e.target.value); setFromV(v); if (toV < v) setToV(v); }}>
              {verses.map(v => <option key={v.n} value={v.n}>v. {v.n}</option>)}
            </select>
          </label>
          <label className="admin__field">
            <span>Hasta</span>
            <select value={toV} onChange={e => setToV(Number(e.target.value))}>
              {verses.filter(v => v.n >= fromV).map(v => <option key={v.n} value={v.n}>v. {v.n}</option>)}
            </select>
          </label>
        </div>

        <label className="admin__field">
          <span>Testigo / formato</span>
          <select value={witness} onChange={e => setWitness(e.target.value)}>
            {chapterWitnesses.map(w => (
              <option key={w.id} value={w.id}>{w.label}</option>
            ))}
          </select>
        </label>

        <div className="rte__modal-preview">
          <span className="muted">{loading ? 'Cargando versículos…' : 'Vista previa en Markdown'}</span>
          <pre>{markdown || 'Selecciona un pasaje válido.'}</pre>
        </div>

        <div className="rte__modal-foot">
          <button type="button" className="admin__btn" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="admin__btn admin__btn--accent"
            disabled={!markdown || loading}
            onClick={() => {
              onInsert(markdown);
              onClose();
            }}
          >
            Insertar pasaje
          </button>
        </div>
      </div>
    </div>
  );
}
