const links = [...document.querySelectorAll('nav a')];
const sections = links
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (!visible) return;

      links.forEach((link) => {
        const active = link.getAttribute('href') === `#${visible.target.id}`;
        link.toggleAttribute('aria-current', active);
      });
    },
    { rootMargin: '-35% 0px -55%' },
  );

  sections.forEach((section) => observer.observe(section));
}

