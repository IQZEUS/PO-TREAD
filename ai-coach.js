/* PO-TRADE NOVA — private, bilingual, deterministic journal coach.
   No API calls: reads only this browser's po.v4.trades journal and renders descriptive patterns. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = $('#page-ai-coach');
  if (!root || !window.PT_COACH_CONTENT) return;

  const CONTENT = window.PT_COACH_CONTENT;
  const STORAGE = 'po.v4.trades';
  const QUOTE_DAY_KEY = 'po.coach.quote-day.v1';
  const HISTORY_KEY = 'po.v4.ai-history.local';
  const HISTORY_LIMIT = 80;
  let lastReport = null;
  let quoteIndex = 0;
  let chatHistory = [];
  try {
    const storedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (Array.isArray(storedHistory)) chatHistory = storedHistory
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
      .slice(-HISTORY_LIMIT)
      .map(m => ({ role: m.role, text: m.text.slice(0, 6000), at: Number(m.at) || Date.now() }));
  } catch (_) { chatHistory = []; }

  const lang = () => String(document.documentElement.lang || 'fa').slice(0, 2) === 'en' ? 'en' : 'fa';
  const L = (fa, en) => lang() === 'en' ? en : fa;
  const normalize = value => String(value == null ? '' : value).toLocaleLowerCase()
    .replace(/[ي]/g, 'ی').replace(/[ك]/g, 'ک').replace(/[ۀة]/g, 'ه')
    .replace(/[\u200c\u200f\u200e]/g, ' ').replace(/\s+/g, ' ').trim();
  function readTrades() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE) || '[]');
      return Array.isArray(data) ? data.filter(t => t && typeof t === 'object' && t.result) : [];
    } catch (_) { return []; }
  }
  function tradePnl(t) {
    const amount = Math.abs(Number(t.amount) || 0);
    if (t.result === 'win') return amount;
    if (t.result === 'loss') return -amount;
    return 0;
  }
  function currency() {
    try {
      const p = JSON.parse(localStorage.getItem('po.v4.portfolio') || '{}');
      return ['USD', 'EUR', 'GBP', 'AED', 'IRR'].includes(p.currency) ? p.currency : 'USD';
    } catch (_) { return 'USD'; }
  }
  function money(value) {
    const cur = currency();
    try { return new Intl.NumberFormat(lang() === 'en' ? 'en-US' : 'fa-IR', {
      style: 'currency', currency: cur, maximumFractionDigits: cur === 'IRR' ? 0 : 2
    }).format(Number(value) || 0); } catch (_) { return (Number(value) || 0).toLocaleString() + ' ' + cur; }
  }
  function number(value, digits = 1) {
    try { return new Intl.NumberFormat(lang() === 'en' ? 'en-US' : 'fa-IR', { maximumFractionDigits: digits }).format(value); }
    catch (_) { return String(value); }
  }
  function percent(value) { return number(value, 1) + '%'; }
  function sumTrades(list) {
    const out = { total: list.length, wins: 0, losses: 0, be: 0, net: 0, grossProfit: 0, grossLoss: 0, expectancy: 0, winRate: 0, pf: null };
    list.forEach(t => {
      const p = tradePnl(t); out.net += p;
      if (t.result === 'win') { out.wins++; out.grossProfit += p; }
      else if (t.result === 'loss') { out.losses++; out.grossLoss += Math.abs(p); }
      else out.be++;
    });
    const closed = out.wins + out.losses;
    out.winRate = closed ? out.wins / closed * 100 : 0;
    out.expectancy = out.total ? out.net / out.total : 0;
    out.pf = out.grossLoss ? out.grossProfit / out.grossLoss : (out.grossProfit > 0 ? Infinity : null);
    return out;
  }
  function groupStats(list, keyFn) {
    const map = new Map();
    list.forEach(t => {
      const key = String(keyFn(t) || '').trim(); if (!key) return;
      if (!map.has(key)) map.set(key, []); map.get(key).push(t);
    });
    return Array.from(map, ([key, rows]) => ({ key, rows, ...sumTrades(rows) })).sort((a, b) => b.net - a.net);
  }
  function emotionName(key) {
    const dict = {
      calm: ['آرام', 'Calm'], focused: ['متمرکز', 'Focused'], fear: ['ترس', 'Fear'],
      greed: ['طمع', 'Greed'], fomo: ['فومو', 'FOMO'], revenge: ['انتقام', 'Revenge'],
      tired: ['خستگی', 'Fatigue'], confident: ['اعتمادبه‌نفس', 'Confidence'],
      impatient: ['بی‌صبری', 'Impatience'], distracted: ['حواس‌پرتی', 'Distraction']
    };
    return (dict[key] || [key || 'نامشخص', key || 'Unknown'])[lang() === 'en' ? 1 : 0];
  }
  function detectKeywordGroups(list) {
    const counts = new Map();
    const termHits = new Map();
    const orderedKeywords = CONTENT.keywords.slice().sort((a, b) => String(b[lang()]).length - String(a[lang()]).length);
    list.forEach(t => {
      const text = normalize([t.note || '', Array.isArray(t.tags) ? t.tags.join(' ') : (t.tags || ''), t.moodNote || ''].join(' '));
      const seen = new Set();
      orderedKeywords.forEach(item => {
        const needle = normalize(item[lang()]);
        if (needle && text.includes(needle)) {
          if (!seen.has(item.group)) { counts.set(item.group, (counts.get(item.group) || 0) + 1); seen.add(item.group); }
          const k = item[lang()]; termHits.set(k, (termHits.get(k) || 0) + 1);
        }
      });
    });
    return {
      groups: Array.from(counts, ([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
      terms: Array.from(termHits, ([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count).slice(0, 6)
    };
  }
  function moodGroups(list) {
    const aliases = { calm: 'calm', focused: 'discipline', fear: 'fear', greed: 'greed', fomo: 'fomo', revenge: 'revenge', tired: 'fatigue', impatient: 'impatience', confident: 'confidence', distracted: 'distraction' };
    const normalizeEmotion = value => aliases[String(value || '').toLowerCase()] || '';
    const map = new Map();
    list.forEach(t => {
      const key = normalizeEmotion(t.emotion); if (!key) return;
      if (!map.has(key)) map.set(key, []); map.get(key).push(t);
    });
    return Array.from(map, ([key, rows]) => ({ key, rows, ...sumTrades(rows) })).sort((a, b) => a.net - b.net);
  }
  function getDiscipline(list) {
    let checked = 0, total = 0, tradesWithChecklist = 0;
    list.forEach(t => {
      const c = t.checklist;
      if (!c || typeof c !== 'object') return;
      const vals = Object.values(c).filter(v => typeof v === 'boolean');
      if (!vals.length) return;
      tradesWithChecklist++; total += vals.length; checked += vals.filter(Boolean).length;
    });
    return { score: total ? checked / total * 100 : null, checked, total, tradesWithChecklist };
  }
  function getRecordHours(list) {
    // createdAt is journal-entry creation time in the current schema, not broker execution time.
    const rows = list.filter(t => Number.isFinite(Number(t.createdAt)) && Number(t.createdAt) > 0);
    const ranges = [
      { label: '00–05', fa: '۰۰ تا ۰۵', en: '00–05' }, { label: '06–11', fa: '۰۶ تا ۱۱', en: '06–11' },
      { label: '12–17', fa: '۱۲ تا ۱۷', en: '12–17' }, { label: '18–23', fa: '۱۸ تا ۲۳', en: '18–23' }
    ];
    const map = new Map(ranges.map(r => [r.label, []]));
    rows.forEach(t => {
      const h = new Date(Number(t.createdAt)).getHours();
      const ix = h < 6 ? 0 : h < 12 ? 1 : h < 18 ? 2 : 3;
      map.get(ranges[ix].label).push(t);
    });
    return Array.from(map, ([key, vals]) => ({ key, label: ranges.find(r => r.label === key), rows: vals, ...sumTrades(vals) })).filter(x => x.total >= 3).sort((a, b) => a.net - b.net);
  }
  function buildReport() {
    const list = readTrades().slice().sort((a, b) => (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0));
    const stats = sumTrades(list);
    const symbols = groupStats(list, t => String(t.symbol || '').toUpperCase()).filter(g => g.key);
    const strategies = groupStats(list, t => String(t.strategy || '')).filter(g => g.key);
    const moods = moodGroups(list);
    const discipline = getDiscipline(list);
    const detected = detectKeywordGroups(list);
    const hours = getRecordHours(list);
    const dayStats = groupStats(list, t => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(t.date || ''))) return '';
      const d = new Date(t.date + 'T12:00:00');
      return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    });
    const bestSymbol = symbols.filter(g => g.total >= 2).sort((a, b) => b.net - a.net)[0] || null;
    const worstSymbol = symbols.filter(g => g.total >= 2).sort((a, b) => a.net - b.net)[0] || null;
    const bestStrategy = strategies.filter(g => g.total >= 2).sort((a, b) => b.net - a.net)[0] || null;
    const worstStrategy = strategies.filter(g => g.total >= 2).sort((a, b) => a.net - b.net)[0] || null;
    const worstMood = moods.filter(g => g.total >= 2 && g.net < 0)[0] || null;
    const bestMood = moods.filter(g => g.total >= 2 && g.net > 0).sort((a, b) => b.net - a.net)[0] || null;
    const worstRecordedTime = hours[0] || null;
    const recommendations = [];
    if (list.length < 8) recommendations.push({ type: 'info', title: L('هنوز نمونه کم است', 'The sample is still small'), body: L('با ' + number(list.length) + ' معامله نمی‌شود دربارهٔ مهارت یا یک نماد حکم قطعی داد. ۸ تا ۱۵ معاملهٔ بعدی را دقیق و با یادداشت ثبت کن.', 'With ' + number(list.length) + ' trades, it is too early to draw firm conclusions about skill or a symbol. Log the next 8–15 trades carefully with notes.') });
    if (stats.net < 0) recommendations.push({ type: 'warn', title: L('اولویت کوتاه‌مدت: حفاظت از سرمایه', 'Short-term priority: protect capital'), body: L('خالص ثبت‌شده ' + money(stats.net) + ' است. تا روشن‌شدن علت، ریسک هر معامله را کاهش بده و از معاملهٔ جبرانی دوری کن.', 'Logged net P/L is ' + money(stats.net) + '. Until the cause is clearer, reduce per-trade risk and avoid revenge trading.') });
    if (worstMood) recommendations.push({ type: 'warn', title: L('یک احساس با نتیجهٔ ضعیف همراه شده', 'An emotion is associated with weaker results'), body: L('در حالت «' + emotionName(worstMood.key) + '»، ' + number(worstMood.total) + ' معامله و خالص ' + money(worstMood.net) + ' ثبت شده. پیش از معاملهٔ بعدی همان حالت، یک توقف و چک‌لیست کوتاه امتحان کن.', 'In the “' + emotionName(worstMood.key) + '” state, ' + number(worstMood.total) + ' trades total ' + money(worstMood.net) + '. Try a pause and short checklist before the next trade in that state.') });
    if (worstSymbol && worstSymbol.net < 0) recommendations.push({ type: 'warn', title: L('نماد نیازمند بازبینی', 'Symbol to review'), body: L(worstSymbol.key + ' خالص ' + money(worstSymbol.net) + ' در ' + number(worstSymbol.total) + ' معامله دارد. پیش از حذف یا ادامه، ورودها، زمان ثبت و اندازه ریسک را جداگانه بازبینی کن.', worstSymbol.key + ' has net ' + money(worstSymbol.net) + ' over ' + number(worstSymbol.total) + ' trades. Review entries, journal-entry time and risk size before deciding to drop or keep it.') });
    if (worstStrategy && worstStrategy.net < 0) recommendations.push({ type: 'warn', title: L('استراتژی قابل بررسی', 'Strategy to review'), body: L('نتیجهٔ «' + worstStrategy.key + '» برابر ' + money(worstStrategy.net) + ' در ' + number(worstStrategy.total) + ' معامله است. چند نمونهٔ ناموفق را با شروط ورود مقایسه کن.', '“' + worstStrategy.key + '” totals ' + money(worstStrategy.net) + ' across ' + number(worstStrategy.total) + ' trades. Compare several losing examples against your entry criteria.') });
    if (discipline.score != null && discipline.tradesWithChecklist >= 3 && discipline.score < 75) recommendations.push({ type: 'warn', title: L('چک‌لیست را کوتاه و اجرایی کن', 'Make the checklist short and usable'), body: L('میانگین تیک‌خوردن چک‌لیست ' + percent(discipline.score) + ' است. سه شرط غیرقابل‌مذاکره را انتخاب و قبل از هر ورود بررسی کن.', 'Average checklist completion is ' + percent(discipline.score) + '. Pick three non-negotiable checks and review them before each entry.') });
    if (bestStrategy && bestStrategy.net > 0) recommendations.push({ type: 'good', title: L('نقطهٔ قوت قابل بازبینی', 'A strength worth reviewing'), body: L('استراتژی «' + bestStrategy.key + '» در ' + number(bestStrategy.total) + ' معامله خالص ' + money(bestStrategy.net) + ' داشته. بررسی کن کدام شرط ورود قابل تکرار بوده است.', '“' + bestStrategy.key + '” has net ' + money(bestStrategy.net) + ' over ' + number(bestStrategy.total) + ' trades. Identify which entry condition was repeatable.') });
    if (bestSymbol && bestSymbol.net > 0) recommendations.push({ type: 'good', title: L('نماد مثبت ژورنال', 'Positive journal symbol'), body: L(bestSymbol.key + ' با خالص ' + money(bestSymbol.net) + ' در ' + number(bestSymbol.total) + ' معامله بهترین نتیجهٔ فعلی را دارد؛ این هنوز تضمین آینده نیست.', bestSymbol.key + ' has the best current net result, ' + money(bestSymbol.net) + ' over ' + number(bestSymbol.total) + ' trades; this does not predict future results.') });
    if (worstRecordedTime && worstRecordedTime.net < 0) recommendations.push({ type: 'info', title: L('زمان ثبت را بررسی کن', 'Review your journal-entry timing'), body: L('در بازهٔ ثبت ' + worstRecordedTime.label.fa + '، خالص ' + money(worstRecordedTime.net) + ' در ' + number(worstRecordedTime.total) + ' مورد دیده می‌شود. این ساعت ثبت ژورنال است، نه زمان اجرای کارگزاری.', 'Journal entries recorded at ' + worstRecordedTime.label.en + ' total ' + money(worstRecordedTime.net) + ' across ' + number(worstRecordedTime.total) + ' items. This is log-entry time, not broker execution time.') });
    if (detected.groups.length) {
      const top = detected.groups[0];
      const matched = CONTENT.keywords.find(k => k.group === top.key);
      recommendations.push({ type: top.key === 'fear' || top.key === 'greed' || top.key === 'revenge' || top.key === 'fomo' ? 'warn' : 'info', title: L('الگوی زبانی در یادداشت‌ها', 'Language pattern in notes'), body: L('نشانه‌های مرتبط با «' + (matched ? matched.fa : top.key) + '» در ' + number(top.count) + ' معامله پیدا شد. این فقط تطبیق واژه است، نه تشخیص روان‌شناختی؛ یادداشت‌ها را برای تأیید مرور کن.', 'Terms related to “' + (matched ? matched.en : top.key) + '” appeared in ' + number(top.count) + ' trades. This is keyword matching, not a psychological diagnosis; review the notes to confirm.') });
    }
    if (discipline.score != null && discipline.score >= 85) recommendations.push({ type: 'good', title: L('رفتار منظم در چک‌لیست', 'Consistent checklist behavior'), body: L('میانگین چک‌لیست ' + percent(discipline.score) + ' است. همین روند را حفظ کن و نتیجه را در نمونه‌های بیشتر بسنج.', 'Checklist completion averages ' + percent(discipline.score) + '. Keep the routine and evaluate it over more trades.') });
    if (!recommendations.length) recommendations.push({ type: 'info', title: L('قدم بعدی', 'Next step'), body: L('ثبت دلیل ورود، احساس و اجرای چک‌لیست را کامل‌تر کن؛ داده‌های بهتر، تحلیل قابل‌اعتمادتر می‌سازند.', 'Record entry reasons, emotions and checklist completion more consistently; better data enables more reliable analysis.') });
    const selectedRecs = recommendations.slice(0, 5);
    const generic = [
      { type: 'info', title: L('یک متغیر را در هر نوبت اصلاح کن', 'Change one variable at a time'), body: L('برای چند معاملهٔ بعدی فقط یک رفتار را هدف بگیر تا بفهمی چه چیزی تغییر کرده است.', 'For the next few trades, target just one behavior so you can see what actually changed.') },
      { type: 'good', title: L('نتیجه، برچسب شخصیت نیست', 'Results are not a label for you'), body: L('این آمار فقط تصویری از معاملات ثبت‌شده است؛ از آن برای طراحی قدم بعدی استفاده کن، نه قضاوت درباره ارزش خودت.', 'These statistics only describe logged trades. Use them to plan the next step, not to judge your worth.') },
      { type: 'info', title: L('کیفیت نمونه را بالا ببر', 'Improve sample quality'), body: L('یادداشت و قوانین را در معاملات سودده و زیان‌ده به یک اندازه ثبت کن.', 'Record notes and rules for winners and losers with equal care.') }
    ];
    for (const r of generic) { if (selectedRecs.length >= 5) break; selectedRecs.push(r); }
    return { list, stats, symbols, strategies, moods, discipline, detected, hours, dayStats, bestSymbol, worstSymbol, bestStrategy, worstStrategy, worstMood, bestMood, recommendations: selectedRecs };
  }
  function el(tag, cls, text) {
    const node = document.createElement(tag); if (cls) node.className = cls; if (text != null) node.textContent = text; return node;
  }
  function addMetric(grid, label, value, tone) {
    const card = el('div', 'cosmos-ai-metric ' + (tone || ''));
    card.append(el('small', '', label), el('strong', '', value)); grid.appendChild(card);
  }
  function appendReport(report) {
    const target = $('#cosmos-ai-messages'); if (!target) return;
    const wrap = el('article', 'cosmos-ai-report');
    const head = el('div', 'cosmos-ai-report-head');
    head.append(el('span', 'cosmos-ai-report-mark', '✦'));
    const heading = el('div', ''); heading.append(el('strong', '', L('گزارش عملکرد تو', 'Your performance review')), el('small', '', L('بر اساس ' + number(report.stats.total) + ' معاملهٔ ثبت‌شده · ' + new Date().toLocaleDateString('fa-IR'), number(report.stats.total) + ' logged trades · ' + new Date().toLocaleDateString('en-US'))));
    head.appendChild(heading); head.appendChild(el('span', 'cosmos-local-pill', L('بدون ارسال داده', 'No data upload'))); wrap.appendChild(head);
    const metrics = el('div', 'cosmos-ai-metrics');
    addMetric(metrics, L('سود خالص', 'Net P/L'), money(report.stats.net), report.stats.net >= 0 ? 'good' : 'bad');
    addMetric(metrics, L('معاملات', 'Trades'), number(report.stats.total));
    addMetric(metrics, L('وین‌ریت', 'Win rate'), report.stats.wins + report.stats.losses ? percent(report.stats.winRate) : '—');
    addMetric(metrics, L('انتظار هر معامله', 'Expectancy / trade'), report.stats.total ? money(report.stats.expectancy) : '—', report.stats.expectancy >= 0 ? 'good' : 'bad');
    wrap.appendChild(metrics);
    const summary = el('div', 'cosmos-ai-verdict ' + (report.stats.net > 0 ? 'positive' : report.stats.net < 0 ? 'negative' : 'neutral'));
    const verdictTitle = report.list.length < 5 ? L('برای قضاوت زود است', 'Too early to judge') : report.stats.net > 0 ? L('نتیجهٔ فعلی مثبت است؛ حفظ فرایند مهم‌تر است.', 'Current net result is positive; keep the process first.') : report.stats.net < 0 ? L('نتیجهٔ فعلی منفی است؛ اول الگو را پیدا کن، بعد تغییر بده.', 'Current net result is negative; identify the pattern before changing things.') : L('نتیجهٔ خالص نزدیک صفر است؛ کیفیت اجرا را بررسی کن.', 'Net result is near zero; review execution quality.');
    summary.append(el('strong', '', verdictTitle));
    summary.append(el('p', '', report.list.length < 5 ? L('داده کم است و نمی‌شود از آن نتیجهٔ محکم گرفت. هر معاملهٔ بعدی را با دلیل، احساس، ریسک و یادداشت کامل ثبت کن.', 'There is too little data for strong conclusions. Log each next trade with its reason, emotion, risk and a complete note.') : report.stats.net < 0 ? L('این نتیجه حکم درباره شخصیت تو نیست. از ثبت‌ها برای کم‌کردن خطاهای قابل‌کنترل استفاده کن؛ این دستیار هم پیش‌بینی بازار نمی‌کند.', 'This result is not a judgment of you. Use the journal to reduce controllable mistakes; this coach does not predict markets.') : L('نقطهٔ قوت را پیدا کن و ببین آیا با همان قواعد در نمونه‌های دیگر هم تکرار می‌شود.', 'Find the strength and see whether the same rules work across other samples too.')));
    wrap.appendChild(summary);
    const strengths = el('div', 'cosmos-ai-split');
    const pos = el('section', 'cosmos-ai-mini-panel'); pos.append(el('strong', '', L('نکتهٔ مثبت', 'Positive signal')));
    let positiveText = L('برای یک نتیجه مثبت قابل اتکا، معاملات بیشتری با یادداشت کامل ثبت کن.', 'Log more trades with complete notes before trusting a positive pattern.');
    if (report.bestStrategy && report.bestStrategy.net > 0) positiveText = L('استراتژی «' + report.bestStrategy.key + '» در ' + number(report.bestStrategy.total) + ' نمونه خالص ' + money(report.bestStrategy.net) + ' دارد.', 'Strategy “' + report.bestStrategy.key + '” has net ' + money(report.bestStrategy.net) + ' across ' + number(report.bestStrategy.total) + ' samples.');
    else if (report.bestSymbol && report.bestSymbol.net > 0) positiveText = L('نماد «' + report.bestSymbol.key + '» در ژورنال فعلاً خالص مثبت ' + money(report.bestSymbol.net) + ' دارد.', '“' + report.bestSymbol.key + '” currently has positive logged net P/L of ' + money(report.bestSymbol.net) + '.');
    else if (report.discipline.score != null && report.discipline.score >= 75) positiveText = L('چک‌لیست در ' + percent(report.discipline.score) + ' موارد تیک خورده؛ این عادت را حفظ کن.', 'The checklist was completed ' + percent(report.discipline.score) + ' of the time; keep that habit.');
    pos.append(el('p', '', positiveText));
    const neg = el('section', 'cosmos-ai-mini-panel caution'); neg.append(el('strong', '', L('نکتهٔ منفی قابل‌بررسی', 'Risk signal to review')));
    let negativeText = L('الگوی ضرر تکرارشوندهٔ کافی پیدا نشد؛ از بزرگ‌نمایی نمونه کوچک پرهیز کن.', 'No repeated loss pattern was strong enough to report; avoid over-reading a small sample.');
    if (report.worstMood) negativeText = L('حالت «' + emotionName(report.worstMood.key) + '» با خالص ' + money(report.worstMood.net) + ' همراه بوده؛ تعداد نمونه ' + number(report.worstMood.total) + ' است.', 'The “' + emotionName(report.worstMood.key) + '” state is associated with net ' + money(report.worstMood.net) + ' across ' + number(report.worstMood.total) + ' samples.');
    else if (report.worstSymbol && report.worstSymbol.net < 0) negativeText = L('نماد «' + report.worstSymbol.key + '» خالص ' + money(report.worstSymbol.net) + ' دارد؛ پیش از نتیجه‌گیری تعداد نمونه را درنظر بگیر.', '“' + report.worstSymbol.key + '” has net ' + money(report.worstSymbol.net) + '; consider sample size before drawing a conclusion.');
    else if (report.stats.net < 0) negativeText = L('ضرر تجمعی ' + money(report.stats.net) + ' است. حجم را افزایش نده تا دلیل عملکرد روشن‌تر شود.', 'Cumulative net is ' + money(report.stats.net) + '. Avoid increasing size while the cause remains unclear.');
    neg.append(el('p', '', negativeText)); strengths.append(pos, neg); wrap.appendChild(strengths);
    const recSection = el('section', 'cosmos-ai-recommendations');
    const recHead = el('div', 'cosmos-ai-panel-head'); recHead.append(el('div', '')); recHead.firstChild.append(el('span', 'cosmos-kicker', L('NEXT ACTIONS', 'NEXT ACTIONS')), el('h3', '', L('پنج پیشنهاد شخصی', 'Five practical recommendations'))); recSection.appendChild(recHead);
    const list = el('div', 'cosmos-ai-rec-list');
    report.recommendations.forEach((r, i) => {
      const card = el('article', 'cosmos-ai-rec ' + r.type); const n = el('span', 'cosmos-ai-rec-num', String(i + 1).padStart(2, '0'));
      const body = el('div', ''); body.append(el('strong', '', r.title), el('p', '', r.body)); card.append(n, body); list.appendChild(card);
    });
    recSection.appendChild(list); wrap.appendChild(recSection);
    const pattern = el('section', 'cosmos-ai-patterns');
    const patternTitle = el('strong', '', L('الگوهای قابل مشاهده', 'Observable patterns')); pattern.appendChild(patternTitle);
    const chips = el('div', 'cosmos-ai-pattern-chips');
    const bestDay = report.dayStats.slice().sort((a, b) => b.net - a.net).find(g => g.total >= 2 && g.net > 0);
    if (report.bestSymbol) chips.append(el('span', 'cosmos-pattern-chip', L('نماد مثبت: ', 'Best symbol: ') + report.bestSymbol.key));
    if (report.worstSymbol && report.worstSymbol.net < 0) chips.append(el('span', 'cosmos-pattern-chip negative', L('نماد نیازمند بررسی: ', 'Review symbol: ') + report.worstSymbol.key));
    if (bestDay) chips.append(el('span', 'cosmos-pattern-chip', L('روز مثبت: ', 'Best day: ') + bestDay.key));
    if (report.discipline.score != null) chips.append(el('span', 'cosmos-pattern-chip', L('چک‌لیست: ', 'Checklist: ') + percent(report.discipline.score)));
    if (!chips.childElementCount) chips.append(el('span', 'cosmos-pattern-chip', L('هنوز الگوی مطمئنی دیده نمی‌شود', 'No reliable pattern yet')));
    pattern.appendChild(chips);
    pattern.append(el('small', '', L('نمونه‌های کوچک می‌توانند گمراه‌کننده باشند. داده‌های این گزارش از مرورگر فعلی خوانده می‌شوند و برای بازار آینده پیش‌بینی نمی‌سازند.', 'Small samples can mislead. This report reads the current browser journal and does not forecast future markets.')));
    wrap.appendChild(pattern); target.appendChild(wrap); lastReport = report;
    refreshKeywordList(report.detected);
  }
  function refreshKeywordList(detected) {
    const host = $('#cosmos-ai-keyword-list'), counter = $('#cosmos-ai-keyword-count'); if (!host) return;
    host.replaceChildren(); if (counter) counter.textContent = number(detected.terms.length);
    if (!detected.terms.length) { host.append(el('p', '', L('در یادداشت‌های فعلی کلیدواژه‌ای از این مجموعه ۱۵۰تایی پیدا نشد. می‌توانی احساس و دلیل معامله را با زبان خودت بنویسی.', 'No terms from the 150-item dictionary were found in current notes. Add your trade reason and emotion in your own words.'))); return; }
    detected.terms.slice(0, 5).forEach(t => { const item = el('div', 'cosmos-keyword-row'); item.append(el('span', '', t.key), el('strong', '', number(t.count))); host.appendChild(item); });
  }
  function getQuote(index) {
    const list = CONTENT.wisdom || []; if (!list.length) return null;
    return list[((index % list.length) + list.length) % list.length];
  }
  function paintQuote() {
    const quote = $('#cosmos-ai-quote'), credit = $('#cosmos-ai-quote-credit');
    const day = Math.floor(Date.now() / 86400000);
    if (quoteIndex === 0) {
      try { const saved = JSON.parse(localStorage.getItem(QUOTE_DAY_KEY) || 'null'); if (saved && saved.day === day) quoteIndex = saved.index; else quoteIndex = day % CONTENT.wisdom.length; } catch (_) { quoteIndex = day % CONTENT.wisdom.length; }
    }
    const item = getQuote(quoteIndex); if (!item) return;
    if (quote) quote.textContent = '“' + item[lang()] + '”';
    if (credit) credit.textContent = L('یادآوری اصیل · الهام از موضوع «' + item.topic + '»؛ انتساب لفظی به شخص مشخص نیست.', 'Original reflection · Inspired by “' + item.topic + '”; not a verbatim attribution.');
    try { localStorage.setItem(QUOTE_DAY_KEY, JSON.stringify({ day, index: quoteIndex })); } catch (_) {}
  }
  function setHistoryStatus(saved) {
    const node = $('#cosmos-ai-history-status'); if (!node) return;
    node.textContent = saved
      ? L('گفتگو فقط روی همین دستگاه ذخیره می‌شود.', 'Conversation is saved on this device only.')
      : L('ذخیرهٔ محلی گفتگو ناموفق بود؛ فضای ذخیره‌سازی را بررسی کن.', 'Local conversation save failed; check this device storage.');
    node.dataset.state = saved ? 'ok' : 'warning';
  }
  function persistHistory() {
    chatHistory = chatHistory.slice(-HISTORY_LIMIT);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(chatHistory)); setHistoryStatus(true); return true; }
    catch (err) { console.warn('[NOVA] Local conversation could not be saved:', err); setHistoryStatus(false); return false; }
  }
  function rememberMessage(role, text) {
    const clean = String(text || '').trim().slice(0, 6000);
    if (!clean) return;
    chatHistory.push({ role, text: clean, at: Date.now() });
    persistHistory();
  }
  function showStoredMessage(item) {
    const host = $('#cosmos-ai-messages'); if (!host) return;
    if (item.role === 'user') {
      const message = el('div', 'cosmos-ai-user-message');
      message.append(el('span', 'cosmos-user-message-icon', 'You'), el('p', '', item.text));
      host.appendChild(message);
    } else {
      const message = el('article', 'cosmos-ai-focus-answer cosmos-ai-history-answer');
      const lines = item.text.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length) {
        message.append(el('strong', '', lines[0]));
        lines.slice(1).forEach(line => message.append(el('p', '', line)));
      } else message.append(el('p', '', item.text));
      host.appendChild(message);
    }
  }
  function restoreHistory() {
    const host = $('#cosmos-ai-messages'); if (!host) return;
    if (!chatHistory.length) { setHistoryStatus(true); return; }
    host.replaceChildren();
    chatHistory.forEach(showStoredMessage);
    const thread = $('#cosmos-ai-thread'); if (thread) thread.classList.add('has-history');
    thread?.scrollTo({ top: thread.scrollHeight, behavior: 'auto' });
    setHistoryStatus(true);
  }
  function appendUserMessage(text) {
    const host = $('#cosmos-ai-messages'); if (!host) return;
    const thread = $('#cosmos-ai-thread'); if (thread) thread.classList.add('has-history');
    const message = el('div', 'cosmos-ai-user-message'); message.append(el('span', 'cosmos-user-message-icon', 'You'), el('p', '', text)); host.appendChild(message);
    rememberMessage('user', text);
    if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
  }
  function rememberCurrentAssistant(node) {
    if (!node) return;
    const text = String(node.innerText || node.textContent || '').trim();
    if (text) rememberMessage('assistant', text);
    const thread = $('#cosmos-ai-thread'); if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
  }
  function clearHistory() {
    chatHistory = [];
    try { localStorage.removeItem(HISTORY_KEY); } catch (err) { console.warn('[NOVA] Cannot clear local chat history:', err); }
    const host = $('#cosmos-ai-messages'); if (host) host.replaceChildren();
    const thread = $('#cosmos-ai-thread'); if (thread) thread.classList.remove('has-history');
    setHistoryStatus(true);
  }
  function reportSummaryText(report) {
    const lines = [
      L('مرور عملکرد', 'Performance review'),
      L('تعداد معامله: ', 'Trades: ') + number(report.stats.total),
      L('سود/ضرر خالص: ', 'Net P/L: ') + money(report.stats.net),
      L('وین‌ریت: ', 'Win rate: ') + (report.stats.wins + report.stats.losses ? percent(report.stats.winRate) : '—'),
      L('انتظار هر معامله: ', 'Expectancy per trade: ') + (report.stats.total ? money(report.stats.expectancy) : '—'),
      report.recommendations.map((r, i) => (i + 1) + '. ' + r.title + ': ' + r.body).join('\n')
    ];
    return lines.filter(Boolean).join('\n').slice(0, 6000);
  }
  function send(text) {
    text = String(text || '').trim(); if (!text) return;
    appendUserMessage(text);
    const report = buildReport();
    const normalized = normalize(text);
    const isEmotion = /ترس|طمع|فومو|انتقام|احساس|emotion|fear|greed|revenge|fomo/.test(normalized);
    const isAsset = /نماد|ارز|سیمبل|symbol|asset|which market/.test(normalized);
    const isStrategy = /استراتژ|پلن|strategy|setup/.test(normalized);
    const isTime = /ساعت|زمان|فعال|time|hour|session/.test(normalized);
    const isQuote = /نقل قول|انگیزه|یادآوری|quote|motivat/.test(normalized);
    if (isQuote) paintQuote();
    if (isEmotion && report.moods.length) {
      const group = el('div', 'cosmos-ai-focus-answer'); group.append(el('strong', '', L('تحلیل احساس‌های ثبت‌شده', 'Logged emotion analysis')));
      const rows = report.moods.slice(0, 6).sort((a, b) => a.net - b.net);
      rows.forEach(r => group.append(el('p', '', emotionName(r.key) + ': ' + number(r.total) + ' ' + L('معامله · خالص ', 'trades · net ') + money(r.net))));
      group.append(el('small', '', L('ارتباط آماری به معنی علت قطعی نیست؛ یادداشت‌ها و اندازه نمونه را هم ببین.', 'Association is not causation; review the notes and sample size too.')));
      $('#cosmos-ai-messages').appendChild(group); lastReport = report; refreshKeywordList(report.detected); rememberCurrentAssistant(group); return;
    }
    if (isAsset && (report.symbols.length || report.strategies.length)) {
      const group = el('div', 'cosmos-ai-focus-answer'); group.append(el('strong', '', L('عملکرد به تفکیک نماد', 'Results by symbol')));
      report.symbols.slice().sort((a, b) => b.net - a.net).slice(0, 6).forEach(r => group.append(el('p', '', r.key + ': ' + number(r.total) + ' ' + L('معامله · خالص ', 'trades · net ') + money(r.net))));
      if (report.worstSymbol) group.append(el('small', '', L('نماد ضعیف‌تر در این نمونه: ', 'Lowest net in this sample: ') + report.worstSymbol.key + '. ' + L('نتیجه تضمین آینده نیست.', 'This does not predict future results.')));
      $('#cosmos-ai-messages').appendChild(group); lastReport = report; rememberCurrentAssistant(group); return;
    }
    if (isStrategy && report.strategies.length) {
      const group = el('div', 'cosmos-ai-focus-answer'); group.append(el('strong', '', L('عملکرد استراتژی‌ها', 'Strategy results')));
      report.strategies.slice().sort((a, b) => b.net - a.net).slice(0, 6).forEach(r => group.append(el('p', '', r.key + ': ' + number(r.total) + ' ' + L('معامله · خالص ', 'trades · net ') + money(r.net))));
      $('#cosmos-ai-messages').appendChild(group); lastReport = report; rememberCurrentAssistant(group); return;
    }
    if (isTime) {
      const group = el('div', 'cosmos-ai-focus-answer'); group.append(el('strong', '', L('الگوی زمانی قابل دسترس', 'Available time pattern')));
      if (!report.hours.length) group.append(el('p', '', L('هنوز حداقل سه ثبت در یک بازهٔ زمانی وجود ندارد. این نسخه ساعت اجرای کارگزاری را ذخیره نمی‌کند؛ فقط زمان ثبت ژورنال را می‌توان تقریبی بررسی کرد.', 'There are fewer than three journal entries in any time bucket. This version does not store broker execution time; only journal-entry time can be reviewed approximately.')));
      else report.hours.forEach(r => group.append(el('p', '', r.label[lang()] + ': ' + number(r.total) + ' ' + L('ثبت · خالص ', 'entries · net ') + money(r.net))));
      $('#cosmos-ai-messages').appendChild(group); lastReport = report; rememberCurrentAssistant(group); return;
    }
    appendReport(report);
    rememberMessage('assistant', reportSummaryText(report));
    const thread = $('#cosmos-ai-thread'); if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
  }
  function refreshSummaryCount() { const node = $('#cosmos-ai-trade-count'); if (node) node.textContent = number(readTrades().length); }
  $('#cosmos-ai-default-prompt')?.addEventListener('click', () => send(L('سلام، منو نسبت به آمارم تا این لحظه قضاوت کن', 'Hi, judge my performance based on my stats so far')));
  $('#cosmos-ai-form')?.addEventListener('submit', e => {
    e.preventDefault(); const input = $('#cosmos-ai-input'); if (!input) return;
    const text = input.value.trim(); if (!text) return;
    input.value = ''; send(text);
  });
  $('#cosmos-ai-next-quote')?.addEventListener('click', () => { quoteIndex = (quoteIndex + 1) % CONTENT.wisdom.length; paintQuote(); });
  $('#cosmos-ai-clear-history')?.addEventListener('click', () => {
    const ok = window.confirm(L('گفتگوی ذخیره‌شده روی همین دستگاه پاک شود؟', 'Clear the conversation saved on this device?'));
    if (ok) clearHistory();
  });
  document.addEventListener('click', e => {
    const prompt = e.target.closest('[data-ai-prompt]'); if (!prompt) return;
    const value = prompt.getAttribute('data-ai-prompt-' + lang()) || prompt.getAttribute('data-ai-prompt') || '';
    send(value);
  });
  function refreshAll() { refreshSummaryCount(); if (lastReport) { lastReport = buildReport(); refreshKeywordList(lastReport.detected); } paintQuote(); }
  // Chaining the storage observer keeps the app's existing cloud-sync/local-storage observers intact.
  try {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) { originalSetItem(key, value); if (key === STORAGE) { clearTimeout(window.__poCoachRefresh); window.__poCoachRefresh = setTimeout(refreshAll, 80); } };
  } catch (_) {}
  window.addEventListener('storage', e => { if (e.key === STORAGE) refreshAll(); });
  window.addEventListener('po:sync-ready', refreshAll);
  window.addEventListener('po:language-change', refreshAll);
  const langObserver = new MutationObserver(() => { if (root.classList.contains('active')) refreshAll(); });
  langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  refreshSummaryCount(); paintQuote(); restoreHistory();
  window.PTCoach = { analyze: buildReport, refresh: refreshAll, clearConversation: clearHistory, keywordCount: CONTENT.keywords.length, wisdomCount: CONTENT.wisdom.length };
})();
