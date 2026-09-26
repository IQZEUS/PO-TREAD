/* ============================================================
   PO-TRADE Sync v17 — DUPLICATE FIX + FAST + CLEAN
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
  var tradesTimer = null;
  var settingsTimer = null;
  var pushTimer = null;

  // ===== Loader =====
  function killLoader() {
    var l = document.getElementById('loader');
    if (!l || l.dataset.killed === '1') return;
    l.dataset.killed = '1';
    l.style.transition = 'opacity .3s';
    l.style.opacity = '0';
    setTimeout(function() { l.style.display = 'none'; }, 300);
  }
  setTimeout(killLoader, 3000);
  setTimeout(killLoader, 6000);

  // ===== Pending =====
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

  // ===== Diff =====
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

  // ⚡ dedup آرایه بر اساس id (آخرین نسخه برنده)
  function dedupe(arr) {
    var map = {};
    arr.forEach(function(t) { if (t && t.id) map[t.id] = t; });
    return Object.keys(map).map(function(k) { return map[k]; });
  }

  function snapSettings() {
    var out = {};
    SETTINGS_KEYS.forEach(function(k) { out[k] = origGetItem(k); });
    return JSON.stringify(out);
  }

  // ===== Detect =====
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
      clearTimeout(tradesTimer);
      tradesTimer = setTimeout(detectTrades, 30);
    } else if (SETTINGS_KEYS.indexOf(key) !== -1) {
      clearTimeout(settingsTimer);
      settingsTimer = setTimeout(detectSettings, 30);
    }
  };

  localStorage.removeItem = function(key) {
    origRemoveItem(key);
    if (!uid || !ready) return;
    if (key === TRADES_KEY) {
      clearTimeout(tradesTimer);
      tradesTimer = setTimeout(detectTrades, 30);
    } else if (SETTINGS_KEYS.indexOf(key) !== -1) {
      clearTimeout(settingsTimer);
      settingsTimer = setTimeout(detectSettings, 30);
    }
  };

  // ===== Push =====
  function schedulePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(doPush, 100);
  }

  async function doPush() {
    if (!uid || !ready || pushing) return;
    var p = getPending();
    var delIds = Object.keys(p.delete);
    var upItems = Object.keys(p.add).map(function(k) { return p.add[k]; })
      .concat(Object.keys(p.update).map(function(k) { return p.update[k]; }));
    var settings = p.settingsDirty;

    if (!delIds.length && !upItems.length && !settings) return;

    // ⚡ dedup قبل از ارسال
    upItems = dedupe(upItems);

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
        if (r3.error) console.warn('[Sync] settings:', r3.error.message);
      }
      ok = true;
    } catch (e) {
      console.error('[Sync] Push failed:', e.message);
    }

    pushing = false;
    if (ok) clearPending();
    if (pendingTotal() > 0) schedulePush();
  }

  // ===== ⚡ حذف فوری =====
  async function deleteNow(tradeIds) {
    if (!uid || !tradeIds || !tradeIds.length) return false;
    var ids = Array.isArray(tradeIds) ? tradeIds : [tradeIds];
    try {
      var r = await sb.from('trades').delete().eq('user_id', uid).in('trade_id', ids);
      if (r.error) throw r.error;
      console.log('[Sync] 🗑️ Deleted:', ids.length);
      var p = getPending();
      ids.forEach(function(id) {
        delete p.add[id];
        delete p.update[id];
        delete p.delete[id];
      });
      savePending(p);
      return true;
    } catch (e) {
      console.error('[Sync] Delete failed:', e.message);
      var p2 = getPending();
      ids.forEach(function(id) {
        if (p2.add[id]) delete p2.add[id];
        else { delete p2.update[id]; p2.delete[id] = 1; }
      });
      savePending(p2);
      return false;
    }
  }

  async function deleteAllNow() {
    if (!uid) return false;
    try {
      var r = await sb.from('trades').delete().eq('user_id', uid);
      if (r.error) throw r.error;
      console.log('[Sync] 🗑️ ALL deleted');
      clearPending();
      return true;
    } catch (e) {
      console.error('[Sync] Delete all failed:', e.message);
      return false;
    }
  }

  // ===== Flush =====
  function flush() {
    if (!uid || !ready) return;
    sb.auth.getSession().then(function(r) {
      var token = r && r.data && r.data.session && r.data.session.access_token;
      if (!token) return;

      detectTrades();
      detectSettings();

      var p = getPending();
      var delIds = Object.keys(p.delete);
      var upItems = dedupe(
        Object.keys(p.add).map(function(k) { return p.add[k]; })
          .concat(Object.keys(p.update).map(function(k) { return p.update[k]; }))
      );

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
        return;
      }
      uid = sRes.data.session.user.id;

      var lastUid = origGetItem(LAST_UID_KEY);
      if (lastUid && lastUid !== uid) {
        origRemoveItem(TRADES_KEY);
        clearPending();
      }
      origSetItem(LAST_UID_KEY, uid);

      // local
      var localTrades = [];
      try { localTrades = JSON.parse(origGetItem(TRADES_KEY) || '[]'); } catch (e) {}
      if (!Array.isArray(localTrades)) localTrades = [];
      localTrades = dedupe(localTrades);  // ⚡ dedup

      // cloud
      var cloudTrades = [];
      var cloudOk = false;
      try {
        var r = await sb.from('trades').select('data').eq('user_id', uid);
        if (r.error) throw r.error;
        cloudTrades = (r.data || []).map(function(x) { return x.data; }).filter(function(t) { return t && t.id; });
        cloudTrades = dedupe(cloudTrades);  // ⚡ dedup
        cloudOk = true;
      } catch (e) {
        console.warn('[Sync] cloud:', e.message);
      }

      var p = getPending();

      // ⚡ اگه cloud خالی و local پر → local رو بفرست (بدون دو بار اضافه شدن)
      if (cloudOk && cloudTrades.length === 0 && localTrades.length > 0) {
        localTrades.forEach(function(t) { p.add[t.id] = t; });
        savePending(p);
        console.log('[Sync] Uploading local:', localTrades.length);
      }

      // ⚡ merge با Map → بدون تکرار
      var mergedMap = {};

      // 1) از cloud شروع کن
      cloudTrades.forEach(function(t) { mergedMap[t.id] = t; });

      // 2) حذف‌ها رو اعمال کن
      Object.keys(p.delete).forEach(function(id) { delete mergedMap[id]; });

      // 3) اگه cloud خالی بود، local رو از pending بگیر
      Object.keys(p.add).forEach(function(id) { mergedMap[id] = p.add[id]; });

      // 4) آپدیت‌ها
      Object.keys(p.update).forEach(function(id) { mergedMap[id] = p.update[id]; });

      // 5) اگه cloud خالی و local داره و pending خالی (یعنی اولین بار) → local رو نگه دار
      if (cloudTrades.length === 0 && localTrades.length > 0) {
        localTrades.forEach(function(t) { mergedMap[t.id] = t; });
      }

      var merged = Object.keys(mergedMap).map(function(k) { return mergedMap[k]; });
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
      } catch (e) {}
      lastSettings = snapSettings();

      ready = true;
      console.log('[Sync] Ready:', merged.length, 'trades (cloud:', cloudTrades.length, ', local:', localTrades.length, ')');

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
    deleteNow: deleteNow,
    deleteAllNow: deleteAllNow,
    killLoader: killLoader,

    // ⚡ پاک کردن دیتای تکراری از localStorage
    cleanLocal: function() {
      try {
        var arr = JSON.parse(origGetItem(TRADES_KEY) || '[]');
        var before = arr.length;
        arr = dedupe(arr);
        var str = JSON.stringify(arr);
        origSetItem(TRADES_KEY, str);
        lastTrades = str;
        console.log('[Sync] Cleaned:', before, '→', arr.length);
        return arr.length;
      } catch (e) { return 0; }
    },

    // ⚡ پاک کردن همه چیز از سرور و local (reset کامل)
    hardReset: async function() {
      if (!uid) return false;
      try {
        await sb.from('trades').delete().eq('user_id', uid);
        origRemoveItem(TRADES_KEY);
        origRemoveItem(PENDING_KEY);
        lastTrades = '[]';
        console.log('[Sync] 🔥 Hard reset done');
        return true;
      } catch (e) {
        console.error('[Sync] Hard reset failed:', e.message);
        return false;
      }
    }
  };
})();
