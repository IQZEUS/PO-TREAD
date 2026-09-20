/* ============================================================
   PO-TRADE Sync — Supabase Trades Sync
   بین همه دستگاه‌ها معاملات رو همگام می‌کنه
   ============================================================ */
(function() {
  'use strict';

  const SUPABASE_URL = 'https://rodguhcuatixdbzwjfvy.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGd1aGN1YXRpeGRiendqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTgyMTMsImV4cCI6MjEwNTQ5NDIxM30.oXGyCA3jOcsS5inqsXuSOhELZLoUG7pYagZox1SEmhY';
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const TRADES_KEY = 'po.v4.trades';
  const origSetItem = localStorage.setItem.bind(localStorage);
  let currentUserId = null;
  let skipNext = false;
  let pushTimer = null;

  // ============ Override localStorage.setItem ============
  localStorage.setItem = function(key, value) {
    origSetItem(key, value);
    if (key === TRADES_KEY && !skipNext && currentUserId) {
      clearTimeout(pushTimer);
      pushTimer = setTimeout(() => {
        pushTrades(value, currentUserId);
      }, 800);
    }
    skipNext = false;
  };

  // ============ Push به Supabase ============
  async function pushTrades(jsonStr, userId) {
    try {
      const trades = JSON.parse(jsonStr);
      if (!Array.isArray(trades)) return;

      const { data: existing, error: fetchErr } = await sb
        .from('trades')
        .select('trade_id')
        .eq('user_id', userId);
      if (fetchErr) throw fetchErr;

      const existingIds = new Set((existing || []).map(r => r.trade_id));
      const localIds = new Set(trades.map(t => t.id));

      // درج جدیدها
      const toInsert = trades
        .filter(t => !existingIds.has(t.id))
        .map(t => ({ user_id: userId, trade_id: t.id, data: t }));

      if (toInsert.length > 0) {
        const { error } = await sb.from('trades').insert(toInsert);
        if (error) throw error;
      }

      // حذف‌شده‌ها
      const toDelete = [...existingIds].filter(id => !localIds.has(id));
      if (toDelete.length > 0) {
        const { error } = await sb
          .from('trades')
          .delete()
          .eq('user_id', userId)
          .in('trade_id', toDelete);
        if (error) throw error;
      }

      // آپدیت موجودها
      const toUpdate = trades.filter(t => existingIds.has(t.id));
      for (const t of toUpdate) {
        await sb
          .from('trades')
          .update({ data: t, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('trade_id', t.id);
      }

      console.log('[Sync] ✅ پوش شد:', trades.length, 'معامله');
    } catch (e) {
      console.error('[Sync] ❌ خطای پوش:', e);
    }
  }

  // ============ بارگذاری و merge ============
  async function boot() {
    try {
      const { data: { session } } = await sb.auth.getSession();

      if (session) {
        currentUserId = session.user.id;

        // از Supabase بخون
        const { data: remoteData, error } = await sb
          .from('trades')
          .select('data')
          .eq('user_id', currentUserId);

        if (error) console.error('[Sync] خطای لود:', error);

        const remoteTrades = (remoteData || []).map(r => r.data);

        // از localStorage بخون
        const localRaw = localStorage.getItem(TRADES_KEY);
        let localTrades = [];
        try { localTrades = JSON.parse(localRaw || '[]'); } catch(e){}

        // Merge بر اساس id (local اولویت داره)
        const map = new Map();
        remoteTrades.forEach(t => { if (t && t.id) map.set(t.id, t); });
        localTrades.forEach(t => { if (t && t.id) map.set(t.id, t); });

        const merged = Array.from(map.values());
        merged.sort((a,b) => (a.createdAt||0) - (b.createdAt||0));

        // ذخیره در localStorage بدون trigger
        skipNext = true;
        origSetItem(TRADES_KEY, JSON.stringify(merged));

        // اگه تفاوت داره → پوش کن
        if (merged.length > 0 && 
            (merged.length !== remoteTrades.length || localTrades.length > 0)) {
          setTimeout(() => {
            pushTrades(JSON.stringify(merged), currentUserId);
          }, 1200);
        }

        console.log('[Sync] 📦 لود شد:', remoteTrades.length, '| محلی:', localTrades.length, '| مجموع:', merged.length);
      }
    } catch (e) {
      console.error('[Sync] خطای boot:', e);
    }

    // حالا app.js رو لود کن
    const script = document.createElement('script');
    script.src = 'app.js';
    document.body.appendChild(script);
  }

  // ============ Auth Change ============
  sb.auth.onAuthStateChange((event, session) => {
    if (session) {
      currentUserId = session.user.id;
    } else {
      currentUserId = null;
    }
  });

  // ============ API عمومی ============
  window.PT_Sync = {
    pull: async function() {
      if (!currentUserId) return;
      const { data } = await sb.from('trades').select('data').eq('user_id', currentUserId);
      if (data) {
        const trades = data.map(r => r.data);
        skipNext = true;
        origSetItem(TRADES_KEY, JSON.stringify(trades));
        location.reload();
      }
    },
    push: async function() {
      if (!currentUserId) return;
      const raw = localStorage.getItem(TRADES_KEY);
      if (raw) await pushTrades(raw, currentUserId);
    }
  };

  boot();
})();
