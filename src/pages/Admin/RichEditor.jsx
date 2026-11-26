import { useEffect, useMemo, useRef, useState } from 'react';
import { Editor, EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import { BulletList, OrderedList, TaskItem, TaskList } from '@tiptap/extension-list';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import { DragHandle } from '@tiptap/extension-drag-handle-react';
import { Selection } from '@tiptap/pm/state';

import { renderProse } from '../../lib/markdown';
import MediaPicker from './MediaPicker';
import VersePickerModal from './VersePickerModal';
import '../Estudio.css';
import './RichEditor.css';

/**
 * Editor visual de los estudios (fase 1 del panel nuevo + modales de creación).
 *
 * El formato guardado sigue siendo Markdown: el editor lo lee y lo vuelve a
 * escribir con @tiptap/markdown, así el buscador, el conteo de citas y
 * secciones, la validación del build y los diffs de git siguen igual.
 * `qa:admin` comprueba que los estudios pasan por el editor sin cambiar
 * su HTML. Mientras el usuario no toque el texto, `onChange` no se llama y el
 * archivo se guarda tal cual.
 */

const isLoose = token =>
  Boolean(token.loose) ||
  (token.items || []).some(i => i.loose) ||
  /\n[ \t]*\n[ \t]*(?:[-*+]|\d+[.)])\s/.test(String(token.raw || '').trimEnd());

const keepLoose = ext =>
  ext.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        loose: { default: false, rendered: false, keepOnSplit: true }
      };
    },
    parseMarkdown(token, helpers) {
      const node = ext.config.parseMarkdown(token, helpers);
      if (!node || Array.isArray(node)) return node;
      return { ...node, attrs: { ...(node.attrs || {}), loose: isLoose(token) } };
    },
    renderMarkdown(node, h) {
      if (!node.content) return '';
      return h.renderChildren(node.content, node.attrs?.loose ? '\n\n' : '\n');
    }
  });

const EXTENSIONS = [
  StarterKit.configure({
    bulletList: false,
    orderedList: false,
    heading: { levels: [1, 2, 3, 4] },
    underline: false,
    link: { openOnClick: false, autolink: true, defaultProtocol: 'https' }
  }),
  keepLoose(BulletList),
  keepLoose(OrderedList),
  TaskList,
  TaskItem.configure({ nested: true }),
  TableKit.configure({ table: { resizable: false } }),
  Image,
  CharacterCount,
  Placeholder.configure({ placeholder: 'Escribe aquí, o pulsa «/» para insertar un bloque…' }),
  Markdown.configure({ indentation: { style: 'space', size: 2 } })
];

/** Bloques del menú «/» y de «Insertar» (`h2` sigue primero para `/tit`). */
const BLOCKS = [
  { id: 'p', label: 'Texto', hint: 'Párrafo normal', run: c => c.setParagraph() },
  { id: 'h2', label: 'Título de sección', hint: '## 1. Definición', run: c => c.setHeading({ level: 2 }) },
  { id: 'h3', label: 'Subtítulo', hint: '###', run: c => c.setHeading({ level: 3 }) },
  { id: 'h4', label: 'Apartado', hint: '####', run: c => c.setHeading({ level: 4 }) },
  { id: 'ul', label: 'Lista', hint: 'Viñetas', run: c => c.toggleBulletList() },
  { id: 'ol', label: 'Lista numerada', hint: '1. 2. 3.', run: c => c.toggleOrderedList() },
  { id: 'quote', label: 'Cita', hint: 'Versículo o cita destacada', run: c => c.toggleBlockquote() },
  { id: 'verse', label: 'Pasaje bíblico', hint: 'Buscar en NTV / Codex', openModal: 'verse', run: c => c },
  { id: 'img', label: 'Imagen', hint: 'De la biblioteca de medios o subir', openModal: 'image', run: c => c },
  { id: 'table', label: 'Tabla', hint: '3 × 3 con encabezado', run: c => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }) },
  { id: 'hr', label: 'Separador', hint: '---', run: c => c.setHorizontalRule() },
  { id: 'code', label: 'Código', hint: 'Bloque de código', run: c => c.toggleCodeBlock() }
];

const SHORTCUTS = [
  ['Ctrl + S', 'Guardar'],
  ['Ctrl + Z / Ctrl + Y', 'Deshacer / rehacer'],
  ['Ctrl + B / I', 'Negrita / cursiva'],
  ['Ctrl + K', 'Enlace'],
  ['Ctrl + Shift + V', 'Insertar pasaje bíblico'],
  ['Ctrl + Alt + 2 / 3 / 4', 'Títulos'],
  ['Ctrl + Shift + 7 / 8', 'Lista numerada / viñetas'],
  ['Ctrl + Shift + B', 'Cita'],
  ['/', 'Menú de bloques (al empezar una línea)'],
  ['Alt + ↑ / ↓', 'Mover el bloque']
];

/** Mueve el bloque de primer nivel que contiene el cursor una posición arriba o abajo. */
function moveBlock(editor, dir) {
  const { state, view } = editor;
  const { $from } = state.selection;
  if ($from.depth < 1) return false;
  const index = $from.index(0);
  const doc = state.doc;
  const target = index + dir;
  if (target < 0 || target >= doc.childCount) return false;
  const node = doc.child(index);
  let start = 0;
  for (let i = 0; i < index; i++) start += doc.child(i).nodeSize;
  const offset = state.selection.from - start;
  let tr = state.tr.delete(start, start + node.nodeSize);
  let insertAt = 0;
  for (let i = 0; i < target; i++) insertAt += tr.doc.child(i).nodeSize;
  tr = tr.insert(insertAt, node);
  const sel = Selection.near(tr.doc.resolve(Math.min(insertAt + offset, tr.doc.content.size)));
  view.dispatch(tr.setSelection(sel).scrollIntoView());
  return true;
}

function Btn({ on, label, title, onClick, disabled, children }) {
  return (
    <button
      type="button"
      className={`rte__btn${on ? ' is-on' : ''}`}
      aria-label={label}
      aria-pressed={on === undefined ? undefined : Boolean(on)}
      title={title || label}
      disabled={disabled}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function RichEditor({ value, onChange, docKey, onSave }) {
  const [mode, setMode] = useState('visual');
  const [width, setWidth] = useState('full');
  const [slash, setSlash] = useState(null);
  const [help, setHelp] = useState(false);
  const [verseOpen, setVerseOpen] = useState(false);
  const [imgModal, setImgModal] = useState(null); // { src, alt }
  const slashRef = useRef(null);
  slashRef.current = slash;
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: value,
    contentType: 'markdown',
    immediatelyRender: true,
    editorProps: {
      attributes: { class: 'study-prose rte__surface', 'aria-label': 'Contenido del estudio', spellcheck: 'true' },
      handleKeyDown: (view, event) => {
        const s = slashRef.current;
        if (s) {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            setSlash(prev => prev && { ...prev, active: (prev.active + (event.key === 'ArrowDown' ? 1 : -1) + prev.items.length) % prev.items.length });
            return true;
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            const item = s.items[s.active];
            if (item) applySlash(item);
            return true;
          }
          if (event.key === 'Escape') {
            setSlash(null);
            return true;
          }
        }
        if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
          return moveBlock(editorRef.current, event.key === 'ArrowUp' ? -1 : 1);
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          editLink();
          return true;
        }
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'v') {
          event.preventDefault();
          setVerseOpen(true);
          return true;
        }
        return false;
      }
    },
    onUpdate: ({ editor: ed }) => {
      changeRef.current?.(ed.getMarkdown());
    },
    onSelectionUpdate: ({ editor: ed }) => updateSlash(ed),
    onTransaction: ({ editor: ed }) => updateSlash(ed)
  });
  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Gancho para `qa:admin`: pasa un Markdown por un editor aparte (sin tocar el
  // abierto) y devuelve lo que guardaría. El panel solo existe en dev.
  useEffect(() => {
    window.__cruxEditor = editorRef.current;
    window.__cruxRoundtrip = md => {
      const probe = new Editor({ extensions: EXTENSIONS, content: md, contentType: 'markdown' });
      const out = probe.getMarkdown();
      probe.destroy();
      return { out, before: renderProse(md), after: renderProse(out) };
    };
    return () => {
      delete window.__cruxRoundtrip;
    };
  }, []);

  // Al abrir otro estudio se carga su texto sin marcarlo como cambiado.
  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(value || '', { contentType: 'markdown', emitUpdate: false });
    setSlash(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, docKey]);

  // Ctrl+S guarda desde cualquier modo y Escape cierra el modal de imagen.
  useEffect(() => {
    const onKey = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current?.();
      }
      if (e.key === 'Escape') setImgModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function updateSlash(ed) {
    const { $from, empty } = ed.state.selection;
    const parent = $from.parent;
    if (!empty || parent.type.name !== 'paragraph' || $from.depth !== 1) return setSlash(null);
    const text = parent.textContent;
    if (!text.startsWith('/') || $from.parentOffset !== text.length || text.length > 24) return setSlash(null);
    const fold = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const q = fold(text.slice(1));
    const items = BLOCKS.filter(b => !q || fold(b.label).includes(q) || b.id.startsWith(q));
    if (!items.length) return setSlash(null);
    const coords = ed.view.coordsAtPos($from.pos);
    const box = ed.view.dom.closest('.rte').getBoundingClientRect();
    setSlash(prev => ({
      items,
      active: prev && prev.items.length === items.length ? Math.min(prev.active, items.length - 1) : 0,
      x: coords.left - box.left,
      y: coords.bottom - box.top + 6,
      from: $from.start(),
      to: $from.pos
    }));
  }

  function applySlash(item) {
    const ed = editorRef.current;
    const s = slashRef.current;
    if (!ed || !s) return;
    item.run(ed.chain().focus().deleteRange({ from: s.from, to: s.to })).run();
    setSlash(null);
    if (item.openModal === 'verse') setVerseOpen(true);
    if (item.openModal === 'image') setImgModal({ src: '', alt: '' });
  }

  function editLink() {
    const ed = editorRef.current;
    if (!ed) return;
    const prev = ed.getAttributes('link').href || '';
    const url = window.prompt('Dirección del enlace (vacío para quitarlo)', prev);
    if (url === null) return;
    if (!url.trim()) ed.chain().focus().extendMarkRange('link').unsetLink().run();
    else ed.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  const insertVerseMarkdown = md => {
    if (!md) return;
    if (mode === 'markdown') {
      const next = value ? `${value.replace(/\s+$/, '')}\n\n${md}\n` : `${md}\n`;
      onChange?.(next);
      return;
    }
    editor?.chain().focus().insertContent(md, { contentType: 'markdown' }).run();
  };

  const insertImage = () => {
    if (!imgModal?.src?.trim()) return;
    const src = imgModal.src.trim();
    const alt = imgModal.alt.trim();
    if (mode === 'markdown') {
      const md = `![${alt}](${src})`;
      const next = value ? `${value.replace(/\s+$/, '')}\n\n${md}\n` : `${md}\n`;
      onChange?.(next);
    } else {
      editor?.chain().focus().setImage({ src, alt }).run();
    }
    setImgModal(null);
  };

  const st = useEditorState({
    editor,
    selector: ({ editor: ed }) =>
      ed
        ? {
            h: [2, 3, 4].find(l => ed.isActive('heading', { level: l })) || 0,
            bold: ed.isActive('bold'),
            italic: ed.isActive('italic'),
            strike: ed.isActive('strike'),
            code: ed.isActive('code'),
            link: ed.isActive('link'),
            ul: ed.isActive('bulletList'),
            ol: ed.isActive('orderedList'),
            quote: ed.isActive('blockquote'),
            table: ed.isActive('table'),
            canUndo: ed.can().undo(),
            canRedo: ed.can().redo(),
            words: ed.storage.characterCount.words()
          }
        : null
  });

  const showVisual = mode === 'visual' || mode === 'split';
  const showPreview = mode === 'preview' || mode === 'split';
  const previewHtml = useMemo(() => (showPreview ? renderProse(value || '') : ''), [showPreview, value]);

  const switchMode = next => {
    if (next === mode || !editor) return;
    if (mode === 'markdown') editor.commands.setContent(value || '', { contentType: 'markdown', emitUpdate: false });
    setMode(next);
  };

  if (!editor || !st) return null;
  const chain = () => editor.chain().focus();
  const words = showVisual ? st.words : String(value || '').split(/\s+/).filter(Boolean).length;

  return (
    <div className="rte">
      <div className="rte__bar" role="toolbar" aria-label="Formato">
        <div className="rte__modes" role="group" aria-label="Modo">
          {[
            ['visual', 'Visual'],
            ['split', 'Dividida'],
            ['markdown', 'Markdown'],
            ['preview', 'Vista previa']
          ].map(([id, label]) => (
            <button key={id} type="button" className={mode === id ? 'is-on' : ''} aria-pressed={mode === id} onClick={() => switchMode(id)}>
              {label}
            </button>
          ))}
        </div>

        {showVisual && (
          <>
            <span className="rte__sep" />
            <Btn label="Deshacer" title="Deshacer (Ctrl+Z)" disabled={!st.canUndo} onClick={() => chain().undo().run()}>↶</Btn>
            <Btn label="Rehacer" title="Rehacer (Ctrl+Y)" disabled={!st.canRedo} onClick={() => chain().redo().run()}>↷</Btn>
            <span className="rte__sep" />
            <select
              className="rte__style"
              aria-label="Estilo del bloque"
              value={st.h ? `h${st.h}` : 'p'}
              onChange={e => BLOCKS.find(b => b.id === e.target.value)?.run(chain()).run()}
            >
              <option value="p">Texto</option>
              <option value="h2">Título de sección</option>
              <option value="h3">Subtítulo</option>
              <option value="h4">Apartado</option>
            </select>
            <Btn label="Negrita" title="Negrita (Ctrl+B)" on={st.bold} onClick={() => chain().toggleBold().run()}><b>B</b></Btn>
            <Btn label="Cursiva" title="Cursiva (Ctrl+I)" on={st.italic} onClick={() => chain().toggleItalic().run()}><i>I</i></Btn>
            <Btn label="Tachado" on={st.strike} onClick={() => chain().toggleStrike().run()}><s>S</s></Btn>
            <Btn label="Código" on={st.code} onClick={() => chain().toggleCode().run()}>{'</>'}</Btn>
            <Btn label="Enlace" title="Enlace (Ctrl+K)" on={st.link} onClick={editLink}>🔗</Btn>
            <span className="rte__sep" />
            <Btn label="Lista" on={st.ul} onClick={() => chain().toggleBulletList().run()}>•</Btn>
            <Btn label="Lista numerada" on={st.ol} onClick={() => chain().toggleOrderedList().run()}>1.</Btn>
            <Btn label="Cita" on={st.quote} onClick={() => chain().toggleBlockquote().run()}>❝</Btn>
            <Btn label="Insertar pasaje bíblico" title="Pasaje bíblico NTV / Codex (Ctrl+Shift+V)" onClick={() => setVerseOpen(true)}>📖</Btn>
            <Btn label="Insertar imagen" title="Insertar imagen desde Medios" onClick={() => setImgModal({ src: '', alt: '' })}>🖼</Btn>
            <Btn label="Separador" onClick={() => chain().setHorizontalRule().run()}>―</Btn>
            <Btn label="Tabla" on={st.table} onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦</Btn>
            {st.table && (
              <span className="rte__table" role="group" aria-label="Tabla">
                <Btn label="Añadir fila" onClick={() => chain().addRowAfter().run()}>+ fila</Btn>
                <Btn label="Añadir columna" onClick={() => chain().addColumnAfter().run()}>+ col</Btn>
                <Btn label="Quitar fila" onClick={() => chain().deleteRow().run()}>− fila</Btn>
                <Btn label="Quitar columna" onClick={() => chain().deleteColumn().run()}>− col</Btn>
                <Btn label="Quitar tabla" onClick={() => chain().deleteTable().run()}>✕</Btn>
              </span>
            )}
            <span className="rte__sep" />
            <Btn label="Subir bloque" title="Subir bloque (Alt+↑)" onClick={() => moveBlock(editor, -1)}>↑</Btn>
            <Btn label="Bajar bloque" title="Bajar bloque (Alt+↓)" onClick={() => moveBlock(editor, 1)}>↓</Btn>
          </>
        )}

        {mode === 'preview' && (
          <div className="rte__modes rte__widths" role="group" aria-label="Ancho de la vista previa">
            {[
              ['390', 'Móvil'],
              ['768', 'Tableta'],
              ['full', 'Escritorio']
            ].map(([id, label]) => (
              <button key={id} type="button" className={width === id ? 'is-on' : ''} aria-pressed={width === id} onClick={() => setWidth(id)}>
                {label}
              </button>
            ))}
          </div>
        )}

        <span className="rte__spacer" />
        <span className="rte__count">
          {words} palabras · {Math.max(1, Math.round(words / 200))} min
        </span>
        <Btn label="Atajos de teclado" on={help} onClick={() => setHelp(h => !h)}>?</Btn>
      </div>

      {help && (
        <dl className="rte__help">
          {SHORTCUTS.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className={mode === 'split' ? 'rte__split' : undefined}>
        <div className="rte__page" hidden={!showVisual}>
          <DragHandle editor={editor}>
            <div className="rte__grip" title="Arrastra para mover el bloque" aria-hidden="true">⋮⋮</div>
          </DragHandle>
          <EditorContent editor={editor} />
          {slash && (
            <ul className="rte__slash" role="listbox" aria-label="Insertar bloque" style={{ left: slash.x, top: slash.y }}>
              {slash.items.map((item, i) => (
                <li key={item.id} role="option" aria-selected={i === slash.active}>
                  <button
                    type="button"
                    className={i === slash.active ? 'is-on' : ''}
                    onMouseDown={e => {
                      e.preventDefault();
                      applySlash(item);
                    }}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {showPreview && (
          <div className="rte__preview-wrap">
            <div
              className="rte__preview study-prose"
              style={{ maxWidth: mode === 'preview' && width !== 'full' ? `${width}px` : undefined }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}
      </div>

      {mode === 'markdown' && (
        <textarea
          className="admin__body rte__md"
          rows={24}
          spellCheck={false}
          value={value}
          aria-label="Contenido en Markdown"
          onChange={e => onChange(e.target.value)}
        />
      )}

      {verseOpen && (
        <VersePickerModal
          onInsert={insertVerseMarkdown}
          onClose={() => setVerseOpen(false)}
        />
      )}

      {imgModal && (
        <div className="rte__modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && setImgModal(null)}>
          <div className="rte__modal" role="dialog" aria-modal="true" aria-labelledby="img-modal-title">
            <div className="rte__modal-head">
              <strong id="img-modal-title">Insertar imagen</strong>
              <button type="button" className="admin__btn" onClick={() => setImgModal(null)}>✕</button>
            </div>
            <MediaPicker
              label="Imagen (/img/…)"
              value={imgModal.src}
              onChange={src => setImgModal(m => ({ ...m, src }))}
            />
            <label className="admin__field">
              <span>Texto alternativo (accesibilidad)</span>
              <input
                value={imgModal.alt}
                placeholder="Descripción breve de la imagen"
                onChange={e => setImgModal(m => ({ ...m, alt: e.target.value }))}
              />
            </label>
            <div className="rte__modal-foot">
              <button type="button" className="admin__btn" onClick={() => setImgModal(null)}>Cancelar</button>
              <button type="button" className="admin__btn admin__btn--accent" disabled={!imgModal.src.trim()} onClick={insertImage}>
                Insertar imagen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
