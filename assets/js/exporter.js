import { saveBlob } from "./utils.js";

export async function exportSingle(blob, filename){
  saveBlob(blob, filename);
}

export async function exportZip(blobsMap /* {filename:Blob} */){
  const zip = new JSZip();
  for (const [name, blob] of Object.entries(blobsMap)){
    zip.file(name, blob);
  }
  const out = await zip.generateAsync({ type: "blob" });
  saveBlob(out, "photonpdf_export.zip");
}

