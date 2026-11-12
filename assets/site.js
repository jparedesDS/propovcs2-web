// propovcs2.com: copy buttons, player search, crosshair filter, table sorting.
(function () {
  var toast = document.getElementById('toast');
  function tell(text) {
    if (!toast) return;
    toast.textContent = (toast.getAttribute('data-copied') || 'Copied') + ': ' + text;
    toast.classList.add('on');
    clearTimeout(tell.timer);
    tell.timer = setTimeout(function () { toast.classList.remove('on'); }, 2600);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { tell(text); }, function () { fallback(text); });
    } else { fallback(text); }
  }
  function fallback(text) {
    var area = document.createElement('textarea');
    area.value = text; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.appendChild(area); area.select();
    try { document.execCommand('copy'); tell(text); } catch (e) {}
    document.body.removeChild(area);
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-copy]');
    if (button) copy(button.getAttribute('data-copy'));
  });

  // The 24/7 stream: Twitch's player only once asked for (it is heavy).
  document.querySelectorAll('[data-embed]').forEach(function (box) {
    box.addEventListener('click', function () {
      if (box.querySelector('iframe')) return;
      var frame = document.createElement('iframe');
      frame.src = box.getAttribute('data-embed');
      frame.allowFullscreen = true;
      frame.setAttribute('allow', 'autoplay; fullscreen');
      box.appendChild(frame);
    });
  });

  // Google Analytics only once the visitor accepts (its cookies need consent in the EU).
  var consent = document.getElementById('consent');
  function remembered() { try { return localStorage.getItem('consent'); } catch (e) { return null; } }
  function remember(value) { try { localStorage.setItem('consent', value); } catch (e) {} }
  function analytics(id) {
    if (window.gtagLoaded) return;
    window.gtagLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }
  if (consent) {
    var id = consent.getAttribute('data-ga');
    var said = remembered();
    if (said === 'yes') analytics(id);
    else if (said !== 'no') consent.hidden = false;
    consent.addEventListener('click', function (event) {
      var button = event.target.closest('[data-consent]');
      if (!button) return;
      var yes = button.getAttribute('data-consent') === 'yes';
      remember(yes ? 'yes' : 'no');
      consent.hidden = true;
      if (yes) analytics(id);
    });
    document.querySelectorAll('[data-consent-reset]').forEach(function (link) {
      link.addEventListener('click', function (event) { event.preventDefault(); consent.hidden = false; });
    });
  }

  document.querySelectorAll('input[data-search]').forEach(function (input) {
    var items = document.querySelectorAll(input.getAttribute('data-search'));
    var asked = new URLSearchParams(location.search).get('q');  // from the home page's search
    input.addEventListener('input', function () {
      var words = input.value.trim().toLowerCase();
      items.forEach(function (item) {
        item.hidden = words !== '' && (item.getAttribute('data-name') || '').indexOf(words) < 0;
      });
    });
    if (asked) { input.value = asked; input.dispatchEvent(new Event('input')); }
  });

  document.querySelectorAll('[data-filter]').forEach(function (bar) {
    var cards = document.querySelectorAll(bar.getAttribute('data-filter'));
    bar.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button) return;
      bar.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === button); });
      var value = button.getAttribute('data-value');
      cards.forEach(function (card) { card.hidden = value !== '' && card.getAttribute('data-style') !== value; });
    });
  });

  document.querySelectorAll('table.sortable').forEach(function (table) {
    var body = table.tBodies[0];
    table.querySelectorAll('th').forEach(function (th, column) {
      var up = true;
      th.addEventListener('click', function () {
        var numeric = th.hasAttribute('data-num');
        var rows = Array.prototype.slice.call(body.rows);
        rows.sort(function (a, b) {
          var x = a.cells[column].textContent.trim(), y = b.cells[column].textContent.trim();
          if (numeric) {
            var nx = parseFloat(x), ny = parseFloat(y);
            if (isNaN(nx)) return 1; if (isNaN(ny)) return -1;
            return up ? nx - ny : ny - nx;
          }
          return up ? x.localeCompare(y) : y.localeCompare(x);
        });
        up = !up;
        rows.forEach(function (row) { body.appendChild(row); });
      });
    });
  });
})();
