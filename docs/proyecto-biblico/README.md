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

Versión **0.13.0**, **289 rutas** (**288** en `sitemap.xml`), **73 libros**: 66 con NTV, 59 con Codex,
**7 solo-Codex** y **39 AT en Hebreo/Arameo (WLC / OSHB, Fases 1–3 con lematización 100 % y léxico español TBESH)**; **708 paralelos** Codex/NTV y **789 / 929** capítulos hebreos alineados con NTV en `/exegesis` (apagada por defecto, con paralelo de 2 o 3 testigos y fallback sin paralelo forzado en los 140 restantes). Están publicadas **8 traducciones de trabajo** en `borrador` (**3.789 versículos**: los **6/6 libros solo-Codex** —Tobit 232, Judit 327, Sabiduría 435, 4 Macabeos 479, 1 Macabeos 924 y Sirácida 1.364 = **3.761 vv.**— más Salmo 151 con 7 vv. y Joel 4 LXX con 21 vv., con tablas de revisión en `docs/proyecto-biblico/revision/`) y **todas las 73 fichas de libros** (`/biblia/libros/:id`, en `borrador`, con 128 fuentes verificadas en `content/libros/fuentes.json`). En apologética figuran **9 fascículos** (3 publicados: `shincheonji`, `adventismo` y `dispensacionalismo`; 6 anunciados «Próximamente»: Catolicismo Romano Papista, Gnósticos, Islam, Mormonismo · Santos de los Últimos Días, Testigos de Jehová y Judaizantes y Raíces Hebreas). Quedan pendientes la revisión humana de traducciones y fichas y los futuros comentarios capítulo a capítulo.
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
| Traducción (`trad/`) | `src/assets/texts/trad/<libro>.json` → `public/textos/exegesis/trad/<libro>.json` | **8/8 archivos (3.789 vv., `borrador`)**: 6/6 libros solo-Codex (`3.761 vv.`) + Salmo 151 (`7 vv.`) + Joel 4 LXX (`21 vv.`); tablas en `docs/proyecto-biblico/revision/` (columna «Trad» en `/exegesis`) |
| Fichas | `content/libros/<id>.json` + registro `content/libros/fuentes.json` → `/biblia/libros/<id>` | **73/73 fichas** (66 NTV + 7 solo-Codex, en `borrador`, 128 fuentes) |
| Hebreo (Fase 1) | `public/textos/hebreo/` (`39` libros WLC/OSHB, `6,47 MB`), `src/assets/fonts/ezra-sil/` y `/biblia/hebreo` | **implementado (Fase 1)**: RTL, Ezra SIL, arameo y ketiv/qere |
| Hebreo (Fase 2) | `src/components/HebrewVerseTokens.jsx` y columna `hebreo` en `src/pages/Exegesis.jsx` | **implementado (2026-11-23, `0.12.0`)**: apagada por defecto, 2/3 cols (`789/929`) y fallback sin paralelo forzado (`140`) |
| Hebreo (Fase 3) | `content/lexico/hebreo.json`, `public/textos/hebreo/{lemas/*,lexico,lexico-hebreo-base}.json`, `describeHebrewMorph` | **implementado (2026-11-24, `0.13.0`)**: 39 mapas V2 (`100 %`), 331 curadas (`79,0 %` morfemas) + 8.200 TBESH base |

## Cómo continuar

El orden acordado es:

(Reordenado el 2026-10-31; ver `DECISIONES.md` §6.)

1. ~~**Refactor de columnas de `/exegesis`**~~ — hecho el 2026-11-02 (`DECISIONES.md` §9).
2. ~~**Tobit**: traducción piloto + ficha + panel + índice + registro de fuentes~~ (hecho; pendiente revisión humana).
3. ~~**73 fichas introductorias + 6/6 solo-Codex + Salmo 151 y Joel 4 LXX**~~ — completadas en `borrador` (`3.789 vv.` en 8 archivos; Sabiduría, 4 Macabeos, 1 Macabeos y Sirácida añadidos el 2026-11-24); pendiente revisión humana de los borradores y fichas.
4. ~~**Hebreo, fase 1**~~ — hecho el 2026-11-22 (`public/textos/hebreo/` + lector RTL `/biblia/hebreo`).
5. ~~**Hebreo, fase 2**~~ — hecho el 2026-11-23 (columna de exégesis apagada por defecto en `/exegesis`, paralelo 2/3 cols, fallback sin paralelo forzado y versión `0.12.0`).
6. ~~**Hebreo, fase 3**~~ — hecho el 2026-11-24 (lematización OSHB, léxico curado español + respaldo TBESH, decodificación OSHM y diccionario interactivo en `/biblia/hebreo` y `/exegesis`, versión `0.13.0`).
7. Comentarios capítulo a capítulo (fase futura; no están en el alcance actual).

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
