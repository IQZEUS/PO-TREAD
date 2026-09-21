/* ============================================================
   PO-TRADE Sync — v12 FINAL
   ✅ تشخیص فوری تغییر (50ms)
   ✅ Beforeunload sync → pending ذخیره می‌شه
   ✅ Cloud = منبع حقیقت
   ✅ Pending Queue برای offline
   ============================================================ */
(function() {
  'use strict';

  var SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var TRADES_KEY     = 'po.v4.trades';
  var PENDING_KEY    = 'po.v4.pending';
  var LAST_UID_KEY   = 'po.v4.lastUid';
  var ONBOARDING_KEY = 'po.onboarding.v1';

  var uid = null;
  var ready = false;
  var pushing = false;
  var lastSnap = '';
  var pushTimer = null;
  var checkTimer = null;

  // ذخیره توابع اصلی
  var origSetItem = localStorage.setItem.bind(localStorage);
  var origGetItem = localStorage.getItem.bind(localStorage);
  var origRemoveItem = localStorage.removeItem.bind(localStorage);

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
  setTimeout(killLoader, 7000);

  /* ============================================================
     Pending Queue
     ============================================================ */
  function getPending() {
    try {
      var p = JSON.parse(origGetItem(PENDING_KEY) || '{}');
      if (!p.add) p.add = {};
      if (!p.update) p.update = {};
      if (!p.delete) p.delete = {};
      return p;
    } catch(e) { return { add: {}, update: {}, delete: {} }; }
  }
  function savePending(p) {
    try { origSetItem(PENDING_KEY, JSON.stringify(p)); } catch(e) {}
  }
  function clearPending() {
    try { origRemoveItem(PENDING_KEY); } catch(e) {}
  }
  function pendingCount() {
    var p = getPending();
    return Object.keys(p.add).length + Object.keys(p.update).length + Object.keys(p.delete).length;
  }

  function addOp(type, tradeOrId) {
    var p = getPending();
    if (type === 'delete') {
      var id = tradeOrId;
      if (p.add[id]) {
        delete p.add[id];
      } else {
        delete p.update[id];
        p.delete[id] = 1;
      }
    } else if (type === 'add') {
      var t = tradeOrId;
      if (p.delete[t.id]) delete p.delete[t.id];
      delete p.update[t.id];
      p.add[t.id] = t;
    } else if (type === 'update') {
      var t2 = tradeOrId;
      if (p.add[t2.id]) {
        p.add[t2.id] = t2;
      } else {
        p.update[t2.id] = t2;
      }
    }
    savePending(p);
  }

  /* ============================================================
     Diff
     ============================================================ */
  function diffTrades(oldStr, newStr) {
    var oldArr = [], newArr = [];
    try { oldArr = JSON.parse(oldStr || '[]'); } catch(e) {}
    try { newArr = JSON.parse(newStr || '[]'); } catch(e) {}
    if (!Array.isArray(oldArr)) oldArr = [];
    if (!Array.isArray(newArr)) newArr = [];

    var oldMap = new Map();
    var newMap = new Map();
    oldArr.forEach(function(t) { if (t && t.id) oldMap.set(t.id, t); });
    newArr.forEach(function(t) { if (t && t.id) newMap.set(t.id, t); });

    var changes = { add: [], update: [], delete: [] };

    oldMap.forEach(function(t, id) {
      if (!newMap.has(id)) {
        changes.delete.push(id);
      } else {
        var newT = newMap.get(id);
        if (JSON.stringify(t) !== JSON.stringify(newT)) {
          changes.update.push(newT);
        }
      }
    });

    newMap.forEach(function(t, id) {
      if (!oldMap.has(id)) {
        changes.add.push(t);
      }
    });

    return changes;
  }

  function checkLocalChanges() {
    if (!uid || !ready) return;
    var cur = origGetItem(TRADES_KEY) || '[]';
    if (cur === lastSnap) return;

    var changes = diffTrades(lastSnap, cur);

    changes.delete.forEach(function(id) { addOp('delete', id); });
    changes.add.forEach(function(t) { addOp('add', t); });
    changes.update.forEach(function(t) { addOp('update', t); });

    lastSnap = cur;

    if (changes.delete.length || changes.add.length || changes.update.length) {
      console.log('[Sync] 📌 Changes — del:', changes.delete.length,
                  'add:', changes.add.length, 'upd:', changes.update.length);
      schedulePush(150);
    }
  }

  /* ============================================================
     Override localStorage — فقط signal می‌ده (fast)
     ============================================================ */
  localStorage.setItem = function(key, value) {
    origSetItem(key, value);
    if (key === TRADES_KEY && uid && ready) {
      if (checkTimer) return;
      checkTimer = setTimeout(function() {
        checkTimer = null;
        checkLocalChanges();
      }, 30);
    }
  };

  localStorage.removeItem = function(key) {
    origRemoveItem(key);
    if (key === TRADES_KEY && uid && ready) {
      if (checkTimer) return;
      checkTimer = setTimeout(function() {
        checkTimer = null;
        // removeItem = حذف همه
        try {
          var oldStr = lastSnap || '[]';
          var oldArr = JSON.parse(oldStr);
          oldArr.forEach(function(t) {
            if (t && t.id) addOp('delete', t.id);
          });
          lastSnap = '[]';
          schedulePush(150);
        } catch(e) {}
      }, 30);
    }
  };

  /* ============================================================
     Push — Cloud
     ============================================================ */
  function schedulePush(delay) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(doPush, delay || 300);
  }

  async function doPush() {
    if (!uid || !ready || pushing) return;

    var p = getPending();
    var delIds = Object.keys(p.delete);
    var addItems = Object.keys(p.add).map(function(k) { return p.add[k]; });
    var updItems = Object.keys(p.update).map(function(k) { return p.update[k]; });

    if (!delIds.length && !addItems.length && !updItems.length) return;

    pushing = true;
    console.log('[Sync] 🚀 Push — del:', delIds.length,
                'add:', addItems.length, 'upd:', updItems.length);

    var success = false;

    try {
      // 1️⃣ حذف همه چیزایی که قراره تغییر کنن (برای جلوگیری از conflict)
      var allDeleteIds = delIds.concat(
        addItems.map(function(t) { return t.id; }),
        updItems.map(function(t) { return t.id; })
      );

      if (allDeleteIds.length > 0) {
        var delRes = await sb.from('trades')
          .delete()
          .eq('user_id', uid)
          .in('trade_id', allDeleteIds);
        if (delRes.error) {
          console.error('[Sync] ❌ Delete err:', delRes.error.message);
          throw delRes.error;
        }
        console.log('[Sync] 🗑️ Deleted:', allDeleteIds.length);
      }

      // 2️⃣ درج add + update
      var toInsert = addItems.concat(updItems);
      if (toInsert.length > 0) {
        var insRes = await sb.from('trades').insert(toInsert.map(function(t) {
          return { user_id: uid, trade_id: t.id, data: t };
        }));
        if (insRes.error) {
          console.error('[Sync] ❌ Insert err:', insRes.error.message);
          throw insRes.error;
        }
        console.log('[Sync] ➕ Inserted:', toInsert.length);
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

      // اگه در این فاصله pending جدید اومده → دوباره push
      if (pendingCount() > 0) {
        schedulePush(800);
      }
    }
  }

  /* ============================================================
     Sync flush on unload — synchronous diff
     ============================================================ */
  function flushSync() {
    if (!uid || !ready) return;

    try {
      // Diff سینک
      var cur = origGetItem(TRADES_KEY) || '[]';
      if (cur !== lastSnap) {
        var changes = diffTrades(lastSnap, cur);
        changes.delete.forEach(function(id) { addOp('delete', id); });
        changes.add.forEach(function(t) { addOp('add', t); });
        changes.update.forEach(function(t) { addOp('update', t); });
        lastSnap = cur;
      }
    } catch(e) {}

    // fire-and-forget: pending رو بفرست
    var p = getPending();
    var delIds = Object.keys(p.delete);
    var upsertIds = Object.keys(p.add).concat(Object.keys(p.update));

    if (!delIds.length && !upsertIds.length) return;
    if (!uid) return;

    console.log('[Sync] 🚨 Flush on unload');

    // حذف
    var allIds = delIds.concat(
      Object.keys(p.add), Object.keys(p.update)
    );

    if (allIds.length) {
      var url = SUPABASE_URL + '/rest/v1/trades?user_id=eq.' +
                encodeURIComponent(uid) + '&trade_id=in.(' +
                allIds.map(encodeURIComponent).join(',') + ')';
      try {
        fetch(url, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY
          },
          keepalive: true
        });
      } catch(e) {}
    }

    // درج
    var toInsert = Object.keys(p.add).map(function(k) { return p.add[k]; })
      .concat(Object.keys(p.update).map(function(k) { return p.update[k]; }));

    if (toInsert.length) {
      try {
        fetch(SUPABASE_URL + '/rest/v1/trades', {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(toInsert.map(function(t) {
            return { user_id: uid, trade_id: t.id, data: t };
          })),
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
      console.log('[Sync] 👤 uid:', uid);

      // Onboarding
      if (origGetItem(ONBOARDING_KEY) !== 'seen') {
        console.log('[Sync] 🎉 New user → welcome.html');
        location.replace('welcome.html');
        return;
      }

      // سوییچ حساب؟
      var lastUid = origGetItem(LAST_UID_KEY);
      if (lastUid && lastUid !== uid) {
        console.log('[Sync] 🔄 Account switch → clear');
        origRemoveItem(TRADES_KEY);
        clearPending();
      }
      origSetItem(LAST_UID_KEY, uid);

      // 1️⃣ از cloud بگیر
      var cloud = [];
      try {
        var rRes = await sb.from('trades').select('data').eq('user_id', uid);
        if (rRes.error) throw rRes.error;
        cloud = (rRes.data || [])
          .map(function(r) { return r.data; })
          .filter(function(t) { return t && t.id; });
        console.log('[Sync] ☁️ Cloud:', cloud.length);
      } catch(e) {
        console.warn('[Sync] Cloud failed:', e.message);
        try { cloud = JSON.parse(origGetItem(TRADES_KEY) || '[]'); } catch(e2) {}
      }

      // 2️⃣ اعمال pending (تغییرات محلی که هنوز push نشدن)
      var p = getPending();
      var delIds = Object.keys(p.delete);
      var addItems = Object.keys(p.add).map(function(k) { return p.add[k]; });
      var updItems = Object.keys(p.update).map(function(k) { return p.update[k]; });

      var final = cloud.filter(function(t) {
        return delIds.indexOf(t.id) === -1;
      });

      updItems.forEach(function(u) {
        final = final.filter(function(t) { return t.id !== u.id; });
      });

      final = final.concat(addItems, updItems);
      final.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });

      // 3️⃣ ذخیره
      var finalStr = JSON.stringify(final);
      origSetItem(TRADES_KEY, finalStr);
      lastSnap = finalStr;
      ready = true;

      console.log('[Sync] ✅ Boot — final:', final.length,
                  '| pending:', delIds.length + addItems.length + updItems.length);

      // 4️⃣ اگه pending داریم → push
      if (delIds.length || addItems.length || updItems.length) {
        schedulePush(300);
      }

    } catch(e) {
      console.error('[Sync] ❌ Boot error:', e);
      ready = true;
    }
  }

  /* ============================================================
     Start
     ============================================================ */
  boot()
    .catch(function(e) { console.error('[Sync] boot catch:', e); })
    .finally(function() {
      ready = true;
      var script = document.createElement('script');
      script.src = 'app.js';
      script.onerror = function() { killLoader(); };
      document.body.appendChild(script);
      setTimeout(killLoader, 2500);
      setTimeout(killLoader, 5000);
    });

  /* ============================================================
     API
     ============================================================ */
  window.PT_Sync = {
    status: function() {
      var local = [];
      try { local = JSON.parse(origGetItem(TRADES_KEY) || '[]'); } catch(e) {}
      var p = getPending();
      return {
        uid: uid,
        ready: ready,
        pushing: pushing,
        localCount: local.length,
        pending: {
          add: Object.keys(p.add).length,
          update: Object.keys(p.update).length,
          delete: Object.keys(p.delete).length
        }
      };
    },
    forcePush: function() { schedulePush(0); },
    clearPending: clearPending,
    killLoader: killLoader
  };

})();
