/* ============================================================
   PO-TRADE Sync — v8 FINAL
   ✅ Watchdog: لودر بعد 4s حذف می‌شه
   ✅ Deleted list: حذف تکی همیشه کار می‌کنه
   ✅ Polling: تغییرات سریع شناسایی می‌شن
   ✅ Push: local دقیقاً با cloud mirror می‌شه
   ✅ Onboarding: کاربر جدید → welcome.html
   ============================================================ */
(function() {
  'use strict';

  var SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var TRADES_KEY     = 'po.v4.trades';
  var DELETED_KEY    = 'po.v4.deleted';
  var ONBOARDING_KEY = 'po.onboarding.v1';

  /* ============================================================
     🔥 KILL LOADER
     ============================================================ */
  function killLoader() {
    try {
      var l = document.getElementById('loader');
      if (!l) return;
      if (l.getAttribute('data-killed') === '1') return;
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

  var wd = setInterval(function() {
    var l = document.getElementById('loader');
    if (!l || l.getAttribute('data-killed') === '1') {
      if (!l) clearInterval(wd);
      return;
    }
    killLoader();
  }, 1500);

  /* ============================================================
     State
     ============================================================ */
  var uid = null;
  var ready = false;
  var pushing = false;
  var pendingPush = false;
  var lastSnap = '';
  var bootDone = false;

  /* ============================================================
     Deleted list
     ============================================================ */
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

  /* ============================================================
     Read local
     ============================================================ */
  function getLocal() {
    try {
      var v = JSON.parse(localStorage.getItem(TRADES_KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch(e) { return []; }
  }

  /* ============================================================
     PUSH — Cloud = mirror of local
     ============================================================ */
  async function pushToCloud() {
    if (!uid || !ready) return;
    if (pushing) { pendingPush = true; return; }

    pushing = true;
    pendingPush = false;

    try {
      var local = getLocal();
      var deletedSet = getDeleted();

      console.log('[Sync] 🚀 Push — local:', local.length, '| deleted:', deletedSet.size);

      // ابری رو بگیر
      var rRes = await sb.from('trades').select('trade_id').eq('user_id', uid);
      if (rRes.error) throw new Error(rRes.error.message);

      var remoteIds = new Set((rRes.data || []).map(function(r) { return r.trade_id; }));
      var localIds = new Set(local.map(function(t) { return t.id; }));

      // 1️⃣ حذف: remote_ids که در local نیستن یا در deleted list هستن
      var toDelete = [];
      remoteIds.forEach(function(id) {
        if (!localIds.has(id) || deletedSet.has(id)) {
          toDelete.push(id);
        }
      });

      if (toDelete.length > 0) {
        console.log('[Sync] 🗑️ حذف از ابری:', toDelete.length);
        var delRes = await sb.from('trades')
          .delete()
          .eq('user_id', uid)
          .in('trade_id', toDelete);
        if (delRes.error) console.error('[Sync] Delete error:', delRes.error.message);
      }

      // 2️⃣ اضافه: local_ids که در remote نیستن و در deleted نیستن
      var toInsert = local.filter(function(t) {
        return !remoteIds.has(t.id) && !deletedSet.has(t.id);
      });

      if (toInsert.length > 0) {
        console.log('[Sync] ➕ اضافه:', toInsert.length);
        var insRes = await sb.from('trades').insert(toInsert.map(function(t) {
          return { user_id: uid, trade_id: t.id, data: t };
        }));
        if (insRes.error) console.error('[Sync] Insert error:', insRes.error.message);
      }

      // 3️⃣ آپدیت: هرچی تو هردو هست (و حذف نشده)
      var toUpdate = local.filter(function(t) {
        return remoteIds.has(t.id) && !deletedSet.has(t.id);
      });

      for (var i = 0; i < toUpdate.length; i++) {
        var t = toUpdate[i];
        await sb.from('trades')
          .update({ data: t, updated_at: new Date().toISOString() })
          .eq('user_id', uid)
          .eq('trade_id', t.id);
      }
      if (toUpdate.length > 0) console.log('[Sync] 🔄 آپدیت:', toUpdate.length);

      // 4️⃣ حالا که همه چیز push شد → deleted list رو پاک کن
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

  /* ============================================================
     POLLING — هر 400ms تغییرات لوکال رو چک کن
     ============================================================ */
  setInterval(function() {
    if (!uid || !ready) return;

    var cur = localStorage.getItem(TRADES_KEY) || '[]';
    if (cur === lastSnap) return;

    // 🔥 اول حذف‌ها رو ثبت کن
    try {
      var oldArr = JSON.parse(lastSnap || '[]');
      var newArr = JSON.parse(cur || '[]');
      var newIds = new Set(newArr.map(function(t) { return t.id; }));
      var removed = oldArr
        .filter(function(t) { return t && t.id && !newIds.has(t.id); })
        .map(function(t) { return t.id; });
      if (removed.length > 0) {
        addDeleted(removed);
        console.log('[Sync] 📌 حذف تکی ثبت شد:', removed);
      }
    } catch(e) {}

    console.log('[Sync] 📢 تغییر لوکال');
    lastSnap = cur;

    clearTimeout(window.__pt);
    window.__pt = setTimeout(pushToCloud, 500);
  }, 400);

  /* ============================================================
     BOOT
     ============================================================ */
  async function boot() {
    try {
      // 1️⃣ Session
      var sRes = await sb.auth.getSession();
      if (!sRes || !sRes.data || !sRes.data.session) {
        console.log('[Sync] ⚠️ بدون session');
        return;
      }

      uid = sRes.data.session.user.id;
      console.log('[Sync] 👤 کاربر:', sRes.data.session.user.email);

      // 2️⃣ Onboarding
      if (localStorage.getItem(ONBOARDING_KEY) !== 'seen') {
        console.log('[Sync] 🎉 کاربر جدید → welcome.html');
        window.location.replace('welcome.html');
        return;
      }

      // 3️⃣ ابری رو بگیر
      var rRes = await sb.from('trades').select('data').eq('user_id', uid);
      if (rRes.error) console.error('[Sync] Remote error:', rRes.error.message);

      var deletedSet = getDeleted();
      console.log('[Sync] 📌 deleted list:', deletedSet.size);

      var remote = (rRes.data || [])
        .map(function(r) { return r.data; })
        .filter(function(t) {
          return t && t.id && !deletedSet.has(t.id);
        });

      // 4️⃣ لوکال
      var local = getLocal().filter(function(t) {
        return t && t.id && !deletedSet.has(t.id);
      });

      console.log('[Sync] 📦 ابری:', remote.length, '| لوکال:', local.length);

      // 5️⃣ Merge — local اولویت داره
      var map = new Map();
      remote.forEach(function(t) { map.set(t.id, t); });
      local.forEach(function(t) { map.set(t.id, t); });

      var merged = Array.from(map.values());
      merged.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });

      localStorage.setItem(TRADES_KEY, JSON.stringify(merged));
      lastSnap = JSON.stringify(merged);
      ready = true;
      bootDone = true;

      console.log('[Sync] ✅ Merge — مجموع:', merged.length);

      // 6️⃣ اگه حذف pending یا تفاوت هست → push
      if (deletedSet.size > 0 ||
          remote.length !== merged.length ||
          local.length !== merged.length) {
        setTimeout(pushToCloud, 800);
      }

    } catch(e) {
      console.error('[Sync] ❌ Boot error:', e);
      bootDone = true;
    }
  }

  /* ============================================================
     اجرا
     ============================================================ */
  boot()
    .catch(function(e) {
      console.error('[Sync] boot catch:', e);
      bootDone = true;
    })
    .finally(function() {
      // app.js رو لود کن
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
    clearDeleted: clearDeleted,
    killLoader: killLoader
  };

})();
