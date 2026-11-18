// Home page: scroll story, fit statement, shop-card tilt.
// Everything is driven by scroll position or the pointer; nothing plays on its own.
(function () {
  var html = document.documentElement;
  var root = html.dataset.root || '';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  function clamp(x, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); }
  function fade(p, a, b, e) { e = e || 0.03; return Math.min(smooth(a - e, a, p), 1 - smooth(b, b + e, p)); }

  // ---------- Scroll story ----------
  var story = document.querySelector('[data-story]');
  var NW = 1376, NH = 1824; // natural size of every product image

  // Points are fractions of the image. full = centre of the glasses,
  // inlay = centre of the carbon strip, len = strip length as a fraction of image width,
  // angle = strip slope in degrees (the camera levels it while zooming in).
  var LAYERS = {
    cSide: { src: 'assets/oval01-caramel-side.webp', full: [0.500, 0.485], inlay: [0.465, 0.500], len: 0.33, angle: 0, pins: [0.165, 0.500] },
    c34:   { src: 'assets/oval01-caramel-34.webp',   full: [0.500, 0.490], inlay: [0.739, 0.476], len: 0.19, angle: -11.5 },
    bSide: { src: 'assets/oval01-black-side.webp',   full: [0.505, 0.505], inlay: [0.475, 0.545], len: 0.33, angle: 0 },
    b34:   { src: 'assets/oval01-black-34.webp',     full: [0.505, 0.475], inlay: [0.735, 0.466], len: 0.19, angle: -11 }
  };
  var ORDER = ['cSide', 'c34', 'bSide', 'b34']; // bottom to top

  if (story) {
    var stage = story.querySelector('.story__stage');
    var sheen = story.querySelector('.story__sheen');
    var mark = story.querySelector('.story__mark');
    var wipe = story.querySelector('.story__wipe');
    var labelA = story.querySelector('.story__label--a');
    var labelB = story.querySelector('.story__label--b');
    var bar = story.querySelector('.story__bar');
    var count = story.querySelector('[data-count]');
    var chaps = [].slice.call(story.querySelectorAll('.chap'));
    var railItems = [].slice.call(story.querySelectorAll('.rail li'));
    var railStops = [0, 0.14, 0.47, 0.64, 0.82];

    // Build one slot per image.
    ORDER.forEach(function (id) {
      var slot = document.createElement('div');
      slot.className = 'slot';
      var img = new Image(NW, NH);
      img.src = root + LAYERS[id].src;
      img.alt = '';
      img.decoding = 'async';
      slot.appendChild(img);
      stage.insertBefore(slot, sheen);
      LAYERS[id].slot = slot;
      LAYERS[id].img = img;
    });

    var vw, vh, mobile, W;
    function measure() {
      vw = stage.clientWidth; vh = stage.clientHeight;
      mobile = vw < 720;
      var glasses = mobile ? 0.88 * vw : Math.min(0.62 * vw, 1.55 * vh); // on-screen width of the whole pair
      W = glasses / 0.88; // the pair is about 88% of the image width
    }

    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    // Place one layer: focus point lands on (cx, cy), zoom z, rotation rot.
    function place(L, f, z, rot, cx, cy) {
      var s = W * z / NW;
      L.img.style.transform = 'translate(' + cx + 'px,' + cy + 'px) rotate(' + rot + 'deg) scale(' + s + ') translate(' + (-f[0] * NW) + 'px,' + (-f[1] * NH) + 'px)';
      L.cur = { f: f, s: s, rot: rot, cx: cx, cy: cy };
    }
    // Where an image point ends up on screen.
    function project(L, pt) {
      var c = L.cur, r = c.rot * Math.PI / 180;
      var dx = (pt[0] - c.f[0]) * NW * c.s, dy = (pt[1] - c.f[1]) * NH * c.s;
      return [c.cx + dx * Math.cos(r) - dy * Math.sin(r), c.cy + dx * Math.sin(r) + dy * Math.cos(r)];
    }

    function renderStory() {
      var rect = story.getBoundingClientRect();
      var p = clamp(-rect.top / (rect.height - vh));

      // Camera: zoom into the inlay, hold, pull back out on the side view.
      var k = reduce ? 0 : smooth(0.12, 0.30, p) - smooth(0.52, 0.62, p);
      var outro = 1 - 0.08 * smooth(0.82, 0.92, p);
      var inlayPx = mobile ? 0.8 * vw : Math.min(0.42 * vw, 620);
      var cx = vw / 2 + pointer.x * 14;
      var cy = lerp(mobile ? 0.5 : 0.58, 0.5, k) * vh + pointer.y * 10;

      ORDER.forEach(function (id) {
        var L = LAYERS[id];
        var zIn = inlayPx / (L.len * W);
        var f = [lerp(L.full[0], L.inlay[0], k), lerp(L.full[1], L.inlay[1], k)];
        place(L, f, lerp(1, zIn, k) * outro, -L.angle * k + pointer.x * 1.2, cx, cy);
      });

      // Which image shows.
      LAYERS.c34.slot.style.opacity = 1 - smooth(0.46, 0.49, p);
      var w = smooth(0.66, 0.78, p);
      LAYERS.bSide.slot.style.clipPath = 'inset(0 0 0 ' + ((1 - w) * 100) + '%)';
      LAYERS.b34.slot.style.opacity = smooth(0.84, 0.90, p);

      // Light sweep across the inlay.
      var sw = (p - 0.30) / 0.14;
      var showSheen = reduce ? 0 : fade(p, 0.30, 0.44, 0.02);
      sheen.style.opacity = showSheen;
      if (showSheen > 0) {
        var a = project(LAYERS.c34, LAYERS.c34.inlay);
        var span = inlayPx * 0.75;
        sheen.style.transform = 'translate(' + (a[0] + lerp(-span, span, clamp(sw))) + 'px,' + a[1] + 'px) rotate(18deg)';
      }

      // Ring on the gold pins once the side view pulls back.
      var showMark = fade(p, 0.57, 0.64, 0.02);
      mark.style.opacity = showMark;
      if (showMark > 0) {
        var m = project(LAYERS.cSide, LAYERS.cSide.pins);
        mark.style.transform = 'translate(' + m[0] + 'px,' + m[1] + 'px)';
      }

      // Wipe line and colour labels.
      var showWipe = fade(p, 0.66, 0.80, 0.02);
      var lineX = (1 - w) * vw;
      wipe.style.opacity = w > 0 && w < 1 ? 1 : 0;
      wipe.style.transform = 'translateX(' + lineX + 'px)';
      labelA.style.opacity = showWipe;
      labelB.style.opacity = showWipe;
      labelA.style.left = Math.max(lineX, 120) + 'px';
      labelB.style.left = Math.min(lineX, vw - 120) + 'px';

      // Weight counter.
      if (count) count.textContent = Math.round(20 * smooth(0.86, 0.95, p));

      // Chapter text.
      chaps.forEach(function (c) {
        var o = fade(p, +c.dataset.in, +c.dataset.out);
        c.style.opacity = o;
        c.style.transform = reduce ? '' : 'translateY(' + ((1 - o) * 16) + 'px)';
        c.classList.toggle('is-on', o > 0.5);
      });

      bar.style.transform = 'scaleX(' + p + ')';
      var on = 0;
      railStops.forEach(function (s, i) { if (p >= s) on = i; });
      railItems.forEach(function (li, i) { li.classList.toggle('is-on', i === on); });
    }

    if (finePointer && !reduce) {
      stage.addEventListener('pointermove', function (e) {
        pointer.tx = (e.clientX / vw) * 2 - 1;
        pointer.ty = (e.clientY / vh) * 2 - 1;
        request();
      });
      stage.addEventListener('pointerleave', function () { pointer.tx = 0; pointer.ty = 0; request(); });
    }
  }

  // ---------- Fit statement ----------
  var say = document.querySelector('[data-say]');
  var words = [];
  if (say) {
    var text = say.textContent.trim().split(/\s+/);
    say.textContent = '';
    text.forEach(function (t, i) {
      var s = document.createElement('span');
      s.className = 'w';
      s.textContent = t;
      say.appendChild(s);
      if (i < text.length - 1) say.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  }
  function renderSay() {
    if (!say) return;
    var r = say.getBoundingClientRect();
    var vhh = window.innerHeight;
    var p = clamp((vhh * 0.85 - r.top) / (vhh * 0.55));
    var n = Math.round(p * words.length);
    words.forEach(function (w, i) { w.classList.toggle('is-on', i < n); });
  }

  // ---------- Shop cards: tilt toward the pointer ----------
  if (finePointer && !reduce) {
    [].forEach.call(document.querySelectorAll('.card__shot'), function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 6) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  // ---------- Frame loop: only runs while something is changing ----------
  var queued = false;
  function frame() {
    queued = false;
    if (story) {
      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;
      renderStory();
      if (Math.abs(pointer.tx - pointer.x) > 0.002 || Math.abs(pointer.ty - pointer.y) > 0.002) request();
    }
    renderSay();
  }
  function request() { if (!queued) { queued = true; requestAnimationFrame(frame); } }

  if (story) measure();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () { if (story) measure(); request(); });
  frame();
})();
