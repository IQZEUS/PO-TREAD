/* ============================================================
   PO-TRADE Banner Config
   آخرین بروزرسانی: 2026-09-19
   ============================================================ */

window.PT_BANNER_CONFIG = {

  settings: {
    maxVisible: 3,
    autoDismissAfter: 10
  },

  banners: [

    /* === بنر 1 === */
    {
      id: "welcome-2026",
      enabled: true,
      priority: 10,
      maxShows: 1,
      icon: "🎉",
      title: "نسخه جدید منتشر شد!",
      title_en: "New version released!",
      message: "قابلیت‌های جدید: تحلیل احساسات، تقویم پیشرفته و مودال زیبا",
      message_en: "New features: emotion analysis, advanced calendar and beautiful modal",
      cta: "مشاهده تغییرات",
      cta_en: "See what's new",
      ctaUrl: "https://github.com/IQZEUS/PO-TREAD/releases",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
      dismissible: false,
      size: "large",
      colors: {
        border: "rgba(214, 163, 92, 0.5)",
        ctaBg: "#d6a35c",
        ctaText: "#14140f"
      }
    },

    /* === بنر 2 === */
    {
      id: "promo-channel",
      enabled: false,
      priority: 5,
      maxShows: -1,
      icon: "💎",
      title: "تحلیل روزانه طلابییییییی",
      title_en: "Daily Gold Analysis",
      message: "هر روز تحلیل XAUUSD رایگان دریافت کن — سیگنال‌های دقیق و به‌روز",
      message_en: "Get free XAUUSD analysis daily — precise and up-to-date signals",
      cta: "عضویت در کانال",
      cta_en: "Join Channel",
      ctaUrl: "https://github.com/IQZEUS/PO-TREAD/blob/main/index.html",
      image: "https://shut.ir/storage/image/2025/10/19/%D8%B9%DA%A9%D8%B3-%D8%B9%D9%82%D8%A7%D8%A8-%D8%A8%D8%A7-%DA%A9%DB%8C%D9%81%DB%8C%D8%AA-4k.webp",
      imagePosition: "left",
      imageOverlay: 0,
      dismissible: true,
      size: "large",
      colors: {
        border: "rgba(46, 230, 166, 0.4)",
        ctaBg: "#2ee6a6",
        ctaText: "#04170f"
      }
    },

    /* === بنر 3 === */
    {
      id: "maintenance",
      enabled: true,
      priority: 20,
      maxShows: 10,
      icon: "⚠️",
      title: "درحال بروزرسانی ",
      title_en: "Server Maintenance",
      message: "امکانات جدید در راه است ",
      message_en: "Service unavailable tonight 2-4 AM",
      cta: "",
      ctaUrl: "",
      image: "https://www.beytoote.com/images/stories/fun/profile-pictures02-7.jpg",
      dismissible: false,
      size: "medium",
      colors: {
        border: "rgba(255, 176, 32, 0.5)",
        ctaBg: "#ffb020",
        ctaText: "#1a1200"
      }
    },

    /* === بنر 4 === */
    {
      id: "banner-bjcccp",
      enabled: false,
      priority: 5,
      maxShows: 5,
      icon: "✨",
      title: "بنر جدید",
      title_en: "New Banner",
      message: "متن پیام رو اینجا بنویس",
      message_en: "Write your message here",
      cta: "مشاهده",
      cta_en: "View",
      ctaUrl: "https://github.com/IQZEUS/PO-TREAD",
      dismissible: false,
      size: "large",
      colors: {
        border: "rgba(214, 163, 92, 0.4)",
        ctaBg: "#d6a35c",
        ctaText: "#14140f"
      }
    }

  ]
};
