/* ============================================================
   PO-TRADE Sync — v7 SIMPLE & BULLETPROOF
   ✅ Watchdog: لودر همیشه می‌ره (حتی اگه app.js گیر کرد)
   ✅ Polling: هر 400ms تغییرات رو تشخیص می‌ده
   ✅ Push: cloud رو دقیقاً mirror localStorage می‌کنه
   ✅ Delete: هر معامله‌ای که در local نیست، از cloud پاک می‌شه
   ============================================================ */
(function() {
  'use strict';

  var SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var TRADES_KEY     = 'po.v4.trades';
  var ONBOARDING_KEY = 'po.onboarding.v1';

  /* ============================================================
     🔥 KILL LOADER — قوی و بی‌رحم
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

  // 🔥 چند لایه safety
  setTimeout(killLoader, 4000);
  setTimeout(killLoader, 6000);
  setTimeout(killLoader, 9000);

  // Watchdog هر 1.5 ثانیه
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

      // 3️⃣ آپدیت: هرچی تو هردو هست
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

    console.log('[Sync] 📢 تغییر لوکال تشخیص داده شد');
    lastSnap = cur;

    clearTimeout(window.__pt);
    window.__pt = setTimeout(pushToCloud, 400);
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
        console.log('[Sync] 🎉 کاربر جدید — welcome.html');
        window.location.replace('welcome.html');
        return;
      }

      // 3️⃣ ابری رو بگیر
      var rRes = await sb.from('trades').select('data').eq('user_id', uid);
      var remote = (rRes.data || [])
        .map(function(r) { return r.data; })
        .filter(function(t) { return t && t.id; });

      var local = getLocal();
      console.log('[Sync] 📦 ابری:', remote.length, '| لوکال:', local.length);

      // 4️⃣ Merge — LOCAL اولویت داره (کاربر اخیراً چیزی عوض کرده)
      var map = new Map();

      // اول ابری
      remote.forEach(function(t) { map.set(t.id, t); });

      // بعد لوکال (اگه بود override می‌کنه)
      local.forEach(function(t) { map.set(t.id, t); });

      var merged = Array.from(map.values());
      merged.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });

      localStorage.setItem(TRADES_KEY, JSON.stringify(merged));
      lastSnap = JSON.stringify(merged);
      ready = true;

      console.log('[Sync] ✅ Merge کامل — مجموع:', merged.length);

      // 5️⃣ اگه تفاوت داره، push کن
      if (remote.length !== merged.length ||
          local.length !== merged.length) {
        setTimeout(pushToCloud, 800);
      }

    } catch(e) {
      console.error('[Sync] ❌ Boot error:', e);
    }
  }

  /* ============================================================
     اجرا
     ============================================================ */
  boot().catch(function(e) {
    console.error('[Sync] boot().catch:', e);
  }).finally(function() {
    // app.js رو لود کن
    var script = document.createElement('script');
    script.src = 'app.js';
    script.onerror = function() {
      console.error('[Sync] ❌ app.js لود نشد');
      killLoader();
    };
    document.body.appendChild(script);

    // چند ثانیه بعد دوباره loader رو بکش
    setTimeout(killLoader, 2500);
    setTimeout(killLoader, 5000);
  });

})();
