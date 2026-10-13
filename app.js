/* Kango — a springy trampoline mat with bouncing balls, and a visit price calculator */
(() => {
  'use strict';
  const M = window.Motion || { $: (s, r = document) => r.querySelector(s), $$: (s, r = document) => Array.from(r.querySelectorAll(s)), motion: false, fine: false, reduce: true, ready: (f) => f(), toast() {} };
  const { $, $$ } = M;
  const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  /* Trampoline mat */
  const cv = $('#mat');
  const hero = $('.hero');
  if (cv && cv.getContext && hero) {
    const ctx = cv.getContext('2d');
    const jumps = $('#jumps');
    const COLORS = ['#c6ff3b', '#ff5c9d', '#4fe0ff', '#ffd23b'];
    let W = 0, H = 0, N = 0, base = 0, dpr = 1;
    let h = [], v = [];
    const balls = [];
    let count = 0, raf = 0, last = 0, visible = true;
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      N = Math.max(24, Math.round(W / 22));
      base = H - Math.max(70, H * 0.17);
      h = new Array(N + 1).fill(0); v = new Array(N + 1).fill(0);
    };
    const matY = (x) => {
      const f = Math.max(0, Math.min(N, (x / W) * N));
      const i = Math.floor(f), t = f - i;
      return base + (h[i] || 0) * (1 - t) + (h[Math.min(N, i + 1)] || 0) * t;
    };
    const push = (x, amt) => {
      const c = (x / W) * N;
      for (let i = 0; i <= N; i++) {
        const d = Math.abs(i - c);
        if (d < 5) v[i] += amt * Math.cos((d / 5) * Math.PI / 2) ** 2;
      }
    };
    const spawn = (x, y) => {
      if (balls.length >= 9) balls.shift();
      balls.push({ x, y, vx: (Math.random() - 0.5) * 220, vy: 0, r: 17 + Math.random() * 11, c: COLORS[(Math.random() * COLORS.length) | 0], boost: 1 });
    };
    const matStep = (dt) => {
      for (let i = 0; i <= N; i++) {
        const l = i ? h[i - 1] : 0, r = i < N ? h[i + 1] : 0;
        v[i] += (-120 * h[i] + 1800 * (l + r - 2 * h[i]) - 4 * v[i]) * dt;
      }
      for (let i = 0; i <= N; i++) h[i] += v[i] * dt;
    };
    const step = (dt) => {
      matStep(dt / 2); matStep(dt / 2);
      for (const b of balls) {
        b.vy += 1500 * dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
        const my = matY(b.x);
        if (b.y + b.r > my && b.vy > 0) {
          b.y = my - b.r;
          const hit = Math.min(1400, b.vy);
          push(b.x, hit * 0.5);
          b.vy = -Math.max(hit * 0.92, 980 * b.boost);
          if (b.vy < -1250) b.vy = -1250;
          b.boost = 1;
          count++;
          if (jumps) jumps.textContent = count;
        }
      }
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // shadows on the mat
      for (const b of balls) {
        const my = matY(b.x), d = Math.max(0, my - b.y - b.r);
        const k = Math.max(0.15, 1 - d / 500);
        ctx.fillStyle = 'rgba(0,0,0,' + (0.28 * k).toFixed(3) + ')';
        ctx.beginPath(); ctx.ellipse(b.x, my + 4, b.r * 1.5 * k, 5 * k, 0, 0, 6.3); ctx.fill();
      }
      // mat body
      const g = ctx.createLinearGradient(0, base - 30, 0, H);
      g.addColorStop(0, '#2a2270'); g.addColorStop(1, '#120f2e');
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let i = 0; i <= N; i++) ctx.lineTo((i / N) * W, base + h[i]);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      // bright edge
      ctx.beginPath();
      for (let i = 0; i <= N; i++) { const x = (i / N) * W, y = base + h[i]; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.lineWidth = 5; ctx.lineJoin = 'round';
      const e = ctx.createLinearGradient(0, 0, W, 0);
      e.addColorStop(0, '#ff5c9d'); e.addColorStop(0.5, '#c6ff3b'); e.addColorStop(1, '#4fe0ff');
      ctx.strokeStyle = e; ctx.stroke();
      // springs under the mat
      ctx.strokeStyle = 'rgba(244,241,255,.12)'; ctx.lineWidth = 2;
      for (let i = 2; i < N; i += 4) {
        const x = (i / N) * W, y = base + h[i];
        ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x, H); ctx.stroke();
      }
      for (const b of balls) {
        const gr = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.1, b.x, b.y, b.r);
        gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, b.c); gr.addColorStop(1, 'rgba(0,0,0,.35)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.3); ctx.fill();
      }
    };
    const loop = (now) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(0.02, (now - last) / 1000 || 0.016);
      last = now;
      step(dt); draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    size();
    draw();
    if (M.motion) {
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) start(); }).observe(hero);
      const local = (e) => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
      // the title and buttons sit above the canvas, so listen on the hero itself
      hero.addEventListener('pointerdown', (e) => {
        if (e.target.closest('a,button')) return;
        const [x, y] = local(e);
        spawn(x, Math.min(y, base - 40));
      });
      hero.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const [x, y] = local(e);
        if (y > base - 30) push(x, 18);
      });
      let lw = innerWidth;
      addEventListener('resize', () => { if (innerWidth !== lw) { lw = innerWidth; size(); } });
      M.ready(() => {
        [0.22, 0.5, 0.78].forEach((p, i) => setTimeout(() => spawn(W * p, base - 260 - i * 70), 500 + i * 380));
        start();
      });
    }
  }

  /* Calculator (prices: Kango price list in 2GIS, updated 20 May 2026) */
  const form = $('#calc');
  if (form) {
    const P = {
      arena: { n: 'Батутная арена', wk: { 30: 4600, 60: 6500 }, we: { 30: 5700, 60: 7300 } },
      vr: { n: 'VR', wk: { 30: 3800, 60: 6400 }, we: { 30: 4400, 60: 6900 } },
      maze: { n: 'Детский лабиринт', wk: { 30: 2000, 60: 3500 }, we: { 30: 2500, 60: 4000 } },
    };
    const SOCKS = 1200;
    const q = { n: 2 };
    const sumEl = $('#sum');
    const el = { t: $('#r-t'), tp: $('#r-tp'), sr: $('#r-sr'), s: $('#r-s'), sp: $('#r-sp'), per: $('#per'), qn: $('#qn') };
    const val = (name) => (form.querySelector('input[name=' + name + ']:checked') || {}).value;
    const pairs = (n) => (n % 10 === 1 && n % 100 !== 11 ? ' пара' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? ' пары' : ' пар');
    let shown = +sumEl.dataset.v || 0, raf = 0;
    const anim = (to) => {
      cancelAnimationFrame(raf);
      if (!M.motion) { shown = to; sumEl.textContent = fmt(to); return; }
      const from = shown, t0 = performance.now();
      const run = (now) => {
        const k = Math.min(1, (now - t0) / 480), e = 1 - Math.pow(1 - k, 3);
        shown = from + (to - from) * e;
        sumEl.textContent = fmt(shown);
        if (k < 1) raf = requestAnimationFrame(run);
      };
      raf = requestAnimationFrame(run);
    };
    const bookN = $('#book-n');
    let note = '';
    const render = () => {
      const prog = val('prog'), day = val('day'), dur = val('dur');
      const each = P[prog][day][dur];
      const tickets = each * q.n;
      const socks = $('#socks').checked ? SOCKS * q.n : 0;
      const total = tickets + socks;
      el.qn.textContent = q.n;
      el.t.textContent = P[prog].n + ', ' + (dur === '60' ? '1 час' : '30 минут') + ', ' + (day === 'wk' ? 'будни' : 'выходные') + ' × ' + q.n;
      el.tp.textContent = fmt(tickets) + ' ₸';
      el.sr.hidden = !socks;
      el.s.textContent = 'Носки, ' + q.n + pairs(q.n);
      el.sp.textContent = fmt(socks) + ' ₸';
      el.per.textContent = fmt(total / q.n) + ' ₸';
      anim(total);
      if (bookN) bookN.value = q.n;
      note = 'Посчитали на сайте: ' + P[prog].n + ', ' + (dur === '60' ? '1 час' : '30 минут') + ', ' + (day === 'wk' ? 'будни' : 'выходные') + ', ' + q.n + ' чел., ' + fmt(total) + ' ₸' + (socks ? ' (с носками)' : '') + '.';
    };
    form.addEventListener('change', render);
    $$('.qty button', form).forEach((b) => b.addEventListener('click', () => { q.n = Math.max(1, Math.min(60, q.n + +b.dataset.d)); render(); }));
    const bf = $('#book-form');
    if (bf) {
      bf.waExtra = () => note;
      if (bookN) bookN.addEventListener('input', () => { const n = Math.max(1, Math.min(60, +bookN.value || 1)); q.n = n; render(); });
    }
    // weekend by default when today is Saturday or Sunday in Astana (UTC+5)
    const dow = new Date(Date.now() + 5 * 3600e3).getUTCDay();
    if (dow === 0 || dow === 6) { const we = form.querySelector('input[name=day][value=we]'); if (we) we.checked = true; }
    render();
  }
})();
