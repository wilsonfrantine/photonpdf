import { $, $$, setStatus, clamp } from "./utils.js";
import RendererDefault, { PDFRenderer as RendererNamed } from "./renderer.js";
import { exportSingle, exportZip } from "./exporter.js";
import { setupThemeToggle, updateChips, updateCounts, showPreview } from "./ui.js";

const PDFRendererClass = RendererNamed || RendererDefault;

const els = {
  file: $("#file"),
  page: $("#page"),
  prev: $("#prev"),
  next: $("#next"),
  pageCount: $("#pageCount"),
  dpi: $("#dpi"),
  chips: $$(".chip"),
  forceA4: $("#forceA4"),
  copyBtn: $("#copyBtn"),
  exportPng: $("#exportPng"),
  exportJpg: $("#exportJpg"),
  exportZip: $("#exportZip"),
  rangeFrom: $("#rangeFrom"),
  rangeTo: $("#rangeTo"),
  status: $("#status"),
  drop: $("#drop"),
  preview: $("#preview"),
  meta: $("#meta"),
  advPanel: $("#advPanel"),
};

let renderer = new PDFRendererClass();
let numPages = 0;
let currentPage = 1;
let lastBlob = null;

// Preferências
const PREFER_KEY = "photonpdf_prefs";
const prefs = loadPrefs(); // {dpi, forceA4}
els.dpi.value = prefs.dpi ?? 120;
els.forceA4.checked = !!prefs.forceA4;
updateChips(els.dpi.value);

setupThemeToggle();

// eventos essenciais
els.file.addEventListener("change", e=>{
  const f = e.target.files?.[0]; if(f) handleFile(f);
});
els.prev.addEventListener("click", ()=>{ if(!numPages) return; currentPage = clamp(currentPage-1, 1, numPages); els.page.value = currentPage; renderCurrent(); });
els.next.addEventListener("click", ()=>{ if(!numPages) return; currentPage = clamp(currentPage+1, 1, numPages); els.page.value = currentPage; renderCurrent(); });
els.page.addEventListener("change", ()=>{ if(!numPages) return; currentPage = clamp(parseInt(els.page.value||"1",10), 1, numPages); renderCurrent(); });

// avançadas (auto-render ao mudar)
els.dpi.addEventListener("change", ()=>{ updateChips(els.dpi.value); savePrefs(); if(numPages) renderCurrent(); });
els.chips.forEach(ch=> ch.addEventListener("click", ()=>{ els.dpi.value = ch.dataset.dpi; updateChips(ch.dataset.dpi); savePrefs(); if(numPages) renderCurrent(); }));
els.forceA4.addEventListener("change", ()=>{ savePrefs(); if(numPages) renderCurrent(); });

els.exportPng.addEventListener("click", ()=> exportCurrent("png"));
els.exportJpg.addEventListener("click", ()=> exportCurrent("jpg"));

els.rangeFrom.addEventListener("change", syncRange);
els.rangeTo.addEventListener("change", syncRange);

// atalhos
document.addEventListener("keydown", e=>{
  if(e.key === "ArrowLeft"){ e.preventDefault(); els.prev.click(); }
  if(e.key === "ArrowRight"){ e.preventDefault(); els.next.click(); }
  if(e.key.toLowerCase() === "c"){ els.copyBtn.click(); }
});

// handlers
async function handleFile(file){
  try{
    setStatus(els.status, "Carregando PDF...");
    const buf = await file.arrayBuffer();
    numPages = await renderer.load(buf);
    currentPage = 1;
    els.page.value = 1;
    els.rangeFrom.value = 1;
    els.rangeTo.value = numPages;
    updateCounts({page:1, numPages, pageCountEl:els.pageCount, rangeFromEl:els.rangeFrom, rangeToEl:els.rangeTo});
    setStatus(els.status, `PDF carregado. Páginas: ${numPages}.`);
    await renderCurrent();             // render automático
    toggleActions(true);
    // abrir automaticamente o painel avançado só na primeira vez
    if (!localStorage.getItem("photonpdf_seen_adv")) {
      els.advPanel.open = true;
      localStorage.setItem("photonpdf_seen_adv", "1");
    }
  }catch(e){
    console.error(e);
    setStatus(els.status, "Erro ao carregar o PDF.", "err");
  }
}

async function renderCurrent(){
  try{
    const dpi = Math.max(36, parseInt(els.dpi.value||"120",10));
    const forceA4 = !!els.forceA4.checked;
    setStatus(els.status, `Renderizando página ${currentPage} em ${dpi} dpi...`);
    const canvas = await renderer.renderPageToCanvas(currentPage, dpi, forceA4);
    lastBlob = await toBlob(canvas, "image/png");
    const w = canvas.width, h = canvas.height;
    els.preview.src = URL.createObjectURL(lastBlob);
    showPreview(els.preview, lastBlob, els.meta, {w,h,dpi,page:currentPage,numPages,forceA4});
    setStatus(els.status, "Pronto. Use “Copiar imagem” (Ctrl+V no Word).", "ok");
  }catch(e){
    console.error(e);
    setStatus(els.status, "Falha na renderização.", "err");
  }
}

async function copyCurrentToClipboard(){
  if(!lastBlob) return;
  try{
    await navigator.clipboard.write([ new ClipboardItem({ "image/png": lastBlob }) ]);
    setStatus(els.status, "Imagem copiada para a área de transferência.", "ok");
  }catch(e){
    console.error(e);
    setStatus(els.status, "Falha ao copiar (permissões do navegador).", "err");
  }
}

async function exportCurrent(fmt){
  if(!numPages) return;
  const dpi = Math.max(36, parseInt(els.dpi.value||"120",10));
  const forceA4 = !!els.forceA4.checked;
  const type = fmt==="jpg" ? "image/jpeg" : "image/png";
  const quality = fmt==="jpg" ? 0.92 : undefined;
  const blob = await renderer.renderToBlob(currentPage, dpi, {forceA4, type, quality});
  const name = `page-${String(currentPage).padStart(3,"0")}.${fmt}`;
  await exportSingle(blob, name);
}

function syncRange(){
  if(!numPages) return;
  let a = clamp(parseInt(els.rangeFrom.value||"1",10), 1, numPages);
  let b = clamp(parseInt(els.rangeTo.value||String(numPages),10), 1, numPages);
  if(a>b) [a,b] = [b,a];
  els.rangeFrom.value = a; els.rangeTo.value = b;
}

async function exportRangeZip(){
  if(!numPages) return;
  syncRange();
  const dpi = Math.max(36, parseInt(els.dpi.value||"120",10));
  const forceA4 = !!els.forceA4.checked;
  setStatus(els.status, `Exportando páginas ${els.rangeFrom.value}–${els.rangeTo.value} em ZIP...`);
  const blobs = {};
  for(let p = parseInt(els.rangeFrom.value,10); p <= parseInt(els.rangeTo.value,10); p++){
    const blob = await renderer.renderToBlob(p, dpi, {forceA4, type:"image/png"});
    const name = `page-${String(p).padStart(3,"0")}.png`;
    blobs[name] = blob;
  }
  await exportZip(blobs);
  setStatus(els.status, "ZIP gerado.", "ok");
}

function loadPrefs(){
  try{ return JSON.parse(localStorage.getItem(PREFER_KEY) || "{}"); }
  catch{ return {}; }
}
function savePrefs(){
  const obj = { dpi: parseInt(els.dpi.value,10) || 120, forceA4: !!els.forceA4.checked };
  localStorage.setItem(PREFER_KEY, JSON.stringify(obj));
}
function toBlob(canvas, type){
  if (canvas.convertToBlob) return canvas.convertToBlob({type});
  return new Promise(res => canvas.toBlob(res, type));
}

