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
async function audit(action,type,id,details={}){await db.from('admin_audit_log').insert({actor_id:user.id,action,entity_type:type,entity_id:String(id||''),details})}async function load(){await Promise.all([loadPages(),loadMedia(),loadProjects(),loadSettings(),loadLogs(),loadHomepage(),loadPromptCatalogue()])}async function loadPages(){let {data,error}=await db.from('site_pages').select('*').order('updated_at',{ascending:false});if(error){msg('pageMsg',error.message);return}pages=data||[];$('count').textContent=pages.length;$('published').textContent=pages.filter(x=>x.status==='published').length;$('drafts').textContent=pages.filter(x=>x.status==='draft').length;$('list').innerHTML=pages.map(x=>`<button class="page ${chosen?.id===x.id?'active':''}" data-id="${x.id}"><b>${esc(x.title)}</b><small>/${esc(x.slug)} · ${x.status}</small></button>`).join('')||'<p>No pages yet.</p>';$('recent').innerHTML=pages.slice(0,6).map(x=>`<p>${esc(x.title)} — ${x.status}</p>`).join('')||'<p>No pages yet.</p>';document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>choose(b.dataset.id))}function choose(id){chosen=pages.find(x=>x.id===id);$('form').classList.remove('hidden');$('editTitle').textContent='Edit page';$('title').value=chosen.title;$('slug').value=chosen.slug;$('seo').value=chosen.seo?.description||'';$('body').innerHTML=DOMPurify.sanitize(chosen.content?.html||'');$('status').value=chosen.status;document.querySelectorAll('.page').forEach(b=>b.classList.toggle('active',b.dataset.id===id))}function fresh(){chosen=null;$('form').classList.remove('hidden');$('editTitle').textContent='New page';['title','slug','seo'].forEach(id=>$(id).value='');$('body').innerHTML='';$('status').value='draft';document.querySelectorAll('.page').forEach(b=>b.classList.remove('active'))}$('new').onclick=$('newTop').onclick=fresh;document.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>{let c=b.dataset.cmd;if(c==='createLink'){let u=prompt('HTTPS link URL');if(u&&/^https:\/\//i.test(u))document.execCommand(c,false,u)}else document.execCommand(c,false,b.dataset.value||null)});async function save(status){let title=$('title').value.trim(),slug=$('slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'');if(!title||!slug){msg('pageMsg','Title and URL slug are required.');return}let payload={title,slug,status,content:{html:DOMPurify.sanitize($('body').innerHTML,{USE_PROFILES:{html:true}})},seo:{description:$('seo').value.trim()},updated_by:user.id};let q=chosen?db.from('site_pages').update(payload).eq('id',chosen.id).select().single():db.from('site_pages').insert(payload).select().single();let {data,error}=await q;if(error){msg('pageMsg',error.message);return}chosen=data;await audit(status==='published'?'publish':'save','page',data.id,{title,slug,status});msg('pageMsg',status==='published'?'Page published.':'Draft saved.');await loadPages();choose(data.id)}$('save').onclick=()=>save('draft');$('publish').onclick=()=>save('published');let mediaFiles=[],mediaCatalog=[],mediaProjects=[],activeProjectId='',editingProjectId='';
const MEDIA_MAX_BYTES=20*1024*1024,MEDIA_BUCKET='identitylock-media';
const MEDIA_TYPES=['image/jpeg','image/png','image/webp','image/gif'];
const sha256=async file=>{const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('')};
const mediaUrl=path=>db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
const catalogByPath=path=>mediaCatalog.find(x=>x.storage_path===path);
function renderMedia(){
 const query=($('mediaSearch')?.value||'').trim().toLowerCase(),type=$('mediaType')?.value||'all';
 const filtered=mediaFiles.filter(f=>{const c=catalogByPath(f.name),mime=c?.mime_type||f.metadata?.mimetype||'';const hay=[f.name,c?.category,...(c?.tags||[])].join(' ').toLowerCase();return(!query||hay.includes(query))&&(type==='all'||mime===type)});
 $('mediaCount').textContent=mediaFiles.length;
 $('gallery').innerHTML=filtered.map(f=>{const c=catalogByPath(f.name),url=mediaUrl(f.name),mime=c?.mime_type||f.metadata?.mimetype||'image/*',size=Number(c?.size_bytes||f.metadata?.size||0);
 const category=c?.category||'general',tags=(c?.tags||[]).join(', ');
 return `<article class="media-card"><a class="media-preview" href="${esc(url)}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(url)}" alt="${esc(c?.alt_text||f.name)}"></a><div class="media-card-info"><b title="${esc(f.name)}">${esc(c?.file_name||f.name)}</b><small>${esc(mime.replace('image/','').toUpperCase())} · ${size?(size/1048576).toFixed(2)+' MB':'Size unavailable'}</small>
 <label>Category<input class="media-category" data-path="${esc(f.name)}" value="${esc(category)}" maxlength="60"></label><label>Tags (comma-separated)<input class="media-tags" data-path="${esc(f.name)}" value="${esc(tags)}" placeholder="portrait, retouch"></label><label>Alt text<input class="media-alt" data-path="${esc(f.name)}" value="${esc(c?.alt_text||'')}" maxlength="240"></label>
 <div class="media-card-actions"><button type="button" class="save-media-meta" data-path="${esc(f.name)}">Save details</button><button type="button" class="copy-media-url secondary" data-url="${esc(url)}">Copy URL</button></div></div></article>`;
 }).join('')||'<p class="muted">No matching images. Try another search or upload files.</p>';
 document.querySelectorAll('.save-media-meta').forEach(b=>b.onclick=()=>saveMediaMeta(b.dataset.path));
 document.querySelectorAll('.copy-media-url').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.url);b.textContent='Copied'}catch(e){msg('mediaMsg','Clipboard unavailable. Open the image and copy its address.')}});
}
async function saveMediaMeta(path){
 const card=document.querySelector('.save-media-meta[data-path="'+CSS.escape(path)+'"]')?.closest('.media-card');if(!card)return;
 const file=mediaFiles.find(x=>x.name===path),old=catalogByPath(path);if(!file)return;
 const category=card.querySelector('.media-category').value.trim()||'general',tags=card.querySelector('.media-tags').value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,30),alt_text=card.querySelector('.media-alt').value.trim();
 const row={storage_path:path,file_name:old?.file_name||path,mime_type:old?.mime_type||file.metadata?.mimetype||'image/jpeg',size_bytes:Number(old?.size_bytes||file.metadata?.size||1),category,tags,alt_text,metadata:old?.metadata||{},uploaded_by:old?.uploaded_by||user.id};
 const {data,error}=await db.from('identitylock_media_items').upsert(row,{onConflict:'storage_path'}).select().single();
 if(error){msg('mediaMsg','Could not save image details: '+error.message);return}
 mediaCatalog=mediaCatalog.filter(x=>x.storage_path!==path);mediaCatalog.push(data);msg('mediaMsg','Image details saved.');renderMedia();await audit('update','media',path,{category,tags});
}
async function loadMedia(){
 msg('mediaMsg','Loading media library…');
 const [{data,error},{data:catalog,error:catalogError}]=await Promise.all([
 db.storage.from(MEDIA_BUCKET).list('',{limit:1000,sortBy:{column:'created_at',order:'desc'}}),
 db.from('identitylock_media_items').select('*').order('created_at',{ascending:false})
 ]);
 if(error){msg('mediaMsg','Could not load Storage: '+error.message);return}
 if(catalogError){msg('mediaMsg','Storage loaded, but media catalogue could not load: '+catalogError.message);return}
 mediaCatalog=catalog||[];const allFiles=new Map();for(const item of mediaCatalog)allFiles.set(item.storage_path,{name:item.storage_path,metadata:{mimetype:item.mime_type,size:item.size_bytes}});for(const item of (data||[]))if(item.id&&item.name&&!item.name.endsWith('/'))allFiles.set(item.name,{...item,name:item.name});mediaFiles=Array.from(allFiles.values());renderMedia();if(typeof renderProjects==='function')renderProjects();
 msg('mediaMsg',mediaFiles.length+' files · '+mediaCatalog.length+' catalogued images.');
}
async function storeMediaFile(file){
 if(!MEDIA_TYPES.includes(file.type)){throw new Error('Unsupported image format. Use JPG, PNG, WebP or GIF.')}
 if(file.size<=0||file.size>MEDIA_MAX_BYTES)throw new Error('Image must be larger than zero and no more than 20 MB.');
 const hash=await sha256(file),duplicate=mediaCatalog.find(x=>x.content_hash===hash);
 if(duplicate){const reuse=confirm('Exact duplicate detected: "'+duplicate.file_name+'". Reuse the existing library image instead of uploading another copy?');if(reuse)return {reused:true,item:duplicate};}
 const safeName=file.name.normalize('NFKD').replace(/[^\w.-]/g,'-').replace(/-+/g,'-').slice(-120)||'image';
 const path=Date.now()+'-'+crypto.randomUUID()+'-'+safeName;
 const {error}=await db.storage.from(MEDIA_BUCKET).upload(path,file,{contentType:file.type,upsert:false,cacheControl:'31536000'});
 if(error)throw new Error(error.message);
 const row={storage_path:path,file_name:file.name,mime_type:file.type,size_bytes:file.size,content_hash:hash,category:'general',tags:[],alt_text:'',uploaded_by:user.id,metadata:{source:'admin_upload'}};
 const {data,error:catalogError}=await db.from('identitylock_media_items').insert(row).select().single();
 if(catalogError){throw new Error('File uploaded but catalogue indexing failed. Original remains safely in Storage. '+catalogError.message);}
 const {error:legacyError}=await db.from('media_assets').insert({storage_path:path,file_name:file.name,mime_type:file.type,size_bytes:file.size,created_by:user.id});
 if(legacyError)console.warn('Legacy media_assets indexing skipped; new catalogue entry is saved.',legacyError);
 try{await audit('upload','media',path,{file_name:file.name,mime_type:file.type,size_bytes:file.size,content_hash:hash})}catch(e){console.warn('Audit entry failed',e)}
 mediaCatalog.push(data);return {reused:false,item:data};
}
$('upload').onchange=async e=>{const files=Array.from(e.target.files||[]);e.target.value='';if(!files.length)return;let ok=0,failed=0,reused=0;
 for(let i=0;i<files.length;i++){const f=files[i];$('uploadProgress').textContent='Processing '+(i+1)+' of '+files.length+': '+f.name;try{const result=await storeMediaFile(f);if(result.reused)reused++;else ok++}catch(error){failed++;msg('mediaMsg',f.name+': '+error.message)}}
 $('uploadProgress').textContent='Batch complete: '+ok+' uploaded · '+reused+' reused · '+failed+' failed.';await loadMedia();
};
$('urlImport').onclick=async()=>{const url=prompt('Paste a direct HTTPS image URL:');if(!url)return;let parsed;try{parsed=new URL(url)}catch(e){msg('mediaMsg','Enter a valid image URL.');return}if(parsed.protocol!=='https:'){msg('mediaMsg','Only HTTPS image URLs are accepted.');return}
 msg('mediaMsg','Fetching image URL…');try{const response=await fetch(parsed.href,{mode:'cors',credentials:'omit'});if(!response.ok)throw new Error('The image host returned HTTP '+response.status);const blob=await response.blob();const type=blob.type.split(';')[0].toLowerCase();if(!MEDIA_TYPES.includes(type))throw new Error('URL did not return JPG, PNG, WebP or GIF.');const name=decodeURIComponent(parsed.pathname.split('/').pop()||'imported-image').slice(0,120);const file=new File([blob],name,{type,lastModified:Date.now()});const result=await storeMediaFile(file);msg('mediaMsg',result.reused?'Existing duplicate reused.':'Image imported and catalogued.');await loadMedia()}catch(error){msg('mediaMsg','URL import failed: '+error.message+'. Some image hosts block browser imports (CORS); download the image and use Upload images instead.')}}
$('mediaSearch').oninput=renderMedia;$('mediaType').onchange=renderMedia;$('mediaRefresh').onclick=loadMedia;
async function loadProjects(){
 const {data,error}=await db.from('identitylock_media_projects').select('*').order('sort_order').order('created_at',{ascending:false});
 if(error){msg('projectMsg','Could not load projects: '+error.message);return}
 mediaProjects=data||[];renderProjects();
}
function renderProjects(){
 $('projectList').innerHTML=mediaProjects.map(p=>`<button type="button" class="project-choice ${editingProjectId===p.id?'active':''}" data-project="${p.id}"><b>${esc(p.title)}</b><small>${esc(p.category)} · ${p.status}</small></button>`).join('')||'<p class="muted">No projects yet. Create your first project.</p>';
 $('pairProject').innerHTML='<option value="">Choose a project</option>'+mediaProjects.map(p=>`<option value="${p.id}">${esc(p.title)}</option>`).join('');
 document.querySelectorAll('[data-project]').forEach(b=>b.onclick=()=>editProject(b.dataset.project));
 const options=mediaCatalog.map(m=>`<option value="${m.id}">${esc(m.file_name)} · ${esc(m.category)}</option>`).join('');
 $('pairBefore').innerHTML='<option value="">Choose an image</option>'+options;$('pairAfter').innerHTML='<option value="">Choose an image</option>'+options;
}
function editProject(id){
 const p=mediaProjects.find(x=>x.id===id);if(!p)return;editingProjectId=id;
 $('projectEditorTitle').textContent='Edit project';$('projectTitle').value=p.title;$('projectSlug').value=p.slug;$('projectCategory').value=p.category;$('projectDescription').value=p.description;$('saveProject').textContent='Save changes';renderProjects();
}
$('newProject').onclick=()=>{editingProjectId='';$('projectEditorTitle').textContent='Create a project';$('projectForm').reset();$('projectCategory').value='general';$('saveProject').textContent='Save project';renderProjects()};
$('projectTitle').oninput=()=>{if(!editingProjectId)$('projectSlug').value=$('projectTitle').value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')};
$('projectForm').onsubmit=async e=>{
 e.preventDefault();const title=$('projectTitle').value.trim(),slug=$('projectSlug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'');
 if(!title||!slug){msg('projectMsg','Project title and slug are required.');return}
 const payload={title,slug,category:$('projectCategory').value.trim()||'general',description:$('projectDescription').value.trim(),updated_by:user.id};
 const query=editingProjectId?db.from('identitylock_media_projects').update(payload).eq('id',editingProjectId):db.from('identitylock_media_projects').insert({...payload,created_by:user.id});
 const {data,error}=await query.select().single();if(error){msg('projectMsg','Could not save project: '+error.message);return}
 editingProjectId=data.id;await audit('save','media_project',data.id,{title,slug});msg('projectMsg','Project saved.');await loadProjects();editProject(data.id);
};
$('pairProject').onchange=async()=>{activeProjectId=$('pairProject').value;await loadPairs()};
$('pairForm').onsubmit=async e=>{
 e.preventDefault();const projectId=$('pairProject').value,before=$('pairBefore').value,after=$('pairAfter').value;
 if(!projectId){msg('pairMsg','Create or select a project first.');return}if(!before||!after||before===after){msg('pairMsg','Choose two different images for the before and after pair.');return}
 const {data:existing}=await db.from('identitylock_comparison_pairs').select('sort_order').eq('project_id',projectId).order('sort_order',{ascending:false}).limit(1);
 const row={project_id:projectId,original_media_id:before,transformed_media_id:after,title:$('pairTitle').value.trim(),description:$('pairDescription').value.trim(),disclaimer:$('pairDisclaimer').value.trim(),sort_order:(existing?.[0]?.sort_order??-1)+1};
 const {data,error}=await db.from('identitylock_comparison_pairs').insert(row).select().single();if(error){msg('pairMsg','Could not create pair: '+error.message);return}
 await audit('create','comparison_pair',data.id,{project_id:projectId});msg('pairMsg','Before/after pair created.');$('pairForm').reset();$('pairProject').value=projectId;activeProjectId=projectId;await loadPairs();
};
async function loadPairs(){
 const projectId=$('pairProject').value;if(!projectId){$('pairList').innerHTML='<p class="muted">Select a project to manage its pairs.</p>';return}
 const {data,error}=await db.from('identitylock_comparison_pairs').select('*,before:identitylock_media_items!identitylock_comparison_pairs_original_media_id_fkey(id,file_name,storage_path),after:identitylock_media_items!identitylock_comparison_pairs_transformed_media_id_fkey(id,file_name,storage_path)').eq('project_id',projectId).order('sort_order');
 if(error){msg('pairMsg','Could not load comparison pairs: '+error.message);return}
 const rows=data||[];$('pairList').innerHTML=rows.map((p,i)=>`<article class="pair-row"><div class="pair-thumbs"><img src="${esc(mediaUrl(p.before.storage_path))}" alt="Before"><span>→</span><img src="${esc(mediaUrl(p.after.storage_path))}" alt="After"></div><div class="pair-copy"><b>${esc(p.title||'Untitled comparison')}</b><p>${esc(p.description||'')}</p><small>${esc(p.before.file_name)} → ${esc(p.after.file_name)}</small></div><div class="pair-order"><button type="button" data-pair-up="${p.id}" ${i===0?'disabled':''}>↑</button><button type="button" data-pair-down="${p.id}" ${i===rows.length-1?'disabled':''}>↓</button></div></article>`).join('')||'<p class="muted">No comparison pairs in this project yet.</p>';
 document.querySelectorAll('[data-pair-up]').forEach(b=>b.onclick=()=>movePair(b.dataset.pairUp,-1,rows));document.querySelectorAll('[data-pair-down]').forEach(b=>b.onclick=()=>movePair(b.dataset.pairDown,1,rows));
}
async function movePair(id,delta,rows){const i=rows.findIndex(x=>x.id===id),j=i+delta;if(i<0||j<0||j>=rows.length)return;const a=rows[i],b=rows[j];const {error}=await db.rpc('swap_identitylock_comparison_pair_order',{first_pair_id:a.id,second_pair_id:b.id});if(error){msg('pairMsg','Could not reorder pair: '+error.message);return}await loadPairs();await audit('reorder','comparison_pair',id,{project_id:activeProjectId})}
async function loadSettings(){let {data}=await db.from('site_settings').select('key,value').in('key',['announcement','contact_email','footer_text']);let v=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));$('announcement').value=v.announcement?.text||'';$('contact').value=v.contact_email?.text||'';$('footer').value=v.footer_text?.text||''}$('saveSettings').onclick=async()=>{let rows=[['announcement',$('announcement').value],['contact_email',$('contact').value],['footer_text',$('footer').value]].map(([key,text])=>({key,value:{text},is_public:true,updated_by:user.id}));let {error}=await db.from('site_settings').upsert(rows);if(error){msg('settingsMsg',error.message);return}await audit('update','settings','global');msg('settingsMsg','Settings saved.')};async function loadLogs(){let {data}=await db.from('admin_audit_log').select('action,entity_type,entity_id,created_at').order('created_at',{ascending:false}).limit(50);$('logs').innerHTML=(data||[]).map(x=>`<p>${esc(x.action)} · ${esc(x.entity_type)} ${esc(x.entity_id)} <small>${new Date(x.created_at).toLocaleString()}</small></p>`).join('')||'<p>No activity yet.</p>'}
const HOME_FIELDS=[["visual","Hero comparison — images & captions",["title","Comparison heading"],["original_label","Original image label"],["original_caption","Original image caption"],["original_image_url","Original image URL (HTTPS; optional)"],["new_label","New look image label"],["new_caption","New look image caption"],["new_image_url","New look image URL (HTTPS; optional)"],["disclaimer","Comparison disclaimer"]],["hero","Hero section",["eyebrow","Top label"],["title_line1","Headline — first line"],["title_line2","Headline — second line"],["intro","Introduction"],["primary_cta","Main button text"],["secondary_cta","Secondary button text"],["trust_1","Trust point 1"],["trust_2","Trust point 2"],["trust_3","Trust point 3"]],["manifesto","Problem section",["eyebrow","Section label"],["title_line1","Headline — first line"],["title_line2","Headline — second line"],["body","Description"]],["steps","How it works",["eyebrow","Section label"],["title","Section heading"],["step1_title","Step 1 title"],["step1_body","Step 1 description"],["step2_title","Step 2 title"],["step2_body","Step 2 description"],["step3_title","Step 3 title"],["step3_body","Step 3 description"]],["bundle","What's included",["eyebrow","Section label"],["title","Heading"],["body","Description"],["items","Bundle items — one per line"]],["honest","Realistic results",["eyebrow","Section label"],["title","Heading"],["body","Description"]],["buy","Purchase section",["eyebrow","Section label"],["title","Heading"],["bundle_title","Bundle name"],["features","Purchase features — one per line"]],["faq","Frequently asked questions",["eyebrow","Section label"],["title","Heading"],["items_json","FAQ editor — JSON question/answer pairs"]]];
let homeDraft={};
const homeDefaults={
visual:{title:'ONE PERSON. A DIFFERENT LOOK.',original_label:'YOUR ORIGINAL',new_label:'YOUR NEW LOOK',original_caption:'Start with the photo you want to keep.',new_caption:'Change the styling — not the person.',disclaimer:'Illustrative example, not a guarantee of exact identity retention. Results vary by image and editing platform.',original_image_url:'',new_image_url:''},
hero:{eyebrow:'THE IDENTITY-PRESERVING PHOTO WORKFLOW',title_line1:'Change the look.',title_line2:'Keep the person.',intro:'Choose any 10 identity-first styling prompts from a growing library of traditional, corporate, celebration and formal looks.',primary_cta:'Choose any 10 prompts',secondary_cta:'See how it works',trust_1:'✦ 16 prompts to choose from',trust_2:'✦ Identity-first styling rules',trust_3:'✦ One-time ₦500 payment'},
manifesto:{eyebrow:'THE PROBLEM WE\'RE SOLVING',title_line1:'You asked for a new outfit.',title_line2:'The AI gave you a new face.',body:'IdentityLock AI gives you a structured way to describe what can change, what must stay, and how to review the result. Because a styling edit should still look like you.'},
steps:{eyebrow:'A SIMPLE, REPEATABLE WORKFLOW',title:'Three steps. More control.',step1_title:'Start with your reference',step1_body:'Upload a clear original photo and identify the person or people you want to preserve.',step2_title:'Choose your attire direction',step2_body:'Browse the catalogue and select the ten wardrobe looks you want to use.',step3_title:'Pay once and receive your prompts',step3_body:'Pay ₦500 securely, then copy each prompt or download your complete ten-prompt text file.'},
bundle:{eyebrow:'THE PROMPT CATALOGUE',title:'Choose the ten looks you actually want.',body:'Browse sixteen identity-first wardrobe prompts across traditional, professional, celebration, wedding and evening styles. Pick any ten for one ₦500 payment.',items:'Igbo Traditional Wedding Look\\nYoruba Traditional Wedding Look\\nHausa Traditional Attire\\nEfik / Ibibio Traditional Look\\nTraditional Ceremonial Attire\\nNigerian Corporate Executive\\nModern Corporate Professional\\nExecutive Headshot Styling\\nGraduation Portrait Look\\nBirthday Photoshoot Look\\nLuxury Dinner Look\\nChurch Wedding Guest Look\\nBridal Wedding Look\\nGroom Wedding Look\\nElegant Wedding Guest Look\\nEvening Gala Look\\n+ Copy each prompt or download all ten as a text file'},
honest:{eyebrow:'A NOTE ON REALISTIC RESULTS',title:'Better direction. Not a magic guarantee.',body:'Generative image tools can still alter details. IdentityLock AI is a prompt-and-workflow toolkit, not a proprietary model or a guarantee of pixel-perfect preservation. We teach reference use, localized masking and careful review to reduce unwanted changes.'},
buy:{eyebrow:'16 PROMPTS. PICK ANY 10. ₦500.',title:'Choose your ten. Keep the person.',bundle_title:'CHOOSE ANY 10 IDENTITYLOCK PROMPTS',features:'Choose any 10 unique prompts from the catalogue\\nTraditional, corporate, celebration and formal looks\\nIdentity-first face, body and hair preservation rules\\nCopy each prompt or copy all ten\\nDownload your selected prompts as a text file\\nInstant on-screen delivery after verified payment'},
faq:{eyebrow:'GOOD TO KNOW',title:'Frequently asked questions',items_json:JSON.stringify([{q:'What do I get for ₦500?',a:'Choose any 10 unique prompts from the published IdentityLock catalogue for one ₦500 payment.'},{q:'Can I choose which prompts I receive?',a:'Yes. Select any ten prompts across the available categories before checkout. Your order saves the exact versions you selected.'},{q:'How do I receive my prompts?',a:'After Paystack verifies your payment, the delivery page displays all ten prompts. Copy them individually, copy all ten, or download a text file.'},{q:'Will these prompts guarantee my face never changes?',a:'No text prompt can guarantee pixel-perfect identity preservation across every image tool. IdentityLock prompts prioritize preserving the original face, body and hair while directing wardrobe changes.'},{q:'Is this a subscription?',a:'No. It is a one-time ₦500 payment for the ten prompts you select.'}])}

};
let homeRenderToken=0;
function renderHomeFields(data){
 homeDraft=structuredClone(homeDefaults);
 for(const [group,value] of Object.entries(data||{})){
  if(value&&typeof value==='object'&&!Array.isArray(value))homeDraft[group]={...(homeDraft[group]||{}),...value};
  else homeDraft[group]=value;
 }
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
/* Prompt catalogue management: append-only versions, no destructive deletes. */
let promptCategories=[],promptRows=[],selectedPromptAdmin=null,selectedPromptVersions=[];
const promptSlug=value=>String(value||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,140);
function renderPromptCategoryOptions(selectedId=''){
 const select=$('promptAdminCategory');
 select.innerHTML='<option value="">Choose a category</option>'+promptCategories.map(category=>'<option value="'+esc(category.id)+'">'+esc(category.name)+(category.is_active?'':' (inactive)')+'</option>').join('');
 select.value=selectedId||'';
}
function renderCategoryAdmin(){
 $('categoryAdminList').innerHTML=promptCategories.map(category=>'<div class="catalogue-category-row"><button type="button" class="catalogue-category '+(category.id===$('categoryAdminId').value?'active':'')+'" data-category-edit="'+esc(category.id)+'"><span class="state">'+(category.is_active?'Active':'Inactive')+'</span><b>'+esc(category.name)+'</b><small>/'+esc(category.slug)+' · '+Number(category.sort_order||0)+'</small></button></div>').join('')||'<p class="muted">No categories yet. Create one before adding prompts.</p>';
 document.querySelectorAll('[data-category-edit]').forEach(button=>button.onclick=()=>editPromptCategory(button.dataset.categoryEdit));
 renderPromptCategoryOptions($('promptAdminCategory').value);
}
function renderPromptAdminList(){
 const query=($('promptAdminSearch').value||'').trim().toLowerCase();
 const filtered=promptRows.filter(prompt=>{
  const category=promptCategories.find(item=>item.id===prompt.category_id);
  return !query||[prompt.title,prompt.slug,prompt.short_description,category?.name,...(prompt.tags||[])].join(' ').toLowerCase().includes(query);
 });
 $('promptAdminCount').textContent=promptRows.length+' prompts';
 $('promptAdminList').innerHTML=filtered.map(prompt=>{
  const category=promptCategories.find(item=>item.id===prompt.category_id);
  return '<button type="button" class="catalogue-prompt '+(selectedPromptAdmin?.id===prompt.id?'active':'')+'" data-prompt-edit="'+esc(prompt.id)+'"><span class="state">'+esc(prompt.status)+'</span><b>'+esc(prompt.title)+'</b><small>'+esc(category?.name||'Uncategorised')+' · v'+(prompt.current_version_id?'saved':'missing')+'</small></button>';
 }).join('')||'<p class="muted">No prompts match this search. Create your first prompt.</p>';
 document.querySelectorAll('[data-prompt-edit]').forEach(button=>button.onclick=()=>editPromptAdmin(button.dataset.promptEdit));
}
async function loadPromptCatalogue(){
 if(!db||!user)return;
 msg('promptAdminMsg','Loading prompt catalogue…');
 const [categories,prompts]=await Promise.all([
  db.from('identitylock_prompt_categories').select('*').order('sort_order').order('name'),
  db.from('identitylock_prompts').select('*').order('sort_order').order('title')
 ]);
 if(categories.error){msg('promptAdminMsg','Could not load categories: '+categories.error.message);return}
 if(prompts.error){msg('promptAdminMsg','Could not load prompts: '+prompts.error.message);return}
 promptCategories=categories.data||[];
 promptRows=prompts.data||[];
 renderCategoryAdmin();
 renderPromptAdminList();
 msg('promptAdminMsg',promptRows.length+' prompts across '+promptCategories.length+' categories. Full prompt text is admin-only.');
}
function newPromptCategory(){
 $('categoryAdminForm').classList.remove('hidden');$('categoryAdminForm').reset();
 $('categoryAdminId').value='';$('categoryAdminTitle').textContent='New category';
 $('categoryAdminSort').value=String(promptCategories.length*10);$('categoryAdminActive').checked=true;
 msg('categoryAdminMsg','');
}
function editPromptCategory(id){
 const category=promptCategories.find(item=>item.id===id);if(!category)return;
 $('categoryAdminForm').classList.remove('hidden');$('categoryAdminTitle').textContent='Edit category';
 $('categoryAdminId').value=category.id;$('categoryAdminName').value=category.name;
 $('categoryAdminSlug').value=category.slug;$('categoryAdminDescription').value=category.description||'';
 $('categoryAdminSort').value=category.sort_order??0;$('categoryAdminActive').checked=!!category.is_active;
 msg('categoryAdminMsg','');
}
$('newCategory').onclick=newPromptCategory;
$('categoryAdminCancel').onclick=()=>{$('categoryAdminForm').classList.add('hidden');msg('categoryAdminMsg','')};
$('categoryAdminName').oninput=()=>{if(!$('categoryAdminId').value)$('categoryAdminSlug').value=promptSlug($('categoryAdminName').value)};
$('categoryAdminForm').onsubmit=async event=>{
 event.preventDefault();
 const id=$('categoryAdminId').value,name=$('categoryAdminName').value.trim(),slug=promptSlug($('categoryAdminSlug').value);
 if(!name||!slug){msg('categoryAdminMsg','Category name and a valid URL slug are required.');return}
 const payload={name,slug,description:$('categoryAdminDescription').value.trim(),sort_order:Number.parseInt($('categoryAdminSort').value,10)||0,is_active:$('categoryAdminActive').checked};
 const query=id?db.from('identitylock_prompt_categories').update(payload).eq('id',id):db.from('identitylock_prompt_categories').insert(payload);
 const {data,error}=await query.select().single();
 if(error){msg('categoryAdminMsg','Could not save category: '+error.message);return}
 await audit(id?'update':'create','prompt_category',data.id,{name,slug,is_active:payload.is_active});
 msg('categoryAdminMsg','Category saved.');
 await loadPromptCatalogue();editPromptCategory(data.id);
};
function newPromptAdmin(){
 if(!promptCategories.length){msg('promptAdminMsg','Create a category first, then add prompts.');return}
 selectedPromptAdmin=null;selectedPromptVersions=[];renderPromptAdminList();
 $('promptAdminForm').classList.remove('hidden');$('promptAdminForm').reset();
 $('promptEditorTitle').textContent='New prompt';$('promptAdminId').value='';
 $('promptAdminSort').value=String((Math.max(-1,...promptRows.map(p=>Number(p.sort_order)||0))+1));
 renderPromptCategoryOptions(promptCategories.find(c=>c.is_active)?.id||promptCategories[0].id);
 $('archivePrompt').hidden=true;$('promptVersionHistory').replaceChildren();msg('promptAdminMsg','New prompt starts as a draft. Saving creates version 1.');
}
async function editPromptAdmin(id){
 const prompt=promptRows.find(item=>item.id===id);if(!prompt)return;
 selectedPromptAdmin=prompt;
 const {data,error}=await db.from('identitylock_prompt_versions').select('id,version_number,prompt_text,change_note,created_at').eq('prompt_id',id).order('version_number',{ascending:false});
 if(error){msg('promptAdminMsg','Could not load prompt versions: '+error.message);return}
 selectedPromptVersions=data||[];
 const current=selectedPromptVersions.find(version=>version.id===prompt.current_version_id)||selectedPromptVersions[0];
 $('promptAdminForm').classList.remove('hidden');$('promptEditorTitle').textContent='Edit prompt · '+prompt.title;
 $('promptAdminId').value=prompt.id;$('promptAdminTitle').value=prompt.title;$('promptAdminSlug').value=prompt.slug;
 renderPromptCategoryOptions(prompt.category_id);
 $('promptAdminDescription').value=prompt.short_description||'';
 $('promptAdminTags').value=(prompt.tags||[]).join(', ');$('promptAdminSort').value=prompt.sort_order??0;
 $('promptAdminText').value=current?.prompt_text||'';$('promptAdminVersionNote').value='';
 $('archivePrompt').hidden=prompt.status==='archived';
 $('promptVersionHistory').innerHTML='<h4>Saved versions</h4>'+(selectedPromptVersions.map(version=>'<div class="prompt-version-row"><b>Version '+version.version_number+'</b>'+(version.id===prompt.current_version_id?' · Current':'')+'<small>'+esc(version.change_note||'No change note')+' · '+new Date(version.created_at).toLocaleString()+'</small></div>').join('')||'<p class="muted">No saved versions yet.</p>');
 renderPromptAdminList();msg('promptAdminMsg','Current saved version: '+(current?'v'+current.version_number:'none')+'. New saves create a new immutable version.');
}
$('newPrompt').onclick=newPromptAdmin;
$('promptAdminTitle').oninput=()=>{if(!$('promptAdminId').value)$('promptAdminSlug').value=promptSlug($('promptAdminTitle').value)};
$('promptAdminForm').onsubmit=event=>{event.preventDefault();savePromptAdmin('draft')};
$('publishPrompt').onclick=()=>savePromptAdmin('published');
async function savePromptAdmin(targetStatus){
 const id=$('promptAdminId').value,title=$('promptAdminTitle').value.trim(),slug=promptSlug($('promptAdminSlug').value);
 const categoryId=$('promptAdminCategory').value,promptText=$('promptAdminText').value.trim();
 const category=promptCategories.find(item=>item.id===categoryId);
 if(!title||!slug||!categoryId||!promptText){msg('promptAdminMsg','Title, slug, category and full prompt text are required.');return}
 if(targetStatus==='published'&&!category?.is_active){msg('promptAdminMsg','Activate this category before publishing the prompt.');return}
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){msg('promptAdminMsg','Use a lowercase URL slug with letters, numbers and hyphens.');return}
 let promptId=id;
 if(!promptId){
  const {data,error}=await db.from('identitylock_prompts').insert({title,slug,category_id:categoryId,short_description:$('promptAdminDescription').value.trim(),tags:$('promptAdminTags').value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,30),sort_order:Number.parseInt($('promptAdminSort').value,10)||0,status:'draft',current_version_id:null,created_by:user.id,updated_by:user.id}).select().single();
  if(error){msg('promptAdminMsg','Could not create prompt: '+error.message);return}
  promptId=data.id;$('promptAdminId').value=promptId;
 }
 const {data:versions,error:versionsError}=await db.from('identitylock_prompt_versions').select('version_number').eq('prompt_id',promptId).order('version_number',{ascending:false}).limit(1);
 if(versionsError){msg('promptAdminMsg','Prompt exists, but version history could not load: '+versionsError.message);return}
 const nextVersion=(versions?.[0]?.version_number||0)+1;
 const {data:version,error:versionError}=await db.from('identitylock_prompt_versions').insert({prompt_id:promptId,version_number:nextVersion,prompt_text:promptText,change_note:$('promptAdminVersionNote').value.trim(),created_by:user.id}).select().single();
 if(versionError){msg('promptAdminMsg','Prompt record is safe, but version '+nextVersion+' could not be saved: '+versionError.message);return}
 const payload={title,slug,category_id:categoryId,short_description:$('promptAdminDescription').value.trim(),tags:$('promptAdminTags').value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,30),sort_order:Number.parseInt($('promptAdminSort').value,10)||0,status:targetStatus,current_version_id:version.id,updated_by:user.id};
 const {data,error}=await db.from('identitylock_prompts').update(payload).eq('id',promptId).select().single();
 if(error){msg('promptAdminMsg','Version '+nextVersion+' was saved, but could not be made current. The previous version remains in place. Reload and retry: '+error.message);return}
 selectedPromptAdmin=data;await audit(targetStatus==='published'?'publish':'save','prompt',promptId,{title,slug,status:targetStatus,version:nextVersion});
 msg('promptAdminMsg',targetStatus==='published'?'Published version '+nextVersion+'. The public catalogue now lists this prompt.':'Saved version '+nextVersion+' as a draft. It is not visible to customers.');
 await loadPromptCatalogue();await editPromptAdmin(promptId);
}
$('archivePrompt').onclick=async()=>{
 const id=$('promptAdminId').value;if(!id)return;
 if(!confirm('Archive this prompt? It will disappear from the public catalogue, but all versions and existing customer orders remain intact.'))return;
 const {data,error}=await db.from('identitylock_prompts').update({status:'archived',updated_by:user.id}).eq('id',id).select().single();
 if(error){msg('promptAdminMsg','Could not archive prompt: '+error.message);return}
 await audit('archive','prompt',id,{title:data.title});msg('promptAdminMsg','Prompt archived. No versions or orders were deleted.');await loadPromptCatalogue();await editPromptAdmin(id);
};
$('catalogueReload').onclick=loadPromptCatalogue;
$('promptAdminSearch').oninput=renderPromptAdminList;
