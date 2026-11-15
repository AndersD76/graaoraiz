// Fora do arquivo "use client": o servidor precisa do texto do script, não de uma referência ao navegador.
export const CHAVE_TEMA = 'graoraiz:admin:tema';

/** Roda antes de pintar a tela: aplica o tema escolhido para não piscar claro e depois escuro. */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem('${CHAVE_TEMA}');if(t==='claro'||t==='escuro')document.getElementById('admin').setAttribute('data-tema',t)}catch(e){}})();`;
