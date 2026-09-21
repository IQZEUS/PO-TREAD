/* ============================================================
   PO-TRADE Sync — v10 FINAL
   ✅ همون کلید app.js (po.v4.trades)
   ✅ حذف تکی + دسته‌جمعی کار می‌کنه
   ✅ سوییچ حساب امن
   ✅ Watchdog loader
   ============================================================ */
(function() {
  'use strict';

  var SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var TRADES_KEY     = 'po.v4.trades';      // ⚠️ همون کلید app.js
  var DELETED_KEY    = 'po.v4.deleted';
  var LAST_UID_KEY   = 'po.v4.lastUid';
  var ONBOARDING_KEY = 'po.onboarding.v1';

  var uid = null;
  var ready = false;
  var pushing = false;
  var pendingPush = false;
  var lastSnap = '';

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
  setTimeout(killLoader, 6000);
  setTimeout(killLoader, 9000);
  setInterval(function() {
    var l = document.getElementById('loader');
    if (!l) return;
    if (l.getAttribute('data-killed') !== '1') killLoader();
  }, 1500);

  /* ============ Helpers ============ */
  function getLocal() {
    try {
      var v = JSON.parse(localStorage.getItem(TRADES_KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch(e) { return []; }
  }
  function setLocal(arr) {
    localStorage.setItem(TRADES_KEY, JSON.stringify(arr));
  }
  function getDeleted() {
    try {
      return new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'));
    } catch(e) { return new Set(); }
  }
  function addDeleted(ids) {
    if (!ids || !ids.length) return;
    var s = getDeleted();
    ids.forEach(function(id) { if (id) s.add(id); });
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(s)));
  }
  function clearDeleted() {
    localStorage.setItem(DELETED_KEY, '[]');
  }

  /* ============ Push ============ */
  async function pushToCloud() {
    if (!uid || !ready) return;
    if (pushing) { pendingPush = true; return; }

    pushing = true;
    pendingPush = false;

    try {
      var local = getLocal();
      var deleted = getDeleted();
      var localIds = new Set(local.map(function(t) { return t.id; }));

      console.log('[Sync] 🚀 Push — local:', local.length, '| deleted:', deleted.size);

      var rRes = await sb.from('trades').select('trade_id').eq('user_id', uid);
      if (rRes.error) throw rRes.error;
      var remoteIds = (rRes.data || []).map(function(r) { return r.trade_id; });

      // 🗑️ حذف: هرچی تو cloud هست ولی تو local نیست، یا تو لیست حذف‌شده‌هاست
      var toDelete = remoteIds.filter(function(id) {
        return deleted.has(id) || !localIds.has(id);
      });
      if (toDelete.length > 0) {
        console.log('[Sync] 🗑️ حذف:', toDelete.length);
        await sb.from('trades').delete().eq('user_id', uid).in('trade_id', toDelete);
      }

      // ➕ اضافه: هرچی تو local هست ولی تو cloud نیست
      var remoteSet = new Set(remoteIds);
      var toInsert = local.filter(function(t) { return !remoteSet.has(t.id); });
      if (toInsert.length > 0) {
        console.log('[Sync] ➕ اضافه:', toInsert.length);
        await sb.from('trades').insert(toInsert.map(function(t) {
          return { user_id: uid, trade_id: t.id, data: t };
        }));
      }

      // 🔄 آپدیت: هرچی تو هردو هست
      var toUpdate = local.filter(function(t) { return remoteSet.has(t.id); });
      for (var i = 0; i < toUpdate.length; i++) {
        await sb.from('trades')
          .update({ data: toUpdate[i], updated_at: new Date().toISOString() })
          .eq('user_id', uid)
          .eq('trade_id', toUpdate[i].id);
      }
      if (toUpdate.length > 0) console.log('[Sync] 🔄 آپدیت:', toUpdate.length);

      clearDeleted();
      lastSnap = JSON.stringify(local);
      console.log('[Sync] ✅ Push کامل');

    } catch(e) {
      console.error('[Sync] ❌ Push error:', e);
    } finally {
      pushing = false;
      if (pendingPush) {
        pendingPush = false;
        setTimeout(pushToCloud, 400);
      }
    }
  }

  /* ============ Poll — تغییرات محلی ============ */
  setInterval(function() {
    if (!uid || !ready) return;

    var cur = localStorage.getItem(TRADES_KEY) || '[]';
    if (cur === lastSnap) return;

    // ثبت حذف‌شده‌ها با مقایسه
    try {
      var oldArr = JSON.parse(lastSnap || '[]');
      var newArr = JSON.parse(cur || '[]');
      var newIds = new Set(newArr.map(function(t) { return t.id; }));
      var removed = oldArr
        .filter(function(t) { return t && t.id && !newIds.has(t.id); })
        .map(function(t) { return t.id; });
      if (removed.length > 0) {
        addDeleted(removed);
        console.log('[Sync] 📌 حذف ثبت شد:', removed);
      }
    } catch(e) {}

    console.log('[Sync] 📢 تغییر محلی');
    lastSnap = cur;

    clearTimeout(window.__pt);
    window.__pt = setTimeout(pushToCloud, 500);
  }, 400);

  /* ============ Boot ============ */
  async function boot() {
    try {
      var sRes = await sb.auth.getSession();
      if (!sRes || !sRes.data || !sRes.data.session) {
        console.log('[Sync] ⚠️ بدون session');
        return;
      }

      uid = sRes.data.session.user.id;
      console.log('[Sync] 👤 uid:', uid);

      // Onboarding
      if (localStorage.getItem(ONBOARDING_KEY) !== 'seen') {
        console.log('[Sync] 🎉 کاربر جدید → welcome.html');
        location.replace('welcome.html');
        return;
      }

      // سوییچ حساب؟
      var lastUid = localStorage.getItem(LAST_UID_KEY);
      if (lastUid && lastUid !== uid) {
        console.log('[Sync] 🔄 کاربر عوض شد → پاک کردن local');
        localStorage.removeItem(TRADES_KEY);
        localStorage.removeItem(DELETED_KEY);
      }
      localStorage.setItem(LAST_UID_KEY, uid);

      // از cloud بگیر
      var rRes = await sb.from('trades').select('data').eq('user_id', uid);
      if (rRes.error) console.error('[Sync] Remote error:', rRes.error.message);

      var deleted = getDeleted();
      var remote = (rRes.data || [])
        .map(function(r) { return r.data; })
        .filter(function(t) { return t && t.id && !deleted.has(t.id); });

      // از local بگیر
      var local = getLocal().filter(function(t) {
        return t && t.id && !deleted.has(t.id);
      });

      console.log('[Sync] 📦 ابری:', remote.length, '| محلی:', local.length);

      // Merge — local اولویت داره
      var map = new Map();
      remote.forEach(function(t) { map.set(t.id, t); });
      local.forEach(function(t) { map.set(t.id, t); });

      var final = Array.from(map.values());
      final.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });

      setLocal(final);
      lastSnap = JSON.stringify(final);
      ready = true;

      console.log('[Sync] ✅ boot — نهایی:', final.length);

      // Push در صورت نیاز
      if (deleted.size > 0 ||
          local.length !== final.length ||
          remote.length !== final.length) {
        setTimeout(pushToCloud, 800);
      }

    } catch(e) {
      console.error('[Sync] ❌ Boot error:', e);
    }
  }

  /* ============ شروع ============ */
  boot()
    .catch(function(e) { console.error('[Sync] boot catch:', e); })
    .finally(function() {
      var script = document.createElement('script');
      script.src = 'app.js';
      script.onerror = function() {
        console.error('[Sync] ❌ app.js لود نشد');
        killLoader();
      };
      document.body.appendChild(script);
      setTimeout(killLoader, 2500);
      setTimeout(killLoader, 5000);
    });

  /* ============ API عمومی ============ */
  window.PT_Sync = {
    status: function() {
      return {
        uid: uid,
        ready: ready,
        pushing: pushing,
        deleted: getDeleted().size,
        localCount: getLocal().length
      };
    },
    forcePush: pushToCloud,
    killLoader: killLoader
  };

})();
