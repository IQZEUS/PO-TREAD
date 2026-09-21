/* ============================================================
   PO-TRADE Sync — SIMPLE & RELIABLE v1
   ❌ بدون override localStorage
   ❌ بدون per-user key پیچیده
   ✅ فقط polling + push/pull ساده
   ✅ Cloud = mirror of local
   ============================================================ */
(function() {
  'use strict';

  var SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var TRADES_KEY = 'po.v4.trades';

  var uid = null;
  var ready = false;
  var pushing = false;
  var lastHash = '';
  var pushTimer = null;

  /* ============ Kill loader ============ */
  function killLoader() {
    var l = document.getElementById('loader');
    if (!l) return;
    if (l.getAttribute('data-killed') === '1') return;
    l.setAttribute('data-killed', '1');
    l.style.transition = 'opacity .3s ease';
    l.style.opacity = '0';
    setTimeout(function() {
      l.style.display = 'none';
    }, 350);
  }
  setTimeout(killLoader, 4000);
  setInterval(killLoader, 1500);

  /* ============ Hash تابع ============ */
  function hashString(s) {
    var h = 0;
    if (s.length === 0) return '0';
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h = h & h;
    }
    return String(h);
  }

  function getRaw() {
    try { return localStorage.getItem(TRADES_KEY) || '[]'; }
    catch(e) { return '[]'; }
  }

  function getLocal() {
    try {
      var a = JSON.parse(getRaw());
      return Array.isArray(a) ? a : [];
    } catch(e) { return []; }
  }

  /* ============================================================
     🔥 PUSH — کل local رو به cloud می‌فرستیم
     ============================================================ */
  async function pushAll() {
    if (!uid || !ready || pushing) return;

    pushing = true;
    try {
      var arr = getLocal();
      console.log('[Sync] 🚀 Push شروع — ' + arr.length + ' معامله');

      // 1. همه معاملات قبلی این کاربر رو پاک کن
      var delRes = await sb.from('trades').delete().eq('user_id', uid);
      if (delRes.error) {
        console.error('[Sync] ❌ Delete error:', delRes.error.message);
        return;
      }

      // 2. اگه معامله‌ای هست، اضافه کن
      if (arr.length > 0) {
        var rows = arr.map(function(t) {
          return {
            user_id: uid,
            trade_id: t.id,
            data: t
          };
        });

        var insRes = await sb.from('trades').insert(rows);
        if (insRes.error) {
          console.error('[Sync] ❌ Insert error:', insRes.error.message);
          return;
        }
      }

      // 3. hash رو آپدیت کن
      lastHash = hashString(JSON.stringify(arr));

      console.log('[Sync] ✅ Push کامل — ' + arr.length + ' معامله');

    } catch(e) {
      console.error('[Sync] ❌ Push exception:', e);
    } finally {
      pushing = false;
    }
  }

  /* ============================================================
     🔥 PULL — از cloud بگیر و local رو آپدیت کن
     ============================================================ */
  async function pullAll() {
    if (!uid) return;

    try {
      var res = await sb.from('trades').select('data').eq('user_id', uid);
      if (res.error) {
        console.error('[Sync] ❌ Pull error:', res.error.message);
        return [];
      }

      var arr = (res.data || [])
        .map(function(r) { return r.data; })
        .filter(function(t) { return t && t.id; });

      arr.sort(function(a, b) {
        return (a.createdAt || 0) - (b.createdAt || 0);
      });

      var json = JSON.stringify(arr);
      localStorage.setItem(TRADES_KEY, json);
      lastHash = hashString(json);

      console.log('[Sync] ✅ Pull کامل — ' + arr.length + ' معامله');
      return arr;

    } catch(e) {
      console.error('[Sync] ❌ Pull exception:', e);
      return [];
    }
  }

  /* ============================================================
     🔥 POLLING — هر 400ms چک کن تغییر کرده یا نه
     ============================================================ */
  setInterval(function() {
    if (!uid || !ready || pushing) return;

    var raw = getRaw();
    var h = hashString(raw);

    if (h === lastHash) return;

    // تغییر کرده!
    console.log('[Sync] 📢 تغییر در local تشخیص داده شد');
    lastHash = h;

    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushAll, 800);
  }, 400);

  /* ============================================================
     🔥 BOOT
     ============================================================ */
  async function boot() {
    try {
      // 1. session
      var sRes = await sb.auth.getSession();
      if (!sRes || !sRes.data || !sRes.data.session) {
        console.log('[Sync] ⚠️ بدون session');
        return;
      }

      uid = sRes.data.session.user.id;
      console.log('[Sync] 👤 کاربر: ' + sRes.data.session.user.email);

      // 2. onboarding
      if (localStorage.getItem('po.onboarding.v1') !== 'seen') {
        console.log('[Sync] 🎉 کاربر جدید → welcome.html');
        window.location.replace('welcome.html');
        return;
      }

      // 3. cloud رو بگیر
      var cloudArr = await pullAll();

      // 4. اگه cloud خالی بود و local پر بود → local رو push کن
      if (cloudArr.length === 0) {
        var localArr = getLocal();
        if (localArr.length > 0) {
          console.log('[Sync] 📤 cloud خالی + local پر → push');
          ready = true;
          await pushAll();
        }
      }

      ready = true;
      console.log('[Sync] ✅ Boot کامل');

    } catch(e) {
      console.error('[Sync] ❌ Boot error:', e);
    }
  }

  /* ============================================================
     اجرا + لود app.js
     ============================================================ */
  boot()
    .catch(function(e) { console.error('[Sync] boot catch:', e); })
    .finally(function() {
      // حالا app.js رو لود کن
      var script = document.createElement('script');
      script.src = 'app.js';
      script.onerror = function() {
        console.error('[Sync] ❌ app.js لود نشد');
        killLoader();
      };
      document.body.appendChild(script);
    });

  /* ============ API دیباگ ============ */
  window.PT_Sync = {
    info: function() {
      var raw = getRaw();
      return {
        uid: uid,
        ready: ready,
        pushing: pushing,
        localCount: getLocal().length,
        localHash: hashString(raw),
        lastHash: lastHash
      };
    },
    pushNow: pushAll,
    pullNow: pullAll,
    killLoader: killLoader
  };

})();
