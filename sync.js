el.clearBtn.addEventListener('click', async () => {
  if (!trades.length) { toast(el.formMsg, t('empty_list')); return; }
  const ok = await confirmDialog({...});
  if (!ok) return;

  // ⚡ پاک کردن همه از سرور
  if (window.PT_Sync && window.PT_Sync.deleteAllNow) {
    window.PT_Sync.deleteAllNow();
  }

  trades = [];
  try { localStorage.removeItem(KEYS.trades); } catch (err) {}
  renderAll();
  toast(el.formMsg, t('cleared'));
});
