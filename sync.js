/* ============================================================
   PO-TRADE Sync v15 — FINAL CLEAN VERSION
   ============================================================ */
(function() {
  'use strict';

  var SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';

  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var TRADES_KEY = 'po.v4.trades';
  var SETTINGS_KEYS = ['po.v4.goal', 'po.v4.rules', 'po.v4.checklist', 'po.v4.theme', 'po.v4.preset', 'po.lang'];
  var PENDING_KEY = 'po.v4.pending';
  var LAST_UID_KEY = 'po.v4.lastUid';
  var SETTINGS_TABLE = 'user_settings';

  var origSetItem = localStorage.setItem.bind(localStorage);
  var origGetItem = localStorage.getItem.bind(localStorage);
  var origRemoveItem = localStorage.removeItem.bind(localStorage);

  var uid = null;
  var ready = false;
  var pushing = false;
  var lastTrades = '';
  var lastSettings = '';
  var tradesDebounce = null;
  var settingsDebounce = null;
  var pushDebounce = null;

  // ===== Loader watchdog =====
  function killLoader() {
    var l = document.getElementById('loader');
    if (!l || l.dataset.killed === '1') return;
    l.dataset.killed = '1';
    l.style.transition = 'opacity .3s';
    l.style.opacity = '0';
    setTimeout(function() { l.style.display = 'none'; }, 350);
  }
  setTimeout(killLoader, 4000);
  setTimeout(killLoader, 8000);

  // ===== Pending queue =====
  function getPending() {
    try {
      var p = JSON.parse(origGetItem(PENDING_KEY) || '{}');
      return {
        add: p.add || {},
        update: p.update || {},
        delete: p.delete || {},
        settingsDirty: !!p.settingsDirty
      };
    } catch (e) {
      return { add: {}, update: {}, delete: {}, settingsDirty: false };
    }
  }
  function savePending(p) {
    try { origSetItem(PENDING_KEY, JSON.stringify(p)); } catch (e) {}
  }
  function clearPending() {
    try { origRemoveItem(PENDING_KEY); } catch (e) {}
  }
  function pendingTotal() {
    var p = getPending();
    return Object.keys(p.add).length + Object.keys(p.update).length + Object.keys(p.delete).length + (p.settingsDirty ? 1 : 0);
  }

  // ===== Diff trades =====
  function diffTrades(oldStr, newStr) {
    var oldArr = [], newArr = [];
    try { oldArr = JSON.parse(oldStr || '[]'); } catch (e) {}
    try { newArr = JSON.parse(newStr || '[]'); } catch (e) {}
    if (!Array.isArray(oldArr)) oldArr = [];
    if (!Array.isArray(newArr)) newArr = [];

    var oldMap = {}, newMap = {};
    oldArr.forEach(function(t) { if (t && t.id) oldMap[t.id] = t; });
    newArr.forEach(function(t) { if (t && t.id) newMap[t.id] = t; });

    var res = { add: [], update: [], delete: [] };
    Object.keys(oldMap).forEach(function(id) {
      if (!newMap[id]) res.delete.push(id);
      else if (JSON.stringify(oldMap[id]) !== JSON.stringify(newMap[id])) res.update.push(newMap[id]);
    });
    Object.keys(newMap).forEach(function(id) {
      if (!oldMap[id]) res.add.push(newMap[id]);
    });
    return res;
  }

  // ===== Snapshot settings =====
  function snapSettings() {
    var out = {};
    SETTINGS_KEYS.forEach(function(k) { out[k] = origGetItem(k); });
    return JSON.stringify(out);
  }

  // ===== Detect changes =====
  function detectTrades() {
    if (!uid || !ready) return;
    var cur = origGetItem(TRADES_KEY) || '[]';
    if (cur === lastTrades) return;

    var changes = diffTrades(lastTrades, cur);
    var p = getPending();

    changes.delete.forEach(function(id) {
      if (p.add[id]) delete p.add[id];
      else { delete p.update[id]; p.delete[id] = 1; }
    });
    changes.update.forEach(function(t) {
      if (p.add[t.id]) p.add[t.id] = t;
      else p.update[t.id] = t;
    });
    changes.add.forEach(function(t) {
      if (p.delete[t.id]) delete p.delete[t.id];
      delete p.update[t.id];
      p.add[t.id] = t;
    });

    savePending(p);
    lastTrades = cur;

    if (changes.add.length || changes.update.length || changes.delete.length) {
      schedulePush();
    }
  }

  function detectSettings() {
    if (!uid || !ready) return;
    var cur = snapSettings();
    if (cur === lastSettings) return;
    lastSettings = cur;
    var p = getPending();
    p.settingsDirty = true;
    savePending(p);
    schedulePush();
  }

  // ===== Override localStorage =====
  localStorage.setItem = function(key, value) {
    origSetItem(key, value);
    if (!uid || !ready) return;
    if (key === TRADES_KEY) {
      clearTimeout(tradesDebounce);
      tradesDebounce = setTimeout(detectTrades, 300);
    } else if (SETTINGS_KEYS.indexOf(key) !== -1) {
      clearTimeout(settingsDebounce);
      settingsDebounce = setTimeout(detectSettings, 250);
    }
  };

  localStorage.removeItem = function(key) {
    origRemoveItem(key);
    if (!uid || !ready) return;
    if (key === TRADES_KEY) {
      clearTimeout(tradesDebounce);
      tradesDebounce = setTimeout(detectTrades, 300);
    } else if (SETTINGS_KEYS.indexOf(key) !== -1) {
      clearTimeout(settingsDebounce);
      settingsDebounce = setTimeout(detectSettings, 250);
    }
  };

  // ===== Push =====
  function schedulePush() {
    clearTimeout(pushDebounce);
    pushDebounce = setTimeout(doPush, 500);
  }

  async function doPush() {
    if (!uid || !ready || pushing) return;
    var p = getPending();
    var delIds = Object.keys(p.delete);
    var upItems = Object.keys(p.add).map(function(k) { return p.add[k]; })
      .concat(Object.keys(p.update).map(function(k) { return p.update[k]; }));
    var settings = p.settingsDirty;

    if (!delIds.length && !upItems.length && !settings) return;

    pushing = true;
    var ok = false;

    try {
      if (delIds.length) {
        var r1 = await sb.from('trades').delete().eq('user_id', uid).in('trade_id', delIds);
        if (r1.error) throw r1.error;
      }
      if (upItems.length) {
        var r2 = await sb.from('trades').upsert(
          upItems.map(function(t) { return { user_id: uid, trade_id: t.id, data: t }; }),
          { onConflict: 'user_id,trade_id' }
        );
        if (r2.error) throw r2.error;
      }
      if (settings) {
        var sData = {};
        SETTINGS_KEYS.forEach(function(k) {
          var v = origGetItem(k);
          if (v === null) return;
          try { sData[k] = JSON.parse(v); } catch (e) { sData[k] = v; }
        });
        var r3 = await sb.from(SETTINGS_TABLE).upsert(
          { user_id: uid, data: sData, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
        if (r3.error) console.warn('[Sync] settings push:', r3.error.message);
      }
      ok = true;
    } catch (e) {
      console.error('[Sync] Push failed:', e.message);
    }

    pushing = false;
    if (ok) clearPending();
    if (pendingTotal() > 0) schedulePush();
  }

  // ===== Flush on unload =====
  function flush() {
    if (!uid || !ready) return;
    // دریافت توکن تازه
    sb.auth.getSession().then(function(r) {
      var token = r && r.data && r.data.session && r.data.session.access_token;
      if (!token) return;

      // اول تغییرات فعلی
      detectTrades();
      detectSettings();

      var p = getPending();
      var delIds = Object.keys(p.delete);
      var upItems = Object.keys(p.add).map(function(k) { return p.add[k]; })
        .concat(Object.keys(p.update).map(function(k) { return p.update[k]; }));

      var h = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + token };

      if (delIds.length) {
        var url = SUPABASE_URL + '/rest/v1/trades?user_id=eq.' + encodeURIComponent(uid) +
                  '&trade_id=in.(' + delIds.map(encodeURIComponent).join(',') + ')';
        fetch(url, { method: 'DELETE', headers: h, keepalive: true }).catch(function(){});
      }
      if (upItems.length) {
        fetch(SUPABASE_URL + '/rest/v1/trades', {
          method: 'POST',
          headers: Object.assign({}, h, {
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          }),
          body: JSON.stringify(upItems.map(function(t) {
            return { user_id: uid, trade_id: t.id, data: t };
          })),
          keepalive: true
        }).catch(function(){});
      }
      if (p.settingsDirty) {
        var sData = {};
        SETTINGS_KEYS.forEach(function(k) {
          var v = origGetItem(k);
          if (v === null) return;
          try { sData[k] = JSON.parse(v); } catch (e) { sData[k] = v; }
        });
        fetch(SUPABASE_URL + '/rest/v1/' + SETTINGS_TABLE, {
          method: 'POST',
          headers: Object.assign({}, h, {
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          }),
          body: JSON.stringify([{ user_id: uid, data: sData }]),
          keepalive: true
        }).catch(function(){});
      }
    }).catch(function(){});
  }

  window.addEventListener('beforeunload', flush);
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') flush();
  });

  // ===== Boot =====
  async function boot() {
    try {
      var sRes = await sb.auth.getSession();
      if (!sRes || !sRes.data || !sRes.data.session) {
        ready = true;
        console.log('[Sync] No session');
        return;
      }
      uid = sRes.data.session.user.id;
      console.log('[Sync] uid:', uid.slice(0, 8));

      // account switch
      var lastUid = origGetItem(LAST_UID_KEY);
      if (lastUid && lastUid !== uid) {
        origRemoveItem(TRADES_KEY);
        clearPending();
        console.log('[Sync] Account switched, cleared local');
      }
      origSetItem(LAST_UID_KEY, uid);

      // local snapshot
      var localTrades = [];
      try { localTrades = JSON.parse(origGetItem(TRADES_KEY) || '[]'); } catch (e) {}
      if (!Array.isArray(localTrades)) localTrades = [];

      // cloud
      var cloudTrades = [];
      var cloudOk = false;
      try {
        var r = await sb.from('trades').select('data').eq('user_id', uid);
        if (r.error) throw r.error;
        cloudTrades = (r.data || []).map(function(x) { return x.data; }).filter(function(t) { return t && t.id; });
        cloudOk = true;
      } catch (e) {
        console.warn('[Sync] cloud fetch failed:', e.message);
      }

      // اگه cloud خالی بود ولی local پر → local رو بفرست
      var p = getPending();
      if (cloudOk && cloudTrades.length === 0 && localTrades.length > 0 && !lastUid) {
        localTrades.forEach(function(t) { if (t && t.id) p.add[t.id] = t; });
        savePending(p);
        cloudTrades = localTrades.slice();
        console.log('[Sync] Uploaded local to cloud:', localTrades.length);
      }

      // اعمال pending روی cloud
      var delIds = Object.keys(p.delete);
      var addItems = Object.keys(p.add).map(function(k) { return p.add[k]; });
      var updItems = Object.keys(p.update).map(function(k) { return p.update[k]; });

      var merged = cloudTrades.filter(function(t) { return delIds.indexOf(t.id) === -1; });
      var updIds = {};
      updItems.forEach(function(u) { updIds[u.id] = 1; });
      merged = merged.filter(function(t) { return !updIds[t.id]; });
      merged = merged.concat(addItems, updItems);
      merged.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });

      var finalStr = JSON.stringify(merged);
      origSetItem(TRADES_KEY, finalStr);
      lastTrades = finalStr;

      // settings
      try {
        var r2 = await sb.from(SETTINGS_TABLE).select('data').eq('user_id', uid).maybeSingle();
        if (!r2.error && r2.data && r2.data.data) {
          SETTINGS_KEYS.forEach(function(k) {
            if (r2.data.data[k] !== undefined && r2.data.data[k] !== null) {
              var v = typeof r2.data.data[k] === 'string' ? r2.data.data[k] : JSON.stringify(r2.data.data[k]);
              origSetItem(k, v);
            }
          });
        }
      } catch (e) {
        console.warn('[Sync] settings fetch failed:', e.message);
      }
      lastSettings = snapSettings();

      ready = true;
      console.log('[Sync] Ready. Trades:', merged.length, '| Pending:', pendingTotal());

      if (pendingTotal() > 0) schedulePush();

    } catch (e) {
      console.error('[Sync] Boot error:', e);
      ready = true;
    }
  }

  boot().finally(function() {
    if (!ready) ready = true;
    if (document.querySelector('script[src*="app.js"]')) return;
    var s = document.createElement('script');
    s.src = 'app.js';
    s.onerror = killLoader;
    document.body.appendChild(s);
    setTimeout(killLoader, 2500);
    setTimeout(killLoader, 5000);
  });

  // ===== API =====
  window.PT_Sync = {
    status: function() {
      var local = [];
      try { local = JSON.parse(origGetItem(TRADES_KEY) || '[]'); } catch (e) {}
      var p = getPending();
      return {
        uid: uid,
        ready: ready,
        pushing: pushing,
        localCount: local.length,
        pending: {
          add: Object.keys(p.add).length,
          update: Object.keys(p.update).length,
          delete: Object.keys(p.delete).length,
          settings: p.settingsDirty
        }
      };
    },
    forcePush: function() { schedulePush(); },
    killLoader: killLoader
  };
})();
