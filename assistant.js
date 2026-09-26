/* ============================================================
   PO-TRADE Assistant + Goals + Share
   ============================================================ */
(function() {
  'use strict';

  var $ = function(s, r) { return (r || document).querySelector(s); };
  var $$ = function(s, r) { return Array.from((r || document).querySelectorAll(s)); };

  /* ============================================================
     1) ANALYSIS ASSISTANT
     ============================================================ */
  function analyzePerformance(trades, goal, rules) {
    if (!trades || !trades.length) {
      return {
        mood: 'neutral',
        title: '🚀 آماده‌ای برای شروع؟',
        text: 'هنوز معامله‌ای ثبت نکردی. اولین معامله رو ثبت کن تا آنالیز دقیق بگیری.',
        badges: []
      };
    }

    var wins = 0, losses = 0, net = 0, grossProfit = 0, grossLoss = 0;
    var byStrategy = {};
    trades.forEach(function(t) {
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      net += p;
      if (t.result === 'win') { wins++; grossProfit += p; }
      else if (t.result === 'loss') { losses++; grossLoss += Math.abs(p); }
      var s = t.strategy || '—';
      if (!byStrategy[s]) byStrategy[s] = { w: 0, l: 0, net: 0, count: 0 };
      byStrategy[s].count++;
      byStrategy[s].net += p;
      if (t.result === 'win') byStrategy[s].w++;
      else if (t.result === 'loss') byStrategy[s].l++;
    });

    var closed = wins + losses;
    var winRate = closed ? (wins / closed) * 100 : 0;
    var pf = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);

    var strategies = Object.keys(byStrategy).map(function(k) {
      var s = byStrategy[k];
      var c = s.w + s.l;
      return { name: k, net: s.net, count: s.count, winRate: c ? (s.w / c) * 100 : 0 };
    }).sort(function(a, b) { return b.net - a.net; });

    var best = strategies[0];
    var worst = strategies[strategies.length - 1];
    var profitable = net > 0;
    var mood = profitable ? 'good' : net < 0 ? 'bad' : 'neutral';

    // ساخت متن
    var title, text;
    if (profitable) {
      title = '🎉 عملکردت سودده بوده!';
      text = 'خالص سودت <strong>' + formatMoney(net) + '</strong> بوده. ';
      if (best) {
        text += 'بهترین استراتژی‌ت <em>' + best.name + '</em> با <strong>' +
                formatMoney(best.net) + '</strong> سوده. ';
      }
      if (winRate >= 60) {
        text += 'وین‌ریت <strong>' + winRate.toFixed(1) + '٪</strong> نشان می‌دهد تصمیم‌گیری‌هایت دقیق است.';
      } else if (winRate < 40) {
        text += 'ولی وین‌ریت <strong>' + winRate.toFixed(1) + '٪</strong> پایین است — دقت ورودت را بالا ببر.';
      } else {
        text += 'وین‌ریت <strong>' + winRate.toFixed(1) + '٪</strong> در محدوده متعادل قرار دارد.';
      }
    } else if (net < 0) {
      title = '⚠️ عملکردت در ضرر بوده';
      text = 'خالص ضررت <strong>' + formatMoney(net) + '</strong> بوده. ';
      if (worst && worst.net < 0) {
        text += 'بیشترین ضرر از <em>' + worst.name + '</em> با <strong>' +
                formatMoney(worst.net) + '</strong> آمده — این استراتژی را بازبینی کن. ';
      }
      if (winRate < 40) {
        text += 'وین‌ریت <strong>' + winRate.toFixed(1) + '٪</strong> هم نشان می‌دهد ورودی‌ها ضعیف هستند.';
      } else {
        text += 'وین‌ریت <strong>' + winRate.toFixed(1) + '٪</strong> قابل قبول است، ولی مدیریت ریسکت را بهتر کن.';
      }
    } else {
      title = '📊 عملکردت سربه‌سر است';
      text = 'نه سود کرده‌ای و نه ضرر. وقت آن است که استراتژی‌ات را بازبینی کنی.';
    }

    // Badges
    var badges = [];
    if (best) {
      badges.push({
        label: '🏆 بهترین: ' + best.name + ' (' + formatMoney(best.net) + ')',
        cls: best.net > 0 ? 'good' : 'neutral'
      });
    }
    if (worst && worst !== best) {
      badges.push({
        label: '📉 بدترین: ' + worst.name + ' (' + formatMoney(worst.net) + ')',
        cls: worst.net < 0 ? 'bad' : 'neutral'
      });
    }
    badges.push({
      label: '🎯 وین‌ریت: ' + winRate.toFixed(1) + '٪',
      cls: winRate >= 55 ? 'good' : winRate < 45 ? 'bad' : 'neutral'
    });
    if (isFinite(pf)) {
      badges.push({
        label: '⚖️ PF: ' + pf.toFixed(2),
        cls: pf >= 1.5 ? 'good' : pf < 1 ? 'bad' : 'neutral'
      });
    }

    return { mood: mood, title: title, text: text, badges: badges };
  }

  function formatMoney(n) {
    var v = +n || 0;
    var a = Math.abs(v);
    var s = a.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (v > 0) return '+$' + s;
    if (v < 0) return '-$' + s;
    return '$' + s;
  }

  function renderAssistant() {
    var host = $('#assistant-host');
    if (!host) return;
    var trades = [];
    try { trades = JSON.parse(localStorage.getItem('po.v4.trades') || '[]'); } catch(e) {}
    var a = analyzePerformance(trades);

    host.innerHTML =
      '<div class="assistant">' +
        '<div class="assistant-inner">' +
          '<div class="assistant-avatar">' + (a.mood === 'good' ? '🏆' : a.mood === 'bad' ? '🎯' : '🤖') + '</div>' +
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
     2) GOALS BANNER (celebration + warning)
     ============================================================ */
  function renderGoalsBanner() {
    var host = $('#goals-banner-host');
    if (!host) return;

    var goal = null, rules = null;
    try { goal = JSON.parse(localStorage.getItem('po.v4.goal') || 'null'); } catch(e) {}
    try { rules = JSON.parse(localStorage.getItem('po.v4.rules') || 'null'); } catch(e) {}

    var trades = [];
    try { trades = JSON.parse(localStorage.getItem('po.v4.trades') || '[]'); } catch(e) {}

    // محاسبه‌ی دوره جاری
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

    var stat = computeStats(periodTrades);

    var banner = null;

    // 1) هدف موفق
    if (goal && goal.target) {
      var current = 0;
      if (goal.metric === 'pnl') current = stat.net;
      else if (goal.metric === 'trades') current = stat.total;
      else if (goal.metric === 'winrate') current = stat.winRate;

      var progress = goal.target > 0 ? Math.min(100, (current / goal.target) * 100) : 0;

      if (progress >= 100) {
        banner = {
          cls: 'success',
          icon: '🏆',
          title: '🎉 تبریک! به هدفت رسیدی!',
          sub: 'هدف ' + (goal.period === 'week' ? 'هفتگی' : 'ماهانه') + 'ت با موفقیت تکمیل شد',
          stats: [
            { v: formatMetric(current, goal.metric), l: 'دستیابی' },
            { v: formatMetric(goal.target, goal.metric), l: 'هدف' },
            { v: '۱۰۰٪', l: 'پیشرفت' }
          ],
          progress: 100
        };
      } else if (progress >= 70) {
        banner = {
          cls: 'warning',
          icon: '⚡',
          title: 'داری نزدیک میشی!',
          sub: 'فقط ' + (100 - progress).toFixed(0) + '٪ تا تکمیل هدف مونده',
          stats: [
            { v: formatMetric(current, goal.metric), l: 'فعلی' },
            { v: formatMetric(goal.target, goal.metric), l: 'هدف' },
            { v: progress.toFixed(0) + '٪', l: 'پیشرفت' }
          ],
          progress: progress
        };
      } else {
        banner = {
          cls: 'neutral',
          icon: '🎯',
          title: 'هدف ' + (goal.period === 'week' ? 'هفتگی' : 'ماهانه'),
          sub: 'در مسیر رسیدن به هدفت هستی',
          stats: [
            { v: formatMetric(current, goal.metric), l: 'فعلی' },
            { v: formatMetric(goal.target, goal.metric), l: 'هدف' },
            { v: progress.toFixed(0) + '٪', l: 'پیشرفت' }
          ],
          progress: progress
        };
      }
    }

    // 2) قوانین پراپ فرم (ضرر روزانه / افت سرمایه)
    if (rules && rules.enabled) {
      // ضرر امروز
      var today = toISO(new Date());
      var todayTrades = trades.filter(function(t) { return t.date === today; });
      var todayNet = 0;
      todayTrades.forEach(function(t) {
        todayNet += t.result === 'win' ? Math.abs(+t.amount || 0) :
                    t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      });
      var todayLoss = todayNet < 0 ? -todayNet : 0;

      if (rules.dailyLoss > 0) {
        var du = (todayLoss / rules.dailyLoss) * 100;
        if (du >= 100) {
          banner = {
            cls: 'danger',
            icon: '🚨',
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
            cls: 'warning',
            icon: '⚠️',
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
            return '<div class="goal-banner-stat">' +
              '<span class="v">' + s.v + '</span>' +
              '<span class="l">' + s.l + '</span>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div class="goal-banner-progress">' +
          '<div class="goal-banner-fill" style="width:' + banner.progress + '%"></div>' +
        '</div>' +
      '</div>';
  }

  function toISO(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  }

  function computeStats(list) {
    var wins = 0, losses = 0, net = 0;
    list.forEach(function(t) {
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      net += p;
      if (t.result === 'win') wins++;
      else if (t.result === 'loss') losses++;
    });
    var closed = wins + losses;
    return {
      total: list.length,
      net: net,
      winRate: closed ? (wins / closed) * 100 : 0
    };
  }

  function formatMetric(v, metric) {
    if (metric === 'pnl') return formatMoney(v);
    if (metric === 'trades') return Math.round(v) + '';
    if (metric === 'winrate') return (+v).toFixed(1) + '٪';
    return v;
  }

  /* ============================================================
     3) SHARE PANEL — تولید عکس PnL
     ============================================================ */
  function drawShareImage() {
    var trades = [];
    try { trades = JSON.parse(localStorage.getItem('po.v4.trades') || '[]'); } catch(e) {}

    var W = 800, H = 600;
    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');

    // پس‌زمینه
    var bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#05070f');
    bgGrad.addColorStop(0.5, '#0a1226');
    bgGrad.addColorStop(1, '#05070f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // orbs
    function orb(x, y, r, color) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    orb(150, 120, 220, 'rgba(46,230,166,0.35)');
    orb(650, 500, 260, 'rgba(91,140,255,0.35)');
    orb(400, 300, 180, 'rgba(255,95,162,0.18)');

    // grid
    ctx.strokeStyle = 'rgba(120,150,200,0.06)';
    ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // عنوان
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '900 44px Inter, sans-serif';
    var titleGrad = ctx.createLinearGradient(0, 40, W, 80);
    titleGrad.addColorStop(0, '#2ee6a6');
    titleGrad.addColorStop(0.5, '#5b8cff');
    titleGrad.addColorStop(1, '#ff5fa2');
    ctx.fillStyle = titleGrad;
    ctx.fillText('PO-TRADE', W / 2, 40);

    ctx.font = '700 14px Inter, sans-serif';
    ctx.fillStyle = 'rgba(134,151,184,1)';
    ctx.fillText('TRADING REPORT • ' + new Date().toISOString().slice(0, 10), W / 2, 96);

    // محاسبه آمار
    var wins = 0, losses = 0, be = 0, net = 0, gp = 0, gl = 0;
    trades.forEach(function(t) {
      var p = t.result === 'win' ? Math.abs(+t.amount || 0) :
              t.result === 'loss' ? -Math.abs(+t.amount || 0) : 0;
      net += p;
      if (t.result === 'win') { wins++; gp += p; }
      else if (t.result === 'loss') { losses++; gl += Math.abs(p); }
      else be++;
    });
    var closed = wins + losses;
    var winRate = closed ? (wins / closed) * 100 : 0;
    var pf = gl > 0 ? gp / gl : (gp > 0 ? Infinity : 0);

    // Net PnL بزرگ
    var isProfit = net > 0;
    var isLoss = net < 0;
    var pnlColor = isProfit ? '#2ee6a6' : isLoss ? '#ff5674' : '#8697b8';
    var sign = net > 0 ? '+' : net < 0 ? '-' : '';
    var netTxt = sign + '$' + Math.abs(net).toLocaleString('en-US', { maximumFractionDigits: 2 });

    ctx.font = '900 84px Inter, sans-serif';
    ctx.fillStyle = pnlColor;
    ctx.shadowColor = pnlColor;
    ctx.shadowBlur = 40;
    ctx.fillText(netTxt, W / 2, 160);
    ctx.shadowBlur = 0;

    ctx.font = '800 15px Inter, sans-serif';
    ctx.fillStyle = 'rgba(134,151,184,1)';
    ctx.fillText('NET PROFIT / LOSS', W / 2, 260);

    // کارت‌های آمار
    var cardW = 160, cardH = 100, gap = 20;
    var totalCardW = cardW * 4 + gap * 3;
    var startX = (W - totalCardW) / 2;
    var cardY = 310;

    function statCard(x, y, label, value, color) {
      var g = ctx.createLinearGradient(x, y, x, y + cardH);
      g.addColorStop(0, 'rgba(20,29,51,0.9)');
      g.addColorStop(1, 'rgba(15,23,42,0.9)');
      ctx.fillStyle = g;
      roundRect(ctx, x, y, cardW, cardH, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,150,200,0.25)';
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, cardW, cardH, 16);
      ctx.stroke();

      ctx.font = '900 28px Inter, sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value, x + cardW / 2, y + 42);

      ctx.font = '700 11px Inter, sans-serif';
      ctx.fillStyle = 'rgba(134,151,184,1)';
      ctx.fillText(label, x + cardW / 2, y + 76);
    }

    statCard(startX, cardY, 'TOTAL TRADES', trades.length + '', '#eef3ff');
    statCard(startX + cardW + gap, cardY, 'WIN RATE', winRate.toFixed(1) + '%', winRate >= 50 ? '#2ee6a6' : '#ff5674');
    statCard(startX + (cardW + gap) * 2, cardY, 'WINS', wins + '', '#2ee6a6');
    statCard(startX + (cardW + gap) * 3, cardY, 'LOSSES', losses + '', '#ff5674');

    // نوار پیشرفت win rate
    var barY = 460;
    var barX = 80, barW = W - 160, barH = 12;
    ctx.fillStyle = 'rgba(120,150,200,0.15)';
    roundRect(ctx, barX, barY, barW, barH, 6);
    ctx.fill();

    var fillW = (winRate / 100) * barW;
    var fillGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    fillGrad.addColorStop(0, '#2ee6a6');
    fillGrad.addColorStop(1, '#5b8cff');
    ctx.fillStyle = fillGrad;
    ctx.shadowColor = '#2ee6a6';
    ctx.shadowBlur = 20;
    roundRect(ctx, barX, barY, fillW, barH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // PF
    ctx.font = '800 13px Inter, sans-serif';
    ctx.fillStyle = 'rgba(134,151,184,1)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('WIN RATE ' + winRate.toFixed(1) + '%', barX, barY - 26);

    var pfTxt = isFinite(pf) ? pf.toFixed(2) : '∞';
    ctx.textAlign = 'right';
    ctx.fillStyle = pf >= 1.5 ? '#2ee6a6' : pf < 1 ? '#ff5674' : '#ffb020';
    ctx.fillText('PROFIT FACTOR ' + pfTxt, barX + barW, barY - 26);

    // امضا
    ctx.font = '700 11px Inter, sans-serif';
    ctx.fillStyle = 'rgba(134,151,184,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Generated by PO-TRADE • github.com/IQZEUS/PO-TREAD', W / 2, H - 20);

    return canvas;
  }

  function roundRect(ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.arcTo(x + w, y, x + w, y + rr, rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
    ctx.lineTo(x + rr, y + h);
    ctx.arcTo(x, y + h, x, y + h - rr, rr);
    ctx.lineTo(x, y + rr);
    ctx.arcTo(x, y, x + rr, y, rr);
    ctx.closePath();
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
        var ctx = c2.getContext('2d');
        ctx.drawImage(canvas, 0, 0);
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
     4) THEME SWITCHER — 3 Presets
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
      // همگام‌سازی با theme-btn قدیمی
      var tb = document.querySelector('.theme-icon');
      if (tb) tb.textContent = name === 'aurora' ? '☀️' : name === 'cyber' ? '⚡' : '🌙';
      // بازرندر چارت‌ها
      window.dispatchEvent(new Event('resize'));
    });
  }

  /* ============================================================
     Init
     ============================================================ */
  function init() {
    renderAssistant();
    renderGoalsBanner();
    initShare();
    initThemeSwitcher();

    // هر ۵ ثانیه refresh
    setInterval(function() {
      renderAssistant();
      renderGoalsBanner();
    }, 5000);
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
    }
  };
})();
