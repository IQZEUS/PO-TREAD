/* ============================================================
   PO-TRADE Sync — v11 FINAL
   ✅ Cloud = منبع اصلی (حذف روی هر دستگاه → همه‌جا حذف)
   ✅ Pending Queue (تغییرات offline از دست نمی‌ره)
   ✅ Push فوری (beforeunload + visibilitychange)
   ✅ Watchdog loader
   ============================================================ */
(function() {
  'use strict';

  var SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var TRADES_KEY     = 'po.v4.trades';
  var QUEUE_KEY      = 'po.v4.queue';
  var LAST_UID_KEY   = 'po.v4.lastUid';
  var ONBOARDING_KEY = 'po.onboarding.v1';

  var uid = null;
  var ready = false;
  var pushing = false;
  var pushTimer = null;
  var lastSnap = '';

  // ذخیره توابع اصلی
  var origSetItem    = localStorage.setItem.bind(localStorage);
  var origGetItem    = localStorage.getItem.bind(localStorage);
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
  setInterval(function() {
    var l = document.getElementById('loader');
    if (l && l.getAttribute('data-killed') !== '1') killLoader();
  }, 1500);

  /* ============================================================
     Queue Management
     ============================================================ */
  function getQueue() {
    try { return JSON.parse(origGetItem(QUEUE_KEY) || '[]'); }
    catch(e) { return []; }
  }
  function saveQueue(q) {
    try { origSetItem(QUEUE_KEY, JSON.stringify(q)); } catch(e) {}
  }
  function queueOp(op, id, data) {
    if (!id) return;
    var q = getQueue();
    // حذف opهای قبلی برای همون id (idempotent)
    q = q.filter(function(item) { return item.id !== id; });
    q.push({ op: op, id: id, data: data || null, ts: Date.now() });
    saveQueue(q);
  }
  function clearQueue() {
    saveQueue([]);
  }
  function queueLength() {
    return getQueue().length;
  }

  /* ============================================================
     Detect changes (localStorage override)
     ============================================================ */
  function detectChanges(oldStr, newStr) {
    try {
      var oldArr = JSON.parse(oldStr || '[]');
      var newArr = JSON.parse(newStr || '[]');
      if (!Array.isArray(oldArr)) oldArr = [];
      if (!Array.isArray(newArr)) newArr = [];

      var oldIds = new Set(oldArr.map(function(t) { return t.id; }));
      var newIds = new Set(newArr.map(function(t) { return t.id; }));

      // ➕ اضافه‌ها و 🔄 آپدیت‌ها
      newArr.forEach(function(t) {
        if (!t || !t.id) return;
        var old = null;
        for (var i = 0; i < oldArr.length; i++) {
          if (oldArr[i].id === t.id) { old = oldArr[i]; break; }
        }
        if (!old) {
          queueOp('add', t.id, t);
          console.log('[Sync] 📌 ADD:', t.id);
        } else if (JSON.stringify(old) !== JSON.stringify(t)) {
          queueOp('update', t.id, t);
          console.log('[Sync] 📌 UPDATE:', t.id);
        }
      });

      // 🗑️ حذف‌ها
      oldArr.forEach(function(t) {
        if (t && t.id && !newIds.has(t.id)) {
          queueOp('delete', t.id);
          console.log('[Sync] 📌 DELETE:', t.id);
        }
      });

    } catch(e) {
      console.error('[Sync] detect error:', e);
    }
  }

  /* ============ Override setItem ============ */
  localStorage.setItem = function(key, value) {
    var oldValue = null;
    if (key === TRADES_KEY && uid && ready) {
      oldValue = origGetItem(key);
    }

    origSetItem(key, value);

    if (oldValue !== null && oldValue !== value) {
      detectChanges(oldValue, value);
      if (queueLength() > 0) schedulePush(200);
    }
  };

  /* ============ Override removeItem ============ */
  localStorage.removeItem = function(key) {
    if (key === TRADES_KEY && uid && ready) {
      try {
        var oldStr = origGetItem(key);
        var oldArr = JSON.parse(oldStr || '[]');
        oldArr.forEach(function(t) {
          if (t && t.id) queueOp('delete', t.id);
        });
        if (queueLength() > 0) schedulePush(200);
      } catch(e) {}
    }
    origRemoveItem(key);
  };

  /* ============================================================
     Push to Cloud
     ============================================================ */
  function schedulePush(delay) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushToCloud, delay || 200);
  }

  async function pushToCloud() {
    if (!uid || !ready || pushing) return;

    var queue = getQueue();
    if (!queue.length) return;

    pushing = true;
    console.log('[Sync] 🚀 Push — ops:', queue.length);

    try {
      // جمع‌آوری عملیات
      var idsToDelete = [];
      var itemsToUpsert = [];

      queue.forEach(function(op) {
        if (op.op === 'delete') {
          idsToDelete.push(op.id);
        } else {
          itemsToUpsert.push({
            user_id: uid,
            trade_id: op.id,
            data: op.data,
            updated_at: new Date().toISOString()
          });
          // برای add/update، اول نسخه قدیمی رو پاک کن
          idsToDelete.push(op.id);
        }
      });

      // 1️⃣ حذف
      if (idsToDelete.length > 0) {
        var delRes = await sb.from('trades')
          .delete()
          .eq('user_id', uid)
          .in('trade_id', idsToDelete);

        if (delRes.error) {
          console.error('[Sync] ❌ Delete error:', delRes.error.message);
        } else {
          console.log('[Sync] 🗑️ Deleted/cleaned:', idsToDelete.length);
        }
      }

      // 2️⃣ درج مجدد
      if (itemsToUpsert.length > 0) {
        var insRes = await sb.from('trades').insert(itemsToUpsert);
        if (insRes.error) {
          console.error('[Sync] ❌ Insert error:', insRes.error.message);
        } else {
          console.log('[Sync] ➕ Inserted:', itemsToUpsert.length);
        }
      }

      // 3️⃣ پاک کردن صف
      clearQueue();
      lastSnap = origGetItem(TRADES_KEY) || '[]';

      console.log('[Sync] ✅ Push complete');

    } catch(e) {
      console.error('[Sync] ❌ Push failed:', e);
    } finally {
      pushing = false;

      // اگه صف هنوز پر بود (opهای جدید در این فاصله) → دوباره بفرست
      if (queueLength() > 0) {
        schedulePush(1000);
      }
    }
  }

  /* ============================================================
     Flush on unload/hidden
     ============================================================ */
  function flushOnUnload() {
    var queue = getQueue();
    if (!queue.length || !uid) return;

    console.log('[Sync] 🚨 Flush on unload — ops:', queue.length);

    var url = SUPABASE_URL + '/rest/v1/trades';
    var headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    };

    // گروه‌بندی
    var idsToDelete = [];
    var itemsToUpsert = [];

    queue.forEach(function(op) {
      if (op.op === 'delete') {
        idsToDelete.push(op.id);
      } else {
        idsToDelete.push(op.id);
        itemsToUpsert.push({
          user_id: uid,
          trade_id: op.id,
          data: op.data,
          updated_at: new Date().toISOString()
        });
      }
    });

    try {
      if (idsToDelete.length > 0) {
        var delUrl = url + '?user_id=eq.' + uid + '&trade_id=in.(' +
                     idsToDelete.map(encodeURIComponent).join(',') + ')';
        fetch(delUrl, { method: 'DELETE', headers: headers, keepalive: true });
      }

      if (itemsToUpsert.length > 0) {
        fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(itemsToUpsert),
          keepalive: true
        });
      }

      clearQueue();
    } catch(e) {
      console.error('[Sync] flush error:', e);
    }
  }

  window.addEventListener('beforeunload', flushOnUnload);
  window.addEventListener('pagehide', flushOnUnload);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      flushOnUnload();
    }
  });

  /* ============================================================
     Boot
     ============================================================ */
  async function boot() {
    try {
      var sRes = await sb.auth.getSession();
      if (!sRes || !sRes.data || !sRes.data.session) {
        console.log('[Sync] ⚠️ No session');
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
        console.log('[Sync] 🔄 Account switched → reset local');
        origRemoveItem(TRADES_KEY);
        clearQueue();
      }
      origSetItem(LAST_UID_KEY, uid);

      // 1️⃣ ابری رو بگیر
      var cloud = [];
      try {
        var rRes = await sb.from('trades')
          .select('data')
          .eq('user_id', uid);
        if (rRes.error) throw rRes.error;
        cloud = (rRes.data || [])
          .map(function(r) { return r.data; })
          .filter(function(t) { return t && t.id; });
        console.log('[Sync] ☁️ Cloud:', cloud.length);
      } catch(e) {
        console.warn('[Sync] ⚠️ Cloud fetch failed:', e.message);
        // fallback: از local استفاده کن
        try {
          cloud = JSON.parse(origGetItem(TRADES_KEY) || '[]');
          console.log('[Sync] 💾 Fallback to local:', cloud.length);
        } catch(e2) { cloud = []; }
      }

      // 2️⃣ صف pending رو روش اعمال کن
      var queue = getQueue();
      console.log('[Sync] 📋 Queue:', queue.length);

      var final = cloud.slice();
      for (var i = 0; i < queue.length; i++) {
        var op = queue[i];
        if (op.op === 'add') {
          var exists = final.some(function(t) { return t.id === op.id; });
          if (!exists && op.data) final.push(op.data);
        } else if (op.op === 'update') {
          var idx = -1;
          for (var j = 0; j < final.length; j++) {
            if (final[j].id === op.id) { idx = j; break; }
          }
          if (idx >= 0) final[idx] = op.data;
          else if (op.data) final.push(op.data);
        } else if (op.op === 'delete') {
          final = final.filter(function(t) { return t.id !== op.id; });
        }
      }

      // 3️⃣ مرتب‌سازی
      final.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });

      // 4️⃣ ذخیره بی‌صدا
      var finalStr = JSON.stringify(final);
      origSetItem(TRADES_KEY, finalStr);
      lastSnap = finalStr;
      ready = true;

      console.log('[Sync] ✅ Boot — final:', final.length);

      // 5️⃣ اگه صف پر بود → push
      if (queue.length > 0) {
        schedulePush(300);
      }

    } catch(e) {
      console.error('[Sync] ❌ Boot error:', e);
      ready = true; // بازم بتونیم از اپ استفاده کنیم
    }
  }

  /* ============================================================
     Init
     ============================================================ */
  boot()
    .catch(function(e) { console.error('[Sync] boot catch:', e); })
    .finally(function() {
      ready = true;
      var script = document.createElement('script');
      script.src = 'app.js';
      script.onerror = function() {
        console.error('[Sync] ❌ app.js failed to load');
        killLoader();
      };
      document.body.appendChild(script);
      setTimeout(killLoader, 2500);
      setTimeout(killLoader, 5000);
    });

  /* ============================================================
     Public API
     ============================================================ */
  window.PT_Sync = {
    status: function() {
      var localArr = [];
      try { localArr = JSON.parse(origGetItem(TRADES_KEY) || '[]'); } catch(e) {}
      return {
        uid: uid,
        ready: ready,
        pushing: pushing,
        queue: queueLength(),
        localCount: localArr.length
      };
    },
    forcePush: function() { schedulePush(0); },
    clearQueue: clearQueue,
    killLoader: killLoader
  };

})();
