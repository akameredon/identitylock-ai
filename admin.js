const SUPABASE_URL='https://zcyxoucbglsyrqzqksjc.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_QWPzFWgH-M06RnN1dFtd0A_6AuPGk_y';
const $=id=>document.getElementById(id);
let db=null,user=null,pages=[],chosen=null;
const msg=(id,value)=>{const el=$(id);if(el)el.textContent=value};
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const loginButton=$('loginButton');
try {
  if(!window.supabase||typeof window.supabase.createClient!=='function') throw new Error('Authentication library did not load.');
  if(!window.DOMPurify||typeof window.DOMPurify.sanitize!=='function') throw new Error('Content safety library did not load.');
  db=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  window.__identityLockLoginReady=true;
} catch(error) {
  window.__identityLockLoginReady=false;
  msg('loginMsg','Admin setup error: '+(error?.message||'Required browser components are unavailable.'));
  if(loginButton)loginButton.disabled=true;
}
async function auth(session){
  if(!session){user=null;$('login').classList.remove('hidden');$('app').classList.add('hidden');return}
  try {
    const {data,error}=await db.from('admin_users').select('user_id,role').eq('user_id',session.user.id).maybeSingle();
    if(error)throw new Error('Could not verify administrator access: '+error.message);
    if(!data){await db.auth.signOut();msg('loginMsg','This account is not authorised for Admin Studio.');return}
    user=session.user;$('who').textContent=user.email||'';$('login').classList.add('hidden');$('app').classList.remove('hidden');await load();
  } catch(error) {msg('loginMsg',error?.message||'Administrator verification failed.');}
}
$('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!db){msg('loginMsg','Authentication is unavailable. Please refresh and try again.');return}
  const email=$('email').value.trim(),password=$('password').value;
  if(!email||!password){msg('loginMsg','Enter your email and password.');return}
  if(loginButton){loginButton.disabled=true;loginButton.textContent='Signing in…'}
  msg('loginMsg','Signing in…');
  try {
    const {data,error}=await db.auth.signInWithPassword({email,password});
    if(error){msg('loginMsg',error.message);return}
    if(!data?.session){msg('loginMsg','Sign-in completed but no session was returned. Please try again.');return}
    await auth(data.session);
  } catch(error) {msg('loginMsg',error?.message||'Unable to sign in. Check your connection and try again.');}
  finally {if(loginButton){loginButton.disabled=false;loginButton.textContent='Sign in'}}
});
$('logout').onclick=async()=>{try{await db.auth.signOut();}catch(error){msg('loginMsg','Sign-out error: '+(error?.message||'Please retry.'))}};
if(db){
  db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){user=null;$('app').classList.add('hidden');$('login').classList.remove('hidden')}});
  db.auth.getSession().then(({data,error})=>{if(error)msg('loginMsg','Session check failed: '+error.message);return auth(data?.session||null)}).catch(error=>msg('loginMsg','Session check failed: '+(error?.message||'Please refresh.')));
}
async function audit(action,type,id,details={}){await db.from('admin_audit_log').insert({actor_id:user.id,action,entity_type:type,entity_id:String(id||''),details})}async function load(){await Promise.all([loadPages(),loadMedia(),loadSettings(),loadLogs()])}async function loadPages(){let {data,error}=await db.from('site_pages').select('*').order('updated_at',{ascending:false});if(error){msg('pageMsg',error.message);return}pages=data||[];$('count').textContent=pages.length;$('published').textContent=pages.filter(x=>x.status==='published').length;$('drafts').textContent=pages.filter(x=>x.status==='draft').length;$('list').innerHTML=pages.map(x=>`<button class="page ${chosen?.id===x.id?'active':''}" data-id="${x.id}"><b>${esc(x.title)}</b><small>/${esc(x.slug)} · ${x.status}</small></button>`).join('')||'<p>No pages yet.</p>';$('recent').innerHTML=pages.slice(0,6).map(x=>`<p>${esc(x.title)} — ${x.status}</p>`).join('')||'<p>No pages yet.</p>';document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>choose(b.dataset.id))}function choose(id){chosen=pages.find(x=>x.id===id);$('form').classList.remove('hidden');$('editTitle').textContent='Edit page';$('title').value=chosen.title;$('slug').value=chosen.slug;$('seo').value=chosen.seo?.description||'';$('body').innerHTML=DOMPurify.sanitize(chosen.content?.html||'');$('status').value=chosen.status;document.querySelectorAll('.page').forEach(b=>b.classList.toggle('active',b.dataset.id===id))}function fresh(){chosen=null;$('form').classList.remove('hidden');$('editTitle').textContent='New page';['title','slug','seo'].forEach(id=>$(id).value='');$('body').innerHTML='';$('status').value='draft';document.querySelectorAll('.page').forEach(b=>b.classList.remove('active'))}$('new').onclick=$('newTop').onclick=fresh;document.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>{let c=b.dataset.cmd;if(c==='createLink'){let u=prompt('HTTPS link URL');if(u&&/^https:\/\//i.test(u))document.execCommand(c,false,u)}else document.execCommand(c,false,b.dataset.value||null)});async function save(status){let title=$('title').value.trim(),slug=$('slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'');if(!title||!slug){msg('pageMsg','Title and URL slug are required.');return}let payload={title,slug,status,content:{html:DOMPurify.sanitize($('body').innerHTML,{USE_PROFILES:{html:true}})},seo:{description:$('seo').value.trim()},updated_by:user.id};let q=chosen?db.from('site_pages').update(payload).eq('id',chosen.id).select().single():db.from('site_pages').insert(payload).select().single();let {data,error}=await q;if(error){msg('pageMsg',error.message);return}chosen=data;await audit(status==='published'?'publish':'save','page',data.id,{title,slug,status});msg('pageMsg',status==='published'?'Page published.':'Draft saved.');await loadPages();choose(data.id)}$('save').onclick=()=>save('draft');$('publish').onclick=()=>save('published');async function loadMedia(){let {data,error}=await db.storage.from('identitylock-media').list('',{limit:100});if(error){msg('mediaMsg',error.message);return}$('mediaCount').textContent=(data||[]).length;$('gallery').innerHTML=(data||[]).map(f=>{let u=db.storage.from('identitylock-media').getPublicUrl(f.name).data.publicUrl;return `<div class="media"><img src="${u}" alt=""><p>${esc(f.name)}</p></div>`}).join('')}$('upload').onchange=async e=>{for(let f of e.target.files){if(f.size>10485760){msg('mediaMsg',f.name+' exceeds 10 MB');continue}let path=Date.now()+'-'+f.name.replace(/[^\w.-]/g,'-'),{error}=await db.storage.from('identitylock-media').upload(path,f,{contentType:f.type});if(error){msg('mediaMsg',error.message);continue}await db.from('media_assets').insert({storage_path:path,file_name:f.name,mime_type:f.type,size_bytes:f.size,created_by:user.id});await audit('upload','media',path)}e.target.value='';msg('mediaMsg','Upload complete.');loadMedia()};async function loadSettings(){let {data}=await db.from('site_settings').select('key,value').in('key',['announcement','contact_email','footer_text']);let v=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));$('announcement').value=v.announcement?.text||'';$('contact').value=v.contact_email?.text||'';$('footer').value=v.footer_text?.text||''}$('saveSettings').onclick=async()=>{let rows=[['announcement',$('announcement').value],['contact_email',$('contact').value],['footer_text',$('footer').value]].map(([key,text])=>({key,value:{text},is_public:true,updated_by:user.id}));let {error}=await db.from('site_settings').upsert(rows);if(error){msg('settingsMsg',error.message);return}await audit('update','settings','global');msg('settingsMsg','Settings saved.')};async function loadLogs(){let {data}=await db.from('admin_audit_log').select('action,entity_type,entity_id,created_at').order('created_at',{ascending:false}).limit(50);$('logs').innerHTML=(data||[]).map(x=>`<p>${esc(x.action)} · ${esc(x.entity_type)} ${esc(x.entity_id)} <small>${new Date(x.created_at).toLocaleString()}</small></p>`).join('')||'<p>No activity yet.</p>'}document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.add('hidden'));$(b.dataset.tab).classList.remove('hidden');document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));$('heading').textContent=b.textContent});