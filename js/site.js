// Shared behaviour: mobile menu, waitlist form, Shopify checkout, product page.
// Language comes from <html lang>. Pages in /fr/ set data-root="../" so asset paths resolve.
(function () {
  var cfg = window.MOTIF;
  var html = document.documentElement;
  var lang = html.lang === 'fr' ? 'fr' : 'en';
  var root = html.dataset.root || '';
  var t = function (v) { return v && typeof v === 'object' ? v[lang] : v; };

  var TEXT = {
    en: {
      badEmail: 'Enter a valid email address.',
      notConnected: 'The waitlist is not connected yet. Set waitlistEndpoint in js/config.js.',
      adding: 'Adding you…',
      added: "You're on the list. We'll email you once, when they ship.",
      failed: "That didn't go through. Try again in a moment.",
      show: 'Show ',
      buy: 'Buy now',
      opening: 'Opening checkout…',
      checkoutFailed: "Checkout didn't open. Try again in a moment."
    },
    fr: {
      badEmail: 'Entrez une adresse courriel valide.',
      notConnected: 'La liste d’attente n’est pas encore branchée. Renseignez waitlistEndpoint dans js/config.js.',
      adding: 'Inscription en cours…',
      added: 'C’est noté. Vous recevrez un seul courriel, à l’expédition.',
      failed: 'L’envoi n’a pas fonctionné. Réessayez dans un instant.',
      show: 'Afficher la ',
      buy: 'Acheter',
      opening: 'Ouverture du paiement…',
      checkoutFailed: 'Le paiement ne s’est pas ouvert. Réessayez dans un instant.'
    }
  }[lang];

  // ---- Start at the top ----
  // A new page should open at its top unless the link asked for a section (#shop, #waitlist…).
  // Some embedded viewers keep the previous page's scroll position, so set it explicitly.
  if (!location.hash) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.documentElement.scrollIntoView({ block: 'start' });
  }

  // ---- Mobile menu ----
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // ---- Product page state (used by the waitlist form too) ----
  var pdp = document.querySelector('[data-pdp]');
  var state = { colour: 'caramel', view: 0 };

  // ---- Waitlist form ----
  var form = document.querySelector('[data-waitlist]');
  if (form) {
    var msg = form.querySelector('.form-msg');
    var say = function (text, kind) { msg.textContent = text; msg.dataset.state = kind || ''; };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var email = input.value.trim();
      if (!input.checkValidity() || !email) { say(TEXT.badEmail, 'error'); input.focus(); return; }
      if (!cfg.waitlistEndpoint) { say(TEXT.notConnected, 'error'); return; }
      var btn = form.querySelector('button');
      btn.disabled = true;
      say(TEXT.adding);
      fetch(cfg.waitlistEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email, colour: pdp ? state.colour : null, lang: lang, source: location.pathname })
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.reset();
        say(TEXT.added);
      }).catch(function () {
        say(TEXT.failed, 'error');
      }).then(function () { btn.disabled = false; });
    });
  }

  // ---- Shopify checkout (shop mode only) ----
  // Creates a cart with one pair and sends the buyer to Shopify's hosted checkout.
  function checkout(colour) {
    var s = cfg.shopify;
    var query = 'mutation($lines:[CartLineInput!]!,$lang:LanguageCode)@inContext(language:$lang){cartCreate(input:{lines:$lines}){cart{checkoutUrl}userErrors{message}}}';
    return fetch('https://' + s.domain + '/api/' + s.apiVersion + '/graphql.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': s.storefrontToken },
      body: JSON.stringify({ query: query, variables: { lang: lang.toUpperCase(), lines: [{ merchandiseId: s.variants[colour], quantity: 1 }] } })
    }).then(function (r) { return r.json(); }).then(function (res) {
      var out = res.data && res.data.cartCreate;
      if (!out || !out.cart) throw new Error(out && out.userErrors.length ? out.userErrors[0].message : 'Checkout unavailable');
      location.href = out.cart.checkoutUrl;
    });
  }

  if (!pdp) return;

  // ---- Product page ----
  var asked = new URLSearchParams(location.search).get('colour');
  if (cfg.colours[asked]) state.colour = asked;

  var el = function (k) { return pdp.querySelector('[data-' + k + ']'); };
  var mainImg = el('main-img'), thumbs = el('thumbs'), pills = el('pills');
  var cta = el('cta'), ctaNote = el('cta-msg');
  var langLinks = document.querySelectorAll('[data-lang-link]');

  function button(cls, pressed, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('aria-pressed', String(pressed));
    b.addEventListener('click', onClick);
    return b;
  }

  function render() {
    var c = cfg.colours[state.colour];
    var v = c.views[state.view];
    mainImg.src = root + v.src;
    mainImg.alt = t(v.alt);
    el('name').textContent = t(c.name);
    el('name2').textContent = t(c.name);
    el('desc').textContent = t(c.desc);
    el('price').textContent = t(cfg.price);
    document.title = 'Oval 01 / ' + t(c.name) + ' — MOTIF';

    // Keep the chosen colour when switching language.
    langLinks.forEach(function (a) {
      a.setAttribute('href', a.getAttribute('href').split('?')[0] + '?colour=' + state.colour);
    });

    thumbs.textContent = '';
    c.views.forEach(function (view, i) {
      var b = button('thumb', i === state.view, function () { state.view = i; render(); });
      b.setAttribute('aria-label', TEXT.show + t(view.label));
      var img = document.createElement('img');
      img.src = root + view.src; img.alt = '';
      b.appendChild(img);
      thumbs.appendChild(b);
    });

    pills.textContent = '';
    Object.keys(cfg.colours).forEach(function (id) {
      var b = button('pill', id === state.colour, function () {
        state.colour = id; state.view = 0;
        history.replaceState(null, '', '?colour=' + id);
        render();
      });
      var sw = document.createElement('span');
      sw.className = 'swatch'; sw.style.background = cfg.colours[id].swatch; sw.setAttribute('aria-hidden', 'true');
      b.appendChild(sw);
      b.appendChild(document.createTextNode(t(cfg.colours[id].name)));
      pills.appendChild(b);
    });
  }

  if (cfg.mode === 'shop') {
    cta.textContent = TEXT.buy;
    cta.addEventListener('click', function (e) {
      e.preventDefault();
      cta.setAttribute('aria-disabled', 'true');
      ctaNote.textContent = TEXT.opening;
      checkout(state.colour).catch(function () {
        cta.removeAttribute('aria-disabled');
        ctaNote.textContent = TEXT.checkoutFailed;
      });
    });
  }

  render();
})();
