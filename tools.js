/* PO tools — risk / position-size calculator as a normal collapsible card in the Add page (no floating UI, no overlay, no network). */
(function () {
  'use strict';
  var KEY = 'po.v4.calc';
  var fa = function () { return String(document.documentElement.lang || 'fa').slice(0, 2) !== 'en'; };
  var DEF = { bal: '', risk: '1', stop: '', pv: '10', rr: '2' };
  var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  /* accept Persian / Arabic digits and the decimal comma */
  function num(v) {
    var s = String(v == null ? '' : v).replace(/[\u06F0-\u06F9]/g, function (d) { return d.charCodeAt(0) - 0x06F0; })
      .replace(/[\u0660-\u0669]/g, function (d) { return d.charCodeAt(0) - 0x0660; }).replace(/[\u066B,]/g, '.').replace(/[^\d.\-]/g, '');
    var n = parseFloat(s); return isFinite(n) ? n : NaN;
  }
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY)); var r = {}; Object.keys(DEF).forEach(function (k) { r[k] = (o && typeof o[k] === 'string' && o[k].length < 20) ? o[k] : DEF[k]; }); return r; } catch (e) { return Object.assign({}, DEF); } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  var usd = function (v) { return '$' + (Math.round(v * 100) / 100).toLocaleString('en-US'); };
  var ins = {}, outs = {};
  function field(key, label, ph, hint) {
    var w = el('div', 'cx-field'), l = el('label', null, label), i = el('input'); i.type = 'text'; i.inputMode = 'decimal'; i.autocomplete = 'off'; i.placeholder = ph || ''; i.setAttribute('aria-label', label);
    i.addEventListener('input', calc); ins[key] = i; w.appendChild(l); w.appendChild(i); if (hint) w.appendChild(el('small', null, hint)); return w;
  }
  function out(key, label, cls) { var b = el('div', 'cx-out ' + (cls || '')), v = el('div', 'cx-v', '\u2014'), l = el('div', 'cx-l', label); outs[key] = v; b.appendChild(v); b.appendChild(l); return b; }
  function calc() {
    var bal = num(ins.bal.value), rk = num(ins.risk.value), st = num(ins.stop.value), pv = num(ins.pv.value), rr = num(ins.rr.value);
    save({ bal: ins.bal.value, risk: ins.risk.value, stop: ins.stop.value, pv: ins.pv.value, rr: ins.rr.value });
    var ok = bal > 0 && rk > 0 && rk <= 100 && st > 0 && pv > 0;
    ['risk', 'lots', 'tp', 'reward'].forEach(function (k) { outs[k].textContent = '\u2014'; });
    outs.note.textContent = '';
    if (!ok) { outs.note.textContent = fa() ? 'موجودی، درصد ریسک، فاصله حد ضرر و ارزش هر واحد رو وارد کن.' : 'Enter balance, risk %, stop distance and unit value.'; return; }
    var riskAmt = bal * rk / 100, rawLots = riskAmt / (st * pv), lots = Math.floor(rawLots * 100) / 100, real = lots * st * pv;
    outs.risk.textContent = usd(real > 0 ? real : riskAmt);
    outs.lots.textContent = lots >= 0.01 ? lots.toFixed(2) : '< 0.01';
    if (rr > 0) { outs.tp.textContent = (Math.round(st * rr * 100) / 100).toLocaleString('en-US'); outs.reward.textContent = usd(real * rr); }
    if (lots < 0.01) outs.note.textContent = fa() ? '⚠️ ریسک انتخابی برای این حد ضرر کمتر از ۰٫۰۱ لات می‌شه.' : '⚠️ Selected risk is below 0.01 lot for this stop.';
    else if (rk > 3) outs.note.textContent = fa() ? '⚠️ ریسک بالای ۳٪ برای هر معامله خطرناکه.' : '⚠️ Risking over 3% per trade is dangerous.';
  }
  function build() {
    var host = document.getElementById('page-add');
    if (!host || document.getElementById('po-calc-card')) return;
    var F = fa(), card = el('details', 'card cx-card'); card.id = 'po-calc-card';
    card.appendChild(el('summary', null, F ? '🧮 ماشین‌حساب ریسک و حجم معامله' : '🧮 Risk & position-size calculator'));
    var body = el('div', 'cx-body'), g = el('div', 'cx-grid');
    g.appendChild(field('bal', F ? 'موجودی حساب ($)' : 'Account balance ($)', '10000'));
    g.appendChild(field('risk', F ? 'ریسک هر معامله (٪)' : 'Risk per trade (%)', '1'));
    g.appendChild(field('stop', F ? 'فاصله حد ضرر' : 'Stop distance', '20', F ? 'به همان واحدی که ارزشش رو می‌دی (پیپ یا دلار)' : 'In the same unit as the value below (pips or $)'));
    g.appendChild(field('pv', F ? 'ارزش هر واحد برای ۱ لات ($)' : 'Value per unit for 1 lot ($)', '10'));
    g.appendChild(field('rr', F ? 'نسبت ریوارد به ریسک' : 'Reward : risk', '2'));
    body.appendChild(g);
    var ch = el('div', 'cx-chips'); ch.appendChild(el('span', null, F ? 'پیش‌فرض‌ها:' : 'Presets:'));
    [[F ? 'فارکس (پیپ)' : 'Forex (pip)', '10'], [F ? 'طلا (هر ۱$)' : 'Gold (per $1)', '100'], [F ? 'کریپتو/سهم' : 'Crypto/stock', '1']].forEach(function (p) { var b = el('button', 'cx-chip', p[0]); b.type = 'button'; b.addEventListener('click', function () { ins.pv.value = p[1]; calc(); }); ch.appendChild(b); });
    body.appendChild(ch);
    var o = el('div', 'cx-outs'); o.appendChild(out('lots', F ? 'حجم (لات)' : 'Lot size', 'main')); o.appendChild(out('risk', F ? 'ریسک واقعی' : 'Real risk', 'neg')); o.appendChild(out('tp', F ? 'فاصله تارگت' : 'Target distance')); o.appendChild(out('reward', F ? 'سود هدف' : 'Target profit', 'pos'));
    body.appendChild(o); outs.note = el('div', 'cx-note'); body.appendChild(outs.note);
    card.appendChild(body); host.appendChild(card);
    var v = load(); Object.keys(ins).forEach(function (k) { ins[k].value = v[k]; }); calc();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
  window.POTools = { _num: num };
})();
