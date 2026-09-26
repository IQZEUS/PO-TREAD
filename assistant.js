/* ============================================================
   PO-TRADE Assistant v11.0 — COSMIC ULTIMATE
   🎨 عکس خروجی کیهانی
   📈 نمودار رشد
   ✅ موبایل-پرفکت
   ============================================================ */
(function() {
  'use strict';

  var $ = function(s, r) { return (r || document).querySelector(s); };
  var $$ = function(s, r) { return Array.from((r || document).querySelectorAll(s)); };

  function getLS(k, fb) {
    try {
      var v = localStorage.getItem(k);
      if (v === null) return fb;
      return JSON.parse(v);
    } catch(e) { return fb; }
  }

  function toISO(d) {
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  function money(n) {
    var v = +n || 0;
    var a = Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (v > 0) return '+$' + a;
    if (v < 0) return '-$' + a;
    return '$' + a;
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ══════════════════════════════════════════════════════
     MARKET CLOCK
     ══════════════════════════════════════════════════════ */
  var clockTick = null;
  var clockRefresh = null;

  function sessions() {
    var h = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
    function op(s, e) { return s < e ? (h >= s && h < e) : (h >= s || h < e); }
    return [
      { flag: '🇦🇺', name: 'Sydney',   hours: '22–07', open: op(22, 7) },
      { flag: '🇯🇵', name: 'Tokyo',    hours: '00–09', open: op(0, 9) },
      { flag: '🇬🇧', name: 'London',   hours: '08–17', open: op(8, 17) },
      { flag: '🇺🇸', name: 'New York', hours: '13–22', open: op(13, 22) }
    ];
  }

  function fmtUTC() {
    var d = new Date();
    return String(d.getUTCHours()).padStart(2, '0') + ':' +
           String(d.getUTCMinutes()).padStart(2, '0') + ':' +
           String(d.getUTCSeconds()).padStart(2, '0');
  }

  function clockHTML() {
    return '<div class="pt-market-clock">' +
      '<div class="pmc-head">' +
        '<div class="pmc-title">' +
          '<div class="pmc-icon">🌍</div>' +
          '<div><h3>بازارهای جهانی</h3><p>ساعت زنده معاملاتی</p></div>' +
        '</div>' +
        '<div class="pmc-time">' +
          '<div class="pmc-clock" id="pmcClock">--:--:--</div>' +
          '<div class="pmc-utc">UTC</div>' +
        '</div>' +
      '</div>' +
      '<div class="pmc-body" id="pmcBody">' +
        sessions().map(function(s) {
          return '<div class="pmc-session ' + (s.open ? 'open' : 'closed') + '">' +
            '<div class="pmc-flag">' + s.flag + '</div>' +
            '<div class="pmc-info">' +
              '<div class="pmc-name">' + s.name + '</div>' +
              '<div class="pmc-hours">' + s.hours + '</div>' +
            '</div>' +
            '<div class="pmc-status"><span class="pmc-dot"></span><span>' +
              (s.open ? 'باز' : 'بسته') + '</span></div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  function initClock() {
    document.querySelectorAll('.market-clock').forEach(function(c) { c.remove(); });
    var page = document.getElementById('page-analysis');
    if (!page) return;

    var host = document.getElementById('market-clock-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'market-clock-host';
      if (page.firstElementChild) page.insertBefore(host, page.firstElementChild);
      else page.appendChild(host);
    }
    host.innerHTML = clockHTML();

    function tick() {
      var c = document.getElementById('pmcClock');
      if (c) c.textContent = fmtUTC();
    }
    tick();
    if (clockTick) clearInterval(clockTick);
    clockTick = setInterval(tick, 1000);

    if (clockRefresh) clearInterval(clockRefresh);
    clockRefresh = setInterval(function() {
      var body = document.getElementById('pmcBody');
      if (!body) return;
      sessions().forEach(function(s, i) {
        var el = body.children[i];
        if (!el) return;
        el.classList.toggle('open', s.open);
        el.classList.toggle('closed', !s.open);
        var st = el.querySelector('.pmc-status span:last-child');
        if (st) st.textContent = s.open ? 'باز' : 'بسته';
      });
    }, 60000);
  }

  /* ══════════════════════════════════════════════════════
     TIER
     ══════════════════════════════════════════════════════ */
  function getTier(trades) {
    var now = new Date();
    var startISO = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
    var month = trades.filter(function(t) { return t.date >= startISO; });

    var net = 0, w = 0, l = 0;
    month.forEach(function(t) {
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      net += p;
      if (t.result === 'win') w++;
      else if (t.result === 'loss') l++;
    });
    var closed = w + l;
    var wr = closed ? (w / closed) * 100 : 0;

    var tiers = [
      { key: 'bronze',  min: 0,    name: 'BRONZE'  },
      { key: 'silver',  min: 1000, name: 'SILVER'  },
      { key: 'gold',    min: 2500, name: 'GOLD'    },
      { key: 'diamond', min: 5000, name: 'DIAMOND' }
    ];

    var cur = tiers[0], idx = 0;
    for (var i = tiers.length - 1; i >= 0; i--) {
      if (net >= tiers[i].min) { cur = tiers[i]; idx = i; break; }
    }

    var next = tiers[idx + 1];
    var pct = 100, label = 'به بالاترین سطح رسیدی';

    if (next) {
      pct = Math.max(0, Math.min(100, ((net - cur.min) / (next.min - cur.min)) * 100));
      label = 'تا ' + next.name + ': ' + money(next.min - net);
    }

    return {
      key: cur.key,
      name: cur.name,
      subtitle: month.length ? month.length + ' معامله این ماه' : 'هنوز معامله‌ای نیست',
      monthPnL: money(net),
      monthCount: month.length + '',
      winRate: wr.toFixed(1) + '٪',
      progressPct: pct.toFixed(0) + '٪',
      progressLabel: label,
      net: net,
      ladder: tiers.map(function(t, i) {
        return { key: t.key, name: t.name, unlocked: i <= idx, current: i === idx };
      })
    };
  }

  /* ══════════════════════════════════════════════════════
     ANALYZE
     ══════════════════════════════════════════════════════ */
  function analyze(trades) {
    if (!trades.length) return {
      icon: '🤖', title: '👋 خوش آمدی!',
      text: 'اولین معامله رو ثبت کن تا تحلیل بگیری.', badges: []
    };

    var w = 0, l = 0, net = 0, gp = 0, gl = 0;
    var byStrat = {}, maxStreak = 0, lossStreak = 0, maxLoss = 0;

    trades.slice().sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); })
    .forEach(function(t) {
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      net += p;
      if (t.result === 'win') { w++; gp += p; maxStreak++; lossStreak = 0; }
      else if (t.result === 'loss') {
        l++; gl += Math.abs(p); lossStreak++;
        if (lossStreak > maxLoss) maxLoss = lossStreak;
      }
      var s = t.strategy || '—';
      if (!byStrat[s]) byStrat[s] = { net: 0, w: 0, l: 0 };
      byStrat[s].net += p;
      if (t.result === 'win') byStrat[s].w++;
      else if (t.result === 'loss') byStrat[s].l++;
    });

    var closed = w + l;
    var wr = closed ? (w / closed) * 100 : 0;
    var pf = gl > 0 ? gp / gl : (gp > 0 ? Infinity : 0);

    var strats = Object.keys(byStrat).map(function(k) {
      return { name: k, net: byStrat[k].net };
    }).sort(function(a, b) { return b.net - a.net; });

    var best = strats[0];
    var worst = strats[strats.length - 1];
    var profit = net > 0;

    var icon, title, text;
    if (profit) {
      icon = '🏆';
      title = '🎉 عملکردت سودده بوده!';
      text = 'خالص سودت <strong>' + money(net) + '</strong>. ';
      if (best) text += 'بهترین: <em>' + best.name + '</em>. ';
      text += 'وین‌ریت <strong>' + wr.toFixed(1) + '٪</strong>.';
    } else if (net < 0) {
      icon = '🎯';
      title = '⚠️ عملکردت در ضرر بوده';
      text = 'خالص ضررت <strong>' + money(net) + '</strong>. ';
      if (worst) text += 'بیشترین ضرر: <em>' + worst.name + '</em>. ';
      if (maxLoss >= 3) text += ' <strong>' + maxLoss + ' ضرر پشت‌سرهم</strong>.';
    } else {
      icon = '📊';
      title = '📊 سربه‌سر';
      text = 'نه سود، نه ضرر.';
    }

    var badges = [];
    if (best && best.net > 0) badges.push({ label: '🏆 ' + best.name, cls: 'good' });
    if (worst && worst !== best && worst.net < 0) badges.push({ label: '📉 ' + worst.name, cls: 'bad' });
    badges.push({ label: '🎯 ' + wr.toFixed(1) + '٪', cls: wr >= 55 ? 'good' : wr < 45 ? 'bad' : 'neutral' });
    if (isFinite(pf)) badges.push({ label: '⚖️ ' + pf.toFixed(2), cls: pf >= 1.5 ? 'good' : pf < 1 ? 'bad' : 'neutral' });
    if (maxStreak >= 3) badges.push({ label: '🔥 ' + maxStreak + ' برد', cls: 'good' });

    return { icon: icon, title: title, text: text, badges: badges };
  }

  function renderAssistant() {
    var host = $('#assistant-host');
    if (!host) return;
    var trades = getLS('po.v4.trades', []);
    var a = analyze(trades);
    var tier = getTier(trades);

    host.innerHTML =
      '<div class="tier-card ' + tier.key + '">' +
        '<div class="tier-head">' +
          '<div class="tier-icon-wrap"><div class="tier-icon"></div></div>' +
          '<div class="tier-info">' +
            '<div class="tier-label">سطح فعلی</div>' +
            '<div class="tier-name">' + tier.name + '</div>' +
            '<div class="tier-sub">' + tier.subtitle + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="tier-stats">' +
          '<div class="tier-stat"><span class="v">' + tier.monthPnL + '</span><span class="l">سود ماه</span></div>' +
          '<div class="tier-stat"><span class="v">' + tier.monthCount + '</span><span class="l">معاملات</span></div>' +
          '<div class="tier-stat"><span class="v">' + tier.winRate + '</span><span class="l">وین‌ریت</span></div>' +
        '</div>' +
        '<div class="tier-progress-wrap">' +
          '<div class="tier-progress-label"><span>' + tier.progressLabel + '</span><span>' + tier.progressPct + '</span></div>' +
          '<div class="tier-progress-bar"><div class="tier-progress-fill" style="width:' + tier.progressPct + '"></div></div>' +
        '</div>' +
        '<div class="tier-ladder">' +
          tier.ladder.map(function(s) {
            return '<div class="tier-step' + (s.unlocked ? ' unlocked' : '') + (s.current ? ' current' : '') + '" data-tier="' + s.key + '">' +
              '<span class="ico"></span><span class="nm">' + s.name + '</span>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div class="assistant">' +
        '<div class="assistant-inner">' +
          '<div class="assistant-avatar">' + a.icon + '</div>' +
          '<div class="assistant-body">' +
            '<div class="assistant-title">' + a.title + '</div>' +
            '<div class="assistant-text">' + a.text + '</div>' +
            (a.badges.length ? '<div class="assistant-badges">' +
              a.badges.map(function(b) {
                return '<span class="assistant-badge ' + b.cls + '">' + b.label + '</span>';
              }).join('') + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ══════════════════════════════════════════════════════
     GOALS
     ══════════════════════════════════════════════════════ */
  function renderGoals() {
    var host = $('#goals-banner-host');
    if (!host) return;

    var goal = getLS('po.v4.goal', null);
    var rules = getLS('po.v4.rules', null);
    var trades = getLS('po.v4.trades', []);

    var now = new Date();
    var startISO, endISO;
    if (goal && goal.period === 'month') {
      startISO = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
      endISO = toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else {
      var dss = (now.getDay() + 1) % 7;
      var st = new Date(now); st.setDate(now.getDate() - dss);
      var en = new Date(st); en.setDate(st.getDate() + 6);
      startISO = toISO(st); endISO = toISO(en);
    }

    var pt = trades.filter(function(t) { return t.date >= startISO && t.date <= endISO; });
    var w = 0, l = 0, net = 0;
    pt.forEach(function(t) {
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      net += p;
      if (t.result === 'win') w++;
      else if (t.result === 'loss') l++;
    });
    var closed = w + l;
    var stat = { total: pt.length, net: net, winRate: closed ? (w / closed) * 100 : 0 };

    var banner = null;

    if (goal && goal.target) {
      var cur = goal.metric === 'pnl' ? stat.net :
                goal.metric === 'trades' ? stat.total : stat.winRate;
      var prog = goal.target > 0 ? Math.min(100, (cur / goal.target) * 100) : 0;

      function fmt(v, m) {
        if (m === 'pnl') return money(v);
        if (m === 'trades') return Math.round(v) + '';
        return (+v).toFixed(1) + '٪';
      }

      var cls = prog >= 100 ? 'success' : prog >= 70 ? 'warning' : 'neutral';
      var ic = prog >= 100 ? '🏆' : prog >= 70 ? '⚡' : '🎯';
      var ti = prog >= 100 ? '🎉 به هدفت رسیدی!' :
               prog >= 70 ? 'داری نزدیک میشی!' :
               'هدف ' + (goal.period === 'week' ? 'هفتگی' : 'ماهانه');
      var sb = prog >= 100 ? 'هدف تکمیل شد' :
               prog >= 70 ? (100 - prog).toFixed(0) + '٪ تا هدف' :
               'در مسیر هدفت';

      banner = {
        cls: cls, icon: ic, title: ti, sub: sb,
        stats: [
          { v: fmt(cur, goal.metric), l: 'فعلی' },
          { v: fmt(goal.target, goal.metric), l: 'هدف' },
          { v: prog.toFixed(0) + '٪', l: 'پیشرفت' }
        ],
        progress: prog
      };
    }

    if (rules && rules.enabled && rules.dailyLoss > 0) {
      var today = toISO(new Date());
      var tn = 0;
      trades.filter(function(t) { return t.date === today; }).forEach(function(t) {
        tn += t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      });
      var tl = tn < 0 ? -tn : 0;
      var du = (tl / rules.dailyLoss) * 100;

      if (du >= 100) {
        banner = {
          cls: 'danger', icon: '🚨', title: 'حد ضرر نقض شد!',
          sub: 'معامله رو متوقف کن',
          stats: [
            { v: money(-tl), l: 'ضرر' },
            { v: money(-rules.dailyLoss), l: 'حد' },
            { v: du.toFixed(0) + '٪', l: 'مصرف' }
          ],
          progress: Math.min(100, du)
        };
      } else if (du >= 80 && (!banner || banner.cls === 'neutral')) {
        banner = {
          cls: 'warning', icon: '⚠️', title: 'نزدیک حد ضرر',
          sub: du.toFixed(0) + '٪ مصرف شده',
          stats: [
            { v: money(-tl), l: 'ضرر' },
            { v: money(-rules.dailyLoss), l: 'حد' },
            { v: du.toFixed(0) + '٪', l: 'مصرف' }
          ],
          progress: du
        };
      }
    }

    if (!banner) { host.innerHTML = ''; return; }

    host.innerHTML =
      '<div class="goal-banner ' + banner.cls + '">' +
        '<div class="goal-banner-head">' +
          '<div class="goal-banner-icon">' + banner.icon + '</div>' +
          '<div>' +
            '<div class="goal-banner-title">' + banner.title + '</div>' +
            '<div class="goal-banner-sub">' + banner.sub + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="goal-banner-body">' +
          banner.stats.map(function(s) {
            return '<div class="goal-banner-stat"><span class="v">' + s.v + '</span><span class="l">' + s.l + '</span></div>';
          }).join('') +
        '</div>' +
        '<div class="goal-banner-progress"><div class="goal-banner-fill" style="width:' + banner.progress + '%"></div></div>' +
      '</div>';
  }

  /* ══════════════════════════════════════════════════════
     SHARE IMAGE — کیهانی افسانه‌ای
     ══════════════════════════════════════════════════════ */
    function drawShare() {
    var trades = getLS('po.v4.trades', []);
    var tier = getTier(trades);

    var W = 900, H = 1650;
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    // ══════════════════════════════════════════════════════
    // تنظیمات رنگ بر اساس Tier
    // ══════════════════════════════════════════════════════
    var CFG = {
      bronze: {
        bgTop: '#1a0a02', bgMid: '#2a1408', bgBot: '#0a0400',
        primary: '#ff9d3f', secondary: '#ffd9a8', accent: '#cd7f32',
        glow: 'rgba(255,157,63,0.9)', softGlow: 'rgba(255,157,63,0.35)',
        nebula1: 'rgba(255,157,63,0.35)', nebula2: 'rgba(205,127,50,0.25)',
        nebula3: 'rgba(255,200,140,0.2)',
        label: 'BRONZE', stars: 80,
        starColors: ['#ff9d3f', '#ffd9a8', '#cd7f32']
      },
      silver: {
        bgTop: '#0a0d18', bgMid: '#151a30', bgBot: '#050710',
        primary: '#7d9eff', secondary: '#e8ecff', accent: '#c0c0d2',
        glow: 'rgba(125,158,255,0.9)', softGlow: 'rgba(125,158,255,0.35)',
        nebula1: 'rgba(125,158,255,0.3)', nebula2: 'rgba(200,210,230,0.25)',
        nebula3: 'rgba(160,170,220,0.2)',
        label: 'SILVER', stars: 120,
        starColors: ['#7d9eff', '#ffffff', '#c0c0d2']
      },
      gold: {
        bgTop: '#1a0f02', bgMid: '#2e1e04', bgBot: '#0a0500',
        primary: '#ffd54a', secondary: '#fff9c4', accent: '#ffaa00',
        glow: 'rgba(255,213,74,0.95)', softGlow: 'rgba(255,213,74,0.4)',
        nebula1: 'rgba(255,213,74,0.4)', nebula2: 'rgba(255,170,0,0.3)',
        nebula3: 'rgba(255,240,180,0.25)',
        label: 'GOLD', stars: 180,
        starColors: ['#ffd54a', '#fff9c4', '#ffaa00']
      },
      diamond: {
        bgTop: '#02030f', bgMid: '#0a0d28', bgBot: '#010105',
        primary: '#00e5ff', secondary: '#ffffff', accent: '#ba68ff',
        glow: 'rgba(0,229,255,1)', softGlow: 'rgba(0,229,255,0.4)',
        nebula1: 'rgba(0,229,255,0.35)', nebula2: 'rgba(186,104,255,0.35)',
        nebula3: 'rgba(120,220,255,0.25)',
        label: 'DIAMOND', stars: 280,
        starColors: ['#00e5ff', '#ffffff', '#ba68ff', '#7dd8ff']
      }
    };
    var C = CFG[tier.key] || CFG.bronze;

    // ══════════════════════════════════════════════════════
    // 50 نقل قول افسانه‌ای
    // ══════════════════════════════════════════════════════
    var QUOTES = {
      legendary: [
        { t: 'دقت ورودت مثل برنده‌های وال‌استریته', a: 'پاول تودور جونز' },
        { t: 'بازار به صبورترین‌ها پاداش می‌ده', a: 'وارن بافت' },
        { t: 'برنده شدن عادت است، باخت هم', a: 'وینس لومباردی' },
        { t: 'قهرمان‌ها از تکرار ساخته می‌شن، نه شانس', a: 'محمد علی' },
        { t: 'موفقیت مجموع تلاش‌های کوچیک روزانه‌ست', a: 'رابرت کولیر' },
        { t: 'بهترین تریدرها بهترین ژورنال‌نویس‌ها هستن', a: 'مارک داگلاس' },
        { t: 'بدون داده، فقط حدس می‌زنی — نه ترید', a: 'ری دالیو' },
        { t: 'دانش قدرت است، اما انضباط پادشاه', a: 'جیم ران' }
      ],
      excellent: [
        { t: 'برنده‌ها می‌دونن کِی وارد شن، قهرمان‌ها کِی خارج', a: 'جسی لیورمور' },
        { t: 'هر معامله رو مثل آخرین معامله‌ت ببین', a: 'پاول تودور جونز' },
        { t: 'سیستم داشته باش، نه احساس', a: 'مارک داگلاس' },
        { t: 'تریدر موفق کسیه که از اشتباهش یاد می‌گیره', a: 'جرج سوروس' },
        { t: 'سود = احتمال × نسبت ریسک به ریوارد', a: 'ری دالیو' },
        { t: 'بهترین سرمایه‌گذاری، خودته', a: 'وارن بافت' },
        { t: 'صبر، کلید ترید موفق', a: 'جسی لیورمور' },
        { t: 'احساسات دشمن تریدرن', a: 'اد سیکوتا' }
      ],
      solid: [
        { t: 'هر معامله یه درس، هر درس یه قدم', a: 'ری دالیو' },
        { t: 'شکست تنها راه یادگیری واقعیه', a: 'سام والتون' },
        { t: 'از اشتباهاتت درس بگیر، نه از موفقیت‌هات', a: 'بیل گیتس' },
        { t: 'بی‌نظمی، دشمن اول تریدره', a: 'مارک داگلاس' },
        { t: 'قانون ۱: پول از دست نده. قانون ۲: قانون ۱ یادت باشه', a: 'وارن بافت' },
        { t: 'زمان در بازار مهم‌تر از زمان‌بندی بازاره', a: 'کن فیشر' },
        { t: 'بدون شکست، موفقیتی نیست', a: 'میکا جیگر' },
        { t: 'تریدر خوب، تریدر منظمه', a: 'برت استید' }
      ],
      learning: [
        { t: 'شکست پله‌ی موفقیته، اگه درست استفاده کنی', a: 'هنری فورد' },
        { t: 'بازار همیشه درست می‌گه، تو باید همراهش بشی', a: 'مارتی شوارتز' },
        { t: 'هر ضرر یه فرصت یادگیریه', a: 'لری هایت' },
        { t: 'پول از دست دادن، بخشی از بازیه', a: 'پاول تودور جونز' },
        { t: 'بدون اشتباه، تجربه‌ای نیست', a: 'تام واتسون' },
        { t: 'اشتباه نکردن یعنی هیچ کاری نکردن', a: 'جان وودن' },
        { t: 'باخت بهت یاد می‌ده چطور برنده بشی', a: 'بیب روث' },
        { t: 'درسی که بدون درد باشه، درسی نیست', a: 'بنجامین فرانکلین' }
      ],
      profit: [
        { t: 'سود یعنی انضباط، نه شانس', a: 'وارن بافت' },
        { t: 'متواضع باش در سود، صبور در ضرر', a: 'ری دالیو' },
        { t: 'پول از صبر میاد، نه از فعالیت', a: 'جسی لیورمور' },
        { t: 'برنده‌ها می‌دونن کِی خارج شن', a: 'جرج سوروس' },
        { t: 'بازار فرصت‌ها رو به صبورها می‌ده', a: 'بیل گراس' },
        { t: 'ثروت = زمان × نرخ مرکب', a: 'آلبرت اینشتین' }
      ],
      loss: [
        { t: 'ضرر بخشی از بازیه — زود متوقف کن', a: 'پاول تودور جونز' },
        { t: 'از ضررهای کوچیک درس بگیر، قبل از ضررهای بزرگ', a: 'جرج سوروس' },
        { t: 'هر ضرر یه فرصت بازنگریست', a: 'استنلی دراکنمیلر' },
        { t: 'بدون ریسک، دستاوردی نیست', a: 'نیل آرمسترانگ' },
        { t: 'شکست، پلی به سمت موفقیته', a: 'زیگ زیگلار' },
        { t: 'زمین خوردی؟ پاشو. قوی‌تر ادامه بده', a: 'ناشناس' }
      ],
      neutral: [
        { t: 'سربه‌سر یعنی آماده‌ی جهش', a: 'ضرب‌المثل ژاپنی' },
        { t: 'هر روز فرصت جدیدیه', a: 'ناشناس' },
        { t: 'زمان و صبر، بهترین دوست تریدرن', a: 'جسی لیورمور' },
        { t: 'استراحت هم بخشی از تریده', a: 'ناشناس' },
        { t: 'کonsistنسی از شدت مهم‌تره', a: 'ناشناس' },
        { t: 'بازار فردا هم بازه', a: 'وارن بافت' }
      ]
    };

    // ══════════════════════════════════════════════════════
    // 1) محاسبه آمار اول
    // ══════════════════════════════════════════════════════
    var w = 0, l = 0, net = 0, gp = 0, gl = 0;
    trades.forEach(function(t) {
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      net += p;
      if (t.result === 'win') { w++; gp += p; }
      else if (t.result === 'loss') { l++; gl += Math.abs(p); }
    });
    var closed = w + l;
    var wr = closed ? (w / closed) * 100 : 0;
    var pf = gl > 0 ? gp / gl : (gp > 0 ? Infinity : 0);

    // ══════════════════════════════════════════════════════
    // 2) انتخاب نقل قول
    // ══════════════════════════════════════════════════════
    var pool;
    if (net < 0 && wr < 45) pool = QUOTES.loss;
    else if (net < 0 && wr >= 50) pool = QUOTES.learning;
    else if (net < 0) pool = QUOTES.learning;
    else if (net > 0 && wr >= 65) pool = QUOTES.legendary;
    else if (net > 0 && wr >= 55) pool = QUOTES.excellent;
    else if (net > 0 && wr >= 45) pool = QUOTES.solid;
    else if (net > 0) pool = QUOTES.profit;
    else pool = QUOTES.neutral;

    // انتخاب قوی بر اساس تعداد معاملات (همیشه یکسان بمونه)
    var pick = (trades.length * 31 + Math.round(wr * 7)) % pool.length;
    var Q = pool[pick];

    // ══════════════════════════════════════════════════════
    // 3) پس‌زمینه
    // ══════════════════════════════════════════════════════
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, C.bgTop);
    bg.addColorStop(0.5, C.bgMid);
    bg.addColorStop(1, C.bgBot);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ══════════════════════════════════════════════════════
    // 4) Nebula
    // ══════════════════════════════════════════════════════
    function nebula(x, y, r, color) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(0.4, color.replace(/[\d.]+\)$/, '0.15)'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    nebula(150, 200, 550, C.nebula1);
    nebula(W - 100, 450, 500, C.nebula2);
    nebula(W / 2, 900, 600, C.nebula3);
    nebula(200, 1300, 450, C.nebula1);
    nebula(W - 150, 1500, 500, C.nebula2);

    // ══════════════════════════════════════════════════════
    // 5) ستاره‌ها
    // ══════════════════════════════════════════════════════
    for (var i = 0; i < C.stars; i++) {
      var sx = Math.random() * W;
      var sy = Math.random() * H;
      var sr = Math.random() * 1.8 + 0.3;
      var sa = Math.random() * 0.85 + 0.15;
      var sc = C.starColors[Math.floor(Math.random() * C.starColors.length)];
      ctx.globalAlpha = sa;
      ctx.fillStyle = sc;
      ctx.shadowColor = sc;
      ctx.shadowBlur = sr > 1.2 ? 8 : 0;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // ══════════════════════════════════════════════════════
    // 6) نوار بالا
    // ══════════════════════════════════════════════════════
    var topBar = ctx.createLinearGradient(0, 0, W, 0);
    topBar.addColorStop(0, 'rgba(255,255,255,0)');
    topBar.addColorStop(0.15, C.primary);
    topBar.addColorStop(0.5, C.secondary);
    topBar.addColorStop(0.85, C.primary);
    topBar.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = topBar;
    ctx.fillRect(0, 0, W, 4);

    // ══════════════════════════════════════════════════════
    // 7) Tier Badge
    // ══════════════════════════════════════════════════════
    var badgeW = 260, badgeH = 74;
    var badgeX = (W - badgeW) / 2;
    var badgeY = 40;

    ctx.shadowColor = C.glow;
    ctx.shadowBlur = 80;
    ctx.fillStyle = C.softGlow;
    rr(ctx, badgeX, badgeY, badgeW, badgeH, 37);
    ctx.fill();
    ctx.shadowBlur = 0;

    var badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
    badgeGrad.addColorStop(0, C.primary);
    badgeGrad.addColorStop(0.5, C.secondary);
    badgeGrad.addColorStop(1, C.primary);
    ctx.fillStyle = badgeGrad;
    rr(ctx, badgeX, badgeY, badgeW, badgeH, 37);
    ctx.fill();

    ctx.fillStyle = C.bgTop;
    ctx.font = '900 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(C.label, W / 2, badgeY + badgeH / 2 + 1);

    // ══════════════════════════════════════════════════════
    // 8) لوگو PO-TRADE
    // ══════════════════════════════════════════════════════
    var titleGrad = ctx.createLinearGradient(W / 2 - 320, 0, W / 2 + 320, 0);
    titleGrad.addColorStop(0, C.primary);
    titleGrad.addColorStop(0.5, C.secondary);
    titleGrad.addColorStop(1, C.primary);

    ctx.shadowColor = C.glow;
    ctx.shadowBlur = 50;
    ctx.fillStyle = titleGrad;
    ctx.font = '900 76px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('PO-TRADE', W / 2, 145);
    ctx.shadowBlur = 0;

    ctx.font = '700 13px Inter, sans-serif';
    ctx.fillStyle = 'rgba(200,215,240,0.6)';
    ctx.fillText('◆  PERFORMANCE REPORT  ◆  ' +
                 new Date().toISOString().slice(0, 10), W / 2, 235);

    // ══════════════════════════════════════════════════════
    // 9) NET PNL
    // ══════════════════════════════════════════════════════
    var isProfit = net > 0;
    var pnlColor = isProfit ? '#2ee6a6' : net < 0 ? '#ff5674' : '#8697b8';
    var pnlColor2 = isProfit ? '#7bffd0' : net < 0 ? '#ff95a8' : '#c7d3ea';
    var sgn = net > 0 ? '+' : net < 0 ? '-' : '';
    var nTxt = sgn + '$' + Math.abs(net).toLocaleString('en-US', { maximumFractionDigits: 2 });

    var halo = ctx.createRadialGradient(W / 2, 430, 0, W / 2, 430, 400);
    halo.addColorStop(0, isProfit ? 'rgba(46,230,166,0.4)' : 'rgba(255,86,116,0.4)');
    halo.addColorStop(0.5, isProfit ? 'rgba(46,230,166,0.1)' : 'rgba(255,86,116,0.1)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 250, W, 420);

    var numGrad = ctx.createLinearGradient(W / 2 - 350, 0, W / 2 + 350, 0);
    numGrad.addColorStop(0, pnlColor);
    numGrad.addColorStop(0.5, pnlColor2);
    numGrad.addColorStop(1, pnlColor);

    ctx.shadowColor = pnlColor;
    ctx.shadowBlur = 100;
    ctx.font = '900 142px Inter, sans-serif';
    ctx.fillStyle = numGrad;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nTxt, W / 2, 430);
    ctx.shadowBlur = 0;

    ctx.font = '900 14px Inter, sans-serif';
    ctx.fillStyle = 'rgba(200,215,240,0.55)';
    ctx.textBaseline = 'top';
    ctx.fillText('N E T   P R O F I T   /   L O S S', W / 2, 520);

    // ══════════════════════════════════════════════════════
    // 10) 4 کارت آمار
    // ══════════════════════════════════════════════════════
    var cw = 195, ch = 120, gap = 10;
    var tw = cw * 4 + gap * 3;
    var sx = (W - tw) / 2;
    var cy = 580;

    function statCard(x, y, label, val, clr, ico) {
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;

      var g = ctx.createLinearGradient(x, y, x, y + ch);
      g.addColorStop(0, 'rgba(20,25,45,0.95)');
      g.addColorStop(1, 'rgba(8,10,22,0.95)');
      ctx.fillStyle = g;
      rr(ctx, x, y, cw, ch, 18);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.strokeStyle = 'rgba(200,215,240,0.15)';
      ctx.lineWidth = 1;
      rr(ctx, x, y, cw, ch, 18);
      ctx.stroke();

      var ag = ctx.createLinearGradient(x + 20, 0, x + cw - 20, 0);
      ag.addColorStop(0, clr);
      ag.addColorStop(0.5, clr);
      ag.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ag;
      ctx.fillRect(x + 20, y, cw - 40, 2.5);

      ctx.font = '22px Inter, sans-serif';
      ctx.fillStyle = clr;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(ico, x + cw / 2, y + 14);

      ctx.font = '900 34px Inter, sans-serif';
      ctx.fillStyle = clr;
      ctx.textBaseline = 'middle';
      ctx.shadowColor = clr;
      ctx.shadowBlur = 16;
      ctx.fillText(val, x + cw / 2, y + 62);
      ctx.shadowBlur = 0;

      ctx.font = '900 10px Inter, sans-serif';
      ctx.fillStyle = 'rgba(200,215,240,0.55)';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + cw / 2, y + 98);
    }

    statCard(sx, cy, 'TOTAL TRADES', trades.length + '', C.primary, '📊');
    statCard(sx + cw + gap, cy, 'WIN RATE', wr.toFixed(1) + '%',
             wr >= 50 ? '#2ee6a6' : '#ff5674', '🎯');
    statCard(sx + (cw + gap) * 2, cy, 'WINS', w + '', '#2ee6a6', '✅');
    statCard(sx + (cw + gap) * 3, cy, 'LOSSES', l + '', '#ff5674', '❌');

    // ══════════════════════════════════════════════════════
    // 11) Equity Curve
    // ══════════════════════════════════════════════════════
    var sorted = trades.slice().sort(function(a, b) {
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
    var cum = 0;
    var points = sorted.map(function(t) {
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      cum += p;
      return cum;
    });

    if (points.length > 1) {
      var chartY = 800;
      var chartH = 130;
      var chartX = 70;
      var chartW = W - 140;

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      rr(ctx, chartX - 15, chartY - 35, chartW + 30, chartH + 60, 16);
      ctx.fill();

      ctx.strokeStyle = 'rgba(200,215,240,0.12)';
      ctx.lineWidth = 1;
      rr(ctx, chartX - 15, chartY - 35, chartW + 30, chartH + 60, 16);
      ctx.stroke();

      ctx.font = '900 12px Inter, sans-serif';
      ctx.fillStyle = C.secondary;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('◆  EQUITY CURVE', chartX, chartY - 25);

      var maxV = Math.max.apply(null, points.concat([0]));
      var minV = Math.min.apply(null, points.concat([0]));
      var range = maxV - minV || 1;
      var zeroY = chartY + chartH * (maxV / range);

      ctx.strokeStyle = 'rgba(200,215,240,0.15)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(chartX, zeroY);
      ctx.lineTo(chartX + chartW, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);

      var stepX = chartW / (points.length - 1);
      var pts = points.map(function(v, i) {
        return {
          x: chartX + i * stepX,
          y: chartY + chartH - ((v - minV) / range) * chartH
        };
      });

      var isPositiveEnd = points[points.length - 1] >= 0;
      var areaColor = isPositiveEnd ? 'rgba(46,230,166,0.2)' : 'rgba(255,86,116,0.2)';
      var areaFade = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
      areaFade.addColorStop(0, areaColor);
      areaFade.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = areaFade;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, zeroY);
      pts.forEach(function(p) { ctx.lineTo(p.x, p.y); });
      ctx.lineTo(pts[pts.length - 1].x, zeroY);
      ctx.closePath();
      ctx.fill();

      var lineGrad = ctx.createLinearGradient(chartX, 0, chartX + chartW, 0);
      lineGrad.addColorStop(0, '#2ee6a6');
      lineGrad.addColorStop(0.5, C.primary);
      lineGrad.addColorStop(1, C.secondary);
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = C.glow;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      pts.forEach(function(p, i) {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      var last = pts[pts.length - 1];
      ctx.fillStyle = C.secondary;
      ctx.shadowColor = C.glow;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = C.bgTop;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      var finalV = points[points.length - 1];
      ctx.font = '900 12px Inter, sans-serif';
      ctx.fillStyle = finalV >= 0 ? '#2ee6a6' : '#ff5674';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText((finalV >= 0 ? '+' : '') + '$' + finalV.toFixed(0),
                   chartX + chartW, chartY - 25);
    }

    // ══════════════════════════════════════════════════════
    // 12) Win Rate Bar
    // ══════════════════════════════════════════════════════
    var barY = 1000;
    var barX = 70, barW = W - 140, barH = 16;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rr(ctx, barX, barY, barW, barH, 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(200,215,240,0.15)';
    ctx.lineWidth = 1;
    rr(ctx, barX, barY, barW, barH, 8);
    ctx.stroke();

    var fw = (wr / 100) * barW;
    if (fw > 0) {
      var fg = ctx.createLinearGradient(barX, 0, barX + fw, 0);
      fg.addColorStop(0, '#2ee6a6');
      fg.addColorStop(0.5, C.primary);
      fg.addColorStop(1, C.secondary);
      ctx.fillStyle = fg;
      ctx.shadowColor = C.glow;
      ctx.shadowBlur = 30;
      rr(ctx, barX, barY, Math.max(fw, 16), barH, 8);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(barX + fw - 8, barY + barH / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.font = '900 12px Inter, sans-serif';
    ctx.fillStyle = 'rgba(200,215,240,0.65)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('WIN RATE ' + wr.toFixed(1) + '%', barX, barY - 10);

    var pfT = isFinite(pf) ? pf.toFixed(2) : '∞';
    ctx.textAlign = 'right';
    ctx.fillStyle = pf >= 1.5 ? '#2ee6a6' : pf < 1 ? '#ff5674' : '#ffb020';
    ctx.fillText('PROFIT FACTOR ' + pfT, barX + barW, barY - 10);

    // ══════════════════════════════════════════════════════
    // 13) کارت نقل قول — NEW!
    // ══════════════════════════════════════════════════════
    var qY = 1070;
    var qH = 200;
    var qX = 60;
    var qW = W - 120;

    // سایه + glow
    ctx.shadowColor = C.glow;
    ctx.shadowBlur = 60;

    // Background با گرادیانت
    var qGrad = ctx.createLinearGradient(qX, qY, qX + qW, qY + qH);
    qGrad.addColorStop(0, 'rgba(20,25,45,0.9)');
    qGrad.addColorStop(0.5, 'rgba(15,20,38,0.9)');
    qGrad.addColorStop(1, 'rgba(10,14,28,0.9)');
    ctx.fillStyle = qGrad;
    rr(ctx, qX, qY, qW, qH, 22);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Border گرادیانت
    var borderGrad = ctx.createLinearGradient(qX, qY, qX + qW, qY);
    borderGrad.addColorStop(0, 'rgba(255,255,255,0.05)');
    borderGrad.addColorStop(0.5, C.primary);
    borderGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 2;
    rr(ctx, qX, qY, qW, qH, 22);
    ctx.stroke();

    // علامت نقل قول بزرگ (چپ بالا)
    ctx.font = '900 120px Georgia, serif';
    ctx.fillStyle = C.primary;
    ctx.globalAlpha = 0.15;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('"', qX + 25, qY + 5);
    ctx.globalAlpha = 1;

    // علامت نقل قول بزرگ (راست پایین)
    ctx.font = '900 120px Georgia, serif';
    ctx.fillStyle = C.primary;
    ctx.globalAlpha = 0.15;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('"', qX + qW - 25, qY + qH - 5);
    ctx.globalAlpha = 1;

    // متن نقل قول — وسط
    ctx.font = '900 22px Vazirmatn, Inter, sans-serif';
    ctx.fillStyle = '#f0f4ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';

    // word wrap برای متن طولانی
    var maxChars = 42;
    var words = Q.t.split(' ');
    var lines = [];
    var line = '';
    words.forEach(function(word) {
      var test = line ? line + ' ' + word : word;
      if (test.length > maxChars) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);

    var lineHeight = 34;
    var totalH = lines.length * lineHeight;
    var startY = qY + 55 + (qH - 110 - totalH) / 2;

    // glow متن
    ctx.shadowColor = C.glow;
    ctx.shadowBlur = 15;
    lines.forEach(function(ln, idx) {
      ctx.fillText(ln, W / 2, startY + idx * lineHeight);
    });
    ctx.shadowBlur = 0;
    ctx.direction = 'ltr';

    // اسم نویسنده
    ctx.font = '700 14px Vazirmatn, Inter, sans-serif';
    ctx.fillStyle = C.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.direction = 'rtl';
    ctx.shadowColor = C.glow;
    ctx.shadowBlur = 10;
    ctx.fillText('— ' + Q.a + ' —', W / 2, qY + qH - 22);
    ctx.shadowBlur = 0;
    ctx.direction = 'ltr';

    // ══════════════════════════════════════════════════════
    // 14) Top Strategies
    // ══════════════════════════════════════════════════════
    var bs = {};
    trades.forEach(function(t) {
      var s = t.strategy || '—';
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      if (!bs[s]) bs[s] = 0;
      bs[s] += p;
    });
    var strats = Object.keys(bs).map(function(k) {
      return { name: k, net: bs[k] };
    }).sort(function(a, b) { return b.net - a.net; });

    var sY = 1310;

    var hLine = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
    hLine.addColorStop(0, 'rgba(255,255,255,0)');
    hLine.addColorStop(0.5, C.primary);
    hLine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hLine;
    ctx.fillRect(W / 2 - 200, sY, 400, 1.5);

    ctx.font = '900 15px Inter, sans-serif';
    ctx.fillStyle = C.secondary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = C.glow;
    ctx.shadowBlur = 12;
    ctx.fillText('◆  TOP STRATEGIES  ◆', W / 2, sY + 12);
    ctx.shadowBlur = 0;

    strats.slice(0, 4).forEach(function(s, i) {
      var y = sY + 48 + i * 42;
      var isP = s.net > 0;
      var color = isP ? '#2ee6a6' : s.net < 0 ? '#ff5674' : '#8697b8';
      var sign = isP ? '▲' : s.net < 0 ? '▼' : '●';
      var txt = isP ? '+$' + s.net.toFixed(0) : '-$' + Math.abs(s.net).toFixed(0);

      var rowG = ctx.createLinearGradient(70, 0, W - 70, 0);
      rowG.addColorStop(0, isP ? 'rgba(46,230,166,0.08)' : 'rgba(255,86,116,0.08)');
      rowG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rowG;
      rr(ctx, 55, y - 14, W - 110, 36, 10);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.fillRect(55, y - 14, 3, 36);

      ctx.font = '900 16px Inter, sans-serif';
      ctx.fillStyle = C.primary;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('#' + (i + 1), 78, y + 4);

      ctx.fillStyle = color;
      ctx.fillText(sign, 108, y + 4);

      ctx.font = '800 14px Inter, sans-serif';
      ctx.fillStyle = 'rgba(230,240,255,0.9)';
      var nm = s.name.length > 20 ? s.name.substring(0, 18) + '...' : s.name;
      ctx.fillText(nm, 135, y + 4);

      ctx.font = '900 17px Inter, sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillText(txt, W - 80, y + 4);
      ctx.shadowBlur = 0;
    });

    // ══════════════════════════════════════════════════════
    // 15) Footer — فقط PO-TRADE، بدون گیت
    // ══════════════════════════════════════════════════════
    var footY = H - 50;

    var fLine = ctx.createLinearGradient(150, 0, W - 150, 0);
    fLine.addColorStop(0, 'rgba(255,255,255,0)');
    fLine.addColorStop(0.5, C.primary);
    fLine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = fLine;
    ctx.fillRect(150, footY - 25, W - 300, 1);

    ctx.font = '900 18px Inter, sans-serif';
    var footG = ctx.createLinearGradient(W / 2 - 100, 0, W / 2 + 100, 0);
    footG.addColorStop(0, C.primary);
    footG.addColorStop(1, C.secondary);
    ctx.fillStyle = footG;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = C.glow;
    ctx.shadowBlur = 15;
    ctx.fillText('◆  PO-TRADE  ◆', W / 2, footY);
    ctx.shadowBlur = 0;

    // ══════════════════════════════════════════════════════
    // 16) Vignette
    // ══════════════════════════════════════════════════════
    var vig = ctx.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 950);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    return canvas;
  }

  function initShare() {
    var host = $('#share-host');
    if (!host) return;

    host.innerHTML =
      '<div class="share-card">' +
        '<div class="share-head">' +
          '<h3>📤 اشتراک‌گذاری وضعیت</h3>' +
          '<div class="share-actions">' +
            '<button class="share-btn" data-act="preview">👁️ پیش‌نمایش</button>' +
            '<button class="share-btn primary" data-act="download">⬇️ دانلود</button>' +
            '<button class="share-btn" data-act="share">📱 اشتراک</button>' +
          '</div>' +
        '</div>' +
        '<div class="share-preview" id="sharePreviewWrap"></div>' +
      '</div>';

    host.addEventListener('click', async function(e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var act = btn.dataset.act;
      var canvas = drawShare();
      var wrap = $('#sharePreviewWrap');

      if (act === 'preview') {
        wrap.innerHTML = '';
        var c2 = canvas.cloneNode(true);
        c2.getContext('2d').drawImage(canvas, 0, 0);
        wrap.appendChild(c2);
        wrap.classList.add('show');
      } else if (act === 'download') {
        var url = canvas.toDataURL('image/jpeg', 0.92);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'po-trade-' + new Date().toISOString().slice(0, 10) + '.jpg';
        a.click();
      } else if (act === 'share') {
        canvas.toBlob(async function(blob) {
          var file = new File([blob], 'po-trade.jpg', { type: 'image/jpeg' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({ files: [file], title: 'PO-TRADE', text: 'وضعیت معاملات من' });
            } catch(err) { if (err.name !== 'AbortError') console.warn(err); }
          } else {
            alert('مرورگر پشتیبانی نمی‌کند. از دانلود استفاده کن.');
          }
        }, 'image/jpeg', 0.92);
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     THEME + STREAK + CONFETTI + COMMAND PALETTE
     ══════════════════════════════════════════════════════ */
  function initThemeSwitcher() {
    var host = $('#theme-switcher-host');
    if (!host) return;
    var cur = localStorage.getItem('po.v4.theme') || 'obsidian';
    if (cur === 'dark') cur = 'obsidian';
    if (cur === 'light') cur = 'aurora';

    host.innerHTML =
      '<div class="theme-switcher">' +
        '<button class="theme-pick" data-theme-pick="obsidian" title="Obsidian"></button>' +
        '<button class="theme-pick" data-theme-pick="aurora" title="Aurora"></button>' +
        '<button class="theme-pick" data-theme-pick="cyber" title="Cyber"></button>' +
      '</div>';

    function setActive(n) {
      $$('.theme-pick', host).forEach(function(b) {
        b.classList.toggle('active', b.dataset.themePick === n);
      });
    }
    setActive(cur);

    host.addEventListener('click', function(e) {
      var b = e.target.closest('.theme-pick');
      if (!b) return;
      var n = b.dataset.themePick;
      document.documentElement.dataset.theme = n;
      localStorage.setItem('po.v4.theme', n);
      setActive(n);
      var tb = document.querySelector('.theme-icon');
      if (tb) tb.textContent = n === 'aurora' ? '☀️' : n === 'cyber' ? '⚡' : '🌙';
      window.dispatchEvent(new Event('resize'));
    });
  }

  function moveThemeSwitcher() {
    var dd = document.getElementById('userDropdown');
    var ts = document.getElementById('theme-switcher-host');
    if (!dd || !ts || ts.parentElement === dd) return;
    var a = dd.querySelector('.user-actions');
    if (a) dd.insertBefore(ts, a); else dd.appendChild(ts);
  }

  function calcStreak() {
    var trades = getLS('po.v4.trades', []);
    if (!trades.length) return 0;
    var bd = {};
    trades.forEach(function(t) {
      if (!t.date) return;
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      bd[t.date] = (bd[t.date] || 0) + p;
    });
    var st = 0;
    for (var i = 0; i < 365; i++) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var iso = toISO(d);
      var n = bd[iso];
      if (n === undefined) { if (i === 0) continue; break; }
      if (n > 0) st++; else break;
    }
    return st;
  }

  function initStreak() {
    var br = document.querySelector('.brand');
    if (!br || document.querySelector('.streak-badge')) return;
    var el = document.createElement('div');
    el.className = 'streak-badge';
    el.title = 'روزهای سوددهی متوالی';
    br.appendChild(el);

    function r() {
      var s = calcStreak();
      if (s > 0) {
        el.classList.remove('cold'); el.classList.add('hot');
        el.innerHTML = '<span class="fire">🔥</span><span class="num">' + s + '</span><span class="lbl">روز</span>';
      } else {
        el.classList.remove('hot'); el.classList.add('cold');
        el.innerHTML = '<span class="fire">❄️</span><span class="lbl">صفر</span>';
      }
    }
    r();
    setInterval(r, 30000);
  }

  function fireConfetti() {
    if (document.querySelector('.confetti-canvas')) return;
    var cv = document.createElement('canvas');
    cv.className = 'confetti-canvas';
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    var colors = ['#2ee6a6', '#5b8cff', '#ff5fa2', '#ffb020', '#c78aff'];
    var pcs = [];
    for (var i = 0; i < 120; i++) {
      pcs.push({
        x: Math.random() * cv.width,
        y: -20 - Math.random() * cv.height * 0.5,
        w: 8 + Math.random() * 8,
        h: 6 + Math.random() * 12,
        c: colors[Math.floor(Math.random() * colors.length)],
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 5,
        r: Math.random() * Math.PI * 2,
        vr: -0.18 + Math.random() * 0.36
      });
    }
    var start = Date.now();
    var dur = 3500;
    function f() {
      var e = Date.now() - start;
      var a = e < dur - 500 ? 1 : Math.max(0, (dur - e) / 500);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.globalAlpha = a;
      pcs.forEach(function(p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (e < dur) requestAnimationFrame(f);
      else cv.remove();
    }
    requestAnimationFrame(f);
  }

  var lastCel = '';
  function checkGoal() {
    var b = document.querySelector('.goal-banner.success');
    if (!b) return;
    var t = b.querySelector('.goal-banner-title');
    if (!t) return;
    var x = t.textContent;
    if (x && x !== lastCel) { lastCel = x; fireConfetti(); }
  }

  function initCmd() {
    if (document.querySelector('.cmd-overlay')) return;
    var ov = document.createElement('div');
    ov.className = 'cmd-overlay';
    ov.innerHTML =
      '<div class="cmd-card">' +
        '<div class="cmd-input-wrap">' +
          '<span class="icon">🔍</span>' +
          '<input class="cmd-input" type="text" placeholder="جستجو..." autocomplete="off" />' +
        '</div>' +
        '<div class="cmd-list" id="cmdList"></div>' +
      '</div>';
    document.body.appendChild(ov);

    var input = ov.querySelector('.cmd-input');
    var list = ov.querySelector('#cmdList');
    var active = 0;

    function switchTab(n) { var t = document.querySelector('.tab[data-view="' + n + '"]'); if (t) t.click(); }

    var cmds = [
      { e: '✍️', l: 'ثبت معامله', a: function() { switchTab('add'); } },
      { e: '📊', l: 'آنالیز', a: function() { switchTab('analysis'); } },
      { e: '📅', l: 'تقویم', a: function() { switchTab('calendar'); } },
      { e: '📋', l: 'معاملات', a: function() { switchTab('trades'); } },
      { e: '⚙️', l: 'تنظیمات', a: function() { switchTab('settings'); } },
      { e: '🔄', l: 'همگام‌سازی', a: function() { if (window.PT_Sync) window.PT_Sync.forcePush(); } },
      { e: '🚪', l: 'خروج', a: function() { if (window.poLogout) window.poLogout(); } }
    ];
    var f = cmds.slice();

    function render() {
      if (!f.length) { list.innerHTML = '<div class="cmd-empty">نیست</div>'; return; }
      list.innerHTML = f.map(function(c, i) {
        return '<button class="cmd-item' + (i === active ? ' active' : '') + '" data-i="' + i + '">' +
          '<span class="emoji">' + c.e + '</span><span class="label">' + c.l + '</span></button>';
      }).join('');
    }
    function filter(q) {
      q = (q || '').trim().toLowerCase();
      f = !q ? cmds.slice() : cmds.filter(function(c) { return c.l.toLowerCase().indexOf(q) !== -1; });
      active = 0; render();
    }
    function open() { ov.classList.add('open'); input.value = ''; filter(''); setTimeout(function() { input.focus(); }, 80); }
    function close() { ov.classList.remove('open'); }
    function exec() { if (!f[active]) return; var c = f[active]; close(); setTimeout(function() { c.a(); }, 120); }

    input.addEventListener('input', function() { filter(this.value); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % f.length; render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + f.length) % f.length; render(); }
      else if (e.key === 'Enter') { e.preventDefault(); exec(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    list.addEventListener('click', function(e) {
      var it = e.target.closest('.cmd-item');
      if (!it) return;
      active = parseInt(it.dataset.i, 10); exec();
    });
    ov.addEventListener('click', function(e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (ov.classList.contains('open')) close(); else open();
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════ */
  function init() {
    document.querySelectorAll('.market-clock').forEach(function(c) { c.remove(); });
    moveThemeSwitcher();
    setTimeout(moveThemeSwitcher, 500);
    setTimeout(moveThemeSwitcher, 1500);

    setTimeout(initClock, 100);
    setTimeout(initClock, 700);

    renderAssistant();
    renderGoals();
    initShare();
    initThemeSwitcher();
    initStreak();
    initCmd();

    setInterval(function() {
      renderAssistant();
      renderGoals();
    }, 5000);
    setInterval(checkGoal, 2000);

    document.querySelectorAll('.tab').forEach(function(t) {
      t.addEventListener('click', function() { setTimeout(initClock, 100); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PT_Assistant = {
    refresh: function() { renderAssistant(); renderGoals(); },
    initClock: initClock
  };
  window.PT_Extras = {
    confetti: fireConfetti,
    streak: calcStreak
  };
})();
