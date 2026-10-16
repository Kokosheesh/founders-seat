/* Founder's Seat — player accounts and play tracking (Supabase Auth + REST, no SDK). */
(function () {
  'use strict';
  var SB = 'https://xxdxuuqmftxufvnkkuif.supabase.co';
  var KEY = 'sb_publishable_-QIiye3pp3AmD6UvuBz__A_LtfUeg4F'; // publishable: safe in the browser; tables are protected by row-level security
  var SK = 'fs_auth_v1';
  var sess = null, offline = false, lastTrack = '';
  function $(id) { return document.getElementById(id); }
  function esc(x) { return String(x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function save() { try { if (sess) localStorage.setItem(SK, JSON.stringify(sess)); else localStorage.removeItem(SK); } catch (e) { } }
  function read() { try { return JSON.parse(localStorage.getItem(SK) || 'null'); } catch (e) { return null; } }

  function req(path, opts) {
    opts = opts || {};
    var h = { apikey: KEY, 'Content-Type': 'application/json' };
    if (opts.auth && sess) h.Authorization = 'Bearer ' + sess.access_token;
    for (var k in opts.headers || {}) h[k] = opts.headers[k];
    return fetch(SB + path, { method: opts.method || 'GET', headers: h, body: opts.body ? JSON.stringify(opts.body) : undefined }).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { }
        if (!r.ok) { var msg = (j && (j.msg || j.message || j.error_description || j.error)) || ('HTTP ' + r.status); var err = new Error(msg); err.status = r.status; throw err; }
        return j;
      });
    });
  }
  function take(j) {
    if (!j || !j.access_token) throw new Error('No session returned. Email confirmation may be switched on in Supabase.');
    sess = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: { id: j.user.id, email: j.user.email, name: (j.user.user_metadata || {}).name || '' } };
    save(); return sess;
  }
  function fresh() {
    if (!sess) return Promise.reject(new Error('Not signed in'));
    if (sess.expires_at - 90 > Date.now() / 1000) return Promise.resolve(sess);
    return req('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: sess.refresh_token } }).then(take);
  }
  function friendly(e) {
    var m = String(e && e.message || e);
    if (/Invalid login credentials/i.test(m)) return 'That email and password do not match an account.';
    if (/already registered|already been registered|User already registered/i.test(m)) return 'An account with this email already exists. Sign in instead.';
    if (/Password should be at least/i.test(m)) return 'Use a password of at least 6 characters.';
    if (/rate limit/i.test(m)) return 'Too many attempts. Wait a minute and try again.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Cannot reach the sign-in server.';
    return m;
  }

  function trackLogin() {
    if (!sess || offline) return;
    fresh().then(function () {
      req('/rest/v1/logins?on_conflict=user_id,day', { method: 'POST', auth: true, headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: { user_id: sess.user.id } }).catch(function () { });
      req('/rest/v1/players?id=eq.' + sess.user.id, { method: 'PATCH', auth: true, headers: { Prefer: 'return=minimal' }, body: { last_seen: new Date().toISOString() } }).catch(function () { });
    }).catch(function () { });
  }

  var FSAuth = {
    get user() { return sess && sess.user; },
    get offline() { return offline; },
    trackGame: function (S, sc) {
      if (!sess || offline || !S || !S.clientId) return;
      var key = S.clientId + ':' + S.month + ':' + (S.over ? 1 : 0); if (key === lastTrack) return; lastTrack = key;
      var body = { user_id: sess.user.id, client_id: S.clientId, seed: S.seed, archetype: S.archetype, month: S.month, outcome: S.outcome || null, finished: !!S.over, updated_at: new Date().toISOString() };
      if (sc) { body.founder_outcome = Math.round(sc.founderOutcome * 100) / 100; body.decision_quality = Math.round(sc.dq); }
      fresh().then(function () {
        return req('/rest/v1/games?on_conflict=user_id,client_id', { method: 'POST', auth: true, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: body });
      }).catch(function () { lastTrack = ''; });
    },
    signOut: function () {
      var t = sess; sess = null; save();
      if (t) fetch(SB + '/auth/v1/logout', { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + t.access_token } }).catch(function () { });
      location.reload();
    },
    gate: function (cb) {
      sess = read();
      if (sess) {
        fresh().then(function () { trackLogin(); chip(); cb(); }).catch(function (e) {
          if (e && e.status) { sess = null; save(); screen(cb); } else { offline = true; chip(); cb(); }
        });
        return;
      }
      screen(cb);
    }
  };
  window.FSAuth = FSAuth;

  function chip() {
    var rf = document.querySelector('.railfoot'); if (!rf || $('acctChip')) return;
    var d = document.createElement('div'); d.id = 'acctChip'; d.className = 'acct';
    d.innerHTML = sess ? '<span class="mono faint" style="font-size:10px">SIGNED IN</span><span class="em2">' + esc(sess.user.email) + '</span><button type="button" id="signOut">Sign out</button>' : '<span class="mono faint" style="font-size:10px">PLAYING OFFLINE</span>';
    rf.appendChild(d);
    var so = $('signOut'); if (so) so.addEventListener('click', function () { FSAuth.signOut(); });
  }

  function screen(cb) {
    var st = $('start'); st.hidden = false; $('app').hidden = true;
    var mode = 'up', vals = {};
    function draw(err, busy) {
      st.innerHTML = '<div class="startin authin">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><a href="../" style="display:flex;align-items:center;gap:10px;color:var(--ivory)"><svg width="22" height="22" viewBox="0 0 28 28" fill="none" stroke="#C9A45C" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="22" height="22"/><path d="M3 12h22M12 12v13"/></svg><b class="mono" style="font-size:12px;letter-spacing:.16em;font-weight:500">FOUNDER\'S SEAT</b></a><span class="pill acc">PLAYABLE ALPHA</span></div>' +
        '<div class="authgrid"><div style="display:flex;flex-direction:column;gap:16px"><span class="eyebrow acc">Thirty-six months. One company.</span><h1>Take the <span class="em">seat.</span></h1><p class="lede" style="font-size:17px;color:var(--body);line-height:1.55;max-width:520px">Run a post-seed logistics SaaS start-up in Bengaluru: raise, hire, ship, sell, negotiate and survive crises. Create a free account to play; it lets your programme see who is playing.</p>' +
        '<div class="how" style="grid-template-columns:1fr 1fr;gap:16px"><div><span class="mono acc" style="font-size:12px">01</span><span class="note">Ten panels: finance, growth, product, team, operations, partners, capital, reports and goals.</span></div><div><span class="mono acc" style="font-size:12px">02</span><span class="note">Graded on judgment: every decision is scored on what you knew at the time.</span></div></div></div>' +
        '<form class="authcard" id="authForm" novalidate><div class="seg" role="tablist" aria-label="Account"><button type="button" role="tab" data-mode="up" aria-pressed="' + (mode === 'up') + '">Create account</button><button type="button" role="tab" data-mode="in" aria-pressed="' + (mode === 'in') + '">Sign in</button></div>' +
        (mode === 'up' ? '<label>Your name<input type="text" id="aName" autocomplete="name" required maxlength="80"></label><label><span>College or company <span class="faint">(optional)</span></span><input type="text" id="aInst" autocomplete="organization" maxlength="120"></label>' : '') +
        '<label>Email<input type="email" id="aEmail" autocomplete="email" required></label><label>Password<input type="password" id="aPass" autocomplete="' + (mode === 'up' ? 'new-password' : 'current-password') + '" required minlength="6"></label>' +
        (err ? '<p class="note down" role="alert">' + esc(err) + '</p>' : '') +
        '<button class="btn primary lg" type="submit"' + (busy ? ' disabled' : '') + '>' + (busy ? 'Working…' : mode === 'up' ? 'Create account and play' : 'Sign in and play') + '</button>' +
        '<p class="note">We store your name, email and when you play, to count players. No marketing emails.' + (offline ? '' : '') + '</p>' +
        '<button type="button" class="linkb" id="offlineBtn">Sign-in not working? Play without an account</button></form></div></div>';
      ['aName', 'aInst', 'aEmail'].forEach(function (id) { if ($(id) && vals[id]) $(id).value = vals[id]; });
      st.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { mode = b.getAttribute('data-mode'); draw(); }); });
      $('offlineBtn').addEventListener('click', function () { offline = true; st.hidden = true; chip(); cb(); });
      $('authForm').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var email = $('aEmail').value.trim(), pass = $('aPass').value, name = mode === 'up' ? $('aName').value.trim() : '';
        vals = { aName: name, aInst: mode === 'up' ? $('aInst').value.trim() : '', aEmail: email };
        if (mode === 'up' && !name) return draw('Please enter your name.');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return draw('Please enter a valid email address.');
        if (pass.length < 6) return draw('Use a password of at least 6 characters.');
        var inst = mode === 'up' ? $('aInst').value.trim() : '';
        draw(null, true);
        var p = mode === 'up'
          ? req('/auth/v1/signup', { method: 'POST', body: { email: email, password: pass, data: { name: name, institution: inst } } })
          : req('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: email, password: pass } });
        p.then(take).then(function () { trackLogin(); chip(); cb(); }).catch(function (e) { draw(friendly(e)); });
      });
      var f = $(mode === 'up' ? 'aName' : 'aEmail'); if (f) f.focus();
    }
    draw();
  }
})();
