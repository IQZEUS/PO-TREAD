<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>PO-TRADE | تریدر حرفه‌ای شو</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;overflow:hidden}
body{
  background:#02030a;color:#eef3ff;
  font-family:'Vazirmatn',system-ui,Tahoma,sans-serif;
  direction:rtl;position:relative;overflow:hidden;
}

/* ============================================================
   BACKGROUND
   ============================================================ */
.bg{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.orb{position:absolute;border-radius:50%;filter:blur(100px);opacity:.55;animation:orbFloat 22s ease-in-out infinite;will-change:transform}
.orb-a{width:520px;height:520px;background:radial-gradient(circle,#2ee6a6 0%,transparent 70%);top:-180px;right:-140px}
.orb-b{width:560px;height:560px;background:radial-gradient(circle,#5b8cff 0%,transparent 70%);bottom:-220px;left:-160px;animation-delay:-7s}
.orb-c{width:420px;height:420px;background:radial-gradient(circle,#ff5fa2 0%,transparent 70%);top:40%;left:50%;opacity:.28;animation-delay:-13s}
@keyframes orbFloat{0%,100%{transform:translate3d(0,0,0) scale(1)}33%{transform:translate3d(40px,-30px,0) scale(1.08)}66%{transform:translate3d(-30px,30px,0) scale(.94)}}

.grid-bg{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(46,230,166,.05) 1px,transparent 1px),
    linear-gradient(90deg,rgba(46,230,166,.05) 1px,transparent 1px);
  background-size:44px 44px;
  mask-image:radial-gradient(ellipse at center,#000 30%,transparent 75%);
  -webkit-mask-image:radial-gradient(ellipse at center,#000 30%,transparent 75%);
  animation:gridShift 25s linear infinite;
}
@keyframes gridShift{0%{background-position:0 0,0 0}100%{background-position:44px 44px,44px 44px}}

/* کندل‌های پس‌زمینه */
.candles-bg{
  position:absolute;left:0;right:0;bottom:8vh;height:200px;
  display:flex;align-items:flex-end;justify-content:space-around;
  padding:0 10px;opacity:.1;pointer-events:none;
}
.candle{
  width:12px;background:linear-gradient(180deg,#2ee6a6,#12b57f);
  border-radius:2px;animation:candleGrow 4s ease-in-out infinite;
  position:relative;
}
.candle.sell{background:linear-gradient(180deg,#ff5fa2,#e0324f)}
.candle::after{
  content:'';position:absolute;left:50%;top:-6px;bottom:-6px;
  width:2px;background:inherit;transform:translateX(-50%);
  border-radius:2px;opacity:.7;
}
@keyframes candleGrow{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.55)}}

/* تیکر */
.ticker{
  position:absolute;top:8%;left:0;white-space:nowrap;
  font-family:'Space Mono',monospace;
  font-size:12px;font-weight:700;
  color:rgba(46,230,166,.25);
  animation:tickerMove 35s linear infinite;
  pointer-events:none;letter-spacing:.5px;
}
.ticker-2{top:85%;color:rgba(91,140,255,.25);animation-delay:-18s}
@keyframes tickerMove{0%{transform:translateX(100vw)}100%{transform:translateX(-100%)}}

/* ذرات */
.particle{position:absolute;width:3px;height:3px;border-radius:50%;box-shadow:0 0 8px currentColor;opacity:0;animation:particleFloat linear infinite;pointer-events:none}
@keyframes particleFloat{0%{transform:translateY(100vh) scale(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-100px) scale(1);opacity:0}}

/* ============================================================
   APP
   ============================================================ */
.app{
  position:relative;z-index:1;
  height:100vh;height:100dvh;
  display:flex;flex-direction:column;
  max-width:500px;margin:0 auto;overflow:hidden;
}

.progress-top{
  flex-shrink:0;
  padding:calc(14px + env(safe-area-inset-top, 0px)) 20px 0;
  display:flex;align-items:center;gap:14px;
}
.progress-track{
  flex:1;height:4px;background:rgba(46,230,166,.1);
  border-radius:99px;overflow:hidden;
}
.progress-fill{
  height:100%;width:0;
  background:linear-gradient(90deg,#2ee6a6,#5b8cff,#c78aff);
  border-radius:99px;
  transition:width .55s cubic-bezier(.2,.9,.3,1.1);
  box-shadow:0 0 12px rgba(46,230,166,.7);
}
.step-counter{
  font-size:11.5px;font-weight:800;color:#8697b8;
  font-family:'Space Mono',monospace;
  direction:ltr;flex-shrink:0;
  padding:4px 10px;border-radius:8px;
  background:rgba(46,230,166,.06);
  border:1px solid rgba(46,230,166,.2);
}
.step-counter strong{color:#2ee6a6;font-weight:900}

.track-wrap{flex:1;overflow:hidden;position:relative}
.track{display:flex;height:100%;transition:transform .55s cubic-bezier(.2,.9,.3,1.1);will-change:transform}

.slide{
  min-width:100%;height:100%;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:20px 26px;text-align:center;position:relative;
}

/* ============================================================
   VISUAL
   ============================================================ */
.visual{
  position:relative;
  width:min(220px, 55vw);
  height:min(220px, 55vw);
  margin-bottom:24px;
  display:grid;place-items:center;
  flex-shrink:0;
}

.ring{position:absolute;border-radius:50%;border:1.5px dashed rgba(46,230,166,.3);animation:spin 22s linear infinite}
.ring-1{inset:0}
.ring-2{inset:16px;border-color:rgba(91,140,255,.3);animation-duration:28s;animation-direction:reverse}
.ring-3{inset:32px;border-color:rgba(255,95,162,.25);animation-duration:34s}
@keyframes spin{to{transform:rotate(360deg)}}

.halo{
  position:absolute;width:260px;height:260px;border-radius:50%;
  background:radial-gradient(circle,rgba(46,230,166,.3),transparent 60%);
  animation:haloPulse 4s ease-in-out infinite;pointer-events:none;
}
@keyframes haloPulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.15);opacity:.9}}

.blob{
  position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(46,230,166,.3),rgba(91,140,255,.25));
  border-radius:42% 58% 63% 37% / 45% 38% 62% 55%;
  animation:blobMorph 8s ease-in-out infinite;
}
.blob-2{
  position:absolute;inset:16px;
  background:linear-gradient(135deg,rgba(214,163,92,.25),rgba(255,95,162,.2));
  border-radius:63% 37% 42% 58% / 55% 62% 38% 45%;
  animation:blobMorph 10s ease-in-out infinite reverse;
}
@keyframes blobMorph{
  0%,100%{border-radius:42% 58% 63% 37% / 45% 38% 62% 55%}
  33%{border-radius:63% 37% 42% 58% / 55% 62% 38% 45%}
  66%{border-radius:50% 50% 45% 55% / 42% 48% 52% 58%}
}

.icon-main{
  position:relative;z-index:3;
  font-size:78px;line-height:1;
  filter:drop-shadow(0 12px 32px rgba(46,230,166,.7));
  animation:iconFloat 4s ease-in-out infinite;
}
@keyframes iconFloat{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-10px) rotate(-3deg)}}

.float-badge{
  position:absolute;
  padding:5px 11px;border-radius:10px;
  font-size:10px;font-weight:900;
  font-family:'Space Mono',monospace;
  background:rgba(3,4,10,.92);
  border:1.5px solid;
  z-index:5;white-space:nowrap;
  animation:badgeFloat 4s ease-in-out infinite;
  direction:ltr;
  box-shadow:0 8px 24px -8px rgba(0,0,0,.7);
}
.float-badge.profit{color:#2ee6a6;border-color:rgba(46,230,166,.5);top:6%;right:-6%}
.float-badge.winrate{color:#5b8cff;border-color:rgba(91,140,255,.5);bottom:14%;left:-8%;animation-delay:-1.3s}
.float-badge.rank{color:#ffb020;border-color:rgba(255,176,32,.5);top:52%;right:-10%;animation-delay:-2.6s}
@keyframes badgeFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

/* ============================================================
   TEXT
   ============================================================ */
.badge{
  display:inline-flex;align-items:center;gap:6px;
  padding:6px 14px;border-radius:999px;
  font-size:10px;font-weight:900;
  margin-bottom:12px;
  background:rgba(46,230,166,.1);
  border:1.5px solid rgba(46,230,166,.4);
  color:#2ee6a6;letter-spacing:.5px;
  animation:fadeUp .5s ease backwards;animation-delay:.1s;
  text-transform:uppercase;
}
.badge::before{
  content:'';width:6px;height:6px;border-radius:50%;
  background:#2ee6a6;box-shadow:0 0 10px #2ee6a6;
  animation:pulse 2s infinite;
}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}

.title{
  font-size:26px;font-weight:900;
  line-height:1.25;margin-bottom:12px;
  letter-spacing:-.5px;
  background:linear-gradient(90deg,#eef3ff 0%,#2ee6a6 40%,#5b8cff 80%,#eef3ff 100%);
  background-size:200% auto;
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;
  animation:fadeUp .5s ease backwards,titleShine 5s linear infinite;
  animation-delay:.2s,0s;
}
@keyframes titleShine{to{background-position:200% center}}
@keyframes fadeUp{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:none}}

.desc{
  font-size:13.5px;color:#9aa8c5;line-height:1.85;
  max-width:340px;margin:0 auto;
  animation:fadeUp .5s ease backwards;animation-delay:.3s;
}
.desc strong{color:#2ee6a6;font-weight:800}
.desc em{color:#5b8cff;font-style:normal;font-weight:800}

/* ============================================================
   QUOTE CARD — اسلاید الهام‌بخش
   ============================================================ */
.quote-card{
  position:relative;
  width:100%;max-width:340px;
  margin-top:16px;
  padding:20px 22px;
  background:linear-gradient(135deg,rgba(46,230,166,.08),rgba(91,140,255,.05));
  border:1px solid rgba(46,230,166,.25);
  border-radius:18px;
  text-align:right;
  animation:fadeUp .6s ease backwards;animation-delay:.5s;
}
.quote-mark{
  position:absolute;
  top:-10px;right:16px;
  font-size:52px;
  color:rgba(46,230,166,.3);
  line-height:1;
  font-family:Georgia,serif;
}
.quote-text{
  font-size:13.5px;
  line-height:1.75;
  color:#c7d3ea;
  font-weight:600;
  position:relative;z-index:1;
  margin-bottom:10px;
}
.quote-text strong{color:#2ee6a6;font-weight:900}
.quote-author{
  font-size:11px;
  color:#8697b8;
  font-weight:700;
  display:flex;align-items:center;gap:6px;
}
.quote-author::before{
  content:'';
  width:24px;height:1.5px;
  background:linear-gradient(90deg,#2ee6a6,transparent);
  border-radius:2px;
}

/* ============================================================
   STATS BAR — اسلاید آمار حرفه‌ای
   ============================================================ */
.live-stats{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;
  width:100%;max-width:340px;
  margin-top:18px;
  animation:fadeUp .6s ease backwards;animation-delay:.4s;
}
.live-stat{
  padding:14px 8px;
  background:linear-gradient(135deg,rgba(46,230,166,.06),rgba(91,140,255,.03));
  border:1px solid rgba(46,230,166,.2);
  border-radius:14px;
  text-align:center;
  position:relative;
  overflow:hidden;
}
.live-stat::before{
  content:'';
  position:absolute;
  top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,#2ee6a6,transparent);
  animation:scanLine 3s linear infinite;
}
@keyframes scanLine{
  0%{transform:translateX(-100%)}
  100%{transform:translateX(100%)}
}
.live-stat .num{
  font-size:17px;font-weight:900;
  background:linear-gradient(90deg,#2ee6a6,#5b8cff);
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;
  font-family:'Space Mono',monospace;
  display:block;margin-bottom:3px;direction:ltr;
}
.live-stat .lbl{
  font-size:9px;font-weight:800;color:#8697b8;
  text-transform:uppercase;letter-spacing:.5px;
}

/* ============================================================
   FEATURES LIST — لیست ویژگی‌ها
   ============================================================ */
.features{
  display:flex;flex-direction:column;gap:8px;
  margin-top:16px;width:100%;max-width:340px;
  animation:fadeUp .5s ease backwards;animation-delay:.4s;
}
.feature{
  display:flex;align-items:center;gap:11px;
  padding:11px 13px;
  background:linear-gradient(135deg,rgba(46,230,166,.06),rgba(91,140,255,.03));
  border:1px solid rgba(46,230,166,.18);
  border-radius:13px;text-align:right;
  position:relative;overflow:hidden;
}
.feature .f-ico{
  width:34px;height:34px;flex:0 0 34px;
  display:grid;place-items:center;
  border-radius:10px;font-size:16px;
  background:linear-gradient(135deg,rgba(46,230,166,.15),rgba(91,140,255,.12));
  border:1px solid rgba(46,230,166,.3);
}
.feature .f-txt{flex:1;min-width:0}
.feature .f-title{
  font-size:12px;font-weight:800;color:#eef3ff;
  margin-bottom:2px;
}
.feature .f-sub{
  font-size:10px;color:#8697b8;line-height:1.5;
}
.feature .f-sub b{color:#2ee6a6;font-weight:700}

/* بج NEW */
.new-badge{
  position:absolute;top:6px;left:8px;
  padding:2px 7px;border-radius:6px;
  font-size:8.5px;font-weight:900;
  background:linear-gradient(135deg,#ffb020,#d68c00);
  color:#1a1200;letter-spacing:.5px;
  box-shadow:0 4px 12px -4px rgba(255,176,32,.6);
  animation:newPulse 1.5s ease-in-out infinite;
}
@keyframes newPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}

/* ============================================================
   BEFORE/AFTER — مقایسه قبل و بعد
   ============================================================ */
.compare{
  display:grid;
  grid-template-columns:1fr auto 1fr;
  gap:10px;
  width:100%;max-width:340px;
  margin-top:16px;
  align-items:center;
  animation:fadeUp .6s ease backwards;animation-delay:.4s;
}
.compare-box{
  padding:14px 12px;
  border-radius:14px;
  text-align:center;
}
.compare-box.before{
  background:rgba(255,86,116,.08);
  border:1.5px solid rgba(255,86,116,.3);
}
.compare-box.after{
  background:rgba(46,230,166,.08);
  border:1.5px solid rgba(46,230,166,.35);
}
.compare-box .h{
  font-size:9.5px;font-weight:900;
  text-transform:uppercase;
  letter-spacing:1px;
  margin-bottom:8px;
}
.compare-box.before .h{color:#ff95a8}
.compare-box.after .h{color:#2ee6a6}
.compare-box .item{
  font-size:11px;
  color:#c7d3ea;
  font-weight:600;
  line-height:1.9;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:5px;
}
.compare-box .item .dot{
  width:4px;height:4px;border-radius:50%;
  flex-shrink:0;
}
.compare-box.before .item .dot{background:#ff5674}
.compare-box.after .item .dot{background:#2ee6a6}
.compare-arrow{
  font-size:22px;
  color:#2ee6a6;
  font-weight:900;
  animation:arrowPulse 2s ease-in-out infinite;
}
@keyframes arrowPulse{
  0%,100%{transform:scale(1);opacity:.7}
  50%{transform:scale(1.2);opacity:1}
}

/* چک‌لیست دمو */
.demo-checklist{
  display:flex;flex-direction:column;gap:6px;
  margin-top:14px;width:100%;max-width:340px;
  animation:fadeUp .5s ease backwards;animation-delay:.4s;
}
.cl-row-demo{
  display:flex;align-items:center;gap:10px;
  padding:10px 12px;
  background:linear-gradient(135deg,rgba(46,230,166,.08),rgba(91,140,255,.03));
  border:1px solid rgba(46,230,166,.2);
  border-radius:11px;text-align:right;
  animation:checkIn .5s ease backwards;
}
.cl-row-demo:nth-child(1){animation-delay:.5s}
.cl-row-demo:nth-child(2){animation-delay:.65s}
.cl-row-demo:nth-child(3){animation-delay:.8s}
.cl-row-demo:nth-child(4){animation-delay:.95s}
@keyframes checkIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:none}}
.cl-check{
  width:20px;height:20px;flex:0 0 20px;
  border-radius:6px;
  background:linear-gradient(135deg,#2ee6a6,#12b57f);
  display:grid;place-items:center;
  font-size:12px;font-weight:900;color:#04170f;
  box-shadow:0 4px 12px -4px rgba(46,230,166,.6);
}
.cl-text-demo{
  font-size:11.5px;color:#c7d3ea;font-weight:600;
  flex:1;
}

/* ============================================================
   BOTTOM
   ============================================================ */
.bottom{
  flex-shrink:0;
  padding:16px 24px calc(22px + env(safe-area-inset-bottom, 0px));
  display:flex;flex-direction:column;gap:12px;
}

.dots-row{display:flex;align-items:center;justify-content:center;gap:7px}
.dot{
  width:8px;height:8px;border-radius:999px;
  background:rgba(120,150,200,.25);
  transition:all .4s cubic-bezier(.2,.9,.3,1.1);
  cursor:pointer;flex-shrink:0;border:0;padding:0;
}
.dot.on{
  width:26px;
  background:linear-gradient(90deg,#2ee6a6,#5b8cff);
  box-shadow:0 0 14px rgba(46,230,166,.7);
}
.dot:hover:not(.on){background:rgba(120,150,200,.5)}

.buttons-row{display:flex;gap:10px}
.btn-skip{
  flex:0 0 auto;
  padding:14px 18px;border-radius:14px;
  border:1.5px solid rgba(120,150,200,.2);
  background:rgba(120,150,200,.05);
  color:#8697b8;font:inherit;font-size:12.5px;font-weight:800;
  cursor:pointer;transition:all .22s;
}
.btn-skip:hover{background:rgba(120,150,200,.12);border-color:rgba(120,150,200,.35);color:#eef3ff}
.btn-skip:active{transform:scale(.97)}

.btn-next{
  flex:1;
  display:inline-flex;align-items:center;justify-content:center;gap:10px;
  padding:15px 26px;border-radius:14px;border:0;
  background:linear-gradient(135deg,#2ee6a6,#12b57f);
  color:#04170f;font:inherit;font-size:14px;font-weight:900;
  cursor:pointer;
  box-shadow:0 15px 40px -14px rgba(46,230,166,.85);
  transition:all .25s cubic-bezier(.2,.9,.3,1.1);
  position:relative;overflow:hidden;
}
.btn-next::before{
  content:'';position:absolute;top:0;left:-100%;
  width:100%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);
  transition:left .6s;
}
.btn-next:hover::before{left:100%}
.btn-next:hover{transform:translateY(-2px);box-shadow:0 22px 50px -14px rgba(46,230,166,1)}
.btn-next:active{transform:translateY(0) scale(.98)}
.btn-next.finish{
  background:linear-gradient(135deg,#e2b06f,#d6a35c);
  box-shadow:0 15px 40px -14px rgba(214,163,92,.85);
}
.btn-next.finish:hover{box-shadow:0 22px 50px -14px rgba(214,163,92,1)}

.btn-next .arrow{display:inline-block;transition:transform .25s}
.btn-next:hover .arrow{transform:translateX(-5px)}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width:380px){
  .visual{width:165px;height:165px;margin-bottom:18px}
  .icon-main{font-size:60px}
  .title{font-size:21px}
  .desc{font-size:12px}
  .halo{width:190px;height:190px}
  .float-badge{font-size:9px;padding:4px 9px}
  .feature{padding:9px 11px}
  .feature .f-ico{width:30px;height:30px;flex:0 0 30px;font-size:14px}
  .live-stat .num{font-size:15px}
  .compare-box{padding:11px 8px}
  .compare-box .item{font-size:10px}
}
@media (min-height:820px){
  .visual{width:230px;height:230px;margin-bottom:32px}
  .icon-main{font-size:84px}
  .title{font-size:28px}
  .desc{font-size:14.5px}
  .halo{width:280px;height:280px}
}
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{
    animation-duration:.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.01ms !important;
  }
}
</style>
</head>
<body>

<div class="bg" id="bg">
  <div class="orb orb-a"></div>
  <div class="orb orb-b"></div>
  <div class="orb orb-c"></div>
  <div class="grid-bg"></div>

  <div class="candles-bg">
    <div class="candle" style="height:40%"></div>
    <div class="candle sell" style="height:65%"></div>
    <div class="candle" style="height:35%"></div>
    <div class="candle" style="height:80%"></div>
    <div class="candle sell" style="height:55%"></div>
    <div class="candle" style="height:90%"></div>
    <div class="candle" style="height:70%"></div>
    <div class="candle sell" style="height:50%"></div>
    <div class="candle" style="height:75%"></div>
    <div class="candle" style="height:60%"></div>
  </div>

  <div class="ticker">XAUUSD ▸ 2,658.42 <span style="color:#2ee6a6">▲ +1.24%</span> &nbsp;&nbsp; EURUSD ▸ 1.0876 <span style="color:#ff5fa2">▼ −0.32%</span> &nbsp;&nbsp; BTCUSD ▸ 62,341 <span style="color:#2ee6a6">▲ +2.15%</span> &nbsp;&nbsp; NAS100 ▸ 18,442 <span style="color:#2ee6a6">▲ +0.87%</span> &nbsp;&nbsp; GBPJPY ▸ 189.24 <span style="color:#ff5fa2">▼ −0.45%</span></div>
  <div class="ticker ticker-2">WIN RATE 68% &nbsp;•&nbsp; PROFIT FACTOR 2.4 &nbsp;•&nbsp; 342 TRADES LOGGED &nbsp;•&nbsp; AVG R 1.8R &nbsp;•&nbsp; MAX DD 4.2% &nbsp;•&nbsp; EXPECTANCY +$142</div>
</div>

<div class="app">

  <div class="progress-top">
    <div class="progress-track">
      <div class="progress-fill" id="progressFill"></div>
    </div>
    <div class="step-counter">
      <strong id="stepCur">1</strong>/<span id="stepTot">7</span>
    </div>
  </div>

  <div class="track-wrap">
    <div class="track" id="track">

      <!-- === SLIDE 1: WHY === -->
      <div class="slide">
        <div class="visual">
          <div class="halo"></div>
          <div class="ring ring-1"></div>
          <div class="ring ring-2"></div>
          <div class="ring ring-3"></div>
          <div class="blob"></div>
          <div class="blob-2"></div>
          <div class="float-badge profit">▲ +240%</div>
          <div class="float-badge winrate">★★★</div>
          <div class="float-badge rank">TOP 1%</div>
          <div class="icon-main">🎯</div>
        </div>
        <div class="badge">🔥 چرا ۹۰٪ تریدرها ضرر می‌کنن؟</div>
        <h2 class="title">چون هیچ‌وقت معاملاتشون رو یادداشت نمی‌کنن!</h2>
        <p class="desc">
          تریدرهای حرفه‌ای <strong>روزی ۲ ساعت</strong> صرف ژورنال‌نویسی می‌کنن. چون بدون داده، فقط <em>حدس</em> می‌زنی — نه ترید.
        </p>
        <div class="quote-card">
          <span class="quote-mark">"</span>
          <div class="quote-text">
            بهترین تریدرها <strong>بهترین ژورنال‌نویس‌ها</strong> هستن. معامله بدون ثبت، مثل رانندگی بدون آینه‌ست.
          </div>
          <div class="quote-author">پل تودور جونز · افسانه وال استریت</div>
        </div>
      </div>

      <!-- === SLIDE 2: TRANSFORMATION === -->
      <div class="slide">
        <div class="visual">
          <div class="halo"></div>
          <div class="ring ring-1"></div>
          <div class="ring ring-2"></div>
          <div class="ring ring-3"></div>
          <div class="blob"></div>
          <div class="blob-2"></div>
          <div class="float-badge profit">+۱۸۰٪</div>
          <div class="float-badge winrate">WR ↑</div>
          <div class="float-badge rank">PRO</div>
          <div class="icon-main">⚡</div>
        </div>
        <div class="badge">🚀 ترنسفورمیشن</div>
        <h2 class="title">از تریدر شلخته به تریدر سیستماتیک</h2>
        <p class="desc">
          پلتفرم ما مسیر <strong>حرفه‌ای شدن</strong> رو برات هموار می‌کنه. هر معامله یه درسه، هر درس یه قدم جلوتر.
        </p>
        <div class="compare">
          <div class="compare-box before">
            <div class="h">❌ قبل</div>
            <div class="item"><span class="dot"></span>معامله تصادفی</div>
            <div class="item"><span class="dot"></span>بدون آمار</div>
            <div class="item"><span class="dot"></span>تکرار اشتباه</div>
          </div>
          <div class="compare-arrow">←</div>
          <div class="compare-box after">
            <div class="h">✅ بعد</div>
            <div class="item"><span class="dot"></span>استراتژی روشن</div>
            <div class="item"><span class="dot"></span>داده‌محور</div>
            <div class="item"><span class="dot"></span>پیشرفت پیوسته</div>
          </div>
        </div>
      </div>

      <!-- === SLIDE 3: LOG === -->
      <div class="slide">
        <div class="visual">
          <div class="halo"></div>
          <div class="ring ring-1"></div>
          <div class="ring ring-2"></div>
          <div class="ring ring-3"></div>
          <div class="blob"></div>
          <div class="blob-2"></div>
          <div class="float-badge profit">XAUUSD</div>
          <div class="float-badge winrate">BUY</div>
          <div class="float-badge rank">+۲.۵R</div>
          <div class="icon-main">✍️</div>
        </div>
        <div class="badge">📝 ثبت هوشمند</div>
        <h2 class="title">هر معامله رو در ۳۰ ثانیه ثبت کن</h2>
        <p class="desc">
          نماد، جهت، نتیجه، <em>اسکرین‌شات چارت</em>، حالت روحی و چک‌لیست — یه فرم سریع، تمیز، حرفه‌ای.
        </p>
        <div class="features">
          <div class="feature">
            <div class="f-ico">📸</div>
            <div class="f-txt">
              <div class="f-title">اسکرین‌شات چارت</div>
              <div class="f-sub">هر معامله + <b>تصویرش</b> — برای مرور آینده</div>
            </div>
          </div>
          <div class="feature">
            <div class="f-ico">🧠</div>
            <div class="f-txt">
              <div class="f-title">ردیابی احساسات</div>
              <div class="f-sub">طمع، ترس، FOMO — <b>احساست رو بشناس</b></div>
            </div>
          </div>
        </div>
      </div>

      <!-- === SLIDE 4: CHECKLIST === -->
      <div class="slide">
        <div class="visual">
          <div class="halo"></div>
          <div class="ring ring-1"></div>
          <div class="ring ring-2"></div>
          <div class="ring ring-3"></div>
          <div class="blob"></div>
          <div class="blob-2"></div>
          <div class="float-badge profit">✓ SAVED</div>
          <div class="float-badge winrate">CUSTOM</div>
          <div class="float-badge rank">★ NEW</div>
          <div class="icon-main">✅</div>
        </div>
        <div class="badge">🎯 جدید — چک‌لیست اختصاصی</div>
        <h2 class="title">قوانین معاملاتیت رو خودت بنویس</h2>
        <p class="desc">
          از تنظیمات، <strong>چک‌لیست شخصی خودت</strong> رو بساز. هر تریدر قوانین خودش رو داره — تو هم مالک استراتژی خودت باش.
        </p>
        <div class="demo-checklist">
          <div class="cl-row-demo">
            <span class="cl-check">✓</span>
            <span class="cl-text-demo">ستاپ تأیید شد</span>
          </div>
          <div class="cl-row-demo">
            <span class="cl-check">✓</span>
            <span class="cl-text-demo">حد ضرر مشخص شد</span>
          </div>
          <div class="cl-row-demo">
            <span class="cl-check">✓</span>
            <span class="cl-text-demo">حجم مناسب بود</span>
          </div>
          <div class="cl-row-demo">
            <span class="cl-check">✓</span>
            <span class="cl-text-demo">طبق پلن پیش رفتم</span>
          </div>
        </div>
      </div>

      <!-- === SLIDE 5: ANALYTICS === -->
      <div class="slide">
        <div class="visual">
          <div class="halo"></div>
          <div class="ring ring-1"></div>
          <div class="ring ring-2"></div>
          <div class="ring ring-3"></div>
          <div class="blob"></div>
          <div class="blob-2"></div>
          <div class="float-badge profit">PF 2.4</div>
          <div class="float-badge winrate">+۱.۸R</div>
          <div class="float-badge rank">۶۸٪ WR</div>
          <div class="icon-main">📊</div>
        </div>
        <div class="badge">📈 آنالیز هوشمند</div>
        <h2 class="title">اعداد دروغ نمی‌گن</h2>
        <p class="desc">
          منحنی رشد سرمایه، <em>Profit Factor</em>، وین‌ریت، Expectancy و افت سرمایه — همه محاسبه خودکار.
        </p>
        <div class="live-stats">
          <div class="live-stat">
            <span class="num">2.4</span>
            <span class="lbl">Profit Factor</span>
          </div>
          <div class="live-stat">
            <span class="num">68%</span>
            <span class="lbl">Win Rate</span>
          </div>
          <div class="live-stat">
            <span class="num">+1.8R</span>
            <span class="lbl">Avg R</span>
          </div>
        </div>
        <div class="features">
          <div class="feature">
            <div class="f-ico">🎯</div>
            <div class="f-txt">
              <div class="f-title">مقایسه استراتژی‌ها</div>
              <div class="f-sub">ببین <b>کدوم استراتژی سوددهه</b> و کدوم نه</div>
            </div>
          </div>
        </div>
      </div>

      <!-- === SLIDE 6: CALENDAR + GOALS === -->
      <div class="slide">
        <div class="visual">
          <div class="halo"></div>
          <div class="ring ring-1"></div>
          <div class="ring ring-2"></div>
          <div class="ring ring-3"></div>
          <div class="blob"></div>
          <div class="blob-2"></div>
          <div class="float-badge profit">+۵ روز سبز</div>
          <div class="float-badge winrate">۷۸٪ هدف</div>
          <div class="float-badge rank">DD 4.2%</div>
          <div class="icon-main">🏆</div>
        </div>
        <div class="badge">⚔️ انضباط = سود</div>
        <h2 class="title">هدف بذار، رعایت کن، برنده شو</h2>
        <p class="desc">
          تقویم بصری + اهداف هفتگی + <strong>قوانین پراپ فرم</strong> — تا هیچ‌وقت از چارچوب خارج نشی.
        </p>
        <div class="features">
          <div class="feature">
            <div class="f-ico">📅</div>
            <div class="f-txt">
              <div class="f-title">تقویم رنگی</div>
              <div class="f-sub">الگوها رو در <b>یک نگاه</b> ببین</div>
            </div>
          </div>
          <div class="feature">
            <div class="f-ico">💥</div>
            <div class="f-txt">
              <div class="f-title">هشدار ریسک</div>
              <div class="f-sub">اخطار خودکار در <b>۸۰٪ حد ضرر</b></div>
            </div>
          </div>
        </div>
      </div>

      <!-- === SLIDE 7: READY === -->
      <div class="slide">
        <div class="visual">
          <div class="halo"></div>
          <div class="ring ring-1"></div>
          <div class="ring ring-2"></div>
          <div class="ring ring-3"></div>
          <div class="blob"></div>
          <div class="blob-2"></div>
          <div class="float-badge profit">☁️ SYNCED</div>
          <div class="float-badge winrate">🔐 SECURE</div>
          <div class="float-badge rank">⚡ FAST</div>
          <div class="icon-main">🚀</div>
        </div>
        <div class="badge">🎉 آماده‌ای برای پرواز</div>
        <h2 class="title">حالا وقتشه شروع کنی!</h2>
        <p class="desc">
          معاملاتت روی <strong>همه دستگاه‌ها همگام</strong> می‌شن، حسابت با ایمیل محافظت می‌شه و سرعت بالاست.
        </p>
        <div class="quote-card">
          <span class="quote-mark">"</span>
          <div class="quote-text">
            موفقیت در ترید <strong>۱۰٪ استراتژی</strong> و <strong>۹۰٪ روانشناسی و انضباطه</strong>. امروز قدم اول رو بردار.
          </div>
          <div class="quote-author">مارک داگلاس · نویسنده «تریدر منظم»</div>
        </div>
        <div class="live-stats">
          <div class="live-stat">
            <span class="num">☁️</span>
            <span class="lbl">همگام</span>
          </div>
          <div class="live-stat">
            <span class="num">🔐</span>
            <span class="lbl">امن</span>
          </div>
          <div class="live-stat">
            <span class="num">⚡</span>
            <span class="lbl">سریع</span>
          </div>
        </div>
      </div>

    </div>
  </div>

  <div class="bottom">
    <div class="dots-row" id="dotsRow"></div>
    <div class="buttons-row">
      <button class="btn-skip" id="skipBtn">رد کردن</button>
      <button class="btn-next" id="nextBtn">
        <span class="label">بعدی</span>
        <span class="arrow">←</span>
      </button>
    </div>
  </div>

</div>

<script>
(function(){
  'use strict';

  var track       = document.getElementById('track');
  var slides      = track.querySelectorAll('.slide');
  var dotsRow     = document.getElementById('dotsRow');
  var nextBtn     = document.getElementById('nextBtn');
  var nextLabel   = nextBtn.querySelector('.label');
  var nextArrow   = nextBtn.querySelector('.arrow');
  var skipBtn     = document.getElementById('skipBtn');
  var progressFill= document.getElementById('progressFill');
  var stepCur     = document.getElementById('stepCur');
  var stepTot     = document.getElementById('stepTot');
  var bg          = document.getElementById('bg');

  var total   = slides.length;
  var current = 0;
  var isAnimating = false;

  stepTot.textContent = total;

  (function createParticles(){
    var colors = ['#2ee6a6', '#5b8cff', '#ff5fa2', '#c78aff'];
    for (var i = 0; i < 25; i++) {
      var p = document.createElement('span');
      p.className = 'particle';
      p.style.left = (Math.random() * 100) + '%';
      p.style.color = colors[Math.floor(Math.random() * colors.length)];
      p.style.background = 'currentColor';
      p.style.animationDuration = (8 + Math.random() * 12) + 's';
      p.style.animationDelay = (-Math.random() * 20) + 's';
      p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
      bg.appendChild(p);
    }
  })();

  for (var i = 0; i < total; i++) {
    (function(idx){
      var dot = document.createElement('button');
      dot.className = 'dot' + (idx === 0 ? ' on' : '');
      dot.setAttribute('data-index', idx);
      dot.setAttribute('aria-label', 'اسلاید ' + (idx + 1));
      dot.addEventListener('click', function(){ goTo(idx); });
      dotsRow.appendChild(dot);
    })(i);
  }
  var dots = dotsRow.querySelectorAll('.dot');

  function goTo(index){
    if (index < 0) index = 0;
    if (index >= total) index = total - 1;
    if (isAnimating || index === current) return;

    isAnimating = true;
    current = index;

    track.style.transform = 'translateX(' + (current * 100) + '%)';

    dots.forEach(function(d, i){
      d.classList.toggle('on', i === current);
    });

    var progress = ((current + 1) / total) * 100;
    progressFill.style.width = progress + '%';
    stepCur.textContent = current + 1;

    if (current === total - 1) {
      nextLabel.textContent = 'شروع کن!';
      nextArrow.textContent = '🚀';
      nextBtn.classList.add('finish');
      skipBtn.style.opacity = '0';
      skipBtn.style.pointerEvents = 'none';
    } else {
      nextLabel.textContent = 'بعدی';
      nextArrow.textContent = '←';
      nextBtn.classList.remove('finish');
      skipBtn.style.opacity = '1';
      skipBtn.style.pointerEvents = '';
    }

    setTimeout(function(){ isAnimating = false; }, 600);
  }

  nextBtn.addEventListener('click', function(){
    if (current < total - 1) {
      goTo(current + 1);
    } else {
      finishOnboarding();
    }
  });

  skipBtn.addEventListener('click', function(){
    finishOnboarding();
  });

  var startX = 0, startY = 0, isDragging = false;
  var SWIPE_THRESHOLD = 50;

  track.addEventListener('touchstart', function(e){
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
  }, { passive: true });

  track.addEventListener('touchmove', function(e){
    if (!isDragging) return;
    var dx = e.touches[0].clientX - startX;
    var dy = e.touches[0].clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      e.preventDefault();
    }
  }, { passive: false });

  track.addEventListener('touchend', function(e){
    if (!isDragging) return;
    isDragging = false;

    var touch = e.changedTouches[0];
    var dx = touch.clientX - startX;
    var dy = touch.clientY - startY;

    if (Math.abs(dx) < Math.abs(dy)) return;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;

    if (dx > 0) {
      if (current < total - 1) goTo(current + 1);
    } else {
      if (current > 0) goTo(current - 1);
    }
  }, { passive: true });

  document.addEventListener('keydown', function(e){
    if (e.key === 'ArrowLeft') {
      if (current < total - 1) goTo(current + 1);
    } else if (e.key === 'ArrowRight') {
      if (current > 0) goTo(current - 1);
    } else if (e.key === 'Escape') {
      finishOnboarding();
    }
  });

  function finishOnboarding(){
    try {
      localStorage.setItem('po.onboarding.v1', 'seen');
    } catch(e){}
    window.location.replace('index.html');
  }

  goTo(0);

})();
</script>
</body>
</html>
