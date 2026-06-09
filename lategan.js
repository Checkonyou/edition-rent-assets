/* LATEGAN INTERNATIONAL — interaction layer */
(function () {
  'use strict';

  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- custom cursor (lerped ring) ---------- */
  if (fine) {
    var dot = document.getElementById('cursor');
    var ring = document.getElementById('cursorRing');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    var map = { hover: 'is-hover', view: 'is-view', text: 'is-text' };
    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      var cls = map[el.getAttribute('data-cursor')];
      el.addEventListener('mouseenter', function () { ring.classList.add(cls); });
      el.addEventListener('mouseleave', function () { ring.classList.remove(cls); });
    });
  }

  /* ---------- nav scrolled + float CTA ---------- */
  var nav = document.getElementById('navbar');
  var float = document.querySelector('.cta-float');
  var hero = document.querySelector('.hero');
  function onScroll() {
    var y = scrollY;
    nav.classList.toggle('scrolled', y > 40);
    if (float) float.classList.toggle('show', y > innerHeight * 0.9);
    /* hero parallax — transform only */
    if (hero && !reduce && y < innerHeight) {
      var media = hero.querySelector('.hero-media');
      if (media) media.style.transform = 'translateY(' + y * 0.28 + 'px)';
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var menu = document.getElementById('mobileMenu');
  document.getElementById('hamburger').addEventListener('click', function () { menu.classList.add('open'); });
  document.getElementById('closeMenu').addEventListener('click', function () { menu.classList.remove('open'); });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { menu.classList.remove('open'); });
  });

  /* ---------- scroll reveals ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- count-up stats ---------- */
  function countUp(el) {
    var target = +el.getAttribute('data-count'), dur = 1400, start = 0, t0;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(start + (target - start) * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var statObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { countUp(e.target); statObs.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) {
    if (reduce) { el.textContent = el.getAttribute('data-count'); }
    else statObs.observe(el);
  });

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) {
    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + x * 0.18 + 'px,' + y * 0.28 + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* ---------- divider parallax ---------- */
  var dImg = document.querySelector('.divider-img');
  if (dImg && !reduce) {
    var dWrap = document.querySelector('.divider');
    addEventListener('scroll', function () {
      var r = dWrap.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) {
        var prog = (innerHeight - r.top) / (innerHeight + r.height);
        dImg.style.transform = 'translateY(' + (prog - 0.5) * 80 + 'px)';
      }
    }, { passive: true });
  }

  /* ---------- form ---------- */
  var form = document.getElementById('kontaktForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      document.getElementById('formSuccess').classList.add('show');
      form.reset();
    });
  }

  /* ---------- year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
