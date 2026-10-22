/* PO-TRADE public community profile editor. Private avatar files are served only via signed URLs. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('#community-profile-form');
  if (!form) return;
  const input = $('#community-avatar-input'), bio = $('#community-bio-input'), preview = $('#community-avatar-preview');
  const status = $('#community-profile-status'), saveBtn = $('#community-profile-save');
  const ownPosts = $('#community-own-posts'), ownPostCount = $('#community-own-post-count');
  let clientProfile = null, currentUser = null, currentAvatarPath = null, localPreviewUrl = '', loading = false;
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024, TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const lang = () => String(document.documentElement.lang || 'fa').toLowerCase().startsWith('en') ? 'en' : 'fa';
  const L = (fa, en) => lang() === 'en' ? en : fa;
  const msg = (text, error) => { if (status) { status.textContent = text; status.dataset.state = error ? 'error' : 'success'; } };
  const sb = () => window.__PT_SB && window.__PT_SB.auth ? window.__PT_SB : null;
  async function signedAvatar(path) {
    const client = sb(); if (!client || !path || typeof path !== 'string' || path.startsWith('/') || path.includes('..')) return '';
    try { const { data, error } = await client.storage.from('po-trade-avatars').createSignedUrl(path, 1800); return error ? '' : (data && data.signedUrl) || ''; } catch (_) { return ''; }
  }
  async function signedPostImage(path) {
    const client = sb(); if (!client || !path || typeof path !== 'string' || path.startsWith('/') || path.includes('..') || path.length > 220) return '';
    try { const { data, error } = await client.storage.from('po-trade-posts').createSignedUrl(path, 1800); return error ? '' : (data && data.signedUrl) || ''; } catch (_) { return ''; }
  }
  async function paintAvatar(path, handle) {
    if (!preview) return;
    preview.replaceChildren(); preview.textContent = (handle || '?').slice(0, 1).toUpperCase();
    if (!path) return;
    const url = await signedAvatar(path); if (!url || !preview.isConnected) return;
    const image = document.createElement('img'); image.src = url; image.alt = ''; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer'; image.onerror = () => image.remove(); preview.replaceChildren(image);
  }
  async function updateExploreIdentity(meta) {
    const avatar = $('#po-explore-own-avatar');
    const name = $('#po-explore-own-name');
    const handleNode = $('#po-explore-own-handle');
    const bioNode = $('#po-explore-own-bio');
    const postsNode = $('#po-explore-own-posts-count');
    const followersNode = $('#po-explore-own-followers-count');
    const followingNode = $('#po-explore-own-following-count');
    if (!avatar && !name) return;
    const handle = String((clientProfile && clientProfile.username) || (window.PT_USERNAME && window.PT_USERNAME.get && window.PT_USERNAME.get()) || '').trim();
    const initial = (handle || (currentUser && currentUser.email) || '?').slice(0, 1).toUpperCase();
    if (avatar) { avatar.replaceChildren(); avatar.textContent = initial; }
    if (name) name.textContent = handle ? '@' + handle : L('پروفایل من','My profile');
    if (handleNode) handleNode.textContent = /^[A-Za-z0-9_]{3,20}$/.test(handle) ? '@' + handle : L('نام کاربری ثبت نشده','Username not set');
    if (bioNode) bioNode.textContent = String((clientProfile && clientProfile.bio) || '').trim() || L('بیوی معاملاتی‌ات را در پروفایل تنظیم کن تا دیگران سبک و تجربه‌ات را بشناسند.','Add a short trading bio to introduce your style and experience.');
    if (postsNode) postsNode.textContent = meta && meta.public_post_count != null ? String(Number(meta.public_post_count) || 0) : '—';
    if (followersNode) followersNode.textContent = meta && meta.followers_count != null ? String(Number(meta.followers_count) || 0) : '—';
    if (followingNode) followingNode.textContent = meta && meta.following_count != null ? String(Number(meta.following_count) || 0) : '—';
    const path = clientProfile && clientProfile.avatar_path;
    if (avatar && path) {
      const url = await signedAvatar(path);
      if (url && avatar.isConnected) { const image = document.createElement('img'); image.src = url; image.alt = ''; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer'; image.onerror = () => image.remove(); avatar.replaceChildren(image); }
    }
  }
  function renderOwnPost(post) {
    const card = document.createElement('article'); card.className = 'community-own-post';
    if (post.image_path && sb()) {
      const img = document.createElement('img'); img.alt = L('تصویر پست من', 'My post image'); img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; img.onerror = () => img.remove(); card.append(img);
      signedPostImage(post.image_path).then(url => { if (url && img.isConnected) img.src = url; else img.remove(); });
    }
    const body = document.createElement('p'); body.textContent = String(post.body || '').slice(0, 2500); card.append(body);
    const meta = document.createElement('small'); let date = '';
    try { date = new Intl.DateTimeFormat(lang() === 'en' ? 'en-US' : 'fa-IR', { dateStyle: 'medium' }).format(new Date(post.created_at)); } catch (_) {}
    meta.textContent = date + ' · ♥ ' + String(Number(post.like_count) || 0) + ' · ' + L('نظر ', 'comments ') + String(Number(post.comment_count) || 0); card.append(meta);
    return card;
  }
  async function loadMyPosts() {
    const client = sb(); if (!client || !currentUser || !ownPosts) return;
    const handle = (clientProfile && clientProfile.username) || (window.PT_USERNAME && window.PT_USERNAME.get && window.PT_USERNAME.get()) || '';
    if (!/^[A-Za-z0-9_]{3,20}$/.test(String(handle)) || !(clientProfile && clientProfile.leaderboard_opt_in && clientProfile.show_username)) {
      ownPosts.replaceChildren(); const note = document.createElement('p'); note.textContent = L('برای نمایش پست‌ها، نام کاربری و نمایش عمومی را در تنظیمات فعال کن.','Set a username and enable public visibility in Settings to show public posts.'); ownPosts.append(note); if (ownPostCount) ownPostCount.textContent = L('خصوصی','Private'); await updateExploreIdentity(null); return;
    }
    ownPosts.replaceChildren(); const loadingNote = document.createElement('p'); loadingNote.textContent = L('در حال دریافت پست‌ها…','Loading posts…'); ownPosts.append(loadingNote);
    try {
      const [postResult, profileResult] = await Promise.all([
        client.rpc('po_trade_profile_posts', { p_username: handle, p_limit: 24, p_offset: 0 }),
        client.rpc('po_trade_public_profile', { p_username: handle, p_period: 'week' })
      ]);
      if (postResult.error) throw postResult.error;
      const rows = Array.isArray(postResult.data) ? postResult.data : [];
      const profileMeta = Array.isArray(profileResult.data) ? profileResult.data[0] : null;
      await updateExploreIdentity(profileMeta);
      ownPosts.replaceChildren();
      if (ownPostCount) ownPostCount.textContent = String(Number(profileMeta && profileMeta.public_post_count) || rows.length) + ' ' + L('پست','posts');
      if (!rows.length) { const empty = document.createElement('p'); empty.textContent = L('هنوز پست عمومی منتشر نکرده‌ای. از اکسپلور یک پست بساز.','You have not published a public post yet. Create one in Explore.'); ownPosts.append(empty); return; }
      rows.forEach(row => ownPosts.append(renderOwnPost(row)));
    } catch (_) {
      ownPosts.replaceChildren(); const errorNote = document.createElement('p'); errorNote.textContent = L('دریافت پست‌ها انجام نشد؛ مطمئن شو مهاجرت Community اجرا شده است.','Could not load posts. Make sure the Community SQL migration has been applied.'); ownPosts.append(errorNote); await updateExploreIdentity(null);
    }
  }
  async function loadProfile() {
    const client = sb(); if (!client || loading) return;
    loading = true;
    try {
      const { data: { user }, error: authError } = await client.auth.getUser();
      if (authError || !user) { msg(L('برای ویرایش پروفایل وارد حساب شو.','Sign in to edit your profile.'), true); return; }
      currentUser = user;
      const result = await client.from('po_trade_profiles').select('username,bio,avatar_path,leaderboard_opt_in,show_username').eq('user_id', user.id).maybeSingle();
      if (result.error) throw result.error;
      clientProfile = result.data || { username: (window.PT_USERNAME && window.PT_USERNAME.get && window.PT_USERNAME.get()) || null, bio: '', avatar_path: null, leaderboard_opt_in: false, show_username: false };
      currentAvatarPath = clientProfile.avatar_path || null;
      if (bio) bio.value = clientProfile.bio || '';
      await paintAvatar(currentAvatarPath, clientProfile.username || user.email || '?');
      await updateExploreIdentity(null);
      msg(L('پروفایل آماده است. برای نمایش عمومی، تنظیمات حریم خصوصی را جداگانه کنترل کن.','Profile ready. Control public visibility separately in Privacy settings.'));
      await loadMyPosts();
    } catch (_) { msg(L('اطلاعات پروفایل بارگیری نشد؛ SQL و دسترسی حساب را بررسی کن.','Could not load profile; check the SQL migration and account access.'), true); }
    finally { loading = false; }
  }
  if (input) input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    if (localPreviewUrl) { URL.revokeObjectURL(localPreviewUrl); localPreviewUrl = ''; }
    if (!file) { await paintAvatar(currentAvatarPath, clientProfile && clientProfile.username); return; }
    if (!TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) { input.value = ''; msg(L('فقط JPG، PNG یا WebP تا ۲ مگابایت مجاز است.','Only JPG, PNG or WebP up to 2 MB is allowed.'), true); return; }
    localPreviewUrl = URL.createObjectURL(file); if (preview) { const img = document.createElement('img'); img.src = localPreviewUrl; img.alt = ''; preview.replaceChildren(img); }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault(); const client = sb(); if (!client) { msg(L('اتصال سرور در دسترس نیست.','Server connection unavailable.'), true); return; }
    if (saveBtn) saveBtn.disabled = true; let uploadedPath = null;
    try {
      const { data: { user }, error: authError } = await client.auth.getUser(); if (authError || !user) throw new Error(L('ابتدا وارد حساب شو.','Please sign in first.'));
      const body = (bio && bio.value || '').trim(); if (body.length > 280) throw new Error(L('بیو حداکثر ۲۸۰ کاراکتر است.','Bio is limited to 280 characters.'));
      const file = input && input.files && input.files[0]; let avatarPath = currentAvatarPath;
      if (file) {
        if (!TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) throw new Error(L('نوع یا اندازه عکس معتبر نیست.','Invalid avatar type or size.'));
        const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
        uploadedPath = user.id + '/' + crypto.randomUUID() + '.' + extension;
        const upload = await client.storage.from('po-trade-avatars').upload(uploadedPath, file, { cacheControl: '1800', upsert: false, contentType: file.type }); if (upload.error) throw upload.error; avatarPath = uploadedPath;
      }
      const { error } = await client.rpc('po_trade_save_community_profile', { p_bio: body, p_avatar_path: avatarPath }); if (error) throw error;
      const oldPath = currentAvatarPath; currentAvatarPath = avatarPath; clientProfile = Object.assign({}, clientProfile || {}, { bio: body, avatar_path: avatarPath });
      if (oldPath && uploadedPath && oldPath !== uploadedPath) { try { await client.storage.from('po-trade-avatars').remove([oldPath]); } catch (_) {} }
      if (localPreviewUrl) { URL.revokeObjectURL(localPreviewUrl); localPreviewUrl = ''; } if (input) input.value = '';
      await paintAvatar(currentAvatarPath, clientProfile.username || user.email || '?');
      await updateExploreIdentity(null);
      msg(L('پروفایل اجتماعی ذخیره شد. نمایش عمومی همچنان تابع تنظیمات حریم خصوصی است.','Community profile saved. Public display still follows your privacy settings.')); await loadMyPosts();
    } catch (error) {
      if (uploadedPath) { try { await client.storage.from('po-trade-avatars').remove([uploadedPath]); } catch (_) {} }
      msg((error && error.message) || L('ذخیره پروفایل ناموفق بود.','Could not save profile.'), true);
    } finally { if (saveBtn) saveBtn.disabled = false; }
  });
  let activeBefore = false;
  let exploreBefore = false;
  const observer = new MutationObserver(() => {
    const active = !!$('#page-profile')?.classList.contains('active');
    const explore = !!$('#page-explore')?.classList.contains('active');
    if ((active && !activeBefore) || (explore && !exploreBefore)) loadProfile();
    activeBefore = active; exploreBefore = explore;
  });
  const profilePage = $('#page-profile'); if (profilePage) observer.observe(profilePage, { attributes: true, attributeFilter: ['class'] });
  const explorePage = $('#page-explore'); if (explorePage) observer.observe(explorePage, { attributes: true, attributeFilter: ['class'] });
  const langObserver = new MutationObserver(() => { if (clientProfile || currentUser) updateExploreIdentity(null); });
  langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  window.addEventListener('po:sync-ready', () => { if ($('#page-profile')?.classList.contains('active') || $('#page-explore')?.classList.contains('active')) loadProfile(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { if ($('#page-profile')?.classList.contains('active')) loadProfile(); }, { once: true });
  else if ($('#page-profile')?.classList.contains('active')) loadProfile();
})();
