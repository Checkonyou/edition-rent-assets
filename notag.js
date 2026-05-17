(() => {
  const nav = document.querySelector('.nav');
  const burger = document.querySelector('.nav-burger');
  const links = document.querySelector('.nav-links');

  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger?.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
  }));

  // Waveform generation: deterministic per-track silhouette
  const BARS = 96;
  const hash = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h;
  };
  const seeded = (seed) => {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };
  };

  document.querySelectorAll('.track').forEach((row, i) => {
    const svg = row.querySelector('.track-wave svg');
    if (!svg) return;
    const title = row.querySelector('.track-title')?.textContent || `t${i}`;
    const rand = seeded(hash(title));
    const W = 400, H = 40, gap = 2;
    const barW = (W - gap * (BARS - 1)) / BARS;
    let html = '';
    for (let b = 0; b < BARS; b++) {
      // Two overlaid envelopes to feel like a real audio waveform
      const t = b / BARS;
      const envelope = 0.42 + 0.5 * Math.sin(t * Math.PI * 1.6 + rand() * 0.4) + 0.18 * Math.sin(t * Math.PI * 6 + rand());
      const jitter = (rand() - 0.5) * 0.55;
      const v = Math.max(0.08, Math.min(1, envelope * 0.6 + jitter * 0.45));
      const h = Math.max(2, v * H);
      const x = b * (barW + gap);
      const y = (H - h) / 2;
      html += `<rect data-i="${b}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" />`;
    }
    svg.innerHTML = html;
  });

  // Mock-playback: progress sweep across the waveform.
  // Visual-only by design (no audio file 404s); easy to swap to real <audio> later.
  let active = null;
  const stopActive = () => {
    if (!active) return;
    cancelAnimationFrame(active.raf);
    active.row.classList.remove('is-playing');
    active.row.querySelector('.track-play').setAttribute('aria-label', `Play ${active.title}`);
    active.row.querySelectorAll('.track-wave rect').forEach(r => r.classList.remove('is-passed'));
    active = null;
  };
  document.querySelectorAll('.track').forEach(row => {
    const btn = row.querySelector('.track-play');
    const bars = Array.from(row.querySelectorAll('.track-wave rect'));
    const title = row.querySelector('.track-title')?.firstChild?.textContent?.trim() || 'track';
    const durText = row.querySelector('.track-meta span:last-child')?.textContent || '3:00';
    const [m, s] = durText.split(':').map(Number);
    const durMs = ((m * 60 + s) * 1000) || 180000;

    btn.addEventListener('click', () => {
      if (active && active.row === row) { stopActive(); return; }
      stopActive();
      row.classList.add('is-playing');
      btn.setAttribute('aria-label', `Pause ${title}`);
      const start = performance.now();
      const tick = (now) => {
        const elapsed = (now - start);
        const p = (elapsed % durMs) / durMs;
        const idx = Math.floor(p * bars.length);
        bars.forEach((b, i) => b.classList.toggle('is-passed', i <= idx));
        active.raf = requestAnimationFrame(tick);
      };
      active = { row, raf: 0, title };
      active.raf = requestAnimationFrame(tick);
    });
  });

  // Reveal-on-scroll
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    document.querySelectorAll('.section-head, .track, .service, .credits-list li, .credits-pull, .contact-form, .manifesto-grid p, .manifesto-title').forEach(el => {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  // Form submission feedback
  const form = document.querySelector('.contact-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const note = form.querySelector('.form-note');
    btn.textContent = 'Sent →';
    btn.style.background = 'var(--accent-hi)';
    if (note) note.textContent = 'Got it. You\'ll hear back within 48 hours.';
    form.querySelectorAll('input, textarea, select').forEach(el => el.value = '');
  });
})();
