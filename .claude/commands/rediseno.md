---
description: Implementa una fase del rediseño de Crux (A–H) desde docs/rediseno/
argument-hint: "[fase: 0, A, B, C, D, E, F, G o H]"
---

Implementa la fase **$ARGUMENTS** del rediseño de Crux.

1. Lee `AGENTS.md` y `docs/rediseno/README.md` (tabla de fases y reglas para el agente).
2. Abre el archivo de la fase en `docs/rediseno/fases/` (0 → `00-…`, A → `01-…`, B → `02-…`,
   C → `03-…`, D → `04-…`, E → `05-…`, F → `06-…`, G → `07-…`, H → `08-…`) y los materiales que
   cite (`docs/rediseno/datos/`, `docs/rediseno/referencia/`).
3. Comprueba que estás en `main` y sin cambios pendientes antes de empezar.
4. Implementa la fase completa. Los scripts que escriben contenido van primero en simulación:
   enséñame el resultado y espera mi confirmación antes de `--write`.
5. Ejecuta `npm run build`, `npm run qa:vistas`, `npm run qa:a11y` y la QA propia de la fase
   (con `npm run dev` en marcha) y corrige lo que falle.
6. Haz **un commit** con el mensaje de `docs/rediseno/fases/10-commits-y-despliegue.md`.
   No hagas `git push`.
7. Resume qué cambió, qué QA pasó y qué queda pendiente.
