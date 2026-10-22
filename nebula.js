/* PO-TRADE Nebula navigation, privacy visibility preferences, and future module surfaces. */
(function () {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const PRIVACY_KEY = 'po.v4.privacy';
  const privacyDefaults = { showUsername: false, showEmail: false, showPnL: false, showWinRate: false, showTradeSummary: false, showCapital: false, publicOptIn: false };
  const dock = $('#tabs');
  if (!dock) return;

  function language() { return String(document.documentElement.lang || 'fa').slice(0, 2) === 'en' ? 'en' : 'fa'; }
  function readJSON(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v && typeof v === 'object' ? v : fallback; }
    catch (_) { return fallback; }
  }
  function translateLocal() {
    const en = language() === 'en';
    $$('[data-fa][data-en]').forEach(node => {
      const value = node.getAttribute(en ? 'data-en' : 'data-fa');
      if (value != null && node.textContent !== value) node.textContent = value;
    });
    $$('[data-fa-ph][data-en-ph]').forEach(node => {
      node.placeholder = node.getAttribute(en ? 'data-en-ph' : 'data-fa-ph') || '';
    });
    const copyClose = $('.nebula-panel-close');
    if (copyClose) copyClose.setAttribute('aria-label', en ? 'Close menu' : 'بستن منو');
    const userBtn = $('#userBtn');
    if (userBtn) userBtn.setAttribute('aria-label', en ? 'User account' : 'حساب کاربری');
  }

  const panels = { trades: $('#dockTradesPanel'), account: $('#dockAccountPanel') };
  const toggles = { trades: $('#dockTradesToggle'), account: $('#dockAccountToggle') };
  let activeSurface = 'trades';
  function closePanels() {
    Object.keys(panels).forEach(name => {
      const panel = panels[name], toggle = toggles[name];
      if (panel) panel.hidden = true;
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
    dock.classList.remove('menu-open');
  }
  function openPanel(name) {
    const target = panels[name];
    if (!target) return;
    const shouldOpen = target.hidden;
    closePanels();
    if (shouldOpen) {
      target.hidden = false;
      if (toggles[name]) toggles[name].setAttribute('aria-expanded', 'true');
      dock.classList.add('menu-open');
      activeSurface = name === 'account' ? 'account' : 'trades';
      setDockActive(activeSurface);
    }
  }
  function setDockActive(key) {
    ['trades', 'trade', 'copytrade', 'charts', 'ai', 'account'].forEach(name => {
      const btn = name === 'trades' ? toggles.trades : name === 'account' ? toggles.account : $('[data-dock-surface="' + name + '"]');
      if (btn) btn.classList.toggle('active', name === key);
    });
    activeSurface = key;
  }
  function setDockForView(view) {
    closePanels();
    $$('#page-copytrade, #page-livecharts, #page-trade-terminal, #page-ai-coach').forEach(page => page.classList.remove('active'));
    if (view === 'settings' || view === 'profile') setDockActive('account');
    else setDockActive('trades');
  }
  function showFutureSurface(which) {
    closePanels();
    const surfacePages = { trade: 'page-trade-terminal', copytrade: 'page-copytrade', charts: 'page-livecharts', ai: 'page-ai-coach' };
    const id = surfacePages[which];
    if (!id) return;
    $$('.page').forEach(page => page.classList.toggle('active', page.id === id));
    $$('.tab', dock).forEach(tab => tab.classList.remove('active'));
    setDockActive(which);
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  dock.addEventListener('click', event => {
    const close = event.target.closest('[data-dock-close]');
    if (close) { closePanels(); return; }
    const route = event.target.closest('.tab[data-view]');
    if (route) {
      const view = route.dataset.view;
      closePanels();
      $$('#page-copytrade, #page-livecharts, #page-trade-terminal, #page-ai-coach').forEach(page => page.classList.remove('active'));
      setDockForView(view);
      // Reapply active nav state after the original app's delegated router runs.
      requestAnimationFrame(() => setDockForView(view));
      return;
    }
    const toggle = event.target.closest('[data-dock-toggle]');
    if (toggle) { event.preventDefault(); openPanel(toggle.dataset.dockToggle); return; }
    const surface = event.target.closest('[data-dock-surface]');
    if (surface) { event.preventDefault(); showFutureSurface(surface.dataset.dockSurface); }
  });

  // Other in-page actions (profile shortcuts, hero actions, command palette) use this shared route signal.
  document.addEventListener('click', event => {
    const route = event.target.closest('[data-go-view]');
    if (route) {
      const view = route.dataset.goView;
      closePanels();
      $$('#page-copytrade, #page-livecharts, #page-trade-terminal, #page-ai-coach').forEach(page => page.classList.remove('active'));
      setDockForView(view);
      requestAnimationFrame(() => setDockForView(view));
    }
    if (!dock.contains(event.target) && !event.target.closest('#userDropdown')) closePanels();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closePanels(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 760) closePanels(); }, { passive: true });

  // Privacy defaults are private. Personal report exports deliberately use a separate, image-only capital toggle.
  const privacyInputs = {
    showUsername: $('#pt-privacy-username'),
    showEmail: $('#pt-privacy-email'),
    showPnL: $('#pt-privacy-pnl'),
    showWinRate: $('#pt-privacy-winrate'),
    showTradeSummary: $('#pt-privacy-summary'),
    showCapital: $('#pt-privacy-capital'),
    publicOptIn: $('#pt-privacy-public')
  };
  const status = $('#pt-privacy-status');
  const leaderboardHost = $('#pt-leaderboard-list');
  const leaderboardStatus = $('#pt-leaderboard-status');
  const leaderboardCurrency = $('#pt-leaderboard-currency');
  const SUPABASE_TABLE_HINT = 'Run PO-TRADE-SERVER-SETUP.sql once in Supabase SQL Editor.';
  function currentPrivacy() {
    const fromStore = readJSON(PRIVACY_KEY, {});
    return Object.assign({}, privacyDefaults, fromStore);
  }
  function loadPrivacy() {
    const prefs = currentPrivacy();
    Object.keys(privacyInputs).forEach(key => { if (privacyInputs[key]) privacyInputs[key].checked = prefs[key] === true; });
  }
  function localizeMessage(fa, en) { return language() === 'en' ? en : fa; }
  function setStatus(node, text, state) {
    if (!node) return;
    node.textContent = text;
    if (state) node.dataset.state = state; else delete node.dataset.state;
  }
  async function savePrivacy() {
    const prefs = {};
    Object.keys(privacyInputs).forEach(key => { prefs[key] = !!(privacyInputs[key] && privacyInputs[key].checked); });
    try {
      localStorage.setItem(PRIVACY_KEY, JSON.stringify(prefs));
    } catch (_) {
      setStatus(status, localizeMessage('ذخیره روی این دستگاه انجام نشد.', 'Could not save on this device.'), 'warning');
      return;
    }
    const sb = window.__PT_SB;
    let serverSaved = false;
    if (sb && window.PT_USER && window.PT_USER.uid) {
      try {
        const uid = window.PT_USER.uid;
        const prior = await sb.from('po_trade_profiles').select('username,username_norm').eq('user_id', uid).maybeSingle();
        const existingName = prior && prior.data ? prior.data.username : null;
        const username = (window.PT_USER.username || existingName || '').trim() || null;
        const usernameNorm = username ? username.toLowerCase() : (prior && prior.data ? prior.data.username_norm : null);
        const payload = {
          user_id: uid, username, username_norm: usernameNorm,
          show_username: prefs.showUsername === true,
          show_email: prefs.showEmail === true,
          show_pnl: prefs.showPnL === true,
          show_win_rate: prefs.showWinRate === true,
          show_trade_summary: prefs.showTradeSummary === true,
          show_capital: prefs.showCapital === true,
          public_opt_in: prefs.publicOptIn === true,
          updated_at: new Date().toISOString()
        };
        const saved = await sb.from('po_trade_profiles').upsert(payload, { onConflict: 'user_id' });
        if (saved.error) throw saved.error;
        serverSaved = true;
      } catch (err) {
        console.warn('[privacy] server save failed', err && err.message ? err.message : err);
      }
    }
    if (status) {
      const text = serverSaved
        ? localizeMessage('تنظیمات روی دستگاه و سرور ذخیره شد ✓', 'Privacy saved on this device and server ✓')
        : localizeMessage('روی دستگاه ذخیره شد؛ برای همگام‌سازی عمومی، SQL سرور و اتصال حساب را بررسی کن.', 'Saved locally; check the server SQL and sign-in to sync social visibility.');
      setStatus(status, text, serverSaved ? 'success' : 'warning');
    }
    window.dispatchEvent(new CustomEvent('po:privacy-updated', { detail: prefs }));
    refreshLeaderboard();
  }
  async function loadServerPrivacy() {
    const sb = window.__PT_SB;
    if (!sb || !window.PT_USER || !window.PT_USER.uid) return;
    try {
      const result = await sb.from('po_trade_profiles')
        .select('public_opt_in,show_username,show_email,show_pnl,show_win_rate,show_trade_summary,show_capital')
        .eq('user_id', window.PT_USER.uid).maybeSingle();
      if (result.error || !result.data) return;
      const row = result.data;
      const prefs = {
        showUsername: row.show_username === true,
        showEmail: row.show_email === true,
        showPnL: row.show_pnl === true,
        showWinRate: row.show_win_rate === true,
        showTradeSummary: row.show_trade_summary === true,
        showCapital: row.show_capital === true,
        publicOptIn: row.public_opt_in === true
      };
      localStorage.setItem(PRIVACY_KEY, JSON.stringify(prefs));
      loadPrivacy();
    } catch (err) { console.warn('[privacy] could not load profile settings', err && err.message ? err.message : err); }
  }
  Object.keys(privacyInputs).forEach(key => {
    const input = privacyInputs[key];
    if (!input) return;
    input.addEventListener('change', () => {
      setStatus(status, localizeMessage('تغییرات ذخیره‌نشده', 'Unsaved changes'), '');
      if (key === 'publicOptIn' && input.checked) {
        setStatus(status, localizeMessage('با فعال‌کردن رتبه‌بندی، فقط اطلاعاتی منتشر می‌شود که جداگانه اجازه داده‌ای.', 'Leaderboard opt-in only shares fields you separately allow.'), '');
      }
    });
  });
  $('#pt-privacy-save')?.addEventListener('click', savePrivacy);

  function currencyCode() {
    const allowed = ['USD','EUR','GBP','AED','IRR'];
    const portfolio = readJSON('po.v4.portfolio', {});
    const choice = leaderboardCurrency && leaderboardCurrency.value ? leaderboardCurrency.value : portfolio.currency || 'USD';
    return allowed.includes(choice) ? choice : 'USD';
  }
  function moneyForLeaderboard(value, currency) {
    const n = Number(value) || 0;
    const locale = language() === 'en' ? 'en-US' : 'fa-IR';
    try { return new Intl.NumberFormat(locale, { style:'currency', currency, maximumFractionDigits: currency === 'IRR' ? 0 : 2 }).format(n); }
    catch (_) { return n.toLocaleString(locale) + ' ' + currency; }
  }
  function renderLeaderboardEmpty(message, enMessage) {
    if (!leaderboardHost) return;
    const box = document.createElement('div'); box.className = 'nebula-empty-ranking';
    const icon = document.createElement('span'); icon.className = 'nebula-ranking-orb'; icon.textContent = '✦';
    const strong = document.createElement('strong'); strong.textContent = localizeMessage(message, enMessage);
    const p = document.createElement('p'); p.textContent = localizeMessage('هیچ پروفایل واجد شرایط و رضایت‌داده‌ای برای این ارز پایه در این هفته پیدا نشد.', 'No opted-in trader is eligible for this base currency this week.');
    box.append(icon, strong, p); leaderboardHost.replaceChildren(box);
  }
  function renderLeaderboard(rows, currency) {
    if (!leaderboardHost) return;
    if (!Array.isArray(rows) || !rows.length) {
      renderLeaderboardEmpty('هنوز معامله‌گر عمومی‌ای برای این هفته وجود ندارد', 'No public traders this week');
      return;
    }
    const fragment = document.createDocumentFragment();
    rows.forEach((row, i) => {
      const card = document.createElement('article'); card.className = 'nebula-leaderboard-row';
      const rank = document.createElement('span'); rank.className = 'nebula-leaderboard-rank'; rank.textContent = String(row.rank_position || i + 1).padStart(2, '0');
      const body = document.createElement('div'); body.className = 'nebula-leaderboard-person';
      const name = document.createElement('strong'); name.textContent = row.display_name || ('Trader ' + String(i + 1).padStart(2, '0'));
      const detail = document.createElement('small');
      const details = [];
      if (row.display_email) details.push(String(row.display_email));
      if (row.trade_count != null) details.push((language() === 'en' ? 'Trades ' : 'معامله ') + String(row.trade_count));
      if (row.win_rate != null) details.push((language() === 'en' ? 'Win ' : 'برد ') + Number(row.win_rate).toFixed(1) + '%');
      detail.textContent = details.join(' · ') || localizeMessage('اطلاعات عمومی محدود', 'Limited public details');
      body.append(name, detail);
      const pnl = document.createElement('strong'); pnl.className = 'nebula-leaderboard-pnl'; pnl.textContent = moneyForLeaderboard(row.weekly_pnl, currency); pnl.dir = 'ltr';
      card.append(rank, body, pnl); fragment.append(card);
    });
    leaderboardHost.replaceChildren(fragment);
  }
  let leaderboardBusy = false;
  async function refreshLeaderboard() {
    if (!leaderboardHost || leaderboardBusy) return;
    const sb = window.__PT_SB;
    const currency = currencyCode();
    if (leaderboardCurrency && leaderboardCurrency.value !== currency) leaderboardCurrency.value = currency;
    if (!sb || !window.PT_USER || !window.PT_USER.uid) {
      renderLeaderboardEmpty('برای دریافت رتبه‌بندی وارد حساب شو', 'Sign in to load the leaderboard');
      return;
    }
    leaderboardBusy = true;
    setStatus(leaderboardStatus, localizeMessage('در حال دریافت رتبه‌بندی واقعی…', 'Loading verified rankings…'), '');
    try {
      const res = await sb.rpc('po_trade_weekly_leaderboard', { limit_count: 10, currency_code: currency });
      if (res.error) {
        console.warn('[leaderboard] server query failed', res.error.message);
        renderLeaderboardEmpty('رتبه‌بندی سرور هنوز آماده نیست', 'Leaderboard server setup is not ready');
        setStatus(leaderboardStatus, localizeMessage('فایل PO-TRADE-SERVER-SETUP.sql را در SQL Editor اجرا کن.', 'Run PO-TRADE-SERVER-SETUP.sql in Supabase SQL Editor.'), 'warning');
        return;
      }
      renderLeaderboard(res.data || [], currency);
      setStatus(leaderboardStatus, localizeMessage('رتبه‌بندی بر اساس PnL همین هفته و ارز پایه انتخابی است؛ فقط افراد رضایت‌داده نمایش داده می‌شوند.', 'Ranked by this week’s P/L in the selected base currency; only opted-in profiles are shown.'), 'success');
    } catch (err) {
      renderLeaderboardEmpty('اتصال رتبه‌بندی برقرار نشد', 'Could not connect to leaderboard');
      setStatus(leaderboardStatus, localizeMessage('اتصال اینترنت یا تنظیمات سرور را بررسی کن.', 'Check the network and server configuration.'), 'warning');
    } finally { leaderboardBusy = false; }
  }
  $('#pt-leaderboard-refresh')?.addEventListener('click', refreshLeaderboard);
  leaderboardCurrency?.addEventListener('change', refreshLeaderboard);
  window.addEventListener('pt:account-ready', () => { loadServerPrivacy(); refreshLeaderboard(); });
  window.addEventListener('po:sync-ready', () => { refreshLeaderboard(); });
  loadPrivacy();
  // Existing local preferences are visible immediately; remote profile preferences update after auth resolves.
  if (window.PT_ACCOUNT_READY) { loadServerPrivacy(); refreshLeaderboard(); }

  const langObserver = new MutationObserver(() => translateLocal());
  langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
  translateLocal();
  loadPrivacy();
  setDockActive('trades');

  window.PTNebula = {
    openPanel, closePanels, showFutureSurface, setDockForView,
    getPrivacy: currentPrivacy,
    savePrivacy,
    refreshLeaderboard,
    refreshLanguage: translateLocal
  };
})();
