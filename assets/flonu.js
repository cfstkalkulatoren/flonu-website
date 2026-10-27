/* Flonu website: language switch, navigation, small interactions. */
(function () {
  'use strict';

  /* Kein Browser-Speicher, keine Cookies: Die Sprache steckt nur in der Adresse (?lang=en). */
  var root = document.documentElement;

  /* Jede Seite startet oben, außer der Link enthält ausdrücklich einen Anker (#...). */
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  if (!window.location.hash) window.scrollTo(0, 0);

  function fromUrl() {
    try { var p = new URLSearchParams(window.location.search).get('lang'); return p === 'en' || p === 'de' ? p : null; } catch (e) { return null; }
  }

  function updateLinks(l) {
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = a.getAttribute('href');
      if (!href || /^(https?:|mailto:|tel:|#)/.test(href)) continue;
      if (!/\.html(\?|#|$)/.test(href)) continue;
      var hash = '';
      var hi = href.indexOf('#');
      if (hi > -1) { hash = href.slice(hi); href = href.slice(0, hi); }
      href = href.replace(/[?&]lang=(de|en)/, '').replace(/\?$/, '');
      if (l === 'en') href += (href.indexOf('?') > -1 ? '&' : '?') + 'lang=en';
      a.setAttribute('href', href + hash);
    }
  }

  function setLang(l) {
    if (l !== 'en') l = 'de';
    root.setAttribute('lang', l);
    root.setAttribute('data-lang', l);
    var t = root.getAttribute('data-title-' + l);
    if (t) document.title = t;
    var btns = document.querySelectorAll('[data-set-lang]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-set-lang') === l ? 'true' : 'false');
    }
    var ph = document.querySelectorAll('[data-ph-' + l + ']');
    for (var j = 0; j < ph.length; j++) ph[j].setAttribute('placeholder', ph[j].getAttribute('data-ph-' + l));
    var al = document.querySelectorAll('[data-alt-' + l + ']');
    for (var k = 0; k < al.length; k++) al[k].setAttribute('alt', al[k].getAttribute('data-alt-' + l));
    updateLinks(l);
    document.dispatchEvent(new CustomEvent('flonu:lang', { detail: { lang: l } }));
  }

  window.Flonu = {
    lang: function () { return root.getAttribute('data-lang') || 'de'; },
    t: function (obj) { return obj[window.Flonu.lang()] || obj.de; },
    setLang: setLang
  };

  setLang(fromUrl() || 'de');

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-set-lang]');
    if (b) { setLang(b.getAttribute('data-set-lang')); }
  });

  /* Mobile menu */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* Copy buttons */
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]');
    if (!c) return;
    var text = c.getAttribute('data-copy');
    var done = function () {
      var old = c.innerHTML;
      c.textContent = window.Flonu.lang() === 'en' ? 'Copied' : 'Kopiert';
      setTimeout(function () { c.innerHTML = old; }, 1600);
    };
    try {
      navigator.clipboard.writeText(text).then(done, function () { selectText(c); });
    } catch (err) { selectText(c); }
  });
  function selectText(c) {
    var target = c.parentNode.querySelector('code');
    if (!target) return;
    var r = document.createRange(); r.selectNodeContents(target);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* Self-check list (home) */
  var list = document.querySelector('[data-checklist]');
  if (list) {
    var items = list.querySelectorAll('.check');
    var out = document.querySelector('[data-check-count]');
    var msg = document.querySelector('[data-check-msg]');
    var total = items.length;
    var msgs = {
      de: [
        'Tipp an, was heute schon stimmt.',
        'Der Rest ist das, woran wir arbeiten.',
        'Alle sieben abgehakt. Dann brauchst du dieses Coaching nicht. Schön für dich.'
      ],
      en: [
        'Tap what is already true today.',
        'The rest is what we work on.',
        'All seven ticked. Then you do not need this coaching. Good for you.'
      ]
    };
    var render = function () {
      var n = 0;
      for (var i = 0; i < items.length; i++) if (items[i].getAttribute('aria-pressed') === 'true') n++;
      if (out) out.textContent = n + '/' + total;
      var l = window.Flonu.lang();
      var touched = list.getAttribute('data-touched') === '1';
      if (msg) msg.textContent = !touched ? msgs[l][0] : (n === total ? msgs[l][2] : msgs[l][1]);
    };
    list.addEventListener('click', function (e) {
      var b = e.target.closest('.check');
      if (!b) return;
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      list.setAttribute('data-touched', '1');
      render();
    });
    document.addEventListener('flonu:lang', render);
    render();
  }

  /* Knowledge filter */
  var filters = document.querySelector('[data-filters]');
  if (filters) {
    var entries = document.querySelectorAll('[data-cat]');
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-filter]');
      if (!b) return;
      var f = b.getAttribute('data-filter');
      var bs = filters.querySelectorAll('button');
      for (var i = 0; i < bs.length; i++) bs[i].setAttribute('aria-pressed', bs[i] === b ? 'true' : 'false');
      for (var j = 0; j < entries.length; j++) {
        entries[j].hidden = !(f === 'all' || entries[j].getAttribute('data-cat') === f);
      }
    });
  }

  /* Footer year */
  var y = document.querySelectorAll('[data-year]');
  for (var q = 0; q < y.length; q++) y[q].textContent = String(new Date().getFullYear());
})();
