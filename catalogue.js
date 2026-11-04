(function(){
  'use strict';
  const SUPABASE_URL='https://zcyxoucbglsyrqzqksjc.supabase.co';
  const SUPABASE_ANON_KEY='sb_publishable_QWPzFWgH-M06RnN1dFtd0A_6AuPGk_y';
  const LIMIT=10;
  const $=id=>document.getElementById(id);
  const state={categories:[],prompts:[],selected:new Set(),category:'all',query:''};
  const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;};
  const selectedPrompts=()=>state.prompts.filter(prompt=>state.selected.has(prompt.id));
  function updateSelectionBar(){
    const count=state.selected.size;
    $('selectionCount').textContent=count+' / '+LIMIT+' selected';
    $('remainingCount').textContent=(LIMIT-count)+' remaining';
    $('progressFill').style.width=(count/LIMIT*100)+'%';
    $('reviewButton').disabled=count!==LIMIT;
    $('reviewButton').textContent=count===LIMIT?'Review my 10 prompts':'Select 10 prompts to continue';
  }
  function renderCategories(){
    const root=$('categoryFilters');
    root.replaceChildren();
    const all=el('button','category-chip'+(state.category==='all'?' active':''),'All prompts');
    all.type='button';all.setAttribute('aria-pressed',String(state.category==='all'));
    all.addEventListener('click',()=>{state.category='all';render();});
    root.append(all);
    state.categories.forEach(category=>{
      const button=el('button','category-chip'+(state.category===category.id?' active':''),category.name);
      button.type='button';button.setAttribute('aria-pressed',String(state.category===category.id));
      button.addEventListener('click',()=>{state.category=category.id;render();});
      root.append(button);
    });
  }
  function renderPromptCard(prompt){
    const category=state.categories.find(item=>item.id===prompt.category_id);
    const chosen=state.selected.has(prompt.id);
    const card=el('article','prompt-card'+(chosen?' selected':''));
    const top=el('div','prompt-card-top');
    top.append(el('span','prompt-category',category?.name||'Prompt'));
    top.append(el('span','prompt-number',String(prompt.sort_order??0).padStart(2,'0')));
    const title=el('h3','',prompt.title);
    const description=el('p','prompt-description',prompt.short_description||'A reusable IdentityLock transformation prompt.');
    const tags=el('div','prompt-tags');
    (Array.isArray(prompt.tags)?prompt.tags:[]).slice(0,4).forEach(tag=>tags.append(el('span','tag',tag)));
    const button=el('button','select-prompt'+(chosen?' chosen':''),chosen?'✓ Selected':'+ Select prompt');
    button.type='button';button.setAttribute('aria-pressed',String(chosen));
    button.addEventListener('click',()=>{
      const next=window.IdentityLockSelection.toggleSelection(state.selected,prompt.id,LIMIT);
      if(next.size===state.selected.size&&!state.selected.has(prompt.id)){
        $('loadState').textContent='You can select only 10 prompts. Remove one before choosing another.';
        $('loadState').classList.add('notice');
        return;
      }
      state.selected=next;
      $('selectionReview').hidden=true;
      render();
    });
    card.append(top,title,description,tags,button);
    return card;
  }
  function render(){
    renderCategories();
    const grid=$('promptGrid');
    grid.replaceChildren();
    const query=state.query.toLocaleLowerCase();
    const visible=state.prompts.filter(prompt=>{
      const categoryMatch=state.category==='all'||prompt.category_id===state.category;
      const haystack=[prompt.title,prompt.short_description,...(prompt.tags||[])].join(' ').toLocaleLowerCase();
      return categoryMatch&&(!query||haystack.includes(query));
    });
    visible.forEach(prompt=>grid.append(renderPromptCard(prompt)));
    if(state.prompts.length===0){
      $('loadState').textContent='No prompts have been published yet. Please check back soon.';
      $('loadState').classList.remove('notice');
    }else if(visible.length===0){
      $('loadState').textContent='No prompts match this filter. Try another category or search.';
      $('loadState').classList.remove('notice');
    }else{
      $('loadState').textContent=visible.length+' prompt'+(visible.length===1?'':'s')+' available';
      $('loadState').classList.remove('notice');
    }
    updateSelectionBar();
  }
  function openReview(){
    if(!window.IdentityLockSelection.isComplete(state.selected,LIMIT))return;
    const list=$('reviewList');list.replaceChildren();
    selectedPrompts().forEach(prompt=>list.append(el('li','',prompt.title)));
    $('selectionReview').hidden=false;
    $('selectionReview').scrollIntoView({behavior:'smooth',block:'center'});
  }
  async function loadCatalogue(){
    $('retryButton').hidden=true;
    $('loadState').textContent='Loading published prompts…';
    $('loadState').classList.remove('notice');
    try{
      const categoryResult=await db.from('identitylock_prompt_categories').select('id,slug,name,description,sort_order').eq('is_active',true).order('sort_order',{ascending:true}).order('name',{ascending:true});
      if(categoryResult.error)throw categoryResult.error;
      state.categories=categoryResult.data||[];
      if(!state.categories.length){state.prompts=[];state.selected.clear();state.category='all';render();return;}
      const ids=state.categories.map(category=>category.id);
      const promptResult=await db.from('identitylock_prompts').select('id,slug,title,short_description,category_id,sort_order,tags').eq('status','published').in('category_id',ids).order('sort_order',{ascending:true}).order('title',{ascending:true});
      if(promptResult.error)throw promptResult.error;
      state.prompts=promptResult.data||[];
      const eligible=new Set(state.prompts.map(prompt=>prompt.id));
      state.selected=new Set([...state.selected].filter(id=>eligible.has(id)));
      render();
    }catch(error){
      console.error('Catalogue load failed',error);
      $('loadState').textContent='We could not load the prompt library. Check your connection and try again.';
      $('loadState').classList.add('notice');
      $('retryButton').hidden=false;
      $('promptGrid').replaceChildren();
      updateSelectionBar();
    }
  }
  $('searchInput').addEventListener('input',event=>{state.query=event.target.value.trim();render();});
  $('reviewButton').addEventListener('click',openReview);
  $('closeReview').addEventListener('click',()=>$('selectionReview').hidden=true);
  $('retryButton').addEventListener('click',loadCatalogue);
  loadCatalogue();
})();