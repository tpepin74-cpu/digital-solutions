/* Digital Solutions · easter eggs « terminal » (aucune dépendance).
   Tapez une commande n'importe où sur la page (hors champ de saisie). « help » ou « ? » les liste. */
(function () {
  if (window.__dsEggs) return; window.__dsEggs = true;
  var d = document, w = window;
  var MONO = "'IBM Plex Mono',ui-monospace,Menlo,monospace";
  var still = function () { return w.DSMotion ? w.DSMotion.isPaused() : w.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var path = decodeURIComponent(location.pathname);
  var page = /Intelligence/.test(path) ? 'ia' : /Expertises/.test(path) ? 'exp' : /Usages/.test(path) ? 'use' : /Maison/.test(path) ? 'maison' : /Carrieres/.test(path) ? 'car' : /Contact/.test(path) ? 'contact' : 'accueil';

  var C = {
    sudo: function () {
      return page === 'car'
        ? { out: ['[sudo] mot de passe pour visiteur : ********', 'Accès root accordé.', 'Il ne manque plus que votre candidature.'] }
        : { out: ['[sudo] mot de passe pour visiteur : ********', 'Accès accordé. Vous avez l\u2019âme d\u2019une admin ou d\u2019un admin.'], link: ['Voir les postes ouverts →', 'Carrieres.dc.html'] };
    },
    ping: function () {
      return page === 'contact'
        ? { out: ['PING contact@digital-solutions.io', 'Réponse : temps = 24 h ouvrées', 'Un peu plus lent que 3 ms. Beaucoup plus humain.'] }
        : { out: ['PING digital-solutions.io : 64 octets, temps = 3 ms', '1 paquet transmis, 1 reçu, 0 % de perte.', 'Nous aussi, on répond vite.'], link: ['Nous écrire →', 'Contact.dc.html'] };
    }
  };
  var P = {
    accueil: { cmd: 'hello', hint: 'hello', run: { cmd: 'console.log("Bonjour")', out: ['Bonjour, monde.', 'Tout projet commence par cette ligne. Écrivons la suite du vôtre.'], link: ['Démarrer un projet →', 'Contact.dc.html'] } },
    ia: { cmd: 'turing', hint: 'turing', run: { out: ['Test de Turing en cours…', 'Frappe analysée : 6 caractères, rythme irrégulier, aucune hallucination.', 'Verdict : humain à 97 %.', 'Les 3 % restants nous intriguent.'] } },
    exp: { cmd: 'backup', hint: 'backup', run: { out: ['Sauvegarde 3-2-1 en cours…', '3 copies · 2 supports · 1 hors site ........ OK', 'Terminé. Même cette blague est sauvegardée.'] } },
    use: { cmd: 'bug', hint: 'bug', run: { out: ['Ticket #404 ouvert : « bug signalé par un visiteur »', 'Priorité : haute · Assigné : équipe support', 'Statut : corrigé avant d\u2019être reproduit.'] } },
    maison: { cmd: ['cafe', 'café', 'coffee'], hint: 'cafe', run: { cmd: 'brew coffee', out: ['HTTP/1.1 418 I\u2019m a teapot', 'Notre serveur refuse de faire du café (RFC 2324).', 'La vraie machine est à l\u2019étage. Passez nous voir.'], link: ['Prendre rendez-vous →', 'Contact.dc.html'] } },
    car: { cmd: 'git', hint: 'git', run: { cmd: 'git commit -m "Rejoindre Digital Solutions"', out: ['[main 7f3a9c2] Rejoindre Digital Solutions', '1 file changed, 1 insertion(+)', 'L\u2019insertion, c\u2019est vous.'] } },
    contact: null
  };

  var toast, timer, typing = [], lastFocus;
  function clearTyping() { typing.forEach(clearTimeout); typing = []; }
  function close() {
    clearTyping(); clearTimeout(timer);
    if (toast) { toast.remove(); toast = null; }
  }
  function el(tag, css, txt) { var e = d.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }

  function show(name, r) {
    close();
    toast = el('div', 'position:fixed;left:clamp(10px,1.6vw,20px);bottom:clamp(10px,1.6vw,20px);z-index:545;width:min(460px,calc(100vw - 20px));background:#0B1215;color:#F2F0EC;border:1px solid rgba(242,240,236,.2);font:13px/1.65 ' + MONO + ';box-shadow:0 24px 60px rgba(0,0,0,.35)');
    toast.setAttribute('role', 'status');
    var bar = el('div', 'display:flex;align-items:center;gap:10px;padding:4px 4px 4px 16px;border-bottom:1px solid rgba(242,240,236,.12);color:#9FB0B6;font-size:11px;letter-spacing:.12em;text-transform:uppercase');
    bar.appendChild(el('span', 'flex:1', 'visiteur@digital-solutions'));
    var x = el('button', 'min-width:44px;min-height:44px;background:none;border:0;color:#F2F0EC;font:inherit;font-size:18px;cursor:pointer', '×');
    x.type = 'button'; x.setAttribute('aria-label', 'Fermer le terminal'); x.onclick = close;
    bar.appendChild(x); toast.appendChild(bar);
    var body = el('div', 'padding:14px 16px 16px;display:flex;flex-direction:column;gap:2px');
    var sr = el('span', 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap', r.out.join(' '));
    var vis = el('div', 'display:flex;flex-direction:column;gap:2px'); vis.setAttribute('aria-hidden', 'true');
    var pr = el('div', 'color:#F2F0EC'); pr.appendChild(el('span', 'color:#6DCDEA', '$ ')); pr.appendChild(d.createTextNode(r.cmd || name));
    vis.appendChild(pr);
    body.appendChild(sr); body.appendChild(vis);
    var link;
    if (r.link) {
      link = el('a', 'margin-top:10px;align-self:flex-start;color:#6DCDEA;text-decoration:underline;text-underline-offset:4px;min-height:32px;display:inline-flex;align-items:center', r.link[0]);
      link.href = r.link[1];
    }
    toast.appendChild(body); d.body.appendChild(toast);
    var lines = r.out.map(function (t) { var l = el('div', 'color:#C9D2D5;white-space:pre-wrap;min-height:1.65em'); vis.appendChild(l); return [l, t]; });
    var done = function () { if (link) body.appendChild(link); timer = setTimeout(close, 12000); };
    if (still()) { lines.forEach(function (p) { p[0].textContent = p[1]; }); done(); return; }
    var t = 260;
    lines.forEach(function (p) {
      for (var i = 1; i <= p[1].length; i++) (function (k) { typing.push(setTimeout(function () { p[0].textContent = p[1].slice(0, k); }, t + k * 16)); })(i);
      t += p[1].length * 16 + 280;
    });
    typing.push(setTimeout(done, t));
  }

  function help() {
    var cmds = ['help    · cette aide', 'sudo    · élever vos privilèges', 'ping    · tester notre réactivité'];
    var p = P[page]; if (p) cmds.push((p.hint + '        ').slice(0, 8) + '· propre à cette page');
    cmds.push('↑↑↓↓←→←→BA · démarrage à froid');
    show('help', { out: ['Commandes disponibles :'].concat(cmds) });
  }

  function boot() {
    close();
    lastFocus = d.activeElement;
    var o = el('div', 'position:fixed;inset:0;z-index:560;background:#0B1215;color:#C9D2D5;font:clamp(13px,1.2vw,16px)/1.8 ' + MONO + ';padding:clamp(24px,6vw,96px);overflow:auto;display:flex;flex-direction:column;gap:2px');
    o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'Démarrage à froid du système Digital Solutions');
    var L = ['DS-BIOS v26.10 · Digital Solutions SA', '', 'Test mémoire ........................ 640 Ko, ça devrait suffire. OK', 'Montage /expertises ................. OK', 'Chargement des modèles .............. OK', 'Indexation RAG du savoir-faire ...... OK', 'Serveur MCP ......................... à l\u2019écoute', 'Agents IA ........................... 3/3 en ligne', 'Pare-feu ............................ actif, poli mais ferme', '', 'Système opérationnel. Bonjour, développeuse ou développeur.'];
    var lines = L.map(function (t, i) { var l = el('div', 'min-height:1.8em;white-space:pre-wrap;color:' + (i === 0 || i === L.length - 1 ? '#F2F0EC' : '#C9D2D5'), ''); o.appendChild(l); return [l, t]; });
    var foot = el('div', 'margin-top:28px;display:flex;flex-wrap:wrap;gap:12px 28px;align-items:center');
    var x = el('button', 'min-height:44px;padding:0 18px;background:#F2F0EC;color:#0B1215;border:0;font:inherit;font-weight:500;cursor:pointer', 'Échap · reprendre la visite');
    x.type = 'button';
    var a = el('a', 'color:#6DCDEA;text-decoration:underline;text-underline-offset:4px;min-height:44px;display:inline-flex;align-items:center', 'Le genre de profil qu\u2019on recrute →'); a.href = 'Carrieres.dc.html';
    foot.appendChild(x); foot.appendChild(a);
    var ts = [];
    function shut() { ts.forEach(clearTimeout); d.removeEventListener('keydown', esc, true); o.remove(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
    function esc(e) { if (e.key === 'Escape') { e.preventDefault(); shut(); } else if (e.key === 'Tab') { var f = [x, a], i = f.indexOf(d.activeElement); if (e.shiftKey ? i <= 0 : i === f.length - 1) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus(); } } }
    x.onclick = shut; d.addEventListener('keydown', esc, true);
    d.body.appendChild(o); x.focus && setTimeout(function () {}, 0);
    var end = function () { o.appendChild(foot); x.focus(); };
    if (still()) { lines.forEach(function (p) { p[0].textContent = p[1]; }); end(); return; }
    o.appendChild(foot); foot.style.visibility = 'hidden'; x.focus();
    var t = 200;
    lines.forEach(function (p) { ts.push(setTimeout(function () { p[0].textContent = p[1]; }, t)); t += p[1] ? 170 + Math.random() * 160 : 90; });
    ts.push(setTimeout(function () { foot.style.visibility = ''; }, t + 200));
  }

  var buf = '', K = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'], kseq = [];
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toast) { close(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key) return;
    var t = e.target;
    if (t && t.closest && t.closest('input,textarea,select,[contenteditable=""],[contenteditable="true"],[role="dialog"]')) return;
    var k = e.key.toLowerCase();
    kseq.push(k); if (kseq.length > K.length) kseq.shift();
    if (kseq.join() === K.join()) { kseq = []; buf = ''; boot(); return; }
    if (k === '?') { buf = ''; help(); return; }
    if (k.length !== 1) return;
    buf = (buf + k).slice(-16);
    var hit = function (w) { return buf.slice(-w.length) === w; };
    if (hit('help')) { buf = ''; help(); return; }
    if (hit('sudo')) { buf = ''; show('sudo', C.sudo()); return; }
    if (hit('ping')) { buf = ''; show('ping', C.ping()); return; }
    var p = P[page];
    if (p && [].concat(p.cmd).some(hit)) { buf = ''; show([].concat(p.cmd)[0], p.run); }
  });

  try {
    console.log('%c digital solutions %c\n\nVous lisez la console ? Nous aussi.\nTapez « help » sur la page pour ouvrir notre terminal.\nEt si ça vous amuse : Carrieres.dc.html', 'font:700 14px "Century Gothic",sans-serif;letter-spacing:.2em;background:#0B1215;color:#6DCDEA;padding:6px 10px', 'font:12px ui-monospace,monospace;color:inherit');
  } catch (e) {}
})();
