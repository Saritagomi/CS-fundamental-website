const STORAGE_KEY = 'cslearn-progress';

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function markComplete(topicSlug, sectionSlug) {
  const data = getAll();
  if (!data[topicSlug]) data[topicSlug] = {};
  data[topicSlug][sectionSlug] = true;
  saveAll(data);
}

export function isComplete(topicSlug, sectionSlug) {
  const data = getAll();
  return !!(data[topicSlug] && data[topicSlug][sectionSlug]);
}

export function getTopicProgress(topicSlug, totalSections) {
  const data = getAll();
  if (!data[topicSlug]) return { completed: 0, total: totalSections, pct: 0 };
  const completed = Object.keys(data[topicSlug]).length;
  const pct = totalSections ? Math.round((completed / totalSections) * 100) : 0;
  return { completed, total: totalSections, pct };
}

export function getAllProgress() {
  return getAll();
}
