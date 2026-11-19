// Home page: smooth scrolling, scroll story, fit statement, shop-card tilt.
// Everything is driven by scroll position or the pointer; nothing plays on its own.
(function () {
  var html = document.documentElement;
  var root = html.dataset.root || '';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  function clamp(x, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); }
  function fade(p, a, b, e) { e = e || 0.04; return Math.min(smooth(a - e, a, p), 1 - smooth(b, b + e, p)); }

  // ---------- Smooth scrolling (Lenis) ----------
  // Wheel and trackpad scrolling glide instead of jumping in steps. Touch keeps native scrolling.
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true, autoRaf: true });
  }
  function scrollY() { return lenis ? lenis.animatedScroll : window.scrollY; }

  // ---------- Scroll story ----------
  var story = document.querySelector('[data-story]');
  var NW = 1376, NH = 1824; // natural size of every product image

  // Points are fractions of the image. full = centre of the glasses,
  // inlay = centre of the carbon strip, len = strip length as a fraction of image width,
  // angle = strip slope in degrees (the camera levels it while zooming in).
  var LAYERS = {
    c34: { src: 'assets/story/caramel-34.webp', full: [0.500, 0.490], inlay: [0.739, 0.476], len: 0.19, angle: -11.5 }
  };
  var ORDER = ['c34'];

  if (story) {
    var stage = story.querySelector('.story__stage');
    var anchor = story.querySelector('.story__scrim');
    var sheen = story.querySelector('.story__sheen');
    var bar = story.querySelector('.story__bar');
    var count = story.querySelector('[data-count]');
    var chaps = [].slice.call(story.querySelectorAll('.chap'));

    ORDER.forEach(function (id) {
      var slot = document.createElement('div');
      slot.className = 'slot';
      var img = new Image(NW, NH);
      img.src = root + LAYERS[id].src;
      img.alt = '';
      img.decoding = 'async';
      slot.appendChild(img);
      stage.insertBefore(slot, anchor);
      LAYERS[id].slot = slot;
      LAYERS[id].img = img;
    });

    var vw, vh, mobile, W, storyTop, storyLen;
    function measure() {
      vw = stage.clientWidth; vh = stage.clientHeight;
      mobile = vw < 900;
      var pair = mobile ? 0.86 * vw : Math.min(0.54 * vw, 1.3 * vh); // on-screen width of the whole pair
      W = pair / 0.88; // the pair is about 88% of the image width
      storyTop = story.getBoundingClientRect().top + window.scrollY;
      storyLen = story.offsetHeight - vh;
    }

    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    function place(L, f, z, rot, cx, cy) {
      var s = W * z / NW;
      L.img.style.transform = 'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0) rotate(' + rot.toFixed(3) + 'deg) scale(' + s.toFixed(5) + ') translate3d(' + (-f[0] * NW).toFixed(2) + 'px,' + (-f[1] * NH).toFixed(2) + 'px,0)';
      L.cur = { f: f, s: s, rot: rot, cx: cx, cy: cy };
    }
    function project(L, pt) {
      var c = L.cur, r = c.rot * Math.PI / 180;
      var dx = (pt[0] - c.f[0]) * NW * c.s, dy = (pt[1] - c.f[1]) * NH * c.s;
      return [c.cx + dx * Math.cos(r) - dy * Math.sin(r), c.cy + dx * Math.sin(r) + dy * Math.cos(r)];
    }

    // Timeline (0–1 across the pinned section):
    //   0.00–0.14  01 whole pair
    //   0.14–0.38  zoom into the temple inlay, levelled
    //   0.40–0.58  light sweeps across the weave      (02 text 0.26–0.60)
    //   0.62–0.78  pull back out
    //   0.78–1.00  03 weight counts up to 20 g
    function renderStory() {
      var p = clamp((scrollY() - storyTop) / storyLen);

      var h = smooth(0.04, 0.20, p); // leaving the hero framing
      var k = reduce ? 0 : smooth(0.14, 0.38, p) - smooth(0.62, 0.78, p);
      var outro = 1 - 0.06 * smooth(0.76, 0.88, p);
      var cx = (mobile ? 0.5 : lerp(0.60, 0.66, h)) * vw + pointer.x * 12;
      var cy = (mobile ? lerp(0.56, 0.34, h) : lerp(0.62, 0.5, h)) * vh + pointer.y * 8;
      var inlayPx = mobile ? 0.78 * vw : Math.min(0.42 * vw, 620);

      var L = LAYERS.c34;
      var zIn = inlayPx / (L.len * W);
      var f = [lerp(L.full[0], L.inlay[0], k), lerp(L.full[1], L.inlay[1], k)];
      place(L, f, lerp(1, zIn, k) * outro, -L.angle * k + pointer.x * 1, cx, cy);

      anchor.style.opacity = mobile ? h : k;

      var showSheen = reduce ? 0 : fade(p, 0.40, 0.58, 0.02);
      sheen.style.opacity = showSheen;
      if (showSheen > 0) {
        var a = project(L, L.inlay);
        var span = inlayPx * 0.7;
        sheen.style.transform = 'translate3d(' + (a[0] + lerp(-span, span, clamp((p - 0.40) / 0.18))) + 'px,' + a[1] + 'px,0) rotate(18deg)';
      }

      if (count) count.textContent = Math.round(20 * smooth(0.80, 0.92, p));

      chaps.forEach(function (c) {
        var o = fade(p, +c.dataset.in, +c.dataset.out);
        c.style.opacity = o;
        var y = reduce ? 0 : (1 - o) * 20 * (p < +c.dataset.in ? 1 : -1);
        c.style.transform = (c.classList.contains('chap--mid') && !mobile ? 'translateY(-50%) ' : '') + 'translate3d(0,' + y.toFixed(1) + 'px,0)';
        c.classList.toggle('is-on', o > 0.5);
      });

      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
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
    var n = Math.round(clamp((vhh * 0.85 - r.top) / (vhh * 0.55)) * words.length);
    words.forEach(function (w, i) { w.classList.toggle('is-on', i < n); });
  }

  // ---------- Shop cards: tilt toward the pointer ----------
  if (finePointer && !reduce) {
    [].forEach.call(document.querySelectorAll('.card__shot'), function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateY(' + (x * 7) + 'deg) rotateX(' + (-y * 5) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  // ---------- Frame loop: only runs while something is changing ----------
  var queued = false;
  function frame() {
    queued = false;
    if (story) {
      pointer.x += (pointer.tx - pointer.x) * 0.1;
      pointer.y += (pointer.ty - pointer.y) * 0.1;
      renderStory();
      if (Math.abs(pointer.tx - pointer.x) > 0.002 || Math.abs(pointer.ty - pointer.y) > 0.002) request();
    }
    renderSay();
  }
  function request() { if (!queued) { queued = true; requestAnimationFrame(frame); } }

  if (story) measure();
  if (lenis) lenis.on('scroll', request);
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () { if (story) measure(); request(); });
  window.addEventListener('load', function () { if (story) measure(); request(); });
  frame();
})();
