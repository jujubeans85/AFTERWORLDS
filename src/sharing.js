export function worldShareURL(entry, origin, state = {}) {
  if (!entry?.slug || !/^[a-zA-Z0-9-]+$/.test(entry.slug)) throw new TypeError('Valid globe slug required');
  const base = new URL(origin);
  if (!['https:', 'http:'].includes(base.protocol)) throw new TypeError('HTTP origin required');
  const url = new URL(`/globe/${entry.slug}/`, base.origin);
  if (state.revision !== undefined) {
    if (!/^[a-f0-9]{64}$/.test(state.revision)) throw new TypeError('Valid research revision required');
    url.searchParams.set('v',state.revision);
    if (state.selection !== undefined) {
      if (!/^[a-zA-Z0-9_-]{1,120}$/.test(state.selection)) throw new TypeError('Valid source row ID required');
      url.searchParams.set('row',state.selection);
    }
  } else if (state.selection !== undefined) throw new TypeError('Selection requires a revision');
  return url.href;
}
// Call directly in a click handler: awaiting anything first can consume activation.
export async function shareWorld(entry, origin, nav = navigator, native = true, state = {}) {
  const url = worldShareURL(entry, origin, state);
  if (native && typeof nav.share === 'function') {
    try { await nav.share({ title: `${entry.newTitle} — AFTERWORLD`, text: entry.question || 'Explore this world.', url }); return { status: 'shared', url }; }
    catch (error) { if (error.name === 'AbortError') return { status: 'cancelled', url }; }
  }
  try {
    if (!nav.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await nav.clipboard.writeText(url); return { status: 'copied', url };
  } catch { return { status: 'manual', url }; }
}
