(() => {
  'use strict';
  const approved=[
    'Oi!','Vamos brincar?','Quer correr?','Vamos estudar juntos?','Boa jogada!','Parabéns!','Até logo!','Vamos visitar minha casa?','Vamos pescar?','Vamos construir?'
  ];
  function containsPrivateData(text=''){
    const value=String(text);
    return /(?:https?:\/\/|www\.|@[a-z0-9.-]+\.|\b\d{8,}\b|\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4})/i.test(value);
  }
  function safeNickname(value='Jogador'){
    let name=String(value||'Jogador').normalize('NFC').replace(/[\u0000-\u001f\u007f<>]/g,' ').replace(/\s+/g,' ').trim();
    if(containsPrivateData(name))name='Jogador';
    name=name.replace(/[^\p{L}\p{N} ._-]/gu,'').replace(/\s+/g,' ').trim().slice(0,24);
    return name.length>=3?name:'Jogador';
  }
  function install(){
    const api=window.OTTHOS_RTDB;if(!api||api.__childSafetyInstalled)return false;
    const original=api.sendChat?.bind(api);
    if(original)api.sendChat=async text=>{
      const clean=String(text||'').trim().slice(0,180);
      if(containsPrivateData(clean))return false;
      if(window.OTTHI_CONFIG?.childSafety?.approvedPhrasesOnly&&!approved.includes(clean))return false;
      return original(clean);
    };
    const originalName=api.setDisplayName?.bind(api);
    if(originalName)api.setDisplayName=name=>originalName(safeNickname(name));
    api.__childSafetyInstalled=true;api.approvedPhrases=()=>approved.slice();return true;
  }
  addEventListener('otthos:rtdb-ready',install);
  const timer=setInterval(()=>{if(install())clearInterval(timer)},500);
  setTimeout(()=>clearInterval(timer),10000);
  window.OTTHI_CHILD_SAFETY={approvedPhrases:approved.slice(),containsPrivateData,safeNickname,install};
})();
