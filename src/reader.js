import './vendor/juice-speech.js';

const RATE_OPTIONS = [0.8, 1, 1.25, 1.5, 1.75, 2];
const PREF_KEY = 'afterworld.reader.preferences.v1';
const BLOCKS = '.brief-summary, p, .integrity-note, .legend, .fact-label, .fact-limit, .selected-note, .publisher-outlook';
const EXCLUDE = '[data-reader-ui], .hint, .world-next, .hero-bottom, .site-footer, .about-intro, .timeline-heading, .boot-error';

// Use the rendered copy as the single source of truth. Controls and link URLs are
// excluded, while paragraphs, statistics and table rows keep their reading order.
export function readingText(node) {
  const copy = node.cloneNode(true);
  copy.querySelectorAll('[data-reader-ui], button, input, select, nav, canvas, svg, script, style, .dialog-actions, .brief-sources, .sources, .evidence-meta').forEach(el => el.remove());
  copy.querySelectorAll('br').forEach(el => el.replaceWith('\n'));
  copy.querySelectorAll('.table-note, .publisher-outlook > *, .score-sample > *').forEach(el => { el.prepend(' '); el.append(' '); });
  copy.querySelectorAll('td, th').forEach(el => el.append('. '));
  copy.querySelectorAll('p, h1, h2, h3, h4, li, tr, article, .time-label, .time-date, .time-value, .time-unit, .time-status, .integrity-note, .legend, .publisher-outlook, .score-sample').forEach(el => el.append('\n'));
  return copy.textContent.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function createAtlasReader(doc = document, win = window) {
  let prefs = {};
  try { prefs = JSON.parse(win.localStorage.getItem(PREF_KEY) || '{}') || {}; } catch {}
  let activeBlock = null, activeTrigger = null, activeText = '', voices = [], notice = '';
  const supported = !!(win.speechSynthesis && win.SpeechSynthesisUtterance);
  const panel = doc.createElement('section');
  panel.id = 'juice-reader';
  panel.className = 'reader-panel';
  panel.dataset.readerUi = '';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'JUICE Reader');
  panel.hidden = true;
  panel.innerHTML = `<div class="reader-heading"><div><span class="reader-brand">JUICE READER</span><span class="reader-title"></span></div><button type="button" data-reader-action="close" aria-label="Close Reader and stop playback">×</button></div>
    <div class="reader-transport" role="group" aria-label="Reading controls"><button type="button" data-reader-action="back" aria-label="Previous passage">←</button><button type="button" data-reader-action="play" class="reader-play">Read aloud</button><button type="button" data-reader-action="next" aria-label="Next passage">→</button><button type="button" data-reader-action="stop">Stop</button><span class="reader-count"></span></div>
    <progress class="reader-progress" max="100" value="0" aria-label="Reading progress"></progress><p class="reader-passage" tabindex="0"></p><div class="reader-status" role="status" aria-live="polite"></div>
    <details class="reader-settings"><summary>VOICE & READING OPTIONS</summary><div class="reader-options"><label>Voice<select class="reader-voice" aria-label="Reading voice"><option value="">Device default</option></select></label><label>Speed<select class="reader-rate" aria-label="Reading speed">${RATE_OPTIONS.map(rate => `<option value="${rate}">${rate}×</option>`).join('')}</select></label></div><div class="reader-quick-voices" role="group" aria-label="Quick voice choices"></div><div class="reader-extras"><button type="button" data-reader-action="voices">Refresh voices</button><button type="button" data-reader-action="size" aria-pressed="false">Larger text</button></div><p class="reader-help">Uses voices available on this device. Online voices may send text to their provider. Keep this page open while listening.</p></details>`;
  const find = selector => panel.querySelector(selector);
  const engine = new win.JuiceSpeech.Reader(win.speechSynthesis, win.SpeechSynthesisUtterance, update);
  engine.rate = RATE_OPTIONS.includes(prefs.rate) ? prefs.rate : 1;
  find('.reader-rate').value = String(engine.rate);

  function savePrefs() {
    try { win.localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {}
  }
  function setSize(large) {
    prefs.large = !!large;
    doc.documentElement.dataset.readingSize = large ? 'large' : 'normal';
    find('[data-reader-action="size"]').setAttribute('aria-pressed', String(!!large));
  }
  setSize(prefs.large);
  function highlight(playing) {
    doc.querySelectorAll('[data-reading-active]').forEach(el => el.removeAttribute('data-reading-active'));
    if (activeBlock?.isConnected && playing) {
      // For a whole overlay, highlight the paragraph containing this passage.
      const passage = engine.chunks[engine.index] || '';
      const para = [...activeBlock.querySelectorAll('p')].find(el => !el.closest('[data-reader-ui]') && readingText(el).includes(passage));
      (para || activeBlock).setAttribute('data-reading-active', '');
    }
  }
  function update(snapshot = engine.snapshot()) {
    const playing = ['playing', 'starting'].includes(snapshot.status);
    const play = find('[data-reader-action="play"]');
    play.textContent = playing ? 'Ⅱ Pause' : snapshot.status === 'finished' ? '↻ Read again' : snapshot.status === 'paused' ? '▷ Resume' : '▷ Read aloud';
    play.setAttribute('aria-label', playing ? 'Pause reading' : snapshot.status === 'finished' ? 'Read again from the beginning' : snapshot.status === 'paused' ? 'Resume reading' : 'Read aloud');
    find('.reader-count').textContent = snapshot.count ? `${Math.min(snapshot.index + 1, snapshot.count)} / ${snapshot.count}` : '';
    find('.reader-progress').value = snapshot.progress;
    find('.reader-passage').textContent = snapshot.passage || (snapshot.status === 'finished' ? 'End of this reading.' : activeText);
    find('.reader-status').textContent = !supported ? 'Read-aloud is unavailable in this browser. You can still read the text here, or open the atlas in Safari.' : notice || snapshot.message || (playing ? 'Reading · ' : 'Ready · ') + `${Math.max(1, Math.ceil(activeText.split(/\s+/).length / (170 * engine.rate)))} min at ${engine.rate}×`;
    panel.querySelectorAll('.reader-transport button, .reader-voice, .reader-rate').forEach(el => { el.disabled = !supported; });
    find('[data-reader-action="back"]').disabled = !supported || snapshot.index === 0;
    find('[data-reader-action="next"]').disabled = !supported || snapshot.index >= snapshot.count - 1;
    highlight(!panel.hidden && ['playing', 'starting', 'paused'].includes(snapshot.status));
    doc.querySelectorAll('.reader-trigger').forEach(button => {
      const active = button === activeTrigger && !panel.hidden;
      button.setAttribute('aria-pressed', String(active));
    });
  }
  function refreshVoices() {
    if (!supported) return;
    voices = win.speechSynthesis.getVoices();
    const select = find('.reader-voice');
    select.replaceChildren();
    const option = (value, label) => { const el = doc.createElement('option'); el.value = value; el.textContent = label; select.append(el); };
    option('', 'Device default');
    voices.forEach((voice, i) => option(String(i), `${voice.name} · ${voice.lang}${voice.localService ? '' : ' · online'}`));
    const chosen = prefs.voice === '' ? null : prefs.voice ? voices.find(voice => voice.voiceURI === prefs.voice) : voices.find(voice => voice.lang === 'en-AU' && voice.localService) || voices.find(voice => voice.lang === 'en-AU');
    select.value = chosen ? String(voices.indexOf(chosen)) : '';
    engine.voice = chosen || null;
    const quick = find('.reader-quick-voices');
    quick.replaceChildren();
    for (const [lang, label] of [['en-AU', 'Australian'], ['en-GB', 'British'], ['en-US', 'American']]) {
      const voice = voices.find(v => v.lang === lang && v.localService) || voices.find(v => v.lang === lang);
      if (!voice) continue;
      const button = doc.createElement('button');
      button.type = 'button'; button.dataset.voiceIndex = String(voices.indexOf(voice)); button.textContent = label;
      button.setAttribute('aria-label', `${label} voice: ${voice.name}`);
      button.setAttribute('aria-pressed', String(voice === engine.voice));
      quick.append(button);
    }
  }
  function changeOptions() {
    notice = '';
    const selected = find('.reader-voice').value;
    const voice = selected === '' ? null : voices[Number(selected)];
    const rate = Number(find('.reader-rate').value);
    prefs.rate = rate; prefs.voice = voice?.voiceURI || '';
    savePrefs();
    engine.options(rate, voice);
    panel.querySelectorAll('[data-voice-index]').forEach(button => button.setAttribute('aria-pressed', String(voices[Number(button.dataset.voiceIndex)] === voice)));
  }
  function mount(block) {
    const modal = block.closest('dialog');
    const destination = modal?.open ? modal : doc.body;
    if (panel.parentNode !== destination) {
      if (destination === modal) modal.querySelector('.dialog-head').after(panel);
      else destination.append(panel);
    }
    panel.dataset.inDialog = String(destination === modal);
    panel.style.setProperty('--accent', win.getComputedStyle(block).getPropertyValue('--accent').trim() || '#c5f486');
    panel.hidden = false;
  }
  function listen(block, trigger, title) {
    const text = readingText(block);
    if (!text) return;
    const same = activeBlock === block && activeText === text && !panel.hidden;
    activeBlock = block; activeTrigger = trigger; activeText = text; notice = '';
    mount(block);
    find('.reader-title').textContent = title;
    if (!same) engine.setText(text);
    if (['playing', 'starting'].includes(engine.status)) engine.pause(); else engine.play();
    update();
    (supported ? find('[data-reader-action="play"]') : find('[data-reader-action="close"]')).focus({ preventScroll: true });
  }
  function dismiss({ returnFocus = false } = {}) {
    const trigger = activeTrigger;
    panel.hidden = true;
    engine.stop();
    activeBlock = null; activeTrigger = null; activeText = ''; notice = '';
    panel.remove();
    if (returnFocus && trigger?.isConnected) trigger.focus({ preventScroll: true });
  }
  function addTrigger(block, all = false) {
    if (block.querySelector(':scope > .reader-trigger')) return;
    if (!readingText(block)) return;
    const button = doc.createElement('button');
    button.type = 'button'; button.className = `reader-trigger${all ? ' reader-all' : ''}`;
    button.dataset.readerUi = ''; button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `<span aria-hidden="true">▷</span> ${all ? 'LISTEN TO ALL' : 'LISTEN'}`;
    const title = all ? doc.querySelector('#dialog-title')?.textContent || 'Information' : readingText(block).slice(0, 85);
    button.setAttribute('aria-label', `${all ? 'Listen to all information in this overlay' : 'Listen: ' + title}`);
    button.addEventListener('click', () => listen(block, button, all ? title : doc.title.replace(' — AFTERWORLD', '')));
    if (all) block.prepend(button); else block.append(button);
  }
  function enhance(root = doc.querySelector('#app')) {
    if (!root) return;
    if (activeBlock && !activeBlock.isConnected) dismiss();
    for (const block of root.querySelectorAll(BLOCKS)) {
      if (block.closest(EXCLUDE)) continue;
      if (block.closest('.brief-summary') && !block.matches('.brief-summary')) continue;
      if (block.parentElement?.closest('.legend, .publisher-outlook')) continue;
      addTrigger(block);
    }
    const body = root.matches('#dialog-body') ? root : root.querySelector('#dialog-body');
    if (body && body.children.length) addTrigger(body, true);
  }
  panel.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.voiceIndex !== undefined) { find('.reader-voice').value = button.dataset.voiceIndex; changeOptions(); return; }
    notice = '';
    switch (button.dataset.readerAction) {
      case 'play': ['playing', 'starting'].includes(engine.status) ? engine.pause() : engine.play(); break;
      case 'back': engine.move(-1); break;
      case 'next': engine.move(1); break;
      case 'stop': engine.stop(); break;
      case 'close': dismiss({ returnFocus: true }); break;
      case 'voices': refreshVoices(); break;
      case 'size': setSize(!prefs.large); savePrefs(); break;
    }
  });
  panel.addEventListener('change', event => { if (event.target.matches('.reader-voice, .reader-rate')) changeOptions(); });
  doc.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden && panel.dataset.inDialog !== 'true') { event.preventDefault(); dismiss({ returnFocus: true }); }
  });
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && ['playing', 'starting'].includes(engine.status)) {
      notice = 'Paused while the page is hidden. Tap Resume when you return.';
      engine.pause();
    }
  });
  win.addEventListener('pagehide', () => dismiss());
  win.speechSynthesis?.addEventListener('voiceschanged', refreshVoices);
  refreshVoices();
  return { enhance, dismiss };
}
