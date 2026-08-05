/* =========================================================
   Nicolas Robinet - portfolio (Dusk)
   Keeps the sidebar's active nav highlight in sync during
   client-side (View Transition) navigations. The sidebar is
   persisted across pages, so its server-rendered highlight
   would otherwise stay frozen on the first page visited.
   ========================================================= */
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav__link'));

function isActive(href: string): boolean {
  const path = window.location.pathname;
  if (href === '/') return path === '/';
  if (href === '/journal') return path.startsWith('/journal') || path.startsWith('/posts');
  return path.startsWith(href);
}

function updateActiveNav(): void {
  for (const link of links) {
    if (isActive(link.getAttribute('href') || '')) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}

document.addEventListener('astro:page-load', updateActiveNav);
