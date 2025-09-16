import { $, $$, clamp, a4PixelsAtDPI, blobToObjectURL, setStatus } from "./utils.js";

export function setupThemeToggle(){
  const btn = $("#themeToggle");
  const root = document.documentElement;
  const key = "photonpdf_theme";
  const set = (mode) => { root.classList.toggle("light", mode==="light"); localStorage.setItem(key, mode); };
  const initial = localStorage.getItem(key) || "dark";
  set(initial);
  btn.addEventListener("click", ()=>{
    set(root.classList.contains("light") ? "dark" : "light");
  });
}

export function wireDragAndDrop(dropEl, onFile){
  ["dragenter","dragover"].forEach(ev=>{
    dropEl.addEventListener(ev, e=>{ e.preventDefault(); dropEl.classList.add("drag"); });
  });
  ["dragleave","drop"].forEach(ev=>{
    dropEl.addEventListener(ev, e=>{ e.preventDefault(); dropEl.classList.remove("drag"); });
  });
  dropEl.addEventListener("drop", e=>{
    const f = e.dataTransfer?.files?.[0];
    if(f) onFile(f);
  });
}

export function updateChips(dpi){
  $$(".chip").forEach(ch=> ch.classList.toggle("active", ch.dataset.dpi === String(dpi)));
}

export function updateCounts({page, numPages, pageCountEl, rangeFromEl, rangeToEl}){
  pageCountEl.textContent = ` / ${numPages}`;
  rangeFromEl.max = numPages; rangeToEl.max = numPages;
  rangeToEl.value = Math.max(rangeToEl.value, 1);
  if (parseInt(rangeToEl.value,10) > numPages) rangeToEl.value = numPages;
  if (parseInt(rangeFromEl.value,10) > numPages) rangeFromEl.value = numPages;
}

export function showPreview(imgEl, blob, metaEl, {w, h, dpi, page, numPages, forceA4}){
  imgEl.src = blobToObjectURL(blob);
  const a4 = forceA4 ? " • A4" : "";
  metaEl.textContent = `Saída: ${w}×${h}px • ${dpi}dpi • Página ${page}/${numPages}${a4}`;
}

