/* ---------- NAV scrolled state ---------- */
const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive: true });

/* ---------- Auto-updating tenure (language aware) ---------- */
function updateTenure(l) {
  const el = document.getElementById('tenure');
  if (!el) return;
  const startY = 2025, startM = 1; // started January 2025 — change here if needed
  const n = new Date();
  let mo = (n.getFullYear() - startY) * 12 + (n.getMonth() - (startM - 1)) + 1; // inclusive, like LinkedIn
  if (mo < 1) mo = 1;
  const y = Math.floor(mo / 12), m = mo % 12, p = [];
  if (l === 'pt') {
    if (y) p.push(y + ' ano' + (y > 1 ? 's' : ''));
    if (m) p.push(m + ' ' + (m > 1 ? 'meses' : 'mês'));
  } else {
    if (y) p.push(y + ' yr' + (y > 1 ? 's' : ''));
    if (m) p.push(m + ' mo' + (m > 1 ? 's' : ''));
  }
  el.textContent = '· ' + p.join(' ');
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
  updateTenure(l);
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
  let cur = 0;

  function go(idx) {
    imgs[cur].classList.remove('active');
    dots[cur].classList.remove('active');
    cur = (idx + imgs.length) % imgs.length;
    imgs[cur].classList.add('active');
    dots[cur].classList.add('active');
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

/* ---------- Terminal typewriter ---------- */
(function () {
  const output = document.getElementById('term-output');
  const langEl = document.getElementById('term-lang');
  if (!output || !langEl) return;

  const snippets = [
    {
      lang: 'python',
      code: `# RAG pipeline with agentic tools
query  = request.get("message")
ctx    = elastic.search(embed(query))

answer = llm.invoke(
    messages=[*ctx, query],
    tools=[search_tool, calc_tool]
)

langfuse.trace(query, answer)
return answer`
    },
    {
      lang: 'java · spring boot',
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

  const TYPE_DELAY = 38, DELETE_DELAY = 16, PAUSE_AFTER = 2200, PAUSE_BEFORE = 400;
  let si = 0, ci = 0, typing = true, timeout = null;

  function tick() {
    const { lang, code } = snippets[si];
    if (typing) {
      ci++;
      output.textContent = code.slice(0, ci);
      if (ci < code.length) {
        timeout = setTimeout(tick, TYPE_DELAY);
      } else {
        typing = false;
        timeout = setTimeout(tick, PAUSE_AFTER);
      }
    } else {
      if (ci > 0) {
        ci--;
        output.textContent = code.slice(0, ci);
        timeout = setTimeout(tick, DELETE_DELAY);
      } else {
        si = (si + 1) % snippets.length;
        langEl.textContent = snippets[si].lang;
        typing = true;
        timeout = setTimeout(tick, PAUSE_BEFORE);
      }
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { observer.disconnect(); tick(); }
  }, { threshold: 0.2 });
  observer.observe(output.closest('.pipeline'));
})();

/* ---------- Hero vector / embedding field ---------- */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const c = document.getElementById('field'), x = c.getContext('2d');
  let w = 0, h = 0, dpr = 1, nodes = [], raf = 0, running = false;
  const mouse = { x: -9999, y: -9999 };
  const count = () => Math.max(26, Math.min(56, Math.round((w * h) / 26000)));

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = c.getBoundingClientRect();
    w = Math.round(r.width); h = Math.round(r.height);
    if (!w || !h) return false;
    c.width = w * dpr; c.height = h * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }
  function build() {
    nodes = []; const n = count();
    for (let i = 0; i < n; i++) {
      nodes.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .16, vy: (Math.random() - .5) * .16,
        r: Math.random() * 1.3 + .9,
        amber: Math.random() < .13
      });
    }
  }
  function frame() {
    // bulletproof clear: reset transform, wipe the whole backing store, restore
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, c.width, c.height);
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const LINK = Math.min(168, w * 0.15);
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < -30) a.x = w + 30; else if (a.x > w + 30) a.x = -30;
      if (a.y < -30) a.y = h + 30; else if (a.y > h + 30) a.y = -30;
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
        if (d < LINK) {
          const o = (1 - d / LINK);
          x.strokeStyle = 'rgba(70,205,195,' + (o * o * .30) + ')';
          x.lineWidth = .7;
          x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
        }
      }
      const mdx = a.x - mouse.x, mdy = a.y - mouse.y, md = Math.hypot(mdx, mdy);
      let glow = 0;
      if (md < 150) {
        glow = 1 - md / 150;
        x.strokeStyle = 'rgba(246,178,60,' + (glow * glow * .55) + ')';
        x.lineWidth = .85;
        x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(mouse.x, mouse.y); x.stroke();
      }
      const amber = a.amber || glow > .5;
      const col = amber ? '246,178,60' : '95,200,212';
      if (amber || glow > .12) {
        x.fillStyle = 'rgba(' + col + ',' + (.07 + glow * .16) + ')';
        x.beginPath(); x.arc(a.x, a.y, (a.r + 1) * 3.4, 0, 7); x.fill();
      }
      x.fillStyle = 'rgba(' + col + ',' + (.5 + glow * .5) + ')';
      x.beginPath(); x.arc(a.x, a.y, a.r + glow * 1.4, 0, 7); x.fill();
    }
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || !w || !h) return;
    running = true;
    cancelAnimationFrame(raf);
    frame();
  }
  function refresh() { if (size()) build(); }
  function init() { if (size()) { build(); start(); } }

  requestAnimationFrame(() => requestAnimationFrame(init));
  addEventListener('load', () => { refresh(); start(); });
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { refresh(); start(); }).observe(c);
  } else {
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(refresh, 150); });
  }
  addEventListener('mousemove', e => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
  addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
})();
