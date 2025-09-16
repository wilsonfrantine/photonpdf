// assets/js/renderer.js
import { clamp, canvasToBlob } from "./utils.js";

class PDFRenderer {
  constructor(){ this.doc = null; this.numPages = 0; }

  async load(arrayBuffer){
    const task = pdfjsLib.getDocument({ data: arrayBuffer });
    this.doc = await task.promise;
    this.numPages = this.doc.numPages;
    return this.numPages;
  }

  async renderPageToCanvas(pageNum, dpi, forceA4=false, bg="white"){
    if(!this.doc) throw new Error("PDF não carregado");
    const page = await this.doc.getPage(clamp(pageNum, 1, this.numPages));
    const scale = dpi / 72;                       // 1pt = 1/72"
    const viewport = page.getViewport({ scale });

    // Canvas base (usa OffscreenCanvas se disponível)
    const w = Math.round(viewport.width), h = Math.round(viewport.height);
    let canvas, ctx;
    if ('OffscreenCanvas' in window){
      canvas = new OffscreenCanvas(w, h);
      ctx = canvas.getContext("2d", {alpha:false});
    } else {
      const tmp = document.createElement("canvas");
      tmp.width = w; tmp.height = h;
      canvas = tmp; ctx = tmp.getContext("2d", {alpha:false});
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    if(!forceA4) return canvas;

    // Forçar A4 (contain, fundo branco)
    const widthMM = 210, heightMM = 297;
    const widthIn = widthMM / 25.4, heightIn = heightMM / 25.4;
    const targetW = Math.round(widthIn * dpi), targetH = Math.round(heightIn * dpi);

    let out, octx;
    if ('OffscreenCanvas' in window){
      out = new OffscreenCanvas(targetW, targetH);
      octx = out.getContext("2d", {alpha:false});
    } else {
      out = document.createElement("canvas");
      out.width = targetW; out.height = targetH;
      octx = out.getContext("2d", {alpha:false});
    }

    octx.fillStyle = bg; octx.fillRect(0,0,targetW,targetH);
    const s = Math.min(targetW / w, targetH / h);
    const dw = Math.round(w * s), dh = Math.round(h * s);
    const dx = Math.floor((targetW - dw)/2), dy = Math.floor((targetH - dh)/2);
    octx.drawImage(canvas, 0, 0, w, h, dx, dy, dw, dh);
    return out;
  }

  async renderToBlob(pageNum, dpi, {forceA4=false, type="image/png", quality}={}){
    const canvas = await this.renderPageToCanvas(pageNum, dpi, forceA4);
    return canvasToBlob(canvas, type, quality);
  }
}

// Exporta nos dois formatos para evitar que caches antigos causem erro
export { PDFRenderer };
export default PDFRenderer;

