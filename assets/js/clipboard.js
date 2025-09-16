export async function copyBlobToClipboardPNG(blob){
  // Requer Clipboard API com permissões do gesto do usuário (cliques).
  await navigator.clipboard.write([ new ClipboardItem({ "image/png": blob }) ]);
}

