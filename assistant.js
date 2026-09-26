/* ============================================================
   PO-TRADE Assistant v6.0 — ULTIMATE STABLE
   ✅ بدون لرزش، بدون پرش
   ✅ آیکن‌های SVG (نه ایموجی)
   ✅ Tier با 4 سطح (BRONZE/SILVER/GOLD/DIAMOND)
   ✅ Market Clock داخل آنالیز
   ✅ Share Image 1000×1500
   ✅ Confetti, Command Palette
   ============================================================ */
(function() {
  'use strict';

  var $ = function(s, r) { return (r || document).querySelector(s); };
  var $$ = function(s, r) { return Array.from((r || document).querySelectorAll(s)); };

  function getLS(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      if (v === null) return fallback;
      return JSON.parse(v);
    } catch(e) { return fallback; }
  }

  function toISO(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  }

  function formatMoney(n) {
    var v = +n || 0;
    var a = Math.abs(v);
    var s = a.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (v > 0) return '+$' + s;
    if (v < 0) return '-$' + s;
    return '$' + s;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ============================================================
     1) MARKET CLOCK — داخل آنالیز
     ============================================================ */
  var clockTickInterval = null;
  var clockSessionInterval = null;

  function getSessionData() {
    var now = new Date();
    var utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;

    function isOpen(start, end) {
      if (start < end) return utcHour >= start && utcHour < end;
      return utcHour >= start || utcHour < end;
    }

    return [
      { flag: '🇦🇺', name: 'Sydney',   hours: '22–07', open: isOpen(22, 7) },
      { flag: '🇯🇵', name: 'Tokyo',    hours: '00–09', open: isOpen(0, 9) },
      { flag: '🇬🇧', name: 'London',   hours: '08–17', open: isOpen(8, 17) },
      { flag: '🇺🇸', name: 'New York', hours: '13–22', open: isOpen(13, 22) }
    ];
  }

  function formatUTC() {
    var d = new Date();
    return String(d.getUTCHours()).padStart(2, '0') + ':' +
           String(d.getUTCMinutes()).padStart(2, '0') + ':' +
           String(d.getUTCSeconds()).padStart(2, '0');
  }

  function buildMarketClockHTML() {
    var sessions = getSessionData();
    return '<div class="pt-market-clock">' +
      '<div class="pmc-head">' +
        '<div class="pmc-title">' +
          '<div class="pmc-icon">🌍</div>' +
          '<div>' +
            '<h3>بازارهای جهانی</h3>' +
            '<p>ساعت زنده معاملاتی</p>' +
          '</div>' +
        '</div>' +
        '<div class="pmc-time">' +
          '<div class="pmc-clock" id="pmcClock">--:--:--</div>' +
          '<div class="pmc-utc">UTC</div>' +
        '</div>' +
      '</div>' +
      '<div class="pmc-body" id="pmcBody">' +
        sessions.map(function(s) {
          return '<div class="pmc-session ' + (s.open ? 'open' : 'closed') + '">' +
            '<div class="pmc-flag">' + s.flag + '</div>' +
            '<div class="pmc-info">' +
              '<div class="pmc-name">' + s.name + '</div>' +
              '<div class="pmc-hours">' + s.hours + '</div>' +
            '</div>' +
            '<div class="pmc-status">' +
              '<span class="pmc-dot"></span>' +
              '<span>' + (s.open ? 'باز' : 'بسته') + '</span>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  function initMarketClock() {
    document.querySelectorAll('.market-clock').forEach(function(c) { c.remove(); });

    var analysisPage = document.getElementById('page-analysis');
    if (!analysisPage) return;

    var host = document.getElementById('market-clock-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'market-clock-host';
      var firstChild = analysisPage.firstElementChild;
      if (firstChild) analysisPage.insertBefore(host, firstChild);
      else analysisPage.appendChild(host);
    }
    host.innerHTML = buildMarketClockHTML();

    function tick() {
      var clock = document.getElementById('pmcClock');
      if (clock) clock.textContent = formatUTC();
    }
    tick();
    if (clockTickInterval) clearInterval(clockTickInterval);
    clockTickInterval = setInterval(tick, 1000);

    if (clockSessionInterval) clearInterval(clockSessionInterval);
    clockSessionInterval = setInterval(function() {
      var body = document.getElementById('pmcBody');
      if (!body) return;
      var sessions = getSessionData();
      sessions.forEach(function(s, i) {
        var el = body.children[i];
        if (!el) return;
        el.classList.toggle('open', s.open);
        el.classList.toggle('closed', !s.open);
        var status = el.querySelector('.pmc-status span:last-child');
        if (status) status.textContent = s.open ? 'باز' : 'بسته';
      });
    }, 60000);
  }

  /* ============================================================
     2) TIER SYSTEM — بدون ایموجی، با داده data-tier
     ============================================================ */
  function calculateTier(trades) {
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var monthStartISO = toISO(monthStart);

    var monthTrades = trades.filter(function(t) { return t.date >= monthStartISO; });

    var net = 0, wins = 0, losses = 0;
    monthTrades.forEach(function(t) {
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      net += p;
      if (t.result === 'win') wins++;
      else if (t.result === 'loss') losses++;
    });
    var closed = wins + losses;
    var winRate = closed ? (wins / closed) * 100 : 0;

    var tiers = [
      { key: 'bronze',  min: 0,     name: 'BRONZE',  color: '#cd7f32' },
      { key: 'silver',  min: 1000,  name: 'SILVER',  color: '#c0c0d2' },
      { key: 'gold',    min: 2500,  name: 'GOLD',    color: '#ffc828' },
      { key: 'diamond', min: 5000,  name: 'DIAMOND', color: '#7dd8ff' }
    ];

    var current = tiers[0];
    var currentIdx = 0;
    for (var i = tiers.length - 1; i >= 0; i--) {
      if (net >= tiers[i].min) {
        current = tiers[i];
        currentIdx = i;
        break;
      }
    }

    var next = tiers[currentIdx + 1];
    var progressPct = 100;
    var progressLabel = 'به بالاترین سطح رسیدی';

    if (next) {
      var range = next.min - current.min;
      var inRange = net - current.min;
      progressPct = Math.max(0, Math.min(100, (inRange / range) * 100));
      var remaining = next.min - net;
      progressLabel = 'تا سطح ' + next.name + ': ' + formatMoney(remaining);
    }

    var subtitle = monthTrades.length
      ? monthTrades.length + ' معامله این ماه'
      : 'هنوز معامله‌ای این ماه ثبت نکردی';

    var ladder = tiers.map(function(t, i) {
      return {
        key: t.key,
        name: t.name,
        color: t.color,
        unlocked: i <= currentIdx,
        current: i === currentIdx
      };
    });

    return {
      key: current.key,
      name: current.name,
      color: current.color,
      subtitle: subtitle,
      monthPnL: formatMoney(net),
      monthCount: monthTrades.length + '',
      winRate: winRate.toFixed(1) + '٪',
      progressPct: progressPct.toFixed(0) + '٪',
      progressLabel: progressLabel,
      ladder: ladder,
      net: net
    };
  }

  /* ============================================================
     3) ANALYSIS ASSISTANT
     ============================================================ */
  function analyzePerformance(trades) {
    if (!trades || !trades.length) {
      return {
        mood: 'neutral',
        icon: '🤖',
        title: '👋 خوش آمدی!',
        text: 'هنوز معامله‌ای ثبت نکردی. اولین معامله رو ثبت کن تا <strong>تحلیل هوشمند</strong> بگیری.',
        badges: []
      };
    }

    var wins = 0, losses = 0, be = 0, net = 0, gp = 0, gl = 0;
    var byStrategy = {};
    var maxStreak = 0, lossStreak = 0, maxLossStreak = 0;

    var sorted = trades.slice().sort(function(a, b) {
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

    sorted.forEach(function(t) {
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      net += p;

      if (t.result === 'win') {
        wins++; gp += p;
        maxStreak++;
        lossStreak = 0;
      } else if (t.result === 'loss') {
        losses++; gl += Math.abs(p);
        lossStreak++;
        if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
      } else be++;

      var s = t.strategy || '—';
      if (!byStrategy[s]) byStrategy[s] = { w: 0, l: 0, net: 0, count: 0 };
      byStrategy[s].count++;
      byStrategy[s].net += p;
      if (t.result === 'win') byStrategy[s].w++;
      else if (t.result === 'loss') byStrategy[s].l++;
    });

    var closed = wins + losses;
    var winRate = closed ? (wins / closed) * 100 : 0;
    var pf = gl > 0 ? gp / gl : (gp > 0 ? Infinity : 0);

    var strategies = Object.keys(byStrategy).map(function(k) {
      var s = byStrategy[k];
      var c = s.w + s.l;
      return { name: k, net: s.net, count: s.count, winRate: c ? (s.w / c) * 100 : 0 };
    }).sort(function(a, b) { return b.net - a.net; });

    var bestStrategy = strategies[0];
    var worstStrategy = strategies[strategies.length - 1];
    var profitable = net > 0;
    var mood = profitable ? 'good' : net < 0 ? 'bad' : 'neutral';

    var title, text, icon;
    if (profitable) {
      icon = '🏆';
      title = '🎉 عملکردت سودده بوده!';
      text = 'خالص سودت <strong>' + formatMoney(net) + '</strong> بوده. ';
      if (bestStrategy && bestStrategy.net > 0) {
        text += 'بهترین استراتژی‌ت <em>' + bestStrategy.name + '</em> با سود <strong>' +
                formatMoney(bestStrategy.net) + '</strong> سوده. ';
      }
      if (winRate >= 65) {
        text += 'وین‌ریت <strong>' + winRate.toFixed(1) + '٪</strong> یعنی دقت ورودت فوق‌العاده‌ست!';
      } else if (winRate >= 50) {
        text += 'وین‌ریت <strong>' + winRate.toFixed(1) + '٪</strong> بالای ۵۰٪ — عملکرد متعادل و حرفه‌ای.';
      } else if (winRate >= 40) {
        text += 'وین‌ریت <strong>' + winRate.toFixed(1) + '٪</strong> پایین‌تر از میانه، ولی مدیریت ریسکت خوبه.';
      } else {
        text += 'وین‌ریت <strong>' + winRate.toFixed(1) + '٪</strong> کمه — دقت ورودت رو افزایش بده.';
      }
    } else if (net < 0) {
      icon = '🎯';
      title = '⚠️ عملکردت در ضرر بوده';
      text = 'خالص ضررت <strong>' + formatMoney(net) + '</strong> بوده. ';
      if (worstStrategy && worstStrategy.net < 0) {
        text += 'بیشترین ضرر از <em>' + worstStrategy.name + '</em> با <strong>' +
                formatMoney(worstStrategy.net) + '</strong> آمده. ';
      }
      if (winRate < 40) {
        text += 'وین‌ریت <strong>' + winRate.toFixed(1) + '٪</strong> ضعیفه — دقت ورود رو بازبینی کن.';
      } else if (winRate >= 50) {
        text += 'وین‌ریت <strong>' + winRate.toFixed(1) + '٪</strong> مناسبه، پس مشکل از مدیریت ریسک یا اندازه حجمه.';
      } else {
        text += 'وین‌ریت <strong>' + winRate.toFixed(1) + '٪</strong> قابل قبول، ولی نسبت سود به ضرر رو بهتر کن.';
      }
      if (maxLossStreak >= 3) {
        text += ' <strong>' + maxLossStreak + ' ضرر پشت‌سرهم</strong> داشتی — چک‌لیستت رو جدی بگیر.';
      }
    } else {
      icon = '📊';
      title = '📊 عملکردت سربه‌سر است';
      text = 'نه سود کرده‌ای، نه ضرر. ';
      if (bestStrategy) {
        text += 'ولی <em>' + bestStrategy.name + '</em> پتانسیل داره — روش کار کن.';
      }
    }

    var badges = [];
    if (bestStrategy && bestStrategy.net > 0) {
      badges.push({ label: '🏆 ' + bestStrategy.name + ' — ' + formatMoney(bestStrategy.net), cls: 'good' });
    }
    if (worstStrategy && worstStrategy !== bestStrategy && worstStrategy.net < 0) {
      badges.push({ label: '📉 ' + worstStrategy.name + ' — ' + formatMoney(worstStrategy.net), cls: 'bad' });
    }
    badges.push({ label: '🎯 وین‌ریت ' + winRate.toFixed(1) + '٪', cls: winRate >= 55 ? 'good' : winRate < 45 ? 'bad' : 'neutral' });
    if (isFinite(pf)) {
      badges.push({ label: '⚖️ PF ' + pf.toFixed(2), cls: pf >= 1.5 ? 'good' : pf < 1 ? 'bad' : 'neutral' });
    }
    if (maxStreak >= 3) {
      badges.push({ label: '🔥 ' + maxStreak + ' برد متوالی', cls: 'good' });
    }

    return { mood: mood, icon: icon, title: title, text: text, badges: badges };
  }

  function renderAssistant() {
    var host = $('#assistant-host');
    if (!host) return;
    var trades = getLS('po.v4.trades', []);
    var a = analyzePerformance(trades);
    var tier = calculateTier(trades);

    host.innerHTML =
      '<div class="tier-card ' + tier.key + '">' +
        '<div class="tier-head">' +
          '<div class="tier-icon-wrap">' +
            '<div class="tier-icon"></div>' +
          '</div>' +
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
          '<div class="tier-progress-label">' +
            '<span>' + tier.progressLabel + '</span>' +
            '<span>' + tier.progressPct + '</span>' +
          '</div>' +
          '<div class="tier-progress-bar"><div class="tier-progress-fill" style="width:' + tier.progressPct + '"></div></div>' +
        '</div>' +
        '<div class="tier-ladder">' +
          tier.ladder.map(function(s) {
            return '<div class="tier-step' + (s.unlocked ? ' unlocked' : '') + (s.current ? ' current' : '') + '" data-tier="' + s.key + '" style="color:' + s.color + '">' +
              '<span class="ico"></span>' +
              '<span class="nm">' + s.name + '</span>' +
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
            (a.badges.length
              ? '<div class="assistant-badges">' +
                  a.badges.map(function(b) {
                    return '<span class="assistant-badge ' + b.cls + '">' + b.label + '</span>';
                  }).join('') +
                '</div>'
              : '') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ============================================================
     4) GOALS BANNER
     ============================================================ */
  function renderGoalsBanner() {
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
      var dow = now.getDay();
      var daysSinceSat = (dow + 1) % 7;
      var st = new Date(now); st.setDate(now.getDate() - daysSinceSat);
      var en = new Date(st); en.setDate(st.getDate() + 6);
      startISO = toISO(st); endISO = toISO(en);
    }
    var periodTrades = trades.filter(function(t) { return t.date >= startISO && t.date <= endISO; });

    var wins = 0, losses = 0, net = 0;
    periodTrades.forEach(function(t) {
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      net += p;
      if (t.result === 'win') wins++;
      else if (t.result === 'loss') losses++;
    });
    var closed = wins + losses;
    var stat = {
      total: periodTrades.length,
      net: net,
      winRate: closed ? (wins / closed) * 100 : 0
    };

    var banner = null;

    if (goal && goal.target) {
      var current = 0;
      if (goal.metric === 'pnl') current = stat.net;
      else if (goal.metric === 'trades') current = stat.total;
      else if (goal.metric === 'winrate') current = stat.winRate;

      var progress = goal.target > 0 ? Math.min(100, (current / goal.target) * 100) : 0;

      function fmt(v, m) {
        if (m === 'pnl') return formatMoney(v);
        if (m === 'trades') return Math.round(v) + '';
        if (m === 'winrate') return (+v).toFixed(1) + '٪';
        return v;
      }

      if (progress >= 100) {
        banner = {
          cls: 'success', icon: '🏆',
          title: '🎉 تبریک! به هدفت رسیدی!',
          sub: 'هدف ' + (goal.period === 'week' ? 'هفتگی' : 'ماهانه') + 'ت با موفقیت تکمیل شد',
          stats: [
            { v: fmt(current, goal.metric), l: 'دستیابی' },
            { v: fmt(goal.target, goal.metric), l: 'هدف' },
            { v: '۱۰۰٪', l: 'پیشرفت' }
          ],
          progress: 100
        };
      } else if (progress >= 70) {
        banner = {
          cls: 'warning', icon: '⚡',
          title: 'داری نزدیک میشی!',
          sub: 'فقط ' + (100 - progress).toFixed(0) + '٪ تا تکمیل هدف مونده',
          stats: [
            { v: fmt(current, goal.metric), l: 'فعلی' },
            { v: fmt(goal.target, goal.metric), l: 'هدف' },
            { v: progress.toFixed(0) + '٪', l: 'پیشرفت' }
          ],
          progress: progress
        };
      } else {
        banner = {
          cls: 'neutral', icon: '🎯',
          title: 'هدف ' + (goal.period === 'week' ? 'هفتگی' : 'ماهانه'),
          sub: 'در مسیر رسیدن به هدفت هستی',
          stats: [
            { v: fmt(current, goal.metric), l: 'فعلی' },
            { v: fmt(goal.target, goal.metric), l: 'هدف' },
            { v: progress.toFixed(0) + '٪', l: 'پیشرفت' }
          ],
          progress: progress
        };
      }
    }

    if (rules && rules.enabled && rules.dailyLoss > 0) {
      var today = toISO(new Date());
      var todayNet = 0;
      trades.filter(function(t) { return t.date === today; }).forEach(function(t) {
        todayNet += t.result === 'win' ? Math.abs(+t.amount || 0) :
                    t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      });
      var todayLoss = todayNet < 0 ? -todayNet : 0;
      var du = (todayLoss / rules.dailyLoss) * 100;

      if (du >= 100) {
        banner = {
          cls: 'danger', icon: '🚨',
          title: 'حد ضرر روزانه نقض شد!',
          sub: 'برای امروز معامله رو متوقف کن',
          stats: [
            { v: formatMoney(-todayLoss), l: 'ضرر امروز' },
            { v: formatMoney(-rules.dailyLoss), l: 'حد مجاز' },
            { v: du.toFixed(0) + '٪', l: 'مصرف' }
          ],
          progress: Math.min(100, du)
        };
      } else if (du >= 80 && (!banner || banner.cls === 'neutral')) {
        banner = {
          cls: 'warning', icon: '⚠️',
          title: 'نزدیک حد ضرر روزانه',
          sub: 'احتیاط کن — ' + du.toFixed(0) + '٪ از حد مجاز مصرف شده',
          stats: [
            { v: formatMoney(-todayLoss), l: 'ضرر امروز' },
            { v: formatMoney(-rules.dailyLoss), l: 'حد مجاز' },
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

  /* ============================================================
     5) SHARE IMAGE — EPIC
     ============================================================ */
  function drawShareImage() {
    var trades = getLS('po.v4.trades', []);
    var tier = calculateTier(trades);

    var W = 1000, H = 1500;
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    var bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#02030a');
    bgGrad.addColorStop(0.5, '#050a18');
    bgGrad.addColorStop(1, '#02030a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    function drawOrb(x, y, r, color) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    drawOrb(150, 200, 400, 'rgba(46,230,166,0.35)');
    drawOrb(880, 1300, 450, 'rgba(91,140,255,0.35)');
    drawOrb(500, 750, 350, 'rgba(255,95,162,0.22)');
    drawOrb(850, 300, 300, 'rgba(186,104,255,0.28)');

    for (var i = 0; i < 220; i++) {
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.8 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(120,150,200,0.05)';
    ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = 0; y < H; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    var topBar = ctx.createLinearGradient(0, 0, W, 0);
    topBar.addColorStop(0, 'rgba(46,230,166,0)');
    topBar.addColorStop(0.2, '#2ee6a6');
    topBar.addColorStop(0.5, '#5b8cff');
    topBar.addColorStop(0.8, '#ba68ff');
    topBar.addColorStop(1, 'rgba(255,95,162,0)');
    ctx.fillStyle = topBar;
    ctx.fillRect(0, 0, W, 4);

    var tierColors = {
      bronze:  { main: '#cd7f32', soft: 'rgba(205,127,50,0.2)' },
      silver:  { main: '#c0c0d2', soft: 'rgba(192,192,210,0.2)' },
      gold:    { main: '#ffc828', soft: 'rgba(255,200,40,0.2)' },
      diamond: { main: '#7dd8ff', soft: 'rgba(120,220,255,0.2)' }
    };
    var tc = tierColors[tier.key] || tierColors.bronze;

    var badgeW = 260, badgeH = 82;
    var badgeX = (W - badgeW) / 2;
    var badgeY = 70;

    ctx.shadowColor = tc.main;
    ctx.shadowBlur = 60;
    ctx.fillStyle = tc.soft;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 41);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = tc.main;
    ctx.lineWidth = 3;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 41);
    ctx.stroke();

    ctx.fillStyle = tc.main;
    ctx.font = '900 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tier.name, W / 2, badgeY + badgeH / 2 + 2);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var titleGrad = ctx.createLinearGradient(200, 0, 800, 0);
    titleGrad.addColorStop(0, '#2ee6a6');
    titleGrad.addColorStop(0.5, '#5b8cff');
    titleGrad.addColorStop(1, '#ff5fa2');
    ctx.fillStyle = titleGrad;
    ctx.font = '900 72px Inter, sans-serif';
    ctx.fillText('PO-TRADE', W / 2, 200);

    ctx.font = '700 15px Inter, sans-serif';
    ctx.fillStyle = 'rgba(134,151,184,1)';
    ctx.fillText('PERFORMANCE REPORT  •  ' + new Date().toISOString().slice(0, 10), W / 2, 290);

    var wins = 0, losses = 0, be = 0, net = 0, gp = 0, gl = 0;
    var bestTrade = 0, worstTrade = 0;
    trades.forEach(function(t) {
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      net += p;
      if (t.result === 'win') { wins++; gp += p; if (p > bestTrade) bestTrade = p; }
      else if (t.result === 'loss') { losses++; gl += Math.abs(p); if (p < worstTrade) worstTrade = p; }
      else be++;
    });
    var closed = wins + losses;
    var winRate = closed ? (wins / closed) * 100 : 0;
    var pf = gl > 0 ? gp / gl : (gp > 0 ? Infinity : 0);
    var avgWin = wins ? gp / wins : 0;
    var avgLoss = losses ? gl / losses : 0;

    var pnlColor = net > 0 ? '#2ee6a6' : net < 0 ? '#ff5674' : '#8697b8';
    var sign = net > 0 ? '+' : net < 0 ? '-' : '';
    var netTxt = sign + '$' + Math.abs(net).toLocaleString('en-US', { maximumFractionDigits: 2 });

    var pnlGlow = ctx.createRadialGradient(W / 2, 520, 0, W / 2, 520, 420);
    pnlGlow.addColorStop(0, net > 0 ? 'rgba(46,230,166,0.3)' : 'rgba(255,86,116,0.3)');
    pnlGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pnlGlow;
    ctx.fillRect(0, 320, W, 500);

    ctx.shadowColor = pnlColor;
    ctx.shadowBlur = 80;
    ctx.font = '900 138px Inter, sans-serif';
    ctx.fillStyle = pnlColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(netTxt, W / 2, 520);
    ctx.shadowBlur = 0;

    ctx.font = '800 16px Inter, sans-serif';
    ctx.fillStyle = 'rgba(134,151,184,1)';
    ctx.textBaseline = 'top';
    ctx.fillText('NET PROFIT / LOSS', W / 2, 630);

    for (var k = 0; k < 28; k++) {
      var angle = (k / 28) * Math.PI * 2;
      var radius = 340 + Math.random() * 90;
      var sx = W / 2 + Math.cos(angle) * radius;
      var sy = 520 + Math.sin(angle) * radius * 0.65;
      ctx.fillStyle = k % 3 === 0 ? tc.main : 'rgba(255,255,255,0.55)';
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.random() * 2.5 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    var cardW = 210, cardH = 140, gap = 24;
    var totalW = cardW * 2 + gap;
    var startX = (W - totalW) / 2;
    var cardY = 720;

    function statCard(x, y, label, value, color, icon) {
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 32;
      ctx.shadowOffsetY = 12;

      var g = ctx.createLinearGradient(x, y, x, y + cardH);
      g.addColorStop(0, 'rgba(20,29,51,0.95)');
      g.addColorStop(1, 'rgba(8,12,25,0.95)');
      ctx.fillStyle = g;
      roundRect(ctx, x, y, cardW, cardH, 22);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      var accent = ctx.createLinearGradient(x + 20, 0, x + cardW - 20, 0);
      accent.addColorStop(0, color);
      accent.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = accent;
      ctx.fillRect(x + 20, y, cardW - 40, 3);

      ctx.strokeStyle = 'rgba(120,150,200,0.3)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, y, cardW, cardH, 22);
      ctx.stroke();

      ctx.font = '26px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = color;
      ctx.fillText(icon, x + 18, y + 16);

      ctx.font = '900 40px Inter, sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value, x + cardW / 2, y + 78);

      ctx.font = '800 12px Inter, sans-serif';
      ctx.fillStyle = 'rgba(134,151,184,1)';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + cardW / 2, y + 116);
    }

    statCard(startX, cardY, 'TOTAL TRADES', trades.length + '', '#eef3ff', '📊');
    statCard(startX + cardW + gap, cardY, 'WIN RATE', winRate.toFixed(1) + '%',
             winRate >= 50 ? '#2ee6a6' : '#ff5674', '🎯');
    statCard(startX, cardY + cardH + gap, 'WINS', wins + '', '#2ee6a6', '✅');
    statCard(startX + cardW + gap, cardY + cardH + gap, 'LOSSES', losses + '', '#ff5674', '❌');

    var barY = cardY + cardH * 2 + gap + 70;
    var barX = 80, barW = W - 160, barH = 16;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, barX, barY, barW, barH, 10);
    ctx.fill();

    ctx.strokeStyle = 'rgba(120,150,200,0.2)';
    ctx.lineWidth = 1;
    roundRect(ctx, barX, barY, barW, barH, 10);
    ctx.stroke();

    var fillW = (winRate / 100) * barW;
    var fillGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    fillGrad.addColorStop(0, '#2ee6a6');
    fillGrad.addColorStop(0.5, '#5b8cff');
    fillGrad.addColorStop(1, '#ba68ff');
    ctx.fillStyle = fillGrad;
    ctx.shadowColor = '#2ee6a6';
    ctx.shadowBlur = 32;
    roundRect(ctx, barX, barY, Math.max(fillW, 12), barH, 10);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = '900 13px Inter, sans-serif';
    ctx.fillStyle = 'rgba(134,151,184,1)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('WIN RATE', barX, barY - 12);

    var pfTxt = isFinite(pf) ? pf.toFixed(2) : '∞';
    ctx.textAlign = 'right';
    ctx.fillStyle = pf >= 1.5 ? '#2ee6a6' : pf < 1 ? '#ff5674' : '#ffb020';
    ctx.fillText('PROFIT FACTOR ' + pfTxt, barX + barW, barY - 12);

    var miniY = barY + 70;
    var miniW = (W - 160) / 3;

    function miniStat(x, label, value, color) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = '900 26px Inter, sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(value, x, miniY);
      ctx.font = '800 12px Inter, sans-serif';
      ctx.fillStyle = 'rgba(134,151,184,1)';
      ctx.fillText(label, x, miniY + 34);
    }

    miniStat(80 + miniW / 2, 'AVG WIN', '+$' + avgWin.toFixed(0), '#2ee6a6');
    miniStat(80 + miniW * 1.5, 'AVG LOSS', '-$' + avgLoss.toFixed(0), '#ff5674');
    miniStat(80 + miniW * 2.5, 'BEST', '+$' + bestTrade.toFixed(0), '#ffc828');

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    var footerLine = ctx.createLinearGradient(200, 0, 800, 0);
    footerLine.addColorStop(0, 'rgba(46,230,166,0)');
    footerLine.addColorStop(0.5, 'rgba(120,150,200,0.4)');
    footerLine.addColorStop(1, 'rgba(255,95,162,0)');
    ctx.fillStyle = footerLine;
    ctx.fillRect(200, H - 90, 600, 1);

    ctx.font = '700 12px Inter, sans-serif';
    ctx.fillStyle = 'rgba(134,151,184,0.55)';
    ctx.fillText('Generated by PO-TRADE  •  github.com/IQZEUS/PO-TREAD', W / 2, H - 40);

    var vignette = ctx.createRadialGradient(W / 2, H / 2, 400, W / 2, H / 2, 900);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    return canvas;
  }

  function initShare() {
    var host = $('#share-host');
    if (!host) return;

    host.innerHTML =
      '<div class="share-card">' +
        '<div class="share-head">' +
          '<h3>📤 اشتراک‌گذاری وضعیت من</h3>' +
          '<div class="share-actions">' +
            '<button class="share-btn" data-act="preview">👁️ پیش‌نمایش</button>' +
            '<button class="share-btn primary" data-act="download">⬇️ دانلود عکس</button>' +
            '<button class="share-btn" data-act="share">📱 اشتراک‌گذاری</button>' +
          '</div>' +
        '</div>' +
        '<div class="share-preview" id="sharePreviewWrap"></div>' +
      '</div>';

    host.addEventListener('click', async function(e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var act = btn.dataset.act;

      var canvas = drawShareImage();
      var wrap = $('#sharePreviewWrap');

      if (act === 'preview') {
        wrap.innerHTML = '';
        var c2 = canvas.cloneNode(true);
        var ctx2 = c2.getContext('2d');
        ctx2.drawImage(canvas, 0, 0);
        wrap.appendChild(c2);
        wrap.classList.add('show');
      } else if (act === 'download') {
        var url = canvas.toDataURL('image/png');
        var a = document.createElement('a');
        a.href = url;
        a.download = 'po-trade-report-' + new Date().toISOString().slice(0, 10) + '.png';
        a.click();
      } else if (act === 'share') {
        canvas.toBlob(async function(blob) {
          var file = new File([blob], 'po-trade-report.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'PO-TRADE Report',
                text: 'وضعیت معاملات من در PO-TRADE'
              });
            } catch(err) {
              if (err.name !== 'AbortError') console.warn(err);
            }
          } else {
            alert('مرورگرت از اشتراک‌گذاری مستقیم پشتیبانی نمی‌کند. از «دانلود عکس» استفاده کن.');
          }
        });
      }
    });
  }

  /* ============================================================
     6) THEME SWITCHER
     ============================================================ */
  function initThemeSwitcher() {
    var host = $('#theme-switcher-host');
    if (!host) return;

    var current = localStorage.getItem('po.v4.theme') || 'obsidian';
    if (current === 'dark') current = 'obsidian';
    if (current === 'light') current = 'aurora';

    host.innerHTML =
      '<div class="theme-switcher">' +
        '<button class="theme-pick" data-theme-pick="obsidian" title="Obsidian"></button>' +
        '<button class="theme-pick" data-theme-pick="aurora" title="Aurora"></button>' +
        '<button class="theme-pick" data-theme-pick="cyber" title="Cyberpunk"></button>' +
      '</div>';

    function setActive(name) {
      $$('.theme-pick', host).forEach(function(b) {
        b.classList.toggle('active', b.dataset.themePick === name);
      });
    }
    setActive(current);

    host.addEventListener('click', function(e) {
      var btn = e.target.closest('.theme-pick');
      if (!btn) return;
      var name = btn.dataset.themePick;
      document.documentElement.dataset.theme = name;
      localStorage.setItem('po.v4.theme', name);
      setActive(name);
      var tb = document.querySelector('.theme-icon');
      if (tb) tb.textContent = name === 'aurora' ? '☀️' : name === 'cyber' ? '⚡' : '🌙';
      window.dispatchEvent(new Event('resize'));
    });
  }

  function moveThemeSwitcher() {
    var dd = document.getElementById('userDropdown');
    var ts = document.getElementById('theme-switcher-host');
    if (!dd || !ts || ts.parentElement === dd) return;
    var actions = dd.querySelector('.user-actions');
    if (actions) dd.insertBefore(ts, actions);
    else dd.appendChild(ts);
  }

  /* ============================================================
     7) STREAK BADGE
     ============================================================ */
  function calcStreak() {
    var trades = getLS('po.v4.trades', []);
    if (!trades.length) return 0;

    var byDay = {};
    trades.forEach(function(t) {
      if (!t.date) return;
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      byDay[t.date] = (byDay[t.date] || 0) + p;
    });

    var today = new Date();
    var streak = 0;
    for (var i = 0; i < 365; i++) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      var iso = d.getFullYear() + '-' +
                String(d.getMonth() + 1).padStart(2, '0') + '-' +
                String(d.getDate()).padStart(2, '0');
      var net = byDay[iso];
      if (net === undefined) { if (i === 0) continue; break; }
      if (net > 0) streak++;
      else break;
    }
    return streak;
  }

  function initStreakBadge() {
    var brand = document.querySelector('.brand');
    if (!brand || document.querySelector('.streak-badge')) return;
    var el = document.createElement('div');
    el.className = 'streak-badge';
    el.title = 'تعداد روزهایی که پشت سر هم سود کرده‌ای';
    brand.appendChild(el);

    function render() {
      var s = calcStreak();
      if (s > 0) {
        el.classList.remove('cold');
        el.classList.add('hot');
        el.innerHTML = '<span class="fire">🔥</span><span class="num">' + s + '</span><span class="lbl">روز سوددهی متوالی</span>';
      } else {
        el.classList.remove('hot');
        el.classList.add('cold');
        el.innerHTML = '<span class="fire">❄️</span><span class="lbl">هنوز استریکی نداری</span>';
      }
    }
    render();
    setInterval(render, 30000);
  }

  /* ============================================================
     8) CONFETTI
     ============================================================ */
  function fireConfetti() {
    if (document.querySelector('.confetti-canvas')) return;
    var canvas = document.createElement('canvas');
    canvas.className = 'confetti-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var colors = ['#2ee6a6', '#5b8cff', '#ff5fa2', '#ffb020', '#c78aff', '#f6ff00'];
    var pieces = [];
    for (var i = 0; i < 180; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        w: 8 + Math.random() * 8,
        h: 6 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vr: -0.18 + Math.random() * 0.36
      });
    }
    var start = Date.now();
    var duration = 4500;
    function frame() {
      var elapsed = Date.now() - start;
      var alpha = elapsed < duration - 500 ? 1 : Math.max(0, (duration - elapsed) / 500);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = alpha;
      pieces.forEach(function(p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (elapsed < duration) requestAnimationFrame(frame);
      else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  var lastCelebrated = '';
  function checkGoalComplete() {
    var banner = document.querySelector('.goal-banner.success');
    if (!banner) return;
    var title = banner.querySelector('.goal-banner-title');
    if (!title) return;
    var text = title.textContent;
    if (text && text !== lastCelebrated) {
      lastCelebrated = text;
      fireConfetti();
    }
  }

  /* ============================================================
     9) COMMAND PALETTE
     ============================================================ */
  function initCommandPalette() {
    if (document.querySelector('.cmd-overlay')) return;

    var overlay = document.createElement('div');
    overlay.className = 'cmd-overlay';
    overlay.innerHTML =
      '<div class="cmd-card" role="dialog">' +
        '<div class="cmd-input-wrap">' +
          '<span class="icon">🔍</span>' +
          '<input class="cmd-input" type="text" placeholder="جستجو یا دستور..." autocomplete="off" />' +
        '</div>' +
        '<div class="cmd-list" id="cmdList"></div>' +
        '<div class="cmd-footer">' +
          '<span><kbd>↑</kbd><kbd>↓</kbd> حرکت</span>' +
          '<span><kbd>Enter</kbd> انتخاب • <kbd>Esc</kbd> بستن</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var input = overlay.querySelector('.cmd-input');
    var list = overlay.querySelector('#cmdList');
    var active = 0;

    function switchTab(name) {
      var tab = document.querySelector('.tab[data-view="' + name + '"]');
      if (tab) tab.click();
    }
    function setTheme(name) {
      document.documentElement.dataset.theme = name;
      localStorage.setItem('po.v4.theme', name);
      document.querySelectorAll('.theme-pick').forEach(function(b) {
        b.classList.toggle('active', b.dataset.themePick === name);
      });
      window.dispatchEvent(new Event('resize'));
    }

    var commands = [
      { emoji: '✍️', label: 'ثبت معامله جدید', action: function() { switchTab('add'); } },
      { emoji: '📊', label: 'رفتن به آنالیز', action: function() { switchTab('analysis'); } },
      { emoji: '📅', label: 'رفتن به تقویم', action: function() { switchTab('calendar'); } },
      { emoji: '📋', label: 'رفتن به معاملات', action: function() { switchTab('trades'); } },
      { emoji: '⚙️', label: 'رفتن به تنظیمات', action: function() { switchTab('settings'); } },
      { emoji: '🌙', label: 'تم Obsidian (تیره)', action: function() { setTheme('obsidian'); } },
      { emoji: '☀️', label: 'تم Aurora (روشن)', action: function() { setTheme('aurora'); } },
      { emoji: '⚡', label: 'تم Cyber (نئون)', action: function() { setTheme('cyber'); } },
      { emoji: '🌐', label: 'تغییر زبان', action: function() { var b = document.getElementById('lang-btn'); if (b) b.click(); } },
      { emoji: '🔄', label: 'همگام‌سازی با سرور', action: function() { if (window.PT_Sync) window.PT_Sync.forcePush(); } },
      { emoji: '📦', label: 'خروجی JSON', action: function() { var b = document.getElementById('export-btn'); if (b) b.click(); } },
      { emoji: '🚪', label: 'خروج از حساب', action: function() { if (window.poLogout) window.poLogout(); } }
    ];

    var filtered = commands.slice();

    function render() {
      if (!filtered.length) {
        list.innerHTML = '<div class="cmd-empty">چیزی پیدا نشد</div>';
        return;
      }
      list.innerHTML = filtered.map(function(c, i) {
        return '<button class="cmd-item' + (i === active ? ' active' : '') + '" data-i="' + i + '">' +
          '<span class="emoji">' + c.emoji + '</span>' +
          '<span class="label">' + c.label + '</span>' +
        '</button>';
      }).join('');
    }

    function filter(q) {
      q = (q || '').trim().toLowerCase();
      filtered = !q ? commands.slice() : commands.filter(function(c) {
        return c.label.toLowerCase().indexOf(q) !== -1;
      });
      active = 0;
      render();
    }

    function open() {
      overlay.classList.add('open');
      input.value = '';
      filter('');
      setTimeout(function() { input.focus(); }, 100);
    }
    function close() { overlay.classList.remove('open'); }
    function execute() {
      if (!filtered[active]) return;
      var cmd = filtered[active];
      close();
      setTimeout(function() { cmd.action(); }, 150);
    }

    input.addEventListener('input', function() { filter(this.value); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % filtered.length; render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + filtered.length) % filtered.length; render(); }
      else if (e.key === 'Enter') { e.preventDefault(); execute(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    list.addEventListener('click', function(e) {
      var item = e.target.closest('.cmd-item');
      if (!item) return;
      active = parseInt(item.dataset.i, 10);
      execute();
    });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (overlay.classList.contains('open')) close();
        else open();
      }
    });
  }

  /* ============================================================
     10) KBD HINT
     ============================================================ */
  function showKbdHint() {
    if (localStorage.getItem('po.kbdhint.seen') === '1') return;
    setTimeout(function() {
      var h = document.createElement('div');
      h.className = 'kbd-hint';
      h.innerHTML =
        '<span>💡</span>' +
        '<kbd>Ctrl</kbd><kbd>K</kbd>' +
        '<span>پنل دستور</span>' +
        '<button class="close">✕</button>';
      document.body.appendChild(h);
      h.querySelector('.close').addEventListener('click', function() {
        h.remove();
        localStorage.setItem('po.kbdhint.seen', '1');
      });
      setTimeout(function() {
        if (document.body.contains(h)) {
          h.remove();
          localStorage.setItem('po.kbdhint.seen', '1');
        }
      }, 8000);
    }, 3500);
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    // پاک‌سازی ساعت‌های قدیمی
    document.querySelectorAll('.market-clock').forEach(function(c) { c.remove(); });

    // تم
    moveThemeSwitcher();
    setTimeout(moveThemeSwitcher, 500);
    setTimeout(moveThemeSwitcher, 1500);

    // ساعت بازار داخل آنالیز
    setTimeout(initMarketClock, 100);
    setTimeout(initMarketClock, 700);
    setTimeout(initMarketClock, 1500);

    // اجزا
    renderAssistant();
    renderGoalsBanner();
    initShare();
    initThemeSwitcher();
    initStreakBadge();
    initCommandPalette();
    showKbdHint();

    setInterval(function() {
      renderAssistant();
      renderGoalsBanner();
    }, 5000);
    setInterval(checkGoalComplete, 2000);

    // اگه کاربر تب رو عوض کرد
    document.querySelectorAll('.tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        setTimeout(initMarketClock, 100);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PT_Assistant = {
    refresh: function() {
      renderAssistant();
      renderGoalsBanner();
    },
    initMarketClock: initMarketClock
  };
  window.PT_Extras = {
    confetti: fireConfetti,
    streak: calcStreak
  };
})();
