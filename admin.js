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
async function audit(action,type,id,details={}){await db.from('admin_audit_log').insert({actor_id:user.id,action,entity_type:type,entity_id:String(id||''),details})}async function load(){await Promise.all([loadPages(),loadMedia(),loadSettings(),loadLogs(),loadHomepage()])}async function loadPages(){let {data,error}=await db.from('site_pages').select('*').order('updated_at',{ascending:false});if(error){msg('pageMsg',error.message);return}pages=data||[];$('count').textContent=pages.length;$('published').textContent=pages.filter(x=>x.status==='published').length;$('drafts').textContent=pages.filter(x=>x.status==='draft').length;$('list').innerHTML=pages.map(x=>`<button class="page ${chosen?.id===x.id?'active':''}" data-id="${x.id}"><b>${esc(x.title)}</b><small>/${esc(x.slug)} · ${x.status}</small></button>`).join('')||'<p>No pages yet.</p>';$('recent').innerHTML=pages.slice(0,6).map(x=>`<p>${esc(x.title)} — ${x.status}</p>`).join('')||'<p>No pages yet.</p>';document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>choose(b.dataset.id))}function choose(id){chosen=pages.find(x=>x.id===id);$('form').classList.remove('hidden');$('editTitle').textContent='Edit page';$('title').value=chosen.title;$('slug').value=chosen.slug;$('seo').value=chosen.seo?.description||'';$('body').innerHTML=DOMPurify.sanitize(chosen.content?.html||'');$('status').value=chosen.status;document.querySelectorAll('.page').forEach(b=>b.classList.toggle('active',b.dataset.id===id))}function fresh(){chosen=null;$('form').classList.remove('hidden');$('editTitle').textContent='New page';['title','slug','seo'].forEach(id=>$(id).value='');$('body').innerHTML='';$('status').value='draft';document.querySelectorAll('.page').forEach(b=>b.classList.remove('active'))}$('new').onclick=$('newTop').onclick=fresh;document.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>{let c=b.dataset.cmd;if(c==='createLink'){let u=prompt('HTTPS link URL');if(u&&/^https:\/\//i.test(u))document.execCommand(c,false,u)}else document.execCommand(c,false,b.dataset.value||null)});async function save(status){let title=$('title').value.trim(),slug=$('slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'');if(!title||!slug){msg('pageMsg','Title and URL slug are required.');return}let payload={title,slug,status,content:{html:DOMPurify.sanitize($('body').innerHTML,{USE_PROFILES:{html:true}})},seo:{description:$('seo').value.trim()},updated_by:user.id};let q=chosen?db.from('site_pages').update(payload).eq('id',chosen.id).select().single():db.from('site_pages').insert(payload).select().single();let {data,error}=await q;if(error){msg('pageMsg',error.message);return}chosen=data;await audit(status==='published'?'publish':'save','page',data.id,{title,slug,status});msg('pageMsg',status==='published'?'Page published.':'Draft saved.');await loadPages();choose(data.id)}$('save').onclick=()=>save('draft');$('publish').onclick=()=>save('published');async function loadMedia(){let {data,error}=await db.storage.from('identitylock-media').list('',{limit:100});if(error){msg('mediaMsg',error.message);return}$('mediaCount').textContent=(data||[]).length;$('gallery').innerHTML=(data||[]).map(f=>{let u=db.storage.from('identitylock-media').getPublicUrl(f.name).data.publicUrl;return `<div class="media"><img src="${u}" alt=""><p>${esc(f.name)}</p></div>`}).join('')}$('upload').onchange=async e=>{for(let f of e.target.files){if(f.size>10485760){msg('mediaMsg',f.name+' exceeds 10 MB');continue}let path=Date.now()+'-'+f.name.replace(/[^\w.-]/g,'-'),{error}=await db.storage.from('identitylock-media').upload(path,f,{contentType:f.type});if(error){msg('mediaMsg',error.message);continue}await db.from('media_assets').insert({storage_path:path,file_name:f.name,mime_type:f.type,size_bytes:f.size,created_by:user.id});await audit('upload','media',path)}e.target.value='';msg('mediaMsg','Upload complete.');loadMedia()};async function loadSettings(){let {data}=await db.from('site_settings').select('key,value').in('key',['announcement','contact_email','footer_text']);let v=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));$('announcement').value=v.announcement?.text||'';$('contact').value=v.contact_email?.text||'';$('footer').value=v.footer_text?.text||''}$('saveSettings').onclick=async()=>{let rows=[['announcement',$('announcement').value],['contact_email',$('contact').value],['footer_text',$('footer').value]].map(([key,text])=>({key,value:{text},is_public:true,updated_by:user.id}));let {error}=await db.from('site_settings').upsert(rows);if(error){msg('settingsMsg',error.message);return}await audit('update','settings','global');msg('settingsMsg','Settings saved.')};async function loadLogs(){let {data}=await db.from('admin_audit_log').select('action,entity_type,entity_id,created_at').order('created_at',{ascending:false}).limit(50);$('logs').innerHTML=(data||[]).map(x=>`<p>${esc(x.action)} · ${esc(x.entity_type)} ${esc(x.entity_id)} <small>${new Date(x.created_at).toLocaleString()}</small></p>`).join('')||'<p>No activity yet.</p>'}
const HOME_FIELDS=[["visual","Hero comparison — images & captions",["title","Comparison heading"],["original_label","Original image label"],["original_caption","Original image caption"],["original_image_url","Original image URL (HTTPS; optional)"],["new_label","New look image label"],["new_caption","New look image caption"],["new_image_url","New look image URL (HTTPS; optional)"],["disclaimer","Comparison disclaimer"]],["hero","Hero section",["eyebrow","Top label"],["title_line1","Headline — first line"],["title_line2","Headline — second line"],["intro","Introduction"],["primary_cta","Main button text"],["secondary_cta","Secondary button text"],["trust_1","Trust point 1"],["trust_2","Trust point 2"],["trust_3","Trust point 3"]],["manifesto","Problem section",["eyebrow","Section label"],["title_line1","Headline — first line"],["title_line2","Headline — second line"],["body","Description"]],["steps","How it works",["eyebrow","Section label"],["title","Section heading"],["step1_title","Step 1 title"],["step1_body","Step 1 description"],["step2_title","Step 2 title"],["step2_body","Step 2 description"],["step3_title","Step 3 title"],["step3_body","Step 3 description"]],["bundle","What's included",["eyebrow","Section label"],["title","Heading"],["body","Description"],["items","Bundle items — one per line"]],["honest","Realistic results",["eyebrow","Section label"],["title","Heading"],["body","Description"]],["buy","Purchase section",["eyebrow","Section label"],["title","Heading"],["bundle_title","Bundle name"],["features","Purchase features — one per line"]],["faq","Frequently asked questions",["eyebrow","Section label"],["title","Heading"],["items_json","FAQ editor — JSON question/answer pairs"]]];
let homeDraft={};
const homeDefaults={
visual:{title:'ONE PERSON. A DIFFERENT LOOK.',original_label:'YOUR ORIGINAL',new_label:'YOUR NEW LOOK',original_caption:'Start with the photo you want to keep.',new_caption:'Change the styling — not the person.',disclaimer:'Illustrative example, not a guarantee of exact identity retention. Results vary by image and editing platform.',original_image_url:'',new_image_url:''},
hero:{eyebrow:'THE IDENTITY-PRESERVING PHOTO WORKFLOW',title_line1:'Change the look.',title_line2:'Keep the person.',intro:'Give your photos a new outfit, occasion or style — without casually turning the people in them into someone else.',primary_cta:'Get IdentityLock AI',secondary_cta:'See how it works',trust_1:'✦ 10 copy-and-paste prompts',trust_2:'✦ Practical editing workflow',trust_3:'✦ One-time purchase'},
manifesto:{eyebrow:'THE PROBLEM WE\'RE SOLVING',title_line1:'You asked for a new outfit.',title_line2:'The AI gave you a new face.',body:'IdentityLock AI gives you a structured way to describe what can change, what must stay, and how to review the result. Because a styling edit should still look like you.'},
steps:{eyebrow:'A SIMPLE, REPEATABLE WORKFLOW',title:'Three steps. More control.',step1_title:'Start with your reference',step1_body:'Upload a clear original photo and identify the person or people you want to preserve.',step2_title:'Describe the transformation',step2_body:'Choose clothing, accessories, makeup, hairstyle or background changes — only what you authorize.',step3_title:'Edit, compare, refine',step3_body:'Use localized editing where available, protect face regions and inspect the result before sharing.'},
bundle:{eyebrow:'THE COMPLETE PROMPT BUNDLE',title:'Everything you need to direct the edit.',body:'A practical prompt library and customer guide for everyday creators and professional workflows.',items:'IdentityLock Master Engine\nTraditional Wedding Transformation\nCorporate Wardrobe Transformation\nLuxury Fashion Transformation\nMakeup & Beauty Transformation\nHairstyle Transformation\nCouple Image Composition\nBackground-Only Transformation\nImage Quality Enhancement\nIdentity Correction & Re-Editing\nCustomer guide, workflow & QA checklist'},
honest:{eyebrow:'A NOTE ON REALISTIC RESULTS',title:'Better direction. Not a magic guarantee.',body:'Generative image tools can still alter details. IdentityLock AI is a prompt-and-workflow toolkit, not a proprietary model or a guarantee of pixel-perfect preservation. We teach reference use, localized masking and careful review to reduce unwanted changes.'},
buy:{eyebrow:'ONE PURCHASE. YOUR COMPLETE BUNDLE.',title:'Make the change you asked for.',bundle_title:'IDENTITYLOCK AI COMPLETE BUNDLE',features:'10 reusable transformation prompts\nCustomer quick-start guide\nTechnical editing workflow\nIdentity preservation QA checklist\nTroubleshooting guide\nInstant access after verified payment'},
faq:{eyebrow:'GOOD TO KNOW',title:'Frequently asked questions',items_json:JSON.stringify([{q:'Will this guarantee my face never changes?',a:'No. No text prompt can guarantee pixel-perfect identity preservation across all generative tools. The bundle prioritizes preservation and explains techniques that can reduce unwanted changes.'},{q:'Which AI tools can I use?',a:'The prompts are designed to be adapted to image-editing tools that accept reference images. Features such as masking and localized inpainting depend on the platform.'},{q:'Do I need design experience?',a:'No. The customer guide walks you through uploading a reference, describing the edit and checking the result.'},{q:'How do I receive the files?',a:'After successful payment verification, you\'ll receive access to the digital bundle through the secure delivery flow.'},{q:'Is this a subscription?',a:'No. The listed price is a one-time payment for the current bundle.'}])}
};
let homeRenderToken=0;
function renderHomeFields(data){
 homeDraft=structuredClone(data||homeDefaults);
 const root=$('homeFields'),token=++homeRenderToken;
 if(root.dataset.bound!=='true'){
  root.addEventListener('input',event=>{
   const field=event.target.closest('[data-home-field]');
   if(!field)return;
   const [group,key]=field.dataset.homeField.split('.');
   homeDraft[group]??={};homeDraft[group][key]=field.value;
  });
  root.dataset.bound='true';
 }
 root.replaceChildren();
 let index=0;
 const renderNextGroup=()=>{
  if(token!==homeRenderToken)return;
  const [key,title,...items]=HOME_FIELDS[index++];
  if(!key)return;
  const section=document.createElement('section');section.className='home-group';
  const heading=document.createElement('h3');heading.textContent=title;
  const grid=document.createElement('div');grid.className='home-grid';
  for(const [field,label] of items){
   const wrapper=document.createElement('label');wrapper.append(document.createTextNode(label));
   const textarea=document.createElement('textarea');
   textarea.rows=field==='items_json'?10:(field==='items'||field==='features'?7:(['body','intro'].includes(field)?3:2));
   textarea.dataset.homeField=key+'.'+field;
   textarea.value=homeDraft[key]?.[field]??'';
   wrapper.append(textarea);grid.append(wrapper);
  }
  section.append(heading,grid);root.append(section);
  if(index<HOME_FIELDS.length)requestAnimationFrame(renderNextGroup);
 };
 if(HOME_FIELDS.length)requestAnimationFrame(renderNextGroup);
}
function collectHomeFields(){
 const next=structuredClone(homeDraft);
 try{JSON.parse(next.faq.items_json)}catch(e){throw new Error('FAQ editor must contain valid JSON. Keep each question and answer in q/a fields.')}
 return next;
}
async function loadHomepage(){const {data:draft,error:draftError}=await db.from('site_settings').select('value').eq('key','homepage_draft').maybeSingle();if(draftError){msg('homeMsg','Could not load homepage draft: '+draftError.message);return}if(draft?.value){renderHomeFields(draft.value);msg('homeMsg','Unpublished draft loaded. Publish it to update the public homepage.');return}const {data:live,error:liveError}=await db.from('site_settings').select('value').eq('key','homepage_content').maybeSingle();if(liveError){msg('homeMsg','Could not load published homepage: '+liveError.message);renderHomeFields(homeDefaults);return}renderHomeFields(live?.value||homeDefaults);msg('homeMsg',live?.value?'Published homepage content loaded.':'Default homepage content loaded. Save a draft to prepare your first update.')}
async function saveHomepage(publish){let value;try{value=collectHomeFields()}catch(e){msg('homeMsg',e.message);return}const rows=publish?[{key:'homepage_content',value,is_public:true,updated_by:user.id},{key:'homepage_draft',value,is_public:false,updated_by:user.id}]:[{key:'homepage_draft',value,is_public:false,updated_by:user.id}];const {data,error}=await db.from('site_settings').upsert(rows,{onConflict:'key'}).select('key');if(error){msg('homeMsg','Save failed: '+error.message);return}const saved=new Set((data||[]).map(row=>row.key));if(!saved.has('homepage_draft')||(publish&&!saved.has('homepage_content'))){msg('homeMsg','Save could not be verified. Refresh the manager and check Supabase permissions.');return}try{await audit(publish?'publish':'save','homepage','homepage_content',{status:publish?'published':'draft'})}catch(auditError){console.warn('Homepage saved, but audit entry failed.',auditError)}msg('homeMsg',publish?'Published and verified. The public homepage now has this content. Refresh the public website to view it.':'Draft saved privately. Use Preview homepage to review it before publishing.')}
$('homeReload').onclick=loadHomepage;$('homePreview').onclick=()=>window.open('/?preview=homepage','_blank','noopener');$('homeSave').onclick=()=>saveHomepage(false);$('homePublish').onclick=()=>saveHomepage(true);

document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.add('hidden'));$(b.dataset.tab).classList.remove('hidden');document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));$('heading').textContent=b.textContent});