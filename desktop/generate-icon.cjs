const fs = require('node:fs');
const path = require('node:path');

/**
 * El icono de escritorio reutiliza el mismo marcador de marca que la PWA
 * (glifo de dos nodos conectados sobre el degradado violeta -> azul), para que
 * la app instalada, la PWA y la web compartan identidad.
 * Sustituir `frontend/public/icons/pwa-512x512.png` por el arte definitivo.
 */
function generateIcon() {
  const source = path.join(__dirname, '..', 'frontend', 'public', 'icons', 'pwa-512x512.png');
  const outputDirectory = path.join(__dirname, 'assets');
  const output = path.join(outputDirectory, 'icon.png');

  if (!fs.existsSync(source)) {
    console.error(`DESKTOP_ICON_FAILED missing source ${source}`);
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.copyFileSync(source, output);
  console.log(`DESKTOP_ICON_OK ${output}`);
}

generateIcon();
