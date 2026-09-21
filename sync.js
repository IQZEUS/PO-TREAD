/* ============================================================
   PO-TRADE Sync — v9 FINAL FIX
   ✅ Per-user storage: هر حساب داده خودش رو داره
   ✅ Cloud authoritative: حذف روی هر دستگاه → همه‌جا حذف
   ✅ No cross-account leak
   ✅ Watchdog loader
   ============================================================ */
(function() {
  'use strict';

  var SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var BASE_KEY       = 'po.v4.trades';
  var LAST_UID_KEY   = 'po.v4.lastUid';
  var LAST_SYNC_KEY  = 'po.v4.lastSync';
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

  setInterval(function() {
    var l = document.getElementById('loader');
    if (!l || l.getAttribute('data-killed') === '1') return;
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

  /* ============================================================
     Per-user key
     ============================================================ */
  function userKey() {
    return uid ? (BASE_KEY + '.' + uid) : BASE_KEY;
  }

  function getLocal() {
    try {
      // اول از کلید per-user بخون، اگه نبود از کلید قدیمی
      var v = localStorage.getItem(userKey());
      if (!v) v = localStorage.getItem(BASE_KEY);
      var arr = JSON.parse(v || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch(e) { return []; }
  }

  function setLocal(arr) {
    try {
      localStorage.setItem(userKey(), JSON.stringify(arr));
      // کلید قدیمی رو هم پاک کن
      localStorage.removeItem(BASE_KEY);
    } catch(e) {}
  }

  /* ============================================================
     Migration: انتقال داده قدیمی به per-user
     ============================================================ */
  function handleUserSwitch(newUid) {
    var lastUid = localStorage.getItem(LAST_UID_KEY);

    if (lastUid === newUid) {
      // همون کاربر قبلی — کاری نکن
      return;
    }

    console.log('[Sync] 🔄 سوییچ کاربر:', lastUid, '→', newUid);

    if (lastUid) {
      // داده کاربر قبلی رو backup کن
      var oldData = localStorage.getItem(BASE_KEY);
      if (oldData) {
        try {
          localStorage.setItem(BASE_KEY + '.' + lastUid, oldData);
          console.log('[Sync] 💾 داده کاربر قبلی backup شد');
        } catch(e) {}
      }
    }

    // کلید مشترک رو پاک کن
    localStorage.removeItem(BASE_KEY);

    // uid جدید رو ذخیره کن
    localStorage.setItem(LAST_UID_KEY, newUid);
  }

  /* ============================================================
     PUSH — cloud = mirror of local
     ============================================================ */
  async function pushToCloud() {
    if (!uid || !ready) return;
    if (pushing) { pendingPush = true; return; }

    pushing = true;
    pendingPush = false;

    try {
      var local = getLocal();
      console.log('[Sync] 🚀 Push — local:', local.length);

      // ابری رو بگیر
      var rRes = await sb.from('trades').select('trade_id').eq('user_id', uid);
      if (rRes.error) throw new Error(rRes.error.message);

      var remoteIds = new Set((rRes.data || []).map(function(r) { return r.trade_id; }));
      var localIds = new Set(local.map(function(t) { return t.id; }));

      // 1️⃣ حذف: هرچی تو ابره ولی تو لوکال نیست
      var toDelete = [];
      remoteIds.forEach(function(id) {
        if (!localIds.has(id)) toDelete.push(id);
      });

      if (toDelete.length > 0) {
        console.log('[Sync] 🗑️ حذف از ابری:', toDelete.length);
        var delRes = await sb.from('trades')
          .delete()
          .eq('user_id', uid)
          .in('trade_id', toDelete);
        if (delRes.error) console.error('[Sync] Delete error:', delRes.error.message);
      }

      // 2️⃣ اضافه: هرچی تو لوکاله ولی تو ابر نیست
      var toInsert = local.filter(function(t) { return !remoteIds.has(t.id); });
      if (toInsert.length > 0) {
        console.log('[Sync] ➕ اضافه:', toInsert.length);
        var insRes = await sb.from('trades').insert(toInsert.map(function(t) {
          return { user_id: uid, trade_id: t.id, data: t };
        }));
        if (insRes.error) console.error('[Sync] Insert error:', insRes.error.message);
      }

      // 3️⃣ آپدیت: هرچی تو هردو
      var toUpdate = local.filter(function(t) { return remoteIds.has(t.id); });
      for (var i = 0; i < toUpdate.length; i++) {
        var t = toUpdate[i];
        await sb.from('trades')
          .update({ data: t, updated_at: new Date().toISOString() })
          .eq('user_id', uid)
          .eq('trade_id', t.id);
      }
      if (toUpdate.length > 0) console.log('[Sync] 🔄 آپدیت:', toUpdate.length);

      lastSnap = JSON.stringify(local);
      localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
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
     POLLING — تغییرات لوکال
     ============================================================ */
  setInterval(function() {
    if (!uid || !ready) return;

    var cur = localStorage.getItem(userKey()) || '[]';
    if (cur === lastSnap) return;

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
      console.log('[Sync] 👤 کاربر:', sRes.data.session.user.email, '| uid:', uid);

      // 2️⃣ Onboarding
      if (localStorage.getItem(ONBOARDING_KEY) !== 'seen') {
        console.log('[Sync] 🎉 کاربر جدید → welcome.html');
        window.location.replace('welcome.html');
        return;
      }

      // 3️⃣ مدیریت سوییچ حساب
      handleUserSwitch(uid);

      // 4️⃣ اگه backup برای این کاربر داریم، بازگردون
      var backup = localStorage.getItem(userKey());
      if (backup && !localStorage.getItem(BASE_KEY)) {
        // backup موجوده، ازش استفاده کن
        console.log('[Sync] 💾 backup کاربر فعلی پیدا شد');
      }

      // 5️⃣ از cloud بخون
      var rRes = await sb.from('trades').select('data').eq('user_id', uid);
      if (rRes.error) console.error('[Sync] Remote error:', rRes.error.message);

      var remote = (rRes.data || [])
        .map(function(r) { return r.data; })
        .filter(function(t) { return t && t.id; });

      // 6️⃣ از local بخون (که حالا per-user هست)
      var local = getLocal();

      console.log('[Sync] 📦 ابری:', remote.length, '| لوکال:', local.length);

      // 7️⃣ CLOUD حقیقت مطلقه
      // معاملات local که تو cloud نیستن — یعنی از یه دستگاه دیگه حذف شدن
      // فقط معاملاتی رو نگه دار که در 60 ثانیه اخیر اضافه شدن (احتمالاً هنوز push نشدن)
      var lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0', 10);
      var cutoff = Date.now() - 60000; // 60 ثانیه اخیر

      var remoteMap = new Map(remote.map(function(t) { return [t.id, t]; }));

      var localOnly = local.filter(function(t) {
        if (remoteMap.has(t.id)) return false; // تو هردو هست
        // تو cloud نیست
        var created = t.createdAt || 0;
        if (created > cutoff) return true; // تازه اضافه شده، ممکنه push نشده باشه
        return false; // قدیمیه، پس حذف شده → نگه ندار
      });

      if (localOnly.length > 0) {
        console.log('[Sync] 🆕 معاملات تازه لوکال:', localOnly.length);
      }

      // 8️⃣ لیست نهایی = همه cloud + معاملات تازه لوکال
      var final = remote.concat(localOnly);
      final.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });

      setLocal(final);
      lastSnap = JSON.stringify(final);
      ready = true;

      console.log('[Sync] ✅ Merge — مجموع:', final.length);

      // 9️⃣ اگه معاملات تازه لوکال داریم → push
      if (localOnly.length > 0) {
        setTimeout(pushToCloud, 800);
      }

    } catch(e) {
      console.error('[Sync] ❌ Boot error:', e);
    }
  }

  /* ============================================================
     اجرا
     ============================================================ */
  boot()
    .catch(function(e) {
      console.error('[Sync] boot catch:', e);
    })
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
        key: userKey(),
        localCount: getLocal().length,
        lastSync: localStorage.getItem(LAST_SYNC_KEY)
      };
    },
    forcePush: pushToCloud,
    resetDevice: function() {
      // پاک کردن همه چیز — واسه دیباگ
      localStorage.removeItem(BASE_KEY);
      localStorage.removeItem(LAST_UID_KEY);
      localStorage.removeItem(LAST_SYNC_KEY);
      location.reload();
    },
    killLoader: killLoader
  };

})();
