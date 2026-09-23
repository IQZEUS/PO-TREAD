/* =========================================================
   PO-TRADE — Bilingual Trade Journal v8
   + Advanced Analytics (MA, R-Multiple, Drawdown Zones)
   + Calendar Heatmap + Weekly/Monthly Stats
   + Trade Templates & Quick Entry
   + Advanced Settings (Risk Calculator, Notifications)
   + Symbol/Strategy/Tag Autocomplete
   + Theme Manager (Classic/Neon/Cyberpunk + Dark/Light)
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
      entry: '📍 قیمت ورود', exit: '🎯 قیمت خروج', sl: '🛑 حد ضرر', tp: '✅ حد سود',
      lot: '📦 حجم (لات)', rr: '⚖️ نسبت R:R (خودکار)',
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
      kpi_sharpe: 'شارپ ریشو', kpi_sortino: 'سورتینو', kpi_calmar: 'کالمار',
      kpi_streak: 'بهترین استریک', kpi_lstreak: 'بدترین استریک',
      kpi_recovery: 'ریکاوری فاکتور', kpi_avgdur: 'میانگین مدت',
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
      checklist_settings: '✅ مدیریت چک‌لیست',
      checklist_settings_sub: 'آیتم‌ها رو ویرایش، اضافه یا حذف کن — خودکار روی حسابت ذخیره می‌شه',
      checklist_new_ph: 'آیتم جدید...',
      save_checklist: '💾 ذخیره چک‌لیست',
      reset_checklist: '↺ بازگردانی پیش‌فرض',
      checklist_saved: '✅ چک‌لیست ذخیره شد',
      checklist_reset: '✅ چک‌لیست به حالت پیش‌فرض بازگشت',
      checklist_empty: 'هنوز آیتمی نداری — یکی اضافه کن',
      checklist_del_title: 'حذف آیتم چک‌لیست',
      checklist_del_msg: 'این آیتم حذف شود؟',
      checklist_del_ok: 'حذف کن',
      checklist_added: '➕ آیتم اضافه شد',
      checklist_deleted: '🗑️ آیتم حذف شد',
      checklist_need_item: '❌ متن آیتم رو بنویس',
      checklist_cloud_ok: '☁️ روی حساب کاربری ذخیره شد',
      checklist_cloud_synced: '☁️ چک‌لیست از حسابت لود شد',
      theme_title: 'تم ظاهری',
      theme_classic: 'کلاسیک', theme_neon: 'نئون', theme_cyberpunk: 'سایبرپانک',
      theme_light: 'حالت روشن', theme_dark: 'حالت تاریک',
      theme_applied: '🎨 تم {name} فعال شد',
      // ===== NEW v8 =====
      advanced_metrics: '📐 معیارهای پیشرفته',
      advanced_metrics_sub: 'شارپ، سورتینو، کالمار، ریکاوری',
      r_distribution: '📊 توزیع R-Multiple',
      r_distribution_sub: 'چند معامله در هر بازه R',
      weekly_pnl: '📅 سود هفتگی',
      monthly_pnl: '📆 سود ماهانه',
      symbol_perf: '💱 عملکرد نمادها',
      side_analysis: '⚖️ تحلیل خرید/فروش',
      hour_analysis: '⏰ تحلیل ساعتی',
      duration_analysis: '⏱️ تحلیل مدت معامله',
      streak_analysis: '🔥 تحلیل استریک',
      heatmap: '🔥 نقشه حرارتی',
      heatmap_sub: 'وین‌ریت به تفکیک روز و ساعت',
      templates: '⚡ قالب‌های سریع',
      save_template: '💾 ذخیره قالب',
      apply_template: 'اعمال قالب',
      delete_template: 'حذف قالب',
      template_saved: '✅ قالب ذخیره شد',
      template_applied: '⚡ قالب اعمال شد',
      template_deleted: '🗑️ قالب حذف شد',
      template_name: 'نام قالب',
      template_name_ph: 'مثلاً: اسکالپ لندن',
      no_templates: 'هنوز قالبی نداری',
      risk_calculator: '🧮 ماشین‌حساب ریسک',
      risk_calc_sub: 'محاسبه سریع حجم پوزیشن',
      account_balance: '💰 موجودی حساب ($)',
      risk_percent: '📊 درصد ریسک (%)',
      stop_loss_pips: '🛑 فاصله حد ضرر (پیپ)',
      pip_value: '💵 ارزش هر پیپ ($)',
      calc_position: '🎯 محاسبه حجم',
      calc_result: 'حجم پیشنهادی',
      calc_risk_amount: 'مبلغ ریسک',
      notifications: '🔔 اعلان‌ها',
      notifications_sub: 'هشدار خودکار برای اهداف',
      notif_enabled: 'فعال‌سازی اعلان‌ها',
      notif_daily: 'یادآور ثبت روزانه',
      notif_goal: 'اعلان رسیدن به هدف',
      notif_rules: 'اعلان نقض قوانین',
      notif_win: 'اعلان برد/باخت بزرگ',
      big_win_threshold: 'حد برد بزرگ ($)',
      big_loss_threshold: 'حد ضرر بزرگ ($)',
      save_notif: '💾 ذخیره تنظیمات اعلان',
      notif_saved: '✅ تنظیمات اعلان ذخیره شد',
      quick_stats: '📈 آمار سریع',
      best_trade: '🏆 بهترین معامله',
      worst_trade: '💀 بدترین معامله',
      best_hour: '⏰ بهترین ساعت',
      best_day_week: '📅 بهترین روز هفته',
      best_symbol: '💎 بهترین نماد',
      avg_hold: '⏱️ میانگین نگهداری',
      total_pips: '📏 مجموع پیپ',
      avg_rr: '⚖️ میانگین R:R',
      trade_duration: '⏱️ مدت معامله (دقیقه)',
      entry_price: '📍 قیمت ورود',
      exit_price: '🎯 قیمت خروج',
      stop_loss: '🛑 حد ضرر',
      take_profit: '✅ حد سود',
      lot_size: '📦 حجم (لات)',
      auto_rr: '⚖️ نسبت R:R (خودکار)',
      auto_calc: '🤖 محاسبه خودکار',
      advanced_fields: '⚙️ فیلدهای پیشرفته',
      show_advanced: 'نمایش فیلدهای پیشرفته',
      hide_advanced: 'پنهان کردن فیلدهای پیشرفته',
      entry_exit_required: 'قیمت ورود و خروج الزامی نیست',
      // Deep Analytics
      deep_analytics: '🔬 آنالیز عمیق',
      deep_analytics_sub: 'تحلیل الگوها و روندها',
      drawdown_chart: '📉 نمودار افت سرمایه',
      rolling_winrate: '📊 وین‌ریت متحرک',
      expectancy_chart: '🎯 انتظار ریاضی متحرک',
      cum_r_chart: '📐 R تجمعی',
      day_of_week_perf: '📅 عملکرد روزهای هفته',
      hour_of_day_perf: '⏰ عملکرد ساعت‌های روز',
      symbol_heatmap: '💱 نقشه حرارتی نمادها',
      strategy_radar: '🎯 رادار استراتژی‌ها',
      comparison: '⚖️ مقایسه دوره‌ها',
      period_current: 'دوره فعلی',
      period_previous: 'دوره قبلی',
      change: 'تغییر',
      improved: 'بهبود',
      declined: 'افت',
      stable: 'پایدار',
      goals_advanced: '🎯 اهداف پیشرفته',
      add_goal: '➕ افزودن هدف',
      multiple_goals: 'اهداف چندگانه',
      goal_type: 'نوع هدف',
      goal_type_pnl: 'سود کل',
      goal_type_winrate: 'وین‌ریت',
      goal_type_trades: 'تعداد معاملات',
      goal_type_pf: 'ضریب سود',
      goal_type_r: 'میانگین R',
      goal_type_dd: 'حداکثر افت',
      goal_type_discipline: 'انضباط',
      goal_compare: 'مقایسه با دوره قبل'
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
      entry: '📍 Entry Price', exit: '🎯 Exit Price', sl: '🛑 Stop Loss', tp: '✅ Take Profit',
      lot: '📦 Lot Size', rr: '⚖️ R:R Ratio (auto)',
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
      kpi_sharpe: 'Sharpe Ratio', kpi_sortino: 'Sortino', kpi_calmar: 'Calmar',
      kpi_streak: 'Best Streak', kpi_lstreak: 'Worst Streak',
      kpi_recovery: 'Recovery Factor', kpi_avgdur: 'Avg Duration',
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
      checklist_settings: '✅ Checklist Manager',
      checklist_settings_sub: 'Edit, add, or remove items — auto-saved to your account',
      checklist_new_ph: 'New item...',
      save_checklist: '💾 Save Checklist',
      reset_checklist: '↺ Reset to Default',
      checklist_saved: '✅ Checklist saved',
      checklist_reset: '✅ Checklist reset to default',
      checklist_empty: 'No items yet — add one',
      checklist_del_title: 'Delete Checklist Item',
      checklist_del_msg: 'Remove this item?',
      checklist_del_ok: 'Delete',
      checklist_added: '➕ Item added',
      checklist_deleted: '🗑️ Item deleted',
      checklist_need_item: '❌ Enter item text',
      checklist_cloud_ok: '☁️ Saved to your account',
      checklist_cloud_synced: '☁️ Checklist loaded from your account',
      theme_title: 'Theme',
      theme_classic: 'Classic', theme_neon: 'Neon', theme_cyberpunk: 'Cyberpunk',
      theme_light: 'Light Mode', theme_dark: 'Dark Mode',
      theme_applied: '🎨 {name} theme applied',
      // ===== NEW v8 =====
      advanced_metrics: '📐 Advanced Metrics',
      advanced_metrics_sub: 'Sharpe, Sortino, Calmar, Recovery',
      r_distribution: '📊 R-Multiple Distribution',
      r_distribution_sub: 'Trades per R bucket',
      weekly_pnl: '📅 Weekly P/L',
      monthly_pnl: '📆 Monthly P/L',
      symbol_perf: '💱 Symbol Performance',
      side_analysis: '⚖️ Buy/Sell Analysis',
      hour_analysis: '⏰ Hour Analysis',
      duration_analysis: '⏱️ Duration Analysis',
      streak_analysis: '🔥 Streak Analysis',
      heatmap: '🔥 Heatmap',
      heatmap_sub: 'Win rate by day & hour',
      templates: '⚡ Quick Templates',
      save_template: '💾 Save Template',
      apply_template: 'Apply Template',
      delete_template: 'Delete Template',
      template_saved: '✅ Template saved',
      template_applied: '⚡ Template applied',
      template_deleted: '🗑️ Template deleted',
      template_name: 'Template name',
      template_name_ph: 'e.g. London Scalp',
      no_templates: 'No templates yet',
      risk_calculator: '🧮 Risk Calculator',
      risk_calc_sub: 'Quick position size calculator',
      account_balance: '💰 Account Balance ($)',
      risk_percent: '📊 Risk Percent (%)',
      stop_loss_pips: '🛑 Stop Loss (pips)',
      pip_value: '💵 Pip Value ($)',
      calc_position: '🎯 Calculate Position',
      calc_result: 'Suggested Lot Size',
      calc_risk_amount: 'Risk Amount',
      notifications: '🔔 Notifications',
      notifications_sub: 'Auto alerts for goals',
      notif_enabled: 'Enable notifications',
      notif_daily: 'Daily log reminder',
      notif_goal: 'Goal reached alert',
      notif_rules: 'Rule breach alert',
      notif_win: 'Big win/loss alert',
      big_win_threshold: 'Big win threshold ($)',
      big_loss_threshold: 'Big loss threshold ($)',
      save_notif: '💾 Save Notification Settings',
      notif_saved: '✅ Notification settings saved',
      quick_stats: '📈 Quick Stats',
      best_trade: '🏆 Best Trade',
      worst_trade: '💀 Worst Trade',
      best_hour: '⏰ Best Hour',
      best_day_week: '📅 Best Weekday',
      best_symbol: '💎 Best Symbol',
      avg_hold: '⏱️ Avg Hold',
      total_pips: '📏 Total Pips',
      avg_rr: '⚖️ Avg R:R',
      trade_duration: '⏱️ Trade Duration (min)',
      entry_price: '📍 Entry Price',
      exit_price: '🎯 Exit Price',
      stop_loss: '🛑 Stop Loss',
      take_profit: '✅ Take Profit',
      lot_size: '📦 Lot Size',
      auto_rr: '⚖️ R:R Ratio (auto)',
      auto_calc: '🤖 Auto Calculate',
      advanced_fields: '⚙️ Advanced Fields',
      show_advanced: 'Show advanced fields',
      hide_advanced: 'Hide advanced fields',
      entry_exit_required: 'Entry/Exit prices are optional',
      deep_analytics: '🔬 Deep Analytics',
      deep_analytics_sub: 'Pattern & trend analysis',
      drawdown_chart: '📉 Drawdown Chart',
      rolling_winrate: '📊 Rolling Win Rate',
      expectancy_chart: '🎯 Rolling Expectancy',
      cum_r_chart: '📐 Cumulative R',
      day_of_week_perf: '📅 Day-of-Week Performance',
      hour_of_day_perf: '⏰ Hour-of-Day Performance',
      symbol_heatmap: '💱 Symbol Heatmap',
      strategy_radar: '🎯 Strategy Radar',
      comparison: '⚖️ Period Comparison',
      period_current: 'Current Period',
      period_previous: 'Previous Period',
      change: 'Change',
      improved: 'Improved',
      declined: 'Declined',
      stable: 'Stable',
      goals_advanced: '🎯 Advanced Goals',
      add_goal: '➕ Add Goal',
      multiple_goals: 'Multiple Goals',
      goal_type: 'Goal Type',
      goal_type_pnl: 'Total P/L',
      goal_type_winrate: 'Win Rate',
      goal_type_trades: 'Trade Count',
      goal_type_pf: 'Profit Factor',
      goal_type_r: 'Avg R',
      goal_type_dd: 'Max Drawdown',
      goal_type_discipline: 'Discipline',
      goal_compare: 'Compare with previous period'
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
  const hexToRgba = (hex, a) => {
    if (!hex || hex[0] !== '#') return 'rgba(46,230,166,' + a + ')';
    let h = hex.slice(1);
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    const n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(46,230,166,' + a + ')';
    return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
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

  const DEFAULT_CHECKLIST = [
    { id: 'setup', text_fa: 'ستاپ تأیید شد',   text_en: 'Setup confirmed' },
    { id: 'stop',  text_fa: 'حد ضرر مشخص شد',   text_en: 'Stop loss defined' },
    { id: 'size',  text_fa: 'حجم مناسب بود',    text_en: 'Position size correct' },
    { id: 'plan',  text_fa: 'طبق پلن پیش رفتم', text_en: 'Followed the plan' }
  ];
  const ruleText = r => {
    if (!r) return '';
    if (lang === 'en') return r.text_en || r.text_fa || r.text || '';
    return r.text_fa || r.text || r.text_en || '';
  };

  const MONTHS_FA = ['ژانویه','فوریه','مارس','آوریل','مه','ژوئن','جولای','اوت','سپتامبر','اکتبر','نوامبر','دسامبر'];
  const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const PRESET_STRATEGIES = [
    'Price Action','Breakout','London Breakout','New York Breakout',
    'Mean Reversion','Trend Following','Counter Trend','Range Trading',
    'Scalping','Day Trading','Swing Trading','Position Trading',
    'Supply & Demand','Support & Resistance','Fibonacci Retracement',
    'Elliott Wave','Harmonic Patterns','ICT / Smart Money','Order Block',
    'Liquidity Grab','Fair Value Gap (FVG)','Break of Structure (BOS)',
    'Change of Character (CHoCH)','VWAP','Volume Profile','Divergence',
    'Momentum','Reversal','News Trading','Carry Trade','Grid Trading',
    'Martingale','Pin Bar','Engulfing','Doji Setup','Inside Bar',
    '3 Drives','Turtle Soup','Cup & Handle','Head & Shoulders',
    'Triangle Breakout','Flag Pattern','Wedge Pattern','Double Top/Bottom',
    'Triple Top/Bottom'
  ];

  const FOREX_PAIRS = [
    'EURUSD','GBPUSD','USDJPY','USDCHF','USDCAD','AUDUSD','NZDUSD',
    'EURGBP','EURJPY','EURCHF','EURCAD','EURAUD','EURNZD',
    'GBPJPY','GBPCHF','GBPCAD','GBPAUD','GBPNZD',
    'AUDJPY','AUDCHF','AUDCAD','AUDNZD',
    'NZDJPY','NZDCHF','NZDCAD',
    'CADJPY','CADCHF','CHFJPY',
    'XAUUSD','XAGUSD','XPTUSD','XPDUSD',
    'US30','NAS100','SPX500','GER40','UK100','JP225','HK50','AUS200',
    'USOIL','UKOIL','NATGAS'
  ];

  const CRYPTO_SYMBOLS = [
    'BTCUSD','ETHUSD','BNBUSD','SOLUSD','XRPUSD','ADAUSD','DOGEUSD','TRXUSD','TONUSD','DOTUSD',
    'MATICUSD','LTCUSD','SHIBUSD','AVAXUSD','BCHUSD','LINKUSD','XLMUSD','UNIUSD','ATOMUSD','ETCUSD',
    'XMRUSD','FILUSD','APTUSD','ARBUSD','OPUSD','NEARUSD','ICPUSD','INJUSD','IMXUSD','SUIUSD',
    'SEIUSD','TIAUSD','RUNEUSD','HBARUSD','ALGOUSD','FTMUSD','SANDUSD','MANAUSD','AXSUSD','GALAUSD',
    'EGLDUSD','FLOWUSD','KAVAUSD','ROSEUSD','ZECUSD','DASHUSD','EOSUSD','XTZUSD','THETAUSD','NEOUSD',
    'IOTAUSD','QTUMUSD','WAVESUSD','ZILUSD','ONEUSD','CHZUSD','ENJUSD','BATUSD','CRVUSD','COMPUSD',
    'MKRUSD','SNXUSD','YFIUSD','SUSHIUSD','1INCHUSD','LDOUSD','GRTUSD','RNDRUSD','FETUSD','OCEANUSD',
    'ARUSD','STXUSD','CFXUSD','KASUSD','ORDIUSD','PEPEUSD','WIFUSD','BONKUSD','FLOKIUSD','JUPUSD',
    'PYTHUSD','STRKUSD','DYMUSD','ALTUSD','ENAUSD','ZKUSD','BLASTUSD','ZROUSD','AAVEUSD','DYDXUSD',
    'CAKEUSD','GMTUSD','APEUSD','ILVUSD','KSMUSD','GLMRUSD','MOVRUSD','AUDIOUSD','CELRUSD','CKBUSD',
    'DUSKUSD','RENUSD','STORJUSD','ANKRUSD','COTIUSD','RSRUSD','BANDUSD','API3USD','OGNUSD','SXPUSD',
    'WANUSD','YGGUSD','JASMYUSD','FIDAUSD','BICOUSD','ALPHAUSD','DENTUSD','HOTUSD','ARPAUSD','TLMUSD',
    'VRAUSD','KNCUSD','ZRXUSD','LRCUSD','BALUSD','RPLUSD','METISUSD','OMGUSD','ELFUSD','ICXUSD',
    'ARKUSD','STEEMUSD','HIVEUSD','LSKUSD','NANOUSD','VETUSD','RVNUSD','SCUSD','DGBUSD','FTTUSD',
    'WOOUSD','BLURUSD','IDUSD','ARKMUSD','AGIXUSD','MASKUSD','ENSUSD','PENDLEUSD','MAGICUSD','HIGHUSD',
    'RDNTUSD','HOOKUSD','ACHUSD','LQTYUSD','SSVUSD','RPLUSD','MULTIUSD','FLUXUSD','MINAUSD','ASTRUSD',
    'GLMRUSD','IOTXUSD','ZENUSD','XEMUSD','ARRRUSD','DCRUSD','BTGUSD','XVGUSD','KMDUSD','NMCUSD'
  ];

  /* ============================ STORAGE ============================ */
  const KEYS = {
    trades: 'po.v4.trades', theme: 'po.v4.theme',
    preset: 'po.v4.preset',
    goal: 'po.v4.goal', rules: 'po.v4.rules',
    checklist: 'po.v4.checklist',
    checklistUpdatedAt: 'po.v4.checklist.updatedAt',
    templates: 'po.v4.templates',       // NEW v8
    notifications: 'po.v4.notifications', // NEW v8
    goals: 'po.v4.goals'                 // NEW v8 - multiple goals
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

  let checklistItems = loadJSON(KEYS.checklist, null);
  if (!Array.isArray(checklistItems) || !checklistItems.length) {
    checklistItems = DEFAULT_CHECKLIST.map(x => ({
      id: x.id, text_fa: x.text_fa, text_en: x.text_en
    }));
  }

  let templates = loadJSON(KEYS.templates, []);          // NEW v8
  if (!Array.isArray(templates)) templates = [];
  let notifications = loadJSON(KEYS.notifications, {     // NEW v8
    enabled: false, daily: false, goal: true, rules: true, win: false,
    bigWin: 500, bigLoss: 500
  });
  let multiGoals = loadJSON(KEYS.goals, []);             // NEW v8
  if (!Array.isArray(multiGoals)) multiGoals = [];
  let advancedFieldsVisible = false;

  let editingId = null;
  let range = '30';
  let calDate = new Date();
  let selectedEmotion = 'calm';
  let currentScreenshot = null;
  let theme = loadJSON(KEYS.theme, 'dark');
  let preset = loadJSON(KEYS.preset, 'dark');
  let goal = loadJSON(KEYS.goal, null);
  let rules = loadJSON(KEYS.rules, {
    enabled: false, dailyLoss: 0, maxDD: 0, target: 0, balance: 10000
  });
  let filters = {
    search: '', strategy: 'all', tag: 'all', result: 'all',
    emotion: 'all', side: 'all', from: '', to: ''
  };
  function saveTrades() { saveJSON(KEYS.trades, trades); }

  /* ============================ THEME MANAGER ============================ */
  function applyPreset(p) {
    preset = p;
    document.documentElement.dataset.preset = p;
    try { localStorage.setItem(KEYS.preset, p); } catch(e){}
    if (el.pageAnalysis && el.pageAnalysis.classList.contains('active')){
      setTimeout(function(){ renderCharts(); renderDeepAnalytics(); }, 80);
    }
  }

  function initThemeManager() {
    document.documentElement.dataset.preset = preset;
    var themeBtnEl = $('#theme-btn');
    if (!themeBtnEl) return;
    if ($('#theme-menu')) return;

    var menuWrap = document.createElement('div');
    menuWrap.className = 'theme-menu-wrap';
    themeBtnEl.parentNode.insertBefore(menuWrap, themeBtnEl);
    menuWrap.appendChild(themeBtnEl);

    var menu = document.createElement('div');
    menu.className = 'theme-menu';
    menu.id = 'theme-menu';
    menu.innerHTML =
      '<div class="theme-menu-title" data-i18n="theme_title">تم ظاهری</div>' +
      '<button class="theme-opt" data-p="dark"><span class="tm-swatch" style="--sw1:#2ee6a6;--sw2:#5b8cff"></span><span data-i18n="theme_classic">کلاسیک</span></button>' +
      '<button class="theme-opt" data-p="neon"><span class="tm-swatch" style="--sw1:#ff3c9c;--sw2:#00d9ff"></span><span data-i18n="theme_neon">نئون</span></button>' +
      '<button class="theme-opt" data-p="cyberpunk"><span class="tm-swatch" style="--sw1:#f6ff00;--sw2:#ff00e5"></span><span data-i18n="theme_cyberpunk">سایبرپانک</span></button>' +
      '<div class="theme-divider"></div>' +
      '<button class="theme-opt" id="theme-mode-toggle"><span class="tm-swatch" style="--sw1:#fff;--sw2:#0a1226"></span><span id="theme-mode-label"></span></button>';
    menuWrap.appendChild(menu);

    function syncActive() {
      $$('.theme-opt[data-p]', menu).forEach(function(b){
        b.classList.toggle('active', b.dataset.p === preset);
      });
      var lbl = $('#theme-mode-label');
      if (lbl) lbl.textContent = theme === 'light' ? t('theme_dark') : t('theme_light');
      var icon = themeBtnEl.querySelector('.theme-icon');
      if (icon) icon.textContent = theme === 'light' ? '☀️' : '🌙';
    }
    syncActive();

    themeBtnEl.addEventListener('click', function(e){
      e.stopPropagation();
      menu.classList.toggle('open');
    });
    document.addEventListener('click', function(e){
      if (!menuWrap.contains(e.target)) menu.classList.remove('open');
    });

    $$('.theme-opt[data-p]', menu).forEach(function(b){
      b.addEventListener('click', function(){
        applyPreset(b.dataset.p);
        syncActive();
        toast(el.formMsg, fmt('theme_applied', { name: b.textContent.trim() }));
      });
    });

    var toggleBtn = $('#theme-mode-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function(){
        theme = theme === 'light' ? 'dark' : 'light';
        applyTheme(theme);
        syncActive();
      });
    }
  }

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
    const equityCurve = [];
    for (const t of sorted) {
      equity += pnl(t);
      equityCurve.push(equity);
      if (equity > peak) peak = equity;
      const dd = peak - equity;
      if (dd > maxDD) maxDD = dd;
    }
    let bestWin=0, bestLoss=0, curWin=0, curLoss=0;
    for (const tr of sorted) {
      if (tr.result === 'win'){ curWin++; curLoss=0; if (curWin>bestWin) bestWin=curWin; }
      else if (tr.result === 'loss'){ curLoss++; curWin=0; if (curLoss>bestLoss) bestLoss=curLoss; }
    }
    // Advanced: Sharpe, Sortino, Calmar
    const returns = sorted.map(t => pnl(t));
    const meanRet = returns.length ? returns.reduce((a,b) => a+b, 0) / returns.length : 0;
    const variance = returns.length ? returns.reduce((a,b) => a + Math.pow(b - meanRet, 2), 0) / returns.length : 0;
    const stdDev = Math.sqrt(variance);
    const sharpe = stdDev > 0 ? (meanRet / stdDev) * Math.sqrt(252) : 0;
    const downsideReturns = returns.filter(r => r < 0);
    const downsideVar = downsideReturns.length ? downsideReturns.reduce((a,b) => a + b*b, 0) / downsideReturns.length : 0;
    const downsideDev = Math.sqrt(downsideVar);
    const sortino = downsideDev > 0 ? (meanRet / downsideDev) * Math.sqrt(252) : 0;
    const calmar = maxDD > 0 ? (net / maxDD) : 0;
    const recovery = maxDD > 0 ? (net / maxDD) : 0;
    return {
      total: list.length, wins, losses, be, closed,
      net, grossProfit: gp, grossLoss: gl,
      winRate, profitFactor: pf, avgWin, avgLoss,
      expectancy, maxDrawdown: maxDD, avgR, rCount,
      sorted, bestWin, bestLoss, curWin, curLoss,
      sharpe: r2(sharpe), sortino: r2(sortino), calmar: r2(calmar),
      recovery: r2(recovery), stdDev: r2(stdDev),
      equityCurve
    };
  }

  function byDay(list) {
    const map = new Map();
    for (const t of sortAsc(list)) {
      let d = map.get(t.date);
      if (!d) {
        d = { date: t.date, net: 0, count: 0, wins: 0, losses: 0, profit: 0, loss: 0, rSum: 0, rCount: 0 };
        map.set(t.date, d);
      }
      const p = pnl(t);
      d.net += p; d.count++;
      if (t.result === 'win')       { d.wins++;   d.profit += p; }
      else if (t.result === 'loss') { d.losses++; d.loss += Math.abs(p); }
      const rm = rMultiple(t);
      if (rm != null) { d.rSum += rm; d.rCount++; }
    }
    const arr = Array.from(map.values()).sort((a, b) => a.date < b.date ? -1 : 1);
    let cum = 0;
    for (const d of arr) {
      cum += d.net;
      d.cum = r2(cum); d.net = r2(d.net);
      d.profit = r2(d.profit); d.loss = r2(d.loss);
      d.avgR = d.rCount ? r2(d.rSum / d.rCount) : 0;
    }
    return arr;
  }

  function byWeek(list) {
    const map = new Map();
    for (const t of list) {
      const d = new Date(t.date);
      const dayOfWeek = d.getDay();
      const daysSinceSat = (dayOfWeek + 1) % 7;
      const sat = new Date(d);
      sat.setDate(d.getDate() - daysSinceSat);
      const key = toISO(sat);
      let w = map.get(key);
      if (!w) {
        w = { weekStart: key, net: 0, count: 0, wins: 0, losses: 0, profit: 0, loss: 0 };
        map.set(key, w);
      }
      const p = pnl(t);
      w.net += p; w.count++;
      if (t.result === 'win')       { w.wins++;   w.profit += p; }
      else if (t.result === 'loss') { w.losses++; w.loss += Math.abs(p); }
    }
    return Array.from(map.values()).sort((a, b) => a.weekStart < b.weekStart ? -1 : 1);
  }

  function byMonth(list) {
    const map = new Map();
    for (const t of list) {
      const key = t.date.slice(0, 7);
      let m = map.get(key);
      if (!m) { m = { month: key, net: 0, count: 0, wins: 0, losses: 0 }; map.set(key, m); }
      m.net += pnl(t); m.count++;
      if (t.result === 'win') m.wins++;
      else if (t.result === 'loss') m.losses++;
    }
    return Array.from(map.values()).sort((a, b) => a.month < b.month ? -1 : 1);
  }

  function byStrategy(list) {
    const map = new Map();
    for (const t of list) {
      const key = t.strategy || '—';
      let s = map.get(key);
      if (!s) { s = { name: key, count: 0, wins: 0, losses: 0, net: 0, rSum: 0, rCount: 0 }; map.set(key, s); }
      s.count++; s.net += pnl(t);
      if (t.result === 'win') s.wins++;
      else if (t.result === 'loss') s.losses++;
      const rm = rMultiple(t);
      if (rm != null) { s.rSum += rm; s.rCount++; }
    }
    const arr = Array.from(map.values());
    arr.forEach(s => {
      const c = s.wins + s.losses;
      s.winRate = c ? (s.wins / c) * 100 : 0;
      s.net = r2(s.net);
      s.avgR = s.rCount ? r2(s.rSum / s.rCount) : 0;
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

  function bySymbol(list) {  // NEW v8
    const map = new Map();
    for (const t of list) {
      const key = t.symbol || '—';
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

  function bySide(list) {  // NEW v8
    const map = new Map();
    for (const t of list) {
      const key = t.side || 'buy';
      let s = map.get(key);
      if (!s) { s = { key, count: 0, wins: 0, losses: 0, net: 0 }; map.set(key, s); }
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
    return arr;
  }

  function byHour(list) {  // NEW v8
    const map = new Map();
    for (let h = 0; h < 24; h++) map.set(h, { hour: h, count: 0, wins: 0, losses: 0, net: 0 });
    for (const t of list) {
      if (!t.hour && t.hour !== 0) continue;
      const h = Number(t.hour);
      if (isNaN(h) || h < 0 || h > 23) continue;
      const s = map.get(h);
      s.count++; s.net += pnl(t);
      if (t.result === 'win') s.wins++;
      else if (t.result === 'loss') s.losses++;
    }
    const arr = Array.from(map.values()).filter(x => x.count > 0);
    arr.forEach(s => {
      const c = s.wins + s.losses;
      s.winRate = c ? (s.wins / c) * 100 : 0;
      s.net = r2(s.net);
    });
    return arr;
  }

  function byWeekday(list) {  // NEW v8
    const map = new Map();
    for (let d = 0; d < 7; d++) map.set(d, { wd: d, count: 0, wins: 0, losses: 0, net: 0 });
    for (const t of list) {
      const d = new Date(t.date);
      const wd = (d.getDay() + 1) % 7;
      const s = map.get(wd);
      s.count++; s.net += pnl(t);
      if (t.result === 'win') s.wins++;
      else if (t.result === 'loss') s.losses++;
    }
    const arr = Array.from(map.values()).filter(x => x.count > 0);
    arr.forEach(s => {
      const c = s.wins + s.losses;
      s.winRate = c ? (s.wins / c) * 100 : 0;
      s.net = r2(s.net);
    });
    return arr;
  }

  function rBuckets(list) {  // NEW v8
    const buckets = [
      { label: '≤ -3R', min: -Infinity, max: -3, count: 0, net: 0 },
      { label: '-2R to -3R', min: -3, max: -2, count: 0, net: 0 },
      { label: '-1R to -2R', min: -2, max: -1, count: 0, net: 0 },
      { label: '0 to -1R', min: -1, max: 0, count: 0, net: 0 },
      { label: '0 to +1R', min: 0, max: 1, count: 0, net: 0 },
      { label: '+1R to +2R', min: 1, max: 2, count: 0, net: 0 },
      { label: '+2R to +3R', min: 2, max: 3, count: 0, net: 0 },
      { label: '≥ +3R', min: 3, max: Infinity, count: 0, net: 0 }
    ];
    for (const t of list) {
      const rm = rMultiple(t);
      if (rm == null) continue;
      for (const b of buckets) {
        if (rm >= b.min && rm < b.max) {
          b.count++; b.net += pnl(t); break;
        }
      }
    }
    return buckets;
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

  function previousRange(list, days) {
    if (days === 'all') return [];
    const n = Number(days);
    if (!n) return [];
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - n);
    const start = new Date(end);
    start.setDate(end.getDate() - (n - 1));
    const startISO = toISO(start), endISO = toISO(end);
    return list.filter(t => t.date >= startISO && t.date <= endISO);
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
    const cs = getComputedStyle(document.documentElement);
    const accent = cs.getPropertyValue('--accent').trim() || '#2ee6a6';
    const accent2 = cs.getPropertyValue('--accent-2').trim() || '#5b8cff';
    return {
      grid: dark ? 'rgba(120,150,200,.08)' : 'rgba(80,110,170,.1)',
      gridZero: dark ? 'rgba(120,150,200,.22)' : 'rgba(80,110,170,.28)',
      axis: dark ? '#7d8fae' : '#6b7a99',
      line: accent,
      line2: accent2,
      areaTop: hexToRgba(accent, 0.4),
      areaMid: hexToRgba(accent, 0.12),
      areaBot: hexToRgba(accent, 0),
      posTop: 'rgba(120,255,210,1)', pos: 'rgba(46,230,166,.85)',
      negTop: 'rgba(255,140,160,1)', neg: 'rgba(255,86,116,.85)',
      cross: dark ? 'rgba(150,175,215,.45)' : 'rgba(80,110,170,.5)',
      tagBg: dark ? 'rgba(10,16,30,.98)' : 'rgba(255,255,255,.99)',
      tagBd: dark ? 'rgba(120,150,200,.4)' : 'rgba(80,110,170,.25)',
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
    const mag = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-9))));
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
    const pad = { t: 24, r: 12, b: 32, l: compactMode ? 44 : 58 };
    const plotW = Math.max(10, w - pad.l - pad.r);
    const plotH = Math.max(10, h - pad.t - pad.b);

    let lo = 0, hi = 0;
    for (const d of data) { if (d.value < lo) lo = d.value; if (d.value > hi) hi = d.value; }
    if (hi - lo < 1) { hi += 10; lo -= 10; }
    const scale = niceScale(lo, hi, 5);
    const yOf = v => pad.t + (scale.max - v) / (scale.max - scale.min) * plotH;
    const n = data.length;
    const xOf = i => n === 1 ? pad.l + plotW / 2 : pad.l + (i / (n - 1)) * plotW;

    ctx.font = (compactMode ? '10px ' : '10.5px ') + FONT;
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
    lineGrad.addColorStop(0, COL.line);
    lineGrad.addColorStop(0.5, COL.line2);
    lineGrad.addColorStop(1, '#c78aff');
    ctx.save();
    ctx.shadowColor = COL.line;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = lineGrad; ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();

    if (n <= (compactMode ? 25 : 45)) {
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = COL.line; ctx.fill();
        ctx.strokeStyle = COL.tagBg; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }

    const maxLabels = Math.max(2, Math.floor(plotW / (compactMode ? 60 : 88)));
    const stepI = Math.max(1, Math.ceil(n / maxLabels));
    ctx.fillStyle = COL.axis;
    ctx.font = (compactMode ? '10px ' : '10.5px ') + FONT;
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
    const pad = { t: 24, r: 12, b: 32, l: compactMode ? 44 : 58 };
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
    const barW = Math.max(3, Math.min(slot * 0.62, compactMode ? 22 : 38));
    const xOf = i => pad.l + slot * i + slot / 2;

    ctx.font = (compactMode ? '10px ' : '10.5px ') + FONT;
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
      const bh = Math.max(Math.abs(y - yZero), v === 0 ? 2 : 3);
      const positive = v >= 0;
      bars.push({ x: xOf(i), y: y, top: top, h: bh, value: v, label: data[i].label });

      const bg = ctx.createLinearGradient(0, top, 0, top + bh);
      if (positive) { bg.addColorStop(0, COL.posTop); bg.addColorStop(1, COL.pos); }
      else { bg.addColorStop(0, COL.negTop); bg.addColorStop(1, COL.neg); }

      ctx.save();
      ctx.shadowColor = positive ? COL.pos : COL.neg;
      ctx.shadowBlur = 6;
      roundRect(ctx, x, top, barW, bh, Math.min(5, barW / 2));
      ctx.fillStyle = bg; ctx.fill();
      ctx.restore();
    }

    ctx.strokeStyle = COL.gridZero; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, Math.round(yZero) + 0.5);
    ctx.lineTo(pad.l + plotW, Math.round(yZero) + 0.5);
    ctx.stroke();

    const maxLabels = Math.max(2, Math.floor(plotW / (compactMode ? 60 : 88)));
    const stepI = Math.max(1, Math.ceil(n / maxLabels));
    ctx.fillStyle = COL.axis;
    ctx.font = (compactMode ? '10px ' : '10.5px ') + FONT;
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

  function renderAreaChart(canvas, st) {
    // Similar to line but with stronger area fill (for drawdown)
    renderLine(canvas, st);
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
    fEntry: $('#f-entry'), fExit: $('#f-exit'), fSL: $('#f-sl'), fTP: $('#f-tp'),
    fLot: $('#f-lot'), fRR: $('#f-rr'), fHour: $('#f-hour'), fDuration: $('#f-duration'),
    sideSeg: $('#f-side'), resultSeg: $('#f-result'),
    emotionWrap: $('#f-emotion'), checklistWrap: $('#f-checklist'),
    tagsPreview: $('#tags-preview'),
    uploadZone: $('#upload-zone'), uploadInner: $('#upload-inner'),
    uploadPreview: $('#upload-preview'), uploadImg: $('#upload-img'),
    uploadRemove: $('#upload-remove'), fScreenshot: $('#f-screenshot'),
    submitBtn: $('#submit-btn'), cancelEdit: $('#cancel-edit'), formMsg: $('#form-msg'),
    recentList: $('#recent-list'), recentCount: $('#recent-count'),
    rulesBanner: $('#rules-banner'),
    rangeFilter: $('#range-filter'), kpis: $('#kpis'), advKpis: $('#adv-kpis'),
    equityChart: $('#equity-chart'), dailyChart: $('#daily-chart'),
    drawdownChart: $('#drawdown-chart'), rollingWrChart: $('#rolling-wr-chart'),
    cumRChart: $('#cum-r-chart'), expectancyChart: $('#expectancy-chart'),
    weekChart: $('#week-chart'), monthChart: $('#month-chart'),
    emotionsStats: $('#emotions-stats'),
    strategyTable: $('#strategy-table'), dailyTable: $('#daily-table'),
    symbolTable: $('#symbol-table'), sideTable: $('#side-table'),
    weekdayTable: $('#weekday-table'), hourTable: $('#hour-table'),
    rDistribution: $('#r-distribution'),
    goalsMiniCard: $('#goals-mini-card'), goalsMini: $('#goals-mini'), goalsMiniPeriod: $('#goals-mini-period'),
    calTitle: $('#cal-title'), calGrid: $('#cal-grid'),
    calPrev: $('#cal-prev'), calNext: $('#cal-next'),
    calDetailCard: $('#cal-detail-card'), calDetailTitle: $('#cal-detail-title'),
    calDetailList: $('#cal-detail-list'), calDetailClose: $('#cal-detail-close'),
    calWeekStats: $('#cal-week-stats'), calMonthStats: $('#cal-month-stats'),
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
    checklistManager: $('#checklist-manager'),
    newChecklistInput: $('#new-checklist-input'),
    addChecklistBtn: $('#add-checklist-btn'),
    saveChecklistBtn: $('#save-checklist-btn'),
    resetChecklistBtn: $('#reset-checklist-btn'),
    checklistMsg: $('#checklist-msg'),
    symbolsList: $('#symbols-list'),
    strategiesList: $('#strategies-list'),
    tagsList: $('#tags-list'),
    // NEW v8
    advancedToggle: $('#advanced-toggle'),
    advancedFields: $('#advanced-fields'),
    templateSelect: $('#template-select'),
    saveTemplateBtn: $('#save-template-btn'),
    applyTemplateBtn: $('#apply-template-btn'),
    deleteTemplateBtn: $('#delete-template-btn'),
    templateMsg: $('#template-msg'),
    // Risk Calculator
    riskBalance: $('#risk-balance'),
    riskPercent: $('#risk-percent'),
    riskPips: $('#risk-pips'),
    riskPipValue: $('#risk-pip-value'),
    calcRiskBtn: $('#calc-risk-btn'),
    riskResult: $('#risk-result'),
    // Notifications
    notifEnabled: $('#notif-enabled'),
    notifDaily: $('#notif-daily'),
    notifGoal: $('#notif-goal'),
    notifRules: $('#notif-rules'),
    notifWin: $('#notif-win'),
    bigWinThr: $('#big-win-thr'),
    bigLossThr: $('#big-loss-thr'),
    saveNotifBtn: $('#save-notif-btn'),
    notifMsg: $('#notif-msg'),
    // Comparison
    comparisonTable: $('#comparison-table'),
    // Multi-goals
    multiGoalsList: $('#multi-goals-list'),
    addGoalBtn: $('#add-goal-btn'),
    multiGoalMsg: $('#multi-goal-msg')
  };

  /* ============================ TOAST ============================ */
  const msgTimers = new WeakMap();
  function toast(target, text, isError) {
    if (!target) return;
    target.textContent = text;
    target.classList.toggle('err', !!isError);
    target.classList.add('show');
    clearTimeout(msgTimers.get(target));
    msgTimers.set(target, setTimeout(() => target.classList.remove('show'), 2800));
  }

  /* ============================ CONFIRM MODAL ============================ */
  function confirmDialog(opts) {
    return new Promise(resolve => {
      const cfg = opts || {};
      const variant = cfg.variant || 'info';
      const icon = cfg.icon || '❓';
      const title = cfg.title || 'Confirm';
      const message = cfg.message || '';
      const okText = cfg.okText || 'OK';
      const cancelText = cfg.cancelText || 'Cancel';

      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML =
        '<div class="confirm-card ' + variant + '" role="dialog" aria-modal="true">' +
          '<div class="confirm-deco"><span></span><span></span></div>' +
          '<div class="confirm-icon">' + icon + '</div>' +
          '<div class="confirm-title">' + esc(title) + '</div>' +
          '<div class="confirm-msg">' + esc(message) + '</div>' +
          '<div class="confirm-actions">' +
            '<button type="button" class="cf-cancel">' + esc(cancelText) + '</button>' +
            '<button type="button" class="cf-ok">' + esc(okText) + '</button>' +
          '</div>' +
          '<div class="confirm-hint"><kbd>Enter</kbd> ✓ &nbsp; <kbd>Esc</kbd> ✕</div>' +
        '</div>';

      document.body.appendChild(overlay);

      const okBtn = overlay.querySelector('.cf-ok');
      const cancelBtn = overlay.querySelector('.cf-cancel');
      setTimeout(() => okBtn.focus(), 60);

      let settled = false;
      function close(result) {
        if (settled) return;
        settled = true;
        overlay.classList.add('closing');
        document.removeEventListener('keydown', onKey);
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 200);
      }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(false); }
        else if (e.key === 'Enter') { e.preventDefault(); close(true); }
      }

      okBtn.addEventListener('click', () => close(true));
      cancelBtn.addEventListener('click', () => close(false));
      overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
      document.addEventListener('keydown', onKey);
    });
  }

  /* ============================ THEME ============================ */
  function applyTheme(th) {
    theme = th;
    el.html.dataset.theme = th;
    if (el.themeBtn) {
      const icon = el.themeBtn.querySelector('.theme-icon');
      if (icon) icon.textContent = th === 'light' ? '☀️' : '🌙';
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = th === 'light' ? '#eef2f9' : '#03040a';
    saveJSON(KEYS.theme, th);
    if (el.pageAnalysis && el.pageAnalysis.classList.contains('active')) {
      renderCharts(); renderDeepAnalytics();
    }
  }
  function toggleTheme() { applyTheme(theme === 'dark' ? 'light' : 'dark'); }

  /* ============================ I18N APPLY ============================ */
  function applyLang(l) {
    lang = l;
    localStorage.setItem('po.lang', l);
    const dir = l === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', l);
    document.documentElement.setAttribute('dir', dir);
    if (el.langLabel) el.langLabel.textContent = l === 'fa' ? 'EN' : 'FA';
    document.title = t('title');

    $$('[data-i18n]').forEach(node => {
      const k = node.getAttribute('data-i18n');
      const v = t(k);
      if (v) node.textContent = v;
    });
    $$('[data-i18n-ph]').forEach(node => {
      const k = node.getAttribute('data-i18n-ph');
      const v = t(k);
      if (v) node.setAttribute('placeholder', v);
    });
    renderChecklistForm(getChecklistValues());
    renderChecklistManager();
    renderAll();
  }

  /* ============================ AUTOCOMPLETE ============================ */
  function updateAutocomplete() {
    const symbolSet = new Set(FOREX_PAIRS.concat(CRYPTO_SYMBOLS));
    const stratSet = new Set(PRESET_STRATEGIES);
    const tagSet = new Set();

    for (const tr of trades) {
      if (tr.symbol) symbolSet.add(String(tr.symbol).toUpperCase());
      if (tr.strategy) stratSet.add(tr.strategy);
      for (const g of (tr.tags || [])) if (g) tagSet.add(g);
    }

    const symArr = Array.from(symbolSet).sort();
    const strArr = Array.from(stratSet).sort();
    const tagArr = Array.from(tagSet).sort();

    if (el.symbolsList) {
      el.symbolsList.innerHTML = symArr.map(s => '<option value="' + esc(s) + '"></option>').join('');
    }
    if (el.strategiesList) {
      el.strategiesList.innerHTML = strArr.map(s => '<option value="' + esc(s) + '"></option>').join('');
    }
    if (el.tagsList) {
      el.tagsList.innerHTML = tagArr.map(s => '<option value="' + esc(s) + '"></option>').join('');
    }
  }

  /* ============================ CHECKLIST MANAGER ============================ */
  function renderChecklistManager() {
    if (!el.checklistManager) return;
    if (!checklistItems.length) {
      el.checklistManager.innerHTML = '<div class="cm-empty">' + t('checklist_empty') + '</div>';
      return;
    }
    el.checklistManager.innerHTML = checklistItems.map((item, i) =>
      '<div class="cm-item" data-id="' + esc(item.id) + '">' +
        '<input type="text" class="cm-input" value="' + esc(ruleText(item)) + '" maxlength="80" ' +
               'data-idx="' + i + '" placeholder="' + esc(t('checklist_new_ph')) + '" />' +
        '<button type="button" class="cm-del" data-del="' + esc(item.id) + '" title="Delete">✕</button>' +
      '</div>'
    ).join('');
  }

  function commitChecklistFromInputs() {
    if (!el.checklistManager) return;
    const inputs = $$('.cm-input', el.checklistManager);
    inputs.forEach(inp => {
      const idx = Number(inp.dataset.idx);
      const item = checklistItems[idx];
      if (!item) return;
      const v = inp.value.trim();
      if (!v) return;
      item.text_fa = v;
      item.text_en = v;
    });
  }

  async function removeChecklistItem(id) {
    const ok = await confirmDialog({
      variant: 'danger',
      icon: '🗑️',
      title: t('checklist_del_title'),
      message: t('checklist_del_msg'),
      okText: t('checklist_del_ok'),
      cancelText: t('md_cancel')
    });
    if (!ok) return;
    checklistItems = checklistItems.filter(x => x.id !== id);
    saveChecklist();
    renderChecklistManager();
    renderChecklistForm({});
    renderKPIs();
    renderSettingsPage();
    toast(el.checklistMsg, t('checklist_deleted'));
  }

  function addChecklistItem() {
    const inp = el.newChecklistInput;
    if (!inp) return;
    const v = inp.value.trim();
    if (!v) { toast(el.checklistMsg, t('checklist_need_item'), true); inp.focus(); return; }
    const id = 'c_' + uid();
    checklistItems.push({ id, text_fa: v, text_en: v });
    inp.value = '';
    saveChecklist();
    renderChecklistManager();
    renderChecklistForm({});
    renderKPIs();
    renderSettingsPage();
    toast(el.checklistMsg, t('checklist_added'));
    inp.focus();
  }

  function saveChecklistAll() {
    commitChecklistFromInputs();
    saveChecklist();
    renderChecklistManager();
    renderChecklistForm({});
    renderKPIs();
    toast(el.checklistMsg, t('checklist_saved'));
  }

  async function resetChecklistAll() {
    const ok = await confirmDialog({
      variant: 'warning',
      icon: '↺',
      title: t('reset_checklist'),
      message: t('checklist_del_msg'),
      okText: t('md_goal_ok'),
      cancelText: t('md_cancel')
    });
    if (!ok) return;
    checklistItems = DEFAULT_CHECKLIST.map(x => ({
      id: x.id, text_fa: x.text_fa, text_en: x.text_en
    }));
    saveChecklist();
    renderChecklistManager();
    renderChecklistForm({});
    renderKPIs();
    toast(el.checklistMsg, t('checklist_reset'));
  }

  /* ============================ CLOUD CHECKLIST SYNC ============================ */
  const CHECKLIST_CLOUD_ID = '__checklist_v1__';
  let checklistCloudReady = false;
  let checklistPushTimer = null;
  let lastPushedItemsJson = '';

  function getSbClient() { return window.__PT_SB || null; }
  async function getCurrentUid() {
    const sb = getSbClient();
    if (!sb) return null;
    try {
      const s = await sb.auth.getSession();
      return (s && s.data && s.data.session && s.data.session.user && s.data.session.user.id) || null;
    } catch (e) { return null; }
  }
  async function loadChecklistFromCloud() {
    const sb = getSbClient();
    if (!sb) return null;
    try {
      const uid = await getCurrentUid();
      if (!uid) return null;
      const res = await sb.from('trades')
        .select('data')
        .eq('user_id', uid)
        .eq('trade_id', CHECKLIST_CLOUD_ID)
        .limit(1);
      if (res.error) return null;
      const row = res.data && res.data[0];
      if (row && row.data && Array.isArray(row.data.items)) {
        return { items: row.data.items, updatedAt: Number(row.data.updatedAt) || 0 };
      }
      return null;
    } catch (e) { return null; }
  }
  async function pushChecklistToCloud(items) {
    const sb = getSbClient();
    if (!sb) return false;
    try {
      const uid = await getCurrentUid();
      if (!uid) return false;
      const itemsJson = JSON.stringify(items);
      if (itemsJson === lastPushedItemsJson) return true;
      await sb.from('trades')
        .delete()
        .eq('user_id', uid)
        .eq('trade_id', CHECKLIST_CLOUD_ID);
      const res = await sb.from('trades').insert({
        user_id: uid,
        trade_id: CHECKLIST_CLOUD_ID,
        data: { _type: 'checklist', items: items, updatedAt: Date.now() }
      });
      if (res.error) return false;
      lastPushedItemsJson = itemsJson;
      return true;
    } catch (e) { return false; }
  }
  function autoPushChecklist() {
    if (!checklistCloudReady) return;
    clearTimeout(checklistPushTimer);
    checklistPushTimer = setTimeout(async () => {
      const ok = await pushChecklistToCloud(checklistItems);
      if (ok) {
        try { localStorage.setItem(KEYS.checklistUpdatedAt, String(Date.now())); } catch (e) {}
        if (el.checklistMsg) toast(el.checklistMsg, t('checklist_cloud_ok'));
      }
    }, 700);
  }
  function saveChecklist() {
    saveJSON(KEYS.checklist, checklistItems);
    try { localStorage.setItem(KEYS.checklistUpdatedAt, String(Date.now())); } catch (e) {}
    if (checklistCloudReady) autoPushChecklist();
  }
  async function syncChecklistOnBoot() {
    for (let i = 0; i < 30; i++) {
      const uid = await getCurrentUid();
      if (uid) break;
      await new Promise(r => setTimeout(r, 150));
    }
    const cloud = await loadChecklistFromCloud();
    const localUpdated = Number(localStorage.getItem(KEYS.checklistUpdatedAt) || 0);
    if (cloud && cloud.items && cloud.items.length) {
      if (cloud.updatedAt >= localUpdated) {
        checklistItems = cloud.items;
        saveJSON(KEYS.checklist, checklistItems);
        try { localStorage.setItem(KEYS.checklistUpdatedAt, String(cloud.updatedAt)); } catch (e) {}
        lastPushedItemsJson = JSON.stringify(checklistItems);
        renderChecklistForm({});
        renderChecklistManager();
        renderKPIs();
      } else {
        await pushChecklistToCloud(checklistItems);
        try { localStorage.setItem(KEYS.checklistUpdatedAt, String(Date.now())); } catch (e) {}
      }
    } else if (checklistItems && checklistItems.length) {
      await pushChecklistToCloud(checklistItems);
      try { localStorage.setItem(KEYS.checklistUpdatedAt, String(Date.now())); } catch (e) {}
    }
    checklistCloudReady = true;
  }

  /* ============================ FORM HELPERS ============================ */
  function renderChecklistForm(checked) {
    checked = checked || {};
    if (!checklistItems.length) {
      el.checklistWrap.innerHTML = '<div class="empty" style="padding:10px;font-size:12px">' + t('checklist_empty') + '</div>';
      return;
    }
    el.checklistWrap.innerHTML = checklistItems.map(r =>
      '<label>' +
        '<input type="checkbox" data-rule="' + esc(r.id) + '" ' + (checked[r.id] ? 'checked' : '') + ' />' +
        '<span class="box">✓</span>' +
        '<span>' + esc(ruleText(r)) + '</span>' +
      '</label>'
    ).join('');
  }
  function getChecklistValues() {
    const out = {};
    $$('input[data-rule]', el.checklistWrap).forEach(inp => {
      out[inp.dataset.rule] = inp.checked;
    });
    return out;
  }
  function parseTags(str) {
    return String(str || '').split(/[,،]/).map(s => s.trim()).filter(Boolean).slice(0, 8);
  }
  function renderTagsPreview() {
    if (!el.fTags) return;
    const tags = parseTags(el.fTags.value);
    if (!tags.length) { el.tagsPreview.innerHTML = ''; return; }
    el.tagsPreview.innerHTML = tags.map(x => '<span class="tag">' + esc(x) + '</span>').join('');
  }
  function initEmotions() {
    el.emotionWrap.addEventListener('click', e => {
      const btn = e.target.closest('button[data-e]');
      if (!btn) return;
      $$('button', el.emotionWrap).forEach(b => b.classList.toggle('active', b === btn));
      selectedEmotion = btn.dataset.e;
    });
  }
  function initSeg(seg, def) {
    if (!seg) return;
    seg.dataset.value = def;
    seg.addEventListener('click', e => {
      const btn = e.target.closest('button[data-v]');
      if (!btn) return;
      $$('button[data-v]', seg).forEach(b => b.classList.toggle('active', b === btn));
      seg.dataset.value = btn.dataset.v;
    });
  }
  function setSeg(seg, val) {
    if (!seg) return;
    $$('button[data-v]', seg).forEach(b => b.classList.toggle('active', b.dataset.v === val));
    seg.dataset.value = val;
  }
  function setEmotion(val) {
    selectedEmotion = val;
    $$('button', el.emotionWrap).forEach(b => b.classList.toggle('active', b.dataset.e === val));
  }

  /* ============================ AUTO R:R CALCULATION ============================ */
  function calcAutoRR() {
    if (!el.fEntry || !el.fExit || !el.fSL) return;
    const entry = parseFloat(el.fEntry.value);
    const exit = parseFloat(el.fExit.value);
    const sl = parseFloat(el.fSL.value);
    if (isNaN(entry) || isNaN(sl)) {
      if (el.fRR) el.fRR.value = '';
      return;
    }
    const risk = Math.abs(entry - sl);
    const reward = !isNaN(exit) ? Math.abs(exit - entry) : 0;
    if (risk > 0) {
      const rr = (reward / risk).toFixed(2);
      if (el.fRR) el.fRR.value = rr + ' : 1';
    } else {
      if (el.fRR) el.fRR.value = '';
    }
  }

  /* ============================ SCREENSHOT UI ============================ */
  function setScreenshot(base64) {
    currentScreenshot = base64 || null;
    if (currentScreenshot) {
      el.uploadImg.src = currentScreenshot;
      el.uploadInner.hidden = true;
      el.uploadPreview.hidden = false;
    } else {
      el.uploadImg.src = '';
      el.uploadInner.hidden = false;
      el.uploadPreview.hidden = true;
      if (el.fScreenshot) el.fScreenshot.value = '';
    }
  }
  function initScreenshot() {
    el.uploadZone.addEventListener('click', e => {
      if (e.target === el.uploadRemove || e.target.closest('.upload-remove')) return;
      if (currentScreenshot && e.target.closest('.upload-preview')) {
        openLightbox(currentScreenshot); return;
      }
      el.fScreenshot.click();
    });
    el.fScreenshot.addEventListener('change', async e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const b64 = await compressImage(file);
        setScreenshot(b64);
      } catch (err) {
        console.warn('Image error:', err);
        toast(el.formMsg, t('err_image'), true);
      }
    });
    el.uploadRemove.addEventListener('click', e => {
      e.stopPropagation(); setScreenshot(null);
    });
  }
  function openLightbox(src) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lightbox-close">✕</button><img alt="" />';
    lb.querySelector('img').src = src;
    lb.addEventListener('click', e => {
      if (e.target === lb || e.target.classList.contains('lightbox-close')) lb.remove();
    });
    document.body.appendChild(lb);
  }

  /* ============================ NAVIGATION ============================ */
  function switchView(name) {
    $$('.tab', el.tabs).forEach(tb => tb.classList.toggle('active', tb.dataset.view === name));
    el.pageAdd.classList.toggle('active', name === 'add');
    el.pageAnalysis.classList.toggle('active', name === 'analysis');
    el.pageCalendar.classList.toggle('active', name === 'calendar');
    el.pageTrades.classList.toggle('active', name === 'trades');
    el.pageSettings.classList.toggle('active', name === 'settings');
    if (name === 'analysis') requestAnimationFrame(() => { renderCharts(); renderDeepAnalytics(); });
    if (name === 'calendar') renderCalendar();
    if (name === 'trades') renderAllTrades();
    if (name === 'settings') renderSettingsPage();
  }

  /* ============================ TEMPLATES ============================ */
  function renderTemplates() {
    if (!el.templateSelect) return;
    if (!templates.length) {
      el.templateSelect.innerHTML = '<option value="">' + t('no_templates') + '</option>';
      return;
    }
    el.templateSelect.innerHTML = '<option value="">— ' + t('templates') + ' —</option>' +
      templates.map(tp => '<option value="' + esc(tp.id) + '">' + esc(tp.name) + '</option>').join('');
  }

  function saveCurrentAsTemplate() {
    const name = prompt(t('template_name'), t('template_name_ph'));
    if (!name || !name.trim()) return;
    const symbol = el.fSymbol.value.trim();
    const strategy = el.fStrategy.value.trim();
    const amount = parseFloat(el.fAmount.value) || 0;
    const risk = parseFloat(el.fRisk.value) || null;
    const tags = parseTags(el.fTags.value);
    const note = el.fNote.value.trim();
    const side = el.sideSeg.dataset.value;
    const emotion = selectedEmotion;
    const checklist = getChecklistValues();
    const tp = {
      id: uid(),
      name: name.trim(),
      symbol, strategy, amount, risk, tags, note, side, emotion, checklist,
      createdAt: Date.now()
    };
    templates.push(tp);
    saveJSON(KEYS.templates, templates);
    renderTemplates();
    toast(el.templateMsg, t('template_saved'));
  }

  function applyTemplate() {
    const id = el.templateSelect.value;
    if (!id) return;
    const tp = templates.find(x => x.id === id);
    if (!tp) return;
    if (tp.symbol) el.fSymbol.value = tp.symbol;
    if (tp.strategy) el.fStrategy.value = tp.strategy;
    if (tp.amount) el.fAmount.value = tp.amount;
    if (tp.risk) el.fRisk.value = tp.risk;
    if (tp.tags) el.fTags.value = tp.tags.join(', ');
    if (tp.note) el.fNote.value = tp.note;
    if (tp.side) setSeg(el.sideSeg, tp.side);
    if (tp.emotion) setEmotion(tp.emotion);
    if (tp.checklist) renderChecklistForm(tp.checklist);
    renderTagsPreview();
    toast(el.templateMsg, t('template_applied'));
  }

  async function deleteTemplate() {
    const id = el.templateSelect.value;
    if (!id) return;
    const ok = await confirmDialog({
      variant: 'danger',
      icon: '🗑️',
      title: t('delete_template'),
      message: t('template_name') + '?',
      okText: t('md_goal_ok'),
      cancelText: t('md_cancel')
    });
    if (!ok) return;
    templates = templates.filter(x => x.id !== id);
    saveJSON(KEYS.templates, templates);
    renderTemplates();
    toast(el.templateMsg, t('template_deleted'));
  }

  /* ============================ FORM SUBMIT ============================ */
  function resetForm() {
    editingId = null;
    el.form.reset();
    el.fDate.value = todayISO();
    el.submitBtn.textContent = t('submit_trade');
    el.cancelEdit.hidden = true;
    setSeg(el.sideSeg, 'buy');
    setSeg(el.resultSeg, 'win');
    setEmotion('calm');
    renderChecklistForm({});
    renderTagsPreview();
    setScreenshot(null);
    if (el.fRR) el.fRR.value = '';
  }
  function startEdit(id) {
    const tr = trades.find(x => x.id === id);
    if (!tr) return;
    editingId = id;
    el.fDate.value = tr.date;
    el.fSymbol.value = tr.symbol;
    el.fStrategy.value = tr.strategy;
    el.fAmount.value = tr.amount;
    el.fRisk.value = tr.risk || '';
    el.fTags.value = (tr.tags || []).join(', ');
    el.fNote.value = tr.note || '';
    if (el.fEntry) el.fEntry.value = tr.entry || '';
    if (el.fExit)  el.fExit.value  = tr.exit || '';
    if (el.fSL)    el.fSL.value    = tr.sl || '';
    if (el.fTP)    el.fTP.value    = tr.tp || '';
    if (el.fLot)   el.fLot.value   = tr.lot || '';
    if (el.fRR)    el.fRR.value    = tr.rr || '';
    if (el.fHour)  el.fHour.value  = tr.hour != null ? tr.hour : '';
    if (el.fDuration) el.fDuration.value = tr.duration || '';
    setSeg(el.sideSeg, tr.side);
    setSeg(el.resultSeg, tr.result);
    setEmotion(tr.emotion || 'calm');
    renderChecklistForm(tr.checklist || {});
    renderTagsPreview();
    setScreenshot(tr.screenshot || null);
    el.submitBtn.textContent = '💾 ' + t('ok_saved').replace('✅ ', '');
    el.cancelEdit.hidden = false;
    switchView('add');
    el.fSymbol.focus();
  }
  function onSubmit(e) {
    e.preventDefault();
    const date = el.fDate.value || todayISO();
    const symbol = el.fSymbol.value.trim();
    const strategy = el.fStrategy.value.trim();
    const amountRaw = el.fAmount.value;
    const amount = Math.abs(parseFloat(amountRaw));
    const riskRaw = el.fRisk.value;
    const risk = riskRaw ? Math.abs(parseFloat(riskRaw)) : null;

    if (!symbol)   { toast(el.formMsg, t('err_symbol'), true);   el.fSymbol.focus();   return; }
    if (!strategy) { toast(el.formMsg, t('err_strategy'), true); el.fStrategy.focus(); return; }
    if (!amountRaw || isNaN(amount)) { toast(el.formMsg, t('err_amount'), true); el.fAmount.focus(); return; }

    const trade = {
      id: editingId || uid(),
      date, symbol, strategy,
      side: el.sideSeg.dataset.value,
      result: el.resultSeg.dataset.value,
      amount,
      risk: (risk && !isNaN(risk)) ? risk : null,
      tags: parseTags(el.fTags.value),
      emotion: selectedEmotion,
      checklist: getChecklistValues(),
      screenshot: currentScreenshot || null,
      note: el.fNote.value.trim(),
      entry: el.fEntry ? parseFloat(el.fEntry.value) || null : null,
      exit:  el.fExit  ? parseFloat(el.fExit.value)  || null : null,
      sl:    el.fSL    ? parseFloat(el.fSL.value)    || null : null,
      tp:    el.fTP    ? parseFloat(el.fTP.value)    || null : null,
      lot:   el.fLot   ? parseFloat(el.fLot.value)   || null : null,
      rr:    el.fRR    ? el.fRR.value : null,
      hour:  el.fHour  ? (el.fHour.value !== '' ? Number(el.fHour.value) : null) : null,
      duration: el.fDuration ? parseFloat(el.fDuration.value) || null : null,
      createdAt: Date.now()
    };

    if (editingId) {
      const i = trades.findIndex(x => x.id === editingId);
      if (i > -1) {
        trade.createdAt = trades[i].createdAt || Date.now();
        trades[i] = trade;
      } else trades.push(trade);
      toast(el.formMsg, t('ok_saved'));
    } else {
      trades.push(trade);
      toast(el.formMsg, t('ok_added'));
    }
    try { saveTrades(); }
    catch (err) { toast(el.formMsg, t('err_storage'), true); return; }

    // Notification check
    if (notifications.enabled && notifications.win) {
      const p = pnl(trade);
      if (p >= notifications.bigWin) {
        if (Notification.permission === 'granted') {
          new Notification('🎉 ' + t('big_win_threshold'), { body: money(p) });
        }
      } else if (p <= -notifications.bigLoss) {
        if (Notification.permission === 'granted') {
          new Notification('💀 ' + t('big_loss_threshold'), { body: money(p) });
        }
      }
    }

    resetForm();
    updateAutocomplete();
    renderAll();
  }

  /* ============================ RENDER: TRADE ITEM ============================ */
  function renderTradeItem(tr, showActions) {
    if (showActions === undefined) showActions = true;
    const p = pnl(tr);
    const cls = tr.result === 'win' ? 'win' : tr.result === 'loss' ? 'loss' : 'be';
    const amt = tr.result === 'be' ? t('be_label') : money(p);
    const emo = EMOTIONS[tr.emotion] || EMOTIONS.calm;
    const rm = rMultiple(tr);
    const rmTxt = rm != null ? ((rm > 0 ? '+' : '') + rm + 'R') : '';
    const SIDE = { buy: t('buy'), sell: t('sell') };
    const tags = (tr.tags || []).slice(0, 4);
    const thumb = tr.screenshot
      ? '<div class="ti-thumb" data-thumb="' + esc(tr.id) + '"><img src="' + tr.screenshot + '" alt="" loading="lazy" /></div>'
      : '';
    const rrTxt = tr.rr ? '<span>⚖️ ' + esc(tr.rr) + '</span>' : '';
    const hourTxt = (tr.hour != null) ? '<span>⏰ ' + String(tr.hour).padStart(2,'0') + ':00</span>' : '';

    return '' +
      '<div class="trade-item ' + (tr.side === 'sell' ? 'sell' : '') + '" data-id="' + esc(tr.id) + '">' +
        thumb +
        '<div class="ti-main">' +
          '<span class="ti-symbol">' +
            '<span class="dot ' + (tr.side === 'sell' ? 'sell' : '') + '"></span>' +
            esc(tr.symbol) +
          '</span>' +
          '<span class="ti-meta">' +
            '<span class="emo" title="' + esc(emoLabel(tr.emotion)) + '">' + emo.ico + '</span>' +
            '<span>🎯 ' + esc(tr.strategy) + '</span>' +
            '<span>' + SIDE[tr.side] + ' · ' + fullDate(tr.date) + '</span>' +
            (rmTxt ? '<span>' + rmTxt + '</span>' : '') +
            rrTxt + hourTxt +
          '</span>' +
          (tags.length ? '<div class="ti-tags">' + tags.map(g => '<span class="tag">' + esc(g) + '</span>').join('') + '</div>' : '') +
        '</div>' +
        '<div class="ti-right">' +
          '<span class="pill ' + cls + '">' + amt + '</span>' +
          (showActions
            ? '<div class="ti-actions">' +
                '<button data-act="edit" type="button" title="Edit">✏️</button>' +
                '<button data-act="del" type="button" title="Delete">🗑️</button>' +
              '</div>'
            : '') +
        '</div>' +
      '</div>';
  }

  /* ============================ RENDER: RECENT ============================ */
  function renderRecent() {
    const sorted = trades.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    el.recentCount.textContent = sorted.length ? sorted.length + ' ' + t('trades_word') : '';
    const list = sorted.slice(0, 12);
    if (!list.length) {
      el.recentList.innerHTML = '<div class="empty">' + t('no_trades') + '</div>';
      return;
    }
    el.recentList.innerHTML = list.map(tr => renderTradeItem(tr)).join('');
  }

  /* ============================ RENDER: KPI ============================ */
  function renderKPIs() {
    const filtered = inRange(trades, range);
    const s = computeStats(filtered);
    const days = byDay(filtered);
    let bestDay = null, worstDay = null;
    for (const d of days) {
      if (!bestDay || d.net > bestDay.net) bestDay = d;
      if (!worstDay || d.net < worstDay.net) worstDay = d;
    }
    let dcSum = 0, dcCount = 0;
    for (const tr of filtered) {
      const dc = disciplineScore(tr, checklistItems);
      if (dc != null) { dcSum += dc; dcCount++; }
    }
    const avgDiscipline = dcCount ? Math.round(dcSum / dcCount) : 0;
    const cards = [
      { ico: '💎', l: t('kpi_net'),      v: money(s.net),            c: s.net > 0 ? 'pos' : s.net < 0 ? 'neg' : '' },
      { ico: '🎯', l: t('kpi_winrate'),  v: pct(s.winRate),          c: s.winRate >= 50 ? 'pos' : 'neg' },
      { ico: '📊', l: t('kpi_total'),    v: num(s.total),            c: '' },
      { ico: '⚖️', l: t('kpi_pf'),       v: isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : '∞', c: s.profitFactor >= 1 ? 'pos' : 'neg' },
      { ico: '📐', l: t('kpi_avgr'),     v: s.rCount ? ((s.avgR > 0 ? '+' : '') + s.avgR.toFixed(2) + 'R') : '—', c: s.avgR > 0 ? 'pos' : s.avgR < 0 ? 'neg' : '' },
      { ico: '🧮', l: t('kpi_exp'),      v: money(s.expectancy),     c: s.expectancy > 0 ? 'pos' : 'neg' },
      { ico: '✅', l: t('kpi_disc'),     v: dcCount ? pct(avgDiscipline) : '—', c: avgDiscipline >= 75 ? 'pos' : avgDiscipline >= 50 ? '' : 'neg' },
      { ico: '📈', l: t('kpi_gp'),       v: money(s.grossProfit, false), c: 'pos' },
      { ico: '📉', l: t('kpi_gl'),       v: money(-s.grossLoss),     c: 'neg' },
      { ico: '🟢', l: t('kpi_aw'),       v: money(s.avgWin, false),  c: 'pos' },
      { ico: '🔴', l: t('kpi_al'),       v: money(-s.avgLoss),       c: 'neg' },
      { ico: '⚠️', l: t('kpi_mdd'),      v: money(-s.maxDrawdown),   c: 'neg' },
      { ico: '🏆', l: t('kpi_bd'),       v: bestDay ? money(bestDay.net) : '—',  c: 'pos' },
      { ico: '💔', l: t('kpi_wd'),       v: worstDay ? money(worstDay.net) : '—', c: 'neg' }
    ];
    el.kpis.innerHTML = cards.map((c, i) =>
      '<div class="kpi ' + c.c + '" style="animation-delay:' + Math.min(i * 30, 400) + 'ms">' +
        '<span class="ico">' + c.ico + '</span>' +
        '<span class="lbl">' + esc(c.l) + '</span>' +
        '<span class="val">' + c.v + '</span>' +
      '</div>'
    ).join('');

    // Advanced KPIs
    if (el.advKpis) {
      const advCards = [
        { ico: '📊', l: t('kpi_sharpe'),    v: s.sharpe.toFixed(2),     c: s.sharpe > 1 ? 'pos' : s.sharpe < 0 ? 'neg' : '' },
        { ico: '📉', l: t('kpi_sortino'),   v: s.sortino.toFixed(2),    c: s.sortino > 1 ? 'pos' : s.sortino < 0 ? 'neg' : '' },
        { ico: '⚖️', l: t('kpi_calmar'),    v: s.calmar.toFixed(2),     c: s.calmar > 1 ? 'pos' : s.calmar < 0 ? 'neg' : '' },
        { ico: '💪', l: t('kpi_recovery'),  v: s.recovery.toFixed(2),   c: s.recovery > 1 ? 'pos' : 'neg' },
        { ico: '🔥', l: t('kpi_streak'),    v: num(s.bestWin),          c: 'pos' },
        { ico: '❄️', l: t('kpi_lstreak'),   v: num(s.bestLoss),         c: 'neg' }
      ];
      el.advKpis.innerHTML = advCards.map((c, i) =>
        '<div class="kpi adv ' + c.c + '" style="animation-delay:' + Math.min(i * 30, 400) + 'ms">' +
          '<span class="ico">' + c.ico + '</span>' +
          '<span class="lbl">' + esc(c.l) + '</span>' +
          '<span class="val">' + c.v + '</span>' +
        '</div>'
      ).join('');
    }
  }

  /* ============================ RENDER: CHARTS ============================ */
  function renderCharts() {
    const filtered = inRange(trades, range);
    const days = byDay(filtered);
    chartLine(el.equityChart, days.map(d => ({ label: d.date, value: d.cum })));
    chartBars(el.dailyChart,  days.map(d => ({ label: d.date, value: d.net })));
  }

  /* ============================ RENDER: DEEP ANALYTICS ============================ */
  function renderDeepAnalytics() {
    const filtered = inRange(trades, range);
    const days = byDay(filtered);

    // Drawdown chart
    if (el.drawdownChart) {
      let peak = 0, equity = 0;
      const ddData = days.map(d => {
        equity = d.cum;
        if (equity > peak) peak = equity;
        return { label: d.date, value: -(peak - equity) };
      });
      chartLine(el.drawdownChart, ddData);
    }

    // Rolling win rate (last 10 trades)
    if (el.rollingWrChart) {
      const sorted = sortAsc(filtered);
      const windowSize = 10;
      const data = [];
      for (let i = windowSize - 1; i < sorted.length; i++) {
        const slice = sorted.slice(i - windowSize + 1, i + 1);
        let wins = 0, closed = 0;
        for (const tr of slice) {
          if (tr.result === 'win') { wins++; closed++; }
          else if (tr.result === 'loss') closed++;
        }
        const wr = closed ? (wins / closed) * 100 : 0;
        data.push({ label: sorted[i].date, value: r2(wr) });
      }
      chartLine(el.rollingWrChart, data);
    }

    // Cumulative R
    if (el.cumRChart) {
      let cumR = 0;
      const data = [];
      for (const tr of sortAsc(filtered)) {
        const rm = rMultiple(tr);
        if (rm == null) continue;
        cumR += rm;
        data.push({ label: tr.date, value: r2(cumR) });
      }
      chartLine(el.cumRChart, data);
    }

    // Rolling expectancy
    if (el.expectancyChart) {
      const sorted = sortAsc(filtered);
      const windowSize = 10;
      const data = [];
      let cum = 0;
      for (let i = 0; i < sorted.length; i++) {
        cum += pnl(sorted[i]);
        if (i >= windowSize - 1) {
          const avg = cum / windowSize;
          data.push({ label: sorted[i].date, value: r2(avg) });
          cum -= pnl(sorted[i - windowSize + 1]);
        }
      }
      chartLine(el.expectancyChart, data);
    }

    // Weekly bars
    if (el.weekChart) {
      const weeks = byWeek(filtered);
      chartBars(el.weekChart, weeks.map(w => ({ label: w.weekStart, value: w.net })));
    }

    // Monthly bars
    if (el.monthChart) {
      const months = byMonth(filtered);
      chartBars(el.monthChart, months.map(m => ({ label: m.month + '-01', value: m.net })));
    }

    // R distribution table
    if (el.rDistribution) {
      const buckets = rBuckets(filtered);
      el.rDistribution.innerHTML =
        '<table><thead><tr>' +
          '<th>R</th><th>' + t('th_count') + '</th><th>' + t('th_net') + '</th>' +
        '</tr></thead><tbody>' +
        buckets.map(b => {
          if (b.count === 0) return '';
          const cls = b.net > 0 ? 'pos' : b.net < 0 ? 'neg' : 'dim';
          return '<tr>' +
            '<td>' + esc(b.label) + '</td>' +
            '<td class="num dim">' + num(b.count) + '</td>' +
            '<td class="num ' + cls + '">' + money(b.net) + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>';
    }

    // Day of week table
    if (el.weekdayTable) {
      const wds = byWeekday(filtered);
      const WD = lang === 'fa'
        ? ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه']
        : ['Sat','Sun','Mon','Tue','Wed','Thu','Fri'];
      el.weekdayTable.innerHTML =
        '<table><thead><tr>' +
          '<th>' + t('th_date') + '</th><th>' + t('th_count') + '</th>' +
          '<th>' + t('th_wr') + '</th><th>' + t('th_net') + '</th>' +
        '</tr></thead><tbody>' +
        wds.map(w => {
          const cls = w.net > 0 ? 'pos' : w.net < 0 ? 'neg' : 'dim';
          return '<tr>' +
            '<td>' + WD[w.wd] + '</td>' +
            '<td class="num dim">' + num(w.count) + '</td>' +
            '<td class="num">' + pct(w.winRate) + '</td>' +
            '<td class="num ' + cls + '">' + money(w.net) + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>';
    }

    // Hour table
    if (el.hourTable) {
      const hours = byHour(filtered);
      if (!hours.length) {
        el.hourTable.innerHTML = '<div class="empty">' + t('no_data_short') + '</div>';
      } else {
        el.hourTable.innerHTML =
          '<table><thead><tr>' +
            '<th>' + t('hour_analysis') + '</th><th>' + t('th_count') + '</th>' +
            '<th>' + t('th_wr') + '</th><th>' + t('th_net') + '</th>' +
          '</tr></thead><tbody>' +
          hours.sort((a,b) => a.hour - b.hour).map(h => {
            const cls = h.net > 0 ? 'pos' : h.net < 0 ? 'neg' : 'dim';
            return '<tr>' +
              '<td>' + String(h.hour).padStart(2,'0') + ':00</td>' +
              '<td class="num dim">' + num(h.count) + '</td>' +
              '<td class="num">' + pct(h.winRate) + '</td>' +
              '<td class="num ' + cls + '">' + money(h.net) + '</td>' +
            '</tr>';
          }).join('') +
          '</tbody></table>';
      }
    }

    // Symbol table
    if (el.symbolTable) {
      const syms = bySymbol(filtered);
      if (!syms.length) {
        el.symbolTable.innerHTML = '<div class="empty">' + t('no_data_short') + '</div>';
      } else {
        el.symbolTable.innerHTML =
          '<table><thead><tr>' +
            '<th>' + t('symbol_perf') + '</th><th>' + t('th_count') + '</th>' +
            '<th>' + t('th_wr') + '</th><th>' + t('th_net') + '</th>' +
          '</tr></thead><tbody>' +
          syms.map(s => {
            const cls = s.net > 0 ? 'pos' : s.net < 0 ? 'neg' : 'dim';
            return '<tr>' +
              '<td>' + esc(s.name) + '</td>' +
              '<td class="num dim">' + num(s.count) + '</td>' +
              '<td class="num">' + pct(s.winRate) + '</td>' +
              '<td class="num ' + cls + '">' + money(s.net) + '</td>' +
            '</tr>';
          }).join('') +
          '</tbody></table>';
      }
    }

    // Side table
    if (el.sideTable) {
      const sides = bySide(filtered);
      el.sideTable.innerHTML =
        '<table><thead><tr>' +
          '<th>' + t('side_analysis') + '</th><th>' + t('th_count') + '</th>' +
          '<th>' + t('th_wr') + '</th><th>' + t('th_net') + '</th>' +
        '</tr></thead><tbody>' +
        sides.map(s => {
          const cls = s.net > 0 ? 'pos' : s.net < 0 ? 'neg' : 'dim';
          const label = s.key === 'buy' ? '🟢 ' + t('buy') : '🔴 ' + t('sell');
          return '<tr>' +
            '<td>' + label + '</td>' +
            '<td class="num dim">' + num(s.count) + '</td>' +
            '<td class="num">' + pct(s.winRate) + '</td>' +
            '<td class="num ' + cls + '">' + money(s.net) + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>';
    }

    // Period comparison
    if (el.comparisonTable && range !== 'all') {
      const current = inRange(trades, range);
      const prev = previousRange(trades, range);
      const currStats = computeStats(current);
      const prevStats = computeStats(prev);
      const rows = [
        { l: t('kpi_net'),      c: currStats.net,          p: prevStats.net,          fmt: money },
        { l: t('kpi_winrate'),  c: currStats.winRate,      p: prevStats.winRate,      fmt: pct },
        { l: t('kpi_total'),    c: currStats.total,        p: prevStats.total,        fmt: num },
        { l: t('kpi_pf'),       c: currStats.profitFactor, p: prevStats.profitFactor, fmt: x => isFinite(x) ? x.toFixed(2) : '∞' },
        { l: t('kpi_avgr'),     c: currStats.avgR,         p: prevStats.avgR,         fmt: x => x.toFixed(2) + 'R' }
      ];
      el.comparisonTable.innerHTML =
        '<table><thead><tr>' +
          '<th>' + t('goal_metric') + '</th>' +
          '<th>' + t('period_current') + '</th>' +
          '<th>' + t('period_previous') + '</th>' +
          '<th>' + t('change') + '</th>' +
        '</tr></thead><tbody>' +
        rows.map(r => {
          const diff = r.c - r.p;
          const change = r.p !== 0 ? (diff / Math.abs(r.p)) * 100 : 0;
          const cls = diff > 0 ? 'pos' : diff < 0 ? 'neg' : 'dim';
          const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
          return '<tr>' +
            '<td>' + esc(r.l) + '</td>' +
            '<td class="num dim">' + r.fmt(r.p) + '</td>' +
            '<td class="num">' + r.fmt(r.c) + '</td>' +
            '<td class="num ' + cls + '">' + arrow + ' ' + (change >= 0 ? '+' : '') + change.toFixed(1) + '%</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>';
    }
  }

  /* ============================ RENDER: EMOTIONS ============================ */
  function renderEmotions() {
    const filtered = inRange(trades, range);
    const rows = byEmotion(filtered);
    if (!rows.length) {
      el.emotionsStats.innerHTML = '<div class="empty">' + t('no_data_short') + '</div>';
      return;
    }
    el.emotionsStats.innerHTML = rows.map(r => {
      const emo = EMOTIONS[r.key] || EMOTIONS.calm;
      const cls = r.net > 0 ? 'pos' : r.net < 0 ? 'neg' : '';
      return '' +
        '<div class="emo-stat ' + cls + '">' +
          '<div class="emo-ico">' + emo.ico + '</div>' +
          '<div class="emo-info">' +
            '<div class="emo-name">' + esc(emoLabel(r.key)) + '</div>' +
            '<div class="emo-meta">' + num(r.count) + ' ' + t('trades_word') + ' · ' + pct(r.winRate) + '</div>' +
          '</div>' +
          '<div class="emo-net">' + money(r.net) + '</div>' +
        '</div>';
    }).join('');
  }

  /* ============================ RENDER: TABLES ============================ */
  function renderStrategyTable() {
    const rows = byStrategy(inRange(trades, range));
    if (!rows.length) {
      el.strategyTable.innerHTML = '<div class="empty">' + t('no_data_short') + '</div>';
      return;
    }
    el.strategyTable.innerHTML =
      '<table><thead><tr>' +
        '<th>' + t('th_strategy') + '</th><th>' + t('th_count') + '</th>' +
        '<th>' + t('th_win') + '</th><th>' + t('th_loss') + '</th>' +
        '<th>' + t('th_wr') + '</th><th>' + t('th_net') + '</th>' +
      '</tr></thead><tbody>' +
        rows.map(r =>
          '<tr>' +
            '<td>' + esc(r.name) + '</td>' +
            '<td class="num dim">' + num(r.count) + '</td>' +
            '<td class="num pos">' + num(r.wins) + '</td>' +
            '<td class="num neg">' + num(r.losses) + '</td>' +
            '<td class="num">' + pct(r.winRate) + '</td>' +
            '<td class="num ' + (r.net > 0 ? 'pos' : r.net < 0 ? 'neg' : 'dim') + '">' + money(r.net) + '</td>' +
          '</tr>'
        ).join('') +
      '</tbody></table>';
  }
  function renderDailyTable() {
    const rows = byDay(inRange(trades, range)).reverse();
    if (!rows.length) {
      el.dailyTable.innerHTML = '<div class="empty">' + t('no_data_short') + '</div>';
      return;
    }
    el.dailyTable.innerHTML =
      '<table><thead><tr>' +
        '<th>' + t('th_date') + '</th><th>' + t('th_trades') + '</th>' +
        '<th>' + t('th_profit') + '</th><th>' + t('th_loss2') + '</th>' +
        '<th>' + t('th_net2') + '</th><th>' + t('th_cum') + '</th>' +
      '</tr></thead><tbody>' +
        rows.map(r =>
          '<tr>' +
            '<td class="num dim">' + fullDate(r.date) + '</td>' +
            '<td class="num dim">' + num(r.count) + '</td>' +
            '<td class="num pos">' + (r.profit ? money(r.profit, false) : '—') + '</td>' +
            '<td class="num neg">' + (r.loss ? money(-r.loss) : '—') + '</td>' +
            '<td class="num ' + (r.net > 0 ? 'pos' : r.net < 0 ? 'neg' : 'dim') + '">' + money(r.net) + '</td>' +
            '<td class="num ' + (r.cum > 0 ? 'pos' : r.cum < 0 ? 'neg' : 'dim') + '">' + money(r.cum) + '</td>' +
          '</tr>'
        ).join('') +
      '</tbody></table>';
  }

  /* ============================ RENDER: GOALS MINI ============================ */
  function renderGoalsMini() {
    if (!el.goalsMiniCard) return;
    const g = getGoalProgress();
    if (!g) { el.goalsMiniCard.style.display = 'none'; return; }
    el.goalsMiniCard.style.display = '';
    el.goalsMiniPeriod.textContent = g.period === 'week' ? t('this_week') : t('this_month');

    let metricLabel, currentTxt, targetTxt;
    if (g.metric === 'pnl') {
      metricLabel = t('goal_pnl');
      currentTxt = money(g.current);
      targetTxt = money(g.target, false);
    } else if (g.metric === 'trades') {
      metricLabel = t('goal_trades');
      currentTxt = num(g.current);
      targetTxt = num(g.target);
    } else {
      metricLabel = t('goal_winrate');
      currentTxt = pct(g.current);
      targetTxt = pct(g.target);
    }
    const p = Math.min(100, Math.max(0, g.progress));
    let progCls = '';
    if (g.progress >= 100) progCls = '';
    else if (g.progress >= 60) progCls = 'warn';
    else if (g.progress < 30) progCls = 'danger';

    el.goalsMini.innerHTML =
      '<div class="goal-box">' +
        '<div class="goal-ico">🎯</div>' +
        '<div class="goal-info">' +
          '<div class="goal-label">' + esc(metricLabel) + '</div>' +
          '<div class="goal-vals">' +
            '<span class="cur">' + currentTxt + '</span>' +
            '<span class="sep">/</span>' +
            '<span class="tgt">' + targetTxt + '</span>' +
          '</div>' +
          '<div class="goal-progress">' +
            '<div class="goal-progress-fill ' + progCls + '" style="width:' + p + '%"></div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:12px;font-weight:800;color:var(--muted);min-width:42px;text-align:center">' + Math.round(p) + '%</div>' +
      '</div>';
  }

  /* ============================ RENDER: RULES BANNER ============================ */
  function renderRulesBanner() {
    if (!el.rulesBanner) return;
    const checks = checkRules();
    if (!checks) { el.rulesBanner.innerHTML = ''; return; }
    let banner = '';
    if (checks.dailyLoss && checks.dailyLoss.status === 'bad') {
      banner = '<div class="rules-banner danger">' +
        '<span class="rb-ico">🚨</span>' +
        '<span class="rb-msg">' + fmt('bn_daily', { v: money(-checks.dailyLoss.loss) }) + '</span>' +
      '</div>';
    } else if (checks.maxDD && checks.maxDD.status === 'bad') {
      banner = '<div class="rules-banner danger">' +
        '<span class="rb-ico">🚨</span>' +
        '<span class="rb-msg">' + fmt('bn_dd', { v: money(-checks.maxDD.dd) }) + '</span>' +
      '</div>';
    } else if (checks.target && checks.target.progress >= 100) {
      banner = '<div class="rules-banner success">' +
        '<span class="rb-ico">🏆</span>' +
        '<span class="rb-msg">' + fmt('bn_target', { v: money(checks.target.net) }) + '</span>' +
      '</div>';
    } else if (checks.dailyLoss && checks.dailyLoss.status === 'warn') {
      banner = '<div class="rules-banner warn">' +
        '<span class="rb-ico">⚠️</span>' +
        '<span class="rb-msg">' + fmt('bn_daily_warn', { p: Math.round(checks.dailyLoss.usage) }) + '</span>' +
      '</div>';
    } else if (checks.maxDD && checks.maxDD.status === 'warn') {
      banner = '<div class="rules-banner warn">' +
        '<span class="rb-ico">⚠️</span>' +
        '<span class="rb-msg">' + fmt('bn_dd_warn', { p: Math.round(checks.maxDD.usage) }) + '</span>' +
      '</div>';
    }
    el.rulesBanner.innerHTML = banner;
  }

  /* ============================ RENDER: CALENDAR ============================ */
  function renderCalendar() {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const months = lang === 'fa' ? MONTHS_FA : MONTHS_EN;
    el.calTitle.textContent = months[month] + ' ' + year;

    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const offset = (startWeekday + 1) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayMap = new Map();
    for (const tr of trades) {
      const p = tr.date.split('-');
      if (Number(p[0]) === year && Number(p[1]) - 1 === month) {
        const d = Number(p[2]);
        if (!dayMap.has(d)) dayMap.set(d, { net: 0, count: 0 });
        const rec = dayMap.get(d);
        rec.net += pnl(tr); rec.count++;
      }
    }
    let maxAbs = 0;
    for (const v of dayMap.values()) {
      const a = Math.abs(v.net);
      if (a > maxAbs) maxAbs = a;
    }
    const intensity = val => {
      if (maxAbs === 0) return 1;
      const ratio = Math.abs(val) / maxAbs;
      if (ratio < 0.34) return 1;
      if (ratio < 0.67) return 2;
      return 3;
    };

    let html = '';
    for (let i = 0; i < offset; i++) html += '<div class="cal-cell empty-day"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const rec = dayMap.get(d);
      const iso = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      if (!rec) {
        html += '<div class="cal-cell no-trade" data-date="' + iso + '">' +
          '<span class="day-num">' + d + '</span></div>';
        continue;
      }
      const inten = intensity(rec.net);
      const cls = rec.net > 0 ? ('pos-' + inten) : rec.net < 0 ? ('neg-' + inten) : '';
      const sign = rec.net > 0 ? '+' : '';
      const pnlTxt = rec.net === 0 ? '0' : (sign + Math.round(rec.net));
      html += '<div class="cal-cell has-trade ' + cls + '" data-date="' + iso + '">' +
        '<span class="trade-count">' + rec.count + '</span>' +
        '<span class="day-num">' + d + '</span>' +
        '<span class="day-pnl">' + pnlTxt + '</span>' +
      '</div>';
    }
    el.calGrid.innerHTML = html;
    el.calDetailCard.hidden = true;

    // Week stats + month stats
    renderCalWeekStats(year, month);
    renderCalMonthStats(year, month);
  }

  function renderCalWeekStats(year, month) {
    if (!el.calWeekStats) return;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysSinceSat = (dayOfWeek + 1) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - daysSinceSat);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startISO = toISO(start), endISO = toISO(end);
    const periodTrades = trades.filter(t => t.date >= startISO && t.date <= endISO);
    const s = computeStats(periodTrades);
    el.calWeekStats.innerHTML =
      '<div class="cal-stat-box">' +
        '<div class="csb-label">' + t('this_week') + '</div>' +
        '<div class="csb-value ' + (s.net > 0 ? 'pos' : s.net < 0 ? 'neg' : '') + '">' + money(s.net) + '</div>' +
        '<div class="csb-meta">' + num(s.total) + ' ' + t('trades_word') + ' · ' + pct(s.winRate) + '</div>' +
      '</div>';
  }

  function renderCalMonthStats(year, month) {
    if (!el.calMonthStats) return;
    const startISO = year + '-' + String(month + 1).padStart(2, '0') + '-01';
    const endISO = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(new Date(year, month + 1, 0).getDate()).padStart(2, '0');
    const periodTrades = trades.filter(t => t.date >= startISO && t.date <= endISO);
    const s = computeStats(periodTrades);
    el.calMonthStats.innerHTML =
      '<div class="cal-stat-box">' +
        '<div class="csb-label">' + t('this_month') + '</div>' +
        '<div class="csb-value ' + (s.net > 0 ? 'pos' : s.net < 0 ? 'neg' : '') + '">' + money(s.net) + '</div>' +
        '<div class="csb-meta">' + num(s.total) + ' ' + t('trades_word') + ' · ' + pct(s.winRate) + '</div>' +
      '</div>';
  }

  function showCalDetail(dateISO) {
    const dayTrades = trades.filter(tr => tr.date === dateISO);
    if (!dayTrades.length) return;
    let net = 0;
    for (const tr of dayTrades) net += pnl(tr);
    el.calDetailTitle.textContent = fullDate(dateISO) + ' — ' + money(net) + ' (' + dayTrades.length + ' ' + t('trades_word') + ')';
    el.calDetailList.innerHTML = dayTrades.map(tr => renderTradeItem(tr, false)).join('');
    el.calDetailCard.hidden = false;
    el.calDetailCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ============================ RENDER: TRADES PAGE ============================ */
  function applyFilters(list) {
    const f = filters;
    const search = f.search.trim().toLowerCase();
    return list.filter(tr => {
      if (f.strategy !== 'all' && (tr.strategy || '') !== f.strategy) return false;
      if (f.tag !== 'all' && !(tr.tags || []).includes(f.tag)) return false;
      if (f.result !== 'all' && tr.result !== f.result) return false;
      if (f.emotion !== 'all' && (tr.emotion || 'calm') !== f.emotion) return false;
      if (f.side !== 'all' && tr.side !== f.side) return false;
      if (f.from && tr.date < f.from) return false;
      if (f.to && tr.date > f.to) return false;
      if (search) {
        const hay = (tr.symbol + ' ' + tr.strategy + ' ' + (tr.note || '') + ' ' +
                    (tr.tags || []).join(' ')).toLowerCase();
        if (hay.indexOf(search) === -1) return false;
      }
      return true;
    });
  }
  function populateFilterOptions() {
    const strategies = new Set();
    const tags = new Set();
    for (const tr of trades) {
      if (tr.strategy) strategies.add(tr.strategy);
      for (const g of (tr.tags || [])) tags.add(g);
    }
    const sSorted = Array.from(strategies).sort();
    const tSorted = Array.from(tags).sort();
    el.fltStrategy.innerHTML = '<option value="all">' + t('all') + '</option>' +
      sSorted.map(s => '<option value="' + esc(s) + '">' + esc(s) + '</option>').join('');
    el.fltTag.innerHTML = '<option value="all">' + t('all') + '</option>' +
      tSorted.map(s => '<option value="' + esc(s) + '">' + esc(s) + '</option>').join('');
    el.fltEmotion.innerHTML = '<option value="all">' + t('all') + '</option>' +
      Object.keys(EMOTIONS).map(k =>
        '<option value="' + k + '">' + EMOTIONS[k].ico + ' ' + esc(emoLabel(k)) + '</option>'
      ).join('');
  }
  function renderAllTrades() {
    populateFilterOptions();
    el.fltStrategy.value = filters.strategy;
    el.fltTag.value = filters.tag;
    el.fltResult.value = filters.result;
    el.fltEmotion.value = filters.emotion;
    el.fltSide.value = filters.side;
    el.fltFrom.value = filters.from;
    el.fltTo.value = filters.to;
    el.fltSearch.value = filters.search;

    const filtered = applyFilters(trades);
    const sorted = filtered.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    el.allCount.textContent = sorted.length + ' ' + t('of_label') + ' ' + trades.length + ' ' + t('trades_word');
    if (!sorted.length) {
      el.allTradesList.innerHTML = '<div class="empty">' + t('no_filter') + '</div>';
      return;
    }
    el.allTradesList.innerHTML = sorted.map(tr => renderTradeItem(tr)).join('');
  }

  /* ============================ RENDER: SETTINGS ============================ */
  function renderSettingsPage() {
    if (goal) {
      setSeg(el.goalPeriod, goal.period || 'week');
      setSeg(el.goalMetric, goal.metric || 'pnl');
      el.goalTarget.value = goal.target || '';
    } else {
      setSeg(el.goalPeriod, 'week');
      setSeg(el.goalMetric, 'pnl');
      el.goalTarget.value = '';
    }
    el.rulesEnabled.checked = !!rules.enabled;
    el.ruleBalance.value = rules.balance || '';
    el.ruleDaily.value = rules.dailyLoss || '';
    el.ruleMaxDD.value = rules.maxDD || '';
    el.ruleTarget.value = rules.target || '';
    renderGoalsPreview();
    renderRulesStatus();
    renderChecklistManager();
    renderTemplates();
    renderMultiGoals();

    // Notifications
    if (el.notifEnabled) {
      el.notifEnabled.checked = !!notifications.enabled;
      el.notifDaily.checked = !!notifications.daily;
      el.notifGoal.checked = !!notifications.goal;
      el.notifRules.checked = !!notifications.rules;
      el.notifWin.checked = !!notifications.win;
      el.bigWinThr.value = notifications.bigWin || '';
      el.bigLossThr.value = notifications.bigLoss || '';
    }
  }

  function renderGoalsPreview() {
    const g = getGoalProgress();
    if (!g) {
      el.goalsPreview.innerHTML = '<div class="empty" style="padding:14px;font-size:12px">' + t('no_goal') + '</div>';
      return;
    }
    let currentTxt, targetTxt;
    if (g.metric === 'pnl') { currentTxt = money(g.current); targetTxt = money(g.target, false); }
    else if (g.metric === 'trades') { currentTxt = num(g.current); targetTxt = num(g.target); }
    else { currentTxt = pct(g.current); targetTxt = pct(g.target); }
    const p = Math.min(100, Math.max(0, g.progress));
    el.goalsPreview.innerHTML =
      '<div class="goal-box">' +
        '<div class="goal-ico">🎯</div>' +
        '<div class="goal-info">' +
          '<div class="goal-label">' + (g.period === 'week' ? t('this_week') : t('this_month')) + '</div>' +
          '<div class="goal-vals">' +
            '<span class="cur">' + currentTxt + '</span>' +
            '<span class="sep">/</span>' +
            '<span class="tgt">' + targetTxt + '</span>' +
          '</div>' +
          '<div class="goal-progress"><div class="goal-progress-fill" style="width:' + p + '%"></div></div>' +
        '</div>' +
        '<div style="font-size:12px;font-weight:800;color:var(--muted);min-width:42px;text-align:center">' + Math.round(p) + '%</div>' +
      '</div>';
  }

  function renderRulesStatus() {
    if (!rules.enabled) {
      el.rulesStatus.innerHTML = '<div class="empty" style="padding:14px;font-size:12px">' + t('rules_disabled') + '</div>';
      return;
    }
    const checks = checkRules();
    if (!checks) { el.rulesStatus.innerHTML = ''; return; }
    const pf = checks.pf;

    let html = '';

    html +=
      '<div class="rule-card">' +
        '<div class="rc-head">' +
          '<div class="rc-title"><span class="rc-ico">💼</span>' + t('rc_equity') + '</div>' +
          '<div class="rs-status ok" style="background:rgba(91,140,255,.15);color:var(--blue)">' + money(pf.currentEquity, false) + '</div>' +
        '</div>' +
        '<div class="rc-detail">' +
          '<span>' + t('rc_net') + ': ' + money(pf.net) + '</span>' +
          '<span>' + t('rc_peak') + ': ' + money(pf.peakEquity, false) + '</span>' +
        '</div>' +
      '</div>';

    if (checks.dailyLoss) {
      const sc = checks.dailyLoss.status;
      const txt = sc === 'ok' ? t('rc_ok') : sc === 'warn' ? t('rc_warn') : t('rc_bad');
      const p = Math.min(100, checks.dailyLoss.usage);
      html +=
        '<div class="rule-card ' + (sc === 'ok' ? '' : sc) + '">' +
          '<div class="rc-head">' +
            '<div class="rc-title"><span class="rc-ico">💥</span>' + t('rc_daily') + '</div>' +
            '<div class="rs-status ' + sc + '">' + txt + '</div>' +
          '</div>' +
          '<div class="rc-detail">' +
            '<span>' + t('rc_used') + ': ' + money(checks.dailyLoss.loss) + '</span>' +
            '<span>' + t('rc_remaining') + ': ' + money(-Math.max(0, checks.dailyLoss.limit - checks.dailyLoss.loss)) + '</span>' +
          '</div>' +
          '<div class="rc-bar"><div class="rc-bar-fill" style="width:' + p + '%"></div></div>' +
        '</div>';
    }

    if (checks.maxDD) {
      const sc = checks.maxDD.status;
      const txt = sc === 'ok' ? t('rc_ok') : sc === 'warn' ? t('rc_warn') : t('rc_bad');
      const p = Math.min(100, checks.maxDD.usage);
      html +=
        '<div class="rule-card ' + (sc === 'ok' ? '' : sc) + '">' +
          '<div class="rc-head">' +
            '<div class="rc-title"><span class="rc-ico">⚠️</span>' + t('rc_dd') + '</div>' +
            '<div class="rs-status ' + sc + '">' + txt + '</div>' +
          '</div>' +
          '<div class="rc-detail">' +
            '<span>' + t('rc_current_dd') + ': ' + money(-checks.maxDD.dd) + '</span>' +
            '<span>' + t('rc_remaining') + ': ' + money(-Math.max(0, checks.maxDD.limit - checks.maxDD.dd)) + '</span>' +
          '</div>' +
          '<div class="rc-bar"><div class="rc-bar-fill" style="width:' + p + '%"></div></div>' +
        '</div>';
    }

    if (checks.target) {
      const reached = checks.target.progress >= 100;
      const sc = reached ? 'ok' : 'warn';
      const txt = reached ? t('rc_reached') : Math.round(checks.target.progress) + '%';
      const p = Math.min(100, checks.target.progress);
      html +=
        '<div class="rule-card ' + (reached ? '' : 'warn') + '">' +
          '<div class="rc-head">' +
            '<div class="rc-title"><span class="rc-ico">🏆</span>' + t('rc_target') + '</div>' +
            '<div class="rs-status ' + sc + '">' + txt + '</div>' +
          '</div>' +
          '<div class="rc-detail">' +
            '<span>' + money(checks.target.net) + '</span>' +
            '<span>/ ' + money(checks.target.target, false) + '</span>' +
          '</div>' +
          '<div class="rc-bar"><div class="rc-bar-fill" style="width:' + p + '%"></div></div>' +
        '</div>';
    }

    el.rulesStatus.innerHTML = html || '<div class="empty" style="padding:14px;font-size:12px">' + t('no_rule') + '</div>';
  }

  /* ============================ MULTI GOALS (NEW v8) ============================ */
  function renderMultiGoals() {
    if (!el.multiGoalsList) return;
    if (!multiGoals.length) {
      el.multiGoalsList.innerHTML = '<div class="empty" style="padding:14px;font-size:12px">' + t('no_goal') + '</div>';
      return;
    }
    el.multiGoalsList.innerHTML = multiGoals.map((g, i) => {
      let current = 0;
      const stats = computeStats(inRange(trades, '30'));
      if (g.type === 'pnl') current = stats.net;
      else if (g.type === 'winrate') current = stats.winRate;
      else if (g.type === 'trades') current = stats.total;
      else if (g.type === 'pf') current = stats.profitFactor;
      else if (g.type === 'r') current = stats.avgR;
      else if (g.type === 'dd') current = -stats.maxDrawdown;
      const progress = g.target > 0 ? Math.min(100, Math.max(0, (current / g.target) * 100)) : 0;
      const typeLabel = {
        pnl: t('goal_type_pnl'), winrate: t('goal_type_winrate'),
        trades: t('goal_type_trades'), pf: t('goal_type_pf'),
        r: t('goal_type_r'), dd: t('goal_type_dd'),
        discipline: t('goal_type_discipline')
      }[g.type] || g.type;
      return '<div class="goal-box">' +
        '<div class="goal-ico">' + (g.type === 'dd' ? '⚠️' : g.type === 'pf' ? '⚖️' : g.type === 'r' ? '📐' : '🎯') + '</div>' +
        '<div class="goal-info">' +
          '<div class="goal-label">' + esc(typeLabel) + '</div>' +
          '<div class="goal-vals">' +
            '<span class="cur">' + (g.type === 'pnl' ? money(current) : g.type === 'winrate' ? pct(current) : g.type === 'r' ? current.toFixed(2) + 'R' : g.type === 'pf' ? current.toFixed(2) : num(current)) + '</span>' +
            '<span class="sep">/</span>' +
            '<span class="tgt">' + (g.type === 'pnl' ? money(g.target, false) : g.type === 'winrate' ? pct(g.target) : g.type === 'r' ? g.target + 'R' : g.type === 'pf' ? g.target : num(g.target)) + '</span>' +
          '</div>' +
          '<div class="goal-progress"><div class="goal-progress-fill" style="width:' + progress + '%"></div></div>' +
        '</div>' +
        '<button class="btn ghost sm" data-del-goal="' + g.id + '" title="Delete">🗑️</button>' +
      '</div>';
    }).join('');
  }

  async function addMultiGoal() {
    const type = prompt(t('goal_type') + ' (pnl / winrate / trades / pf / r):', 'pnl');
    if (!type) return;
    const target = parseFloat(prompt(t('goal_target') + ':', '100'));
    if (!target || isNaN(target)) return;
    multiGoals.push({ id: uid(), type, target });
    saveJSON(KEYS.goals, multiGoals);
    renderMultiGoals();
    toast(el.multiGoalMsg, t('ok_goal'));
  }

  async function removeMultiGoal(id) {
    multiGoals = multiGoals.filter(g => g.id !== id);
    saveJSON(KEYS.goals, multiGoals);
    renderMultiGoals();
  }

  /* ============================ RENDER ALL ============================ */
  function renderAll() {
    renderRecent();
    renderKPIs();
    renderCharts();
    renderEmotions();
    renderStrategyTable();
    renderDailyTable();
    renderGoalsMini();
    renderRulesBanner();
    if (el.pageAnalysis.classList.contains('active')) {
      renderDeepAnalytics();
    }
    if (el.pageCalendar.classList.contains('active')) renderCalendar();
    if (el.pageTrades.classList.contains('active')) renderAllTrades();
    if (el.pageSettings.classList.contains('active')) renderSettingsPage();
  }

  /* ============================ RISK CALCULATOR (NEW v8) ============================ */
  function calculateRiskPosition() {
    const balance = parseFloat(el.riskBalance.value) || 0;
    const riskPercent = parseFloat(el.riskPercent.value) || 0;
    const pips = parseFloat(el.riskPips.value) || 0;
    const pipValue = parseFloat(el.riskPipValue.value) || 10;

    if (!balance || !riskPercent || !pips) {
      el.riskResult.innerHTML = '<div class="empty" style="padding:14px;font-size:12px">' + t('no_data_short') + '</div>';
      return;
    }

    const riskAmount = (balance * riskPercent) / 100;
    const lotSize = riskAmount / (pips * pipValue);

    el.riskResult.innerHTML =
      '<div class="calc-result-box">' +
        '<div class="crb-row">' +
          '<span class="crb-label">' + t('calc_risk_amount') + '</span>' +
          '<span class="crb-value">' + money(riskAmount, false) + '</span>' +
        '</div>' +
        '<div class="crb-row highlight">' +
          '<span class="crb-label">' + t('calc_result') + '</span>' +
          '<span class="crb-value">' + lotSize.toFixed(3) + ' lots</span>' +
        '</div>' +
      '</div>';
  }

  /* ============================ DEMO DATA ============================ */
  function demoData() {
    const symbols = ['XAUUSD', 'EURUSD', 'BTCUSD', 'GBPJPY', 'NAS100'];
    const strategies = lang === 'fa'
      ? ['بریک‌اوت لندن', 'بازگشت به میانگین', 'شکست ساختار', 'پرایس اکشن', 'اسکالپ نیویورک']
      : ['London Breakout', 'Mean Reversion', 'Structure Break', 'Price Action', 'NY Scalp'];
    const tagPool = lang === 'fa'
      ? ['بریک‌اوت', 'پولبک', 'لندن', 'نیویورک', 'M5', 'M15', 'روند', 'رنج']
      : ['Breakout', 'Pullback', 'London', 'NY', 'M5', 'M15', 'Trend', 'Range'];
    const emoKeys = Object.keys(EMOTIONS);
    const out = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toISO(d);
      const count = Math.random() < 0.2 ? 0 : 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < count; j++) {
        const r = Math.random();
        const result = r < 0.55 ? 'win' : r < 0.94 ? 'loss' : 'be';
        const amount = result === 'be' ? 0 : Math.round((40 + Math.random() * 260) * 100) / 100;
        const risk = result === 'be' ? 50 : Math.round((30 + Math.random() * 70) * 100) / 100;
        const emotion = emoKeys[Math.floor(Math.random() * emoKeys.length)];
        const checklist = {};
        for (const it of checklistItems) checklist[it.id] = Math.random() < 0.75;
        const tags = [];
        while (tags.length < 2) {
          const x = tagPool[Math.floor(Math.random() * tagPool.length)];
          if (tags.indexOf(x) === -1) tags.push(x);
        }
        out.push({
          id: uid(), date: iso,
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
          strategy: strategies[Math.floor(Math.random() * strategies.length)],
          side: Math.random() < 0.5 ? 'buy' : 'sell',
          result, amount, risk, tags, emotion, checklist,
          screenshot: null, note: '',
          hour: Math.floor(Math.random() * 24),
          duration: Math.floor(5 + Math.random() * 240),
          createdAt: now - i * 86400000 + j * 60000
        });
      }
    }
    return out;
  }

  /* ============================ EXPORT / IMPORT ============================ */
  function exportJSON() {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'po-trade-' + todayISO() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast(el.formMsg, t('ok_export'));
  }
  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('Invalid file structure');
        const existing = new Set(trades.map(tr => tr.id));
        let added = 0;
        for (const raw of parsed) {
          if (!raw || typeof raw !== 'object') continue;
          const id = raw.id || uid();
          if (existing.has(id)) continue;
          trades.push({
            id,
            date: /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : todayISO(),
            symbol: String(raw.symbol || '—').slice(0, 24),
            strategy: String(raw.strategy || '—').slice(0, 48),
            side: raw.side === 'sell' ? 'sell' : 'buy',
            result: ['win','loss','be'].indexOf(raw.result) > -1 ? raw.result : 'be',
            amount: Math.abs(Number(raw.amount) || 0),
            risk: raw.risk != null ? Math.abs(Number(raw.risk)) : null,
            tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 8) : [],
            emotion: EMOTIONS[raw.emotion] ? raw.emotion : 'calm',
            checklist: raw.checklist && typeof raw.checklist === 'object' ? raw.checklist : {},
            screenshot: typeof raw.screenshot === 'string' ? raw.screenshot : null,
            note: String(raw.note || '').slice(0, 500),
            entry: raw.entry != null ? Number(raw.entry) : null,
            exit: raw.exit != null ? Number(raw.exit) : null,
            sl: raw.sl != null ? Number(raw.sl) : null,
            tp: raw.tp != null ? Number(raw.tp) : null,
            lot: raw.lot != null ? Number(raw.lot) : null,
            rr: raw.rr || null,
            hour: raw.hour != null ? Number(raw.hour) : null,
            duration: raw.duration != null ? Number(raw.duration) : null,
            createdAt: Number(raw.createdAt) || Date.now()
          });
          existing.add(id);
          added++;
        }
        saveTrades();
        updateAutocomplete();
        renderAll();
        toast(el.formMsg, fmt('ok_import', { n: added }));
      } catch (err) {
        toast(el.formMsg, fmt('err_import', { m: err.message }), true);
      }
    };
    reader.readAsText(file);
  }

  /* ============================ EVENT BINDING ============================ */
  function bindEvents() {
    if (el.langBtn) el.langBtn.addEventListener('click', () => applyLang(lang === 'fa' ? 'en' : 'fa'));

    el.tabs.addEventListener('click', e => {
      const tab = e.target.closest('.tab');
      if (tab) switchView(tab.dataset.view);
    });

    el.form.addEventListener('submit', onSubmit);
    el.cancelEdit.addEventListener('click', () => {
      resetForm();
      toast(el.formMsg, t('cancel_edit'));
    });
    el.fTags.addEventListener('input', renderTagsPreview);

    // Auto R:R
    if (el.fEntry) el.fEntry.addEventListener('input', calcAutoRR);
    if (el.fExit)  el.fExit.addEventListener('input', calcAutoRR);
    if (el.fSL)    el.fSL.addEventListener('input', calcAutoRR);

    // Advanced fields toggle
    if (el.advancedToggle && el.advancedFields) {
      el.advancedToggle.addEventListener('click', () => {
        advancedFieldsVisible = !advancedFieldsVisible;
        el.advancedFields.hidden = !advancedFieldsVisible;
        el.advancedToggle.textContent = advancedFieldsVisible ? '⚙️ ' + t('hide_advanced') : '⚙️ ' + t('show_advanced');
      });
    }

    // Templates
    if (el.saveTemplateBtn) el.saveTemplateBtn.addEventListener('click', saveCurrentAsTemplate);
    if (el.applyTemplateBtn) el.applyTemplateBtn.addEventListener('click', applyTemplate);
    if (el.deleteTemplateBtn) el.deleteTemplateBtn.addEventListener('click', deleteTemplate);

    async function handleListClick(e) {
      const thumb = e.target.closest('.ti-thumb');
      if (thumb) {
        const item = thumb.closest('.trade-item');
        const tr = trades.find(x => x.id === item.dataset.id);
        if (tr && tr.screenshot) openLightbox(tr.screenshot);
        return;
      }
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const item = btn.closest('.trade-item');
      if (!item) return;
      const id = item.dataset.id;
      if (btn.dataset.act === 'edit') {
        startEdit(id);
      } else if (btn.dataset.act === 'del') {
        const ok = await confirmDialog({
          variant: 'danger',
          icon: '🗑️',
          title: t('md_del_trade'),
          message: t('md_del_trade_msg'),
          okText: t('md_del_trade_ok'),
          cancelText: t('md_cancel')
        });
        if (!ok) return;
        trades = trades.filter(tr => tr.id !== id);
        saveTrades();
        updateAutocomplete();
        renderAll();
        toast(el.formMsg, t('del_done'));
      }
    }
    el.recentList.addEventListener('click', handleListClick);
    el.allTradesList.addEventListener('click', handleListClick);
    el.calDetailList.addEventListener('click', e => {
      const thumb = e.target.closest('.ti-thumb');
      if (thumb) {
        const item = thumb.closest('.trade-item');
        const tr = trades.find(x => x.id === item.dataset.id);
        if (tr && tr.screenshot) openLightbox(tr.screenshot);
      }
    });

    el.rangeFilter.addEventListener('click', e => {
      const btn = e.target.closest('button[data-r]');
      if (!btn) return;
      $$('button', el.rangeFilter).forEach(b => b.classList.toggle('active', b === btn));
      range = btn.dataset.r;
      renderKPIs(); renderCharts(); renderEmotions();
      renderStrategyTable(); renderDailyTable(); renderGoalsMini();
      renderDeepAnalytics();
    });

    el.demoBtn.addEventListener('click', async () => {
      if (trades.length) {
        const ok = await confirmDialog({
          variant: 'info',
          icon: '✨',
          title: t('md_demo_title'),
          message: t('md_demo_msg'),
          okText: t('md_demo_ok'),
          cancelText: t('md_cancel')
        });
        if (!ok) return;
      }
      trades = trades.concat(demoData());
      saveTrades();
      updateAutocomplete();
      renderAll();
      switchView('analysis');
      toast(el.formMsg, t('ok_demo'));
    });

    el.exportBtn.addEventListener('click', exportJSON);
    el.importInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (file) importJSON(file);
      e.target.value = '';
    });
    el.clearBtn.addEventListener('click', async () => {
      if (!trades.length) { toast(el.formMsg, t('empty_list')); return; }
      const ok = await confirmDialog({
        variant: 'danger',
        icon: '💣',
        title: t('md_clear_title'),
        message: t('md_clear_msg'),
        okText: t('md_clear_ok'),
        cancelText: t('md_cancel')
      });
      if (!ok) return;
      trades = [];
      try { localStorage.removeItem(KEYS.trades); } catch (err) {}
      renderAll();
      toast(el.formMsg, t('cleared'));
    });

    el.calPrev.addEventListener('click', () => { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); });
    el.calNext.addEventListener('click', () => { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); });
    el.calGrid.addEventListener('click', e => {
      const cell = e.target.closest('.cal-cell.has-trade');
      if (!cell) return;
      showCalDetail(cell.dataset.date);
    });
    el.calDetailClose.addEventListener('click', () => { el.calDetailCard.hidden = true; });

    el.fltSearch.addEventListener('input', debounce(e => {
      filters.search = e.target.value; renderAllTrades();
    }, 200));
    el.fltStrategy.addEventListener('change', e => { filters.strategy = e.target.value; renderAllTrades(); });
    el.fltTag.addEventListener('change', e => { filters.tag = e.target.value; renderAllTrades(); });
    el.fltResult.addEventListener('change', e => { filters.result = e.target.value; renderAllTrades(); });
    el.fltEmotion.addEventListener('change', e => { filters.emotion = e.target.value; renderAllTrades(); });
    el.fltSide.addEventListener('change', e => { filters.side = e.target.value; renderAllTrades(); });
    el.fltFrom.addEventListener('change', e => { filters.from = e.target.value; renderAllTrades(); });
    el.fltTo.addEventListener('change', e => { filters.to = e.target.value; renderAllTrades(); });
    el.fltClear.addEventListener('click', () => {
      filters = { search: '', strategy: 'all', tag: 'all', result: 'all',
                  emotion: 'all', side: 'all', from: '', to: '' };
      renderAllTrades();
    });

    /* ===== GOAL ===== */
    el.saveGoal.addEventListener('click', () => {
      const target = Math.abs(parseFloat(el.goalTarget.value));
      if (!target || isNaN(target)) { toast(el.goalMsg, t('err_goal_target'), true); return; }
      goal = {
        period: el.goalPeriod.dataset.value || 'week',
        metric: el.goalMetric.dataset.value || 'pnl',
        target
      };
      saveJSON(KEYS.goal, goal);
      renderGoalsPreview();
      renderGoalsMini();
      toast(el.goalMsg, t('ok_goal'));
    });
    el.clearGoal.addEventListener('click', async () => {
      if (!goal) { toast(el.goalMsg, t('empty_goal')); return; }
      const ok = await confirmDialog({
        variant: 'warning',
        icon: '🎯',
        title: t('md_goal_title'),
        message: t('md_goal_msg'),
        okText: t('md_goal_ok'),
        cancelText: t('md_cancel')
      });
      if (!ok) return;
      goal = null;
      try { localStorage.removeItem(KEYS.goal); } catch (err) {}
      el.goalTarget.value = '';
      renderGoalsPreview();
      renderGoalsMini();
      toast(el.goalMsg, t('goal_cleared'));
    });

    /* ===== RULES ===== */
    el.saveRules.addEventListener('click', () => {
      rules = {
        enabled: !!el.rulesEnabled.checked,
        dailyLoss: Math.abs(parseFloat(el.ruleDaily.value)) || 0,
        maxDD: Math.abs(parseFloat(el.ruleMaxDD.value)) || 0,
        target: Math.abs(parseFloat(el.ruleTarget.value)) || 0,
        balance: Math.abs(parseFloat(el.ruleBalance.value)) || 10000
      };
      saveJSON(KEYS.rules, rules);
      renderRulesStatus();
      renderRulesBanner();
      toast(el.rulesMsg, t('ok_rules'));
    });

    /* ===== CHECKLIST ===== */
    if (el.addChecklistBtn) el.addChecklistBtn.addEventListener('click', addChecklistItem);
    if (el.newChecklistInput) {
      el.newChecklistInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); }
      });
    }
    if (el.checklistManager) {
      el.checklistManager.addEventListener('click', e => {
        const del = e.target.closest('[data-del]');
        if (del) removeChecklistItem(del.dataset.del);
      });
      el.checklistManager.addEventListener('input', debounce(e => {
        if (!e.target.matches('.cm-input')) return;
        commitChecklistFromInputs();
        saveChecklist();
        renderChecklistForm({});
        renderKPIs();
      }, 600));
      el.checklistManager.addEventListener('blur', e => {
        if (!e.target.matches('.cm-input')) return;
        commitChecklistFromInputs();
        saveChecklist();
        renderChecklistForm({});
        renderKPIs();
      }, true);
    }
    if (el.saveChecklistBtn) el.saveChecklistBtn.addEventListener('click', saveChecklistAll);
    if (el.resetChecklistBtn) el.resetChecklistBtn.addEventListener('click', resetChecklistAll);

    /* ===== RISK CALCULATOR ===== */
    if (el.calcRiskBtn) el.calcRiskBtn.addEventListener('click', calculateRiskPosition);

    /* ===== NOTIFICATIONS ===== */
    if (el.saveNotifBtn) {
      el.saveNotifBtn.addEventListener('click', async () => {
        notifications = {
          enabled: !!el.notifEnabled.checked,
          daily: !!el.notifDaily.checked,
          goal: !!el.notifGoal.checked,
          rules: !!el.notifRules.checked,
          win: !!el.notifWin.checked,
          bigWin: parseFloat(el.bigWinThr.value) || 500,
          bigLoss: parseFloat(el.bigLossThr.value) || 500
        };
        saveJSON(KEYS.notifications, notifications);
        if (notifications.enabled && 'Notification' in window && Notification.permission === 'default') {
          try { await Notification.requestPermission(); } catch(e){}
        }
        toast(el.notifMsg, t('notif_saved'));
      });
    }

    /* ===== MULTI GOALS ===== */
    if (el.addGoalBtn) el.addGoalBtn.addEventListener('click', addMultiGoal);
    if (el.multiGoalsList) {
      el.multiGoalsList.addEventListener('click', e => {
        const del = e.target.closest('[data-del-goal]');
        if (del) removeMultiGoal(del.dataset.delGoal);
      });
    }

    window.addEventListener('resize', debounce(() => {
      if (el.pageAnalysis.classList.contains('active')) { renderCharts(); renderDeepAnalytics(); }
    }, 160));
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (el.pageAnalysis.classList.contains('active')) { renderCharts(); renderDeepAnalytics(); }
      }, 250);
    });

    document.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea, select')) return;
      if (e.key === 't' || e.key === 'T') toggleTheme();
    });
  }

  /* ============================ LOADER ============================ */
  function runLoader() {
    const loader = document.getElementById('loader');
    const fill = document.getElementById('loader-fill');
    const pct = document.getElementById('loader-pct');
    const sub = document.getElementById('loader-sub');
    if (!loader) return Promise.resolve();

    const messagesFa = ['اتصال به بازار…', 'دریافت داده‌ها…', 'آماده‌سازی نمودارها…', 'آماده!'];
    const messagesEn = ['Connecting to markets…', 'Fetching data…', 'Preparing charts…', 'Ready!'];
    const messages = lang === 'fa' ? messagesFa : messagesEn;

    return new Promise(resolve => {
      let progress = 0;
      const step = () => {
        progress += Math.random() * 14 + 4;
        if (progress >= 100) progress = 100;
        if (fill) fill.style.width = progress + '%';
        if (pct) pct.textContent = Math.round(progress) + '%';
        const idx = Math.min(messages.length - 1, Math.floor(progress / 30));
        if (sub) sub.textContent = messages[idx];
        if (progress < 100) {
          setTimeout(step, Math.random() * 180 + 80);
        } else {
          setTimeout(() => {
            loader.classList.add('hide');
            setTimeout(() => { loader.style.display = 'none'; resolve(); }, 600);
          }, 320);
        }
      };
      step();
    });
  }

  /* ============================ INIT ============================ */
  function init() {
    applyTheme(theme);
    document.documentElement.dataset.preset = preset;
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');
    if (el.langLabel) el.langLabel.textContent = lang === 'fa' ? 'EN' : 'FA';
    document.title = t('title');

    $$('[data-i18n]').forEach(node => {
      const v = t(node.getAttribute('data-i18n'));
      if (v) node.textContent = v;
    });
    $$('[data-i18n-ph]').forEach(node => {
      const v = t(node.getAttribute('data-i18n-ph'));
      if (v) node.setAttribute('placeholder', v);
    });

    initSeg(el.sideSeg, 'buy');
    initSeg(el.resultSeg, 'win');
    initSeg(el.goalPeriod, 'week');
    initSeg(el.goalMetric, 'pnl');

    initEmotions();
    initScreenshot();
    renderChecklistForm({});
    el.fDate.value = todayISO();
    renderTagsPreview();

    initThemeManager();
    bindEvents();
    updateAutocomplete();
    renderTemplates();
    renderAll();
    renderChecklistManager();

    runLoader();
    syncChecklistOnBoot();

    window.addEventListener('focus', () => {
      if (!checklistCloudReady) return;
      loadChecklistFromCloud().then(cloud => {
        if (!cloud || !cloud.items) return;
        const localUpdated = Number(localStorage.getItem(KEYS.checklistUpdatedAt) || 0);
        if (cloud.updatedAt > localUpdated + 1000) {
          checklistItems = cloud.items;
          saveJSON(KEYS.checklist, checklistItems);
          try { localStorage.setItem(KEYS.checklistUpdatedAt, String(cloud.updatedAt)); } catch (e) {}
          lastPushedItemsJson = JSON.stringify(checklistItems);
          renderChecklistForm({});
          renderChecklistManager();
          renderKPIs();
        }
      });
    });

    window.addEventListener('beforeunload', () => {
      if (!checklistCloudReady) return;
      clearTimeout(checklistPushTimer);
      pushChecklistToCloud(checklistItems);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
