/* PO alarm system v2 — customizable, synced per account via sync.js (key: po.v4.alerts). No libs, no network. */
(function () {
  'use strict';
  var KEY = 'po.v4.alerts', TK = 'po.v4.trades', FK = 'po.alerts.v1';
  var DEF = { on: true, goal: true, prop: true, dailyLoss: true, maxDD: true, sound: true, vibrate: true, confetti: true, warnPct: 80, dailyProfit: 0, maxTrades: 0, lossStreak: 0 };
  var BOOLS = ['on', 'goal', 'prop', 'dailyLoss', 'maxDD', 'sound', 'vibrate', 'confetti'], NUMS = ['dailyProfit', 'maxTrades', 'lossStreak'];
  var queue = [], open = false;
  var fa = function () { return String(document.documentElement.lang || 'fa').slice(0, 2) !== 'en'; };
  var T = {
    goal: { k: 'win',  i: '🏆', fa: ['هدفت رسید! 🎉', 'به هدف این دوره رسیدی. عالی بود، حالا ریسک رو حفظ کن.'], en: ['Goal reached! 🎉', 'You hit this period\u2019s goal. Protect your gains.'] },
    prop: { k: 'win',  i: '👑', fa: ['هدف سود پراپ کامل شد!', 'به هدف سود حساب پراپ رسیدی. افسانه‌ای بودی!'], en: ['Prop profit target hit!', 'You reached the prop account target. Legendary!'] },
    dp:   { k: 'win',  i: '💰', fa: ['هدف سود امروز رسید!', 'به هدف سود روزانه‌ای که گذاشتی رسیدی. می‌تونی امروز رو ببندی.'], en: ['Daily profit goal hit!', 'You reached your daily profit goal. Consider closing the day.'] },
    dw:   { k: 'warn', i: '⚠️', fa: ['هشدار ضرر روزانه', 'از حد ضرر روزانه‌ات به آستانه‌ی هشدار رسیدی. فعلاً معامله نکن.'], en: ['Daily loss warning', 'You hit your daily loss warning level. Pause trading.'] },
    db:   { k: 'bad',  i: '🚨', fa: ['حد ضرر روزانه شکست!', 'به حد ضرر روزانه رسیدی. همین الان معامله رو متوقف کن!'], en: ['Daily loss limit breached!', 'Daily loss limit reached. Stop trading right now!'] },
    ddw:  { k: 'warn', i: '⚠️', fa: ['هشدار افت کل حساب', 'به آستانه‌ی هشدار حداکثر افت مجاز رسیدی. مراقب باش.'], en: ['Max drawdown warning', 'You hit the max drawdown warning level. Be careful.'] },
    ddb:  { k: 'bad',  i: '🚨', fa: ['حداکثر افت شکست!', 'به حداکثر افت مجاز رسیدی. حساب در خطره!'], en: ['Max drawdown breached!', 'Max drawdown reached. Your account is at risk!'] },
    mt:   { k: 'warn', i: '✋', fa: ['سقف تعداد معامله رسید', 'به حداکثر تعداد معامله‌ی امروز رسیدی. دیگه وارد معامله نشو.'], en: ['Trade limit reached', 'You reached today\u2019s max number of trades. Stand down.'] },
    ls:   { k: 'bad',  i: '🛑', fa: ['ضرر پشت سر هم!', 'به تعداد ضررهای متوالی که تعیین کردی رسیدی. استراحت کن، انتقامی معامله نکن.'], en: ['Losing streak!', 'You hit your consecutive-loss limit. Take a break, no revenge trades.'] }
  };
  var ORDER = { db: 0, ddb: 0, ls: 0, dw: 1, ddw: 1, mt: 1, goal: 2, prop: 2, dp: 2 };

  /* ---------- config (validated: never trust stored/synced data) ---------- */
  function cfg() {
    var o = null; try { o = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!o || typeof o !== 'object') o = {};
    var c = {};
    BOOLS.forEach(function (k) { c[k] = typeof o[k] === 'boolean' ? o[k] : DEF[k]; });
    NUMS.forEach(function (k) { var n = Number(o[k]); c[k] = isFinite(n) && n >= 0 ? Math.min(n, 1e9) : DEF[k]; });
    var w = Number(o.warnPct); c.warnPct = isFinite(w) ? Math.max(50, Math.min(95, Math.round(w))) : DEF.warnPct;
    c.maxTrades = Math.round(c.maxTrades); c.lossStreak = Math.round(c.lossStreak);
    return c;
  }
  function trades() { try { var a = JSON.parse(localStorage.getItem(TK)); return Array.isArray(a) ? a.filter(function (t) { return t && typeof t.date === 'string'; }) : []; } catch (e) { return []; } }
  function today() { var n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); }
  function dayStats(list, td) {
    var p = 0, n = 0, streak = 0, a = list.slice().sort(function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : 0; });
    a.forEach(function (t) {
      var v = Math.abs(Number(t.amount) || 0), x = t.result === 'win' ? v : t.result === 'loss' ? -v : 0;
      if (t.date === td) { p += x; n++; }
      if (t.result === 'loss') streak++; else if (t.result === 'win') streak = 0;
    });
    return { pnl: p, n: n, streak: streak };
  }
  /* pure: which alarms apply right now? */
  function evaluate(g, r, c, ds, td) {
    var ev = [];
    if (!c.on) return ev;
    if (c.goal && g && g.progress >= 100) ev.push({ t: 'goal', key: 'goal:' + g.period + g.startISO + g.metric + g.target });
    if (r) {
      if (c.prop && r.target && r.target.progress >= 100) ev.push({ t: 'prop', key: 'prop:' + r.target.target });
      if (c.dailyLoss && r.dailyLoss) {
        if (r.dailyLoss.usage >= 100) ev.push({ t: 'db', key: 'db:' + td + r.dailyLoss.limit });
        else if (r.dailyLoss.usage >= c.warnPct) ev.push({ t: 'dw', key: 'dw:' + td + r.dailyLoss.limit + ':' + c.warnPct });
      }
      if (c.maxDD && r.maxDD) {
        if (r.maxDD.usage >= 100) ev.push({ t: 'ddb', key: 'ddb:' + td + r.maxDD.limit });
        else if (r.maxDD.usage >= c.warnPct) ev.push({ t: 'ddw', key: 'ddw:' + td + r.maxDD.limit + ':' + c.warnPct });
      }
    }
    if (c.dailyProfit > 0 && ds.pnl >= c.dailyProfit) ev.push({ t: 'dp', key: 'dp:' + td + c.dailyProfit });
    if (c.maxTrades > 0 && ds.n >= c.maxTrades) ev.push({ t: 'mt', key: 'mt:' + td + c.maxTrades });
    if (c.lossStreak > 0 && ds.streak >= c.lossStreak) ev.push({ t: 'ls', key: 'ls:' + td + c.lossStreak + ':' + ds.streak });
    return ev;
  }

  /* ---------- effects ---------- */
  var ctx;
  function beep(kind) {
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = ctx || new AC(); if (ctx.state === 'suspended') ctx.resume();
      var seq = kind === 'win' ? [523, 659, 784, 1046] : kind === 'warn' ? [440, 440] : [880, 660, 880, 660, 880, 660];
      seq.forEach(function (f, n) {
        var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + n * 0.18;
        o.type = kind === 'win' ? 'sine' : 'square'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.18);
      });
    } catch (e) {}
  }
  function confetti() {
    try {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var c = document.createElement('canvas'); c.id = 'po-confetti'; document.body.appendChild(c);
      var x = c.getContext('2d'), w = c.width = innerWidth, h = c.height = innerHeight, cols = ['#2ee6a6', '#5b8cff', '#ffb020', '#ff5674', '#fff'];
      var p = []; for (var i = 0; i < 110; i++) p.push({ x: Math.random() * w, y: -20 - Math.random() * h * 0.5, s: 4 + Math.random() * 6, v: 2 + Math.random() * 4, a: Math.random() * 6, r: Math.random() * 0.2 - 0.1, c: cols[i % 5] });
      var t0 = Date.now();
      (function f() {
        x.clearRect(0, 0, w, h);
        p.forEach(function (q) { q.y += q.v; q.a += q.r; q.x += Math.sin(q.a) * 1.5; x.save(); x.translate(q.x, q.y); x.rotate(q.a); x.fillStyle = q.c; x.fillRect(-q.s / 2, -q.s / 2, q.s, q.s * 0.6); x.restore(); });
        if (Date.now() - t0 < 3800) requestAnimationFrame(f); else c.remove();
      })();
    } catch (e) {}
  }
  function show(ev) {
    var d = T[ev.t], L = fa() ? d.fa : d.en, c = cfg(), box = document.createElement('div');
    box.id = 'po-alarm'; box.className = d.k; box.setAttribute('role', 'alertdialog'); box.setAttribute('aria-modal', 'true');
    var card = document.createElement('div'); card.className = 'al-card';
    var ic = document.createElement('div'); ic.className = 'al-ico'; ic.textContent = d.i;
    var h = document.createElement('h3'); h.textContent = L[0];
    var p = document.createElement('p'); p.textContent = L[1];
    var b = document.createElement('button'); b.type = 'button'; b.textContent = fa() ? 'باشه، فهمیدم' : 'Got it';
    b.onclick = function () { box.remove(); open = false; try { if (navigator.vibrate) navigator.vibrate(0); } catch (e) {} next(); };
    card.appendChild(ic); card.appendChild(h); card.appendChild(p); card.appendChild(b); box.appendChild(card);
    document.body.appendChild(box); open = true;
    if (c.sound) beep(d.k);
    if (c.vibrate) try { if (navigator.vibrate) navigator.vibrate(d.k === 'bad' ? [300, 120, 300, 120, 600] : d.k === 'warn' ? [200, 100, 200] : [80, 60, 80, 60, 200]); } catch (e) {}
    if (d.k === 'win' && c.confetti) confetti();
  }
  function next() { if (!open && queue.length) show(queue.shift()); }
  function load() { try { return JSON.parse(localStorage.getItem(FK)) || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(FK, JSON.stringify(o)); } catch (e) {} }

  function check(g, r) {
    try {
      var c = cfg(), td = today(), s = load(), evs = evaluate(g, r, c, dayStats(trades(), td), td);
      evs.forEach(function (e) { if (!s[e.key]) { s[e.key] = Date.now(); queue.push(e); } });
      var ks = Object.keys(s); if (ks.length > 200) ks.sort(function (a, b) { return s[a] - s[b]; }).slice(0, ks.length - 200).forEach(function (k) { delete s[k]; });
      save(s); queue.sort(function (a, b) { return ORDER[a.t] - ORDER[b.t]; }); next();
    } catch (e) {}
  }

  /* ---------- Settings card ---------- */
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  var inputs = {};
  function row(label, input, hint) { var r = el('div', 'al-row'), l = el('label', null, label); r.appendChild(l); r.appendChild(input); if (hint) r.appendChild(el('small', 'al-hint', hint)); return r; }
  function toggle(key) { var i = el('input'); i.type = 'checkbox'; i.className = 'al-sw'; inputs[key] = i; return i; }
  function num(key, max) { var i = el('input'); i.type = 'number'; i.inputMode = 'decimal'; i.min = '0'; i.max = String(max || 1000000000); i.step = 'any'; i.placeholder = '0'; inputs[key] = i; return i; }
  function fill() { var c = cfg(); BOOLS.forEach(function (k) { if (inputs[k]) inputs[k].checked = c[k]; }); NUMS.forEach(function (k) { if (inputs[k]) inputs[k].value = c[k] ? String(c[k]) : ''; }); if (inputs.warnPct) { inputs.warnPct.value = String(c.warnPct); var o = document.getElementById('al-warn-out'); if (o) o.textContent = c.warnPct + '%'; } }
  function build() {
    var host = document.getElementById('page-settings'); if (!host || document.getElementById('po-alert-settings')) return;
    var F = fa(), card = el('div', 'card'); card.id = 'po-alert-settings';
    var head = el('div', 'card-head'); head.appendChild(el('h2', null, F ? '🔔 آلارم‌ها و هشدارها' : '🔔 Alarms & alerts')); head.appendChild(el('span', 'muted', F ? 'روی حساب ایمیلت ذخیره می‌شه' : 'Saved to your account'));
    card.appendChild(head);
    var g = el('div', 'al-grid');
    g.appendChild(row(F ? 'فعال بودن همه‌ی آلارم‌ها' : 'Enable all alarms', toggle('on')));
    g.appendChild(row(F ? '🏆 رسیدن به هدف' : '🏆 Goal reached', toggle('goal')));
    g.appendChild(row(F ? '👑 هدف سود پراپ' : '👑 Prop profit target', toggle('prop')));
    g.appendChild(row(F ? '💥 ضرر روزانه' : '💥 Daily loss', toggle('dailyLoss')));
    g.appendChild(row(F ? '📉 حداکثر افت' : '📉 Max drawdown', toggle('maxDD')));
    g.appendChild(row(F ? '🔊 صدا' : '🔊 Sound', toggle('sound')));
    g.appendChild(row(F ? '📳 ویبره' : '📳 Vibration', toggle('vibrate')));
    g.appendChild(row(F ? '🎊 کانفتی' : '🎊 Confetti', toggle('confetti')));
    card.appendChild(g);
    var w = el('input'); w.type = 'range'; w.min = '50'; w.max = '95'; w.step = '5'; inputs.warnPct = w;
    var wo = el('output', 'al-out'); wo.id = 'al-warn-out'; w.addEventListener('input', function () { wo.textContent = w.value + '%'; });
    var wr = row(F ? '⚠️ هشدار زرد از چند درصد حد شروع بشه؟' : '⚠️ Warn when this % of the limit is used', w); wr.appendChild(wo); card.appendChild(wr);
    var c2 = el('div', 'al-grid');
    c2.appendChild(row(F ? '💰 هدف سود روزانه ($) — ۰ یعنی خاموش' : '💰 Daily profit goal ($) — 0 = off', num('dailyProfit')));
    c2.appendChild(row(F ? '✋ سقف تعداد معامله در روز — ۰ یعنی خاموش' : '✋ Max trades per day — 0 = off', num('maxTrades', 1000)));
    c2.appendChild(row(F ? '🛑 هشدار ضرر متوالی (تعداد) — ۰ یعنی خاموش' : '🛑 Consecutive-loss alarm — 0 = off', num('lossStreak', 100)));
    card.appendChild(c2);
    var act = el('div', 'form-actions'), sv = el('button', 'btn primary', F ? '💾 ذخیره آلارم‌ها' : '💾 Save alarms'), msg = el('span', 'msg');
    sv.type = 'button';
    sv.addEventListener('click', function () {
      var o = {}; BOOLS.forEach(function (k) { o[k] = !!inputs[k].checked; }); NUMS.forEach(function (k) { o[k] = Number(inputs[k].value) || 0; }); o.warnPct = Number(inputs.warnPct.value);
      try { localStorage.setItem(KEY, JSON.stringify(o)); msg.textContent = F ? '✅ ذخیره شد و روی سرور سینک می‌شه' : '✅ Saved and syncing to your account'; } catch (e) { msg.textContent = F ? '❌ ذخیره نشد' : '❌ Could not save'; }
      fill(); setTimeout(function () { msg.textContent = ''; }, 3500);
    });
    act.appendChild(sv); act.appendChild(msg); card.appendChild(act);
    var tr = el('div', 'al-test'); tr.appendChild(el('span', 'muted', F ? 'تست آلارم:' : 'Test alarm:'));
    [['dp', F ? 'جشن' : 'Win'], ['dw', F ? 'هشدار' : 'Warn'], ['db', F ? 'خطر' : 'Danger']].forEach(function (x) { var b = el('button', 'btn ghost sm', x[1]); b.type = 'button'; b.addEventListener('click', function () { queue.push({ t: x[0] }); next(); }); tr.appendChild(b); });
    card.appendChild(tr); host.appendChild(card); fill();
  }
  function init() {
    build();
    var p = document.getElementById('page-settings');
    if (p && window.MutationObserver) new MutationObserver(function () { if (p.classList.contains('active')) { build(); fill(); } }).observe(p, { attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.POAlerts = { check: check, _t: { cfg: cfg, evaluate: evaluate, dayStats: dayStats } };
})();
