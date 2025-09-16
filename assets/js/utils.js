export const $ = (s, root=document) => root.querySelector(s);
export const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));

export function clamp(n, min, max){ return Math.min(Math.max(n, min), max); }
export function mmToIn(mm){ return mm / 25.4; }
export function a4PixelsAtDPI(dpi){
  const widthIn = mmToIn(210), heightIn = mmToIn(297);
  return { w: Math.round(widthIn * dpi), h: Math.round(heightIn * dpi) };
}
export function blobToObjectURL(blob){ return URL.createObjectURL(blob); }

export async function canvasToBlob(canvas, type="image/png", quality){
  if (canvas.convertToBlob) return canvas.convertToBlob({ type, quality });
  return new Promise(res => canvas.toBlob(res, type, quality));
}

export function setStatus(el, msg, kind="info"){
  el.textContent = msg || "";
  el.style.color = (kind==="err") ? "var(--danger)" : (kind==="ok") ? "var(--ok)" : "var(--muted)";
}

export function saveBlob(blob, filename){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}

/* default opcional para evitar “named export not found” por cache antigo */
export default {
  $, $$, clamp, mmToIn, a4PixelsAtDPI, blobToObjectURL, canvasToBlob, setStatus, saveBlob
};

