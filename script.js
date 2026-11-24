/* ---------- Auto-updating durations (language aware) ----------
   <el data-since="2025-01"> → "1 yr 11 mos"; data-short → "1y 11m"; data-prefix is prepended */
function updateDurations(l) {
  const n = new Date();
  document.querySelectorAll('[data-since]').forEach(function (el) {
    const [sy, sm] = el.getAttribute('data-since').split('-').map(Number);
    let mo = (n.getFullYear() - sy) * 12 + (n.getMonth() - (sm - 1)) + 1; // inclusive, like LinkedIn
    if (mo < 1) mo = 1;
    const y = Math.floor(mo / 12), m = mo % 12, p = [];
    if (el.hasAttribute('data-short')) {
      if (y) p.push(y + (l === 'pt' ? 'a' : 'y'));
      if (m) p.push(m + 'm');
    } else if (l === 'pt') {
      if (y) p.push(y + ' ano' + (y > 1 ? 's' : ''));
      if (m) p.push(m + ' ' + (m > 1 ? 'meses' : 'mês'));
    } else {
      if (y) p.push(y + ' yr' + (y > 1 ? 's' : ''));
      if (m) p.push(m + ' mo' + (m > 1 ? 's' : ''));
    }
    el.textContent = (el.getAttribute('data-prefix') || '') + p.join(' ');
  });
}

/* ---------- Language switch (EN / PT) ---------- */
let lang = 'en';
const langBtn = document.getElementById('langToggle');
const content = document.getElementById('content');
const reduceMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;

function swapTexts(l) {
  document.documentElement.setAttribute('lang', l === 'pt' ? 'pt-BR' : 'en');
  document.querySelectorAll('[data-en]').forEach(function (el) {
    const v = el.getAttribute('data-' + l);
    if (v == null) return;
    if (v.indexOf('<') >= 0) el.innerHTML = v; else el.textContent = v;
  });
  updateDurations(l);
}
function setLang(l, animate) {
  lang = l;
  if (langBtn) langBtn.setAttribute('data-lang', l); // knob slides instantly
  if (animate && !reduceMotion && document.startViewTransition) {
    document.startViewTransition(function () { swapTexts(l); });
  } else {
    swapTexts(l);
  }
}
if (langBtn) langBtn.addEventListener('click', function () { setLang(lang === 'en' ? 'pt' : 'en', true); });
setLang('en', false);

/* ---------- Scroll reveal ---------- */
const io = new IntersectionObserver((es) => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: .14, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.ir').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 0.07 + 's';
  io.observe(el);
});

/* ---------- Event photo carousel ---------- */
document.querySelectorAll('.event-gallery').forEach(function (gallery) {
  const imgs = gallery.querySelectorAll('.gallery-track img');
  const dots = gallery.querySelectorAll('.gallery-dots .dot');
  const prev = gallery.querySelector('.gallery-btn.prev');
  const next = gallery.querySelector('.gallery-btn.next');
  const count = gallery.querySelector('.gallery-count');
  const pad = n => String(n).padStart(2, '0');
  let cur = 0;

  function go(idx) {
    imgs[cur].classList.remove('active');
    dots[cur].classList.remove('active');
    cur = (idx + imgs.length) % imgs.length;
    imgs[cur].classList.add('active');
    dots[cur].classList.add('active');
    if (count) count.textContent = pad(cur + 1) + ' / ' + pad(imgs.length);
  }

  prev.addEventListener('click', function () { go(cur - 1); });
  next.addEventListener('click', function () { go(cur + 1); });
  dots.forEach(function (dot, i) { dot.addEventListener('click', function () { go(i); }); });

  let touchX = null;
  gallery.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  gallery.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) go(diff > 0 ? cur + 1 : cur - 1);
    touchX = null;
  }, { passive: true });
});

/* ---------- Code block typewriter (syntax highlighted) ---------- */
(function () {
  const output = document.getElementById('term-output');
  const langEl = document.getElementById('term-lang');
  const idxEl = document.getElementById('term-idx');
  if (!output || !langEl) return;

  const snippets = [
    {
      lang: 'python · capability gates',
      cap: ['Capability gate — the state decides which tools the agent gets, not a classifier.',
            'Capability gate — o estado decide quais ferramentas o agente recebe, não um classificador.'],
      code: `# the state decides which tools the agent gets
class SearchDocuments:
    instruction = "Searches the indexed documents."

    @staticmethod
    def eligible(ctx) -> bool:
        return len(ctx.documents) > 0

active = [t for t in TOOLS if t.eligible(ctx)]
graph.invoke(state, tools=active)`
    },
    {
      lang: 'python · rag ingestion',
      cap: ['RAG ingestion — extract, chunk, embed and index, with an OCR fallback for scanned PDFs.',
            'Ingestão de RAG — extrair, fatiar, gerar embeddings e indexar, com OCR para PDFs escaneados.'],
      code: `# extract → chunk → embed → index
async def ingest(doc):
    text = extract(doc) or await ocr(doc)
    chunks = splitter.split(text)

    vectors = await azure_openai.embed(chunks)
    await elastic.bulk_index(chunks, vectors)`
    },
    {
      lang: 'java · spring boot',
      cap: ['Spring Boot endpoint — retrieval in Elasticsearch before the LLM is called.',
            'Endpoint Spring Boot — recuperação no Elasticsearch antes de chamar o LLM.'],
      code: `@PostMapping("/chat")
public ResponseEntity<String> chat(
        @RequestBody ChatRequest req) {

    var ctx = elastic
        .search(embed(req.message()));

    return ResponseEntity.ok(
        llm.invoke(ctx, req.message())
    );
}`
    }
  ];

  // split code into [class, text] tokens once, so partial output stays colored
  const KW = /^(return|public|var|new|def|class|for|in|if|or|import|from|async|await)$/;
  const RX = /(#[^\n]*|\/\/[^\n]*)|("[^"\n]*")|(@\w+)|([A-Za-z_]\w*)|([\s\S])/g;
  function tokenize(code) {
    const out = []; let m;
    RX.lastIndex = 0;
    while ((m = RX.exec(code))) {
      const cls = m[1] ? 'com' : m[2] ? 'str' : m[3] ? 'ann' : (m[4] && KW.test(m[4])) ? 'kw' : '';
      out.push([cls, m[0]]);
    }
    return out;
  }
  snippets.forEach(s => { s.tokens = tokenize(s.code); });

  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function render(tokens, n) {
    let html = '';
    for (const [cls, text] of tokens) {
      if (n <= 0) break;
      const t = esc(text.slice(0, n)); n -= text.length;
      html += cls ? '<span class="' + cls + '">' + t + '</span>' : t;
    }
    output.innerHTML = html;
  }

  const figEl = document.getElementById('termFig');
  const capEl = document.getElementById('termCap');
  function caption(i) {
    if (!capEl) return;
    capEl.setAttribute('data-en', snippets[i].cap[0]);
    capEl.setAttribute('data-pt', snippets[i].cap[1]);
    capEl.textContent = snippets[i].cap[lang === 'pt' ? 1 : 0];
    if (figEl) {
      figEl.setAttribute('data-en', 'Listing ' + (i + 1));
      figEl.setAttribute('data-pt', 'Listagem ' + (i + 1));
      figEl.textContent = (lang === 'pt' ? 'Listagem ' : 'Listing ') + (i + 1);
    }
  }
  caption(0);

  const TYPE_DELAY = 34, DELETE_DELAY = 12, PAUSE_AFTER = 2600, PAUSE_BEFORE = 400;
  let si = 0, ci = 0, typing = true;

  function tick() {
    const { code, tokens } = snippets[si];
    if (typing) {
      render(tokens, ++ci);
      if (ci < code.length) setTimeout(tick, TYPE_DELAY);
      else { typing = false; setTimeout(tick, PAUSE_AFTER); }
    } else if (ci > 0) {
      render(tokens, --ci);
      setTimeout(tick, DELETE_DELAY);
    } else {
      si = (si + 1) % snippets.length;
      langEl.textContent = snippets[si].lang;
      if (idxEl) idxEl.textContent = (si + 1) + ' / ' + snippets.length;
      caption(si);
      typing = true;
      setTimeout(tick, PAUSE_BEFORE);
    }
  }

  if (reduceMotion) { render(snippets[0].tokens, Infinity); return; }
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { observer.disconnect(); tick(); }
  }, { threshold: 0.2 });
  observer.observe(output.closest('.pipeline'));
})();

/* ---------- Sidebar: highlight the section in view ---------- */
(function () {
  const links = Array.from(document.querySelectorAll('.nav-links a'));
  const byId = {};
  links.forEach(a => { byId[a.getAttribute('href').slice(1)] = a; });
  const io = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a === byId[e.target.id]));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main > header, main > section').forEach(s => io.observe(s));
})();

/* ---------- Theme switch (light / dark) ---------- */
(function () {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const root = document.documentElement;
  btn.addEventListener('click', function () {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    const apply = () => { root.dataset.theme = next; };
    if (!reduceMotion && document.startViewTransition) document.startViewTransition(apply); else apply();
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
})();

/* ---------- Fig. 1 — retrieval field (hero plate) ----------
   A seeded 2D "embedding space". The query q sits among the points; its k = 5 nearest
   neighbours are ringed inside a dashed similarity threshold τ. Move the pointer to move q. */
(function () {
  const svg = document.getElementById('plateSvg');
  if (!svg) return;
  const X0 = 34, Y0 = 14, S = 372, K = 5;
  const HOME = { x: 0.6, y: 0.5 };

  let seed = 20250801;
  const rnd = () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  // clusters of "chunks": [cx, cy, spread, count]
  const pts = [];
  [[.24, .3, .07, 46], [.7, .24, .06, 38], [.56, .64, .08, 54], [.2, .74, .06, 30], [.86, .8, .045, 22], [.44, .1, .04, 12]]
    .forEach(([cx, cy, sd, n]) => {
      for (let i = 0; i < n; i++) {
        const x = cx + gauss() * sd, y = cy + gauss() * sd;
        if (x > .02 && x < .98 && y > .02 && y < .98) pts.push({ x, y, cross: rnd() < .16 });
      }
    });

  const px = v => X0 + v * S, py = v => Y0 + v * S, f = n => n.toFixed(1);
  let h = '';
  for (let i = 1; i < 10; i++) {
    h += '<line class="grid" x1="' + f(px(i / 10)) + '" y1="' + Y0 + '" x2="' + f(px(i / 10)) + '" y2="' + (Y0 + S) + '"/>';
    h += '<line class="grid" x1="' + X0 + '" y1="' + f(py(i / 10)) + '" x2="' + (X0 + S) + '" y2="' + f(py(i / 10)) + '"/>';
  }
  h += '<rect class="axis" fill="none" x="' + X0 + '" y="' + Y0 + '" width="' + S + '" height="' + S + '"/>';
  for (let i = 0; i <= 50; i++) {
    const len = i % 10 === 0 ? 7 : i % 5 === 0 ? 5 : 3, t = i / 50;
    h += '<line class="tick" x1="' + f(px(t)) + '" y1="' + (Y0 + S) + '" x2="' + f(px(t)) + '" y2="' + (Y0 + S + len) + '"/>';
    h += '<line class="tick" x1="' + (X0 - len) + '" y1="' + f(py(1 - t)) + '" x2="' + X0 + '" y2="' + f(py(1 - t)) + '"/>';
    if (i % 10 === 0) {
      h += '<text class="lbl" text-anchor="middle" x="' + f(px(t)) + '" y="' + (Y0 + S + 17) + '">' + t.toFixed(1) + '</text>';
      h += '<text class="lbl" text-anchor="end" x="' + (X0 - 10) + '" y="' + f(py(1 - t) + 2.5) + '">' + t.toFixed(1) + '</text>';
    }
  }
  h += '<text class="anno" x="' + (X0 + 8) + '" y="' + (Y0 + 14) + '">COSINE SPACE · 2D PROJECTION</text>';
  pts.forEach(p => {
    const x = px(p.x), y = py(p.y);
    h += p.cross
      ? '<path class="px" d="M' + f(x - 2.2) + ' ' + f(y) + 'H' + f(x + 2.2) + 'M' + f(x) + ' ' + f(y - 2.2) + 'V' + f(y + 2.2) + '"/>'
      : '<circle class="pt" cx="' + f(x) + '" cy="' + f(y) + '" r="1.25"/>';
  });
  svg.innerHTML = '<g>' + h + '</g><g id="plateDyn"></g>';
  const dyn = document.getElementById('plateDyn');
  const qEl = document.getElementById('plateQ'), tEl = document.getElementById('plateT'), nEl = document.getElementById('plateN');
  if (nEl) nEl.textContent = 'n = ' + pts.length;

  function draw(q) {
    const near = pts.map(p => ({ p, d: Math.hypot(p.x - q.x, p.y - q.y) })).sort((a, b) => a.d - b.d).slice(0, K);
    const qx = px(q.x), qy = py(q.y), r = near[K - 1].d * S + 6;
    let g = '<circle class="tau" cx="' + f(qx) + '" cy="' + f(qy) + '" r="' + f(r) + '"/>';
    const a = -Math.PI / 4;
    g += '<text class="nlbl" x="' + f(qx + Math.cos(a) * r + 4) + '" y="' + f(qy + Math.sin(a) * r - 3) + '">τ</text>';
    near.forEach((n, i) => {
      const x = px(n.p.x), y = py(n.p.y);
      g += '<line class="link" x1="' + f(qx) + '" y1="' + f(qy) + '" x2="' + f(x) + '" y2="' + f(y) + '"/>';
      g += '<circle class="ring" cx="' + f(x) + '" cy="' + f(y) + '" r="4.2"/><circle class="nb" cx="' + f(x) + '" cy="' + f(y) + '" r="1.6"/>';
      g += '<text class="nlbl" x="' + f(x + 6) + '" y="' + f(y - 5) + '">' + (i + 1) + '</text>';
    });
    g += '<path class="qx" d="M' + f(qx - 12) + ' ' + f(qy) + 'H' + f(qx - 4) + 'M' + f(qx + 4) + ' ' + f(qy) + 'H' + f(qx + 12) +
         'M' + f(qx) + ' ' + f(qy - 12) + 'V' + f(qy - 4) + 'M' + f(qx) + ' ' + f(qy + 4) + 'V' + f(qy + 12) + '"/>';
    g += '<circle class="q" cx="' + f(qx) + '" cy="' + f(qy) + '" r="2.6"/>';
    g += '<text class="qlbl" x="' + f(qx + 8) + '" y="' + f(qy + 15) + '">q</text>';
    dyn.innerHTML = g;
    if (qEl) qEl.textContent = 'q (' + q.x.toFixed(2) + ', ' + (1 - q.y).toFixed(2) + ')';
    if (tEl) tEl.textContent = 'τ ' + Math.max(0, 1 - near[K - 1].d * 2).toFixed(2) + ' · k = ' + K;
  }

  let cur = { x: HOME.x, y: HOME.y }, target = null, raf = 0;
  draw(cur);
  function toUnit(e) {
    const b = svg.getBoundingClientRect();
    const sx = (e.clientX - b.left) / b.width * 420, sy = (e.clientY - b.top) / b.height * 420;
    return { x: Math.min(1, Math.max(0, (sx - X0) / S)), y: Math.min(1, Math.max(0, (sy - Y0) / S)) };
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(cur); }); }
  svg.addEventListener('pointermove', e => { cur = toUnit(e); schedule(); });
  svg.addEventListener('pointerdown', e => { cur = toUnit(e); schedule(); });
  svg.addEventListener('pointerleave', () => {
    if (reduceMotion) { cur = { x: HOME.x, y: HOME.y }; schedule(); return; }
    target = { x: HOME.x, y: HOME.y };
    (function ease() {
      if (!target) return;
      cur = { x: cur.x + (target.x - cur.x) * .14, y: cur.y + (target.y - cur.y) * .14 };
      draw(cur);
      if (Math.hypot(target.x - cur.x, target.y - cur.y) > .002) requestAnimationFrame(ease); else target = null;
    })();
  });
  svg.addEventListener('pointerenter', () => { target = null; });
})();

/* ---------- Local time in Brazil (sidebar + contact) ---------- */
(function () {
  const els = document.querySelectorAll('.clock');
  if (!els.length) return;
  let fmt;
  try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }); } catch (e) { return; }
  const tick = () => { const t = fmt.format(new Date()); els.forEach(el => { el.textContent = t; }); };
  tick();
  setInterval(tick, 15000);
})();

/* ---------- Scroll gauge on the sidebar edge (top bar on mobile) ---------- */
(function () {
  const bar = document.getElementById('navGauge');
  if (!bar) return;
  const side = matchMedia('(min-width:980px)');
  let raf = 0;
  function update() {
    raf = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    bar.style.transform = side.matches ? 'scaleY(' + p + ')' : 'scaleX(' + p + ')';
  }
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  update();
})();

/* ---------- Stack index: item count per group ---------- */
document.querySelectorAll('.stack-card').forEach(function (card) {
  const h = card.querySelector('h3'), n = card.querySelectorAll('.tag').length;
  if (!h || !n) return;
  const c = document.createElement('span');
  c.className = 'cnt';
  c.textContent = 'n = ' + String(n).padStart(2, '0');
  h.appendChild(c);
});

/* ---------- Degree progress gauge ---------- */
document.querySelectorAll('.deg-gauge').forEach(function (g) {
  const [fy, fm] = g.getAttribute('data-from').split('-').map(Number);
  const [ty, tm] = g.getAttribute('data-to').split('-').map(Number);
  const n = new Date();
  const total = (ty - fy) * 12 + (tm - fm) + 1;
  const done = (n.getFullYear() - fy) * 12 + (n.getMonth() + 1 - fm) + n.getDate() / 31;
  const p = Math.min(1, Math.max(0, done / total));
  g.style.setProperty('--p', (p * 100).toFixed(1) + '%');
  const pct = g.parentElement.querySelector('.g-pct');
  if (pct) pct.textContent = Math.round(p * 100) + '%';
});
