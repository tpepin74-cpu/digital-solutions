/* Digital Solutions · scènes d'arrière-plan décrites dans ds-scenes.json (Canvas 2D, aucune dépendance).
   Usage : <section data-bg="network">. Mouvement réduit → image fixe ; mode sobre → masquées. */
(function () {
  if (window.__dsScenes) return; window.__dsScenes = true;
  var d = document, w = window, TAU = Math.PI * 2;
  var osReduced = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function eco() { return w.DSMotion ? w.DSMotion.isEco() : false; }
  function still() { return osReduced || eco(); }
  var DEF = null, items = [], raf = 0, last = 0, queued = false;

  function rng(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var TYPES = {
    network: {
      init: function (c, W, H, R) {
        var n = clamp(Math.round(W * H * c.density), c.min, c.max), nodes = [];
        for (var i = 0; i < n; i++) { var hub = R() < c.hubs; nodes.push({ x: R() * W, y: R() * H, vx: (R() - .5) * c.speed * 2, vy: (R() - .5) * c.speed * 2, r: hub ? c.hubR : c.nodeR, hub: hub, f: 0 }); }
        return { nodes: nodes, pulses: [], acc: 0, R: R };
      },
      draw: function (x, s, c, W, H, t, dt) {
        var N = s.nodes, L = c.link, L2 = L * L, i, j, a, b, dx, dy, q;
        for (i = 0; i < N.length; i++) { a = N[i]; a.x += a.vx * dt; a.y += a.vy * dt; if (a.x < -20) a.x = W + 20; if (a.x > W + 20) a.x = -20; if (a.y < -20) a.y = H + 20; if (a.y > H + 20) a.y = -20; a.f = Math.max(0, a.f - dt * 1.6); }
        x.strokeStyle = c.color; x.lineWidth = 1;
        for (i = 0; i < N.length; i++) for (j = i + 1; j < N.length; j++) {
          dx = N[i].x - N[j].x; dy = N[i].y - N[j].y; q = dx * dx + dy * dy;
          if (q < L2) { x.globalAlpha = (1 - Math.sqrt(q) / L) * c.lineA; x.beginPath(); x.moveTo(N[i].x, N[i].y); x.lineTo(N[j].x, N[j].y); x.stroke(); }
        }
        s.acc += dt * c.pulseRate;
        while (s.acc > 1) {
          s.acc--; a = N[Math.floor(s.R() * N.length)];
          for (j = 0; j < N.length; j++) { b = N[(j + Math.floor(s.R() * N.length)) % N.length]; dx = a.x - b.x; dy = a.y - b.y; if (b !== a && dx * dx + dy * dy < L2 * .7) { s.pulses.push({ a: a, b: b, p: 0 }); break; } }
        }
        x.fillStyle = c.pulse; x.globalAlpha = .9;
        s.pulses = s.pulses.filter(function (p) {
          p.p += dt * c.pulseSpeed; if (p.p >= 1) { p.b.f = 1; return false; }
          x.beginPath(); x.arc(p.a.x + (p.b.x - p.a.x) * p.p, p.a.y + (p.b.y - p.a.y) * p.p, 2.2, 0, TAU); x.fill(); return true;
        });
        x.fillStyle = c.color;
        for (i = 0; i < N.length; i++) {
          a = N[i]; x.globalAlpha = .55 + a.f * .45; x.beginPath(); x.arc(a.x, a.y, a.r + a.f * 2.5, 0, TAU); x.fill();
          if (a.hub) { x.globalAlpha = .25 + a.f * .5; x.beginPath(); x.arc(a.x, a.y, a.r + 6 + a.f * 6, 0, TAU); x.stroke(); }
        }
        x.globalAlpha = 1;
      }
    },
    circuit: {
      init: function (c, W, H, R) {
        var DIR = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]], g = c.step;
        var n = clamp(Math.round(W * H * c.density), c.min, c.max), tr = [];
        for (var i = 0; i < n; i++) {
          var px = Math.floor(R() * (W / g)) * g, py = Math.floor(R() * (H / g)) * g, di = Math.floor(R() * 4) * 2, pts = [[px, py]], segs = 2 + Math.floor(R() * 3);
          for (var k = 0; k < segs; k++) {
            var len = 1 + Math.floor(R() * c.maxLen); px += DIR[di][0] * g * len; py += DIR[di][1] * g * len; pts.push([px, py]);
            di = (di + (R() < .5 ? 1 : 7)) % 8;
          }
          var cum = [0], tot = 0;
          for (k = 1; k < pts.length; k++) { tot += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); cum.push(tot); }
          tr.push({ pts: pts, cum: cum, L: tot, off: R() * (tot + c.gap), v: c.speed * (.6 + R() * .8) });
        }
        return { tr: tr };
      },
      draw: function (x, s, c, W, H, t) {
        x.strokeStyle = c.color; x.fillStyle = c.color; x.lineWidth = 1.2; x.lineJoin = 'round';
        s.tr.forEach(function (r) {
          var P = r.pts, k; x.globalAlpha = c.lineA; x.beginPath(); x.moveTo(P[0][0], P[0][1]);
          for (k = 1; k < P.length; k++) x.lineTo(P[k][0], P[k][1]); x.stroke();
          x.globalAlpha = c.lineA * 1.6;
          [P[0], P[P.length - 1]].forEach(function (p) { x.beginPath(); x.arc(p[0], p[1], 3, 0, TAU); x.stroke(); });
          var sPos = (r.off + t * r.v) % (r.L + c.gap); if (sPos > r.L + 30) return;
          for (var q = 0; q < 10; q++) {
            var d0 = sPos - q * 4; if (d0 < 0 || d0 > r.L) continue;
            for (k = 1; k < r.cum.length && r.cum[k] < d0; k++);
            var f = (d0 - r.cum[k - 1]) / ((r.cum[k] - r.cum[k - 1]) || 1);
            x.globalAlpha = (1 - q / 10) * .9; x.beginPath();
            x.arc(P[k - 1][0] + (P[k][0] - P[k - 1][0]) * f, P[k - 1][1] + (P[k][1] - P[k - 1][1]) * f, q ? 1.4 : 2.4, 0, TAU); x.fill();
          }
        });
        x.globalAlpha = 1;
      }
    },
    wave: {
      init: function () { return {}; },
      draw: function (x, s, c, W, H, t) {
        x.fillStyle = c.color; var g = c.gap, k = c.k, sp = c.speed; t += c.phase || 0;
        for (var y = g / 2; y < H; y += g) for (var X = g / 2; X < W; X += g) {
          var v = (Math.sin(X * k + t * sp) + Math.sin(y * k * 1.3 - t * sp * .8) + Math.sin((X + y) * k * .5 + t * sp * .5)) / 6 + .5;
          x.globalAlpha = c.a0 + v * c.a1; x.beginPath(); x.arc(X, y, c.r0 + v * c.r1, 0, TAU); x.fill();
        }
        x.globalAlpha = 1;
      }
    },
    flow: {
      init: function (c, W, H, R) {
        var L = [];
        for (var i = 0; i < c.lines; i++) {
          var dots = []; for (var k = 0; k < c.dots; k++) dots.push(R());
          L.push({ y0: H * (i + .5) / c.lines + (R() - .5) * 20, amp: c.amp * (.5 + R()), fr: c.freq * (.6 + R() * .8), ph: R() * TAU, sp: c.speed * (.6 + R() * .8), dots: dots, dv: c.dotSpeed * (.6 + R() * .8) });
        }
        return { L: L };
      },
      draw: function (x, s, c, W, H, t) {
        x.strokeStyle = c.color; x.fillStyle = c.color; x.lineWidth = 1.1;
        s.L.forEach(function (l) {
          function Y(X) { return l.y0 + l.amp * Math.sin(X * l.fr + l.ph + t * l.sp) + l.amp * .4 * Math.sin(X * l.fr * 2.3 + l.ph * 1.7 - t * l.sp * .6); }
          x.globalAlpha = c.lineA; x.beginPath(); x.moveTo(0, Y(0));
          for (var X = 12; X <= W + 12; X += 12) x.lineTo(X, Y(X)); x.stroke();
          l.dots.forEach(function (o) {
            var px = ((o + t * l.dv) % 1) * (W + 120) - 60;
            for (var q = 0; q < 8; q++) { var qx = px - q * 7; x.globalAlpha = (1 - q / 8) * .85; x.beginPath(); x.arc(qx, Y(qx), q ? 1.3 : 2.4, 0, TAU); x.fill(); }
          });
        });
        x.globalAlpha = 1;
      }
    },
    dial: {
      init: function () { return {}; },
      draw: function (x, s, c, W, H, t) {
        var cx = W * c.cx, cy = H * c.cy, R = Math.min(W, H) * c.r, a0 = t * c.spin * TAU, i, a;
        x.strokeStyle = c.color; x.fillStyle = c.color;
        for (i = 0; i < 60; i++) {
          a = a0 + i * TAU / 60; var long = i % 5 === 0, r1 = R - (long ? 16 : 7);
          x.globalAlpha = c.lineA * (long ? 1.5 : .9); x.lineWidth = long ? 2 : 1;
          x.beginPath(); x.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.stroke();
        }
        x.lineWidth = 1; x.globalAlpha = c.lineA; x.setLineDash([2, 7]); x.lineDashOffset = -t * 6;
        x.beginPath(); x.arc(cx, cy, R * .78, 0, TAU); x.stroke(); x.setLineDash([]);
        x.beginPath(); x.arc(cx, cy, R * 1.14, 0, TAU); x.stroke();
        for (i = 0; i < 12; i++) { a = -a0 * 1.6 + i * TAU / 12; x.globalAlpha = c.lineA * 1.4; x.beginPath(); x.arc(cx + Math.cos(a) * R * .56, cy + Math.sin(a) * R * .56, 2, 0, TAU); x.fill(); }
        var sec = (t % 60) / 60 * TAU - Math.PI / 2;
        x.globalAlpha = .8; x.lineWidth = 1.4; x.beginPath(); x.moveTo(cx - Math.cos(sec) * R * .14, cy - Math.sin(sec) * R * .14); x.lineTo(cx + Math.cos(sec) * R * .9, cy + Math.sin(sec) * R * .9); x.stroke();
        x.globalAlpha = .55; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, R * 1.14, -Math.PI / 2, sec); x.stroke();
        var sat = t * .25; x.globalAlpha = .9; x.beginPath(); x.arc(cx + Math.cos(sat) * R * 1.14, cy + Math.sin(sat) * R * 1.14, 3.2, 0, TAU); x.fill();
        x.beginPath(); x.arc(cx, cy, 4, 0, TAU); x.fill();
        x.globalAlpha = 1; x.lineWidth = 1;
      }
    },
    tokens: {
      init: function (c, W, H, R) {
        var rows = [], n = Math.max(1, Math.floor(H / c.rowH));
        for (var i = 0; i < n; i++) {
          var its = [], X = 0, rw = Math.max(W + 300, 900);
          while (X < rw) { var wd = c.words[Math.floor(R() * c.words.length)]; its.push({ s: wd, x: X, hi: R() < c.hi }); X += wd.length * c.charW + 40 + R() * 90; }
          rows.push({ y: c.rowH * (i + .7), sp: (R() < .5 ? -1 : 1) * c.speed * (.4 + R() * .9), its: its, rw: X, a: .5 + R() * .5 });
        }
        return { rows: rows };
      },
      draw: function (x, s, c, W, H, t) {
        x.font = c.font; x.textBaseline = 'middle';
        s.rows.forEach(function (r) {
          r.its.forEach(function (it) {
            var X = ((it.x + t * r.sp) % r.rw + r.rw) % r.rw - 150; if (X > W + 20) return;
            x.fillStyle = it.hi ? c.hiColor : c.color; x.globalAlpha = it.hi ? (c.hiA || .2) : c.a * r.a * 2; x.fillText(it.s, X, r.y);
          });
        });
        x.globalAlpha = 1;
      }
    }
  };

  function size(it) {
    var r = it.host.getBoundingClientRect(), W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height));
    if (W === it.W && H === it.H) return;
    var dpr = Math.min(w.devicePixelRatio || 1, 1.75, Math.sqrt(4e6 / (W * H)));
    it.W = W; it.H = H; it.c.width = Math.round(W * dpr); it.c.height = Math.round(H * dpr); it.x.setTransform(dpr, 0, 0, dpr, 0, 0);
    it.st = it.T.init(it.cfg, W, H, rng(it.cfg.seed || 7));
    if (still()) it.t = 9;
    paint(it, still() ? 0 : .016);
  }
  function paint(it, dt) { it.x.clearRect(0, 0, it.W, it.H); it.T.draw(it.x, it.st, it.cfg, it.W, it.H, it.t, dt); }

  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { var it = e.target.__dsScene; if (it) it.vis = e.isIntersecting; }); kick(); }, { rootMargin: '100px 0px' });
  var ro = new ResizeObserver(function (es) { es.forEach(function (e) { var it = e.target.__dsScene; if (it) size(it); }); });

  function mount(host) {
    var cfg = DEF[host.getAttribute('data-bg')], T = cfg && TYPES[cfg.type]; if (!T) return;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.style.isolation = 'isolate';
    var c = d.createElement('canvas'), mask = host.getAttribute('data-bg-mask') || cfg.mask;
    c.setAttribute('aria-hidden', 'true'); c.setAttribute('data-ds-scene', '');
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;opacity:' + (cfg.opacity != null ? cfg.opacity : 1) + ';display:' + (eco() ? 'none' : 'block') + (mask && mask !== 'none' ? ';-webkit-mask-image:' + mask + ';mask-image:' + mask : '');
    host.appendChild(c);
    var it = { host: host, c: c, x: c.getContext('2d'), cfg: cfg, T: T, t: 0, vis: false };
    host.__dsScene = it; items.push(it); size(it); io.observe(host); ro.observe(host);
  }
  function scan() {
    queued = false; if (!DEF) return;
    items = items.filter(function (it) { if (it.host.isConnected && it.c.isConnected) return true; io.unobserve(it.host); ro.unobserve(it.host); it.host.__dsScene = null; return false; });
    d.querySelectorAll('[data-bg]').forEach(function (h) { if (!h.__dsScene) mount(h); });
  }
  function loop(now) {
    raf = 0; if (still() || d.hidden) { last = 0; return; }
    var dt = last ? Math.min(.05, (now - last) / 1000) : .016, any = false; last = now;
    items.forEach(function (it) { if (!it.vis) return; any = true; it.t += dt; paint(it, dt); });
    if (any) raf = requestAnimationFrame(loop); else last = 0;
  }
  function kick() {
    var e = eco();
    items.forEach(function (it) { it.c.style.display = e ? 'none' : 'block'; });
    if (still()) { if (!e) items.forEach(function (it) { paint(it, 0); }); return; }
    if (!raf) raf = requestAnimationFrame(loop);
  }

  fetch('ds-scenes.json').then(function (r) { return r.json(); }).then(function (j) {
    DEF = j.scenes || {}; scan(); kick();
    new MutationObserver(function () { if (!queued) { queued = true; requestAnimationFrame(function () { scan(); kick(); }); } }).observe(d.body, { childList: true, subtree: true });
  }).catch(function () {});
  w.addEventListener('ds-prefs', kick);
  d.addEventListener('visibilitychange', kick);
})();
