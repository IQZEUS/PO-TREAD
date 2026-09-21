/* ============================================================
   PO-TRADE Sync — FIXED VERSION v3
   - حذف تکی کار می‌کنه ✅
   - حذف دسته‌جمعی کار می‌کنه ✅
   - دیگه معاملات حذف‌شده برنمی‌گردن ✅
   ============================================================ */
(function() {
  'use strict';

  var SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';

  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var TRADES_KEY  = 'po.v4.trades';
  var DELETED_KEY = 'po.v4.deleted';

  /* ============ توابع اصلی localStorage ============ */
  var origSetItem    = localStorage.setItem.bind(localStorage);
  var origGetItem    = localStorage.getItem.bind(localStorage);
  var origRemoveItem = localStorage.removeItem.bind(localStorage);

  var currentUserId = null;
  var skipNext      = false;
  var pushTimer     = null;
  var bootCompleted = false;
  var isPushing     = false;
  var pendingPush   = null;

  /* ============ لیست حذف‌شده‌ها ============ */
  function getDeletedIds() {
    try {
      var raw = origGetItem(DELETED_KEY);
      return new Set(JSON.parse(raw || '[]'));
    } catch(e) { return new Set(); }
  }
  function addDeletedId(id) {
    var s = getDeletedIds();
    s.add(id);
    try { origSetItem(DELETED_KEY, JSON.stringify(Array.from(s))); } catch(e){}
  }
  function addDeletedIds(ids) {
    var s = getDeletedIds();
    for (var i = 0; i < ids.length; i++) s.add(ids[i]);
    try { origSetItem(DELETED_KEY, JSON.stringify(Array.from(s))); } catch(e){}
  }
  function clearDeletedIds() {
    try { origSetItem(DELETED_KEY, '[]'); } catch(e){}
  }

  /* ============ تشخیص حذف با مقایسه ============ */
  function detectDeletions(oldVal, newVal) {
    try {
      var oldTrades = JSON.parse(oldVal || '[]');
      var newTrades = JSON.parse(newVal || '[]');
      if (!Array.isArray(oldTrades) || !Array.isArray(newTrades)) return;

      var newIds = new Set(newTrades.map(function(t){ return t.id; }));
      oldTrades.forEach(function(t) {
        if (t && t.id && !newIds.has(t.id)) {
          addDeletedId(t.id);
          console.log('[Sync] 📌 حذف ثبت شد:', t.id);
        }
      });
    } catch(e) {}
  }

  /* ============================================================
     Override: setItem
     ============================================================ */
  localStorage.setItem = function(key, value) {
    if (key === TRADES_KEY && !skipNext && currentUserId && bootCompleted) {
      var oldValue = origGetItem(key);
      origSetItem(key, value);

      // ثبت حذف‌ها
      detectDeletions(oldValue, value);

      // زمان‌بندی push
      clearTimeout(pushTimer);
      pushTimer = setTimeout(function() {
        pushTrades(value, currentUserId);
      }, 700);

      skipNext = false;
      return;
    }
    origSetItem(key, value);
    skipNext = false;
  };

  /* ============================================================
     Override: removeItem ← این خیلی مهمه!
     برای «پاک کردن همه» از این استفاده می‌شه
     ============================================================ */
  localStorage.removeItem = function(key) {
    if (key === TRADES_KEY && currentUserId && bootCompleted) {
      var oldValue = origGetItem(key);

      // همه رو به‌عنوان حذف‌شده ثبت کن
      try {
        var oldTrades = JSON.parse(oldValue || '[]');
        if (Array.isArray(oldTrades) && oldTrades.length > 0) {
          var ids = oldTrades.map(function(t){ return t.id; }).filter(Boolean);
          addDeletedIds(ids);
          console.log('[Sync] 🗑️ حذف دسته‌جمعی ثبت شد:', ids.length);
        }
      } catch(e) {}

      origRemoveItem(key);

      // Push خالی (برای حذف همه از ابری)
      clearTimeout(pushTimer);
      pushTimer = setTimeout(function() {
        pushTrades('[]', currentUserId);
      }, 500);

      return;
    }
    origRemoveItem(key);
  };

  /* ============================================================
     Push به Supabase
     ============================================================ */
  async function pushTrades(jsonStr, userId) {
    // اگه یه push در حال اجرا هست، این رو نگه دار
    if (isPushing) {
      pendingPush = { jsonStr: jsonStr, userId: userId };
      return;
    }
    isPushing = true;

    try {
      var trades = [];
      try { trades = JSON.parse(jsonStr || '[]'); } catch(e) {}
      if (!Array.isArray(trades)) trades = [];

      console.log('[Sync] 🚀 شروع push — تعداد محلی:', trades.length);

      // 1️⃣ معاملات موجود در ابری رو بگیر
      var fetchResult = await sb
        .from('trades')
        .select('trade_id')
        .eq('user_id', userId);

      if (fetchResult.error) {
        console.error('[Sync] ❌ خطای fetch:', fetchResult.error.message);
        isPushing = false;
        return;
      }

      var existing = fetchResult.data || [];
      var existingIds = new Set(existing.map(function(r){ return r.trade_id; }));
      var localIds = new Set(trades.map(function(t){ return t.id; }));

      // 2️⃣ محاسبه حذف‌ها
      var deletedIds = getDeletedIds();
      var toDelete = Array.from(deletedIds).filter(function(id){
        return existingIds.has(id);
      });

      // اگه local خالیه → همه رو حذف کن
      if (trades.length === 0 && existingIds.size > 0) {
        toDelete = Array.from(existingIds);
        console.log('[Sync] 🗑️ local خالیه — همه از ابری حذف می‌شن');
      }

      // 3️⃣ حذف از ابری
      if (toDelete.length > 0) {
        var delResult = await sb
          .from('trades')
          .delete()
          .eq('user_id', userId)
          .in('trade_id', toDelete);

        if (delResult.error) {
          console.error('[Sync] ❌ خطای delete:', delResult.error.message);
        } else {
          console.log('[Sync] 🗑️ حذف از ابری:', toDelete.length);
        }
      }

      // 4️⃣ اضافه کردن جدیدها
      var toInsert = trades
        .filter(function(t){ return !existingIds.has(t.id); })
        .map(function(t){ return { user_id: userId, trade_id: t.id, data: t }; });

      if (toInsert.length > 0) {
        var insResult = await sb.from('trades').insert(toInsert);
        if (insResult.error) {
          console.error('[Sync] ❌ خطای insert:', insResult.error.message);
        } else {
          console.log('[Sync] ➕ اضافه:', toInsert.length);
        }
      }

      // 5️⃣ آپدیت موجودها
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
        console.log('[Sync] 🔄 آپدیت:', toUpdate.length);
      }

      // 6️⃣ پاک کردن لیست حذف‌شده‌ها
      clearDeletedIds();

      console.log('[Sync] ✅ پوش کامل — مجموع محلی:', trades.length);

    } catch (e) {
      console.error('[Sync] ❌ خطای کلی push:', e);
    } finally {
      isPushing = false;

      // اگه در این مدت یه push جدید اومده بود، اجراش کن
      if (pendingPush) {
        var p = pendingPush;
        pendingPush = null;
        setTimeout(function(){ pushTrades(p.jsonStr, p.userId); }, 300);
      }
    }
  }

  /* ============================================================
     Boot — لود اولیه
     ============================================================ */
  async function boot() {
    try {
      var sessionResult = await sb.auth.getSession();

      if (sessionResult && sessionResult.data && sessionResult.data.session) {
        currentUserId = sessionResult.data.session.user.id;
        console.log('[Sync] 👤 کاربر:', sessionResult.data.session.user.email);

        // 1️⃣ معاملات ابری رو بگیر
        var remoteResult = await sb
          .from('trades')
          .select('data')
          .eq('user_id', currentUserId);

        if (remoteResult.error) {
          console.error('[Sync] ❌ خطای لود از ابری:', remoteResult.error.message);
        }

        var deletedIds = getDeletedIds();

        var remoteTrades = (remoteResult.data || [])
          .map(function(r){ return r.data; })
          .filter(function(t){
            return t && t.id && !deletedIds.has(t.id);
          });

        // 2️⃣ معاملات محلی رو بگیر
        var localRaw = origGetItem(TRADES_KEY);
        var localTrades = [];
        try { localTrades = JSON.parse(localRaw || '[]'); } catch(e){}
        if (!Array.isArray(localTrades)) localTrades = [];

        // فیلتر حذف‌شده‌ها
        localTrades = localTrades.filter(function(t){
          return t && t.id && !deletedIds.has(t.id);
        });

        // 3️⃣ Merge — محلی اولویت داره
        var map = new Map();
        remoteTrades.forEach(function(t){ if (t && t.id) map.set(t.id, t); });
        localTrades.forEach(function(t){ if (t && t.id) map.set(t.id, t); });

        var merged = Array.from(map.values());
        merged.sort(function(a,b){ return (a.createdAt||0) - (b.createdAt||0); });

        // 4️⃣ ذخیره به‌صورت بی‌صدا
        skipNext = true;
        origSetItem(TRADES_KEY, JSON.stringify(merged));
        skipNext = false;

        console.log('[Sync] 📦 لود شد — ابری:', remoteTrades.length,
                    '| محلی:', localTrades.length,
                    '| مجموع:', merged.length);

        bootCompleted = true;

        // 5️⃣ اگه حذفی pending داریم → push
        if (deletedIds.size > 0) {
          console.log('[Sync] 📤 حذف‌های pending:', deletedIds.size);
          setTimeout(function() {
            pushTrades(JSON.stringify(merged), currentUserId);
          }, 1000);
        }
        // اگه محلی چیز جدیدی داره → push
        else if (localTrades.length > 0 && merged.length !== remoteTrades.length) {
          setTimeout(function() {
            pushTrades(JSON.stringify(merged), currentUserId);
          }, 1500);
        }

      } else {
        console.log('[Sync] ⚠️ کاربر لاگین نیست');
      }
    } catch (e) {
      console.error('[Sync] ❌ خطای boot:', e);
    }

    bootCompleted = true;

    // حالا app.js رو لود کن
    var script = document.createElement('script');
    script.src = 'app.js';
    script.onerror = function(){
      console.error('[Sync] ❌ app.js لود نشد');
    };
    document.body.appendChild(script);
  }

  /* ============ Auth Change ============ */
  sb.auth.onAuthStateChange(function(event, session) {
    if (session) {
      currentUserId = session.user.id;
    } else {
      currentUserId = null;
      bootCompleted = false;
    }
  });

  /* ============ API عمومی ============ */
  window.PT_Sync = {
    pull: async function() {
      if (!currentUserId) return;
      clearDeletedIds();
      var result = await sb
        .from('trades')
        .select('data')
        .eq('user_id', currentUserId);
      if (result.data) {
        var trades = result.data.map(function(r){ return r.data; });
        skipNext = true;
        origSetItem(TRADES_KEY, JSON.stringify(trades));
        skipNext = false;
        location.reload();
      }
    },
    push: async function() {
      if (!currentUserId) return;
      var raw = origGetItem(TRADES_KEY);
      if (raw !== null) await pushTrades(raw, currentUserId);
    },
    clearCloud: async function() {
      if (!currentUserId) return;
      if (!confirm('همه معاملات از ابری حذف بشن؟')) return;
      var result = await sb
        .from('trades')
        .delete()
        .eq('user_id', currentUserId);
      if (!result.error) {
        origRemoveItem(TRADES_KEY);
        clearDeletedIds();
        console.log('[Sync] ☁️ همه چیز از ابری پاک شد');
        location.reload();
      }
    },
    status: function() {
      return {
        userId: currentUserId,
        bootCompleted: bootCompleted,
        pendingDeletes: getDeletedIds().size
      };
    }
  };

  /* ============ شروع ============ */
  boot();
})();
