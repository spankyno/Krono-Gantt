# Auditoría de seguridad — KronoGantt

Alcance: código del repositorio (React/Vite, 100 % cliente, sin backend) y configuración de despliegue en Vercel.
Método: revisión manual de todo `src/`, `npm audit`, búsqueda de sinks peligrosos (`innerHTML`, `eval`, `dangerouslySetInnerHTML`, `window.open`…),
y pruebas dinámicas en Chromium contra el build original y el corregido.
Limitación: no se pudieron inspeccionar las cabeceras reales de https://krono-gantt.vercel.app (el sandbox no tiene salida a ese dominio);
se deduce que no había por la ausencia de `vercel.json`. Verifícalo tras desplegar.

## Hallazgos

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| 1 | Alta | `xlsx@0.18.5`: prototype pollution (GHSA-4r6h-8v6p-xvw6) y ReDoS (GHSA-5pgg-2g8v-p4x9) al parsear ficheros subidos por el usuario | Corregido: `@e965/xlsx@0.20.3` (build oficial de SheetJS publicado en npm con provenance). `npm audit`: 0 |
| 2 | Media | Datos no validados (localStorage / Excel / XML). Una tarea con `endDate: 9999-12-31` genera ~2,9 M columnas de timeline: la app se congela, y como se persiste, **no vuelve a arrancar** hasta borrar el almacenamiento (reproducido) | Corregido: `utils/sanitize.ts` + tope de timeline |
| 3 | Media | Script de terceros en `index.html` (`aitors-hub-dashboard…workers.dev/tracker.js`) sin SRI, con acceso total al DOM y al localStorage (nombres, notas, costes). Además es tráfico a terceros sin consentimiento (RGPD) | **Sin cambiar** (parece tu analítica). Mitigado limitando origen en la CSP. Decisión tuya |
| 4 | Media | Sin cabeceras de seguridad (CSP, anti-clickjacking, nosniff, HSTS, Referrer/Permissions-Policy) | Corregido: `vercel.json` |
| 5 | Baja | Exportación MS Project: nombres/notas en `CDATA` sin escapar; `]]>` rompe el XML e inyecta nodos | Corregido: `escapeXml` |
| 6 | Baja | Importación XML sin comprobar `parsererror`, tamaño ni DTD/entidades | Corregido |
| 7 | Baja | Valores de `color`/`fontFamily`/enums de datos importados se usaban en atributos SVG/CSS sin lista cerrada; ids como `__proto__`/`constructor` en mapas por id | Corregido (listas cerradas, objetos sin prototipo) |
| 8 | Baja | Importar XML reemplazaba el proyecto sin confirmar; "Restaurar demo" borraba todo sin confirmar y sin deshacer | Corregido (confirmaciones) |
| 9 | Info | Dependencias de servidor sin uso (`express`, `dotenv`, `@google/genai`) y `.env.example` con `GEMINI_API_KEY`: superficie de ataque y riesgo de filtrar claves si algún día se inyecta `process.env` en el bundle | Eliminado |
| 10 | Info | `npm run dev` abría el servidor de desarrollo en `0.0.0.0` | Corregido (solo localhost) |
| 11 | Info | Google Fonts desde CDN de Google: transferencia de IP a terceros (RGPD) | Pendiente (opcional: `@fontsource`) |

## No vulnerable (comprobado)
- Sin `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `window.open` ni enlaces externos: React escapa el texto; un nombre como `<img onerror=…>` se muestra como texto (probado).
- Exportar a `.xlsx` con celdas que empiezan por `=`: SheetJS las guarda como texto, no como fórmula (no hay exportación CSV).
- XXE: `DOMParser` del navegador no resuelve entidades externas; aun así se rechaza `DOCTYPE/ENTITY`.
- Sin secretos en el código ni variables de entorno en el bundle.

## Notas
- La CSP exige `style-src 'unsafe-inline'` porque React usa atributos `style`. `script-src` NO permite inline ni `eval`.
- Si cambias o quitas el tracker, ajusta `script-src` y `connect-src` en `vercel.json`.
- El `data-key` del tracker es público por naturaleza (va en el HTML); no sirve como secreto.
