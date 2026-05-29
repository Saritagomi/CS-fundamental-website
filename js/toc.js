export function buildTOC(contentEl, tocNav) {
  tocNav.innerHTML = '';
  const headings = contentEl.querySelectorAll('h2, h3');
  if (!headings.length) return;

  headings.forEach(h => {
    const level = parseInt(h.tagName[1]);
    const id = h.id || h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    h.id = id;

    const link = document.createElement('a');
    link.className = 'toc-link';
    link.href = `#${id}`;
    link.textContent = h.textContent;
    link.dataset.level = level;
    link.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    tocNav.appendChild(link);
  });

  setupScrollSpy(tocNav);
}

function setupScrollSpy(tocNav) {
  const links = tocNav.querySelectorAll('.toc-link');
  if (!links.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = tocNav.querySelector(`[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-10% 0px -80% 0px', threshold: 0 });

  document.querySelectorAll('h2[id], h3[id]').forEach(h => observer.observe(h));
}
