/* ============================================================
   PO-TRADE Banner Config v2
   با پشتیبانی عکس
   ============================================================ */

window.PT_BANNER_CONFIG = {

  /* ---------- تنظیمات کلی ---------- */
  settings: {
    cacheMinutes: 30,
    maxVisible: 3,
    autoDismissAfter: 0
  },

  /* ---------- لیست بنرها ---------- */
  banners: [

    /* === بنر ۱: با عکس پس‌زمینه === */
    {
      id: 'welcome-2026',
      enabled: true,
      priority: 10,
      maxShows: -1,
      icon: '🎉',

      title: 'نسخه جدید منتشر شد!',
      title_en: 'New version released!',
      message: 'قابلیت‌های جدید: تحلیل احساسات، تقویم پیشرفته و مودال زیبا',
      message_en: 'New features: emotion analysis, advanced calendar and beautiful modal',

      cta: 'مشاهده تغییرات',
      cta_en: "See what's new",
      ctaUrl: 'https://github.com/IQZEUS/PO-TREAD/releases',

      /* --- عکس --- */
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
      imagePosition: 'background',        // background | left | right | top
      imageOverlay: 0.6,                  // تاریکی روی عکس (0 = بدون، 1 = کامل)

      dismissible: true,
      size: 'large',                      // small | medium | large

      colors: {
        border: 'rgba(214, 163, 92, 0.5)',
        ctaBg: '#d6a35c',
        ctaText: '#14140f'
      }
    },

    /* === بنر ۲: با عکس کنار متن === */
    {
      id: 'promo-channel',
      enabled: false,
      priority: 5,
      maxShows: 5,
      icon: '💎',

      title: 'تحلیل روزانه طلا',
      title_en: 'Daily Gold Analysis',
      message: 'هر روز تحلیل XAUUSD رایگان دریافت کن — سیگنال‌های دقیق و به‌روز',
      message_en: 'Get free XAUUSD analysis daily — precise and up-to-date signals',

      cta: 'عضویت در کانال',
      cta_en: 'Join Channel',
      ctaUrl: 'https://t.me/yourchannel',

      /* --- عکس کنار متن --- */
      image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=400&fit=crop',
      imagePosition: 'left',              // کنار متن، سمت چپ
      imageOverlay: 0,

      dismissible: true,
      size: 'large',

      colors: {
        border: 'rgba(46, 230, 166, 0.4)',
        ctaBg: '#2ee6a6',
        ctaText: '#04170f'
      }
    },

    /* === بنر ۳: هشدار ساده (بدون عکس) === */
    {
      id: 'maintenance',
      enabled: false,
      priority: 20,
      maxShows: -1,
      icon: '⚠️',

      title: 'تعمیرات سرور',
      title_en: 'Server Maintenance',
      message: 'امشب از ساعت ۲ تا ۴ بامداد سرویس در دسترس نیست',
      message_en: 'Service unavailable tonight 2-4 AM',

      cta: '',
      ctaUrl: '',

      image: '',                          // ← بدون عکس
      dismissible: true,
      size: 'medium',

      colors: {
        border: 'rgba(255, 176, 32, 0.5)',
        ctaBg: '#ffb020',
        ctaText: '#1a1200'
      }
    }

  ]
};
