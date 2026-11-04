/* SPLA · site v0 · JS puro, sem dependências. */
(() => {
'use strict';
const d = document, root = d.documentElement;
root.classList.add('js');
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => RM.matches;
const BASE = root.dataset.root || './';
const T = window.SPLA_I18N || {};
const $ = (s, el = d) => el.querySelector(s), $$ = (s, el = d) => [...el.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- header ---------- */
const top = $('.top');
const onScroll = () => top && top.classList.toggle('is-scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
const burger = $('.burger'), drawer = $('#drawer');
if (burger && drawer) {
  const set = open => { burger.setAttribute('aria-expanded', open); drawer.classList.toggle('is-open', open); d.body.style.overflow = open ? 'hidden' : ''; if (open) $('a', drawer)?.focus(); };
  burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
  d.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) { set(false); burger.focus(); } });
  matchMedia('(min-width:1080px)').addEventListener('change', e => e.matches && set(false));
}

/* ---------- revelar ao rolar ---------- */
if ('IntersectionObserver' in window && !reduced()) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => io.observe(el));
} else $$('.reveal').forEach(el => el.classList.add('in'));

/* ---------- piso que reage ao ponteiro ---------- */
$$('.hero').forEach(h => {
  let raf = 0;
  h.addEventListener('pointermove', e => {
    if (reduced() || e.pointerType === 'touch') return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { const r = h.getBoundingClientRect(); h.style.setProperty('--mx', (e.clientX - r.left) + 'px'); h.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });
});

/* ---------- rig dos personagens (olhos, piscar, boca) ---------- */
const SKIN = { sophia: '#C46203', erick: '#C06006', lili: '#D98020' };
const LABEL = T.rigLabel || { sophia: 'Ilustração da Sophia', erick: 'Ilustração do Erick', lili: 'Ilustração da Teacher Lili' };
const svgCache = {};
const pointer = { x: innerWidth / 2, y: innerHeight / 3, t: 0 };
addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = performance.now(); }, { passive: true });
const rigs = [];
let uid = 0;

async function mountRig(host) {
  const name = host.dataset.rig; if (!name) return null;
  try {
    svgCache[name] = svgCache[name] || fetch(BASE + 'assets/svg/' + name + '.svg').then(r => { if (!r.ok) throw new Error(r.status); return r.text(); });
    let txt = await svgCache[name];
    const p = 'r' + (++uid) + '-';
    txt = txt.replace(/\sid="([^"]+)"/g, ` id="${p}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${p}$1)`).replace(/href="#([^"]+)"/g, `href="#${p}$1"`);
    const wrap = d.createElement('div'); wrap.innerHTML = txt;
    const svg = wrap.firstElementChild;
    svg.classList.add('rig'); svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', host.dataset.label || LABEL[name] || name);
    $$('[aria-label]', svg).forEach(el => el !== svg && el.removeAttribute('aria-label'));
    $$('title,desc', svg).forEach(el => el.remove());
    const g = id => svg.querySelector('#' + CSS.escape(p + id));
    g('background')?.remove();
    const NS = 'http://www.w3.org/2000/svg';
    // swap image fallback for live svg
    const img = $('img', host);
    host.appendChild(svg); if (img) img.remove();
    // mouths
    const MV = g('mouth_variants'); MV?.removeAttribute('display');
    const mouths = {};
    ['sil','MBP','AA','EE','OO','UU','FV','L_TH_D','smile_closed','smile_open','surprise_o'].forEach(k => { const m = g('variant_' + k); if (m) { mouths[k] = m; m.setAttribute('display', 'none'); } });
    g('mouth')?.setAttribute('display', 'none');
    let cur = 'sil'; mouths.sil?.setAttribute('display', 'inline');
    const rest = host.dataset.rest && mouths[host.dataset.rest] ? host.dataset.rest : 'sil';
    const setMouth = k => { if (!mouths[k]) k = 'sil'; if (k === cur) return; mouths[cur]?.setAttribute('display', 'none'); mouths[k].setAttribute('display', 'inline'); cur = k; };
    setMouth(rest);
    // lids
    const lids = [];
    ['L', 'R'].forEach(s => {
      const w = g('eye_white_' + s), clip = g('eye_clip_' + s); if (!w || !clip) return;
      const bb = w.getBBox(); const x = bb.x - 3, y = bb.y - 3, W = bb.width + 6, H = bb.height + 6;
      const grp = d.createElementNS(NS, 'g'); grp.setAttribute('clip-path', `url(#${p}eye_clip_${s})`);
      const r = d.createElementNS(NS, 'rect'); Object.entries({ x, y, width: W, height: H, fill: SKIN[name] || '#C46203' }).forEach(([k, v]) => r.setAttribute(k, v));
      r.setAttribute('transform', `translate(0 ${y}) scale(1 0) translate(0 ${-y})`);
      grp.appendChild(r);
      const lu = g('lid_upper_' + s), hostEye = g('eye_' + s) || w.parentNode;
      if (lu && lu.parentNode === hostEye) hostEye.insertBefore(grp, lu); else hostEye.appendChild(grp);
      lids.push({ r, y, H, lu });
    });
    const setLid = v => lids.forEach(l => { l.r.setAttribute('transform', `translate(0 ${l.y}) scale(1 ${v}) translate(0 ${-l.y})`); l.lu?.setAttribute('transform', `translate(0 ${(l.H - 6) * .78 * v})`); });
    // pupils: wrap children so the clip-path stays put
    const pupils = ['iris_L', 'pupil_L', 'iris_R', 'pupil_R'].map(g).filter(Boolean).map(el => {
      const inner = d.createElementNS(NS, 'g'); while (el.firstChild) inner.appendChild(el.firstChild); el.appendChild(inner); return inner;
    });
    const brows = ['brow_L', 'brow_R'].map(g).filter(Boolean);
    const rig = { name, host, svg, setMouth, mouths, rest, gaze: { x: 0, y: 0 }, tgt: { x: 0, y: 0 }, lid: 0, blinkAt: performance.now() + 1200 + Math.random() * 2500, speaking: false, happy: false };
    rig.setGaze = (x, y) => { pupils.forEach(el => el.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`)); };
    rig.setBrow = v => brows.forEach(b => b.setAttribute('transform', `translate(0 ${-v})`));
    rig.setLid = setLid;
    rig.blink = async () => { if (reduced()) return; for (const v of [.5, 1, 1, .6, .2, 0]) { setLid(v); await wait(32); } };
    // hover reaction: smile + brows
    const card = host.closest('[data-hover]') || host;
    card.addEventListener('pointerenter', () => { rig.happy = true; if (!rig.speaking) setMouth(mouths.smile_open ? 'smile_open' : 'smile_closed'); rig.setBrow(2.2); });
    card.addEventListener('pointerleave', () => { rig.happy = false; if (!rig.speaking) setMouth(rig.rest); rig.setBrow(0); });
    rig.say = (text, msPerChar = 55) => speak(rig, text, msPerChar);
    rigs.push(rig);
    host.classList.add('is-live');
    return rig;
  } catch (err) { console.warn('rig', name, err); return null; }
}

const VIS = ch => {
  ch = ch.toLowerCase();
  if ('aáàâã'.includes(ch)) return 'AA';
  if ('eéêiíy'.includes(ch)) return 'EE';
  if ('oóôõ'.includes(ch)) return 'OO';
  if ('uúw'.includes(ch)) return 'UU';
  if ('mbp'.includes(ch)) return 'MBP';
  if ('fv'.includes(ch)) return 'FV';
  if ('ltdnrszcç'.includes(ch)) return 'L_TH_D';
  if (/[a-z]/.test(ch)) return 'EE';
  return 'sil';
};
async function speak(rig, text, ms) {
  if (!rig || reduced()) return;
  rig.speaking = true; const token = rig.token = {};
  for (const ch of text) { if (rig.token !== token) return; rig.setMouth(VIS(ch)); await wait(/[ ,.;:!?]/.test(ch) ? ms * 1.6 : ms); }
  if (rig.token === token) { rig.speaking = false; rig.setMouth(rig.happy ? 'smile_closed' : rig.rest); }
}
const stopSpeak = rig => { if (rig) { rig.token = {}; rig.speaking = false; rig.setMouth(rig.rest); } };

/* loop: olhar segue o ponteiro, piscadas naturais */
function tick(now) {
  for (const r of rigs) {
    if (!r.host.isConnected) continue;
    const b = r.host.getBoundingClientRect();
    if (b.bottom < 0 || b.top > innerHeight) continue;
    if (!reduced()) {
      const cx = b.left + b.width / 2, cy = b.top + b.height * .32;
      const idle = now - pointer.t > 4000;
      let dx = idle ? Math.sin(now / 1900 + r.host.offsetLeft) * .5 : (pointer.x - cx), dy = idle ? 0 : (pointer.y - cy);
      const dist = Math.hypot(dx, dy) || 1, k = Math.min(1, dist / 260);
      r.tgt.x = idle ? dx * 2.6 : dx / dist * 3.4 * k; r.tgt.y = idle ? 0 : dy / dist * 2.2 * k;
      r.gaze.x += (r.tgt.x - r.gaze.x) * .14; r.gaze.y += (r.tgt.y - r.gaze.y) * .14;
      r.setGaze(r.gaze.x, r.gaze.y);
      if (now > r.blinkAt) { r.blink(); r.blinkAt = now + 2600 + Math.random() * 3600; }
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

const lazyRigs = $$('[data-rig]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); if (!e.target.dataset.manual) mountRig(e.target); } }), { rootMargin: '200px' });
  lazyRigs.forEach(h => io.observe(h));
} else lazyRigs.forEach(h => !h.dataset.manual && mountRig(h));

/* ---------- transcrição animada da home ---------- */
const stage = $('[data-stage]');
if (stage) (async () => {
  const scenes = window.SPLA_SCENES || [];
  if (!scenes.length) return;
  const host = $('[data-rig]', stage); host.dataset.manual = '1';
  const rig = await mountRig(host);
  const tag = $('[data-tag]', stage), pt = $('[data-pt]', stage), en = $('[data-en]', stage), hint = $('[data-hint]', stage);
  const dots = $('.dots', stage), pauseBtn = $('[data-pause]', stage);
  let i = 0, paused = reduced(), run = 0;
  scenes.forEach((s, n) => { const b = d.createElement('button'); b.type = 'button'; b.textContent = s.tag; b.setAttribute('aria-pressed', n === 0); b.addEventListener('click', () => { i = n; play(true); }); dots.appendChild(b); });
  const setPause = v => { paused = v; pauseBtn.setAttribute('aria-pressed', v); pauseBtn.setAttribute('aria-label', v ? (T.play || 'Continuar animação') : (T.pause || 'Pausar animação')); pauseBtn.innerHTML = v ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" fill="currentColor"/></svg>' : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4h3v12H5zM12 4h3v12h-3z" fill="currentColor"/></svg>'; if (!v) play(); };
  pauseBtn.addEventListener('click', () => setPause(!paused));
  async function play(manual) {
    const my = ++run; const s = scenes[i];
    $$('button', dots).forEach((b, n) => b.setAttribute('aria-pressed', n === i));
    tag.textContent = s.area; pt.textContent = s.pt; hint.classList.remove('on');
    hint.innerHTML = `<b>${T.hint || 'Dica da Sophia'}:</b> <span>${s.hint}</span>`;
    const words = s.en.split(' ');
    en.innerHTML = words.map(w => `<span class="w${s.keys.some(k => w.toLowerCase().replace(/[^a-z'-]/g, '').startsWith(k)) ? ' key' : ''}">${w}</span>`).join(' ');
    const ws = $$('.w', en);
    if (reduced()) { ws.forEach(w => w.classList.add('on')); hint.classList.add('on'); return; }
    stopSpeak(rig); await wait(manual ? 150 : 650); if (my !== run) return;
    for (const w of ws) {
      if (my !== run) return;
      w.classList.add('on');
      if (rig) speak(rig, w.textContent + ' ', 48);
      await wait(Math.max(260, w.textContent.length * 62));
    }
    stopSpeak(rig); rig?.setMouth('smile_closed');
    await wait(500); if (my !== run) return; hint.classList.add('on');
    await wait(4200); if (my !== run || paused) return;
    rig?.setMouth(rig.rest);
    i = (i + 1) % scenes.length; play();
  }
  setPause(paused); if (paused) play();
  d.addEventListener('visibilitychange', () => { if (d.hidden) run++; else if (!paused) play(); });
})();

/* ---------- cartões de jargão ---------- */
$$('.jcard button').forEach(b => b.addEventListener('click', () => { const c = b.closest('.jcard'); const on = c.classList.toggle('is-flipped'); b.setAttribute('aria-expanded', on); }));

/* ---------- diagnóstico rápido ---------- */
const diag = $('[data-diag]');
if (diag) {
  const out = $('[data-diag-out]', diag), wa = $('[data-wa]', diag), mail = $('[data-mail]', diag), txt = $('[data-diag-text]', diag);
  const upd = () => {
    const v = n => $(`input[name="${n}"]:checked`, diag)?.value;
    const who = v('quem'), area = v('area'), goal = v('meta'), lvl = v('nivel');
    const parts = [T.diagHello || 'Oi, SPLA! Quero saber mais.'];
    if (who) parts.push((T.diagWho || 'Sou') + ' ' + who + '.');
    if (area) parts.push((T.diagArea || 'Minha área:') + ' ' + area + '.');
    if (goal) parts.push((T.diagGoal || 'Meu objetivo:') + ' ' + goal + '.');
    if (lvl) parts.push((T.diagLvl || 'Meu inglês hoje:') + ' ' + lvl + '.');
    const msg = parts.join(' ');
    txt.textContent = msg;
    wa.href = 'https://wa.me/5511981783554?text=' + encodeURIComponent(msg);
    mail.href = 'mailto:contact@splacademy.com.br?subject=' + encodeURIComponent(T.diagSubject || 'Quero saber mais sobre a SPLA') + '&body=' + encodeURIComponent(msg);
    out.hidden = false;
  };
  diag.addEventListener('change', upd); upd();
}

/* ---------- Pergunte à Sophia (roteirizado, sem IA externa) ---------- */
const FAQ = (window.SPLA_FAQ || []).map(f => ({ ...f, a: f.a.split('{{root}}').join(BASE) }));
const fab = $('.sophia-fab'), panel = $('#sophia');
if (fab && panel && FAQ.length) {
  const log = $('.sp__log', panel), chips = $('.sp__chips', panel), form = $('.sp__form', panel), input = $('input', form);
  const face = $('[data-rig]', panel); face.dataset.manual = '1';
  let rig = null, greeted = false;
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ');
  const STOP = new Set('a o e de da do das dos que como um uma para pra com no na nos nas em eu voce vcs voces se ser e é the is do to of and meu minha tem ter qual quais quanto'.split(' '));
  const add = (html, who) => { const m = d.createElement('div'); m.className = 'msg msg--' + who; m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight; return m; };
  async function answer(item) {
    const t = d.createElement('div'); t.className = 'msg msg--s typing'; t.innerHTML = '<i></i><i></i><i></i>'; t.setAttribute('aria-hidden', 'true'); log.appendChild(t); log.scrollTop = log.scrollHeight;
    await wait(reduced() ? 0 : 520); t.remove();
    const m = add('', 's');
    const plain = item.a.replace(/<[^>]+>/g, '');
    if (rig) speak(rig, plain.slice(0, 160), 34);
    if (reduced()) { m.innerHTML = item.a; }
    else { // escreve como legenda
      const tmp = d.createElement('div'); tmp.innerHTML = item.a; const full = item.a;
      const text = tmp.textContent; let n = 0;
      await new Promise(res => { const step = () => { n += 3; m.textContent = text.slice(0, n); log.scrollTop = log.scrollHeight; if (n < text.length) setTimeout(step, 14); else { m.innerHTML = full; res(); } }; step(); });
    }
    log.scrollTop = log.scrollHeight;
    renderChips(item.next);
  }
  function match(q) {
    const words = norm(q).split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
    let best = null, score = 0;
    for (const it of FAQ) {
      let s = 0; const hay = norm(it.q + ' ' + (it.k || []).join(' '));
      for (const w of words) { if ((it.k || []).some(k => norm(k).split(' ').includes(w) || w.startsWith(norm(k)))) s += 3; else if (hay.includes(w)) s += 1; }
      if (s > score) { score = s; best = it; }
    }
    return score >= 2 ? best : null;
  }
  function renderChips(ids) {
    chips.innerHTML = '';
    const list = (ids && ids.length ? ids.map(id => FAQ.find(f => f.id === id)).filter(Boolean) : FAQ.filter(f => f.chip)).slice(0, 4);
    list.forEach(it => { const b = d.createElement('button'); b.type = 'button'; b.textContent = it.q; b.addEventListener('click', () => { add(esc(it.q), 'u'); answer(it); }); chips.appendChild(b); });
  }
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const open = async v => {
    fab.setAttribute('aria-expanded', v); panel.classList.toggle('is-open', v); panel.setAttribute('aria-hidden', !v);
    if (v) {
      if (!rig) rig = await mountRig(face);
      if (!greeted) { greeted = true; answer({ a: T.spHello || 'Oi! Eu sou a Sophia.', next: [] }); }
      setTimeout(() => input.focus(), 60);
    } else fab.focus();
  };
  fab.addEventListener('click', () => open(true));
  $('.sp__close', panel).addEventListener('click', () => open(false));
  d.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('is-open')) open(false); });
  form.addEventListener('submit', e => {
    e.preventDefault(); const q = input.value.trim(); if (!q) return; input.value = '';
    add(esc(q), 'u'); const it = match(q);
    answer(it || { a: (T.spFallback || '').split('{{root}}').join(BASE), next: [] });
  });
  $$('[data-open-sophia]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); open(true); }));
}
})();
