/* SPLA · site v1 · JS próprio + GSAP/ScrollTrigger/Lenis carregados sob demanda (só quando há movimento permitido). */
(() => {
'use strict';
const d = document, root = d.documentElement;
root.classList.add('js');
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => RM.matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const SAVE = !!(navigator.connection && navigator.connection.saveData);
const BASE = root.dataset.root || './';
const T = window.SPLA_I18N || {};
const $ = (s, el = d) => el.querySelector(s), $$ = (s, el = d) => [...el.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const idle = fn => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 900));
const onView = (el, cb, opts = {}) => {
  if (!('IntersectionObserver' in window)) { cb(true); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { cb(e.isIntersecting, e); if (e.isIntersecting && opts.once) io.disconnect(); }), { rootMargin: opts.margin || '0px', threshold: opts.threshold || 0 });
  io.observe(el); return io;
};
const ICON_PAUSE = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4h3v12H5zM12 4h3v12h-3z" fill="currentColor"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" fill="currentColor"/></svg>';
const MEDIA = BASE + 'assets/media/';
const VEXT = (() => { const v = d.createElement('video'); return v.canPlayType('video/webm; codecs="vp9"') ? '.webm' : (v.canPlayType('video/mp4') ? '.mp4' : ''); })();
const canVideo = () => !!VEXT && !reduced() && !SAVE;

/* ---------- ponteiro global ---------- */
const P = { x: innerWidth / 2, y: innerHeight / 3, t: 0, fine: FINE };
addEventListener('pointermove', e => { P.x = e.clientX; P.y = e.clientY; P.t = performance.now(); }, { passive: true });

/* ---------- header, progresso, rolagem ---------- */
const top = $('.top'), prog = $('.progress i');
let lastY = scrollY, vel = 0, ticking = false;
function onScroll() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const y = scrollY, max = (d.scrollingElement || root).scrollHeight - innerHeight;
    vel = y - lastY;
    if (top) {
      top.classList.toggle('is-scrolled', y > 8);
      const open = d.body.classList.contains('drawer-open') || top.contains(d.activeElement);
      if (!open && vel > 6 && y > 520) top.classList.add('is-hidden');
      else if (vel < -6 || y < 200 || open) top.classList.remove('is-hidden');
    }
    if (prog) prog.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    lastY = y;
    pinned.forEach(f => f());
  });
}
const pinned = [];
addEventListener('scroll', onScroll, { passive: true });

/* ---------- menu ---------- */
const burger = $('.burger'), drawer = $('#drawer');
let lenis = null;
if (burger && drawer) {
  const set = open => {
    burger.setAttribute('aria-expanded', open); drawer.classList.toggle('is-open', open);
    d.body.style.overflow = open ? 'hidden' : ''; d.body.classList.toggle('drawer-open', open);
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) { top?.classList.remove('is-hidden'); $('a', drawer)?.focus(); }
  };
  burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
  d.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) { set(false); burger.focus(); } });
  matchMedia('(min-width:1080px)').addEventListener('change', e => e.matches && set(false));
}

/* ---------- títulos cinéticos: palavra por palavra ---------- */
function splitWords(el) {
  let i = 0;
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/); const frag = d.createDocumentFragment();
        parts.forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
          const kw = d.createElement('span'); kw.className = 'kw';
          const s = d.createElement('span'); s.style.setProperty('--i', i++); s.textContent = p;
          kw.appendChild(s); frag.appendChild(kw);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('kw')) walk(n);
    });
  };
  walk(el);
}
$$('[data-kinetic]').forEach(h => {
  if (!h.getAttribute('aria-label')) h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  splitWords(h); $$('.kw', h).forEach(k => k.setAttribute('aria-hidden', 'true'));
  if (reduced()) { h.classList.add('is-in'); return; }
  onView(h, v => v && h.classList.add('is-in'), { once: true, margin: '0px 0px -10% 0px' });
});

/* ---------- revelar ao rolar ---------- */
if ('IntersectionObserver' in window && !reduced()) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => io.observe(el));
} else $$('.reveal').forEach(el => el.classList.add('in'));

/* ---------- holofote do piso (hero/cta) ---------- */
$$('[data-spot]').forEach(h => {
  let raf = 0;
  h.addEventListener('pointermove', e => {
    if (reduced()) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { const r = h.getBoundingClientRect(); h.style.setProperty('--mx', (e.clientX - r.left) + 'px'); h.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });
});
$$('[data-glow]').forEach(s => {
  const g = $('.glow', s); if (!g) return;
  s.addEventListener('pointermove', e => { if (reduced()) return; const r = s.getBoundingClientRect(); g.style.setProperty('--gx', (e.clientX - r.left) + 'px'); g.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
});

/* ---------- cursor próprio ---------- */
if (FINE && !reduced()) {
  const c = d.createElement('div'); c.className = 'cursor'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<span></span>';
  const dot = d.createElement('div'); dot.className = 'cursor-dot'; dot.setAttribute('aria-hidden', 'true');
  d.body.append(c, dot);
  const lab = $('span', c);
  let cx = P.x, cy = P.y, shown = false;
  const loop = () => {
    cx = lerp(cx, P.x, .2); cy = lerp(cy, P.y, .2);
    c.style.transform = `translate3d(${cx}px,${cy}px,0)`; dot.style.transform = `translate3d(${P.x}px,${P.y}px,0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  d.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    if (!shown) { shown = true; root.classList.add('has-cursor'); }
    const t = e.target.closest ? e.target : null; if (!t) return;
    const labelEl = t.closest('[data-cursor-label]');
    const field = t.closest('input,textarea,select,.sp,iframe');
    c.classList.toggle('is-hidden', !!field); dot.classList.toggle('is-hidden', !!field);
    if (labelEl) { c.classList.add('is-label'); c.classList.remove('is-link'); lab.textContent = labelEl.dataset.cursorLabel; }
    else { c.classList.remove('is-label'); c.classList.toggle('is-link', !!t.closest('a,button,label,[role="button"],summary')); }
  }, { passive: true });
  d.addEventListener('pointerdown', () => c.classList.add('is-down'));
  d.addEventListener('pointerup', () => c.classList.remove('is-down'));
  d.documentElement.addEventListener('pointerleave', () => root.classList.remove('has-cursor'));
  d.documentElement.addEventListener('pointerenter', () => shown && root.classList.add('has-cursor'));
}

/* ---------- botões magnéticos ---------- */
if (FINE) $$('[data-magnetic]').forEach(b => {
  let raf = 0;
  b.addEventListener('pointermove', e => {
    if (reduced()) return;
    const r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { b.style.transform = `translate(${x * .28}px,${y * .38}px)`; });
  });
  b.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); b.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)'; b.style.transform = ''; setTimeout(() => (b.style.transition = ''), 600); });
});

/* ---------- inclinação 3D + brilho ---------- */
$$('[data-tilt]').forEach(el => {
  if (!FINE) return;
  const max = +el.dataset.tiltMax || 6;
  const glare = d.createElement('span'); glare.className = 'glare'; glare.setAttribute('aria-hidden', 'true'); el.appendChild(glare);
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  let raf = 0;
  el.addEventListener('pointermove', e => {
    if (reduced()) return;
    const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${(.5 - py) * max}deg) rotateY(${(px - .5) * max}deg)`;
      el.style.setProperty('--gx', px * 100 + '%'); el.style.setProperty('--gy', py * 100 + '%');
    });
  });
  el.addEventListener('pointerenter', () => { el.style.transition = 'transform .15s'; });
  el.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); el.style.transition = 'transform .7s cubic-bezier(.16,1,.3,1)'; el.style.transform = ''; });
});

/* ---------- profundidade dos chips do hero ---------- */
const depth = $$('[data-depth]');
if (depth.length && FINE) {
  let raf = 0;
  addEventListener('pointermove', () => {
    if (reduced()) return; cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { const nx = P.x / innerWidth - .5, ny = P.y / innerHeight - .5; depth.forEach(el => { const k = +el.dataset.depth; el.style.translate = `${nx * k}px ${ny * k}px`; }); });
  }, { passive: true });
}

/* ---------- marquee com velocidade da rolagem ---------- */
$$('[data-marquee]').forEach(m => {
  const tr = $('.marquee__track', m); if (!tr || !tr.getAnimations) return;
  let rate = 1, vis = false;
  onView(m, v => (vis = v));
  const loop = () => {
    if (vis && !reduced()) {
      const a = tr.getAnimations()[0];
      if (a) { const target = 1 + clamp(Math.abs(vel) / 12, 0, 5); rate = lerp(rate, target, .08); a.playbackRate = rate; }
    }
    vel *= .9; requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});

/* ---------- contadores ---------- */
$$('[data-count]').forEach(el => {
  const n = +el.dataset.count, suf = el.dataset.suffix || '';
  if (reduced()) return;
  el.textContent = '0' + suf;
  onView(el, v => {
    if (!v) return;
    const t0 = performance.now(), dur = 1500;
    const step = now => { const k = clamp((now - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(n * e) + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, { once: true, threshold: .6 });
});

/* ---------- máscara sob o ponteiro (lente PT→EN e piso) ---------- */
function maskArea(area, vx, vy, opts = {}) {
  let last = 0, vis = false, sweepT = Math.random() * 10;
  const set = (x, y) => { area.style.setProperty(vx, x + 'px'); area.style.setProperty(vy, y + 'px'); };
  const move = e => { const r = area.getBoundingClientRect(); set(e.clientX - r.left, e.clientY - r.top); last = performance.now(); };
  area.addEventListener('pointermove', move);
  area.addEventListener('pointerdown', move);
  onView(area, v => (vis = v));
  const loop = now => {
    if (vis && now - last > 2200 && !opts.stopped?.()) {
      if (reduced()) { const r = area.getBoundingClientRect(); set(r.width * .5, r.height * .5); }
      else { sweepT += .012; const r = area.getBoundingClientRect(); set(r.width * (.5 + .38 * Math.sin(sweepT)), r.height * (.5 + .3 * Math.sin(sweepT * 1.7))); }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
$$('[data-lens]').forEach(l => {
  const stack = $('.lens__stack', l), btn = $('[data-lens-all]', l), hint = $('[data-lens-hint]', l);
  if (!FINE && hint) hint.textContent = 'Toque e arraste: o português vira inglês';
  stack.dataset.cursorLabel = 'EN';
  maskArea(stack, '--lx', '--ly', { stopped: () => l.classList.contains('is-all') });
  btn?.addEventListener('click', () => { const on = l.classList.toggle('is-all'); btn.setAttribute('aria-pressed', on); btn.textContent = on ? 'Voltar ao português' : 'Ver tudo em inglês'; });
});
$$('[data-tile-reveal]').forEach(t => {
  const hint = $('[data-tile-hint]', t); if (!FINE && hint) hint.textContent = 'Toque e arraste para revelar o piso';
  t.dataset.cursorLabel = 'Piso';
  maskArea(t, '--tx', '--ty');
});

/* ---------- vídeos sob demanda ---------- */
const vsrc = name => MEDIA + name + VEXT;
function loadVid(v) { if (!v.dataset.loaded && v.dataset.lazyVideo) { v.src = vsrc(v.dataset.lazyVideo); v.dataset.loaded = '1'; } }
$$('video[data-lazy-video]').forEach(v => {
  if (!canVideo()) { v.remove(); return; }
  const hover = v.hasAttribute('data-hover-video') && FINE;
  const host = v.closest('.who-card,.tile') || v.parentNode;
  const on = () => { loadVid(v); v.play().then(() => v.classList.add('is-on')).catch(() => {}); };
  const off = () => { v.pause(); v.classList.remove('is-on'); };
  if (hover) { host.addEventListener('pointerenter', on); host.addEventListener('pointerleave', off); }
  else onView(v, vis => vis ? on() : off(), { threshold: .55 });
});

/* ---------- carrosséis com arraste, inércia e autoplay ---------- */
$$('[data-carousel]').forEach(car => {
  const track = $('.car__track', car), items = [...track.children];
  const prev = $('[data-car-prev]', car), next = $('[data-car-next]', car), pbtn = $('[data-car-pause]', car);
  const bar = $('.car__bar i', car), count = $('[data-car-count]', car);
  const every = +car.dataset.autoplay || 0;
  let userPaused = reduced(), hover = false, focus = false, vis = false, holdUntil = 0, timer = 0;
  track.dataset.cursorLabel = 'Arraste';
  items.forEach((it, i) => { if (it.tagName !== 'A') it.setAttribute('aria-label', `${i + 1} de ${items.length}`); });
  const off = i => items[i].offsetLeft - items[0].offsetLeft;
  const idx = () => { const x = track.scrollLeft; let best = 0, bd = 1e9; items.forEach((it, i) => { const dd = Math.abs(off(i) - x); if (dd < bd) { bd = dd; best = i; } }); return best; };
  const atEnd = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  const go = i => { i = (i + items.length) % items.length; track.scrollTo({ left: off(i), behavior: reduced() ? 'auto' : 'smooth' }); };
  const ui = () => {
    const max = track.scrollWidth - track.clientWidth;
    const k = max > 0 ? track.scrollLeft / max : 1;
    bar?.style.setProperty('--cp', (.12 + .88 * k).toFixed(3));
    if (count) { const i = atEnd() ? items.length - 1 : idx(); count.textContent = String(i + 1).padStart(2, '0') + '/' + String(items.length).padStart(2, '0'); }
  };
  track.addEventListener('scroll', () => requestAnimationFrame(ui), { passive: true }); ui();
  const step = dir => { if (dir > 0 && atEnd()) go(0); else go(idx() + dir); };
  prev?.addEventListener('click', () => { holdUntil = performance.now() + 9000; step(-1); });
  next?.addEventListener('click', () => { holdUntil = performance.now() + 9000; step(1); });
  track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); step(1); holdUntil = performance.now() + 9000; } if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); holdUntil = performance.now() + 9000; } });
  // arraste com mouse e inércia (no toque, a rolagem nativa já tem inércia)
  let down = false, sx = 0, sl = 0, lx = 0, lt = 0, v = 0, moved = false, raf = 0;
  track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = false; sx = lx = e.clientX; sl = track.scrollLeft; lt = performance.now(); v = 0; cancelAnimationFrame(raf); });
  addEventListener('pointermove', e => {
    if (!down) return; const dx = e.clientX - sx;
    if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('is-drag'); }
    if (!moved) return;
    const now = performance.now(); v = (e.clientX - lx) / Math.max(1, now - lt); lx = e.clientX; lt = now;
    track.scrollLeft = sl - dx;
  });
  addEventListener('pointerup', () => {
    if (!down) return; down = false; holdUntil = performance.now() + 9000;
    if (!moved) return;
    let vv = -v * 16;
    const glide = () => { track.scrollLeft += vv; vv *= .93; if (Math.abs(vv) > .6) raf = requestAnimationFrame(glide); else { track.classList.remove('is-drag'); go(idx()); } };
    if (reduced()) { track.classList.remove('is-drag'); go(idx()); } else raf = requestAnimationFrame(glide);
  });
  track.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  track.addEventListener('dragstart', e => e.preventDefault());
  car.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
  car.addEventListener('pointerleave', () => (hover = false));
  car.addEventListener('focusin', () => (focus = true));
  car.addEventListener('focusout', () => (focus = false));
  track.addEventListener('touchstart', () => (holdUntil = performance.now() + 9000), { passive: true });
  onView(car, x => (vis = x), { threshold: .35 });
  const setP = p => { userPaused = p; if (!pbtn) return; pbtn.setAttribute('aria-pressed', p); pbtn.setAttribute('aria-label', p ? (T.playCar || 'Continuar carrossel') : (T.pauseCar || 'Pausar carrossel')); pbtn.innerHTML = p ? ICON_PLAY : ICON_PAUSE; };
  if (pbtn) { if (!every) pbtn.remove(); else { setP(userPaused); pbtn.addEventListener('click', () => setP(!userPaused)); } }
  if (every) timer = setInterval(() => { if (userPaused || hover || focus || !vis || down || d.hidden || performance.now() < holdUntil) return; step(1); }, every);
});

/* ---------- passos em rolagem horizontal fixada (desktop) ---------- */
$$('[data-hsteps]').forEach(h => {
  const vp = $('.hsteps__viewport', h), tr = $('.hsteps__track', h);
  let dist = 0, on = false;
  const setup = () => {
    on = innerWidth >= 1000 && !reduced();
    h.classList.toggle('is-pinned', on);
    tr.style.transform = '';
    if (!on) { h.style.removeProperty('--hs-h'); return; }
    dist = Math.max(0, tr.scrollWidth - innerWidth + 80);
    h.style.setProperty('--hs-h', (innerHeight + dist) + 'px');
    upd();
  };
  const upd = () => { if (!on) return; const r = h.getBoundingClientRect(); const k = clamp(-r.top / Math.max(1, dist)); tr.style.transform = `translate3d(${-k * dist}px,0,0)`; };
  pinned.push(upd);
  addEventListener('resize', () => requestAnimationFrame(setup)); setup();
  addEventListener('load', setup);
});

/* ---------- squad / medidores ---------- */
$$('[data-squad]').forEach(s => onView(s, v => v && s.classList.add('is-in'), { once: true, threshold: .4 }));

/* ---------- texto que se preenche ---------- */
const fills = $$('[data-fill]').map(f => {
  if (!f.getAttribute('aria-label')) f.setAttribute('aria-label', f.textContent.replace(/\s+/g, ' ').trim());
  const walk = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) { const frag = d.createDocumentFragment(); [...n.textContent].forEach(ch => { if (ch === ' ') frag.appendChild(d.createTextNode(' ')); else { const s = d.createElement('span'); s.className = 'ch'; s.textContent = ch; s.setAttribute('aria-hidden', 'true'); frag.appendChild(s); } }); n.replaceWith(frag); }
    else if (n.nodeType === 1) walk(n);
  });
  walk(f);
  return { f, chs: $$('.ch', f) };
});
const fillTo = (o, k) => { const n = Math.round(o.chs.length * k); o.chs.forEach((c, i) => c.classList.toggle('on', i < n)); };

/* ---------- agente digitando (demonstração ilustrativa) ---------- */
const AGENT = [
  ['p', '$ spla-agent montar-sessao --hoje'],
  ['dim', '› perfil      analista SAP FI · time global'],
  ['dim', '› objetivo    falar na daily sem travar'],
  ['dim', '› nível       B1 (referência CEFR)'],
  ['ok', '✓ revisão     on track · follow up · blocker'],
  ['ok', '✓ novo        “flag a risk” · “push back”'],
  ['ok', '✓ gramática   he / she / it + -s'],
  ['ok', '✓ pronúncia   “th” em three e think'],
  ['ok', '✓ conversa    daily com a Sophia'],
  ['hl', '→ foco de correção: -s na 3ª pessoa'],
  ['p', '→ sessão pronta · 20–30 min · tamo junto']
];
$$('[data-agent]').forEach(a => {
  const body = $('[data-agent-body]', a); let started = false, vis = false;
  const render = n => { let html = ''; let left = n; for (const [c, t] of AGENT) { if (left <= 0) break; const s = t.slice(0, left); left -= t.length + 1; html += `<span class="${c}">${s.replace(/</g, '&lt;')}</span>\n`; } body.innerHTML = html + '<span class="caret"></span>'; };
  const total = AGENT.reduce((s, [, t]) => s + t.length + 1, 0);
  if (reduced()) { render(total); return; }
  onView(a, v => { vis = v; if (v && !started) { started = true; run(); } }, { threshold: .35 });
  async function run() {
    for (;;) {
      for (let n = 0; n <= total; n += 2) { while (!vis || d.hidden) await wait(250); render(n); await wait(16); }
      await wait(5200); body.innerHTML = '<span class="caret"></span>'; await wait(500);
    }
  }
});

/* ---------- fundo interativo do hero (canvas) ---------- */
const VOICE = { level: 0, target: 0, who: 'sophia' };
$$('[data-field]').forEach(cv => {
  const hero = cv.parentNode, ctx = cv.getContext('2d'); if (!ctx) return;
  const call = $('.call', hero);
  let W = 0, H = 0, dpr = 1, pts = [], vis = true, cxy = { x: 0, y: 0 }, mx = -999, my = -999, t = 0;
  const size = () => {
    const r = hero.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(1.5, devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const gap = W < 700 ? 30 : 36; pts = [];
    for (let y = gap / 2; y < H; y += gap) for (let x = gap / 2; x < W; x += gap) pts.push(x, y);
    if (call) { const c = call.getBoundingClientRect(); cxy = { x: c.left - r.left + c.width / 2, y: c.top - r.top + c.height * .42 }; }
    else cxy = { x: W * .7, y: H * .45 };
    if (reduced()) draw(0);
  };
  hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
  hero.addEventListener('pointerleave', () => { mx = my = -999; });
  function draw(dt) {
    t += dt; VOICE.level = lerp(VOICE.level, VOICE.target * (.55 + .45 * Math.abs(Math.sin(t * 9.1) * Math.sin(t * 3.7))), .18);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const lvl = VOICE.level, R = 190;
    for (let i = 0; i < pts.length; i += 2) {
      const x = pts[i], y = pts[i + 1];
      const dxm = x - mx, dym = y - my, dm = Math.hypot(dxm, dym);
      const near = dm < R ? 1 - dm / R : 0;
      const dc = Math.hypot(x - cxy.x, y - cxy.y);
      const ring = lvl > .02 ? Math.max(0, Math.cos((dc - t * 260) / 46)) * Math.exp(-dc / 520) * lvl : 0;
      const amb = .5 + .5 * Math.sin(x * .012 + y * .009 + t * .8);
      const s = 1.1 + near * 3.4 + ring * 3 + amb * .5;
      const a = .07 + near * .5 + ring * .55 + amb * .04;
      const ox = near ? dxm / (dm || 1) * near * 10 : 0, oy = near ? dym / (dm || 1) * near * 10 : 0;
      ctx.globalAlpha = Math.min(.9, a);
      ctx.fillStyle = near > .35 ? '#C8102E' : (ring > .25 ? (VOICE.who === 'you' ? '#E0A800' : '#C8102E') : '#0B1119');
      const px = x + ox, py = y + oy;
      ctx.beginPath(); ctx.moveTo(px, py - s); ctx.lineTo(px + s, py); ctx.lineTo(px, py + s); ctx.lineTo(px - s, py); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  let lt = performance.now();
  const loop = now => { const dt = Math.min(.05, (now - lt) / 1000); lt = now; if (vis && !d.hidden && !reduced()) draw(dt); requestAnimationFrame(loop); };
  onView(hero, v => (vis = v));
  addEventListener('resize', () => requestAnimationFrame(size)); size();
  addEventListener('load', size);
  requestAnimationFrame(loop);
});

/* ---------- tela de chamada da Sophia (vídeo + legenda ao vivo) ---------- */
const call = $('[data-call]');
const DIALOGS = window.SPLA_DIALOGS || [];
if (call && DIALOGS.length) (() => {
  const vids = $$('.call__vid', call), subs = $('[data-call-subs]', call), tag = $('[data-call-tag]', call);
  const dots = $('[data-call-dots]', call), pbtn = $('[data-call-pause]', call), clock = $('[data-call-time]', call);
  const wave = $('[data-call-wave]', call), wctx = wave?.getContext('2d');
  const useVid = canVideo() && vids.length === 2;
  if (!useVid) vids.forEach(v => v.remove());
  let i = 0, run = 0, userPaused = reduced(), offscreen = false, cur = 0, secs = 0;
  const paused = () => userPaused || offscreen || d.hidden;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const words = s => s.split(' ').map(w => `<span class="w">${esc(w)}</span>`).join(' ');
  // espera que respeita pausa e troca de cena
  const sleep = async (ms, my) => { let left = ms; while (left > 0) { if (my !== run) throw 0; if (paused()) { await wait(120); continue; } const st = Math.min(60, left); await wait(st); left -= st; } if (my !== run) throw 0; };
  // vídeo em buffer duplo
  const prep = (v, name) => { if (v.dataset.clip !== name) { v.dataset.clip = name; v.src = vsrc('sophia-' + name); v.preload = 'auto'; v.load(); } };
  async function clip(name, nextName, my, body) {
    let v = null;
    if (useVid) {
      v = vids[cur]; const o = vids[1 - cur];
      prep(v, name); try { v.currentTime = 0; } catch (e) {}
      await v.play().catch(() => {});
      v.classList.add('is-on'); setTimeout(() => { o.classList.remove('is-on'); setTimeout(() => prep(o, nextName), 300); }, 120);
    }
    const t0 = performance.now();
    const bodyP = body ? body().catch(e => { if (e !== 0) console.warn(e); }) : null;
    let played = 0;
    while (true) {
      if (my !== run) { v?.pause(); throw 0; }
      if (paused()) { v && !v.paused && v.pause(); await wait(120); continue; }
      if (v && v.paused && !v.ended) v.play().catch(() => {});
      await wait(60); played += 60;
      if (v ? (v.ended || (v.duration && v.currentTime >= v.duration - .04) || played > 9000) : played >= 5000) break;
    }
    await bodyP;
    if (useVid) cur = 1 - cur;
  }
  const push = (cls, html) => {
    $$('.sub', subs).forEach(s => s.classList.add('sub--old'));
    const old = $$('.sub--old', subs); while (old.length > 1) old.shift().remove();
    const p = d.createElement('p'); p.className = 'sub ' + cls; p.innerHTML = html; subs.appendChild(p); return p;
  };
  const reveal = async (p, dur, my, who) => {
    const ws = $$('.w', p); const per = Math.max(160, dur / Math.max(1, ws.length));
    VOICE.who = who; VOICE.target = 1;
    for (const w of ws) { w.classList.add('on'); const ins = $('ins[hidden]', w); if (ins) { await sleep(320, my); ins.hidden = false; } await sleep(per, my); }
    VOICE.target = 0;
  };
  function youHTML(s) {
    const toks = s.you.split(' '); let k = -1;
    toks.forEach((t, n) => { if (t.replace(/[^\w'’-]/g, '').toLowerCase() === s.wrong.toLowerCase()) k = n; });
    return toks.map((t, n) => {
      if (n !== k) return `<span class="w">${esc(t)}</span>`;
      const m = t.match(/^(.*?)([.,!?]*)$/);
      return `<span class="w"><s>${esc(m[1])}</s> <ins hidden>${esc(s.right)}</ins>${m[2]}</span>`;
    }).join(' ');
  }
  const who = n => `<b class="who">${n}</b>`;
  function staticScene(s) {
    subs.innerHTML = '';
    push('', who('Sophia') + esc(s.sophia));
    const y = push('sub--you', who(T.you || 'Você') + youHTML(s)); $$('ins', y).forEach(x => (x.hidden = false)); $$('.w', y).forEach(w => w.classList.add('on'));
    push('sub--tip', `<b>${T.tipLabel || 'Dica da Sophia'}:</b> ${s.tip}`);
    $$('.sub', subs).forEach(x => x.classList.remove('sub--old'));
  }
  function mark() { $$('button', dots).forEach((b, n) => b.setAttribute('aria-pressed', n === i)); tag.textContent = DIALOGS[i].tag; }
  async function scene(my) {
    const s = DIALOGS[i]; mark();
    await clip('speak1', 'nod', my, async () => { await sleep(350, my); const p = push('', who('Sophia') + words(s.sophia)); await reveal(p, 3600, my, 'sophia'); });
    await clip('nod', 'happy', my, async () => { await sleep(250, my); const p = push('sub--you', who(T.you || 'Você') + youHTML(s)); await reveal(p, 3300, my, 'you'); });
    await clip('happy', 'speak1', my, async () => { await sleep(200, my); const p = push('', who('Sophia') + words(s.reply)); await reveal(p, 2600, my, 'sophia'); await sleep(250, my); push('sub--tip', `<b>${T.tipLabel || 'Dica da Sophia'}:</b> ${s.tip}`); });
  }
  async function loop() {
    const my = ++run; VOICE.target = 0;
    if (reduced()) { staticScene(DIALOGS[i]); mark(); return; }
    subs.innerHTML = '';
    try { for (;;) { await scene(my); i = (i + 1) % DIALOGS.length; } } catch (e) { if (e !== 0) console.warn(e); }
  }
  DIALOGS.forEach((s, n) => { const b = d.createElement('button'); b.type = 'button'; b.textContent = s.tag; b.setAttribute('aria-pressed', n === 0); b.setAttribute('aria-label', (T.scene || 'Cena') + ': ' + s.tag); b.addEventListener('click', () => { i = n; if (reduced()) { staticScene(DIALOGS[i]); mark(); } else { if (userPaused) setP(false); loop(); } }); dots.appendChild(b); });
  const setP = p => { userPaused = p; pbtn.setAttribute('aria-pressed', p); pbtn.setAttribute('aria-label', p ? (T.playDemo || 'Continuar demonstração') : (T.pauseDemo || 'Pausar demonstração')); pbtn.innerHTML = p ? ICON_PLAY : ICON_PAUSE; if (p) vids.forEach(v => v.pause()); };
  pbtn.addEventListener('click', () => { const wasStatic = reduced(); setP(!userPaused); if (wasStatic && !userPaused) { /* sem animação: só alterna a cena */ i = (i + 1) % DIALOGS.length; staticScene(DIALOGS[i]); mark(); } });
  if (pbtn) setP(userPaused);
  onView(call, v => (offscreen = !v));
  setInterval(() => { if (!paused()) { secs++; clock.textContent = String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0'); } }, 1000);
  // ondas de voz
  if (wctx && !reduced()) {
    const bars = 44; const hs = new Array(bars).fill(0); let t = 0;
    const draw = () => {
      if (!paused()) {
        t += .016; const W = wave.width, H = wave.height, bw = W / bars;
        wctx.clearRect(0, 0, W, H);
        wctx.fillStyle = VOICE.who === 'you' ? '#F5C518' : '#FFFFFF';
        for (let k = 0; k < bars; k++) {
          const tgt = VOICE.level * (.25 + .75 * Math.abs(Math.sin(k * .7 + t * 11) * Math.cos(k * .23 - t * 5))) + .06;
          hs[k] = lerp(hs[k], tgt, .3); const h = Math.max(2, hs[k] * H);
          wctx.globalAlpha = .55 + .45 * hs[k]; wctx.fillRect(k * bw + bw * .25, (H - h) / 2, bw * .5, h);
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }
  // começa depois do carregamento para não competir com o LCP
  const start = () => { if (useVid) { prep(vids[0], 'speak1'); prep(vids[1], 'nod'); } loop(); };
  if (reduced()) loop(); else if (d.readyState === 'complete') setTimeout(start, 400); else addEventListener('load', () => setTimeout(start, 400), { once: true });
  d.addEventListener('visibilitychange', () => { if (d.hidden) vids.forEach(v => v.pause()); });
  RM.addEventListener?.('change', () => location.reload());
})();

/* ---------- cartões de jargão ---------- */
$$('.jcard button').forEach(b => b.addEventListener('click', () => { const c = b.closest('.jcard'); const on = c.classList.toggle('is-flipped'); b.setAttribute('aria-expanded', on); }));

/* ---------- diagnóstico rápido ---------- */
const diag = $('[data-diag]');
if (diag) {
  const out = $('[data-diag-out]', diag), wa = $('[data-wa]', diag), mail = $('[data-mail]', diag), txt = $('[data-diag-text]', diag), meter = $('.diag__meter', diag), mtxt = $('[data-diag-count]', diag);
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
    const n = [who, area, goal, lvl].filter(Boolean).length;
    meter?.style.setProperty('--dm', n / 4); if (mtxt) mtxt.textContent = n + '/4';
  };
  diag.addEventListener('change', upd); upd();
}

/* ---------- Pergunte à Sophia (roteirizado, sem IA externa) ---------- */
const FAQ = (window.SPLA_FAQ || []).map(f => ({ ...f, a: f.a.split('{{root}}').join(BASE) }));
const fab = $('.sophia-fab'), panel = $('#sophia');
if (fab && panel && FAQ.length) {
  const log = $('.sp__log', panel), chips = $('.sp__chips', panel), form = $('.sp__form', panel), input = $('input', form), face = $('.sp__face', panel);
  let greeted = false;
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ');
  const STOP = new Set('a o e de da do das dos que como um uma para pra com no na nos nas em eu voce vcs voces se ser e é the is do to of and meu minha tem ter qual quais quanto'.split(' '));
  const add = (html, who) => { const m = d.createElement('div'); m.className = 'msg msg--' + who; m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight; return m; };
  async function answer(item) {
    const t = d.createElement('div'); t.className = 'msg msg--s typing'; t.innerHTML = '<i></i><i></i><i></i>'; t.setAttribute('aria-hidden', 'true'); log.appendChild(t); log.scrollTop = log.scrollHeight;
    face?.classList.add('is-talking');
    await wait(reduced() ? 0 : 520); t.remove();
    const m = add('', 's');
    if (reduced()) { m.innerHTML = item.a; }
    else {
      const tmp = d.createElement('div'); tmp.innerHTML = item.a; const full = item.a;
      const text = tmp.textContent; let n = 0;
      await new Promise(res => { const step = () => { n += 3; m.textContent = text.slice(0, n); log.scrollTop = log.scrollHeight; if (n < text.length) setTimeout(step, 14); else { m.innerHTML = full; res(); } }; step(); });
    }
    face?.classList.remove('is-talking');
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
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function renderChips(ids) {
    chips.innerHTML = '';
    const list = (ids && ids.length ? ids.map(id => FAQ.find(f => f.id === id)).filter(Boolean) : FAQ.filter(f => f.chip)).slice(0, 4);
    list.forEach(it => { const b = d.createElement('button'); b.type = 'button'; b.textContent = it.q; b.addEventListener('click', () => { add(esc(it.q), 'u'); answer(it); }); chips.appendChild(b); });
  }
  const open = v => {
    fab.setAttribute('aria-expanded', v); panel.classList.toggle('is-open', v); panel.setAttribute('aria-hidden', !v);
    if (v) { if (!greeted) { greeted = true; answer({ a: T.spHello || 'Oi! Eu sou a Sophia.', next: [] }); } setTimeout(() => input.focus(), 60); }
    else fab.focus();
  };
  fab.addEventListener('click', () => open(true));
  /* esconde o botão enquanto o hero da home está na tela (não cobre chips nem a tela de chamada) */
  const hero = $('.hero');
  if (hero) {
    let ticking = false;
    const sync = () => { ticking = false; const r = hero.getBoundingClientRect(); fab.classList.toggle('is-away', r.bottom > innerHeight * 0.3 && !panel.classList.contains('is-open')); };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(sync); } }, { passive: true });
    addEventListener('resize', sync, { passive: true });
    sync();
  }
  $('.sp__close', panel).addEventListener('click', () => open(false));
  d.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('is-open')) open(false); });
  form.addEventListener('submit', e => {
    e.preventDefault(); const q = input.value.trim(); if (!q) return; input.value = '';
    add(esc(q), 'u'); const it = match(q);
    answer(it || { a: (T.spFallback || '').split('{{root}}').join(BASE), next: [] });
  });
  $$('[data-open-sophia]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); open(true); }));
}

/* ---------- v2 · constelação de métodos (Feita por gente) ---------- */
$$('[data-constel]').forEach(c => {
  const svg = $('.constel__lines', c), nodes = $$('.constel__nodes li', c), NS = 'http://www.w3.org/2000/svg';
  c.classList.add('is-live'); if (FINE) c.classList.add('is-fine');
  // posições: três anéis elípticos ao redor do núcleo, recalculadas em px e presas às bordas
  const per = Math.ceil(nodes.length / 3);
  const base = nodes.map((li, i) => { const ring = i % 3, k = Math.floor(i / 3); return { a: (k / per) * Math.PI * 2 + ring * (Math.PI / per) * 0.66 + 0.35, ring }; });
  let pos = base.map(() => ({ x: 50, y: 50 }));
  let act = nodes.map(() => true);
  const place = r => {
    const mob = r.width < 600, W = r.width, Hh = r.height, m = 8, core = (mob ? 104 : 132) / 2 + 10;
    act = nodes.map((li, i) => !mob || i < 12); nodes.forEach((li, i) => li.classList.toggle('is-off', !act[i]));
    const idx = nodes.map((_, i) => i).filter(i => act[i]), n = idx.length;
    const P = idx.map((i, k) => { const w = nodes[i].offsetWidth + 6, h = nodes[i].offsetHeight + 6, ring = k % 3, a = (k / n) * Math.PI * 2 + .3, f = [.55, .78, 1][ring];
      return { i, w, h, x: W / 2 + Math.cos(a) * f * (W / 2 - w / 2 - m), y: Hh / 2 + Math.sin(a) * f * (Hh / 2 - h / 2 - m - 12) }; });
    for (let it = 0; it < 220; it++) {
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        const A = P[p], B = P[q], ox = (A.w + B.w) / 2 - Math.abs(A.x - B.x), oy = (A.h + B.h) / 2 - Math.abs(A.y - B.y);
        if (ox > 0 && oy > 0) { if (ox < oy * 2.2) { const s2 = (A.x < B.x ? -1 : 1) * ox / 2; A.x += s2; B.x -= s2; } else { const s2 = (A.y < B.y ? -1 : 1) * oy / 2; A.y += s2; B.y -= s2; } }
      }
      P.forEach(A => { // afasta do núcleo
        const dx = Math.max(Math.abs(A.x - W / 2) - A.w / 2, 0), dy = Math.max(Math.abs(A.y - Hh / 2) - A.h / 2, 0), dd = Math.hypot(dx, dy);
        if (dd < core) { const ang = Math.atan2(A.y - Hh / 2 || .01, A.x - W / 2), k = (core - dd) * .6; A.x += Math.cos(ang) * k; A.y += Math.sin(ang) * k; }
        A.x = Math.min(W - m - A.w / 2, Math.max(m + A.w / 2, A.x)); A.y = Math.min(Hh - m - A.h / 2 - 24, Math.max(m + A.h / 2, A.y));
      });
    }
    pos = nodes.map(() => ({ x: 50, y: 50 }));
    P.forEach(A => { nodes[A.i].style.left = A.x + 'px'; nodes[A.i].style.top = A.y + 'px'; pos[A.i] = { x: A.x / W * 100, y: A.y / Hh * 100 }; });
  };
  const lines = [];
  const mk = () => { const l = d.createElementNS(NS, 'line'); svg.appendChild(l); return l; };
  nodes.forEach((li, i) => { lines.push({ a: -1, b: i, el: mk() }); const j = (i + 3) % nodes.length; lines.push({ a: i, b: j, el: mk() }); });
  const lit = new Float32Array(nodes.length);
  const layout = () => {
    const r = c.getBoundingClientRect(); place(r); svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
    const P = i => i < 0 ? [r.width / 2, r.height / 2] : [pos[i].x / 100 * r.width, pos[i].y / 100 * r.height];
    lines.forEach(L => { const [x1, y1] = P(L.a), [x2, y2] = P(L.b); L.el.setAttribute('x1', x1); L.el.setAttribute('y1', y1); L.el.setAttribute('x2', x2); L.el.setAttribute('y2', y2); });
  };
  const paint = () => {
    nodes.forEach((li, i) => { li.style.setProperty('--lit', lit[i].toFixed(3)); li.classList.toggle('is-hot', lit[i] > .85); });
    lines.forEach(L => { const on = act[L.b] && (L.a < 0 || act[L.a]), v = L.a < 0 ? lit[L.b] : Math.min(lit[L.a], lit[L.b]); L.el.style.opacity = on ? (0.05 + v * 0.55).toFixed(3) : 0; });
  };
  layout(); addEventListener('resize', layout, { passive: true });
  if (reduced()) { lit.fill(.75); paint(); return; }
  if (FINE) {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, R = Math.max(150, r.width * .26);
      nodes.forEach((li, i) => { const dx = pos[i].x / 100 * r.width - mx, dy = pos[i].y / 100 * r.height - my; lit[i] = Math.max(0, 1 - Math.hypot(dx, dy) / R); });
      paint(); $('[data-constel-hint]', c)?.remove();
    });
    c.addEventListener('pointerleave', () => { lit.fill(0); paint(); });
  }
  // onda automática ao entrar na tela (toque e mouse parado)
  let t0 = 0, vis = false, idle = true, raf = 0;
  c.addEventListener('pointermove', () => { idle = false; clearTimeout(c._idle); c._idle = setTimeout(() => idle = true, 2500); });
  const wave = now => {
    if (!vis) { raf = 0; return; }
    if (idle) { const t = (now - t0) / 1000; nodes.forEach((li, i) => { const ph = Math.atan2(pos[i].y - 50, pos[i].x - 50); lit[i] = Math.max(0, Math.cos(ph - t * 1.1)) ** 3; }); paint(); }
    raf = requestAnimationFrame(wave);
  };
  new IntersectionObserver(es => es.forEach(e => { vis = e.isIntersecting; if (vis && !raf) { t0 = performance.now(); raf = requestAnimationFrame(wave); } })).observe(c);
});
/* ---------- v2 · elenco com parallax leve ---------- */
if (FINE && !reduced()) $$('.trio-real__cast').forEach(box => {
  const cs = $$('.cast', box);
  box.addEventListener('pointermove', e => { const r = box.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; cs.forEach((c, i) => { const k = (i + 1) * 6; c.style.setProperty('--px', (x * k).toFixed(1) + 'px'); c.style.setProperty('--py', (y * k).toFixed(1) + 'px'); }); });
  box.addEventListener('pointerleave', () => cs.forEach(c => { c.style.setProperty('--px', '0px'); c.style.setProperty('--py', '0px'); }));
});
/* ---------- v2 · rede de orquestração (camada humana ↔ tecnologia) ---------- */
$$('[data-orq]').forEach(box => {
  const cv = $('canvas', box), ctx = cv.getContext('2d'), H = $$('.orq__col--h li', box), T = $$('.orq__col--t li', box);
  let W = 0, Hh = 0, dpr = 1, A = [], B = [], hub = [0, 0], pulses = [], vis = false, last = 0;
  const layout = () => {
    const r = box.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = r.width; Hh = r.height;
    cv.width = W * dpr; cv.height = Hh * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    A = H.map(li => { const q = li.getBoundingClientRect(); return [q.right - r.left, q.top - r.top + q.height / 2]; });
    B = T.map(li => { const q = li.getBoundingClientRect(); return [q.left - r.left, q.top - r.top + q.height / 2]; });
    hub = [W / 2, Hh / 2];
  };
  const curve = (p, q, t) => { const cx = (p[0] + q[0]) / 2, x = (1 - t) ** 3 * p[0] + 3 * (1 - t) ** 2 * t * cx + 3 * (1 - t) * t * t * cx + t ** 3 * q[0], y = (1 - t) ** 3 * p[1] + 3 * (1 - t) ** 2 * t * p[1] + 3 * (1 - t) * t * t * q[1] + t ** 3 * q[1]; return [x, y]; };
  const path = (p, q) => { const cx = (p[0] + q[0]) / 2; ctx.moveTo(p[0], p[1]); ctx.bezierCurveTo(cx, p[1], cx, q[1], q[0], q[1]); };
  const draw = dt => {
    ctx.clearRect(0, 0, W, Hh);
    ctx.strokeStyle = 'rgba(245,245,243,.12)'; ctx.lineWidth = 1; ctx.beginPath();
    A.forEach(p => path(p, hub)); B.forEach(q => path(hub, q)); ctx.stroke();
    // hub: quadrado neutro (o amarelo fica só no logo)
    ctx.strokeStyle = 'rgba(245,245,243,.7)'; ctx.strokeRect(hub[0] - 9, hub[1] - 9, 18, 18);
    ctx.fillStyle = 'rgba(245,245,243,.9)'; ctx.fillRect(hub[0] - 3, hub[1] - 3, 6, 6);
    if (dt > 0 && Math.random() < dt * 5 && A.length) { const i = Math.random() * A.length | 0, j = Math.random() * B.length | 0; pulses.push({ i, j, t: 0 }); }
    ctx.fillStyle = '#F5F5F3';
    pulses = pulses.filter(p => { p.t += dt * .45; if (p.t > 1) return false; const [x, y] = p.t < .5 ? curve(A[p.i], hub, p.t * 2) : curve(hub, B[p.j], (p.t - .5) * 2); ctx.globalAlpha = Math.sin(p.t * Math.PI); ctx.fillRect(x - 2, y - 2, 4, 4); ctx.globalAlpha = 1; return true; });
  };
  layout(); addEventListener('resize', () => { layout(); draw(0); }, { passive: true });
  if (reduced()) { draw(0); return; }
  const loop = now => { const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; if (vis && !d.hidden) draw(dt); requestAnimationFrame(loop); };
  new IntersectionObserver(es => es.forEach(e => { vis = e.isIntersecting; if (vis) layout(); })).observe(box);
  requestAnimationFrame(loop);
});

/* ---------- movimento rico: GSAP + ScrollTrigger + Lenis, só se permitido ---------- */
const scrubs = [];
$$('.timeline').forEach(el => scrubs.push({ el, prop: '--tl', start: 'top 75%', end: 'bottom 60%' }));
$$('[data-sprint-line]').forEach(el => scrubs.push({ el, prop: '--sl', start: 'top 85%', end: 'top 45%' }));
function fallbackMotion() {
  fills.forEach(o => { if (reduced()) fillTo(o, 1); else onView(o.f, v => { if (!v) return; let k = 0; const st = () => { k += .03; fillTo(o, Math.min(1, k)); if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); }, { once: true, threshold: .6 }); });
  scrubs.forEach(s => s.el.style.setProperty(s.prop, 1));
}
const loadJS = src => new Promise((res, rej) => { const s = d.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = rej; d.head.appendChild(s); });
function initMotion() {
  const { gsap, ScrollTrigger, Lenis } = window;
  if (!gsap || !ScrollTrigger) return fallbackMotion();
  gsap.registerPlugin(ScrollTrigger);
  if (Lenis && FINE) {
    lenis = new Lenis({ lerp: .11, wheelMultiplier: 1, anchors: { offset: -80 }, prevent: n => !!(n.closest && n.closest('.sp, .drawer, .table-wrap, .car__track')) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    root.classList.add('lenis-on');
  }
  fills.forEach(o => ScrollTrigger.create({ trigger: o.f, start: 'top 82%', end: 'top 35%', scrub: true, onUpdate: st => fillTo(o, st.progress) }));
  scrubs.forEach(s => { s.el.style.setProperty(s.prop, 0); ScrollTrigger.create({ trigger: s.el, start: s.start, end: s.end, scrub: true, onUpdate: st => s.el.style.setProperty(s.prop, st.progress.toFixed(3)) }); });
  const hero = $('.hero');
  if (hero) {
    const callEl = $('.call', hero), copy = $('.hero__copy', hero);
    if (callEl) gsap.to(callEl, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    if (copy) gsap.to(copy, { y: -60, opacity: .25, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }
  $$('.foot__big').forEach(el => gsap.fromTo(el, { xPercent: 4 }, { xPercent: -18, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }));
  $$('[data-speed]').forEach(el => gsap.to(el, { y: () => -(+el.dataset.speed) * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } }));
  addEventListener('load', () => ScrollTrigger.refresh());
}
if (reduced()) fallbackMotion();
else {
  const V = BASE + 'assets/vendor/';
  const go = () => Promise.all([loadJS(V + 'gsap.min.js'), FINE ? loadJS(V + 'lenis.min.js') : Promise.resolve()])
    .then(() => loadJS(V + 'ScrollTrigger.min.js')).then(initMotion).catch(fallbackMotion);
  if (d.readyState === 'complete') idle(go); else addEventListener('load', () => idle(go), { once: true });
}
onScroll();
})();
