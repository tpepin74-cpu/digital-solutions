/* Digital Solutions · moteur d'animation (≈7 Ko, aucune dépendance).
   Web Animations API + IntersectionObserver. Respecte prefers-reduced-motion
   et la préférence « pause » de l'utilisateur (persistée). */
(function () {
  if (window.DSMotion) return;
  var d = document, w = window, html = d.documentElement;
  var EASE = 'cubic-bezier(.16,1,.3,1)', INOUT = 'cubic-bezier(.76,0,.24,1)';
  var osReduced = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var prefs = { eco: false, size: 100, spacing: false };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem('ds-a11y') || '{}')); } catch (e) {}
  function still() { return osReduced || prefs.eco; }
  /* Mode sobre : animations coupées + images allégées (Unsplash w ≤ 900, qualité 60). */
  function lighten() {
    d.querySelectorAll('img').forEach(function (img) {
      var src = img.getAttribute('src') || '';
      if (prefs.eco) {
        if (img.__dsOrig || !/unsplash\.com/.test(src)) return;
        img.__dsOrig = src;
        img.setAttribute('src', src.replace(/([?&])w=\d+/, '$1w=900') + (src.indexOf('images.unsplash.com') > -1 ? '&q=55' : ''));
      } else if (img.__dsOrig) { img.setAttribute('src', img.__dsOrig); img.__dsOrig = null; }
    });
    html.setAttribute('data-eco', prefs.eco ? 'on' : 'off');
  }

  var seen = new WeakSet(), loops = [], oneShots = [], scrubs = [], pars = [], heroes = [], hs = [], bars = [];
  var vh = w.innerHeight, ticking = false, bootDelay = 0, scanQueued = false;
  var floatBox, floatImg, floatOn = false, tx = -100, ty = -100, fx = 0, fy = 0;

  function applyPrefs() {
    html.style.fontSize = prefs.size + '%';
    if (d.body) { d.body.style.letterSpacing = prefs.spacing ? '.05em' : ''; d.body.style.wordSpacing = prefs.spacing ? '.14em' : ''; }
  }
  function save() {
    try { localStorage.setItem('ds-a11y', JSON.stringify(prefs)); } catch (e) {}
    w.dispatchEvent(new CustomEvent('ds-prefs', { detail: prefs }));
  }

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); e.target.__dsIn && e.target.__dsIn(); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
  function onView(el, fn) { el.__dsIn = fn; io.observe(el); }
  function prep(el, frames, o) {
    var a = el.animate(frames, Object.assign({ fill: 'both', easing: EASE }, o));
    a.pause(); oneShots.push(a); return a;
  }
  function playAll(list) { return function () { list.forEach(function (a) { a.play(); }); }; }
  function num(el, attr, def) { var v = Number(el.getAttribute(attr)); return isNaN(v) || el.getAttribute(attr) === null ? def : v; }

  function setupLines(el) {
    var base = num(el, 'data-delay', 0) + bootDelay;
    var list = [].map.call(el.querySelectorAll('[data-line]'), function (ln, i) {
      return prep(ln, [{ transform: 'translateY(112%)' }, { transform: 'translateY(0)' }], { duration: 1400, delay: base + i * 120 });
    });
    onView(el, playAll(list));
  }
  function setupReveal(el) {
    var t = el.getAttribute('data-reveal'), dl = num(el, 'data-delay', 0) + bootDelay, list = [];
    if (t === 'img') {
      list.push(prep(el, [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 1500, delay: dl, easing: INOUT }));
      var img = el.querySelector('img');
      if (img) list.push(prep(img, [{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 2200, delay: dl }));
    } else if (t === 'rule') {
      list.push(prep(el, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1600, delay: dl }));
    } else {
      list.push(prep(el, [{ opacity: 0, transform: 'translateY(36px)' }, { opacity: 1, transform: 'none' }], { duration: 1200, delay: dl }));
    }
    onView(el, playAll(list));
  }
  function setupZoom(el) {
    var a = el.animate([{ transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 2800, delay: bootDelay, easing: EASE, fill: 'both' });
    oneShots.push(a);
  }
  function setupLoop(el) {
    var t = el.getAttribute('data-loop'), dur = num(el, 'data-dur', 60) * 1000, a;
    if (t === 'spin') a = el.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: dur, iterations: Infinity });
    else if (t === 'tick') a = el.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 60000, iterations: Infinity, easing: 'steps(60, end)' });
    else if (t === 'flow') a = el.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -24 }], { duration: 1400, iterations: Infinity });
    else if (t === 'pulse') a = el.animate([{ opacity: .25 }, { opacity: 1 }, { opacity: .25 }], { duration: 2600, iterations: Infinity, easing: 'ease-in-out' });
    else if (t === 'drop') a = el.animate([{ transform: 'scaleY(0)', transformOrigin: 'top' }, { transform: 'scaleY(1)', transformOrigin: 'top', offset: .5 }, { transform: 'scaleY(1)', transformOrigin: 'bottom', offset: .5001 }, { transform: 'scaleY(0)', transformOrigin: 'bottom' }], { duration: 2400, iterations: Infinity, easing: 'cubic-bezier(.65,0,.35,1)' });
    if (a) { loops.push(a); if (still()) a.pause(); }
  }
  function setupMarquee(el) {
    var tr = el.firstElementChild; if (!tr) return;
    var a = tr.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: num(el, 'data-marquee', 40) * 1000, iterations: Infinity });
    loops.push(a); if (still()) a.pause();
  }
  function setupHero(el) {
    heroes.push({ el: el, media: el.querySelector('[data-hero-media]'), img: el.querySelector('[data-hero-img]'), content: el.querySelector('[data-hero-content]') });
  }
  function setupH(el) {
    var st = el.querySelector('[data-hscroll-sticky]'), tr = el.querySelector('[data-hscroll-track]');
    if (st && tr) { hs.push({ el: el, st: st, tr: tr, css: st.style.cssText }); layoutH(); }
  }
  function layoutH() {
    hs.forEach(function (h) {
      var on = w.innerWidth >= 900 && !still();
      if (on) {
        if (!h.on) h.css = h.st.style.cssText;
        h.dist = Math.max(0, h.tr.scrollWidth - w.innerWidth);
        h.el.style.height = (h.dist + vh) + 'px';
        h.st.style.position = 'sticky'; h.st.style.top = '0'; h.st.style.height = '100vh'; h.st.style.overflow = 'hidden';
      } else if (h.on) {
        h.el.style.height = ''; h.st.style.cssText = h.css; h.tr.style.transform = '';
      }
      h.on = on;
    });
  }
  function setupHoverList(el) {
    if (!fine) return;
    if (!floatBox) {
      floatBox = d.createElement('div'); floatBox.setAttribute('aria-hidden', 'true');
      floatBox.style.cssText = 'position:fixed;left:0;top:0;width:min(24vw,360px);aspect-ratio:4/5;pointer-events:none;z-index:70;overflow:hidden;opacity:0;transform:translate(-50%,-50%);scale:.8;transition:opacity .45s, scale .7s ' + EASE + ';background:#1A262B';
      floatImg = d.createElement('img'); floatImg.alt = '';
      floatImg.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
      floatBox.appendChild(floatImg); d.body.appendChild(floatBox);
    }
    el.querySelectorAll('[data-hover-src]').forEach(function (row) {
      row.addEventListener('mouseenter', function () { floatImg.src = row.getAttribute('data-hover-src'); floatOn = true; floatBox.style.opacity = '1'; floatBox.style.scale = '1'; });
      row.addEventListener('mouseleave', function () { floatOn = false; floatBox.style.opacity = '0'; floatBox.style.scale = '.8'; });
    });
  }
  function pointerLoop() {
    fx += (tx - fx) * .12; fy += (ty - fy) * .12;
    if (floatBox && floatOn) floatBox.style.translate = (fx + 40) + 'px ' + fy + 'px';
    requestAnimationFrame(pointerLoop);
  }

  function frame() {
    ticking = false;
    var y = w.scrollY, s = still();
    bars.forEach(function (b) { var h = html.scrollHeight - vh; b.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')'; });
    heroes.forEach(function (h) {
      var p = Math.min(1, Math.max(0, y / vh)), k = s ? 0 : p;
      if (h.media) h.media.style.clipPath = k > 0.001 ? 'inset(' + (k * 5) + '% ' + (k * 4) + '% 0 ' + (k * 4) + '% round ' + (k * 36) + 'px)' : '';
      if (h.img) h.img.style.transform = k ? 'translateY(' + (k * 16) + '%)' : '';
      if (h.content) { h.content.style.transform = k ? 'translateY(' + (-k * 10) + 'vh)' : ''; h.content.style.opacity = k ? String(Math.max(0, 1 - k * 1.3)) : ''; }
    });
    scrubs.forEach(function (el) {
      if (s) { el.style.opacity = ''; return; }
      var r = el.getBoundingClientRect(), t = (vh * .88 - r.top) / (vh * .4);
      el.style.opacity = String(.16 + .84 * Math.min(1, Math.max(0, t)));
    });
    pars.forEach(function (el) {
      if (s) { el.style.transform = ''; return; }
      var r = el.parentElement.getBoundingClientRect(), c = r.top + r.height / 2 - vh / 2;
      el.style.transform = 'translate3d(0,' + (-c * num(el, 'data-parallax', .15)) + 'px,0)';
    });
    hs.forEach(function (h) {
      if (!h.on) return;
      var r = h.el.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / (h.dist || 1)));
      h.tr.style.transform = 'translate3d(' + (-p * h.dist) + 'px,0,0)';
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  function each(sel, fn) { d.querySelectorAll(sel).forEach(function (el) { if (!seen.has(el)) { seen.add(el); fn(el); } }); }
  function scan() {
    scanQueued = false;
    var s = still();
    each('[data-lines]', function (el) { if (!s) setupLines(el); });
    each('[data-reveal]', function (el) { if (!s) setupReveal(el); });
    each('[data-hero-zoom]', function (el) { if (!s) setupZoom(el); });
    each('[data-loop]', setupLoop);
    each('[data-marquee]', setupMarquee);
    each('[data-hero]', setupHero);
    each('[data-hscroll]', setupH);
    each('[data-scrub]', function (el) { scrubs.push(el); });
    each('[data-parallax]', function (el) { pars.push(el); });
    each('[data-progress]', function (el) { bars.push(el); });
    each('[data-hover-list]', setupHoverList);
    if (prefs.eco) lighten();
    frame();
  }
  function queueScan() { if (!scanQueued) { scanQueued = true; requestAnimationFrame(scan); } }

  function curtain() {
    var c = d.createElement('div'); c.setAttribute('aria-hidden', 'true'); c.setAttribute('data-ds-curtain', '');
    c.style.cssText = 'position:fixed;inset:0;z-index:500;background:#0B1215;display:grid;place-items:center;pointer-events:none';
    return c;
  }
  function intro() {
    if (still()) return;
    var transit = sessionStorage.getItem('ds-transit'); sessionStorage.removeItem('ds-transit');
    var first = !sessionStorage.getItem('ds-seen'); sessionStorage.setItem('ds-seen', '1');
    if (!transit && !first) return;
    var c = curtain(), wait = 150;
    if (first) {
      c.innerHTML = '<svg width="88" height="88" viewBox="0 0 100 100"><circle cx="46" cy="58" r="30" fill="none" stroke="#F2F0EC" stroke-width="6" stroke-dasharray="189" stroke-dashoffset="189"/><rect x="73" y="8" width="6" height="50" fill="#6DCDEA" style="transform-origin:76px 58px;transform:scaleY(0)"/></svg>';
      c.querySelector('circle').animate([{ strokeDashoffset: 189 }, { strokeDashoffset: 0 }], { duration: 1000, easing: EASE, fill: 'forwards' });
      c.querySelector('rect').animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 600, delay: 650, easing: EASE, fill: 'forwards' });
      wait = 1250;
    }
    d.body.appendChild(c);
    bootDelay = wait + 300;
    setTimeout(function () { bootDelay = 0; }, wait + 2000);
    c.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: 1100, delay: wait, easing: INOUT, fill: 'forwards' }).onfinish = function () { c.remove(); };
  }
  function linkTransitions() {
    d.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || still()) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      var u; try { u = new URL(a.getAttribute('href'), location.href); } catch (er) { return; }
      if (u.origin !== location.origin || !/\.dc\.html$/i.test(u.pathname) || u.pathname === location.pathname) return;
      e.preventDefault(); sessionStorage.setItem('ds-transit', '1');
      var c = curtain(); d.body.appendChild(c);
      c.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 750, easing: INOUT, fill: 'forwards' }).onfinish = function () { location.href = u.href; };
    });
    w.addEventListener('pageshow', function (e) { if (e.persisted) d.querySelectorAll('[data-ds-curtain]').forEach(function (c) { c.remove(); }); });
  }

  function loadEggs() {
    if (d.querySelector('script[data-ds-eggs]')) return;
    var sc = d.createElement('script'); sc.src = 'ds-eggs.js'; sc.async = true; sc.setAttribute('data-ds-eggs', ''); d.head.appendChild(sc);
  }

  function init() {
    applyPrefs(); lighten(); intro(); linkTransitions(); loadEggs();
    scan();
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) if (ms[i].addedNodes.length) { queueScan(); break; } }).observe(d.body, { childList: true, subtree: true });
    w.addEventListener('scroll', onScroll, { passive: true });
    w.addEventListener('resize', function () { vh = w.innerHeight; layoutH(); onScroll(); });
    w.addEventListener('load', function () { layoutH(); onScroll(); });
    if (fine) { d.addEventListener('mousemove', function (e) { if (tx < 0) { fx = e.clientX; fy = e.clientY; } tx = e.clientX; ty = e.clientY; }, { passive: true }); requestAnimationFrame(pointerLoop); }
  }

  window.DSMotion = {
    isPaused: function () { return still(); },
    isEco: function () { return !!prefs.eco; },
    setEco: function (p) { window.DSMotion.setPaused(p); },
    setPaused: function (p) {
      prefs.eco = !!p; save(); lighten();
      if (still()) { oneShots.forEach(function (a) { try { a.finish(); } catch (e) {} }); loops.forEach(function (a) { a.pause(); }); }
      else { loops.forEach(function (a) { a.play(); }); }
      layoutH(); frame();
    },
    getSize: function () { return prefs.size; },
    setSize: function (v) { prefs.size = v; applyPrefs(); save(); layoutH(); },
    getSpacing: function () { return prefs.spacing; },
    setSpacing: function (v) { prefs.spacing = !!v; applyPrefs(); save(); layoutH(); },
    rescan: queueScan
  };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
