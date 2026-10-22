/* PO-TRADE PRISM — market pulse, portfolio preferences, charts and shareable report.
   The application is a journal only: it never places trades or connects to a broker. */
(function () {
  'use strict';
  const PORTFOLIO_KEY = 'po.v4.portfolio';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const basePortfolio = { label: 'Main account', currency: 'USD', startingBalance: 0, watchlist: ['crypto', 'forex', 'metals'] };
  let activeLanguage = 'fa';
  let cachedTrades = [];

  function safeJson(s, fallback) { try { const v = JSON.parse(s); return v == null ? fallback : v; } catch (_) { return fallback; } }
  function config() {
    const c = safeJson(localStorage.getItem(PORTFOLIO_KEY), {});
    return {
      ...basePortfolio,
      ...c,
      currency: ['USD', 'EUR', 'GBP', 'AED', 'IRR'].includes(c.currency) ? c.currency : 'USD',
      startingBalance: Math.max(0, Number(c.startingBalance) || 0),
      watchlist: Array.isArray(c.watchlist) ? c.watchlist.filter(x => ['crypto','forex','metals','indices','stocks'].includes(x)) : basePortfolio.watchlist.slice()
    };
  }
  function language() { return String(document.documentElement.lang || 'fa').slice(0, 2) === 'en' ? 'en' : 'fa'; }
  function translateNodes() {
    activeLanguage = language();
    $$('[data-fa][data-en]').forEach(node => {
      const v = node.getAttribute(activeLanguage === 'en' ? 'data-en' : 'data-fa');
      if (v != null) node.textContent = v;
    });
    $$('[data-fa-ph][data-en-ph]').forEach(node => {
      node.placeholder = node.getAttribute(activeLanguage === 'en' ? 'data-en-ph' : 'data-fa-ph') || '';
    });
    const currencySelect = $('#prism-account-currency-select');
    if (currencySelect) {
      const labels = activeLanguage === 'en' ? {USD:'USD · US dollar',EUR:'EUR · Euro',GBP:'GBP · Pound sterling',AED:'AED · UAE dirham',IRR:'IRR · Iranian rial'} : {USD:'USD · دلار آمریکا',EUR:'EUR · یورو',GBP:'GBP · پوند',AED:'AED · درهم',IRR:'IRR · ریال'};
      Array.from(currencySelect.options).forEach(o => { if (labels[o.value]) o.textContent = labels[o.value]; });
    }
  }
  function money(n, cur = config().currency, sign = false) {
    const x = Number(n) || 0, abs = Math.abs(x), dec = cur === 'IRR' ? 0 : 2;
    const val = abs.toLocaleString('en-US', { maximumFractionDigits: dec, minimumFractionDigits: dec === 0 || Math.round(abs * 100) % 100 === 0 ? 0 : 2 });
    const sym = ({USD:'$',EUR:'€',GBP:'£',AED:'د.إ ',IRR:''})[cur] || '$';
    const core = cur === 'IRR' ? val + ' ریال' : sym + val;
    return sign ? (x > 0 ? '+' : x < 0 ? '−' : '') + core : core;
  }
  function readTrades() {
    const raw = safeJson(localStorage.getItem('po.v4.trades'), []);
    return Array.isArray(raw) ? raw.filter(t => t && typeof t === 'object') : [];
  }
  function pnl(t) { const a = Math.abs(Number(t.amount) || 0); return t.result === 'win' ? a : t.result === 'loss' ? -a : 0; }
  function totalPnl(list) { return list.reduce((sum, t) => sum + pnl(t), 0); }
  function inferClass(t) {
    if (['crypto','forex','metals','indices','stocks','other'].includes(t.assetClass)) return t.assetClass;
    const s = String(t.symbol || '').toUpperCase();
    if (/BTC|ETH|SOL|XRP|USDT|BNB|DOGE|ADA|AVAX/.test(s)) return 'crypto';
    if (/^XA[UGS]|SILVER|GOLD|XPT|XPD|OIL/.test(s)) return 'metals';
    if (/NAS|SPX|US30|GER40|UK100|JP225|HK50|AUS200/.test(s)) return 'indices';
    if (/^[A-Z]{6}$/.test(s)) return 'forex';
    return 'other';
  }
  function fmtTime(d = new Date()) { return d.toLocaleTimeString(activeLanguage === 'en' ? 'en-US' : 'fa-IR', { hour: '2-digit', minute: '2-digit' }); }
  function fmtDate(d) { return String(d || '').slice(0, 10); }
  function setText(sel, text) { const n = $(sel); if (n) n.textContent = text; }

  function initPortfolioForm() {
    const form = $('#prism-portfolio-form');
    if (!form) return;
    const c = config();
    $('#prism-account-name').value = c.label || '';
    $('#prism-account-currency-select').value = c.currency;
    $('#prism-starting-capital-input').value = c.startingBalance || '';
    $$('input[name="prism-watch"]').forEach(box => { box.checked = c.watchlist.includes(box.value); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const label = ($('#prism-account-name').value || '').trim().slice(0, 32) || (activeLanguage === 'en' ? 'Main account' : 'حساب اصلی');
      const currency = $('#prism-account-currency-select').value;
      const startingBalance = Number($('#prism-starting-capital-input').value) || 0;
      if (startingBalance < 0 || !Number.isFinite(startingBalance)) {
        status(activeLanguage === 'en' ? 'Starting capital must be 0 or greater.' : 'سرمایه اولیه باید صفر یا بیشتر باشد.', true); return;
      }
      const watchInputs = $$('input[name="prism-watch"]');
      const watchlist = watchInputs.length ? watchInputs.filter(box => box.checked).map(box => box.value) : c.watchlist;
      const next = { label, currency, startingBalance, watchlist: watchlist.length ? watchlist : (c.watchlist || ['crypto']) };
      try {
        localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(next));
        status(activeLanguage === 'en' ? 'Saved — your preferences will sync to your account when cloud sync is online.' : 'ذخیره شد؛ تنظیمات پس از اتصال همگام‌سازی به حساب ابری ارسال می‌شوند.');
        refreshDashboard();
        renderAnalyticsCharts(readTrades());
        const activeRange = $('#range-filter .active');
        if ($('#page-analysis')?.classList.contains('active') && activeRange) activeRange.click();
      } catch (err) {
        status(activeLanguage === 'en' ? 'Could not save preferences on this device.' : 'ذخیره تنظیمات در این دستگاه ممکن نشد.', true);
      }
    });
  }
  function status(message, isError) {
    const node = $('#prism-portfolio-status');
    if (node) { node.textContent = message; node.classList.toggle('error', !!isError); }
  }
  function refreshDashboard() {
    const c = config();
    cachedTrades = readTrades();
    setText('#prism-starting-balance', money(c.startingBalance, c.currency));
    setText('#prism-account-currency', (c.label || (activeLanguage === 'en' ? 'Account' : 'حساب')) + ' · ' + c.currency);
    const p = totalPnl(cachedTrades);
    const pnlNode = $('#prism-total-pnl');
    if (pnlNode) { pnlNode.textContent = money(p, c.currency, true); pnlNode.style.color = p < 0 ? 'var(--pr-bad)' : 'var(--pr-cyan)'; }
    const host = $('#prism-watchlist-chips');
    if (host) {
      const old = $('.prism-watchlist-label', host);
      host.replaceChildren();
      if (old) host.appendChild(old); else { const label = document.createElement('span'); label.className='prism-watchlist-label'; label.textContent = activeLanguage === 'en' ? 'WATCHLIST' : 'دارایی‌های زیرنظر'; host.appendChild(label); }
      const names = activeLanguage === 'en' ? {crypto:'Crypto',forex:'Forex',metals:'Metals',indices:'Indices',stocks:'Stocks'} : {crypto:'رمزارز',forex:'ارزها',metals:'فلزات',indices:'شاخص‌ها',stocks:'سهام'};
      if (!c.watchlist.length) { const n = document.createElement('span'); n.className='prism-watchlist-empty'; n.textContent = activeLanguage === 'en' ? 'Choose markets in settings.' : 'از تنظیمات بازارهای موردعلاقه‌ات را انتخاب کن.'; host.appendChild(n); }
      c.watchlist.forEach(key => { const chip=document.createElement('span');chip.className='prism-watch-chip';const i=document.createElement('i');const t=document.createElement('span');t.textContent=names[key]||key;chip.append(i,t);host.appendChild(chip); });
    }
  }

  function setupCanvas(canvas) {
    if (!canvas) return null;
    const rect=canvas.getBoundingClientRect(); const dpr=Math.min(window.devicePixelRatio||1,2);
    const w=Math.max(260,Math.round(rect.width||canvas.parentElement?.clientWidth||380));
    const h=Math.max(190,Math.round(rect.height||230));
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    const ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); return {ctx,w,h};
  }
  function drawBars(canvas, data) {
    const setup=setupCanvas(canvas); if(!setup) return; const {ctx,w,h}=setup; const color=getComputedStyle(document.documentElement); const good=color.getPropertyValue('--pr-good').trim()||'#43e2b0',bad=color.getPropertyValue('--pr-bad').trim()||'#ff6d91';
    ctx.clearRect(0,0,w,h); ctx.font='10px system-ui,sans-serif'; ctx.textBaseline='middle';
    if(!data.length){ctx.fillStyle='#7180a0';ctx.textAlign='center';ctx.fillText(activeLanguage==='en'?'Log trades to see this chart':'برای نمایش نمودار، معامله ثبت کن',w/2,h/2);return;}
    const pad={l:45,r:10,t:18,b:31}, pw=w-pad.l-pad.r, ph=h-pad.t-pad.b;
    let max=Math.max(...data.map(d=>Math.abs(d.value)),1); max*=1.14; const zero=pad.t+ph/2;
    ctx.strokeStyle='rgba(143,161,217,.12)';ctx.lineWidth=1; for(let i=0;i<5;i++){let y=pad.t+i*ph/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();}
    ctx.strokeStyle='rgba(151,170,227,.32)';ctx.beginPath();ctx.moveTo(pad.l,zero);ctx.lineTo(w-pad.r,zero);ctx.stroke();
    const gap=Math.min(14,pw/data.length*.22), bw=Math.max(4,(pw/data.length)-gap);
    data.forEach((d,i)=>{const x=pad.l+i*(pw/data.length)+(pw/data.length-bw)/2;const bh=Math.max(2,Math.abs(d.value)/max*(ph/2-8));const y=d.value>=0?zero-bh:zero;const grad=ctx.createLinearGradient(0,y,0,y+bh);grad.addColorStop(0,d.value>=0?good:bad);grad.addColorStop(1,d.value>=0?'rgba(56,234,208,.14)':'rgba(255,109,145,.14)');ctx.fillStyle=grad;roundRect(ctx,x,y,bw,bh,5);ctx.fill();if(data.length<=8){ctx.fillStyle='#8493b4';ctx.textAlign='center';ctx.fillText(String(d.label).slice(0,10),x+bw/2,h-11);}});
    ctx.fillStyle='#7182a5';ctx.textAlign='right';ctx.fillText('+'+compact(max),pad.l-6,pad.t+4);ctx.fillText('0',pad.l-6,zero);ctx.fillText('−'+compact(max),pad.l-6,pad.t+ph-2);
  }
  function roundRect(ctx,x,y,w,h,r){const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();}
  function compact(n){const a=Math.abs(Number(n)||0);return a>=1e6?(n/1e6).toFixed(1)+'M':a>=1e3?(n/1e3).toFixed(1)+'K':Number(n).toFixed(0);}
  function renderAnalyticsCharts(filtered, allDays) {
    const list=Array.isArray(filtered)?filtered:readTrades(); const clsNames=activeLanguage==='en'?{crypto:'Crypto',forex:'Forex',metals:'Metals',indices:'Indices',stocks:'Stocks',other:'Other'}:{crypto:'رمزارز',forex:'ارزها',metals:'فلزات',indices:'شاخص‌ها',stocks:'سهام',other:'سایر'};
    const map=new Map(); list.forEach(t=>{const k=inferClass(t);map.set(k,(map.get(k)||0)+pnl(t));});
    const assetRows=Array.from(map.entries()).map(([key,value])=>({label:clsNames[key]||key,value})).sort((a,b)=>b.value-a.value).slice(0,7);
    drawBars($('#prism-asset-chart'),assetRows);
    setText('#prism-asset-chart-foot',list.length ? (activeLanguage==='en'?`${assetRows.length} asset classes in ${list.length} logged trades.`:`${assetRows.length} کلاس دارایی در ${list.length} معامله ثبت‌شده.`) : (activeLanguage==='en'?'Asset comparison appears after your first logged trade.':'مقایسه دارایی‌ها پس از ثبت اولین معامله نمایش داده می‌شود.'));
    const wins=list.filter(t=>t.result==='win').length, losses=list.filter(t=>t.result==='loss').length, be=list.length-wins-losses, closed=wins+losses, wr=closed?wins/closed*100:0;
    setText('#prism-outcome-winrate',closed?Math.round(wr)+'%':'—');
    const total=Math.max(1,list.length), winDeg=wins/total*360, lossDeg=(wins+losses)/total*360;
    const donut=$('#prism-outcome-donut');if(donut)donut.style.background=`conic-gradient(var(--pr-good) 0deg ${winDeg}deg,var(--pr-bad) ${winDeg}deg ${lossDeg}deg,#667899 ${lossDeg}deg 360deg)`;
    const legend=$('#prism-outcome-legend');if(legend){legend.replaceChildren();const items=[{name:activeLanguage==='en'?'Wins':'سود',n:wins,color:'var(--pr-good)'},{name:activeLanguage==='en'?'Losses':'ضرر',n:losses,color:'var(--pr-bad)'},{name:activeLanguage==='en'?'Break-even':'سربه‌سر',n:be,color:'#667899'}];items.forEach(it=>{const row=document.createElement('div');row.className='prism-legend-row';const dot=document.createElement('i');dot.className='prism-legend-dot';dot.style.background=it.color;const name=document.createElement('span');name.textContent=it.name;const count=document.createElement('strong');count.textContent=it.n+' · '+(list.length?Math.round(it.n/total*100):0)+'%';row.append(dot,name,count);legend.append(row);});}
    setText('#prism-outcome-caption',list.length?(activeLanguage==='en'?`${wins} wins · ${losses} losses · ${be} break-even`:`${wins} سود · ${losses} ضرر · ${be} سربه‌سر`):(activeLanguage==='en'?'No logged outcomes yet.':'هنوز نتیجه‌ای ثبت نشده است.'));
    const months=new Map(); list.forEach(t=>{const m=String(t.date||'').slice(0,7);if(!/^\d{4}-\d{2}$/.test(m))return;months.set(m,(months.get(m)||0)+pnl(t));});
    const monthly=Array.from(months.entries()).sort((a,b)=>a[0].localeCompare(b[0])).slice(-12).map(([label,value])=>({label:label.slice(2),value}));
    drawBars($('#prism-monthly-chart'),monthly);
  }

  function createReportCanvas() {
    const c=config(), list=readTrades(), net=totalPnl(list), wins=list.filter(t=>t.result==='win').length, losses=list.filter(t=>t.result==='loss').length, closed=wins+losses, wr=closed?wins/closed*100:0;
    // Social/profile privacy never changes the user's personal export. Only this explicit image option hides capital.
    const hideCapitalControl = $('#prism-share-hide-capital');
    const hideCapital = !!(hideCapitalControl && hideCapitalControl.checked);
    const privateLabel = activeLanguage==='en'?'HIDDEN':'مخفی';
    const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=1740;const ctx=canvas.getContext('2d');
    const bg=ctx.createLinearGradient(0,0,1440,1740);bg.addColorStop(0,'#11182d');bg.addColorStop(.48,'#080c19');bg.addColorStop(1,'#0d1025');ctx.fillStyle=bg;ctx.fillRect(0,0,1440,1740);
    const glow=ctx.createRadialGradient(1180,80,20,1180,80,620);glow.addColorStop(0,'rgba(146,117,255,.26)');glow.addColorStop(1,'rgba(146,117,255,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,1440,880);
    ctx.strokeStyle='rgba(154,178,240,.045)';ctx.lineWidth=1;for(let x=0;x<1440;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1740);ctx.stroke();}for(let y=0;y<1740;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1440,y);ctx.stroke();}
    ctx.direction='ltr';ctx.textAlign='left';ctx.fillStyle='#9d72ff';roundRect(ctx,86,74,62,62,18);ctx.fill();ctx.fillStyle='#110a22';ctx.font='900 27px system-ui';ctx.textAlign='center';ctx.fillText('PO',117,113);ctx.textAlign='left';ctx.fillStyle='#f4f6ff';ctx.font='900 35px system-ui';ctx.fillText('PO-TRADE',172,107);ctx.fillStyle='#8b9bbd';ctx.font='600 15px system-ui';ctx.fillText('TRADER PERFORMANCE REPORT',172,133);
    ctx.fillStyle='#8b9bbd';ctx.font='600 16px system-ui';ctx.fillText((activeLanguage==='en'?'GENERATED ':'ساخته‌شده در ')+new Date().toLocaleString(activeLanguage==='en'?'en-US':'fa-IR'),86,194);
    ctx.textAlign='right';ctx.fillStyle='#8b9bbd';ctx.font='700 15px system-ui';ctx.fillText(activeLanguage==='en'?'PERSONAL JOURNAL':'ژورنال شخصی',1350,194);ctx.textAlign='left';
    ctx.fillStyle='#f3f6ff';ctx.font='900 44px system-ui';ctx.fillText(activeLanguage==='en'?'Performance snapshot':'خلاصه عملکرد معاملاتی',86,272);
    ctx.fillStyle='#91a0c0';ctx.font='500 20px system-ui';ctx.fillText(activeLanguage==='en'?'A visual summary of your own logged journal data.':'گزارش تصویری بر پایه معاملات ثبت‌شده در ژورنال خودت.',86,313);
    const stats=[
      {label:activeLanguage==='en'?'NET P/L':'سود خالص',value:money(net,c.currency,true),color:net<0?'#ff6d91':'#c09bff'},
      {label:activeLanguage==='en'?'TOTAL TRADES':'تعداد معاملات',value:String(list.length),color:'#eaf0ff'},
      {label:activeLanguage==='en'?'WIN RATE':'وین‌ریت',value:closed?wr.toFixed(1)+'%':'—',color:'#d6a0ff'},
      {label:activeLanguage==='en'?'STARTING CAPITAL':'سرمایه اولیه',value:hideCapital?privateLabel:money(c.startingBalance,c.currency),color:'#bd94ff'}
    ];
    const top=370,w=604,h=150,g=28;stats.forEach((st,i)=>{const x=86+(i%2)*(w+g),y=top+Math.floor(i/2)*(h+22);ctx.fillStyle='rgba(255,255,255,.045)';ctx.strokeStyle='rgba(155,174,232,.16)';roundRect(ctx,x,y,w,h,24);ctx.fill();ctx.stroke();ctx.fillStyle='#8d9bbb';ctx.font='800 15px system-ui';ctx.fillText(st.label,x+28,y+37);ctx.fillStyle=st.color;ctx.font='900 36px system-ui';ctx.fillText(st.value,x+28,y+95);});
    const charts=[{id:'equity-chart',title:activeLanguage==='en'?'EQUITY CURVE':'منحنی رشد سرمایه',x:86,y:750,w:1268,h:280},{id:'daily-chart',title:activeLanguage==='en'?'DAILY NET P/L':'سود و ضرر روزانه',x:86,y:1068,w:610,h:278},{id:'prism-monthly-chart',title:activeLanguage==='en'?'MONTHLY MOMENTUM':'مومنتوم ماهانه',x:744,y:1068,w:610,h:278}];
    charts.forEach(ch=>{
      ctx.fillStyle='rgba(255,255,255,.035)';ctx.strokeStyle='rgba(155,174,232,.14)';roundRect(ctx,ch.x,ch.y,ch.w,ch.h,22);ctx.fill();ctx.stroke();
      ctx.fillStyle='#c9d4f0';ctx.font='800 15px system-ui';ctx.fillText(ch.title,ch.x+22,ch.y+29);
      const src=$('#'+ch.id);if(src&&src.width&&src.height){ctx.save();ctx.globalAlpha=.98;ctx.drawImage(src,ch.x+14,ch.y+42,ch.w-28,ch.h-55);ctx.restore();}
    });
    ctx.fillStyle='#7888a9';ctx.font='500 13px system-ui';ctx.fillText(activeLanguage==='en'?'Private journal export · Market price quotes are separate from logged P/L.':'خروجی ژورنال شخصی · قیمت بازار با سود و ضرر ثبت‌شده تفاوت دارد.',86,1410);
    ctx.fillStyle='rgba(255,255,255,.035)';roundRect(ctx,86,1450,1268,190,22);ctx.fill();
    ctx.fillStyle='#8d9bbb';ctx.font='800 14px system-ui';ctx.fillText(activeLanguage==='en'?'JOURNAL NOTES':'یادداشت گزارش',112,1490);
    const tradesText = list.length?`${wins} ${activeLanguage==='en'?'wins':'سود'}  ·  ${losses} ${activeLanguage==='en'?'losses':'ضرر'}  ·  ${list.filter(t=>t.result==='be').length} ${activeLanguage==='en'?'break-even':'سر‌به‌سر'}`:(activeLanguage==='en'?'No trades logged for this report.':'در این گزارش معامله‌ای ثبت نشده است.');
    ctx.fillStyle='#e9efff';ctx.font='600 24px system-ui';ctx.fillText(tradesText,112,1540);
    ctx.fillStyle='#7181a4';ctx.font='500 14px system-ui';ctx.fillText(activeLanguage==='en'?'PO-TRADE · Your data, your progress.':'PO-TRADE · داده‌های تو، مسیر پیشرفت تو.',112,1595);
    ctx.textAlign='right';ctx.fillStyle='#b18aff';ctx.font='900 14px system-ui';ctx.fillText('PRISM / ANALYTICS',1320,1595);ctx.textAlign='left';return canvas;
  }
  async function shareReport() {
    const btn=$('#prism-share-analysis'), statusNode=$('#prism-share-status'); if(!btn)return;
    const original=btn.innerHTML;btn.disabled=true;btn.style.opacity='.65';
    if(statusNode)statusNode.textContent=activeLanguage==='en'?'Preparing your report image…':'در حال ساخت تصویر گزارش…';
    try {
      const canvas=createReportCanvas();const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image export failed')),'image/png',.96));
      const file=new File([blob],'po-trade-report-'+new Date().toISOString().slice(0,10)+'.png',{type:'image/png'});
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
        await navigator.share({files:[file],title:'PO-TRADE · Performance report',text:activeLanguage==='en'?'My trading journal performance snapshot.':'خلاصه تصویری عملکرد ژورنال من.'});
        if(statusNode)statusNode.textContent=activeLanguage==='en'?'Report shared.':'تصویر گزارش برای اشتراک‌گذاری آماده شد.';
      } else {
        const url=URL.createObjectURL(blob);showPreview(url,file.name,statusNode); if(statusNode)statusNode.textContent=activeLanguage==='en'?'Image ready — preview, then save or share it.':'تصویر آماده است؛ پیش‌نمایش را ببین و ذخیره یا اشتراک‌گذاری کن.';
      }
    } catch (err) {
      if(err && err.name==='AbortError'){if(statusNode)statusNode.textContent=activeLanguage==='en'?'Sharing cancelled.':'اشتراک‌گذاری لغو شد.';}
      else if(statusNode)statusNode.textContent=activeLanguage==='en'?'Could not create the image in this browser.':'ساخت تصویر در این مرورگر ممکن نشد.';
    } finally {btn.disabled=false;btn.style.opacity='1';btn.innerHTML=original;translateNodes();}
  }
  function showPreview(url,fileName,statusNode) {
    const old=$('#prism-share-preview');if(old)old.remove();
    const overlay=document.createElement('div');overlay.id='prism-share-preview';overlay.className='prism-share-preview';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
    const modal=document.createElement('div');modal.className='prism-share-modal';
    const head=document.createElement('div');head.className='prism-share-modal-head';const title=document.createElement('strong');title.textContent=activeLanguage==='en'?'Report preview':'پیش‌نمایش گزارش';const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label',activeLanguage==='en'?'Close':'بستن');close.addEventListener('click',()=>{overlay.remove();URL.revokeObjectURL(url);});head.append(title,close);
    const img=document.createElement('img');img.src=url;img.alt=activeLanguage==='en'?'PO-TRADE analytics image':'تصویر آنالیز PO-TRADE';
    const actions=document.createElement('div');actions.className='prism-share-modal-actions';const save=document.createElement('button');save.className='prism-primary-action';save.type='button';save.textContent=activeLanguage==='en'?'Download PNG':'ذخیره تصویر PNG';save.addEventListener('click',()=>{const a=document.createElement('a');a.href=url;a.download=fileName;document.body.appendChild(a);a.click();a.remove();if(statusNode)statusNode.textContent=activeLanguage==='en'?'PNG downloaded.':'تصویر PNG دانلود شد.';});
    const native=document.createElement('button');native.className='prism-glass-action';native.type='button';native.textContent=activeLanguage==='en'?'Open image':'باز کردن تصویر';native.addEventListener('click',()=>window.open(url,'_blank','noopener'));
    actions.append(save,native);modal.append(head,img,actions);overlay.append(modal);overlay.addEventListener('click',e=>{if(e.target===overlay){overlay.remove();URL.revokeObjectURL(url);}});document.body.appendChild(overlay);
  }

  function setupAssetForm() {
    const category=$('#f-asset-class'), symbol=$('#f-symbol');if(!category||!symbol)return;
    const sets={
      forex:['EURUSD','GBPUSD','USDJPY','USDCHF','USDCAD','AUDUSD','NZDUSD','EURGBP','EURJPY','GBPJPY'],
      crypto:['BTCUSD','ETHUSD','SOLUSD','BNBUSD','XRPUSD','ADAUSD','DOGEUSD','AVAXUSD','DOTUSD','LINKUSD','LTCUSD','TRXUSD'],
      metals:['XAUUSD','XAGUSD','XPTUSD','XPDUSD','USOIL','UKOIL','NGAS'],
      indices:['NAS100','SPX500','US30','GER40','UK100','JP225','HK50','AUS200','US2000'],
      stocks:['AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA'],
      other:[]
    };
    function updateList(){const list=$('#dl-symbols');if(!list)return;const current=sets[category.value]||[];const all=Array.from(new Set(current.concat(sets.other)));list.innerHTML=all.map(s=>'<option value="'+s+'"></option>').join('');symbol.placeholder=category.value==='crypto'?'BTCUSD / ETHUSD':category.value==='metals'?'XAUUSD / XAGUSD':category.value==='indices'?'NAS100 / SPX500':category.value==='stocks'?'AAPL / NVDA':'EURUSD / GBPUSD';}
    category.addEventListener('change',()=>{updateList();if(!symbol.value.trim())symbol.focus();});
    symbol.addEventListener('change',()=>{const s=symbol.value.toUpperCase();if(/BTC|ETH|SOL|BNB|XRP|DOGE|ADA|USDT/.test(s))category.value='crypto';else if(/^XA[UGS]|XPT|XPD|OIL|NGAS/.test(s))category.value='metals';else if(/NAS|SPX|US30|GER40|UK100|JP225|HK50/.test(s))category.value='indices';else if(/^[A-Z]{1,5}$/.test(s)&&!/^(EUR|GBP|USD|AUD|NZD|CAD|JPY|CHF)$/.test(s))category.value='stocks';else if(/^[A-Z]{6}$/.test(s))category.value='forex';updateList();});
    updateList();
    return updateList;
  }
  function bindLanguageWatcher() {
    const observer=new MutationObserver(()=>{if(language()!==activeLanguage){translateNodes();refreshDashboard();renderAnalyticsCharts(readTrades());}});
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }
  function installStorageObserver() {
    try {
      const originalSet=localStorage.setItem.bind(localStorage);
      localStorage.setItem=function(key,value){originalSet(key,value);if(key==='po.v4.trades'||key===PORTFOLIO_KEY){clearTimeout(window.__prismRefreshTimer);window.__prismRefreshTimer=setTimeout(()=>{refreshDashboard();renderAnalyticsCharts(readTrades());},120);}};
      const originalRemove=localStorage.removeItem.bind(localStorage);
      localStorage.removeItem=function(key){originalRemove(key);if(key==='po.v4.trades'||key===PORTFOLIO_KEY){refreshDashboard();renderAnalyticsCharts(readTrades());}};
    } catch (_) {}
    window.addEventListener('storage',e=>{if(e.key==='po.v4.trades'||e.key===PORTFOLIO_KEY){refreshDashboard();renderAnalyticsCharts(readTrades());}});
  }
  function bindEvents() {
    $('#prism-share-analysis')?.addEventListener('click',shareReport);
    const hideCapital=$('#prism-share-hide-capital'); if(hideCapital){try{hideCapital.checked=localStorage.getItem('po.v4.share.hideCapital')==='true';}catch(_){} hideCapital.addEventListener('change',()=>{try{localStorage.setItem('po.v4.share.hideCapital',hideCapital.checked?'true':'false');}catch(_){}});}
    document.addEventListener('click',e=>{const btn=e.target.closest('[data-prism-go]');if(!btn)return;const tab=$('.tab[data-view="'+btn.dataset.prismGo+'"]');if(tab)tab.click();});
    window.addEventListener('resize',()=>{clearTimeout(window.__prismResize);window.__prismResize=setTimeout(()=>renderAnalyticsCharts(readTrades()),140);},{passive:true});
  }
  function init() {
    activeLanguage=language();translateNodes();initPortfolioForm();const refreshAssetSuggestions=setupAssetForm();bindEvents();installStorageObserver();bindLanguageWatcher();refreshDashboard();renderAnalyticsCharts(readTrades());
    // app.js loads as soon as local UI is ready; refresh in case the cloud has just merged journal data.
    window.addEventListener('po:sync-ready',()=>{refreshDashboard();renderAnalyticsCharts(readTrades());});
    window.PTPrism={refreshDashboard,renderAnalyticsCharts,refreshAssetSuggestions};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
