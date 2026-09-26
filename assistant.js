/* ============================================================
   PO-TRADE Assistant v10.0 — STABLE COSMIC
   ✅ موبایل کامل OK
   ✅ بدون overflow
   ✅ عکس خروجی متفاوت برای هر سطح
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
     SHARE IMAGE — متفاوت برای هر سطح
     ══════════════════════════════════════════════════════ */
  function drawShare() {
    var trades = getLS('po.v4.trades', []);
    var tier = getTier(trades);

    var W = 800, H = 1200;
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    // ═══ تنظیمات رنگ بر اساس Tier ═══
    var config = {
      bronze: {
        bg1: '#1a0f08', bg2: '#2a1810', bg3: '#0f0704',
        primary: '#cd7f32', secondary: '#e8a370', accent: '#f5d5b0',
        glow: 'rgba(205,127,50,0.5)', label: 'BRONZE',
        starColors: ['#cd7f32', '#f0a96c'],
        orbColors: ['rgba(205,127,50,0.25)', 'rgba(240,169,108,0.15)']
      },
      silver: {
        bg1: '#0f121e', bg2: '#1a2030', bg3: '#08090f',
        primary: '#c0c0d2', secondary: '#e0e0f0', accent: '#ffffff',
        glow: 'rgba(192,192,210,0.5)', label: 'SILVER',
        starColors: ['#c0c0d2', '#ffffff'],
        orbColors: ['rgba(192,192,210,0.25)', 'rgba(224,224,240,0.15)']
      },
      gold: {
        bg1: '#1a1404', bg2: '#2a2008', bg3: '#0f0c02',
        primary: '#ffc828', secondary: '#fff9c4', accent: '#ffd94a',
        glow: 'rgba(255,200,40,0.55)', label: 'GOLD',
        starColors: ['#ffc828', '#ffd94a', '#fff9c4'],
        orbColors: ['rgba(255,200,40,0.3)', 'rgba(255,217,74,0.15)']
      },
      diamond: {
        bg1: '#050a1e', bg2: '#0a1430', bg3: '#020510',
        primary: '#7dd8ff', secondary: '#ffffff', accent: '#ba68ff',
        glow: 'rgba(120,220,255,0.6)', label: 'DIAMOND',
        starColors: ['#7dd8ff', '#ffffff', '#ba68ff'],
        orbColors: ['rgba(120,220,255,0.3)', 'rgba(186,104,255,0.2)']
      }
    };
    var C = config[tier.key] || config.bronze;

    // ═══ پس‌زمینه ═══
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, C.bg1);
    bg.addColorStop(0.5, C.bg2);
    bg.addColorStop(1, C.bg3);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ═══ ستاره‌ها (فقط برای DIAMOND بیشتر) ═══
    var starCount = tier.key === 'diamond' ? 200 :
                    tier.key === 'gold' ? 100 :
                    tier.key === 'silver' ? 60 : 30;
    for (var i = 0; i < starCount; i++) {
      var sx = Math.random() * W;
      var sy = Math.random() * H;
      var sr = Math.random() * 1.6 + 0.3;
      var sa = Math.random() * 0.7 + 0.2;
      var sc = C.starColors[Math.floor(Math.random() * C.starColors.length)];
      ctx.globalAlpha = sa;
      ctx.fillStyle = sc;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ═══ Orbs (Nebula) ═══
    function orb(x, y, r, color) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    orb(150, 180, 400, C.orbColors[0]);
    orb(W - 100, H - 250, 450, C.orbColors[1]);

    // ═══ نوار رنگی بالا ═══
    var topBar = ctx.createLinearGradient(0, 0, W, 0);
    topBar.addColorStop(0, 'rgba(255,255,255,0)');
    topBar.addColorStop(0.2, C.primary);
    topBar.addColorStop(0.5, C.secondary);
    topBar.addColorStop(0.8, C.primary);
    topBar.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = topBar;
    ctx.fillRect(0, 0, W, 5);

    // ═══ نشان Tier (Badge) ═══
    var bw = 240, bh = 70;
    var bx = (W - bw) / 2;
    var by = 50;

    // Glow پشت
    ctx.shadowColor = C.glow;
    ctx.shadowBlur = 60;
    ctx.fillStyle = C.primary;
    ctx.globalAlpha = 0.3;
    rr(ctx, bx, by, bw, bh, 35);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // کادر اصلی با گرادیانت
    var badgeGrad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    badgeGrad.addColorStop(0, C.primary);
    badgeGrad.addColorStop(0.5, C.secondary);
    badgeGrad.addColorStop(1, C.primary);
    ctx.fillStyle = badgeGrad;
    rr(ctx, bx, by, bw, bh, 35);
    ctx.fill();

    // متن Tier
    ctx.fillStyle = C.bg1;
    ctx.font = '900 26px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(C.label, W / 2, by + bh / 2 + 1);

    // ═══ لوگو ═══
    var titleGrad = ctx.createLinearGradient(W / 2 - 250, 0, W / 2 + 250, 0);
    titleGrad.addColorStop(0, C.primary);
    titleGrad.addColorStop(0.5, C.secondary);
    titleGrad.addColorStop(1, C.primary);
    ctx.fillStyle = titleGrad;
    ctx.font = '900 68px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = C.glow;
    ctx.shadowBlur = 40;
    ctx.fillText('PO-TRADE', W / 2, 165);
    ctx.shadowBlur = 0;

    ctx.font = '700 13px Inter, sans-serif';
    ctx.fillStyle = 'rgba(200,215,240,0.7)';
    ctx.fillText('◆  PERFORMANCE REPORT  ◆  ' +
                 new Date().toISOString().slice(0, 10) + '  ◆', W / 2, 255);

    // ═══ محاسبه آمار ═══
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

    // ═══ Net PnL بزرگ ═══
    var pnlColor = net > 0 ? '#2ee6a6' : net < 0 ? '#ff5674' : '#8697b8';
    var pnlColor2 = net > 0 ? '#7bffd0' : net < 0 ? '#ff95a8' : '#c7d3ea';
    var sgn = net > 0 ? '+' : net < 0 ? '-' : '';
    var nTxt = sgn + '$' + Math.abs(net).toLocaleString('en-US', { maximumFractionDigits: 2 });

    // هاله
    var halo = ctx.createRadialGradient(W / 2, 420, 0, W / 2, 420, 340);
    halo.addColorStop(0, net > 0 ? 'rgba(46,230,166,0.35)' : 'rgba(255,86,116,0.35)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 280, W, 320);

    // عدد با گرادیانت
    var numGrad = ctx.createLinearGradient(W / 2 - 300, 0, W / 2 + 300, 0);
    numGrad.addColorStop(0, pnlColor);
    numGrad.addColorStop(0.5, pnlColor2);
    numGrad.addColorStop(1, pnlColor);

    ctx.shadowColor = pnlColor;
    ctx.shadowBlur = 90;
    ctx.font = '900 118px Inter, sans-serif';
    ctx.fillStyle = numGrad;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nTxt, W / 2, 420);
    ctx.shadowBlur = 0;

    ctx.font = '900 14px Inter, sans-serif';
    ctx.fillStyle = 'rgba(200,215,240,0.7)';
    ctx.textBaseline = 'top';
    ctx.fillText('N E T   P R O F I T   /   L O S S', W / 2, 500);

    // ═══ ۴ کارت آمار ═══
    var cw = 175, ch = 110, gap = 10;
    var tw = cw * 4 + gap * 3;
    var sx = (W - tw) / 2;
    var cy = 570;

    function statCard(x, y, label, val, clr) {
      // Background
      ctx.fillStyle = 'rgba(15,20,35,0.85)';
      rr(ctx, x, y, cw, ch, 16);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(200,215,240,0.15)';
      ctx.lineWidth = 1;
      rr(ctx, x, y, cw, ch, 16);
      ctx.stroke();

      // Top accent
      var ag = ctx.createLinearGradient(x, 0, x + cw, 0);
      ag.addColorStop(0, clr);
      ag.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ag;
      ctx.fillRect(x + 20, y, cw - 40, 2);

      // Value
      ctx.font = '900 30px Inter, sans-serif';
      ctx.fillStyle = clr;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(val, x + cw / 2, y + 45);

      // Label
      ctx.font = '900 10px Inter, sans-serif';
      ctx.fillStyle = 'rgba(200,215,240,0.6)';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + cw / 2, y + 85);
    }

    statCard(sx, cy, 'TOTAL TRADES', trades.length + '', C.primary);
    statCard(sx + cw + gap, cy, 'WIN RATE', wr.toFixed(1) + '%',
             wr >= 50 ? '#2ee6a6' : '#ff5674');
    statCard(sx + (cw + gap) * 2, cy, 'WINS', w + '', '#2ee6a6');
    statCard(sx + (cw + gap) * 3, cy, 'LOSSES', l + '', '#ff5674');

    // ═══ نوار Win Rate ═══
    var barY = 730;
    var barX = 60, barW = W - 120, barH = 14;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rr(ctx, barX, barY, barW, barH, 7);
    ctx.fill();

    ctx.strokeStyle = 'rgba(200,215,240,0.15)';
    ctx.lineWidth = 1;
    rr(ctx, barX, barY, barW, barH, 7);
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
      rr(ctx, barX, barY, Math.max(fw, 14), barH, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.font = '900 12px Inter, sans-serif';
    ctx.fillStyle = 'rgba(200,215,240,0.7)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('WIN RATE ' + wr.toFixed(1) + '%', barX, barY - 10);

    var pfT = isFinite(pf) ? pf.toFixed(2) : '∞';
    ctx.textAlign = 'right';
    ctx.fillStyle = pf >= 1.5 ? '#2ee6a6' : pf < 1 ? '#ff5674' : '#ffb020';
    ctx.fillText('PROFIT FACTOR ' + pfT, barX + barW, barY - 10);

    // ═══ Top Strategies ═══
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

    var sY = 790;

    // Header خط
    var hLine = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
    hLine.addColorStop(0, 'rgba(255,255,255,0)');
    hLine.addColorStop(0.5, C.primary);
    hLine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hLine;
    ctx.fillRect(W / 2 - 200, sY, 400, 1);

    ctx.font = '900 16px Inter, sans-serif';
    ctx.fillStyle = C.secondary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('◆  TOP STRATEGIES  ◆', W / 2, sY + 14);

    strats.slice(0, 4).forEach(function(s, i) {
      var y = sY + 50 + i * 42;
      var isP = s.net > 0;
      var color = isP ? '#2ee6a6' : s.net < 0 ? '#ff5674' : '#8697b8';
      var sign = isP ? '▲' : s.net < 0 ? '▼' : '●';
      var txt = isP ? '+$' + s.net.toFixed(0) : '-$' + Math.abs(s.net).toFixed(0);

      // Row background
      var rowG = ctx.createLinearGradient(80, 0, W - 80, 0);
      rowG.addColorStop(0, isP ? 'rgba(46,230,166,0.06)' : 'rgba(255,86,116,0.06)');
      rowG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rowG;
      rr(ctx, 60, y - 12, W - 120, 34, 10);
      ctx.fill();

      // Rank
      ctx.font = '900 16px Inter, sans-serif';
      ctx.fillStyle = C.primary;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('#' + (i + 1), 85, y + 5);

      // Name
      ctx.font = '800 15px Inter, sans-serif';
      ctx.fillStyle = 'rgba(230,240,255,0.9)';
      var nm = s.name.length > 22 ? s.name.substring(0, 20) + '...' : s.name;
      ctx.fillText(nm, 130, y + 5);

      // PnL
      ctx.font = '900 17px Inter, sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.fillText(txt, W - 90, y + 5);
    });

    // ═══ Footer ═══
    var footY = H - 55;

    var fLine = ctx.createLinearGradient(150, 0, W - 150, 0);
    fLine.addColorStop(0, 'rgba(255,255,255,0)');
    fLine.addColorStop(0.5, 'rgba(200,215,240,0.3)');
    fLine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = fLine;
    ctx.fillRect(150, footY - 15, W - 300, 1);

    ctx.font = '900 14px Inter, sans-serif';
    var footG = ctx.createLinearGradient(W / 2 - 100, 0, W / 2 + 100, 0);
    footG.addColorStop(0, C.primary);
    footG.addColorStop(1, C.secondary);
    ctx.fillStyle = footG;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◆  PO-TRADE  ◆', W / 2, footY);

    ctx.font = '600 10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(200,215,240,0.5)';
    ctx.fillText('github.com/IQZEUS/PO-TREAD', W / 2, footY + 22);

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
