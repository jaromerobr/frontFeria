/**
 * Genera los codigos QR de las redes de NODO como SVG en public/qr/.
 *
 * Se generan una vez y quedan en el repositorio a proposito: el totem
 * tiene que funcionar sin internet, y una imagen de QR pedida a un
 * servicio externo es justo lo que falla el dia de la feria.
 *
 *     npm run qr
 */
import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import { SOCIAL_LINKS } from '../src/social.js';

const OUT = path.resolve('public/qr');
fs.mkdirSync(OUT, { recursive: true });

for (const link of SOCIAL_LINKS) {
  const svg = await QRCode.toString(link.url, {
    type: 'svg',
    margin: 1,
    // Nivel M: aguanta que el QR se vea algo sucio o mal iluminado
    // en el estand sin dejar de leerse.
    errorCorrectionLevel: 'M',
    color: { dark: '#181410', light: '#00000000' },
  });

  const file = path.join(OUT, `${link.id}.svg`);
  fs.writeFileSync(file, svg);
  console.log(`${link.id.padEnd(10)} ${link.url}`);
}

console.log(`\n${SOCIAL_LINKS.length} codigos QR en public/qr/`);
