/* ============================================================
   PO-TRADE Banner Config
   این فایل رو روی گیت‌هاب بذار و از هرجا صداش بزن.
   هر تغییری اینجا بدی، تو همه اپ‌ها اعمال می‌شه.
   ============================================================ */

window.PT_BANNER_CONFIG = {

  /* ---------- تنظیمات کلی ---------- */
  settings: {
    cacheMinutes: 30,          // هر ۳۰ دقیقه یکبار از گیت‌هاب چک کن
    animationDuration: 420,    // مدت انیمیشن (میلی‌ثانیه)
    autoDismissAfter: 0,       // 0 = دستی / 5000 = بعد ۵ ثانیه خودکار بسته شه
    maxVisible: 1              // چند بنر همزمان نشون داده شه
  },

  /* ---------- لیست بنرها ---------- */
  banners: [

    /* === بنر ۱: اطلاعیه نسخه جدید === */
    {
      id: 'welcome-2026',
      enabled: true,
      priority: 10,
      type: 'info',
      icon: '🎉',                                        // ✅ اضافه شد
      title: 'نسخهتتتتتت جدید منتشر شد!',
      title_en: 'New version released!',
      message: 'قابلیت‌های جدید: تحلیل احساسات، تقویم پیشرفته و مودال زیبا',
      message_en: 'New features: emotion analysis, advanced calendar and beautiful modal',
      cta: 'مشاهده تغییرات',
      cta_en: "See what's new",
      ctaUrl: 'https://github.com/IQZEUS/PO-TREAD/releases',  // ✅ لینک خودت
      dismissible: true,
      showOnce: false,
      colors: {
        bg: '#1c2844',
        border: '#5b8cff',
        text: '#eef3ff',
        ctaBg: '#5b8cff',
        ctaText: '#ffffff'
      }
    },

    /* === بنر ۲: تبلیغ کانال === */
    {
      id: 'promo-channel',
      enabled: false,
      priority: 5,
      type: 'success',
      icon: '💎',                                        // ✅ اضافه شد
      title: 'تحلیل روزانه طلا',
      title_en: 'Daily Gold Analysis',
      message: 'هر روز تحلیل XAUUSD رایگان دریافت کن',
      message_en: 'Get free XAUUSD analysis daily',
      cta: 'عضویت',
      cta_en: 'Join',
      ctaUrl: 'https://t.me/yourchannel',                // ⚠️ اینو با لینک واقعی عوض کن
      dismissible: true,
      showOnce: false,
      colors: {
        bg: '#0f2a20',
        border: '#2ee6a6',
        text: '#eef3ff',
        ctaBg: '#2ee6a6',
        ctaText: '#04170f'
      }
    },

    /* === بنر ۳: هشدار تعمیرات === */
    {
      id: 'maintenance',
      enabled: false,
      priority: 20,
      type: 'warning',
      icon: '⚠️',
      title: 'تعمیرات سرور',
      title_en: 'Server Maintenance',
      message: 'امشب از ساعت ۲ تا ۴ بامداد سرویس در دسترس نیست',
      message_en: 'Service unavailable tonight 2-4 AM',
      cta: '',
      ctaUrl: '',
      dismissible: true,
      showOnce: false,
      colors: {
        bg: '#30220a',
        border: '#ffb020',
        text: '#ffedc8',
        ctaBg: '#ffb020',
        ctaText: '#1a1200'
      }
    }

  ]
};
