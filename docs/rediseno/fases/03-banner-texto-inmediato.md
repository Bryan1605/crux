# Fase C — Banner: el texto cambia en cuanto cambia la diapositiva

**Qué:** hoy el pie y el enlace cambian al **terminar** la transición (2,2 s). Deben cambiar
**al empezar**.

**Archivo:** `src/components/LiquidSwap/LiquidSwap.jsx`.

```diff
   const trigger = (originX, originY) => {
     if (n < 2 || swappingRef.current) return;
     const next = (idx + 1) % n;
     swappingRef.current = true;
     setSwap({ next, ox: originX, oy: originY });
+    onChange?.(next);
   };
 ...
         setIdx(swap.next);
         setSwap(null);
         swappingRef.current = false;
-        onChange?.(swap.next);
```

Opcional: un fundido corto del pie (`.banner__caption { transition: opacity .25s }` con una
`key` por diapositiva) para que el cambio no sea brusco.
