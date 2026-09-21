/* ============================================================
   PO-TRADE Sync — SAFE VERSION v2
   + حذف واقعی معاملات رو ثبت می‌کنه
   ============================================================ */
(function() {
  'use strict';

  var SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var TRADES_KEY = 'po.v4.trades';
  var DELETED_KEY = 'po.v4.deleted';

  var origSetItem = localStorage.setItem.bind(localStorage);
  var origGetItem = localStorage.getItem.bind(localStorage);

  var currentUserId = null;
  var skipNext = false;
  var pushTimer = null;
  var bootCompleted = false;

  /* ============ لیست حذف‌شده‌ها ============ */
  function getDeletedIds() {
    try { return new Set(JSON.parse(origGetItem(DELETED_KEY) || '[]')); }
    catch(e) { return new Set(); }
  }
  function addDeletedId(id) {
    var s = getDeletedIds();
    s.add(id);
    try { origSetItem(DELETED_KEY, JSON.stringify([...s])); } catch(e){}
  }
  function clearDeletedIds() {
    try { origSetItem(DELETED_KEY, '[]'); } catch(e){}
  }

  /* ============ Override setItem ============ */
  localStorage.setItem = function(key, value) {
    // اگه کلید trades بود و آماده‌ایم
    if (key === TRADES_KEY && !skipNext && currentUserId && bootCompleted) {

      var oldValue = origGetItem(key);

      // ذخیره جدید
      origSetItem(key, value);

      // 🔥 تشخیص حذف با مقایسه old vs new
      try {
        var oldTrades = JSON.parse(oldValue || '[]');
        var newTrades = JSON.parse(value);
        var newIds = new Set(newTrades.map(function(t){ return t.id; }));

        oldTrades.forEach(function(t) {
          if (t && t.id && !newIds.has(t.id)) {
            addDeletedId(t.id);
            console.log('[Sync] 📌 حذف ثبت شد:', t.id);
          }
        });
      } catch(e) { console.warn('[Sync] خطای detect:', e); }

      // Push با تأخیر
      clearTimeout(pushTimer);
      pushTimer = setTimeout(function() {
        pushTrades(value, currentUserId);
      }, 1200);

    } else {
      origSetItem(key, value);
    }
    skipNext = false;
  };

  /* ============ Push ============ */
  async function pushTrades(jsonStr, userId) {
    try {
      var trades = JSON.parse(jsonStr);
      if (!Array.isArray(trades)) return;

      var { data: existing, error: fetchErr } = await sb
        .from('trades')
        .select('trade_id')
        .eq('user_id', userId);
      if (fetchErr) throw fetchErr;

      var existingIds = new Set((existing || []).map(function(r){ return r.trade_id; }));
      var localIds = new Set(trades.map(function(t){ return t.id; }));

      // 1️⃣ درج جدیدها
      var toInsert = trades
        .filter(function(t){ return !existingIds.has(t.id); })
        .map(function(t){ return { user_id: userId, trade_id: t.id, data: t }; });

      if (toInsert.length > 0) {
        var { error } = await sb.from('trades').insert(toInsert);
        if (error) throw error;
        console.log('[Sync] ➕ اضافه شد: ' + toInsert.length);
      }

      // 2️⃣ آپدیت موجودها
      var toUpdate = trades.filter(function(t){ return existingIds.has(t.id); });
      for (var i = 0; i < toUpdate.length; i++) {
        var t = toUpdate[i];
        await sb
          .from('trades')
          .update({ data: t, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('trade_id', t.id);
      }
      if (toUpdate.length > 0) {
        console.log('[Sync] 🔄 آپدیت شد: ' + toUpdate.length);
      }

      // 3️⃣ حذف‌شده‌ها (فقط اونایی که کاربر خودش حذف کرده)
      var deletedIds = getDeletedIds();
      var toDelete = [...deletedIds].filter(function(id){ return existingIds.has(id); });

      if (toDelete.length > 0) {
        var { error: delErr } = await sb
          .from('trades')
          .delete()
          .eq('user_id', userId)
          .in('trade_id', toDelete);
        if (delErr) throw delErr;
        console.log('[Sync] 🗑️ حذف شد از ابری: ' + toDelete.length);
        clearDeletedIds();
      }

      console.log('[Sync] ✅ پوش کامل — مجموع: ' + trades.length);

    } catch (e) {
      console.error('[Sync] ❌ خطای پوش:', e);
    }
  }

  /* ============ Boot ============ */
  async function boot() {
    try {
      var { data: { session } } = await sb.auth.getSession();

      if (session) {
        currentUserId = session.user.id;

        var { data: remoteData, error } = await sb
          .from('trades')
          .select('data')
          .eq('user_id', currentUserId);

        if (error) console.error('[Sync] خطای لود:', error);

        var remoteTrades = (remoteData || []).map(function(r){ return r.data; });
        var localRaw = origGetItem(TRADES_KEY);
        var localTrades = [];
        try { localTrades = JSON.parse(localRaw || '[]'); } catch(e){}

        // Merge — local اولویت داره
        var map = new Map();
        remoteTrades.forEach(function(t){ if (t && t.id) map.set(t.id, t); });
        localTrades.forEach(function(t){ if (t && t.id) map.set(t.id, t); });

        var merged = Array.from(map.values());
        merged.sort(function(a,b){ return (a.createdAt||0) - (b.createdAt||0); });

        skipNext = true;
        origSetItem(TRADES_KEY, JSON.stringify(merged));

        console.log('[Sync] 📦 لود شد — ابری:', remoteTrades.length, '| محلی:', localTrades.length, '| مجموع:', merged.length);

        bootCompleted = true;

        // اگه محلی چیز اضافه‌ای داره → push
        if (localTrades.length > 0 && merged.length !== remoteTrades.length) {
          setTimeout(function() {
            pushTrades(JSON.stringify(merged), currentUserId);
          }, 1500);
        }
      }
    } catch (e) {
      console.error('[Sync] خطای boot:', e);
    }

    // حالا app.js رو لود کن
    var script = document.createElement('script');
    script.src = 'app.js';
    document.body.appendChild(script);
  }

  sb.auth.onAuthStateChange(function(event, session) {
    if (session) {
      currentUserId = session.user.id;
    } else {
      currentUserId = null;
      bootCompleted = false;
    }
  });

  window.PT_Sync = {
    pull: async function() {
      if (!currentUserId) return;
      var { data } = await sb.from('trades').select('data').eq('user_id', currentUserId);
      if (data) {
        var trades = data.map(function(r){ return r.data; });
        skipNext = true;
        origSetItem(TRADES_KEY, JSON.stringify(trades));
        location.reload();
      }
    },
    push: async function() {
      if (!currentUserId) return;
      var raw = origGetItem(TRADES_KEY);
      if (raw) await pushTrades(raw, currentUserId);
    }
  };

  boot();
})();
