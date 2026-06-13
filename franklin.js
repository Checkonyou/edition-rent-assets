// Franklin Massage Studio — quiet interactions only.

// Intro screen: a brief brand reveal, then lift away.
(function () {
  const intro = document.getElementById('introScreen');
  if (!intro) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('intro-active');
  const dismiss = () => {
    intro.classList.add('done');
    document.body.classList.remove('intro-active');
    setTimeout(() => intro.remove(), 1200);
  };
  if (reduce) { dismiss(); }
  else { window.setTimeout(dismiss, 2300); }
})();

// Nav background on scroll
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Mobile menu
const menu = document.getElementById('mobileMenu');
const toggle = document.getElementById('navToggle');
const openMenu = () => { menu.classList.add('open'); toggle?.setAttribute('aria-expanded', 'true'); };
const closeMenu = () => { menu.classList.remove('open'); toggle?.setAttribute('aria-expanded', 'false'); };
toggle?.addEventListener('click', openMenu);
document.getElementById('menuClose')?.addEventListener('click', closeMenu);
menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

// Reveal on scroll
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

// Graceful image fallback: a failed photo collapses to its warm panel.
document.querySelectorAll('img[data-photo]').forEach((img) => {
  img.addEventListener('error', () => { img.style.display = 'none'; });
});
