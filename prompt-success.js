(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const params=new URLSearchParams(window.location.search);
  const reference=params.get('reference')||'';
  let deliveredItems=[];
  let fullText='';

  function setStatus(title,message,showRetry){
    $('statusTitle').textContent=title;
    $('statusMessage').textContent=message;
    $('retryButton').hidden=!showRetry;
    $('delivery').hidden=true;
  }

  async function copyText(value){
    if(navigator.clipboard&&window.isSecureContext){
      await navigator.clipboard.writeText(value);
      return;
    }
    const area=document.createElement('textarea');
    area.value=value;area.setAttribute('readonly','');
    area.style.position='fixed';area.style.opacity='0';
    document.body.append(area);area.select();
    const copied=document.execCommand('copy');area.remove();
    if(!copied)throw new Error('Copy is not available in this browser. You can select the prompt text and copy it manually.');
  }

  function renderDelivery(data){
    deliveredItems=data.items;
    fullText=deliveredItems.map(item=>'PROMPT '+item.position+': '+item.title+'\n\n'+item.prompt_text).join('\n\n'+'='.repeat(72)+'\n\n');
    const list=$('promptList');list.replaceChildren();
    deliveredItems.forEach(item=>{
      const card=document.createElement('article');card.className='prompt-card';
      const head=document.createElement('div');head.className='prompt-card-head';
      const title=document.createElement('h3');title.textContent=item.position+'. '+item.title;
      const copy=document.createElement('button');copy.type='button';copy.textContent='Copy prompt';
      copy.addEventListener('click',async()=>{
        try{await copyText(item.prompt_text);$('copyStatus').textContent='Prompt '+item.position+' copied.'}
        catch(error){$('copyStatus').textContent=error.message}
      });
      head.append(title,copy);
      const meta=document.createElement('small');meta.textContent=item.slug;
      const body=document.createElement('pre');body.textContent=item.prompt_text;
      card.append(head,meta,body);list.append(card);
    });
    $('paidAt').textContent=data.paid_at?'Payment verified · '+new Date(data.paid_at).toLocaleString():'Payment verified';
    $('delivery').hidden=false;
    $('statusTitle').textContent='Your 10 prompts are ready.';
    $('statusMessage').textContent='Your payment is verified. These are the exact prompt versions saved in your order.';
    $('retryButton').hidden=true;
  }

  async function load(){
    if(!/^ILP-[A-Za-z0-9]{32}$/.test(reference)){
      setStatus('We could not identify this order.','This page needs the payment reference from your Paystack return link. If you completed payment, return to the Paystack confirmation page and open its return link again.',false);
      return;
    }
    setStatus('Confirming your payment…','Please wait while we verify your ₦500 order. Do not make another payment.',false);
    $('retryButton').disabled=true;
    try{
      const verifyResponse=await fetch('/api/prompt-set-verify?reference='+encodeURIComponent(reference),{method:'GET',cache:'no-store',headers:{'Accept':'application/json'}});
      const verified=await verifyResponse.json().catch(()=>null);
      if(!verifyResponse.ok||verified?.paid!==true){
        if(verifyResponse.status===402){
          setStatus('Payment is not confirmed yet.','If your bank shows a debit, wait a little and check again. Do not pay again from this page.',true);
          return;
        }
        throw new Error(verified?.error||'We could not confirm the payment yet.');
      }
      setStatus('Payment verified. Preparing your prompts…','Your paid order is confirmed. We are retrieving the exact ten prompts saved with it.',false);
      const deliveryResponse=await fetch('/api/prompt-set-delivery?reference='+encodeURIComponent(reference),{method:'GET',cache:'no-store',headers:{'Accept':'application/json'}});
      const delivery=await deliveryResponse.json().catch(()=>null);
      if(!deliveryResponse.ok||delivery?.delivered!==true||delivery?.prompt_count!==10||!Array.isArray(delivery.items)||delivery.items.length!==10){
        if(deliveryResponse.status===404){
          setStatus('Payment verified. Your prompts are not ready yet.','Your payment is confirmed, but delivery has not completed. Wait a moment and check again. Do not pay again.',true);
          return;
        }
        throw new Error(delivery?.error||'Your prompts could not be loaded yet.');
      }
      renderDelivery(delivery);
    }catch(error){
      setStatus('We could not finish delivery yet.',error?.message||'Please check your connection and try again. Your payment status will not be lost.',true);
    }finally{
      $('retryButton').disabled=false;
    }
  }

  $('retryButton').addEventListener('click',load);
  $('copyAll').addEventListener('click',async()=>{
    try{await copyText(fullText);$('copyStatus').textContent='All 10 prompts copied.'}
    catch(error){$('copyStatus').textContent=error.message}
  });
  $('downloadAll').addEventListener('click',()=>{
    if(!fullText)return;
    const blob=new Blob([fullText],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;anchor.download='IdentityLock_AI_10_Prompts.txt';
    document.body.append(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);
    $('copyStatus').textContent='Your .TXT file has been prepared.';
  });
  load();
})();
