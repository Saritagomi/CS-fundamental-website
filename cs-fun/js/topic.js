import { loadTopicIndex, loadSection } from './content-loader.js';
import { renderBlocks, highlightAll } from './renderer.js';
import { buildTOC } from './toc.js';
import { markComplete, isComplete, getTopicProgress } from './progress.js';

const params = new URLSearchParams(location.search);
const topicSlug   = params.get('topic') || '';
const initSection = params.get('section') || '';

let topicData = null;
let currentSection = null;

async function init() {
  if (!topicSlug) { window.location.href = 'index.html'; return; }

  try {
    topicData = await loadTopicIndex(topicSlug);
    document.title = `${topicData.title} — CSLearn`;
    renderSidebarInfo();
    buildSidebarNav();
    setupMobileNav();

    const target = initSection || topicData.sections?.[0]?.slug;
    if (target) loadSectionContent(target);
  } catch (err) {
    document.getElementById('content-area').innerHTML =
      `<div class="content-loading" style="color:var(--red)">Failed to load topic. Make sure you're running from a local server.<br><small>${err.message}</small></div>`;
  }
}

/* ── Sidebar ─────────────────────────────────────────── */

function renderSidebarInfo() {
  const el = document.getElementById('sidebar-topic-info');
  if (!el) return;
  el.innerHTML = `
    <div class="sidebar-topic-name">
      <span class="topic-icon">${topicData.icon || '📚'}</span>
      ${topicData.title}
    </div>
    <div class="sidebar-topic-progress" id="sidebar-progress-wrap">
      <div class="progress-track"><div class="progress-fill" id="sidebar-progress-fill" style="width:0%"></div></div>
      <span id="sidebar-progress-text">0%</span>
    </div>`.trim();
}

function buildSidebarNav(filter = '') {
  const nav = document.getElementById('sidebar-nav');
  const sections = topicData.sections || [];
  const filtered = filter
    ? sections.filter(s => s.title.toLowerCase().includes(filter.toLowerCase()))
    : sections;

  nav.innerHTML = filtered.map((section, i) => {
    const done = isComplete(topicSlug, section.slug);
    return `
<a class="sidebar-section-link" href="?topic=${topicSlug}&section=${section.slug}"
   data-slug="${section.slug}" onclick="navigateSection(event, '${section.slug}')">
  <span class="sidebar-section-num">${String(i + 1).padStart(2, '0')}</span>
  <span class="sidebar-section-title">${section.title}</span>
  <span class="sidebar-check${done ? ' done' : ''}"></span>
</a>`.trim();
  }).join('');

  updateActiveLink();
}

window.navigateSection = function(e, slug) {
  e.preventDefault();
  const url = new URL(location.href);
  url.searchParams.set('section', slug);
  history.pushState({}, '', url);
  loadSectionContent(slug);
};

function updateActiveLink() {
  document.querySelectorAll('.sidebar-section-link').forEach(link => {
    link.classList.toggle('active', link.dataset.slug === currentSection);
  });
}

function updateProgressUI() {
  const total = topicData.sections?.length || 0;
  const prog = getTopicProgress(topicSlug, total);
  const fill = document.getElementById('sidebar-progress-fill');
  const text = document.getElementById('sidebar-progress-text');
  const tocBar = document.getElementById('toc-progress-bar');
  const tocText = document.getElementById('toc-progress-text');
  const pill = document.getElementById('progress-pill');

  if (fill) fill.style.width = `${prog.pct}%`;
  if (text) text.textContent = `${prog.pct}%`;
  if (tocBar) tocBar.style.width = `${prog.pct}%`;
  if (tocText) tocText.textContent = `${prog.completed}/${prog.total} sections`;
  if (pill) pill.textContent = `${prog.pct}% complete`;
}

/* ── Section Loading ─────────────────────────────────── */

async function loadSectionContent(slug) {
  currentSection = slug;
  updateActiveLink();

  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = '<div class="content-loading"><div class="spinner"></div><span>Loading…</span></div>';

  try {
    const section = await loadSection(topicSlug, slug);
    renderSection(section);
    updateProgress(slug);
    renderPagination(slug);
    renderBreadcrumbs(section.title);
    updateProgressUI();
    contentArea.scrollTo?.(0, 0);
    window.scrollTo?.(0, 0);
  } catch (err) {
    contentArea.innerHTML = `<div class="content-loading" style="color:var(--red)">Failed to load section.<br><small>${err.message}</small></div>`;
  }
}

function renderSection(section) {
  const contentArea = document.getElementById('content-area');
  const time = section.estimatedTime ? `<span class="section-meta-item">⏱ ${section.estimatedTime}</span>` : '';
  const difficulty = section.difficulty
    ? `<span class="section-meta-item"><span class="difficulty-badge difficulty-${section.difficulty}">${section.difficulty}</span></span>`
    : '';

  const body = renderBlocks(section.blocks || []);
  const done = isComplete(topicSlug, section.slug);

  contentArea.innerHTML = `
<div class="content-body">
  <div class="section-title-block">
    <h1>${section.title}</h1>
    <div class="section-meta">${time}${difficulty}</div>
  </div>
  ${body}
  <div class="complete-btn-wrap">
    <button class="complete-btn${done ? ' done' : ''}" id="complete-btn"
      onclick="completeSectionHandler()">
      ${done ? '✓ Completed' : '✓ Mark as Complete'}
    </button>
  </div>
</div>`;

  highlightAll();
  buildTOC(contentArea, document.getElementById('toc-nav'));

  const rt = document.getElementById('reading-time');
  if (rt) rt.textContent = section.estimatedTime ? `${section.estimatedTime} read` : '';
}

window.completeSectionHandler = function() {
  if (!currentSection) return;
  markComplete(topicSlug, currentSection);
  const btn = document.getElementById('complete-btn');
  if (btn) { btn.textContent = '✓ Completed'; btn.classList.add('done'); btn.disabled = true; }
  buildSidebarNav();
  updateProgressUI();
};

/* ── Breadcrumbs ─────────────────────────────────────── */

function renderBreadcrumbs(sectionTitle) {
  const el = document.getElementById('breadcrumbs');
  if (!el) return;
  el.innerHTML = `
<span class="breadcrumb-item"><a href="index.html">CSLearn</a></span>
<span class="breadcrumb-sep">/</span>
<span class="breadcrumb-item"><a href="?topic=${topicSlug}">${topicData.title}</a></span>
<span class="breadcrumb-sep">/</span>
<span class="breadcrumb-item current">${sectionTitle}</span>`.trim();
}

/* ── Pagination ──────────────────────────────────────── */

function renderPagination(slug) {
  const el = document.getElementById('section-pagination');
  if (!el) return;
  const sections = topicData.sections || [];
  const idx = sections.findIndex(s => s.slug === slug);
  const prev = sections[idx - 1];
  const next = sections[idx + 1];

  el.innerHTML = `
${prev ? `<a class="pagination-btn prev" href="?topic=${topicSlug}&section=${prev.slug}" onclick="navigateSection(event,'${prev.slug}')">
  <span class="pagination-label"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Previous</span>
  <span class="pagination-title">${prev.title}</span>
</a>` : '<span></span>'}
${next ? `<a class="pagination-btn next" href="?topic=${topicSlug}&section=${next.slug}" onclick="navigateSection(event,'${next.slug}')">
  <span class="pagination-label">Next <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span>
  <span class="pagination-title">${next.title}</span>
</a>` : '<span></span>'}`.trim();
}

/* ── Progress ────────────────────────────────────────── */

function updateProgress(slug) {
  // Auto-mark as started when viewed — complete is explicit via button
}

/* ── Sidebar search ──────────────────────────────────── */

function setupMobileNav() {
  const menuToggle  = document.getElementById('menu-toggle');
  const sidebar     = document.getElementById('sidebar');
  const overlay     = document.getElementById('sidebar-overlay');
  const closeBtn    = document.getElementById('sidebar-close');
  const searchInput = document.getElementById('sidebar-search');

  const open  = () => { sidebar.classList.add('open');  overlay.classList.add('visible'); };
  const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('visible'); };

  menuToggle?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);

  let debounce;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => buildSidebarNav(searchInput.value), 150);
  });
}

/* ── Browser back/forward ────────────────────────────── */

window.addEventListener('popstate', () => {
  const p = new URLSearchParams(location.search);
  const s = p.get('section');
  if (s) loadSectionContent(s);
});

init();
