const cache = new Map();

export async function loadJSON(path) {
  if (cache.has(path)) return cache.get(path);

  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const data = await res.json();
  cache.set(path, data);
  return data;
}

export async function loadTopics() {
  return loadJSON('content/topics.json');
}

export async function loadTopicIndex(slug) {
  return loadJSON(`content/${slug}/index.json`);
}

export async function loadSection(topicSlug, sectionSlug) {
  return loadJSON(`content/${topicSlug}/sections/${sectionSlug}.json`);
}

export function clearCache() {
  cache.clear();
}
