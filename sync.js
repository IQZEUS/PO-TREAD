/* ============================================================
   PO-TRADE Sync — v5 FINAL
   ✅ حذف تکی + دسته‌جمعی
   ✅ Safety: لودر بعد از ۴ ثانیه خودکار مخفی می‌شه
   ✅ Timeout روی همه عملیات
   ✅ راهنمای اجباری برای کاربر جدید
   ============================================================ */
(function() {
  'use strict';

  var SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var TRADES_KEY     = 'po.v4.trades';
  var DELETED_KEY    = 'po.v4.deleted';
  var ONBOARDING_KEY = 'po.onboarding.v1';

  /* ============ توابع اصلی localStorage ============ */
  var origSetItem    = localStorage.setItem.bind(localStorage);
  var origGetItem    = localStorage.getItem.bind(localStorage);
  var origRemoveItem = localStorage.removeItem.bind(localStorage);

  /* ============ State ============ */
  var currentUserId  = null;
  var skipNext       = false;
  var pushTimer      = null;
  var bootCompleted  = false;
  var isPushing      = false;
  var needsAnother   = false;
  var appLoaded      = false;
  var redirected     = false;

  /* ============================================================
     🔥 SAFETY: لودر رو زورکی مخفی کن
     ============================================================ */
  function forceHideLoader() {
    var loader = document.getElementById('loader');
    if (!loader) return;
    if (loader.style.display === 'none') return;

    console.log('[Sync] 🚨 Force hide loader');
    loader.style.transition = 'opacity .4s ease';
    loader.style.opacity = '0';
    setTimeout(function() {
      loader.style.display = 'none';
      loader.classList.add('hide');
    }, 450);
  }

  // اجرای safety بعد از 4 ثانیه — هرچی شد
  setTimeout(forceHideLoader, 4000);

  // و بعد از 7 ثانیه هم دوباره — برای اطمینان
  setTimeout(forceHideLoader, 7000);

  /* ============ Timeout wrapper ============ */
  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      new Promise(function(_, reject) {
        setTimeout(function() {
          reject(new Error('Timeout: ' + (label || 'op') + ' (' + ms + 'ms)'));
        }, ms);
      })
    ]);
  }

  /* ============ لیست حذف‌شده‌ها ============ */
  function getDeletedIds() {
    try {
      return new Set(JSON.parse(origGetItem(DELETED_KEY) || '[]'));
    } catch(e) { return new Set(); }
  }
  function addDeletedId(id) {
    if (!id) return;
    var s = getDeletedIds();
    s.add(id);
    try { origSetItem(DELETED_KEY, JSON.stringify(Array.from(s))); } catch(e){}
  }
  function addDeletedIds(ids) {
    if (!ids || !ids.length) return;
    var s = getDeletedIds();
    ids.forEach(function(id) { if (id) s.add(id); });
    try { origSetItem(DELETED_KEY, JSON.stringify(Array.from(s))); } catch(e){}
  }
  function clearDeletedIds() {
    try { origSetItem(DELETED_KEY, '[]'); } catch(e){}
  }

  /* ============================================================
     Override: setItem
     ============================================================ */
  localStorage.setItem = function(key, value) {
    if (key === TRADES_KEY && !skipNext && currentUserId && bootCompleted) {
      var oldValue = origGetItem(key);
      origSetItem(key, value);

      try {
        var oldTrades = JSON.parse(oldValue || '[]');
        var newTrades = JSON.parse(value || '[]');
        if (Array.isArray(oldTrades) && Array.isArray(newTrades)) {
          var newIds = new Set(newTrades.map(function(t){ return t.id; }));
          oldTrades.forEach(function(t) {
            if (t && t.id && !newIds.has(t.id)) {
              addDeletedId(t.id);
              console.log('[Sync] 📌 حذف تکی ثبت شد:', t.id);
            }
          });
        }
      } catch(e) {}

      clearTimeout(pushTimer);
      pushTimer = setTimeout(function() {
        pushTrades(value, currentUserId);
      }, 600);

      skipNext = false;
      return;
    }
    origSetItem(key, value);
    skipNext = false;
  };

  /* ============================================================
     Override: removeItem
     ============================================================ */
  localStorage.removeItem = function(key) {
    if (key === TRADES_KEY && currentUserId && bootCompleted) {
      var oldValue = origGetItem(key);
      try {
        var oldTrades = JSON.parse(oldValue || '[]');
        if (Array.isArray(oldTrades) && oldTrades.length > 0) {
          var ids = oldTrades.map(function(t){ return t.id; }).filter(Boolean);
          addDeletedIds(ids);
          console.log('[Sync] 📌 حذف دسته‌جمعی ثبت شد:', ids.length);
        }
      } catch(e) {}

      origRemoveItem(key);

      clearTimeout(pushTimer);
      pushTimer = setTimeout(function() {
        pushTrades('[]', currentUserId);
      }, 400);

      return;
    }
    origRemoveItem(key);
  };

  /* ============================================================
     Push
     ============================================================ */
  async function pushTrades(jsonStr, userId) {
    if (isPushing) {
      needsAnother = true;
      console.log('[Sync] ⏳ push در حال اجرا، به صف اضافه شد');
      return;
    }
    isPushing = true;
    needsAnother = false;

    try {
      var trades = [];
      try { trades = JSON.parse(jsonStr || '[]'); } catch(e) {}
      if (!Array.isArray(trades)) trades = [];

      console.log('[Sync] 🚀 Push شروع — محلی:', trades.length);

      var fetchRes;
      try {
        fetchRes = await withTimeout(
          sb.from('trades').select('trade_id').eq('user_id', userId),
          6000, 'fetch'
        );
      } catch(e) {
        console.error('[Sync] ❌ Fetch timeout');
        return;
      }

      if (fetchRes.error) {
        console.error('[Sync] ❌ Fetch error:', fetchRes.error.message);
        return;
      }

      var existingIds = new Set((fetchRes.data || []).map(function(r){ return r.trade_id; }));

      var deletedIds = getDeletedIds();
      var toDelete = Array.from(deletedIds).filter(function(id) {
        return existingIds.has(id);
      });

      if (trades.length === 0 && existingIds.size > 0) {
        toDelete = Array.from(existingIds);
        console.log('[Sync] 🗑️ local خالیه → حذف همه از ابری');
      }

      if (toDelete.length > 0) {
        try {
          await withTimeout(
            sb.from('trades').delete().eq('user_id', userId).in('trade_id', toDelete),
            6000, 'delete'
          );
          console.log('[Sync] 🗑️ حذف از ابری:', toDelete.length);
        } catch(e) {
          console.error('[Sync] ❌ Delete timeout');
        }
      }

      var toInsert = trades
        .filter(function(t){ return !existingIds.has(t.id); })
        .map(function(t){ return { user_id: userId, trade_id: t.id, data: t }; });

      if (toInsert.length > 0) {
        try {
          await withTimeout(sb.from('trades').insert(toInsert), 6000, 'insert');
          console.log('[Sync] ➕ اضافه:', toInsert.length);
        } catch(e) {
          console.error('[Sync] ❌ Insert timeout');
        }
      }

      var toUpdate = trades.filter(function(t){ return existingIds.has(t.id); });
      for (var i = 0; i < toUpdate.length; i++) {
        try {
          await withTimeout(
            sb.from('trades')
              .update({ data: toUpdate[i], updated_at: new Date().toISOString() })
              .eq('user_id', userId)
              .eq('trade_id', toUpdate[i].id),
            4000, 'update'
          );
        } catch(e) {
          console.error('[Sync] ❌ Update timeout');
        }
      }
      if (toUpdate.length > 0) {
        console.log('[Sync] 🔄 آپدیت:', toUpdate.length);
      }

      clearDeletedIds();
      console.log('[Sync] ✅ Push کامل');

    } catch(e) {
      console.error('[Sync] ❌ Push error:', e);
    } finally {
      isPushing = false;

      if (needsAnother) {
        needsAnother = false;
        var raw = origGetItem(TRADES_KEY) || '[]';
        setTimeout(function() {
          pushTrades(raw, currentUserId);
        }, 300);
      }
    }
  }

  /* ============================================================
     Load app.js — با safety
     ============================================================ */
  function loadApp() {
    if (appLoaded) return;
    appLoaded = true;

    console.log('[Sync] 📦 لود app.js');

    var script = document.createElement('script');
    script.src = 'app.js';
    script.onload = function() {
      console.log('[Sync] ✅ app.js لود شد');
      // Safety: بعد از 3 ثانیه از لود app.js، اگه لودر هنوز بود، مخفی کن
      setTimeout(forceHideLoader, 3000);
    };
    script.onerror = function() {
      console.error('[Sync] ❌ app.js لود نشد — مخفی کردن لودر');
      forceHideLoader();
    };
    document.body.appendChild(script);

    // Safety نهایی: بعد از 5 ثانیه هرچی شد، لودر باید بره
    setTimeout(forceHideLoader, 5000);
  }

  /* ============================================================
     Sync
     ============================================================ */
  async function doSync() {
    try {
      var remoteRes;
      try {
        remoteRes = await withTimeout(
          sb.from('trades').select('data').eq('user_id', currentUserId),
          5000, 'remote-fetch'
        );
      } catch(e) {
        console.error('[Sync] ❌ Remote fetch timeout');
        return;
      }

      if (remoteRes.error) {
        console.error('[Sync] ❌ Remote error:', remoteRes.error.message);
        return;
      }

      var deletedIds = getDeletedIds();
      var remoteTrades = (remoteRes.data || [])
        .map(function(r){ return r.data; })
        .filter(function(t){ return t && t.id && !deletedIds.has(t.id); });

      var localTrades = [];
      try { localTrades = JSON.parse(origGetItem(TRADES_KEY) || '[]'); } catch(e) {}
      if (!Array.isArray(localTrades)) localTrades = [];
      localTrades = localTrades.filter(function(t) {
        return t && t.id && !deletedIds.has(t.id);
      });

      var map = new Map();
      remoteTrades.forEach(function(t){ if (t && t.id) map.set(t.id, t); });
      localTrades.forEach(function(t){ if (t && t.id) map.set(t.id, t); });

      var merged = Array.from(map.values());
      merged.sort(function(a,b){ return (a.createdAt||0) - (b.createdAt||0); });

      skipNext = true;
      origSetItem(TRADES_KEY, JSON.stringify(merged));
      skipNext = false;

      console.log('[Sync] 📦 Sync — ابری:', remoteTrades.length,
                  '| محلی:', localTrades.length,
                  '| مجموع:', merged.length);

      if (deletedIds.size > 0) {
        setTimeout(function() {
          pushTrades(JSON.stringify(merged), currentUserId);
        }, 800);
      } else if (localTrades.length > 0 && merged.length !== remoteTrades.length) {
        setTimeout(function() {
          pushTrades(JSON.stringify(merged), currentUserId);
        }, 1200);
      }

    } catch(e) {
      console.error('[Sync] ❌ Sync error:', e);
    }
  }

  /* ============================================================
     Boot
     ============================================================ */
  async function boot() {
    var sessionRes;
    try {
      sessionRes = await withTimeout(sb.auth.getSession(), 3000, 'session');
    } catch(e) {
      console.error('[Sync] ❌ Session timeout');
      return;
    }

    if (!sessionRes || !sessionRes.data || !sessionRes.data.session) {
      console.log('[Sync] ⚠️ کاربر لاگین نیست');
      return;
    }

    currentUserId = sessionRes.data.session.user.id;
    console.log('[Sync] 👤 کاربر:', sessionRes.data.session.user.email);

    var seenOnboarding = origGetItem(ONBOARDING_KEY);
    if (seenOnboarding !== 'seen') {
      console.log('[Sync] 🎉 کاربر جدید — نمایش راهنما');
      redirected = true;
      window.location.replace('welcome.html');
      return;
    }

    await doSync();
  }

  /* ============================================================
     شروع
     ============================================================ */
  var bootPromise = boot();

  var timeoutPromise = new Promise(function(resolve) {
    setTimeout(function() {
      console.log('[Sync] ⏱️ Boot timeout — لود app.js با دیتای موجود');
      resolve();
    }, 5000);
  });

  Promise.race([bootPromise, timeoutPromise])
    .catch(function(e) {
      if (!redirected) console.error('[Sync] ❌ Boot error:', e);
    })
    .finally(function() {
      if (redirected) return;
      bootCompleted = true;
      loadApp();
    });

  /* ============ Auth changes ============ */
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
      var res = await sb.from('trades').select('data').eq('user_id', currentUserId);
      if (res.data) {
        var trades = res.data.map(function(r){ return r.data; });
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
    hideLoader: forceHideLoader,
    status: function() {
      return {
        userId: currentUserId,
        bootCompleted: bootCompleted,
        pendingDeletes: getDeletedIds().size,
        isPushing: isPushing
      };
    }
  };

})();
