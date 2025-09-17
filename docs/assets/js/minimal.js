// /assets/js/minimal.js — camada de UX minimalista
import { $ } from "./utils.js";
import { copyBlobToClipboardPNG } from "./clipboard.js";

const els = {
  file: $("#file"),
  preview: $("#preview"),
  nav: $("#nav"),
  page: $("#page"),
  pageCount: $("#pageCount"),
  toast: $("#toast"),
  drop: $("#drop"),
  status: $("#status"),
  infoBtn: $("#infoBtn"),
  infoPanel: $("#infoPanel"),
  themeToggle: $("#themeToggle"),
};

// Toggle do painel de informações
if (els.infoBtn && els.infoPanel){
  els.infoBtn.addEventListener("click", ()=>{
    els.infoPanel.hidden = !els.infoPanel.hidden;
  });
}

// Navegação visível apenas quando > 1 página
const observer = new MutationObserver(()=>{
  const txt = (els.pageCount?.textContent || "").trim();
  const m = txt.match(/(\d+)$/);
  const num = m ? parseInt(m[1], 10) : 1;
  els.nav.hidden = !(num && num > 1);
});
if (els.pageCount) observer.observe(els.pageCount, { characterData:true, childList:true, subtree:true });

// Copiar no load/click + toast visual
async function showToast(msg){
  if (!els.toast) return;
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(showToast.t);
  showToast.t = setTimeout(()=>els.toast.classList.remove("show"), 1600);
}
async function copyPreviewToClipboard(){
  try{
    const src = els.preview?.src;
    if (!src) return;
    const res = await fetch(src);
    const blob = await res.blob();
    await copyBlobToClipboardPNG(blob);
    showToast("Imagem copiada");
  }catch(e){
    if (els.status) els.status.textContent = "Não foi possível copiar automaticamente (use clique direito).";
  }
}
if (els.preview){
  els.preview.addEventListener("load", copyPreviewToClipboard, { passive:true });
  els.preview.addEventListener("click", copyPreviewToClipboard);
}

// Drag & drop global
function prevent(e){ e.preventDefault(); e.stopPropagation(); }
["dragenter","dragover"].forEach(ev=>{
  window.addEventListener(ev, (e)=>{ prevent(e); document.body.classList.add("dragging"); });
});
["dragleave","drop"].forEach(ev=>{
  window.addEventListener(ev, (e)=>{
    prevent(e);
    if (ev === "drop"){
      const file = e.dataTransfer?.files?.[0];
      if (file){
        try{
          const dt = new DataTransfer();
          dt.items.add(file);
          els.file.files = dt.files;
          els.file.dispatchEvent(new Event("change", { bubbles:true }));
        }catch(_){ els.file.click(); }
      }
    }
    document.body.classList.remove("dragging");
  });
});

// Evitar erros se existir cópia antiga
const copyBtn = document.getElementById("copyBtn");
if (copyBtn) copyBtn.style.display = "none";

// Tema: ui.js já usa #themeToggle; aqui só refletimos estado (opcional)
(function syncThemeIcon(){
  const root = document.documentElement;
  const isLight = root.classList.contains("light");
  if (els.themeToggle){
    els.themeToggle.setAttribute("aria-pressed", isLight ? "true" : "false");
  }
})();

// Atalho: tecla 'C' copia a imagem visível
window.addEventListener("keydown", (e)=>{
  if (!e || !e.key) return;
  if (e.key.toLowerCase() === "c") {
    copyPreviewToClipboard();
  }
});
// esconder quando começar um novo carregamento
if (els.file){
  els.file.addEventListener("change", ()=> els.preview?.classList.remove("show"));
}
if (els.page){
  // prev/next: antes de renderizar a nova página, esconda
  const hide = ()=> els.preview?.classList.remove("show");
  document.getElementById("prev")?.addEventListener("click", hide);
  document.getElementById("next")?.addEventListener("click", hide);
}

// mostrar quando de fato carregar a imagem
if (els.preview){
  els.preview.addEventListener("load", ()=>{
    els.preview.classList.add("show");
  }, { passive:true });
}

