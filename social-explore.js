/* PO-TRADE Social Explore: public opt-in community posts. Client never reads private trade rows. */
(function(){
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const page = $('#page-explore');
  const feed = $('#po-social-feed');
  if (!page || !feed) return;
  const statusNode = $('#po-social-feed-status');
  const form = $('#po-social-post-form');
  const bodyInput = $('#po-social-post-body');
  const tagsInput = $('#po-social-post-tags');
  const imageInput = $('#po-social-post-image');
  const imagePreview = $('#po-social-image-preview');
  const imagePreviewImg = $('#po-social-image-preview-img');
  const composeStatus = $('#po-social-compose-status');
  const publishButton = $('#po-social-publish');
  const loadMoreButton = $('#po-social-load-more');
  const bucketName = 'po-trade-posts';
  const pageSize = 12;
  let sort = 'newest', offset = 0, busy = false, pendingReset = false, hasMore = true, imageObjectUrl = '', renderEpoch = 0;
  const commentLoaded = new Set();
  function isEn(){ return String(document.documentElement.lang||'fa').toLowerCase().startsWith('en') || document.documentElement.dir==='ltr'; }
  function L(fa,en){ return isEn()?en:fa; }
  function sb(){ return window.__PT_SB && window.__PT_SB.auth ? window.__PT_SB : null; }
  function txt(node,value){ if(node) node.textContent=value; }
  function message(text, error){ txt(statusNode,text); if(statusNode) statusNode.dataset.state=error?'error':'info'; }
  function composerMessage(text, error){ txt(composeStatus,text); if(composeStatus) composeStatus.style.color=error?'#ff92b4':''; }
  function safeDate(value){ const d=new Date(value); if(!Number.isFinite(d.getTime())) return ''; try{return new Intl.DateTimeFormat(isEn()?'en-US':'fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(d);}catch(_){return d.toLocaleString();} }
  async function getPrivatePostImageUrl(path){
    if(!path || typeof path!=='string' || path.startsWith('/') || path.includes('..') || path.length>220) return '';
    const client=sb(); if(!client || !client.storage) return '';
    try { const result=await client.storage.from(bucketName).createSignedUrl(path,1800); return result.error?'':(result.data&&result.data.signedUrl)||''; } catch(_){ return ''; }
  }
  async function avatarSignedUrl(path){ if(!path||typeof path!=='string'||path.startsWith('/')||path.includes('..')) return ''; const client=sb(); if(!client||!client.storage)return ''; try{const result=await client.storage.from('po-trade-avatars').createSignedUrl(path,1800);if(result.error)return '';return result.data&&result.data.signedUrl||'';}catch(_){return '';} }
  function el(tag, className, text){ const node=document.createElement(tag); if(className) node.className=className; if(text!=null) node.textContent=String(text); return node; }
  function activeProfileOkay(){
    const privacy=window.PTNebula && typeof window.PTNebula.getPrivacy==='function' ? window.PTNebula.getPrivacy() : {};
    const user=window.PT_USER||{};
    const handle=(window.PT_USERNAME&&typeof window.PT_USERNAME.get==='function'?window.PT_USERNAME.get():user.username)||'';
    return !!(privacy.leaderboardOptIn && privacy.showUsername && /^[A-Za-z0-9_]{3,20}$/.test(String(handle)));
  }
  function currentHandle(){ const user=window.PT_USER||{}; return (window.PT_USERNAME&&typeof window.PT_USERNAME.get==='function'&&window.PT_USERNAME.get()) || user.username || ''; }
  async function loadFeed(reset){
    if(!feed) return;
    if(busy){ if(reset) pendingReset=true; return; }
    const client=sb();
    if(!client){ message(L('برای دیدن و انتشار تحلیل‌ها باید اتصال حساب فعال باشد.','Sign in and connect Supabase to view or publish posts.'),true); feed.replaceChildren(); return; }
    if(reset){ offset=0; hasMore=true; commentLoaded.clear(); }
    if(!hasMore && !reset) return;
    busy=true; const epoch=++renderEpoch;
    if(reset){ feed.replaceChildren(el('div','po-social-skeleton')); const sk=feed.firstChild; sk.append(el('i'),el('i')); }
    message(L('در حال دریافت تحلیل‌ها…','Loading community analysis…'));
    if(loadMoreButton) loadMoreButton.disabled=true;
    try{
      const {data,error}=await client.rpc('po_trade_explore_posts',{p_sort:sort,p_limit:pageSize,p_offset:offset});
      if(error) throw error;
      if(epoch!==renderEpoch)return;
      const rows=Array.isArray(data)?data:[];
      if(reset) feed.replaceChildren();
      rows.forEach(row=>feed.appendChild(renderPost(row)));
      offset += rows.length; hasMore=rows.length===pageSize;
      if(!offset){ feed.replaceChildren(el('div','po-social-empty',L('هنوز تحلیل عمومی‌ای منتشر نشده. اولین تحلیل را به اشتراک بگذار؛ برای انتشار باید نام کاربری و نمایش عمومی را در تنظیمات فعال کرده باشی.','No public analysis yet. Be the first to share. Public username and community consent must be enabled in settings.'))); }
      message(rows.length?L('تحلیل‌ها بر اساس محبوبیت یا زمان مرتب شده‌اند.','Posts are sorted by popularity or recency.'):L('پست عمومی دیگری برای نمایش نیست.','There are no more public posts to show.'));
      if(loadMoreButton){loadMoreButton.hidden=!hasMore;loadMoreButton.disabled=false;}
    }catch(err){
      if(epoch!==renderEpoch)return;
      feed.replaceChildren(el('div','po-social-error',L('فید اجتماعی هنوز آماده نیست. فایل SQL جدید را در Supabase اجرا کن و سپس صفحه را تازه‌سازی کن.','The social feed is not set up yet. Run the new SQL in Supabase, then refresh the page.')));
      message(L('دریافت تحلیل‌ها انجام نشد.','Could not load community analysis.'),true);
      if(loadMoreButton){loadMoreButton.hidden=true;loadMoreButton.disabled=false;}
    }finally{busy=false; if(pendingReset){pendingReset=false; loadFeed(true);}}
  }
  function renderPost(post){
    const card=el('article','po-social-post'); card.id='po-social-post-'+String(post.post_id||'').replace(/[^a-zA-Z0-9_-]/g,'');
    const head=el('header','po-social-post-head');
    const authorName=String(post.author_username||'Trader');
    const avatar=el('span','po-social-post-avatar',authorName.slice(0,1).toUpperCase()); avatar.setAttribute('aria-hidden','true');
    if(post.author_avatar_path){ avatarSignedUrl(post.author_avatar_path).then(url=>{if(url&&avatar.isConnected){const img=el('img');img.src=url;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.onerror=()=>img.remove();avatar.replaceChildren(img);}}); }
    const ident=el('div','po-social-post-author');
    const author=el('button','', '@'+authorName); author.type='button'; author.dataset.postProfile=authorName; author.setAttribute('aria-label',L('نمایش پروفایل عمومی '+authorName,'Open public profile '+authorName));
    const date=el('small','',safeDate(post.created_at)); ident.append(author,date); head.append(avatar,ident);
    if(post.author_bio){ ident.append(el('small','po-social-post-author-bio',String(post.author_bio).slice(0,110))); }
    if(!post.is_own_post){ const followed=!!post.is_following_author; const follow=el('button','po-social-follow-mini'+(followed?' is-following':''),followed?L('دنبال می‌کنی ✓','Following ✓'):'+ '+L('دنبال‌کردن','Follow'));follow.type='button';follow.dataset.followPostAuthor=authorName;follow.setAttribute('aria-pressed',followed?'true':'false');head.append(follow); }
    const meta=el('span','po-social-post-meta',post.like_count==null?'':String(post.like_count)); meta.setAttribute('aria-hidden','true'); head.append(meta); card.append(head);
    if(post.image_path){ const figure=el('figure','po-social-post-figure is-loading'); const img=el('img'); img.alt=L('تصویر تحلیل '+authorName,'Analysis image by '+authorName); img.loading='lazy'; img.decoding='async'; img.referrerPolicy='no-referrer'; img.addEventListener('error',()=>figure.remove(),{once:true}); figure.append(img); card.append(figure); getPrivatePostImageUrl(post.image_path).then(src=>{if(!figure.isConnected)return;if(src){img.src=src;figure.classList.remove('is-loading');}else figure.remove();}); }
    card.appendChild(el('div','po-social-post-body',post.body||''));
    const tags=Array.isArray(post.tags)?post.tags.filter(t=>typeof t==='string'&&t.trim()).slice(0,8):[];
    if(tags.length){const row=el('div','po-social-post-tags'); tags.forEach(tag=>row.appendChild(el('span','','#'+tag)));card.append(row);}
    const actions=el('div','po-social-post-actions');
    const like=el('button',''+(post.liked_by_me?' is-active':''), (post.liked_by_me?'♥':'♡')+' '+(post.like_count||0)); like.type='button'; like.dataset.postAction='like'; like.dataset.postId=post.post_id; like.setAttribute('aria-pressed',post.liked_by_me?'true':'false'); like.setAttribute('aria-label',L('لایک تحلیل','Like analysis'));
    const comments=el('button','','▱ '+(post.comment_count||0)); comments.type='button'; comments.dataset.postAction='comments'; comments.dataset.postId=post.post_id; comments.setAttribute('aria-label',L('نمایش کامنت‌ها','Show comments'));
    const save=el('button',''+(post.saved_by_me?' is-saved':''),(post.saved_by_me?'▣':'▢')+' '+L('ذخیره','Save')); save.type='button'; save.dataset.postAction='save'; save.dataset.postId=post.post_id; save.setAttribute('aria-pressed',post.saved_by_me?'true':'false');
    const share=el('button','','↗ '+L('اشتراک','Share')); share.type='button'; share.dataset.postAction='share'; share.dataset.postId=post.post_id;
    actions.append(like,comments,save,share); card.append(actions);
    const commentsBox=el('section','po-social-comments'); commentsBox.hidden=true; commentsBox.dataset.commentsFor=post.post_id;
    const list=el('div','po-social-comment-list'); list.dataset.commentList=post.post_id; commentsBox.append(list);
    const cf=el('form','po-social-comment-form'); cf.dataset.commentForm=post.post_id;
    const ci=el('input'); ci.type='text';ci.maxLength=1000;ci.required=true;ci.autocomplete='off';ci.placeholder=L('نظر محترمانه و مرتبط…','Add a constructive comment…');ci.setAttribute('aria-label',L('متن نظر','Comment text'));
    const cb=el('button','','↗');cb.type='submit';cb.setAttribute('aria-label',L('ارسال نظر','Send comment')); cf.append(ci,cb); commentsBox.append(cf); card.append(commentsBox);
    return card;
  }
  async function requireUser(){const client=sb(); if(!client) throw new Error(L('اتصال سرور موجود نیست.','Server connection is unavailable.')); const {data,error}=await client.auth.getUser();if(error||!data||!data.user)throw new Error(L('برای این کار وارد حساب شو.','Sign in to continue.'));return {client,user:data.user};}
  async function toggle(action,postId){
    const {client}=await requireUser();
    const fn=action==='like'?'po_trade_toggle_post_like':'po_trade_toggle_post_save';
    const {error}=await client.rpc(fn,{p_post_id:postId}); if(error) throw error; await loadFeed(true);
  }
  async function loadComments(postId){
    const {client}=await requireUser();const {data,error}=await client.rpc('po_trade_get_post_comments',{p_post_id:postId,p_limit:40});if(error)throw error;
    const box=$('[data-comments-for="'+CSS.escape(postId)+'"]',feed);const list=$('[data-comment-list="'+CSS.escape(postId)+'"]',feed);if(!box||!list)return;
    list.replaceChildren();const rows=Array.isArray(data)?data:[];
    if(!rows.length)list.append(el('div','po-social-comment',L('هنوز نظری نیست.','No comments yet.')));
    rows.forEach(r=>{const line=el('div','po-social-comment');line.append(el('strong','',r.display_name||L('عضو','Trader')),document.createTextNode(String(r.body||'')));list.append(line);});
    commentLoaded.add(postId);
  }
  function setButtonBusy(btn,busy){if(!btn)return;btn.disabled=busy;btn.style.opacity=busy?'.6':'';}
  if(imageInput){imageInput.addEventListener('change',()=>{
    if(imageObjectUrl){URL.revokeObjectURL(imageObjectUrl);imageObjectUrl='';}
    const file=imageInput.files&&imageInput.files[0];
    if(!file){if(imagePreview)imagePreview.hidden=true;return;}
    const valid=['image/jpeg','image/png','image/webp'].includes(file.type);
    if(!valid||file.size>5*1024*1024){imageInput.value='';if(imagePreview)imagePreview.hidden=true;composerMessage(L('فقط JPG، PNG یا WebP تا ۵ مگابایت مجاز است.','Choose JPG, PNG or WebP up to 5 MB.'),true);return;}
    imageObjectUrl=URL.createObjectURL(file); if(imagePreviewImg)imagePreviewImg.src=imageObjectUrl;if(imagePreview)imagePreview.hidden=false;composerMessage(L('تصویر آماده انتشار است.','Image ready to publish.'));
  });}
  $('#po-social-remove-image')?.addEventListener('click',()=>{if(imageObjectUrl){URL.revokeObjectURL(imageObjectUrl);imageObjectUrl='';}if(imageInput)imageInput.value='';if(imagePreview)imagePreview.hidden=true;});
  form?.addEventListener('submit',async e=>{
    e.preventDefault();if(!bodyInput||!publishButton)return;if(publishButton.disabled)return;
    const body=bodyInput.value.trim();if(body.length<3){composerMessage(L('توضیح را کمی کامل‌تر بنویس.','Please add a little more detail.'),true);return;}
    if(!activeProfileOkay()){composerMessage(L('برای انتشار، اول نام کاربری را تنظیم و نمایش عمومی/رضایت کپی‌ترید را در تنظیمات فعال کن.','To post, set a username and enable public profile / community consent in settings.'),true);return;}
    publishButton.disabled=true;composerMessage(L('در حال آماده‌سازی انتشار…','Preparing your post…'));
    let uploadedPath=null;
    try{
      const {client,user}=await requireUser();
      const file=imageInput&&imageInput.files&&imageInput.files[0];
      if(file){
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error(L('نوع یا اندازه تصویر مجاز نیست.','Unsupported image type or size.'));
        const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
        const path=user.id+'/'+crypto.randomUUID()+'.'+ext;
        const {error:uploadError}=await client.storage.from(bucketName).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
        if(uploadError)throw uploadError;uploadedPath=path;
      }
      const tags=(tagsInput&&tagsInput.value?tagsInput.value.split(','):[]).map(t=>t.trim().replace(/^#/,'')).filter(Boolean).slice(0,8).map(t=>t.slice(0,32));
      const {error}=await client.rpc('po_trade_create_post',{p_body:body,p_image_path:uploadedPath,p_tags:tags});if(error)throw error;
      form.reset();if(imageObjectUrl){URL.revokeObjectURL(imageObjectUrl);imageObjectUrl='';}if(imagePreview)imagePreview.hidden=true;
      composerMessage(L('تحلیلت منتشر شد.','Your analysis has been published.'));$('#po-social-composer')?.removeAttribute('open');sort='newest';$$('[data-social-sort]').forEach(b=>b.classList.toggle('active',b.dataset.socialSort===sort));await loadFeed(true);
    }catch(err){
      if(uploadedPath){try{const client=sb();await client?.storage.from(bucketName).remove([uploadedPath]);}catch(_){}}
      composerMessage((err&&err.message)||L('انتشار انجام نشد. تنظیمات حریم خصوصی و SQL را بررسی کن.','Publishing failed. Check privacy settings and SQL setup.'),true);
    }finally{publishButton.disabled=false;}
  });
  feed.addEventListener('click',async e=>{
    const follow=e.target.closest('[data-follow-post-author]');if(follow){const username=follow.dataset.followPostAuthor;setButtonBusy(follow,true);try{const {client}=await requireUser();const {error}=await client.rpc('po_trade_toggle_follow',{p_username:username});if(error)throw error;await loadFeed(true);}catch(err){message((err&&err.message)||L('دنبال‌کردن انجام نشد.','Follow action failed.'),true);}finally{setButtonBusy(follow,false);}return;}
    const profile=e.target.closest('[data-post-profile]');if(profile){window.PTNebula?.openPublicProfile(profile.dataset.postProfile);return;}
    const button=e.target.closest('[data-post-action]');if(!button)return;
    const action=button.dataset.postAction, id=button.dataset.postId;
    if(action==='share'){
      const url=new URL(location.href);url.searchParams.set('community_post',id);const shareData={title:L('تحلیل PO-TRADE','PO-TRADE analysis'),text:L('تحلیل منتشرشده در PO-TRADE','Analysis shared on PO-TRADE'),url:url.toString()};
      try{if(navigator.share)await navigator.share(shareData);else if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(url.toString());message(L('پیوند پست کپی شد.','Post link copied.'));}else throw new Error('share unavailable');}catch(err){if(err&&err.name!=='AbortError')message(L('اشتراک‌گذاری در این مرورگر در دسترس نیست.','Sharing is unavailable in this browser.'),true);}return;
    }
    if(action==='comments'){
      const box=$('[data-comments-for="'+CSS.escape(id)+'"]',feed);if(!box)return;box.hidden=!box.hidden;if(!box.hidden&&!commentLoaded.has(id)){try{await loadComments(id);}catch(_){const list=$('[data-comment-list="'+CSS.escape(id)+'"]',feed);if(list)list.replaceChildren(el('div','po-social-error',L('کامنت‌ها بارگیری نشدند.','Comments could not be loaded.')));}}return;
    }
    setButtonBusy(button,true);try{await toggle(action,id);}catch(err){message((err&&err.message)||L('عملیات انجام نشد؛ SQL و اتصال را بررسی کن.','Action failed; check SQL setup and connection.'),true);}finally{setButtonBusy(button,false);}
  });
  feed.addEventListener('submit',async e=>{
    const cf=e.target.closest('[data-comment-form]');if(!cf)return;e.preventDefault();const input=$('input',cf),button=$('button',cf);const body=input&&input.value.trim(),postId=cf.dataset.commentForm;if(!body)return;
    setButtonBusy(button,true);try{const {client}=await requireUser();const {error}=await client.rpc('po_trade_add_post_comment',{p_post_id:postId,p_body:body});if(error)throw error;input.value='';commentLoaded.delete(postId);await loadFeed(true);const refreshed=$('[data-comments-for="'+CSS.escape(postId)+'"]',feed);if(refreshed){refreshed.hidden=false;commentLoaded.delete(postId);await loadComments(postId);}}catch(err){message((err&&err.message)||L('ثبت نظر انجام نشد.','Comment could not be posted.'),true);}finally{setButtonBusy(button,false);}
  });
  $$('[data-social-sort]').forEach(button=>button.addEventListener('click',()=>{sort=['newest','popular','following'].includes(button.dataset.socialSort)?button.dataset.socialSort:'popular';$$('[data-social-sort]').forEach(b=>b.classList.toggle('active',b.dataset.socialSort===sort));loadFeed(true);}));
  loadMoreButton?.addEventListener('click',()=>loadFeed(false));
  $('#po-explore-compose-trigger')?.addEventListener('click',()=>{const composer=$('#po-social-composer');if(composer){composer.open=true;composer.scrollIntoView({behavior:'smooth',block:'start'});window.setTimeout(()=>bodyInput?.focus({preventScroll:true}),180);}});
  let wasActive=false;
  const pageObserver=new MutationObserver(()=>{const active=page.classList.contains('active');if(active&&!wasActive)loadFeed(true);wasActive=active;});pageObserver.observe(page,{attributes:true,attributeFilter:['class']});
  // Deep links generated by Share open the same Explore page and focus the corresponding post.
  function handleDeepLink(){const id=new URL(location.href).searchParams.get('community_post');if(!id||!/^[0-9a-f-]{36}$/i.test(id))return;window.PTNebula?.showFutureSurface('explore');setTimeout(()=>{const target=document.getElementById('po-social-post-'+id);target?.scrollIntoView({behavior:'smooth',block:'center'});},900);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',handleDeepLink,{once:true});else handleDeepLink();
  window.POSocialExplore={refresh:()=>loadFeed(true)};
})();
