/* Cancel Cancer · the site, version 3. The scroll of window 4c, "the album" (props/props.js, proposal b; Ben, 14.10:
   "הצעה ב' הכי טובה"), for the whole page, on the phone and on desktop. Nothing holds the scroll and there is no stop:
   every scroll moves the reading. Every sentence (and every piece of a video station, the map and the end) rises out
   of a fade as it comes up from the bottom of the screen, is fully there in the upper two thirds, and leaves upward in
   a fade under the bar. Each paragraph opens with a tilted card: the card is slapped on as it comes up with its first
   drawing, and the paragraph's other drawings drop into it each with its own sentence, then play demo 9's little
   motions while that sentence is read. The cover's shapes float at the edges at three depths. Everything is a function
   of the scroll position, so scrolling back plays it back.
   Also here: the thin bar under the header (how much of the part you are in is read), Lenis for the mouse wheel, the
   road, Dino (on his window in his card until his second sentence, then a jump to the road, then walking with the
   reader), the videos (out by date; no player on the site since window 5: each video is a row of network buttons),
   the copy buttons, the technical words, the install steps (closed on the phone).
   Window 5 (Ben, 15.10, 20:30): the install comes first, right after the opening; then the story, mom and Dino, the
   list and the videos, as before. Dino jumps off his sill at his second paragraph and walks along the videos.
   "No motion" comes from the device setting only. Without JS none of this runs, and the page is complete as it
   stands in the HTML. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  root.removeAttribute('data-theme');

  var TOP = 64; /* the bar (56) and the thin bar under it (8) */
  var CC = window.CC = { y: 0, vh: window.innerHeight, vw: window.innerWidth, desk: false, still: false, top: TOP };
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function map(v, a, b) { return b === a ? (v >= b ? 1 : 0) : clamp((v - a) / (b - a), 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function back(t) { var c1 = 0.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function io(t) { return t * t * (3 - 2 * t); }
  function out(t) { return 1 - Math.pow(1 - t, 3); }
  function q(r, s) { return Array.prototype.slice.call(r.querySelectorAll(s)); }
  function docTop(el) { return el.getBoundingClientRect().top + window.scrollY; }
  CC.clamp = clamp; CC.map = map; CC.docTop = docTop;

  /* ---------- smooth scroll for the mouse wheel; touch stays native ---------- */
  var lenis = null;
  function startLenis() {
    if (lenis || typeof window.Lenis !== 'function') return;
    try { lenis = new window.Lenis({ autoRaf: true, lerp: 0.1 }); CC.lenis = lenis; } catch (e) { lenis = null; }
  }
  function dropLenisClass() { ['lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped'].forEach(function (c) { root.classList.remove(c); }); }
  function stopLenis() { if (lenis) { lenis.destroy(); lenis = null; CC.lenis = null; } dropLenisClass(); }

  /* ---------- no motion: the device setting ---------- */
  var rmMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function applyMotion() {
    CC.still = rmMq.matches; root.classList.toggle('still', CC.still);
    if (CC.still) { stopLenis(); clearAll(); } else startLenis();
    dirty = true;
  }
  if (rmMq.addEventListener) rmMq.addEventListener('change', function () { applyMotion(); measureSoon(); });

  /* ---------- the road ---------- */
  var roadEl, roadInfo = null;
  function buildRoad() {
    roadEl = document.querySelector('.road'); if (!roadEl) return;
    var svg = roadEl.querySelector('.road-svg');
    var rr = roadEl.getBoundingClientRect(), rTop = rr.top + window.scrollY, rLeft = rr.left, W = rr.width, H = roadEl.offsetHeight;
    var list = roadEl.querySelector('.stations'), lr = list.getBoundingClientRect(), pts = [];
    q(roadEl, '.stations > .station').forEach(function (st) {
      var r = st.getBoundingClientRect(), sTop = r.top + window.scrollY - rTop, pin = st.querySelector('.pin'), x;
      if (CC.desk) {
        x = lr.left - rLeft + lr.width * (st.classList.contains('side-r') ? 0.03 : 0.97);
        if (pin) { pin.style.left = (x - (r.left - rLeft) - pin.offsetWidth / 2) + 'px'; pin.style.top = '18px'; }
      } else {
        if (pin) { pin.style.left = ''; pin.style.top = ''; }
        var pr = pin ? pin.getBoundingClientRect() : r;
        x = (pin ? pr.left + pr.width / 2 : r.right - 30) - rLeft;
      }
      pts.push({ x: x, top: sTop, bot: sTop + r.height });
    });
    if (!pts.length) return;
    var d = 'M ' + pts[0].x.toFixed(1) + ' 0';
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], n = pts[i + 1];
      d += ' L ' + p.x.toFixed(1) + ' ' + p.bot.toFixed(1);
      if (n) { var mid = (p.bot + n.top) / 2, wig = CC.desk ? 0 : 10; d += ' C ' + (p.x - wig).toFixed(1) + ' ' + mid.toFixed(1) + ' ' + (n.x + wig).toFixed(1) + ' ' + mid.toFixed(1) + ' ' + n.x.toFixed(1) + ' ' + n.top.toFixed(1); }
    }
    var last = pts[pts.length - 1], endY = H - (CC.desk ? 120 : 90);
    d += ' L ' + last.x.toFixed(1) + ' ' + endY.toFixed(1);
    svg.setAttribute('viewBox', '0 0 ' + W.toFixed(0) + ' ' + H.toFixed(0)); svg.setAttribute('preserveAspectRatio', 'none');
    q(svg, 'path[data-road]').forEach(function (pth) { pth.setAttribute('d', d); });
    var probe = svg.querySelector('path[data-road]'), L = probe.getTotalLength(), N = 900, table = [];
    for (var k = 0; k <= N; k++) { var pt = probe.getPointAtLength(L * k / N); table.push({ x: pt.x, y: pt.y }); }
    roadInfo = CC.road = { top: rTop, left: rLeft, W: W, H: H, table: table, endY: endY };
  }
  function roadX(y) {
    var t = roadInfo && roadInfo.table; if (!t) return 0;
    if (y <= t[0].y) return t[0].x; if (y >= t[t.length - 1].y) return t[t.length - 1].x;
    var lo = 0, hi = t.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (t[m].y < y) lo = m; else hi = m; }
    var a = t[lo], b = t[hi], f = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y);
    return a.x + (b.x - a.x) * f;
  }

  /* ---------- the cover decor: a little parallax ---------- */
  var pars = [];
  function measurePars() {
    pars = [];
    q(document, '.par').forEach(function (el) {
      if (!el.offsetParent) return;
      el.style.transform = '';
      var hy = el.offsetParent.getBoundingClientRect().top + window.scrollY;
      pars.push({ el: el, cy: hy + el.offsetTop + el.offsetHeight / 2, sp: +el.getAttribute('data-sp') || 0, rot: +el.getAttribute('data-rot') || 0,
        dx: +el.getAttribute('data-dx') || 0, r0: +el.getAttribute('data-r0') || 0 });
    });
  }
  function framePars() {
    var mid = CC.y + CC.vh / 2;
    for (var i = 0; i < pars.length; i++) {
      var p = pars[i], rel = (p.cy - mid) / CC.vh;
      if (rel < -1.6 || rel > 1.6) continue;
      p.el.style.transform = 'translate(' + (rel * p.dx).toFixed(1) + 'px,' + (rel * CC.vh * p.sp).toFixed(1) + 'px) rotate(' + (p.r0 + rel * p.rot).toFixed(1) + 'deg)';
    }
  }

  /* ---------- the thin bar under the header: how much of the part you are in is read ---------- */
  var parts = [];
  (function () {
    var byName = {};
    q(document, '[data-part]').forEach(function (el) {
      var n = el.getAttribute('data-part');
      if (!byName[n]) { byName[n] = { name: n, els: [], top: 0, bot: 0 }; parts.push(byName[n]); }
      byName[n].els.push(el);
    });
  })();
  CC.parts = parts;
  var progBar = document.querySelector('.prog i'), lastP = -1;
  function readLine() { return CC.y + TOP + (CC.vh - TOP) * 0.35; }
  function frameProg() {
    if (!progBar || !parts.length) return;
    var line = readLine(), cur = null;
    parts.forEach(function (p) { if (line >= p.top && line < p.bot) cur = p; });
    if (!cur) { parts.forEach(function (p) { if (p.top <= line) cur = p; }); if (!cur) cur = parts[0]; }
    /* from the part's top reaching the reading line, to its end reaching the bottom of the screen */
    var p = map(CC.y + CC.vh, cur.top + (CC.vh - TOP) * 0.65 + TOP, cur.bot);
    if (Math.abs(p - lastP) > 0.0005) { progBar.style.transform = 'scaleX(' + p.toFixed(4) + ')'; lastP = p; }
    CC.part = cur.name; CC.partP = p;
  }

  /* ---------- the lines: they rise out of a fade from the bottom and leave upward in a fade under the bar ---------- */
  function inP(c) { return io(map(c, CC.vh * 0.99, CC.vh * 0.87)); }
  function outP(c) { return io(map(c, TOP + 0.02 * CC.vh, TOP + 0.16 * CC.vh)); }
  function arrP(c) { return map(c, CC.vh * 0.96, CC.vh * 0.83); }            /* a drawing arriving with its sentence */
  function readH(c) { return map(c, CC.vh * 0.86, TOP + 0.18 * CC.vh); }     /* its sentence being read */
  CC.inP = inP; CC.outP = outP;
  var rvs = q(document, '.s, [data-rv]').map(function (el) { return { el: el, top: 0, h: 0, o: -1, t: 0 }; });
  function frameReveal(all) {
    var y = CC.y, vh = CC.vh;
    for (var i = 0; i < rvs.length; i++) {
      var r = rvs[i], c = r.top + r.h / 2 - y;
      if (!all && (c < -vh * 0.4 || c > vh * 1.4)) continue;
      var a = inP(c), b = outP(c), o = Math.min(a, b), t = (1 - a) * 30 - (1 - b) * 22;
      if (Math.abs(o - r.o) > 0.002 || Math.abs(t - r.t) > 0.2) {
        r.el.style.opacity = o.toFixed(3); r.el.style.transform = 'translateY(' + t.toFixed(1) + 'px)'; r.o = o; r.t = t;
      }
    }
  }
  /* the sentences of each reading part, by number, for the drawings */
  var chunks = {};
  q(document, '.read').forEach(function (st) {
    chunks[st.id] = {};
    q(st, '.s[data-c]').forEach(function (s) { chunks[st.id][s.getAttribute('data-c')] = { el: s, top: 0, h: 0 }; });
  });
  function cScreen(sid, at) { var c = chunks[sid] && chunks[sid][at]; return c ? c.top + c.h / 2 - CC.y : -1e6; }
  CC.cScreen = cScreen;

  /* ---------- the drawings: demo 9's inner motions. a: the item's own arrival, h: its sentence being read ---------- */
  function frameItem(it, a, h, entrance) {
    var k = it.kind, tr = '', op = 1;
    if (entrance) {
      var lo = it.delay * 0.5, ea = map(a, lo, Math.min(1, lo + 0.6)), m = 1 - back(ea);
      tr = k === 'drive-in' ? 'translateX(' + (-m * 60).toFixed(1) + 'px)' : 'translateY(' + (m * 22).toFixed(1) + 'px) rotate(' + (m * 4).toFixed(2) + 'deg)';
      op = ea > 0 ? Math.min(1, ea / 0.3) : 0;
    }
    var w, f;
    switch (k) {
      case 'ring': w = h < 0.5 ? Math.sin(h / 0.5 * Math.PI * 4) * 5 * (1 - h / 0.5) : 0; tr += ' rotate(' + w.toFixed(2) + 'deg)'; break;
      case 'draw': f = out(map(a, 0.2, 1)); it.draws.forEach(function (p) { p.style.strokeDashoffset = (1 - f).toFixed(3); }); break;
      case 'fly': f = io(map(h, 0.15, 0.85)); tr += ' translate(' + (f * -60).toFixed(1) + '%,' + (f * -50).toFixed(1) + '%) rotate(' + (f * 6).toFixed(2) + 'deg)'; op *= 1 - map(f, 0.75, 1); break;
      case 'pack': it.parts.forEach(function (p, j) { var f2 = map(h, 0.05 + j * 0.18, 0.35 + j * 0.18), b = back(f2); p.style.transform = 'translateY(' + ((1 - b) * -60).toFixed(1) + 'px) rotate(' + ((1 - f2) * (j % 2 ? 6 : -6)).toFixed(2) + 'deg)'; p.style.opacity = map(f2, 0, 0.12).toFixed(2); }); break;
      case 'puzzle': it.parts.forEach(function (p, j) { var f3 = back(map(h, j * 0.1, 0.35 + j * 0.1)), dx = +p.getAttribute('data-dx') * 0.32, dy = +p.getAttribute('data-dy') * 0.32, rr = clamp(+p.getAttribute('data-r'), -50, 70) * 0.09; p.style.transform = 'translate(' + ((1 - f3) * dx).toFixed(1) + 'px,' + ((1 - f3) * dy).toFixed(1) + 'px) rotate(' + ((1 - f3) * rr).toFixed(2) + 'deg)'; }); break;
      case 'clock': it.parts.forEach(function (p) { p.style.transform = 'rotate(' + (h * 90).toFixed(1) + 'deg)'; }); break;
      case 'search': w = h * Math.PI * 2; tr += ' translate(' + (Math.sin(w) * 7).toFixed(1) + 'px,' + ((1 - Math.cos(w)) * -5).toFixed(1) + 'px)'; break;
      case 'spin': tr += ' rotate(' + (h * 14).toFixed(2) + 'deg)'; break;
      case 'beat': tr += ' scale(' + (1 + Math.sin(h * Math.PI) * 0.05).toFixed(4) + ')'; break;
      case 'bob': tr += ' translateY(' + (Math.sin(h * Math.PI * 2) * 7).toFixed(1) + 'px)'; break;
      case 'sketch': w = h * Math.PI * 3; tr += ' translate(' + (Math.sin(w) * 8).toFixed(1) + 'px,' + (h * -10).toFixed(1) + 'px) rotate(' + (Math.sin(w) * 3).toFixed(2) + 'deg)'; break;
      case 'sway': it.parts.forEach(function (p, j) { p.style.transform = 'rotate(' + (Math.sin((h * 3 - j * 0.3) * Math.PI) * 5 * (1 - h)).toFixed(2) + 'deg)'; }); break;
      case 'clap': it.parts.forEach(function (p) { p.style.transform = 'rotate(' + (-14 * (1 - out(map(h, 0.1, 0.45)))).toFixed(2) + 'deg)'; }); break;
      case 'rain': it.parts.forEach(function (p, j) { var r = (h * 2.5 + j * 0.27) % 1; p.style.transform = 'translateY(' + (r * 14).toFixed(1) + 'px)'; p.style.opacity = (h > 0 ? 1 - r * 0.8 : 1).toFixed(2); }); break;
      case 'cur-l': case 'cur-r': f = io(map(h, 0.02, 0.6)); tr += ' translateX(' + ((1 - f) * (k === 'cur-l' ? 50 : -50)).toFixed(1) + '%)'; break;
      case 'spot': op *= map(h, 0.2, 0.7); break;
    }
    it.el.style.transform = tr || 'none';
    it.el.style.opacity = (+op).toFixed(3);
  }
  function makeGroup(grp, sid) {
    var gat = +grp.getAttribute('data-at') || 0;
    return { grp: grp, sid: sid, at: gat, items: q(grp, '.it9').map(function (i) {
      var at = +i.getAttribute('data-at');
      return { el: i, at: at, own: at !== gat || +i.getAttribute('data-delay') > 0, kind: i.getAttribute('data-kind'), delay: +i.getAttribute('data-delay') || 0,
        parts: q(i, '.drop, .pz, .hands, .sw, .clap, .rain'), draws: q(i, '.draw') }; }) };
  }
  /* the cards: slapped on as they come up, with their first drawing; the others drop in with their own sentence */
  var cards = q(document, '.read .card').map(function (el) {
    var st = el.closest('.read'), gs = q(el, '.grp');
    return { el: el, sid: st.id, top: 0, h: 0, tilt: parseFloat(el.style.getPropertyValue('--tilt')) || 0,
      first: Math.min.apply(null, gs.map(function (g) { return +g.getAttribute('data-at'); })),
      groups: gs.map(function (g) { return makeGroup(g, st.id); }) };
  });
  CC.cards = cards;
  function frameCards(all) {
    var y = CC.y, vh = CC.vh;
    cards.forEach(function (cd, k) {
      var c = cd.top + cd.h / 2 - y;
      if (!all && (c < -vh * 0.6 || c > vh * 1.5)) return;
      var a = map(c, vh * 0.98, vh * 0.66), e = back(a), m = 1 - e, b = outP(c);
      cd.el.style.opacity = Math.min(a > 0 ? Math.min(1, a / 0.3) : 0, b).toFixed(3);
      cd.el.style.transform = 'translateY(' + (m * 40 - (1 - b) * 22).toFixed(1) + 'px) rotate(' + (cd.tilt + m * (k % 2 ? -9 : 9)).toFixed(2) + 'deg) scale(' + (0.74 + 0.26 * Math.min(1.04, e)).toFixed(4) + ')';
      cd.groups.forEach(function (g) {
        var ga = g.at === cd.first ? map(a, 0.08, 0.75) : arrP(cScreen(g.sid, String(g.at))), ge = back(clamp(ga / 0.8, 0, 1)), gm = 1 - ge;
        g.grp.style.opacity = (ga > 0 ? Math.min(1, ga / 0.25) : 0).toFixed(3);
        g.grp.style.transform = 'translateY(' + (gm * -36).toFixed(1) + 'px) rotate(' + (gm * 5).toFixed(2) + 'deg)';
        for (var i = 0; i < g.items.length; i++) { var it = g.items[i], ci = cScreen(g.sid, String(it.at)); frameItem(it, arrP(ci), readH(ci), it.own); }
      });
    });
  }

  /* ---------- the plain stations' icon: it comes in around the middle of the screen ---------- */
  var pops = q(document, '.pop-box').map(function (el) { return { el: el, items: q(el, '.pop'), top: 0, h: 0 }; });
  function framePops() {
    var vh = CC.vh, y = CC.y;
    pops.forEach(function (pl) {
      if (pl.top + pl.h < y - 100 || pl.top > y + vh + 100) return;
      var e = map(pl.top + pl.h / 2 - y, vh * 0.85, vh * 0.45);
      pl.items.forEach(function (o) { var ea = map(e, 0, 0.55), m = 1 - back(ea); o.style.transform = 'translateY(' + (m * 30).toFixed(1) + 'px) rotate(' + (m * 4).toFixed(2) + 'deg)'; o.style.opacity = (ea > 0 ? Math.min(1, ea / 0.3) : 0).toFixed(3); });
    });
  }

  /* ---------- Dino: on his window sill until the reader reaches his second paragraph, then a jump to the road,
     then he walks with the reader to the road's end, in whole poses. All of it a function of the scroll ---------- */
  var walker = document.querySelector('.dino-walker'), home = document.querySelector('#dino .card .dino-home9');
  var poses = walker ? q(walker, '.pose') : [], curPose = null;
  var poseSts = q(document, '.road [data-pose]').map(function (el) { return { el: el, pose: el.getAttribute('data-pose'), top: 0, bot: 0 }; });
  function setPose(name) {
    if (name === curPose) return; curPose = name;
    poses.forEach(function (im) { im.classList.toggle('on', im.getAttribute('data-pose') === name); });
    walker.querySelector('.dw-in').classList.toggle('posed', !!name);
  }
  /* off the sill while his second sentence goes from the middle of the screen to its upper third */
  function jumpT() { var c = cScreen('dino', '1'); return c < -1e5 ? 0 : map(c, 0.52 * CC.vh, 0.36 * CC.vh); }
  CC.jumpT = jumpT;
  function frameDino() {
    if (!walker || !roadInfo) return;
    var R = roadInfo, t = jumpT();
    if (t <= 0) { walker.style.opacity = '0'; if (home) home.style.visibility = ''; return; }
    if (home) home.style.visibility = 'hidden';
    walker.style.opacity = '1';
    var ww = walker.offsetWidth, wh = walker.offsetHeight;
    var anchor = clamp(CC.y + CC.vh * 0.62 - R.top, 0, R.endY - 10), x = roadX(anchor), y = anchor, sc = 1, lift = 0, rot = 0;
    if (t < 1 && home) {
      var hr = home.getBoundingClientRect(), e = easeInOut(t);
      var hx = hr.left + hr.width / 2 - R.left, hy = hr.bottom + CC.y - R.top;
      x = lerp(hx, x, e); y = lerp(hy, anchor, e); sc = lerp(hr.width / ww, 1, e);
      lift = Math.sin(Math.PI * t) * (CC.desk ? 140 : 90);
    } else {
      var step = anchor / (CC.desk ? 46 : 34); lift = Math.abs(Math.sin(step)) * (CC.desk ? 9 : 6); rot = Math.sin(step) * 3;
    }
    var docY = y + R.top, pose = '';
    poseSts.forEach(function (p) { if (docY >= p.top && docY <= p.bot) pose = p.pose; });
    setPose(t < 1 ? 'wave' : pose);
    x = clamp(x, ww / 2 + 2, R.W - ww / 2 - 2);
    walker.style.transform = 'translate(' + (x - ww / 2).toFixed(1) + 'px,' + (y - wh - lift).toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
  }

  function clearAll() {
    rvs.forEach(function (r) { r.el.style.opacity = ''; r.el.style.transform = ''; r.o = -1; });
    cards.forEach(function (cd) {
      cd.el.style.opacity = ''; cd.el.style.transform = '';
      cd.groups.forEach(function (g) {
        g.grp.style.transform = ''; g.grp.style.opacity = '';
        g.items.forEach(function (it) { it.el.style.transform = ''; it.el.style.opacity = ''; it.parts.forEach(function (p) { p.style.transform = ''; p.style.opacity = ''; }); it.draws.forEach(function (p) { p.style.strokeDashoffset = ''; }); });
      });
    });
    pops.forEach(function (p) { p.items.forEach(function (o) { o.style.transform = ''; o.style.opacity = ''; }); });
    pars.forEach(function (p) { p.el.style.transform = ''; });
    if (home) home.style.visibility = '';
  }

  /* ---------- the videos: out from their date, with a YouTube id ---------- */
  function today() {
    var d = new Date(); /* now in Israel, "YYYY-MM-DDTHH:MM": a date in episodes.json may carry an hour, a bare date is midnight */
    try {
      var p = {};
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      return p.year + '-' + p.month + '-' + p.day + 'T' + p.hour + ':' + p.minute;
    } catch (e) { return d.toISOString().slice(0, 16); }
  }
  CC.today = today;
  function updateReleases(asOf) {
    var day = asOf || today(), newest = null;
    q(document, '.ep[data-ep], .vrow[data-ep]').forEach(function (st) {
      var yt = st.getAttribute('data-yt'), date = st.getAttribute('data-date');
      var isOut = yt === 'demo' || !!(yt && date && date <= day);
      st.classList.toggle('is-out', isOut);
      if (!st.classList.contains('ep')) return;
      if (isOut) newest = st.getAttribute('data-ep');
      var row = document.querySelector('.map-list li[data-ep="' + st.getAttribute('data-ep') + '"]');
      if (row) row.classList.toggle('is-out', isOut);
    });
    q(document, '.map-list li').forEach(function (li) { li.classList.toggle('is-new', li.getAttribute('data-ep') === newest); });
    measureSoon();
  }
  CC.updateReleases = updateReleases;

  /* ---------- clicks: copy, the page link, watch, the cover, the technical words, links to a closed step ---------- */
  function copyText(text, btn, selectEl) {
    var lab = btn.querySelector('.lab');
    var done = function () { if (!lab) return; lab.textContent = btn.getAttribute('data-done'); setTimeout(function () { lab.textContent = btn.getAttribute('data-label'); }, 1800); };
    var select = function () { if (!selectEl) return; var r = document.createRange(); r.selectNodeContents(selectEl); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, select); else select();
  }
  function goTo(el) {
    var y = Math.max(0, docTop(el) - (parseFloat(getComputedStyle(el).scrollMarginTop) || TOP));
    if (lenis) lenis.scrollTo(y, { duration: Math.min(1.6, 0.6 + Math.abs(y - window.scrollY) / (CC.vh * 8)), force: true });
    else window.scrollTo({ top: y, behavior: CC.still ? 'auto' : 'smooth' });
  }
  CC.goTo = goTo;
  function openTarget(id) {
    var el = id && document.getElementById(id); if (!el) return;
    var d = el.tagName === 'DETAILS' ? el : el.closest('details');
    if (d && !d.open) { d.open = true; measure(); }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement;
    var c = t.closest('[data-copy]');
    if (c) { var src = document.getElementById(c.getAttribute('data-copy')); if (src) copyText(src.textContent, c, src); return; }
    var l = t.closest('.btn-copy-link');
    /* the link carries a mark, so Umami can count how many open it later (on the computer); the anchor lands on the install */
    /* the link lands on the computer at the install step (#kit): on the phone the visitor already read what the kit needs */
    if (l) { copyText(l.getAttribute('data-url').split('#')[0].split('?')[0] + '?utm_source=copy-link#kit', l, null); return; }
    /* an in-page link: open a closed step first, then scroll to it ourselves. Window 5: Lenis's own anchors landed
       half a screen short on a jump up the page (episode 1 to step 2, which now sits above it) */
    var a = t.closest('a[href^="#"]');
    if (a) {
      var id = a.getAttribute('href').slice(1), target = id && document.getElementById(id);
      /* "להתקנה" in the bar (and the skip link) lands on the action itself: the copy button on the phone, the
         install step on desktop (window 5). Without JS it is a plain link to the head of the install. */
      if (id === 'install' && (a.classList.contains('hb-install') || a.classList.contains('skip'))) {
        target = CC.desk ? document.getElementById('kit') : (document.querySelector('.go-box') || target);
      }
      openTarget(id);
      if (target) { e.preventDefault(); goTo(target); try { history.pushState(null, '', '#' + id); } catch (err) { location.hash = id; } }
    }
    var term = t.closest('.term');
    q(document, '.term.open').forEach(function (o) { if (o !== term) { o.classList.remove('open'); o.setAttribute('aria-expanded', 'false'); } });
    if (term) { var op = !term.classList.contains('open'); term.classList.toggle('open', op); term.setAttribute('aria-expanded', op ? 'true' : 'false'); if (op) placeTip(term); }
  });
  /* a tooltip stays inside the screen: shift it sideways if it would run past an edge */
  function placeTip(term) {
    var tip = term.querySelector('.tip'); if (!tip) return;
    tip.style.setProperty('--dx', '0px');
    var r = tip.getBoundingClientRect(), pad = 10, dx = 0;
    if (r.left < pad) dx = pad - r.left; else if (r.right > window.innerWidth - pad) dx = window.innerWidth - pad - r.right;
    tip.style.setProperty('--dx', dx.toFixed(0) + 'px');
  }
  ['mouseover', 'focusin'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { var t = e.target.closest && e.target.closest('.term'); if (t) placeTip(t); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') q(document, '.term.open').forEach(function (o) { o.classList.remove('open'); o.setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('toggle', function () { measureSoon(); }, true);
  window.addEventListener('hashchange', function () { openTarget(location.hash.slice(1)); });

  /* ---------- the install steps: closed on the phone, open on desktop (no JS: open) ---------- */
  var stepsSet = null;
  function placeSteps() {
    var want = CC.desk ? 'desk' : 'phone';
    if (stepsSet === want) return; stepsSet = want;
    q(document, 'details.kit-step').forEach(function (d) { d.open = CC.desk; });
    if (location.hash) openTarget(location.hash.slice(1));
  }

  /* ---------- the loop ---------- */
  var dirty = true, dirtyAll = true, lastY = -1, mTimer = 0;
  function measure() {
    CC.vh = window.innerHeight; CC.vw = window.innerWidth; CC.desk = CC.vw >= 900;
    placeSteps();
    buildRoad(); measurePars();
    rvs.forEach(function (r) { var t = r.el.style.transform; r.el.style.transform = ''; r.top = docTop(r.el); r.h = r.el.offsetHeight; r.el.style.transform = t; });
    Object.keys(chunks).forEach(function (k) { Object.keys(chunks[k]).forEach(function (n) { var c = chunks[k][n], t = c.el.style.transform; c.el.style.transform = ''; c.top = docTop(c.el); c.h = c.el.offsetHeight; c.el.style.transform = t; }); });
    cards.forEach(function (cd) { var t = cd.el.style.transform; cd.el.style.transform = ''; cd.top = docTop(cd.el); cd.h = cd.el.offsetHeight; cd.el.style.transform = t; });
    parts.forEach(function (p) {
      p.top = Infinity; p.bot = -Infinity;
      p.els.forEach(function (el) { if (!el.getClientRects().length) return; var tp = docTop(el); p.top = Math.min(p.top, tp); p.bot = Math.max(p.bot, tp + el.offsetHeight); });
    });
    poseSts.forEach(function (p) { p.top = docTop(p.el); p.bot = p.top + p.el.offsetHeight; });
    pops.forEach(function (p) { p.top = docTop(p.el); p.h = p.el.offsetHeight; });
    dirty = true; dirtyAll = true;
  }
  function measureSoon() { clearTimeout(mTimer); mTimer = setTimeout(measure, 60); }
  CC.measure = measure; CC.measureSoon = measureSoon;
  function tick() {
    var y = window.scrollY;
    if (y !== lastY || dirty) {
      var jump = Math.abs(y - lastY) > CC.vh * 0.8;
      lastY = y; CC.y = y; dirty = false;
      frameProg();
      if (!CC.still) { var all = jump || dirtyAll; dirtyAll = false; frameReveal(all); framePars(); frameCards(all); framePops(); frameDino(); }
    }
    window.requestAnimationFrame(tick);
  }
  function start() {
    updateReleases();
    applyMotion(); measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener('resize', measureSoon); window.addEventListener('load', measure);
    if (window.ResizeObserver) { var ro = new ResizeObserver(measureSoon); ro.observe(document.querySelector('.cc') || document.body); }
    window.requestAnimationFrame(tick);
  }
  /* the clicks, counted by Umami (Ben, 15.10: "אני רוצה אנליטיקס"). Only the event's name and the station, step,
     file or network go out; nothing typed, nothing personal. Without Umami on the page (no id in links.json, a
     blocker, no JS) nothing is sent and nothing changes. Umami counts the visits and where they came from by itself. */
  function stepOf(el) { var s = el.closest('.kit-step'); return s ? s.id.replace('step-', '') : undefined; }
  function epOf(el) { var s = el.closest('[data-ep]'); return s ? s.getAttribute('data-ep') : undefined; }
  function label(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40); }
  var TRACK = [
    ['.hb-watch', 'bar-videos'], ['.hb-install', 'bar-install'], ['.btn-story-read', 'opening-story-read'],
    ['.btn-story-video', 'opening-story-video'], ['.skip', 'skip-link'],
    ['.map-list a', 'map-row', function (el) { return { ep: epOf(el) }; }],
    ['.vnet', 'video-on-network', function (el) { return { ep: el.getAttribute('data-ep'), network: el.getAttribute('data-net'), where: el.getAttribute('data-where') }; }],
    ['.step-link', 'episode-to-step', function (el) { return { ep: epOf(el), step: (el.getAttribute('href') || '').replace('#step-', '') }; }],
    ['.kit-step > summary', 'step-open', function (el) { return el.parentNode.open ? null : { step: stepOf(el) }; }],
    ['.kit-more summary', 'more-open', function (el) { return el.parentNode.open ? null : { part: label(el) }; }],
    ['.btn-copy-link', 'phone-copy-link'],
    ['.btn-copy', 'copy', function (el) { return { step: stepOf(el), ep: epOf(el), box: el.getAttribute('data-copy') }; }],
    ['.btn-dl', 'download', function (el) { return { file: el.getAttribute('download'), step: stepOf(el) }; }],
    ['.term', 'word-tip', function (el) { return el.classList.contains('open') ? null : { word: (el.firstChild && el.firstChild.textContent || '').trim() }; }],
    ['a[href^="mailto:"]', 'mail'], ['.btn-site', 'benefits-site'], ['.net', 'follow', function (el) { return { network: label(el) }; }],
    ['.tp-link', 'story-link', function (el) { return { to: (el.getAttribute('href') || '').replace(/^https?:\/\//, '').slice(0, 40) }; }]
  ];
  document.addEventListener('click', function (e) {
    if (!window.umami || typeof window.umami.track !== 'function' || !e.target.closest) return;
    for (var i = 0; i < TRACK.length; i++) {
      var el = e.target.closest(TRACK[i][0]);
      if (!el) continue;
      var data = TRACK[i][2] ? TRACK[i][2](el) : {};
      if (data === null) return;
      for (var k in data) if (data[k] === undefined || data[k] === '') delete data[k];
      try { window.umami.track(TRACK[i][1], data); } catch (err) { /* counting never breaks the page */ }
      return;
    }
  }, true);

  /* install-view (GPT's suggestion, window 5): once per visit, when the install's action is on the screen: the copy
     button on the phone, the plugin address on desktop. Says whether a visitor reached the place that matters at all. */
  (function () {
    if (!window.IntersectionObserver) return;
    var sent = false;
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (sent || !en.isIntersecting || !en.target.offsetParent) return;
        if (!window.umami || typeof window.umami.track !== 'function') return;
        sent = true;
        try { window.umami.track('install-view', { device: CC.desk ? 'desktop' : 'phone' }); } catch (err) { /* counting never breaks the page */ }
        io2.disconnect();
      });
    }, { threshold: 0.6 });
    q(document, '.btn-copy-link, #step-install .copy-box').forEach(function (el) { io2.observe(el); });
  })();

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
