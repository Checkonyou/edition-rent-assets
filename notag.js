(() => {
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const BARS = 88;
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; } return h; };
  const seeded = (seed) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; }; };

  document.querySelectorAll('.track').forEach((row, i) => {
    const svg = row.querySelector('.wave svg');
    if (!svg) return;
    const name = row.querySelector('.t-name')?.textContent || `t${i}`;
    const rand = seeded(hash(name));
    const W = 400, H = 32, gap = 2;
    const barW = (W - gap * (BARS - 1)) / BARS;
    let html = '';
    for (let b = 0; b < BARS; b++) {
      const t = b / BARS;
      const env = 0.42 + 0.5 * Math.sin(t * Math.PI * 1.6 + rand() * 0.4) + 0.18 * Math.sin(t * Math.PI * 6 + rand());
      const jitter = (rand() - 0.5) * 0.55;
      const v = Math.max(0.10, Math.min(1, env * 0.6 + jitter * 0.45));
      const h = Math.max(2, v * H);
      html += `<rect x="${(b*(barW+gap)).toFixed(2)}" y="${((H-h)/2).toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" />`;
    }
    svg.innerHTML = html;
  });

  let active = null;
  const stop = () => {
    if (!active) return;
    cancelAnimationFrame(active.raf);
    active.row.classList.remove('is-playing');
    active.row.querySelectorAll('.wave rect').forEach(r => r.classList.remove('is-passed'));
    active = null;
  };
  document.querySelectorAll('.track').forEach(row => {
    const btn = row.querySelector('.play');
    const bars = Array.from(row.querySelectorAll('.wave rect'));
    const dur = (() => {
      const m = row.querySelector('.t-meta')?.textContent.match(/(\d+):(\d+)/);
      return m ? (parseInt(m[1])*60 + parseInt(m[2])) * 1000 : 180000;
    })();
    btn.addEventListener('click', () => {
      if (active && active.row === row) { stop(); return; }
      stop();
      row.classList.add('is-playing');
      const start = performance.now();
      const tick = (now) => {
        const p = ((now - start) % dur) / dur;
        const idx = Math.floor(p * bars.length);
        bars.forEach((b, i) => b.classList.toggle('is-passed', i <= idx));
        active.raf = requestAnimationFrame(tick);
      };
      active = { row, raf: 0 };
      active.raf = requestAnimationFrame(tick);
    });
  });
})();
