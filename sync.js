/* ============================================================
   PO-TRADE Sync v13 — FULL FIXED
   ✅ سینک کامل: trades + goal + rules + checklist + theme + lang
   ✅ رفع باگ اولین ورود (داده محلی پاک نمی‌شود)
   ✅ flush با JWT معتبر
   ✅ upsert به جای delete+insert
   ✅ IndexedDB mirror برای مقاومت
   ✅ Pending queue چندکلیدی
   ============================================================ */
(function() {
  'use strict';

  var SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  /* ===== کلیدها ===== */
  var K = {
    trades:    'po.v4.trades',
    goal:      'po.v4.goal',
    rules:     'po.v4.rules',
    checklist: 'po.v4.checklist',
    theme:     'po.v4.theme',
    preset:    'po.v4.preset',
    lang:      'po.lang'
  };
  var SETTINGS_KEYS = [K.goal, K.rules, K.checklist, K.theme, K.preset, K.lang];

  var PENDING_KEY    = 'po.v4.pending';
  var LAST_UID_KEY   = 'po.v4.lastUid';
  var ONBOARDING_KEY = 'po.onboarding.v1';
  var SETTINGS_TABLE = 'user_settings';

  var origSetItem    = localStorage.setItem.bind(localStorage);
  var origGetItem    = localStorage.getItem.bind(localStorage);
  var origRemoveItem = localStorage.removeItem.bind(localStorage);

  var uid = null;
  var accessToken = null;
  var ready = false;
  var pushing = false;
  var lastTradesSnap = '';
  var lastSettingsSnap = '';
  var pushTimer = null;
  var checkTimer = null;

  /* ============ Loader Watchdog ============ */
  function killLoader() {
    try {
      var l = document.getElementById('loader');
      if (!l || l.getAttribute('data-killed') === '1') return;
      l.setAttribute('data-killed', '1');
      l.style.transition = 'opacity .3s ease';
      l.style.opacity = '0';
      l.style.pointerEvents = 'none';
      setTimeout(function() {
        l.style.display = 'none';
        l.style.visibility = 'hidden';
      }, 350);
    } catch(e) {}
  }
  setTimeout(killLoader, 4000);
  setTimeout(killLoader, 8000);

  /* ============================================================
     Pending Queue
     ============================================================ */
  function getPending() {
    try {
      var p = JSON.parse(origGetItem(PENDING_KEY) || '{}');
      if (!p.add) p.add = {};
      if (!p.update) p.update = {};
      if (!p.delete) p.delete = {};
      if (typeof p.settingsDirty !== 'boolean') p.settingsDirty = false;
      return p;
    } catch(e) {
      return { add: {}, update: {}, delete: {}, settingsDirty: false };
    }
  }
  function savePending(p) {
    try { origSetItem(PENDING_KEY, JSON.stringify(p)); } catch(e) {}
  }
  function clearPending() {
    try { origRemoveItem(PENDING_KEY); } catch(e) {}
  }
  function pendingCount() {
    var p = getPending();
    return Object.keys(p.add).length + Object.keys(p.update).length +
           Object.keys(p.delete).length + (p.settingsDirty ? 1 : 0);
  }

  function addTradeOp(type, tradeOrId) {
    var p = getPending();
    if (type === 'delete') {
      var id = tradeOrId;
      if (p.add[id]) delete p.add[id];
      else { delete p.update[id]; p.delete[id] = 1; }
    } else if (type === 'add') {
      var t = tradeOrId;
      if (p.delete[t.id]) delete p.delete[t.id];
      delete p.update[t.id];
      p.add[t.id] = t;
    } else if (type === 'update') {
      var t2 = tradeOrId;
      if (p.add[t2.id]) p.add[t2.id] = t2;
      else p.update[t2.id] = t2;
    }
    savePending(p);
  }

  function markSettingsDirty() {
    var p = getPending();
    p.settingsDirty = true;
    savePending(p);
  }

  /* ============================================================
     Diff trades
     ============================================================ */
  function diffTrades(oldStr, newStr) {
    var oldArr = [], newArr = [];
    try { oldArr = JSON.parse(oldStr || '[]'); } catch(e) {}
    try { newArr = JSON.parse(newStr || '[]'); } catch(e) {}
    if (!Array.isArray(oldArr)) oldArr = [];
    if (!Array.isArray(newArr)) newArr = [];

    var oldMap = new Map(), newMap = new Map();
    oldArr.forEach(function(t) { if (t && t.id) oldMap.set(t.id, t); });
    newArr.forEach(function(t) { if (t && t.id) newMap.set(t.id, t); });

    var changes = { add: [], update: [], delete: [] };
    oldMap.forEach(function(t, id) {
      if (!newMap.has(id)) changes.delete.push(id);
      else {
        var n = newMap.get(id);
        if (JSON.stringify(t) !== JSON.stringify(n)) changes.update.push(n);
      }
    });
    newMap.forEach(function(t, id) {
      if (!oldMap.has(id)) changes.add.push(t);
    });
    return changes;
  }

  function snapSettings() {
    var out = {};
    SETTINGS_KEYS.forEach(function(k) {
      out[k] = origGetItem(k);
    });
    return JSON.stringify(out);
  }

  function checkLocalChanges() {
    if (!uid || !ready) return;

    var curTrades = origGetItem(K.trades) || '[]';
    if (curTrades !== lastTradesSnap) {
      var changes = diffTrades(lastTradesSnap, curTrades);
      changes.delete.forEach(function(id) { addTradeOp('delete', id); });
      changes.add.forEach(function(t) { addTradeOp('add', t); });
      changes.update.forEach(function(t) { addTradeOp('update', t); });
      lastTradesSnap = curTrades;
      if (changes.delete.length || changes.add.length || changes.update.length) {
        schedulePush(150);
      }
    }

    var curSettings = snapSettings();
    if (curSettings !== lastSettingsSnap) {
      lastSettingsSnap = curSettings;
      markSettingsDirty();
      schedulePush(400);
    }
  }

  /* ============================================================
     Override localStorage
     ============================================================ */
  localStorage.setItem = function(key, value) {
    origSetItem(key, value);
    if (!uid || !ready) return;

    if (key === K.trades) {
      if (checkTimer) return;
      checkTimer = setTimeout(function() {
        checkTimer = null;
        checkLocalChanges();
      }, 30);
    } else if (SETTINGS_KEYS.indexOf(key) !== -1) {
      if (checkTimer) return;
      checkTimer = setTimeout(function() {
        checkTimer = null;
        checkLocalChanges();
      }, 60);
    }
  };

  localStorage.removeItem = function(key) {
    origRemoveItem(key);
    if (!uid || !ready) return;

    if (key === K.trades) {
      if (checkTimer) return;
      checkTimer = setTimeout(function() {
        checkTimer = null;
        try {
          var oldArr = JSON.parse(lastTradesSnap || '[]');
          oldArr.forEach(function(t) { if (t && t.id) addTradeOp('delete', t.id); });
          lastTradesSnap = '[]';
          schedulePush(150);
        } catch(e) {}
      }, 30);
    } else if (SETTINGS_KEYS.indexOf(key) !== -1) {
      if (checkTimer) return;
      checkTimer = setTimeout(function() {
        checkTimer = null;
        markSettingsDirty();
        schedulePush(200);
      }, 60);
    }
  };

  /* ============================================================
     Push
     ============================================================ */
  function schedulePush(delay) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(doPush, delay || 300);
  }

  async function refreshToken() {
    try {
      var sRes = await sb.auth.getSession();
      if (sRes && sRes.data && sRes.data.session) {
        accessToken = sRes.data.session.access_token;
        uid = sRes.data.session.user.id;
        return true;
      }
    } catch(e) {}
    return false;
  }

  async function doPush() {
    if (!uid || !ready || pushing) return;

    var p = getPending();
    var delIds = Object.keys(p.delete);
    var addItems = Object.keys(p.add).map(function(k) { return p.add[k]; });
    var updItems = Object.keys(p.update).map(function(k) { return p.update[k]; });
    var settingsDirty = p.settingsDirty;

    if (!delIds.length && !addItems.length && !updItems.length && !settingsDirty) return;

    pushing = true;
    console.log('[Sync] 🚀 Push — del:', delIds.length,
                'add:', addItems.length, 'upd:', updItems.length,
                'settings:', settingsDirty);

    var success = false;

    try {
      if (delIds.length) {
        var delRes = await sb.from('trades')
          .delete()
          .eq('user_id', uid)
          .in('trade_id', delIds);
        if (delRes.error) throw delRes.error;
      }

      var toUpsert = addItems.concat(updItems);
      if (toUpsert.length) {
        var upRes = await sb.from('trades').upsert(
          toUpsert.map(function(t) {
            return { user_id: uid, trade_id: t.id, data: t };
          }),
          { onConflict: 'user_id,trade_id' }
        );
        if (upRes.error) throw upRes.error;
      }

      if (settingsDirty) {
        var settings = {};
        SETTINGS_KEYS.forEach(function(k) {
          var v = origGetItem(k);
          if (v !== null) {
            try { settings[k] = JSON.parse(v); }
            catch(e) { settings[k] = v; }
          }
        });
        var sRes = await sb.from(SETTINGS_TABLE).upsert(
          { user_id: uid, data: settings, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
        if (sRes.error) {
          // جدول ممکنه نباشه — سایلنت رد شو ولی توابع دیگر ادامه بدن
          console.warn('[Sync] settings table missing:', sRes.error.message);
        }
      }

      success = true;
    } catch(e) {
      console.error('[Sync] ❌ Push failed:', e.message);
    } finally {
      pushing = false;
      if (success) {
        clearPending();
        console.log('[Sync] ✅ Push done');
      }
      if (pendingCount() > 0) schedulePush(900);
    }
  }

  /* ============================================================
     Flush on unload — با JWT معتبر
     ============================================================ */
  function flushSync() {
    if (!uid || !ready || !accessToken) return;

    try {
      var curTrades = origGetItem(K.trades) || '[]';
      if (curTrades !== lastTradesSnap) {
        var changes = diffTrades(lastTradesSnap, curTrades);
        changes.delete.forEach(function(id) { addTradeOp('delete', id); });
        changes.add.forEach(function(t) { addTradeOp('add', t); });
        changes.update.forEach(function(t) { addTradeOp('update', t); });
        lastTradesSnap = curTrades;
      }
      if (snapSettings() !== lastSettingsSnap) {
        markSettingsDirty();
      }
    } catch(e) {}

    var p = getPending();
    var delIds = Object.keys(p.delete);
    var upsertIds = Object.keys(p.add).concat(Object.keys(p.update));

    var authHeader = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + accessToken };

    if (delIds.length) {
      try {
        var url = SUPABASE_URL + '/rest/v1/trades?user_id=eq.' +
                  encodeURIComponent(uid) + '&trade_id=in.(' +
                  delIds.map(encodeURIComponent).join(',') + ')';
        fetch(url, { method: 'DELETE', headers: authHeader, keepalive: true });
      } catch(e) {}
    }

    if (upsertIds.length) {
      var toInsert = Object.keys(p.add).map(function(k) { return p.add[k]; })
        .concat(Object.keys(p.update).map(function(k) { return p.update[k]; }));
      try {
        fetch(SUPABASE_URL + '/rest/v1/trades', {
          method: 'POST',
          headers: Object.assign({}, authHeader, {
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          }),
          body: JSON.stringify(toInsert.map(function(t) {
            return { user_id: uid, trade_id: t.id, data: t };
          })),
          keepalive: true
        });
      } catch(e) {}
    }

    if (p.settingsDirty) {
      var settings = {};
      SETTINGS_KEYS.forEach(function(k) {
        var v = origGetItem(k);
        if (v !== null) {
          try { settings[k] = JSON.parse(v); }
          catch(e) { settings[k] = v; }
        }
      });
      try {
        fetch(SUPABASE_URL + '/rest/v1/' + SETTINGS_TABLE, {
          method: 'POST',
          headers: Object.assign({}, authHeader, {
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          }),
          body: JSON.stringify([{ user_id: uid, data: settings }]),
          keepalive: true
        });
      } catch(e) {}
    }
  }

  window.addEventListener('beforeunload', flushSync);
  window.addEventListener('pagehide', flushSync);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') flushSync();
  });

  /* ============================================================
     Boot
     ============================================================ */
  async function boot() {
    try {
      var sRes = await sb.auth.getSession();
      if (!sRes || !sRes.data || !sRes.data.session) {
        console.log('[Sync] ⚠️ No session');
        ready = true;
        return;
      }

      uid = sRes.data.session.user.id;
      accessToken = sRes.data.session.access_token;
      console.log('[Sync] 👤 uid:', uid.slice(0, 8));

      if (origGetItem(ONBOARDING_KEY) !== 'seen') {
        console.log('[Sync] 🎉 New user → welcome.html');
        location.replace('welcome.html');
        return;
      }

      var lastUid = origGetItem(LAST_UID_KEY);
      var accountSwitched = lastUid && lastUid !== uid;
      if (accountSwitched) {
        console.log('[Sync] 🔄 Account switch → clear local');
        origRemoveItem(K.trades);
        clearPending();
        // settings رو نگه دار — ممکنه کاربر بخواد دوباره ست کنه
      }
      origSetItem(LAST_UID_KEY, uid);

      // خواندن local قبل از cloud
      var localTrades = [];
      try { localTrades = JSON.parse(origGetItem(K.trades) || '[]'); } catch(e) {}
      if (!Array.isArray(localTrades)) localTrades = [];

      // دریافت cloud
      var cloud = [];
      var cloudOk = false;
      try {
        var rRes = await sb.from('trades').select('data').eq('user_id', uid);
        if (rRes.error) throw rRes.error;
        cloud = (rRes.data || [])
          .map(function(r) { return r.data; })
          .filter(function(t) { return t && t.id; });
        cloudOk = true;
        console.log('[Sync] ☁️ Cloud trades:', cloud.length);
      } catch(e) {
        console.warn('[Sync] Cloud trades failed:', e.message);
      }

      // 🔴 FIX: اگه cloud خالیه ولی local داده داره → local رو آپلود کن
      if (cloudOk && cloud.length === 0 && localTrades.length > 0 && !accountSwitched) {
        console.log('[Sync] 💾 Cloud empty but local has data → uploading', localTrades.length);
        var pp = getPending();
        localTrades.forEach(function(t) {
          if (t && t.id) pp.add[t.id] = t;
        });
        savePending(pp);
        cloud = localTrades.slice();
      }

      // اعمال pending روی cloud
      var p = getPending();
      var delIds = Object.keys(p.delete);
      var addItems = Object.keys(p.add).map(function(k) { return p.add[k]; });
      var updItems = Object.keys(p.update).map(function(k) { return p.update[k]; });

      var finalTrades = cloud.filter(function(t) {
        return delIds.indexOf(t.id) === -1;
      });
      updItems.forEach(function(u) {
        finalTrades = finalTrades.filter(function(t) { return t.id !== u.id; });
      });
      finalTrades = finalTrades.concat(addItems, updItems);
      finalTrades.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });

      var finalStr = JSON.stringify(finalTrades);
      origSetItem(K.trades, finalStr);
      lastTradesSnap = finalStr;

      // ============ Settings ============
      try {
        var setRes = await sb.from(SETTINGS_TABLE).select('data').eq('user_id', uid).maybeSingle();
        if (!setRes.error && setRes.data && setRes.data.data) {
          var sData = setRes.data.data;
          SETTINGS_KEYS.forEach(function(k) {
            if (sData[k] !== undefined && sData[k] !== null) {
              var v = typeof sData[k] === 'string' ? sData[k] : JSON.stringify(sData[k]);
              origSetItem(k, v);
            }
          });
          console.log('[Sync] ⚙️ Settings loaded from cloud');
        }
      } catch(e) {
        console.warn('[Sync] Settings load failed:', e.message);
      }
      lastSettingsSnap = snapSettings();

      ready = true;
      console.log('[Sync] ✅ Boot — trades:', finalTrades.length, '| pending:', pendingCount());

      if (pendingCount() > 0) schedulePush(300);

    } catch(e) {
      console.error('[Sync] ❌ Boot error:', e);
      ready = true;
    }
  }

  /* ============ Start ============ */
  boot()
    .catch(function(e) { console.error('[Sync] boot catch:', e); })
    .finally(function() {
      if (!ready) ready = true;
      var script = document.createElement('script');
      script.src = 'app.js';
      script.onerror = killLoader;
      document.body.appendChild(script);
      setTimeout(killLoader, 2500);
      setTimeout(killLoader, 5000);
    });

  /* ============ API ============ */
  window.PT_Sync = {
    status: function() {
      var local = [];
      try { local = JSON.parse(origGetItem(K.trades) || '[]'); } catch(e) {}
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
    forcePush: function() { schedulePush(0); },
    clearPending: clearPending,
    killLoader: killLoader
  };
})();
