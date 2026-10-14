/** Datos de autoría: única fuente para la pestaña «Autor» del modal «Acerca de». */
export const AUTHOR = {
  name: 'Aitor Sánchez Gutiérrez',
  copyright: 'Copyright: Aitor Sánchez Gutiérrez © 2026 - Reservados todos los derechos',
  links: [
    { id: 'about', label: 'Acerca de...', description: 'Información sobre KronoGantt y su autor', href: '/acerca-de.html', external: false },
    { id: 'contact', label: 'Contacto', description: 'aitorsanchez.pages.dev/contacto', href: 'https://aitorsanchez.pages.dev/contacto', external: true },
    { id: 'blog', label: 'Blog', description: 'aitorsanchez.pages.dev', href: 'https://aitorsanchez.pages.dev', external: true },
    { id: 'apps', label: 'Más apps', description: 'aitorhub.vercel.app', href: 'https://aitorhub.vercel.app', external: true },
  ],
} as const;
