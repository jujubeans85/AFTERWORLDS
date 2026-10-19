export function worldShareURL(entry, origin) {
  if (!entry?.slug || !/^[a-zA-Z0-9-]+$/.test(entry.slug)) throw new TypeError('Valid globe slug required');
  const base = new URL(origin);
  if (!['https:', 'http:'].includes(base.protocol)) throw new TypeError('HTTP origin required');
  return new URL(`/globe/${entry.slug}/`, base.origin).href;
}
// Call directly in a click handler: awaiting anything first can consume activation.
export async function shareWorld(entry, origin, nav = navigator, native = true) {
  const url = worldShareURL(entry, origin);
  if (native && typeof nav.share === 'function') {
    try { await nav.share({ title: `${entry.newTitle} — AFTERWORLD`, text: entry.question || 'Explore this world.', url }); return { status: 'shared', url }; }
    catch (error) { if (error.name === 'AbortError') return { status: 'cancelled', url }; }
  }
  try {
    if (!nav.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await nav.clipboard.writeText(url); return { status: 'copied', url };
  } catch { return { status: 'manual', url }; }
}
