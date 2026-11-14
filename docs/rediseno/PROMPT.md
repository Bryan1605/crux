# Prompt para Claude Code (Opus 5.5)

Pega esto en una sesión de Claude Code abierta en `Web Crux/`:

---

Vamos a implementar el rediseño de Crux. Lee primero `AGENTS.md` y `docs/rediseno/README.md`, y
después cada archivo de `docs/rediseno/fases/` en orden.

1. Haz el **Paso 0** (`00-paso-0-sincronizar-rama.md`) y confírmame en qué rama quedas.
2. Implementa las fases **A a H** en orden, **un commit por fase** en `main` con el mensaje
   de `10-commits-y-despliegue.md`.
3. Después de cada fase ejecuta `npm run build`, `npm run qa:vistas` y `npm run qa:a11y`
   (con `npm run dev` en otra terminal), más la QA propia de la fase, y corrige lo que falle
   antes de seguir. Añade las comprobaciones nuevas de `09-verificacion.md`.
4. Fase D: copia `docs/rediseno/datos/temas.json` a `content/temas.json` y usa
   `docs/rediseno/datos/asignacion-fundamentos.json` en el script de temas. Ejecuta el script
   **en simulación**, enséñame el resumen y espera mi confirmación antes de `--write`.
5. Fase F: la card debe quedar **igual que** `docs/rediseno/referencia/study-card.html` y
   usarse en todas las vistas de tarjetas.
6. Fase H: el Domo y la sección «Acerca de esta obra» de `/biblia` **no se rediseñan**; solo
   se asegura que «Acerca de esta obra» va justo debajo del Domo. La parte H.4 (editar el `.md`
   de la Biblia) pídemela antes de hacerla.
7. No ejecutes `index:wiki` y **no hagas `git push`** hasta que te lo diga.

Al terminar, dame un resumen por fase: qué cambió, qué QA pasó y qué quedó pendiente.
