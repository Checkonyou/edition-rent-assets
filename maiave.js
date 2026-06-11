/* ============================================================
   maiave — interactions
   ============================================================ */

/* Progressive enhancement: erst jetzt dürfen Reveal/Intro verstecken.
   Läuft dieser Code nicht, bleibt die ganze Seite sichtbar. */
document.documentElement.classList.add('js-anim');

/* ---- intro reveal (öffnet von der Mitte) ---- */
const intro = document.getElementById('intro');
if (intro) {
  const HOLD = 380;   // kurzer schwarzer Moment
  const OPEN = 1100;  // Dauer des Aufgehens
  // erst schwarz halten, dann von der Mitte aufgehen
  setTimeout(() => document.body.classList.add('intro-done'), HOLD);
  // Overlay nach der Animation entfernen
  setTimeout(() => intro.classList.add('is-hidden'), HOLD + OPEN);
}

/* ---- sticky nav ---- */
const nav = document.getElementById('navbar');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---- mobile menu ---- */
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}
window.toggleMenu = toggleMenu;

/* ---- reveal on scroll ---- */
const revealEls = document.querySelectorAll('.reveal');
const showAll = () => revealEls.forEach((el) => el.classList.add('visible'));
if ('IntersectionObserver' in window) {
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach((el) => revealObs.observe(el));
  // Failsafe: sollte der Observer (z. B. in Webflow) nicht auslösen, alles zeigen
  setTimeout(() => revealEls.forEach((el) => {
    if (!el.classList.contains('visible')) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('visible');
    }
  }), 1500);
} else {
  showAll();
}

/* ---- animated stat counters ---- */
const fmt = (n) => n.toLocaleString('de-DE');
function countUp(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  const dur = 1600;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(Math.round(target * eased)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const statObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      countUp(e.target);
      statObs.unobserve(e.target);
    }
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach((el) => statObs.observe(el));

/* ---- contact form: conditional detail blocks ---- */
const modeBlocks = document.querySelectorAll('[data-mode-block]');
function syncMode() {
  const checked = document.querySelector('input[name="anliegen"]:checked');
  const mode = checked ? checked.dataset.mode : 'owner';
  modeBlocks.forEach((b) => {
    const show = b.dataset.modeBlock === mode;
    b.classList.toggle('show', show);
    // disable hidden inputs so they don't submit stale data
    b.querySelectorAll('input,select,textarea').forEach((f) => { f.disabled = !show; });
  });
}
document.querySelectorAll('input[name="anliegen"]').forEach((r) => {
  r.addEventListener('change', syncMode);
});
syncMode();

/* ---- budget slider output ---- */
const budget = document.getElementById('budget');
const budgetOut = document.getElementById('budgetOut');
if (budget && budgetOut) {
  const renderBudget = () => {
    const v = parseInt(budget.value, 10);
    budgetOut.textContent = v >= 2000000 ? '2 Mio. €+' : fmt(v) + ' €';
  };
  budget.addEventListener('input', renderBudget);
  renderBudget();
}

/* ---- form submit ---- */
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    form.style.display = 'none';
    document.querySelector('.form-progress').style.display = 'none';
    const ok = document.getElementById('formSuccess');
    ok.classList.add('show');
    ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
