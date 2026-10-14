# KronoGantt

Diagramas de Gantt en el navegador (React 19 + Vite + Zustand + Tailwind 4): modo fantasma (líneas base),
dependencias, costes, importación/exportación (Excel/CSV, MS Project XML) y exportación a PNG/JPG/SVG/PDF.

Los datos se guardan **solo en el navegador** (`localStorage`); no hay backend.

## Desarrollo
```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # tsc --noEmit
npm test         # pruebas de saneamiento y utilidades
npm run build
```

## Seguridad
- Todo dato externo (localStorage, Excel, XML) pasa por `src/utils/sanitize.ts`.
- Cabeceras HTTP (CSP, HSTS, etc.) en `vercel.json`. Si cambias el script de analítica de `index.html`,
  actualiza también `script-src`/`connect-src`.
- Informe completo: `SECURITY_AUDIT.md`.
