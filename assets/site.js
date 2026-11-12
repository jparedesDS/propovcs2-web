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

  document.querySelectorAll('input[data-search]').forEach(function (input) {
    var items = document.querySelectorAll(input.getAttribute('data-search'));
    input.addEventListener('input', function () {
      var words = input.value.trim().toLowerCase();
      items.forEach(function (item) {
        item.hidden = words !== '' && (item.getAttribute('data-name') || '').indexOf(words) < 0;
      });
    });
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
