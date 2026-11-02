# Proyecto bíblico — memoria de trabajo

Este directorio guarda **de dónde salen los textos**, cómo se traducen los libros
que solo conserva el Codex Sinaiticus, cómo se escriben las fichas de los 73
libros y qué falta. No se publica en la web: vive fuera de `public/` y de
`content/`.

Si eres un agente nuevo, lee en este orden:

1. `FUENTES.md` — qué texto es cada cosa y con qué licencia.
2. `TRADUCCION.md` — método, etiquetas y esquema de la traducción.
3. `FICHAS.md` + `PLANTILLA-FICHA.md` — método y plantilla de las fichas.
4. `ESTADO.md` — qué está hecho y qué toca ahora.
5. `DECISIONES.md` — por qué se eligió cada cosa.
6. `GLOSARIO.md` — términos que deben traducirse siempre igual.

## Estado en una línea

Versión **0.11.0**, **214 rutas**, **73 libros**: 66 con NTV, 59 con Codex y
**7 solo-Codex**; **708 paralelos**. El hebreo, la traducción de los seis libros
solo-Codex y las 73 fichas están **planificados, no implementados**.
Los datos actuales están verificados en `ESTADO.md`.

## Reglas que no se negocian

- **No inventar.** Ni fechas, ni consensos, ni citas, ni fuentes, ni variantes.
  Las fechas van como rangos y con su grado de certeza.
- **Etiquetar.** `[NTV]`, `[Tradición]`, `[Estudio]`. Una traducción nueva
  **nunca** se etiqueta como NTV.
- **No traducir el aparato crítico** ni las notas del traductor. El aparato se
  conserva en griego; la traducción solo cubre el texto base.
- **No rellenar lagunas.** Si el Codex tiene una laguna, se traduce lo que hay y
  se anota; no se completa con la NTV ni con otra versión.
- **No editar a mano** los JSON generados de `public/textos/exegesis/` ni los
  índices `content/estudios.json`/`content/busquedas.json`. Se regeneran.
- **Licencia del Codex**: la transcripción es **CC BY-NC-SA 3.0** con atribución
  literal. La traducción derivada mantiene esa licencia y el uso no comercial.
- **La NTV tiene derechos** (Tyndale House Foundation). El repositorio ya
  contiene un volcado de trabajo; no es dominio público y no se redistribuye
  como si lo fuera.
- **No tocar el portafolio de la raíz** ni el resto del sitio para resolver algo
  de este proyecto.
- **No añadir** página de privacidad, banner de cookies ni analítica.
- **Verificar antes de decir “listo”**: `npm run build`, los QA que toquen y,
  si se publica, `npm run qa:prod`.

## Dónde está cada cosa

| Pieza | Ruta | Estado |
|---|---|---|
| Tabla canónica de los 73 libros | `src/data/exegesis.js` | existente |
| NTV (fuente) | `src/assets/texts/nueva-traduccion-viviente.md` | existente, con derechos |
| Codex (transcripción) | `codexsinaiticus.org` → caché `src/assets/texts/.cache-codex/` | existente, caché ignorada |
| Codex 1911 (facsímil de referencia) | `src/assets/texts/codex-sinaiticus-1911.md` | existente, no lo usa el build |
| Salida NTV | `public/textos/exegesis/ntv/*.json` | generada y versionada |
| Salida Codex | `public/textos/exegesis/codex/*.json` | generada y versionada |
| Índice y buscadores | `public/textos/exegesis/index.json`, `buscar-at.json`, `buscar-nt.json` | generados |
| Léxico y lemas | `public/textos/exegesis/lexico.json`, `lemas/*.json`; fuente `content/lexico/griego.json` | generados/editable |
| Traducción (propuesta) | `src/assets/texts/trad/<libro>.json` → `public/textos/exegesis/trad/<libro>.json` | **borrador de Tobit 1–3** (sin publicar) |
| Fichas (propuesta) | `content/libros/<id>.json` → `public/textos/libros/` | **no existe aún** |
| Hebreo (propuesta) | `public/textos/hebreo/` y `/biblia/hebreo` | **no existe aún** |

## Cómo continuar

El orden acordado es:

(Reordenado el 2026-10-31; ver `DECISIONES.md` §6.)

1. ~~**Refactor de columnas de `/exegesis`**~~ — hecho el 2026-11-02 (`DECISIONES.md` §9).
2. **Tobit**: traducción piloto + ficha + panel + índice + registro de fuentes.
3. Los otros cinco libros solo-Codex: Judit, Sabiduría, 4 Macabeos, 1 Macabeos,
   Sirácida, y la ficha de 2 Esdras.
4. **Hebreo** (fase 1: datos y lector, solo texto y marcas; fase 2: columna de
   exégesis y alineación; versión 0.12.0).
5. Las **66 fichas** de la NTV, por lotes.
6. Comentarios capítulo a capítulo (fase futura; no están en el alcance actual).

No empieces por las 73 fichas ni por traducir los seis libros a la vez. El piloto
de Tobit y la primera ficha existen para fijar el formato y que el usuario lo
revise antes de escalar.

## Qué significa “terminado”

- `npm run build` pasa.
- `npm run qa:exegesis` y `npm run qa:lexico` pasan si se tocó texto o léxico.
- `npm run qa:vistas`, `qa:enlaces` y `qa:a11y` pasan si se tocó UI o rutas.
- `npm run qa:prod` pasa si se publicó.
- Las rutas nuevas están en `scripts/routes-lib.mjs` y en `sitemap.xml`.
- `ESTADO.md` y `DECISIONES.md` reflejan lo que se hizo.
