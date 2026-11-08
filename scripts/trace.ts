export const c = {
  fond: '#111213',
  surface: '#18191b',
  vide: '#1f2022',
  texte: '#f0efec',
  doux: '#c7c6c2',
  terne: '#9c9b97',
  rose: '#ffb0b8',
  encre: '#2a0d12',
  papier: '#543e41',
  papierDoux: '#d9cfcf',
  papierTerne: '#b7a9aa',
};

export type Police = 'b' | 'm' | 'g';

export const echappe = (texte: string): string =>
  texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Dessin = { l: number; h: number; titre: string; polices: Police[]; style?: string; corps: string };

export function habille(base64: (cle: Police) => string): (o: Dessin) => string {
  const cache = new Map<Police, string>();
  const police = (cle: Police): string => {
    let face = cache.get(cle);
    if (!face) {
      const poids = cle === 'b' ? '200 800' : '400';
      face = `@font-face{font-family:${cle};src:url(data:font/woff2;base64,${base64(cle)}) format('woff2');font-weight:${poids}}`;
      cache.set(cle, face);
    }
    return face;
  };
  return (o) => {
    const css =
      o.polices.map(police).join('') +
      '.b{font-family:b,system-ui,sans-serif}.m{font-family:m,ui-monospace,monospace}.g{font-family:g,cursive}' +
      (o.style ?? '');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${o.l} ${o.h}" width="${o.l}" height="${o.h}" role="img" aria-label="${echappe(o.titre)}"><title>${echappe(o.titre)}</title><style>${css}</style>${o.corps}</svg>`;
  };
}

// mesurées à 16 px : l'axe de taille optique élargit le dessin en petit corps
const lettres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,.:-()/@';
const chasses: Record<400 | 700, number[]> = {
  400: [556, 606, 548, 605, 563, 369, 582, 594, 247, 257, 545, 247, 893, 594, 600, 606, 605, 398, 529, 370, 586, 533, 808, 515, 583, 487, 656, 655, 665, 684, 586, 569, 696, 699, 263, 348, 654, 506, 890, 730, 712, 620, 715, 649, 633, 543, 711, 647, 941, 628, 579, 554, 650, 305, 572, 589, 580, 593, 640, 485, 639, 633, 252, 149, 177, 188, 331, 296, 277, 348, 933],
  700: [584, 636, 565, 637, 580, 398, 599, 629, 275, 279, 589, 273, 943, 629, 608, 636, 637, 433, 544, 396, 621, 571, 861, 568, 601, 523, 697, 681, 679, 698, 619, 591, 719, 720, 292, 372, 685, 507, 936, 773, 721, 644, 722, 677, 651, 569, 726, 672, 984, 694, 640, 570, 664, 345, 602, 605, 623, 608, 655, 508, 654, 651, 230, 195, 233, 243, 351, 321, 316, 360, 985],
};

export function largeur(texte: string, taille: number, cle: Police = 'b', poids: 400 | 700 = 400): number {
  if (cle === 'm') return texte.length * taille * 0.6;
  let total = 0;
  for (const lettre of texte) {
    const i = lettres.indexOf(lettre);
    total += i < 0 ? 560 : chasses[poids][i];
  }
  return (total / 1000) * taille;
}

export function coupe(texte: string, taille: number, max: number, lignes: number): string[] {
  const sortie: string[] = [];
  let courante = '';
  for (const mot of texte.split(' ')) {
    const essai = courante ? `${courante} ${mot}` : mot;
    if (largeur(essai, taille) <= max * 0.97 || !courante) courante = essai;
    else {
      sortie.push(courante);
      courante = mot;
    }
  }
  if (courante) sortie.push(courante);
  if (sortie.length > lignes) {
    sortie.length = lignes;
    sortie[lignes - 1] = sortie[lignes - 1].replace(/[ ,.:;]*\S*$/, '') + '…';
  }
  return sortie;
}

export function patte(x: number, y: number, taille: number, tourne: number, attributs = ''): string {
  const doigts = [
    [-6.1, -2.1, 1.85, 2.5, -29],
    [-2.3, -6.2, 2, 2.75, -8],
    [2.2, -6.4, 2, 2.75, 7],
    [6.2, -3, 1.75, 2.3, 32],
  ];
  return `<g transform="translate(${x} ${y}) rotate(${tourne}) scale(${taille})" ${attributs}><path d="M0 -1.4C3.1 -1.4 5.9 1 6.3 3.9C6.7 6.1 5 7.6 3.2 6.9C2.3 6.6 1.3 7.2 0 7.2C-1.3 7.2 -2.3 6.6 -3.2 6.9C-5 7.6 -6.7 6.1 -6.3 3.9C-5.9 1 -3.1 -1.4 0 -1.4Z"/>${doigts
    .map(([cx, cy, rx, ry, a]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${cx} ${cy})"/>`)
    .join('')}</g>`;
}

export function trait(x: number, y: number, l: number, h: number): string {
  return `<g transform="translate(${x} ${y}) scale(${l / 200} ${h / 40})" fill="${c.rose}" opacity=".26"><path fill-opacity=".78" d="M4 17C20 9 60 7 100 8C140 9 172 6 197 9L190 13L199 16C170 22 130 24 96 23C60 22 28 25 6 27L11 22Z"/><path fill-opacity=".78" d="M22 24C50 19 90 20 128 19C156 18 178 21 192 24L184 27L194 31C170 35 132 34 100 35C70 36 44 35 26 33L31 29Z"/><path fill-opacity=".6" d="M150 36.5L186 35L160 38Z"/></g>`;
}

export function yeux(x: number, y: number): string {
  const oeil = (cx: number): string =>
    `<g class="oeil"><ellipse cx="${cx}" cy="${y}" rx="4.6" ry="5.4" fill="${c.rose}"/><ellipse cx="${cx}" cy="${y}" rx="1.3" ry="4.2" fill="${c.encre}"/></g>`;
  return oeil(x - 7) + oeil(x + 7);
}

export const cligne =
  '.oeil{transform-box:fill-box;transform-origin:center;animation:cligne 5s infinite}' +
  '@keyframes cligne{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}}' +
  '@media (prefers-reduced-motion:reduce){.oeil{animation:none}}';

export function badge(x: number, y: number, cle: string, valeur: string, taille = 11.5): { dessin: string; l: number } {
  const h = taille * 2.1;
  const lc = largeur(cle, taille, 'm') + taille * 1.3;
  const lv = largeur(valeur, taille, 'm') + taille * 1.3;
  const l = lc + lv;
  const r = h / 2;
  const base = y + h * 0.66;
  const dessin =
    `<g transform="translate(${x} ${y})">` +
    `<rect width="${l}" height="${h}" rx="${r}" fill="${c.fond}"/>` +
    `<path d="M${r} 0H${lc + 3}C${lc - 4} ${h * 0.35} ${lc + 6} ${h * 0.65} ${lc - 1} ${h}H${r}A${r} ${r} 0 0 1 ${r} 0Z" fill="${c.rose}"/>` +
    `</g>` +
    `<text class="m" x="${x + taille * 0.62}" y="${base}" font-size="${taille}" fill="${c.encre}">${echappe(cle)}</text>` +
    `<text class="m" x="${x + lc + taille * 0.68}" y="${base}" font-size="${taille}" fill="${c.texte}">${echappe(valeur)}</text>`;
  return { dessin, l };
}

export function rangee(x: number, y: number, paires: readonly (readonly [string, string])[], taille = 11.5, ecart = 8): string {
  let curseur = x;
  let sortie = '';
  for (const [cle, valeur] of paires) {
    const { dessin, l } = badge(curseur, y, cle, valeur, taille);
    sortie += dessin;
    curseur += l + ecart;
  }
  return sortie;
}
