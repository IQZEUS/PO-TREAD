/* ============================================================
   PO-TRADE Sync — SAFE VERSION (No Auto-Delete)
   ============================================================ */
(function() {
  'use strict';

  const SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const TRADES_KEY = 'po.v4.trades';
  const DELETED_KEY = 'po.v4.deleted';
  const origSetItem = localStorage.setItem.bind(localStorage);
  let currentUserId = null;
  let skipNext = false;
  let pushTimer = null;
  let bootCompleted = false;

  function getDeletedIds() {
    try { return new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]')); }
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

  localStorage.setItem = function(key, value) {
    origSetItem(key, value);
    if (key === TRADES_KEY && !skipNext && currentUserId && bootCompleted) {
      clearTimeout(pushTimer);
      pushTimer = setTimeout(function() {
        pushTrades(value, currentUserId);
      }, 1200);
    }
    skipNext = false;
  };

  async function pushTrades(jsonStr, userId) {
    try {
      var trades = JSON.parse(jsonStr);
      if (!Array.isArray(trades)) return;

      if (trades.length === 0) {
        console.log('[Sync] ⚠️ local خالیه — push لغو شد');
        return;
      }

      var { data: existing, error: fetchErr } = await sb
        .from('trades')
        .select('trade_id')
        .eq('user_id', userId);
      if (fetchErr) throw fetchErr;

      var existingIds = new Set((existing || []).map(function(r){ return r.trade_id; }));
      var localIds = new Set(trades.map(function(t){ return t.id; }));

      var toInsert = trades
        .filter(function(t){ return !existingIds.has(t.id); })
        .map(function(t){ return { user_id: userId, trade_id: t.id, data: t }; });

      if (toInsert.length > 0) {
        var { error } = await sb.from('trades').insert(toInsert);
        if (error) throw error;
        console.log('[Sync] ➕ ' + toInsert.length + ' معامله اضافه شد');
      }

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
        console.log('[Sync] 🔄 ' + toUpdate.length + ' معامله آپدیت شد');
      }

      var deletedIds = getDeletedIds();
      var toDelete = [...deletedIds].filter(function(id){ return existingIds.has(id); });
      if (toDelete.length > 0) {
        var { error: delErr } = await sb
          .from('trades')
          .delete()
          .eq('user_id', userId)
          .in('trade_id', toDelete);
        if (delErr) throw delErr;
        console.log('[Sync] 🗑️ ' + toDelete.length + ' معامله حذف شد (به‌درخواست کاربر)');
        clearDeletedIds();
      }

      console.log('[Sync] ✅ پوش کامل — مجموع: ' + trades.length);
    } catch (e) {
      console.error('[Sync] ❌ خطای پوش:', e);
    }
  }

  function detectDeletions(newTrades, oldTrades) {
    var newIds = new Set(newTrades.map(function(t){ return t.id; }));
    oldTrades.forEach(function(t) {
      if (!newIds.has(t.id)) {
        addDeletedId(t.id);
        console.log('[Sync] 📌 معامله حذف‌شده ثبت شد:', t.id);
      }
    });
  }

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

        var localRaw = localStorage.getItem(TRADES_KEY);
        var localTrades = [];
        try { localTrades = JSON.parse(localRaw || '[]'); } catch(e){}

        if (remoteTrades.length > 0 && localTrades.length > 0) {
          detectDeletions(localTrades, remoteTrades);
        }

        var map = new Map();
        remoteTrades.forEach(function(t){ if (t && t.id) map.set(t.id, t); });
        localTrades.forEach(function(t){ if (t && t.id) map.set(t.id, t); });

        var merged = Array.from(map.values());
        merged.sort(function(a,b){ return (a.createdAt||0) - (b.createdAt||0); });

        skipNext = true;
        origSetItem(TRADES_KEY, JSON.stringify(merged));

        console.log('[Sync] 📦 لود شد — ابری:', remoteTrades.length, '| محلی:', localTrades.length, '| مجموع:', merged.length);

        bootCompleted = true;

        if (localTrades.length > 0 && merged.length !== remoteTrades.length) {
          setTimeout(function() {
            pushTrades(JSON.stringify(merged), currentUserId);
          }, 1500);
        }
      } else {
        console.log('[Sync] ⚠️ کاربر لاگین نیست');
      }
    } catch (e) {
      console.error('[Sync] خطای boot:', e);
    }

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
      var raw = localStorage.getItem(TRADES_KEY);
      if (raw) await pushTrades(raw, currentUserId);
    }
  };

  boot();
})();
