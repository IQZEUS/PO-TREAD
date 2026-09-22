/* =========================================================
   PO-TRADE — Bilingual Trade Journal v4 (COMPLETE + MODAL)
   ========================================================= */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ============================ I18N ============================ */
  const I18N = {
    fa: {
      title: 'PO-TRADE | ژورنال معاملات',
      brand: 'PO-TRADE', tagline: 'ثبت کن، تحلیل کن، پیشرفت کن',
      tab_add: 'ثبت', tab_analysis: 'آنالیز', tab_calendar: 'تقویم', tab_trades: 'معاملات', tab_settings: 'تنظیمات',
      new_trade: '✍️ ثبت معامله جدید', saved_local: '🔒 ذخیره در مرورگر',
      date: '📅 تاریخ', symbol: '💱 نماد', strategy: '🎯 استراتژی',
      strategy_ph: 'بریک‌اوت لندن', side: '⚖️ جهت', result: '🏁 نتیجه',
      buy: 'خرید', sell: 'فروش', win: 'سود', loss: 'ضرر', be: 'سربه‌سر',
      amount: '💰 مبلغ (دلار)', risk: '🎲 ریسک (اختیاری)',
      tags: '🏷️ تگ‌ها', tags_hint: '(با ویرگول جدا کن)', mood: '🧠 حالت روحی',
      emo_calm: 'آرام', emo_focused: 'متمرکز', emo_fear: 'ترس',
      emo_greed: 'طمع', emo_fomo: 'FOMO', emo_revenge: 'انتقام',
      checklist: '✅ چک‌لیست پیش از معامله',
      screenshot: '📸 اسکرین‌شات چارت (اختیاری)', upload_hint: 'برای انتخاب تصویر کلیک کن',
      note: '📝 یادداشت', note_ph: 'چرا وارد شدی؟ چه درسی گرفتی؟',
      submit_trade: '💾 ثبت معامله', cancel: 'انصراف', recent: '🕒 آخرین معاملات',
      r7: '۷ روز', r30: '۳۰ روز', r90: '۹۰ روز', rall: 'همه', demo: '✨ نمونه',
      current_goal: '🎯 هدف فعلی',
      equity_curve: '📈 منحنی رشد سرمایه', cum_profit: 'سود انباشته',
      daily_pl: '📊 سود / ضرر روزانه', daily_net: 'خالص هر روز',
      emotion_analysis: '🧠 تحلیل حالت روحی', emotion_analysis_sub: 'سود/ضرر به تفکیک احساس',
      strategy_perf: '🎯 عملکرد استراتژی‌ها', daily_stats: '📅 آمار روزانه',
      wd_0: 'شنبه', wd_1: 'یکشنبه', wd_2: 'دوشنبه', wd_3: 'سه‌شنبه',
      wd_4: 'چهارشنبه', wd_5: 'پنج‌شنبه', wd_6: 'جمعه',
      lg_big_loss: 'ضرر زیاد', lg_small_loss: 'ضرر کم', lg_no_trade: 'بدون معامله',
      lg_small_win: 'سود کم', lg_big_win: 'سود زیاد',
      all_trades: '📋 همه معاملات', search: '🔍 جستجو',
      search_ph: 'نماد، استراتژی، یادداشت...', tag: '🏷️ تگ', emotion: '🧠 احساس',
      from_date: '📅 از تاریخ', to_date: '📅 تا تاریخ',
      clear_filters: 'پاک کردن فیلترها', all: 'همه',
      goals: '🎯 اهداف معاملاتی', goals_sub: 'پیشرفتت رو دنبال کن',
      goal_period: 'دوره هدف', week: 'هفتگی', month: 'ماهانه',
      goal_metric: 'معیار', metric_pnl: 'سود $', metric_trades: 'تعداد', metric_winrate: 'وین‌ریت %',
      goal_target: 'مقدار هدف', goal_target_ph: 'مثلاً 500',
      save_goal: '💾 ذخیره هدف', clear_goal: 'پاک کردن هدف',
      prop_rules: '🏦 قوانین پراپ فرم', prop_rules_sub: 'ردیابی خودکار سه قانون اصلی',
      enable_rules: 'فعال‌سازی ردیابی قوانین',
      rule_balance: '💰 موجودی اولیه ($)', rule_daily: '💥 حداکثر ضرر روزانه ($)',
      rule_dd: '⚠️ حداکثر افت کل ($)', rule_target: '🏆 هدف سود ($)',
      save_rules: '💾 ذخیره قوانین',
      ok_saved: '✅ تغییرات ذخیره شد', ok_added: '✅ معامله ثبت شد',
      ok_goal: '✅ هدف ذخیره شد', ok_rules: '✅ قوانین ذخیره شد',
      ok_demo: '✨ داده نمونه اضافه شد', ok_export: '✅ فایل خروجی ساخته شد',
      ok_import: '✅ {n} معامله وارد شد', err_import: '❌ خطا: {m}',
      err_symbol: '❌ نام نماد را وارد کن', err_strategy: '❌ نام استراتژی را وارد کن',
      err_amount: '❌ مبلغ را وارد کن', err_goal_target: '❌ مقدار هدف را وارد کن',
      err_image: '❌ خطا در پردازش تصویر', err_storage: '❌ حافظه پر است',
      del_done: '🗑️ معامله حذف شد', cleared: '🗑️ همه داده‌ها پاک شد',
      cancel_edit: 'ویرایش لغو شد', empty_list: 'لیست خالی است',
      empty_goal: 'هدفی وجود ندارد', goal_cleared: '🗑️ هدف حذف شد',
      no_trades: 'هنوز معامله‌ای ثبت نشده است', no_data: 'هنوز داده‌ای نیست',
      no_data_short: 'داده‌ای موجود نیست', no_filter: 'معامله‌ای با این فیلترها پیدا نشد',
      no_goal: 'هنوز هدفی تعیین نشده', rules_disabled: 'قوانین غیرفعال است',
      no_rule: 'قانونی تنظیم نشده',
      kpi_net: 'سود خالص', kpi_winrate: 'وین ریت', kpi_total: 'تعداد معاملات',
      kpi_pf: 'ضریب سود (PF)', kpi_avgr: 'میانگین R', kpi_exp: 'انتظار ریاضی',
      kpi_disc: 'انضباط', kpi_gp: 'مجموع سودها', kpi_gl: 'مجموع ضررها',
      kpi_aw: 'میانگین سود', kpi_al: 'میانگین ضرر', kpi_mdd: 'حداکثر افت سرمایه',
      kpi_bd: 'بهترین روز', kpi_wd: 'بدترین روز',
      th_strategy: 'استراتژی', th_count: 'تعداد', th_win: 'برد', th_loss: 'باخت',
      th_wr: 'وین‌ریت', th_net: 'خالص',
      th_date: 'تاریخ', th_trades: 'معاملات', th_profit: 'سود', th_loss2: 'ضرر',
      th_net2: 'خالص', th_cum: 'تجمعی',
      trades_of: 'از', trades_word: 'معامله',
      ld_sub: 'Loading markets…',
      this_week: 'این هفته', this_month: 'این ماه',
      goal_pnl: '💎 هدف سود', goal_trades: '📊 هدف تعداد', goal_winrate: '🎯 هدف وین‌ریت',
      rc_daily: 'حد ضرر روزانه', rc_dd: 'حداکثر افت سرمایه', rc_target: 'هدف سود',
      rc_ok: 'ایمن', rc_warn: 'هشدار', rc_bad: 'نقض', rc_reached: 'رسیدم',
      bn_daily: 'حد ضرر روزانه نقض شد! ({v})',
      bn_dd: 'حداکثر افت سرمایه نقض شد ({v})',
      bn_target: 'به هدف سود رسیدی! ({v})',
      bn_daily_warn: '{p}٪ از حد ضرر روزانه مصرف شد',
      bn_dd_warn: '{p}٪ از افت سرمایه مجاز مصرف شد',
      be_label: 'سربه‌سر', of_label: 'از',
      rc_equity: 'موجودی فعلی', rc_net: 'سود خالص',
      rc_peak: 'اوج', rc_current_dd: 'افت فعلی',
      rc_remaining: 'باقی‌مانده', rc_used: 'مصرف‌شده',
      md_del_trade: 'حذف معامله',
      md_del_trade_msg: 'این معامله برای همیشه حذف می‌شود. مطمئنی؟',
      md_del_trade_ok: 'بله، حذف کن',
      md_demo_title: 'افزودن داده نمونه',
      md_demo_msg: 'داده‌های نمونه به لیست فعلی اضافه می‌شوند. ادامه؟',
      md_demo_ok: 'افزودن',
      md_clear_title: 'پاک کردن همه داده‌ها',
      md_clear_msg: 'همه معاملات حذف می‌شوند و قابل بازگشت نیستند. مطمئنی؟',
      md_clear_ok: 'بله، همه را پاک کن',
      md_goal_title: 'حذف هدف',
      md_goal_msg: 'هدف فعلی حذف شود؟',
      md_goal_ok: 'حذف کن',
      md_cancel: 'انصراف',
      /* Checklist manager */
      checklist_settings: '✅ مدیریت چک‌لیست',
      checklist_settings_sub: 'موارد رو اضافه، ویرایش یا حذف کن',
      checklist_add_ph: 'مورد جدید...',
      checklist_add: '➕ افزودن',
      checklist_empty: 'هنوز موردی وجود ندارد',
      checklist_added: '✅ مورد اضافه شد',
      checklist_deleted: '🗑️ مورد حذف شد',
      checklist_saved: '✅ ذخیره شد',
      checklist_max: '❌ حداکثر ۱۲ مورد مجاز است',
      checklist_del_title: 'حذف مورد چک‌لیست',
      checklist_del_msg: 'این مورد از چک‌لیست حذف شود؟',
      checklist_del_ok: 'حذف کن'
    },
    en: {
      title: 'PO-TRADE | Trade Journal',
      brand: 'PO-TRADE', tagline: 'Log. Analyze. Progress.',
      tab_add: 'Log', tab_analysis: 'Analysis', tab_calendar: 'Calendar', tab_trades: 'Trades', tab_settings: 'Settings',
      new_trade: '✍️ Log New Trade', saved_local: '🔒 Saved in browser',
      date: '📅 Date', symbol: '💱 Symbol', strategy: '🎯 Strategy',
      strategy_ph: 'London Breakout', side: '⚖️ Side', result: '🏁 Result',
      buy: 'Buy', sell: 'Sell', win: 'Win', loss: 'Loss', be: 'Break-even',
      amount: '💰 Amount ($)', risk: '🎲 Risk (optional)',
      tags: '🏷️ Tags', tags_hint: '(comma separated)', mood: '🧠 Mood',
      emo_calm: 'Calm', emo_focused: 'Focused', emo_fear: 'Fear',
      emo_greed: 'Greed', emo_fomo: 'FOMO', emo_revenge: 'Revenge',
      checklist: '✅ Pre-trade Checklist',
      screenshot: '📸 Chart Screenshot (optional)', upload_hint: 'Click to select an image',
      note: '📝 Note', note_ph: 'Why did you enter? What did you learn?',
      submit_trade: '💾 Save Trade', cancel: 'Cancel', recent: '🕒 Recent Trades',
      r7: '7 days', r30: '30 days', r90: '90 days', rall: 'All', demo: '✨ Demo',
      current_goal: '🎯 Current Goal',
      equity_curve: '📈 Equity Curve', cum_profit: 'Cumulative P/L',
      daily_pl: '📊 Daily Profit / Loss', daily_net: 'Net per day',
      emotion_analysis: '🧠 Mood Analysis', emotion_analysis_sub: 'P/L by emotion',
      strategy_perf: '🎯 Strategy Performance', daily_stats: '📅 Daily Stats',
      wd_0: 'Sat', wd_1: 'Sun', wd_2: 'Mon', wd_3: 'Tue',
      wd_4: 'Wed', wd_5: 'Thu', wd_6: 'Fri',
      lg_big_loss: 'Big loss', lg_small_loss: 'Small loss', lg_no_trade: 'No trade',
      lg_small_win: 'Small win', lg_big_win: 'Big win',
      all_trades: '📋 All Trades', search: '🔍 Search',
      search_ph: 'Symbol, strategy, note...', tag: '🏷️ Tag', emotion: '🧠 Emotion',
      from_date: '📅 From', to_date: '📅 To',
      clear_filters: 'Clear filters', all: 'All',
      goals: '🎯 Trading Goals', goals_sub: 'Track your progress',
      goal_period: 'Goal period', week: 'Weekly', month: 'Monthly',
      goal_metric: 'Metric', metric_pnl: 'P/L $', metric_trades: 'Trades', metric_winrate: 'Win rate %',
      goal_target: 'Target value', goal_target_ph: 'e.g. 500',
      save_goal: '💾 Save Goal', clear_goal: 'Clear Goal',
      prop_rules: '🏦 Prop Firm Rules', prop_rules_sub: 'Auto-track 3 main rules',
      enable_rules: 'Enable rule tracking',
      rule_balance: '💰 Initial Balance ($)', rule_daily: '💥 Max Daily Loss ($)',
      rule_dd: '⚠️ Max Total Drawdown ($)', rule_target: '🏆 Profit Target ($)',
      save_rules: '💾 Save Rules',
      ok_saved: '✅ Changes saved', ok_added: '✅ Trade logged',
      ok_goal: '✅ Goal saved', ok_rules: '✅ Rules saved',
      ok_demo: '✨ Demo data added', ok_export: '✅ Export file created',
      ok_import: '✅ {n} trades imported', err_import: '❌ Error: {m}',
      err_symbol: '❌ Enter a symbol', err_strategy: '❌ Enter a strategy',
      err_amount: '❌ Enter an amount', err_goal_target: '❌ Enter a target value',
      err_image: '❌ Image processing error', err_storage: '❌ Storage is full',
      del_done: '🗑️ Trade deleted', cleared: '🗑️ All data cleared',
      cancel_edit: 'Edit cancelled', empty_list: 'List is empty',
      empty_goal: 'No goal exists', goal_cleared: '🗑️ Goal removed',
      no_trades: 'No trades logged yet', no_data: 'No data yet',
      no_data_short: 'No data', no_filter: 'No trades match these filters',
      no_goal: 'No goal set yet', rules_disabled: 'Rules are disabled',
      no_rule: 'No rule configured',
      kpi_net: 'Net P/L', kpi_winrate: 'Win Rate', kpi_total: 'Total Trades',
      kpi_pf: 'Profit Factor', kpi_avgr: 'Avg R', kpi_exp: 'Expectancy',
      kpi_disc: 'Discipline', kpi_gp: 'Gross Profit', kpi_gl: 'Gross Loss',
      kpi_aw: 'Avg Win', kpi_al: 'Avg Loss', kpi_mdd: 'Max Drawdown',
      kpi_bd: 'Best Day', kpi_wd: 'Worst Day',
      th_strategy: 'Strategy', th_count: 'Count', th_win: 'Wins', th_loss: 'Losses',
      th_wr: 'Win Rate', th_net: 'Net',
      th_date: 'Date', th_trades: 'Trades', th_profit: 'Profit', th_loss2: 'Loss',
      th_net2: 'Net', th_cum: 'Cumulative',
      trades_of: 'of', trades_word: 'trades',
      ld_sub: 'Loading markets…',
      this_week: 'This week', this_month: 'This month',
      goal_pnl: '💎 Profit Goal', goal_trades: '📊 Trade Count Goal', goal_winrate: '🎯 Win Rate Goal',
      rc_daily: 'Daily Loss Limit', rc_dd: 'Max Drawdown', rc_target: 'Profit Target',
      rc_ok: 'Safe', rc_warn: 'Warning', rc_bad: 'Breached', rc_reached: 'Reached',
      bn_daily: 'Daily loss limit breached! ({v})',
      bn_dd: 'Max drawdown breached ({v})',
      bn_target: 'Profit target reached! ({v})',
      bn_daily_warn: '{p}% of daily loss used',
      bn_dd_warn: '{p}% of drawdown used',
      be_label: 'Break-even', of_label: 'of',
      rc_equity: 'Current Equity', rc_net: 'Net P/L',
      rc_peak: 'Peak', rc_current_dd: 'Current DD',
      rc_remaining: 'Remaining', rc_used: 'Used',
      md_del_trade: 'Delete Trade',
      md_del_trade_msg: 'This trade will be permanently deleted. Are you sure?',
      md_del_trade_ok: 'Yes, delete',
      md_demo_title: 'Add Demo Data',
      md_demo_msg: 'Demo trades will be added to your current list. Continue?',
      md_demo_ok: 'Add',
      md_clear_title: 'Clear All Data',
      md_clear_msg: 'All trades will be deleted and cannot be recovered. Are you sure?',
      md_clear_ok: 'Yes, clear all',
      md_goal_title: 'Remove Goal',
      md_goal_msg: 'Remove the current goal?',
      md_goal_ok: 'Remove',
      md_cancel: 'Cancel',
      /* Checklist manager */
      checklist_settings: '✅ Checklist Manager',
      checklist_settings_sub: 'Add, edit or remove items',
      checklist_add_ph: 'New item...',
      checklist_add: '➕ Add',
      checklist_empty: 'No items yet',
      checklist_added: '✅ Item added',
      checklist_deleted: '🗑️ Item removed',
      checklist_saved: '✅ Saved',
      checklist_max: '❌ Maximum 12 items',
      checklist_del_title: 'Delete Checklist Item',
      checklist_del_msg: 'Remove this item from the checklist?',
      checklist_del_ok: 'Delete'
    }
  };

  let lang = localStorage.getItem('po.lang') || 'fa';
  if (!I18N[lang]) lang = 'fa';
  const t = k => (I18N[lang] && I18N[lang][k]) || (I18N.fa[k] || k);
  const fmt = (k, vars) => t(k).replace(/\{(\w+)\}/g, (_, n) => vars[n] != null ? vars[n] : '');

  /* ============================ UTILS ============================ */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  const toISO = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  };
  const todayISO = () => toISO(new Date());
  const fullDate = iso => {
    const p = String(iso).split('-');
    return p.length === 3 ? p[0] + '/' + p[1] + '/' + p[2] : iso;
  };
  const shortDate = iso => {
    const p = String(iso).split('-');
    return p.length === 3 ? p[1] + '/' + p[2] : iso;
  };
  const money = (n, withSign = true) => {
    const v = Number(n) || 0;
    const abs = Math.abs(v);
    const hasFrac = Math.round(abs * 100) % 100 !== 0;
    const s = abs.toLocaleString('en-US', {
      minimumFractionDigits: hasFrac ? 2 : 0,
      maximumFractionDigits: 2
    });
    if (!withSign) return '$' + s;
    if (v > 0) return '+$' + s;
    if (v < 0) return '-$' + s;
    return '$' + s;
  };
  const num = (n, d = 0) => (Number(n) || 0).toLocaleString('en-US', {
    minimumFractionDigits: d, maximumFractionDigits: d
  });
  const pct = n => (Number(n) || 0).toFixed(1) + '%';
  const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
  const compact = n => {
    const v = Number(n) || 0;
    const a = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (a >= 1e6) return sign + (a / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (a >= 1e3) return sign + (a / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return sign + Math.round(a);
  };
  const debounce = (fn, ms) => {
    let tm;
    return function () {
      const a = arguments, self = this;
      clearTimeout(tm);
      tm = setTimeout(() => fn.apply(self, a), ms);
    };
  };

  /* ============================ CONSTANTS ============================ */
  const EMOTIONS = {
    calm:    { ico: '😌', fa: 'آرام',    en: 'Calm' },
    focused: { ico: '🎯', fa: 'متمرکز', en: 'Focused' },
    fear:    { ico: '😨', fa: 'ترس',    en: 'Fear' },
    greed:   { ico: '🤑', fa: 'طمع',    en: 'Greed' },
    fomo:    { ico: '😤', fa: 'FOMO',   en: 'FOMO' },
    revenge: { ico: '😡', fa: 'انتقام', en: 'Revenge' }
  };
  const emoLabel = k => (EMOTIONS[k] || EMOTIONS.calm)[lang] || EMOTIONS.calm.fa;

  const DEFAULT_RULES = [
    { id: 'setup', fa: 'ستاپ تأیید شد',   en: 'Setup confirmed' },
    { id: 'stop',  fa: 'حد ضرر مشخص شد',   en: 'Stop loss defined' },
    { id: 'size',  fa: 'حجم مناسب بود',    en: 'Position size correct' },
    { id: 'plan',  fa: 'طبق پلن پیش رفتم', en: 'Followed the plan' }
  ];
  const ruleText = r => r ? (r.text || r[lang] || r.fa || r.en || r.id) : '';

  /* ============ AUTOCOMPLETE LISTS ============ */
  const FOREX_SYMBOLS = [
    'EURUSD','GBPUSD','USDJPY','USDCHF','USDCAD','AUDUSD','NZDUSD',
    'EURGBP','EURJPY','EURCHF','EURCAD','EURAUD','EURNZD',
    'GBPJPY','GBPCHF','GBPCAD','GBPAUD','GBPNZD',
    'AUDJPY','AUDCHF','AUDCAD','AUDNZD',
    'NZDJPY','NZDCHF','NZDCAD','CADJPY','CADCHF','CHFJPY',
    'XAUUSD','XAGUSD','XPTUSD','XPDUSD','USOIL','UKOIL','NGAS',
    'NAS100','SPX500','US30','GER40','UK100','JP225','HK50','AUS200','US2000',
    'EURTRY','USDTRY','USDZAR','USDMXN','USDSEK','USDNOK','USDDKK','USDPLN','USDHUF','USDCZK',
    'USDCNH','USDHKD','USDSGD','USDINR','USDTHB','USDKRW','USDBRL','USDARS'
  ];

  const CRYPTO_SYMBOLS = [
    'BTCUSD','ETHUSD','BNBUSD','SOLUSD','XRPUSD','ADAUSD','DOGEUSD','AVAXUSD',
    'DOTUSD','MATICUSD','LINKUSD','LTCUSD','BCHUSD','UNIUSD','ATOMUSD','XLMUSD',
    'ETCUSD','FILUSD','APTUSD','ARBUSD','OPUSD','NEARUSD','INJUSD','SUIUSD',
    'IMXUSD','HBARUSD','VETUSD','ALGOUSD','FTMUSD','SANDUSD','MANAUSD','AXSUSD',
    'GRTUSD','AAVEUSD','MKRUSD','SNXUSD','CRVUSD','COMPUSD','SUSHIUSD','YFIUSD',
    'ZECUSD','DASHUSD','XMRUSD','EOSUSD','NEOUSD','QTUMUSD','IOTAUSD','THETAUSD',
    'EGLDUSD','FLOWUSD','CHZUSD','ENJUSD','BATUSD','ZILUSD','ONEUSD','HOTUSD',
    'ANKRUSD','CELOUSD','KSMUSD','ICPUSD','RNDRUSD','RPLUSD','LDOUSD','GMXUSD',
    'DYDXUSD','APEUSD','GALAUSD','KAVAUSD','ROSEUSD','OCEANUSD','BANDUSD','STORJUSD',
    'KNCUSD','ZRXUSD','REPUSD','MLNUSD','BALUSD','RENUSD','LRCUSD','CTSIUSD',
    'TRXUSD','TONUSD','SHIBUSD','PEPEUSD','FLOKIUSD','BONKUSD','WIFUSD','MEMEUSD',
    'SEIUSD','TIAUSD','JUPUSD','PYTHUSD','STRKUSD','DYMUSD','ALTUSD','MANTAUSD',
    'PIXELUSD','PORTALUSD','AEVOUSD','ETHFIUSD','ENAUSD','OMNIUSD','REZUSD',
    'SAGAUSD','TNSRUSD','OMUSD','NOTUSD','IOUSD','ZKUSD','LISTAUSD','ZROUSD',
    'BLASTUSD','TAIKOUSD','MOCAUSD','RENDERUSD','POLUSD','NEIROUSD','TURBOUSD',
    'EIGENUSD','HAMSTERUSD','SCRUSD','MOVEUSD','MEUSD','USUALUSD','PENGUUSD',
    'AI16ZUSD','GRASSUSD','VIRTUALUSD','SWARMSUSD','TRUMPUSD','ANIMEUSD','VINEUSD','BERAUSD',
    'KAITOUSD','IPUSD','REDUSD','SHELLUSD','PLUMEUSD','BMTUSD','PARTIUSD','BABYUSD',
    'WCTUSD','HYPERUSD','INITUSD','SIGNUSD','SXTUSD','MILKUSD','OBOLUSD','AEROUSD',
    'ZKJUSD','HUMAUSD','RESOLVUSD','HOMEUSD','PUMPUSD','SAHARAUSD','NEWTUSD','SPKUSD'
  ];

  const ALL_SYMBOLS = FOREX_SYMBOLS.concat(CRYPTO_SYMBOLS);

  const STRATEGIES = [
    'London Breakout','NY Breakout','Asia Range','Mean Reversion','Trend Following',
    'Structure Break','Price Action','Supply & Demand','Order Block','Liquidity Grab',
    'Fibonacci Retracement','Support & Resistance','Scalping','Day Trading','Swing Trading',
    'Range Trading','Momentum','Reversal','Pullback','Channel Trading',
    'EMA Crossover','MA Ribbon','RSI Divergence','MACD Signal','Bollinger Bounce',
    'VWAP','Ichimoku','Elliott Wave','Harmonic Pattern','Smart Money Concept',
    'ICT Concepts','Break & Retest','Trendline Break','Gap Fill','News Trading',
    'Carry Trade','Grid','Hedge','Cup & Handle','Head & Shoulders',
    'Triangle','Wedge','Flag Pattern','Double Top','Double Bottom',
    'Bat Pattern','Gartley Pattern','Butterfly Pattern','Crab Pattern','Shark Pattern'
  ];

  const TAGS = [
    'Breakout','Pullback','Reversal','Trend','Range','Trendline',
    'London','NY','Asia','M5','M15','M30','H1','H4','D1','W1',
    'News','NFP','CPI','FOMC','ECB','BOE','BOJ',
    'Stop Hunt','Liquidity','Order Block','FVG','BOS','CHoCH',
    'Confluence','A+','B','C','Setup A','Setup B',
    'Mistake','FOMO','Revenge','Overtrade','Discipline','Plan Followed',
    'Scalp','Day','Swing','Position','Gold','Oil','Indices','Crypto','Forex'
  ];

  const MONTHS_FA = ['ژانویه','فوریه','مارس','آوریل','مه','ژوئن','جولای','اوت','سپتامبر','اکتبر','نوامبر','دسامبر'];
  const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  /* ============================ STORAGE ============================ */
  const KEYS = {
    trades: 'po.v4.trades', theme: 'po.v4.theme',
    goal: 'po.v4.goal', rules: 'po.v4.rules',
    checklist: 'po.v4.checklist'
  };
  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed != null ? parsed : fallback;
    } catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) { console.warn('Storage error:', e); }
  }

  /* ============================ STATE ============================ */
  let trades = loadJSON(KEYS.trades, []);
  if (!Array.isArray(trades)) trades = [];

  // Checklist items (managed from settings)
  let checklistItems = (function () {
    const stored = loadJSON(KEYS.checklist, null);
    if (Array.isArray(stored) && stored.length) {
      const cleaned = stored
        .filter(x => x && x.id && (x.text || x.fa || x.en))
        .map(x => ({ id: x.id, text: x.text || x.fa || x.en }));
      if (cleaned.length) return cleaned;
    }
    return DEFAULT_RULES.map(r => ({ id: r.id, text: r.fa || r.en }));
  })();
  let clEditingId = null;

  let editingId = null;
  let range = '30';
  let calDate = new Date();
  let selectedEmotion = 'calm';
  let currentScreenshot = null;
  let theme = loadJSON(KEYS.theme, 'dark');
  let goal = loadJSON(KEYS.goal, null);
  let rules = loadJSON(KEYS.rules, {
    enabled: false, dailyLoss: 0, maxDD: 0, target: 0, balance: 10000
  });
  let filters = {
    search: '', strategy: 'all', tag: 'all', result: 'all',
    emotion: 'all', side: 'all', from: '', to: ''
  };
  function saveTrades() { saveJSON(KEYS.trades, trades); }

  /* ============================ CALCULATIONS ============================ */
  const pnl = t => {
    const a = Math.abs(Number(t.amount) || 0);
    if (t.result === 'win') return a;
    if (t.result === 'loss') return -a;
    return 0;
  };
  const rMultiple = t => {
    const risk = Math.abs(Number(t.risk) || 0);
    if (!risk) return null;
    return r2(pnl(t) / risk);
  };
  const disciplineScore = (t, rulesArr) => {
    if (!rulesArr || !rulesArr.length) return null;
    const cl = t.checklist || {};
    let checked = 0;
    for (const r of rulesArr) if (cl[r.id]) checked++;
    return Math.round((checked / rulesArr.length) * 100);
  };
  const sortAsc = list => list.slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  function computeStats(list) {
    let wins = 0, losses = 0, be = 0, gp = 0, gl = 0, net = 0;
    let rSum = 0, rCount = 0;
    for (const t of list) {
      const p = pnl(t);
      net += p;
      if (t.result === 'win')       { wins++;  gp += p; }
      else if (t.result === 'loss') { losses++; gl += Math.abs(p); }
      else be++;
      const rm = rMultiple(t);
      if (rm != null) { rSum += rm; rCount++; }
    }
    const closed = wins + losses;
    const winRate = closed ? (wins / closed) * 100 : 0;
    const pf = gl > 0 ? gp / gl : (gp > 0 ? Infinity : 0);
    const avgWin = wins ? gp / wins : 0;
    const avgLoss = losses ? gl / losses : 0;
    const expectancy = list.length ? net / list.length : 0;
    const avgR = rCount ? rSum / rCount : 0;
    const sorted = sortAsc(list);
    let equity = 0, peak = 0, maxDD = 0;
    for (const t of sorted) {
      equity += pnl(t);
      if (equity > peak) peak = equity;
      const dd = peak - equity;
      if (dd > maxDD) maxDD = dd;
    }
    return {
      total: list.length, wins, losses, be, closed,
      net, grossProfit: gp, grossLoss: gl,
      winRate, profitFactor: pf, avgWin, avgLoss,
      expectancy, maxDrawdown: maxDD, avgR, rCount
    };
  }

  function byDay(list) {
    const map = new Map();
    for (const t of sortAsc(list)) {
      let d = map.get(t.date);
      if (!d) {
        d = { date: t.date, net: 0, count: 0, wins: 0, losses: 0, profit: 0, loss: 0 };
        map.set(t.date, d);
      }
      const p = pnl(t);
      d.net += p; d.count++;
      if (t.result === 'win')       { d.wins++;   d.profit += p; }
      else if (t.result === 'loss') { d.losses++; d.loss += Math.abs(p); }
    }
    const arr = Array.from(map.values()).sort((a, b) => a.date < b.date ? -1 : 1);
    let cum = 0;
    for (const d of arr) {
      cum += d.net;
      d.cum = r2(cum); d.net = r2(d.net);
      d.profit = r2(d.profit); d.loss = r2(d.loss);
    }
    return arr;
  }

  function byStrategy(list) {
    const map = new Map();
    for (const t of list) {
      const key = t.strategy || '—';
      let s = map.get(key);
      if (!s) { s = { name: key, count: 0, wins: 0, losses: 0, net: 0 }; map.set(key, s); }
      s.count++; s.net += pnl(t);
      if (t.result === 'win') s.wins++;
      else if (t.result === 'loss') s.losses++;
    }
    const arr = Array.from(map.values());
    arr.forEach(s => {
      const c = s.wins + s.losses;
      s.winRate = c ? (s.wins / c) * 100 : 0;
      s.net = r2(s.net);
    });
    arr.sort((a, b) => b.net - a.net);
    return arr;
  }

  function byEmotion(list) {
    const map = new Map();
    for (const t of list) {
      const key = t.emotion || 'calm';
      let e = map.get(key);
      if (!e) { e = { key, count: 0, wins: 0, losses: 0, net: 0 }; map.set(key, e); }
      e.count++; e.net += pnl(t);
      if (t.result === 'win') e.wins++;
      else if (t.result === 'loss') e.losses++;
    }
    const arr = Array.from(map.values());
    arr.forEach(e => {
      const c = e.wins + e.losses;
      e.winRate = c ? (e.wins / c) * 100 : 0;
      e.net = r2(e.net);
    });
    arr.sort((a, b) => b.net - a.net);
    return arr;
  }

  function inRange(list, days) {
    if (days === 'all') return list.slice();
    const n = Number(days);
    if (!n) return list.slice();
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (n - 1));
    const iso = toISO(cutoff);
    return list.filter(t => t.date >= iso);
  }

  /* ============================ GOALS ============================ */
  function getGoalProgress() {
    if (!goal || !goal.target) return null;
    const now = new Date();
    let startISO, endISO;
    if (goal.period === 'week') {
      const dayOfWeek = now.getDay();
      const daysSinceSat = (dayOfWeek + 1) % 7;
      const start = new Date(now);
      start.setDate(now.getDate() - daysSinceSat);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      startISO = toISO(start); endISO = toISO(end);
    } else {
      startISO = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
      endISO = toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    }
    const periodTrades = trades.filter(t => t.date >= startISO && t.date <= endISO);
    const stats = computeStats(periodTrades);
    let current = 0;
    if (goal.metric === 'pnl') current = stats.net;
    else if (goal.metric === 'trades') current = stats.total;
    else if (goal.metric === 'winrate') current = stats.winRate;
    const progress = goal.target > 0 ? Math.max(0, Math.min(100, (current / goal.target) * 100)) : 0;
    return {
      current: r2(current), target: goal.target, progress,
      metric: goal.metric, period: goal.period,
      startISO, endISO, stats
    };
  }

  /* ============================ PROP FIRM ============================ */
  function computePropFirm() {
    const balance = Math.abs(Number(rules.balance) || 10000);
    const sorted = sortAsc(trades);
    let cumPnL = 0, peakPnL = 0;
    for (const tr of sorted) {
      cumPnL += pnl(tr);
      if (cumPnL > peakPnL) peakPnL = cumPnL;
    }
    const currentEquity = balance + cumPnL;
    const peakEquity = balance + peakPnL;
    const currentDD = Math.max(0, peakEquity - currentEquity);
    const totalNet = cumPnL;
    const today = todayISO();
    let todayPnL = 0;
    for (const tr of trades) if (tr.date === today) todayPnL += pnl(tr);
    const todayLoss = todayPnL < 0 ? -todayPnL : 0;
    return {
      balance,
      currentEquity: r2(currentEquity), peakEquity: r2(peakEquity),
      net: r2(totalNet), peakPnL: r2(peakPnL),
      maxDD: r2(currentDD), currentDD: r2(currentDD),
      todayPnL: r2(todayPnL), todayLoss: r2(todayLoss)
    };
  }

  function checkRules() {
    if (!rules || !rules.enabled) return null;
    const pf = computePropFirm();
    const checks = { dailyLoss: null, maxDD: null, target: null, pf };
    if (rules.dailyLoss > 0) {
      const usage = Math.max(0, (pf.todayLoss / rules.dailyLoss) * 100);
      checks.dailyLoss = {
        loss: pf.todayLoss, limit: rules.dailyLoss, usage,
        status: usage >= 100 ? 'bad' : usage >= 80 ? 'warn' : 'ok'
      };
    }
    if (rules.maxDD > 0) {
      const usage = (pf.currentDD / rules.maxDD) * 100;
      checks.maxDD = {
        dd: pf.currentDD, limit: rules.maxDD, usage,
        status: usage >= 100 ? 'bad' : usage >= 80 ? 'warn' : 'ok'
      };
    }
    if (rules.target > 0) {
      const progress = (pf.net / rules.target) * 100;
      checks.target = {
        net: pf.net, target: rules.target, progress,
        status: progress >= 100 ? 'ok' : 'warn'
      };
    }
    return checks;
  }

  /* ============================ SCREENSHOT ============================ */
  function compressImage(file, maxDim = 900, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let width = img.width, height = img.height;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width); width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height); height = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          try { resolve(canvas.toDataURL('image/jpeg', quality)); }
          catch (err) { reject(err); }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ============================ CHART ENGINE ============================ */
  const FONT = "Vazirmatn, Inter, system-ui, Tahoma, sans-serif";

  function getChartColors() {
    const dark = document.documentElement.dataset.theme !== 'light';
    return {
      grid: dark ? 'rgba(120,150,200,.09)' : 'rgba(80,110,170,.12)',
      gridZero: dark ? 'rgba(120,150,200,.24)' : 'rgba(80,110,170,.3)',
      axis: dark ? '#7d8fae' : '#6b7a99',
      line: '#2ee6a6',
      areaTop: 'rgba(46,230,166,.35)',
      areaMid: 'rgba(46,230,166,.10)',
      areaBot: 'rgba(46,230,166,0)',
      posTop: 'rgba(120,255,210,1)', pos: 'rgba(46,230,166,.85)',
      negTop: 'rgba(255,140,160,1)', neg: 'rgba(255,86,116,.85)',
      cross: dark ? 'rgba(150,175,215,.4)' : 'rgba(80,110,170,.5)',
      tagBg: dark ? 'rgba(11,18,33,.97)' : 'rgba(255,255,255,.98)',
      tagBd: dark ? 'rgba(120,150,200,.35)' : 'rgba(80,110,170,.25)',
      text: dark ? '#eef3ff' : '#0f1830',
      muted: dark ? '#8697b8' : '#6b7a99'
    };
  }
  const charts = new WeakMap();

  function setupCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 10);
    const h = Math.max(rect.height, 10);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw; canvas.height = ph;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function niceScale(min, max, ticks) {
    ticks = ticks || 5;
    if (min === max) { min -= 1; max += 1; }
    const range = max - min;
    const raw = range / ticks;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    let step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    step *= mag;
    return {
      min: Math.floor(min / step) * step,
      max: Math.ceil(max / step) * step,
      step
    };
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
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

  function drawTag(ctx, cx, cy, lines, w, h) {
    const COL = getChartColors();
    ctx.font = '600 12px ' + FONT;
    let maxW = 0;
    for (const l of lines) maxW = Math.max(maxW, ctx.measureText(l).width);
    const boxW = maxW + 22, lh = 16, boxH = lines.length * lh + 14;
    let bx = cx - boxW / 2, by = cy - boxH - 16;
    bx = Math.max(4, Math.min(bx, w - boxW - 4));
    if (by < 4) by = cy + 16;
    if (by + boxH > h - 4) by = h - boxH - 4;
    roundRect(ctx, bx, by, boxW, boxH, 10);
    ctx.fillStyle = COL.tagBg; ctx.fill();
    ctx.strokeStyle = COL.tagBd; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = i === 0 ? COL.text : COL.muted;
      ctx.font = (i === 0 ? '700 12.5px ' : '') + FONT;
      ctx.fillText(lines[i], bx + boxW / 2, by + 7 + i * lh);
    }
  }

  function attachHover(canvas) {
    if (canvas.__hoverBound) return;
    canvas.__hoverBound = true;
    let rafId = null;
    const handleMove = e => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const st = charts.get(canvas);
        if (!st || !st.geom) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        const idx = st.geom.indexAt(x);
        if (idx !== st.hover) { st.hover = idx; st.draw(canvas, st); }
      });
    };
    canvas.addEventListener('mousemove', handleMove, { passive: true });
    canvas.addEventListener('touchstart', handleMove, { passive: true });
    canvas.addEventListener('touchmove', handleMove, { passive: true });
    canvas.addEventListener('mouseleave', () => {
      const st = charts.get(canvas);
      if (st && st.hover !== -1) { st.hover = -1; st.draw(canvas, st); }
    });
    canvas.addEventListener('touchend', () => {
      const st = charts.get(canvas);
      if (st && st.hover !== -1) {
        setTimeout(() => {
          const s2 = charts.get(canvas);
          if (s2) { s2.hover = -1; s2.draw(canvas, s2); }
        }, 1500);
      }
    });
  }

  function drawEmpty(ctx, w, h) {
    const COL = getChartColors();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = COL.muted; ctx.font = '13px ' + FONT;
    ctx.fillText(t('no_data'), w / 2, h / 2);
  }

  function renderLine(canvas, st) {
    const COL = getChartColors();
    const s = setupCanvas(canvas);
    const ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    const data = st.data;
    if (!data || !data.length) { st.geom = null; drawEmpty(ctx, w, h); return; }

    const compactMode = w < 400;
    const pad = { t: 18, r: 12, b: 28, l: compactMode ? 46 : 58 };
    const plotW = Math.max(10, w - pad.l - pad.r);
    const plotH = Math.max(10, h - pad.t - pad.b);

    let lo = 0, hi = 0;
    for (const d of data) { if (d.value < lo) lo = d.value; if (d.value > hi) hi = d.value; }
    const scale = niceScale(lo, hi, 5);
    const yOf = v => pad.t + (scale.max - v) / (scale.max - scale.min) * plotH;
    const n = data.length;
    const xOf = i => n === 1 ? pad.l + plotW / 2 : pad.l + (i / (n - 1)) * plotW;

    ctx.font = (compactMode ? '10px ' : '11px ') + FONT;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
    for (let v = scale.min; v <= scale.max + 1e-9; v += scale.step) {
      const y = Math.round(yOf(v)) + 0.5;
      const isZero = Math.abs(v) < 1e-9;
      ctx.strokeStyle = isZero ? COL.gridZero : COL.grid;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + plotW, y); ctx.stroke();
      ctx.fillStyle = COL.axis; ctx.fillText(compact(v), pad.l - 8, y);
    }

    const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.value), value: d.value, label: d.label }));
    const baseY = yOf(0);
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + plotH);
    grad.addColorStop(0, COL.areaTop);
    grad.addColorStop(0.5, COL.areaMid);
    grad.addColorStop(1, COL.areaBot);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, baseY);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.lineTo(pts[n - 1].x, baseY);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    const lineGrad = ctx.createLinearGradient(pad.l, 0, pad.l + plotW, 0);
    lineGrad.addColorStop(0, '#2ee6a6');
    lineGrad.addColorStop(1, '#5b8cff');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = lineGrad; ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();

    if (n <= (compactMode ? 25 : 45)) {
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = COL.line; ctx.fill();
        ctx.strokeStyle = COL.tagBg; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }

    const maxLabels = Math.max(2, Math.floor(plotW / (compactMode ? 60 : 88)));
    const stepI = Math.max(1, Math.ceil(n / maxLabels));
    ctx.fillStyle = COL.axis;
    ctx.font = (compactMode ? '10px ' : '11px ') + FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let i = 0; i < n; i += stepI) {
      ctx.fillText(shortDate(data[i].label), xOf(i), pad.t + plotH + 8);
    }
    if ((n - 1) % stepI !== 0) {
      ctx.fillText(shortDate(data[n - 1].label), xOf(n - 1), pad.t + plotH + 8);
    }

    if (st.hover > -1 && st.hover < n) {
      const p = pts[st.hover];
      ctx.setLineDash([4, 4]); ctx.strokeStyle = COL.cross; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x, pad.t); ctx.lineTo(p.x, pad.t + plotH); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = COL.tagBg; ctx.fill();
      ctx.strokeStyle = COL.line; ctx.lineWidth = 2.5; ctx.stroke();
      drawTag(ctx, p.x, p.y, [money(p.value), fullDate(p.label)], w, h);
    }

    st.geom = {
      indexAt: function (x) {
        if (x < pad.l - 14 || x > pad.l + plotW + 14) return -1;
        let best = 0, bd = Infinity;
        for (let i = 0; i < n; i++) {
          const d = Math.abs(pts[i].x - x);
          if (d < bd) { bd = d; best = i; }
        }
        return best;
      }
    };
  }

  function renderBars(canvas, st) {
    const COL = getChartColors();
    const s = setupCanvas(canvas);
    const ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    const data = st.data;
    if (!data || !data.length) { st.geom = null; drawEmpty(ctx, w, h); return; }

    const compactMode = w < 400;
    const pad = { t: 18, r: 12, b: 28, l: compactMode ? 46 : 58 };
    const plotW = Math.max(10, w - pad.l - pad.r);
    const plotH = Math.max(10, h - pad.t - pad.b);

    let lo = 0, hi = 0;
    for (const d of data) { if (d.value < lo) lo = d.value; if (d.value > hi) hi = d.value; }
    if (lo === 0 && hi === 0) { lo = -1; hi = 1; }
    const scale = niceScale(lo, hi, 5);
    const yOf = v => pad.t + (scale.max - v) / (scale.max - scale.min) * plotH;
    const yZero = yOf(0);
    const n = data.length;
    const slot = plotW / n;
    const barW = Math.max(3, Math.min(slot * 0.62, compactMode ? 26 : 44));
    const xOf = i => pad.l + slot * i + slot / 2;

    ctx.font = (compactMode ? '10px ' : '11px ') + FONT;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
    for (let v = scale.min; v <= scale.max + 1e-9; v += scale.step) {
      const y = Math.round(yOf(v)) + 0.5;
      const isZero = Math.abs(v) < 1e-9;
      ctx.strokeStyle = isZero ? COL.gridZero : COL.grid;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + plotW, y); ctx.stroke();
      ctx.fillStyle = COL.axis; ctx.fillText(compact(v), pad.l - 8, y);
    }

    const bars = [];
    for (let i = 0; i < n; i++) {
      const v = data[i].value;
      const x = xOf(i) - barW / 2;
      const y = yOf(v);
      const top = Math.min(y, yZero);
      const bh = Math.max(Math.abs(y - yZero), v === 0 ? 1 : 2);
      const positive = v >= 0;
      bars.push({ x: xOf(i), y: y, top: top, h: bh, value: v, label: data[i].label });

      if (st.hover === i) {
        roundRect(ctx, x - 3, top - 3, barW + 6, bh + 6, 8);
        ctx.fillStyle = positive ? 'rgba(46,230,166,.18)' : 'rgba(255,86,116,.18)';
        ctx.fill();
      }
      const bg = ctx.createLinearGradient(0, top, 0, top + bh);
      if (positive) { bg.addColorStop(0, COL.posTop); bg.addColorStop(1, COL.pos); }
      else { bg.addColorStop(0, COL.negTop); bg.addColorStop(1, COL.neg); }
      roundRect(ctx, x, top, barW, bh, Math.min(5, barW / 2));
      ctx.fillStyle = bg; ctx.fill();
    }

    ctx.strokeStyle = COL.gridZero; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, Math.round(yZero) + 0.5);
    ctx.lineTo(pad.l + plotW, Math.round(yZero) + 0.5);
    ctx.stroke();

    const maxLabels = Math.max(2, Math.floor(plotW / (compactMode ? 60 : 88)));
    const stepI = Math.max(1, Math.ceil(n / maxLabels));
    ctx.fillStyle = COL.axis;
    ctx.font = (compactMode ? '10px ' : '11px ') + FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let i = 0; i < n; i += stepI) {
      ctx.fillText(shortDate(data[i].label), xOf(i), pad.t + plotH + 8);
    }
    if ((n - 1) % stepI !== 0) {
      ctx.fillText(shortDate(data[n - 1].label), xOf(n - 1), pad.t + plotH + 8);
    }

    if (st.hover > -1 && st.hover < n) {
      const b = bars[st.hover];
      drawTag(ctx, b.x, b.value >= 0 ? b.top : b.top + b.h,
              [money(b.value), fullDate(b.label)], w, h);
    }

    st.geom = {
      indexAt: function (x) {
        if (x < pad.l - 14 || x > pad.l + plotW + 14) return -1;
        let best = 0, bd = Infinity;
        for (let i = 0; i < n; i++) {
          const d = Math.abs(bars[i].x - x);
          if (d < bd) { bd = d; best = i; }
        }
        return best;
      }
    };
  }

  function chartLine(canvas, data) {
    if (!canvas) return;
    let st = charts.get(canvas);
    if (!st || st.type !== 'line') {
      st = { type: 'line', data: [], hover: -1, geom: null, draw: renderLine };
      charts.set(canvas, st); attachHover(canvas);
    }
    st.data = data; st.hover = -1; renderLine(canvas, st);
  }
  function chartBars(canvas, data) {
    if (!canvas) return;
    let st = charts.get(canvas);
    if (!st || st.type !== 'bars') {
      st = { type: 'bars', data: [], hover: -1, geom: null, draw: renderBars };
      charts.set(canvas, st); attachHover(canvas);
    }
    st.data = data; st.hover = -1; renderBars(canvas, st);
  }

  /* ============================ DOM REFS ============================ */
  const el = {
    html: document.documentElement,
    tabs: $('#tabs'), themeBtn: $('#theme-btn'), langBtn: $('#lang-btn'), langLabel: $('#lang-label'),
    pageAdd: $('#page-add'), pageAnalysis: $('#page-analysis'),
    pageCalendar: $('#page-calendar'), pageTrades: $('#page-trades'), pageSettings: $('#page-settings'),
    form: $('#trade-form'),
    fDate: $('#f-date'), fSymbol: $('#f-symbol'), fStrategy: $('#f-strategy'),
    fAmount: $('#f-amount'), fRisk: $('#f-risk'), fTags: $('#f-tags'), fNote: $('#f-note'),
    sideSeg: $('#f-side'), resultSeg: $('#f-result'),
    emotionWrap: $('#f-emotion'), checklistWrap: $('#f-checklist'),
    tagsPreview: $('#tags-preview'),
    uploadZone: $('#upload-zone'), uploadInner: $('#upload-inner'),
    uploadPreview: $('#upload-preview'), uploadImg: $('#upload-img'),
    uploadRemove: $('#upload-remove'), fScreenshot: $('#f-screenshot'),
    submitBtn: $('#submit-btn'), cancelEdit: $('#cancel-edit'), formMsg: $('#form-msg'),
    recentList: $('#recent-list'), recentCount: $('#recent-count'),
    rulesBanner: $('#rules-banner'),
    rangeFilter: $('#range-filter'), kpis: $('#kpis'),
    equityChart: $('#equity-chart'), dailyChart: $('#daily-chart'),
    emotionsStats: $('#emotions-stats'),
    strategyTable: $('#strategy-table'), dailyTable: $('#daily-table'),
    goalsMiniCard: $('#goals-mini-card'), goalsMini: $('#goals-mini'), goalsMiniPeriod: $('#goals-mini-period'),
    calTitle: $('#cal-title'), calGrid: $('#cal-grid'),
    calPrev: $('#cal-prev'), calNext: $('#cal-next'),
    calDetailCard: $('#cal-detail-card'), calDetailTitle: $('#cal-detail-title'),
    calDetailList: $('#cal-detail-list'), calDetailClose: $('#cal-detail-close'),
    allCount: $('#all-count'), allTradesList: $('#all-trades-list'),
    fltSearch: $('#flt-search'), fltStrategy: $('#flt-strategy'), fltTag: $('#flt-tag'),
    fltResult: $('#flt-result'), fltEmotion: $('#flt-emotion'), fltSide: $('#flt-side'),
    fltFrom: $('#flt-from'), fltTo: $('#flt-to'), fltClear: $('#flt-clear'),
    goalPeriod: $('#goal-period'), goalMetric: $('#goal-metric'), goalTarget: $('#goal-target'),
    saveGoal: $('#save-goal'), clearGoal: $('#clear-goal'),
    goalMsg: $('#goal-msg'), goalsPreview: $('#goals-preview'),
    rulesEnabled: $('#rules-enabled'), ruleDaily: $('#rule-daily'),
    ruleMaxDD: $('#rule-maxdd'), ruleTarget: $('#rule-target'), ruleBalance: $('#rule-balance'),
    saveRules: $('#save-rules'), rulesMsg: $('#rules-msg'), rulesStatus: $('#rules-status'),
    demoBtn: $('#demo-btn'), exportBtn: $('#export-btn'),
    importInput: $('#import-input'), clearBtn: $('#clear-btn'),
    /* Checklist manager */
    clNewInput: $('#cl-new-input'),
    clAddBtn: $('#cl-add-btn'),
    clItems: $('#cl-items'),
    clMsg: $('#cl-msg')
