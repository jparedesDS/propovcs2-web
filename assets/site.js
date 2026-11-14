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

  // Compare two pros (14/11/2026): the page carries every pro as JSON.
  var cmp = document.getElementById('compare');
  var cmpData = document.getElementById('compare-data');
  if (cmp && cmpData) {
    var pros = JSON.parse(cmpData.textContent);
    var bySlug = {};
    pros.forEach(function (p) { bySlug[p.s] = p; });
    var pickA = document.getElementById('cmp-a'), pickB = document.getElementById('cmp-b');
    var out = document.getElementById('cmp-out');
    var prefix = cmp.getAttribute('data-prefix') || '';
    function el(tag, cls, text) {
      var node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text !== undefined) node.textContent = text;
      return node;
    }
    [pickA, pickB].forEach(function (pick) {
      pros.forEach(function (p) {
        var option = el('option', '', p.t ? p.n + ' · ' + p.t : p.n);
        option.value = p.s;
        pick.appendChild(option);
      });
    });
    var params = new URLSearchParams(location.search);
    var a = bySlug[params.get('a')] ? params.get('a') : pros[0] && pros[0].s;
    var b = bySlug[params.get('b')] ? params.get('b') : (pros.filter(function (p) { return p.s !== a; })[0] || {}).s;
    pickA.value = a; pickB.value = b;
    function head(p) {
      var cell = el('th', 'cmp-who');
      if (p.ph) {
        var img = el('img', 'cmp-ph'); img.src = p.ph; img.alt = p.n; img.loading = 'lazy';
        cell.appendChild(img);
      } else { cell.appendChild(el('div', 'cmp-ph noface', p.n.slice(0, 2).toUpperCase())); }
      var link = el('a', 'cmp-name', p.n); link.href = prefix + '/players/' + p.s + '/';
      cell.appendChild(link);
      if (p.t) cell.appendChild(el('div', 'dim', p.t));
      return cell;
    }
    function table(rowsA, rowsB, links) {
      var labels = [], seen = {};
      rowsA.concat(rowsB).forEach(function (r) { if (!seen[r[0]]) { seen[r[0]] = 1; labels.push(r[0]); } });
      var find = function (rows, label) { return rows.filter(function (r) { return r[0] === label; })[0]; };
      var body = el('tbody');
      labels.forEach(function (label) {
        var ra = find(rowsA, label), rb = find(rowsB, label);
        var row = el('tr', ra && rb && ra[1] !== rb[1] ? 'diff' : '');
        row.appendChild(el('td', 'cmp-label', label));
        [ra, rb].forEach(function (r) {
          var cell = el('td');
          if (r && links && r[2]) {
            var link = el('a', '', r[1]); link.href = r[2]; link.rel = 'sponsored noopener'; link.target = '_blank';
            cell.appendChild(link);
          } else { cell.textContent = r ? r[1] : '–'; }
          row.appendChild(cell);
        });
        body.appendChild(row);
      });
      return body;
    }
    function render() {
      var pa = bySlug[pickA.value], pb = bySlug[pickB.value];
      out.textContent = '';
      if (!pa || !pb) return;
      var grid = el('table', 'cmp-table');
      var top = el('thead'), tr = el('tr');
      tr.appendChild(el('th'));
      tr.appendChild(head(pa)); tr.appendChild(head(pb));
      top.appendChild(tr); grid.appendChild(top);
      var codes = el('tr', pa.x && pb.x && pa.x !== pb.x ? 'diff' : '');
      codes.appendChild(el('td', 'cmp-label', cmp.getAttribute('data-code') || 'Crosshair'));
      [pa, pb].forEach(function (p) {
        var cell = el('td');
        if (p.x) {
          var button = el('button', 'copy', '📋 ' + p.x); button.type = 'button';
          button.setAttribute('data-copy', p.x);
          cell.appendChild(button);
        } else { cell.textContent = '–'; }
        codes.appendChild(cell);
      });
      var body = table(pa.rows, pb.rows, false);
      body.insertBefore(codes, body.firstChild);
      grid.appendChild(body);
      grid.appendChild(table(pa.g, pb.g, true));
      var wrap = el('div', 'tablewrap'); wrap.appendChild(grid);
      out.appendChild(wrap);
      var query = '?a=' + encodeURIComponent(pa.s) + '&b=' + encodeURIComponent(pb.s);
      if (history.replaceState) history.replaceState(null, '', location.pathname + query);
    }
    pickA.addEventListener('change', render);
    pickB.addEventListener('change', render);
    render();
  }
})();
