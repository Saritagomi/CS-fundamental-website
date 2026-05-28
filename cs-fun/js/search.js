let searchIndex = [];

export function buildSearchIndex(topics) {
  searchIndex = [];
  topics.forEach(topic => {
    searchIndex.push({
      type: 'topic',
      title: topic.title,
      subtitle: topic.description,
      url: `topic.html?topic=${topic.slug}`,
      tags: topic.tags || [],
    });
    (topic.sections || []).forEach(section => {
      searchIndex.push({
        type: 'section',
        title: section.title,
        subtitle: topic.title,
        url: `topic.html?topic=${topic.slug}&section=${section.slug}`,
      });
    });
  });
}

export function search(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return searchIndex.filter(item =>
    item.title.toLowerCase().includes(q) ||
    (item.subtitle || '').toLowerCase().includes(q) ||
    (item.tags || []).some(t => t.toLowerCase().includes(q))
  ).slice(0, 8);
}

function renderResults(results, container) {
  if (!results.length) {
    container.innerHTML = '<div class="search-no-results">No results found</div>';
    return;
  }
  container.innerHTML = results.map(r => `
    <a class="search-result-item" href="${r.url}">
      <div>
        <div class="search-result-title">${r.title}</div>
        ${r.subtitle ? `<div class="search-result-sub">${r.subtitle}</div>` : ''}
      </div>
    </a>
  `).join('');
}

export function initSearch(inputEl, dropdownEl) {
  if (!inputEl) return;
  let debounce;

  inputEl.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = inputEl.value.trim();
      if (!q) { dropdownEl.classList.add('hidden'); return; }
      const results = search(q);
      renderResults(results, dropdownEl);
      dropdownEl.classList.remove('hidden');
    }, 200);
  });

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Escape') { dropdownEl.classList.add('hidden'); inputEl.blur(); }
  });

  document.addEventListener('click', e => {
    if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) {
      dropdownEl.classList.add('hidden');
    }
  });
}
