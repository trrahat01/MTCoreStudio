/* MT Core Studio — admin console logic (vanilla JS) */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  function encodeUTF8(value) {
    return btoa(unescape(encodeURIComponent(String(value))));
  }

  function setStatus(el, text, ok) {
    if (!el) return;
    el.textContent = text || '';
    el.className = 'status' + (ok ? ' ok' : (text ? ' err' : ' muted'));
  }

  async function api(action, payload) {
    var body = new FormData();
    body.append('action', action);
    body.append('csrf', MT_CSRF);
    if (payload) {
      Object.keys(payload).forEach(function (key) {
        var value = payload[key];
        if (Array.isArray(value)) {
          value.forEach(function (item) { body.append(key + '[]', item); });
        } else if (value && typeof value === 'object') {
          body.append(key, JSON.stringify(value));
        } else {
          body.append(key, value === null || value === undefined ? '' : value);
        }
      });
    }
    var res = await fetch('api.php', { method: 'POST', body: body });
    var json;
    try { json = await res.json(); } catch (e) { throw new Error('Server returned an invalid response.'); }
    if (!json.ok) {
      if (res.status === 401 || res.status === 403) {
        window.location.reload();
      }
      throw new Error(json.error || 'Request failed.');
    }
    return json;
  }

  /* ------------------------------- login --------------------------------- */

  function wireLogin() {
    var btnLogin = $('btn-login');
    var btnCreate = $('btn-create');
    var status = $('login-status');

    function attempt(pw1, pw2) {
      setStatus(status, 'Working…');
      return api('login', { password: encodeUTF8(pw1), password2: encodeUTF8(pw2 || '') })
        .then(function () { window.location.reload(); })
        .catch(function (err) { setStatus(status, err.message, false); });
    }

    if (btnLogin) {
      btnLogin.addEventListener('click', function () { attempt($('pw1').value, ''); });
      $('pw1').addEventListener('keydown', function (e) { if (e.key === 'Enter') attempt($('pw1').value, ''); });
    }
    if (btnCreate) {
      btnCreate.addEventListener('click', function () { attempt($('pw1').value, $('pw2').value); });
    }
  }

  /* ------------------------------ dashboard ------------------------------- */

  var appImage;

  function statusPillClass(status) {
    var s = String(status || '').toLowerCase();
    if (s.indexOf('publish') !== -1) return 'status-live';
    if (s.indexOf('develop') !== -1 || s.indexOf('beta') !== -1) return 'status-brew';
    return '';
  }

  function esc(value) {
    var div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  }
  function escAttr(value) { return esc(value).replace(/"/g, '&quot;'); }

  function renderApps(apps) {
    var list = $('apps-list');
    appImage = apps || [];
    if (!list) return;
    if (!apps.length) {
      list.innerHTML = '<p class="muted">No apps yet. Click “+ New app” to add your first app.</p>';
      return;
    }
    list.innerHTML = apps.map(function (app) {
      var id = String(app.id || '');
      var name = String(app.name || 'Unnamed app');
      var cat = String(app.category || '—');
      var status = String(app.status || 'Status to be confirmed');
      var desc = String(app.description || '').slice(0, 110);
      if (desc.length === 110) desc += '…';
      var monogram = name.split(/\s+/).slice(0, 2).map(function (w) { return (w[0] || '').toUpperCase(); }).join('');
      return (
        '<div class="app-row">' +
          '<div class="app-row-icon" aria-hidden="true">' + esc(monogram) + '</div>' +
          '<div class="app-row-info">' +
            '<strong>' + esc(name) + '</strong>' +
            '<span class="muted">' + esc(cat) + ' · ' + esc(id) + (desc ? ' — ' + esc(desc) : '') + '</span>' +
            '<span class="app-row-status ' + statusPillClass(status) + '">' + esc(status) + '</span>' +
          '</div>' +
          '<div class="app-row-actions">' +
            '<button class="btn btn-sm" type="button" data-act="edit" data-id="' + escAttr(id) + '">Edit</button>' +
            '<button class="btn btn-sm btn-danger" type="button" data-act="delete" data-id="' + escAttr(id) + '">Delete</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    list.querySelectorAll('button[data-act="edit"]').forEach(function (btn) {
      btn.addEventListener('click', function () { openEditor(btn.getAttribute('data-id')); });
    });
    list.querySelectorAll('button[data-act="delete"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        if (window.confirm('Delete this app permanently?') === true) {
          setStatus($('apps-status'), 'Deleting…');
          api('delete-app', { id: id })
            .then(function (json) { renderApps(json.apps); setStatus($('apps-status'), 'App deleted.', true); })
            .catch(function (err) { setStatus($('apps-status'), err.message, false); });
        }
      });
    });
  }
  function fillSettings(config) {
    $('s-email').value = config.email || '';
    $('s-play').value = config.playStoreUrl || '';
    $('s-github').value = config.githubUrl || '';
    $('s-youtube').value = config.youtubeUrl || '';
    $('s-facebook').value = config.facebookUrl || '';
    $('s-x').value = config.xUrl || '';
    $('s-devname').value = config.developerName || '';
    $('s-country').value = config.country || '';
  }

  function fillAds(lines) {
    $('ads-lines').value = (lines || []).join('\n');
  }

  function openEditor(id) {
    var editor = $('editor');
    editor.hidden = false;
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('editor-title').textContent = id ? 'Edit app' : 'Add a new app';

    var source = {};
    if (id && appImage) {
      var match = appImage.find(function (a) { return String(a.id) === id; });
      if (match) source = match;
    }

    $('f-original-id').value = source.id || '';
    $('f-name').value = source.name || '';
    $('f-category').value = source.category || '';
    $('f-status').value = source.status || 'Status to be confirmed';
    $('f-id').value = source.id || '';
    $('f-package').value = source.packageName || '';
    $('f-play-url').value = source.playStoreUrl || '';
    $('f-privacy-url').value = source.privacyUrl || '';
    $('f-icon').value = source.icon || '';
    $('f-description').value = source.description || '';
    $('f-features').value = (source.features || []).join('\n');
    $('f-screenshots').value = (source.screenshots || []).join('\n');
    $('import-url').value = source.playStoreUrl || '';
    setStatus($('import-status'), '');
    setStatus($('save-status'), '');
  }

  function openNewEditor() {
    var editor = $('editor');
    editor.hidden = false;
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('editor-title').textContent = 'Add a new app';
    ['f-original-id', 'f-name', 'f-category', 'f-id', 'f-package', 'f-play-url', 'f-privacy-url', 'f-icon', 'f-description', 'f-features', 'f-screenshots', 'import-url']
      .forEach(function (field) { $(field).value = ''; });
    $('f-status').value = 'Status to be confirmed';
    setStatus($('import-status'), '');
    setStatus($('save-status'), '');
  }

  function collectAppForm() {
    return {
      originalId: $('f-original-id').value,
      app: {
        name: $('f-name').value,
        category: $('f-category').value,
        status: $('f-status').value,
        id: $('f-id').value,
        packageName: $('f-package').value,
        playStoreUrl: $('f-play-url').value,
        privacyUrl: $('f-privacy-url').value,
        icon: $('f-icon').value,
        description: $('f-description').value,
        features: $('f-features').value.split('\n').filter(Boolean),
        screenshots: $('f-screenshots').value.split('\n').filter(Boolean)
      }
    };
  }

  /* -------------------------------- wiring -------------------------------- */

  function renderWaitlist(list) {
    var el = $('waitlist-list');
    if (!el) return;
    if (!list || !list.length) {
      el.innerHTML = '<p class="muted">No waitlist sign-ups yet. They appear here as visitors subscribe on the app pages.</p>';
      return;
    }
    el.innerHTML = '<div class="waitlist-table"><div class="waitlist-row waitlist-head"><span>App</span><span>Email</span><span>Date</span></div>' +
      list.map(function (entry) {
        return '<div class="waitlist-row"><span>' + esc(String(entry.app || '')) + '</span><span>' + esc(String(entry.email || '')) + '</span><span>' + esc(String(entry.date || '')) + '</span></div>';
      }).join('') +
      '</div><p class="muted waitlist-count">' + list.length + ' sign-up' + (list.length === 1 ? '' : 's') + '.</p>';
  }

  function downloadWaitlistCsv(list) {
    var rows = [['App', 'Email', 'Date']].concat((list || []).map(function (entry) {
      return [String(entry.app || ''), String(entry.email || ''), String(entry.date || '')];
    }));
    var csv = rows.map(function (row) {
      return row.map(function (cell) {
        var safe = String(cell).replace(/"/g, '""');
        return (safe.indexOf(',') !== -1 || safe.indexOf('"') !== -1 || safe.indexOf('\n') !== -1) ? '"' + safe + '"' : safe;
      }).join(',');
    }).join('\r\n');
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mt-core-studio-waitlist.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
  }

  function slugify(value) {
    return String(value).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function countryName(code) {
    var names = {
      US: 'United States', GB: 'United Kingdom', IN: 'India', DE: 'Germany',
      FR: 'France', CA: 'Canada', AU: 'Australia', NL: 'Netherlands',
      BR: 'Brazil', ID: 'Indonesia', PK: 'Pakistan', BD: 'Bangladesh',
      NG: 'Nigeria', PH: 'Philippines', VN: 'Vietnam', EG: 'Egypt',
      TR: 'Turkey', SA: 'Saudi Arabia', AE: 'United Arab Emirates',
      UA: 'Ukraine', PL: 'Poland', ES: 'Spain', IT: 'Italy', JP: 'Japan',
      KR: 'South Korea', MX: 'Mexico', AR: 'Argentina', ZA: 'South Africa',
      KE: 'Kenya', GH: 'Ghana', RO: 'Romania', CZ: 'Czechia', SE: 'Sweden',
      CH: 'Switzerland', AT: 'Austria', BE: 'Belgium', PT: 'Portugal',
      FI: 'Finland', NO: 'Norway', DK: 'Denmark', IE: 'Ireland', NZ: 'New Zealand'
    };
    return names[String(code).toUpperCase()] || String(code).toUpperCase() || 'Unknown';
  }

  function renderVisits(stats, countries, recent) {
    var el = $('visits-stats');
    if (!el) return;
    var s = stats || {};
    var total = s.total || 0;
    if (total === 0) {
      el.innerHTML = '<p class="muted">No visits recorded yet. They appear here as people open the public pages (the visit beacon is live).</p>';
      return;
    }
    var statRow = '<div class="stat-grid">' +
      '<div class="stat-tile"><b>' + (s.today || 0) + '</b><span>Today</span></div>' +
      '<div class="stat-tile"><b>' + (s.yesterday || 0) + '</b><span>Yesterday</span></div>' +
      '<div class="stat-tile"><b>' + (s.week || 0) + '</b><span>Last 7 days</span></div>' +
      '<div class="stat-tile"><b>' + (s.month || 0) + '</b><span>Last 30 days</span></div>' +
      '</div>';

    var countryRows = '';
    var entries = Object.keys(countries || {}).slice(0, 10);
    if (entries.length) {
      var top = entries[0];
      var max = countries[top] || 1;
      countryRows = '<div class="country-list">' + entries.map(function (code) {
        var count = countries[code] || 0;
        var pct = Math.round((count / max) * 100);
        var label = code === '??' ? 'Unknown' : countryName(code);
        return '<div class="country-row">' +
          '<span class="country-flag">' + esc(label.slice(0, 2).toUpperCase()) + '</span>' +
          '<span class="country-name">' + esc(label) + '</span>' +
          '<span class="country-bar"><i style="width:' + pct + '%"></i></span>' +
          '<span class="country-count">' + count + '</span>' +
          '</div>';
      }).join('') + '</div>';
    }

    el.innerHTML = statRow +
      '<p class="muted" style="margin-top:14px">Top countries (approximate, from the visit beacon):</p>' + countryRows;
  }

  function wireDashboard() {
    if (!MT_LOGGED_IN) return;

    api('list').then(function (json) {
      renderApps(json.apps);
      fillSettings(json.config);
      fillAds(json.ads);
    }).catch(function (err) {
      setStatus($('apps-status'), err.message, false);
    });

    $('btn-logout').addEventListener('click', function () {
      api('logout').then(function () { window.location.reload(); });
    });

    $('btn-new-app').addEventListener('click', openNewEditor);
    $('btn-cancel').addEventListener('click', function () { $('editor').hidden = true; });

    $('app-form').addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus($('save-status'), 'Saving…');
      api('save-app', collectAppForm())
        .then(function (json) {
          renderApps(json.apps);
          $('editor').hidden = true;
          setStatus($('apps-status'), 'App saved. It is live on the website now.', true);
        })
        .catch(function (err) { setStatus($('save-status'), err.message, false); });
    });

    $('btn-import').addEventListener('click', function () {
      setStatus($('import-status'), 'Fetching details from Google Play…');
      api('import-play', { url: $('import-url').value })
        .then(function (json) {
          var info = json.info;
          $('f-name').value = info.name || '';
          $('f-package').value = info.packageName || '';
          $('f-category').value = info.category || '';
          $('f-description').value = info.description || '';
          $('f-icon').value = json.iconSaved || info.icon || '';
          $('f-screenshots').value = (info.screenshots || []).slice(0, 6).join('\n');
          if (info.name) { $('f-id').value = slugify(info.name); }
          setStatus($('import-status'), 'Details filled in. Review them, then press “Save app”.', true);
        })
        .catch(function (err) { setStatus($('import-status'), err.message, false); });
    });

    $('settings-form').addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus($('settings-status'), 'Saving…');
      api('save-config', {
        email: $('s-email').value,
        playStoreUrl: $('s-play').value,
        githubUrl: $('s-github').value,
        youtubeUrl: $('s-youtube').value,
        facebookUrl: $('s-facebook').value,
        xUrl: $('s-x').value,
        developerName: $('s-devname').value,
        country: $('s-country').value
      })
        .then(function () { setStatus($('settings-status'), 'Settings saved.', true); })
        .catch(function (err) { setStatus($('settings-status'), err.message, false); });
    });

    $('ads-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var lines = $('ads-lines').value.split('\n')
        .map(function (l) { return l.trim(); })
        .filter(Boolean);
      setStatus($('ads-status'), 'Saving…');
      api('save-ads', { lines: lines })
        .then(function (json) {
          var count = json.ads.length;
          setStatus($('ads-status'), 'app-ads.txt updated (' + count + ' line' + (count === 1 ? '' : 's') + ').', true);
        })
        .catch(function (err) { setStatus($('ads-status'), err.message, false); });
    });

    api('waitlist-list')
      .then(function (json) { renderWaitlist(json.waitlist); })
      .catch(function (err) { setStatus($('waitlist-status'), err.message, false); });

    var btnExport = $('btn-waitlist-export');
    if (btnExport) {
      btnExport.addEventListener('click', function () {
        api('waitlist-list')
          .then(function (json) { downloadWaitlistCsv(json.waitlist); })
          .catch(function (err) { setStatus($('waitlist-status'), err.message, false); });
      });
    }

    var btnClear = $('btn-waitlist-clear');
    if (btnClear) {
      btnClear.addEventListener('click', function () {
        if (!window.confirm('Remove every waitlist entry? This cannot be undone.')) return;
        api('waitlist-clear')
          .then(function (json) {
            renderWaitlist(json.waitlist);
            setStatus($('waitlist-status'), 'Waitlist cleared.', true);
          })
          .catch(function (err) { setStatus($('waitlist-status'), err.message, false); });
      });
    }

    /* ------------------------------ visitors ------------------------------ */

    api('visits-stats')
      .then(function (json) {
        renderVisits(json.stats, json.countries, json.recent);
      })
      .catch(function (err) { setStatus($('visits-status'), err.message, false); });

    var btnVisitsExport = $('btn-visits-export');
    if (btnVisitsExport) {
      btnVisitsExport.addEventListener('click', function () {
        var body = new FormData();
        body.append('action', 'visits-export');
        body.append('csrf', MT_CSRF);
        fetch('api.php', { method: 'POST', body: body })
          .then(function (res) {
            if (!res.ok) throw new Error('Export failed.');
            return res.blob();
          })
          .then(function (blob) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'mt-core-studio-visits.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
          })
          .catch(function () { setStatus($('visits-status'), 'Could not create the CSV export.', false); });
      });
    }

    var btnVisitsClear = $('btn-visits-clear');
    if (btnVisitsClear) {
      btnVisitsClear.addEventListener('click', function () {
        if (!window.confirm('Remove all recorded visits? This cannot be undone.')) return;
        api('visits-clear')
          .then(function (json) {
            renderVisits(json, {}, []);
            setStatus($('visits-status'), 'Visit log cleared.', true);
          })
          .catch(function (err) { setStatus($('visits-status'), err.message, false); });
      });
    }
  }

  wireLogin();
  wireDashboard();
})();

