export const c = {
  fond: '#0c0c0e',
  surface: '#141416',
  releve: '#1b1b1e',
  vide: '#1c1c1f',
  ligne: '#f0efec',
  texte: '#f0efec',
  doux: '#c7c6c2',
  terne: '#9c9b97',
  rose: '#ffb0b8',
  encre: '#2a0d12',
  vert: '#6ad395',
  rouge: '#f28b82',
};

export type Police = 'b' | 'm';

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
      '.b{font-family:b,system-ui,sans-serif}.m{font-family:m,ui-monospace,monospace}' +
      (o.style ?? '');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${o.l} ${o.h}" width="${o.l}" height="${o.h}" role="img" aria-label="${echappe(o.titre)}"><title>${echappe(o.titre)}</title><style>${css}</style>${o.corps}</svg>`;
  };
}

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

const M = {
  epaisseur: 14,
  decalage: 'translate(1.82 -2.51)',
  brasLong: 'M74 30L30 84',
  brasDuI: 'M38.84 40.85L74 84',
  point: { x: 24.06, y: 22.71, r: 8.7 },
};

export function monogramme(x: number, y: number, taille: number, o: { trait?: string; classe?: string } = {}): string {
  const classe = o.classe ?? '';
  return (
    `<g transform="translate(${x} ${y}) scale(${taille / 100})"><g transform="${M.decalage}" fill="none" stroke="${o.trait ?? c.texte}" stroke-width="${M.epaisseur}" stroke-linecap="round">` +
    `<path class="${classe} bras" pathLength="1" d="${M.brasLong}"/><path class="${classe} bras bras-i" pathLength="1" d="${M.brasDuI}"/>` +
    `<circle class="${classe} point" cx="${M.point.x}" cy="${M.point.y}" r="${M.point.r}" fill="${c.rose}" stroke="none"/></g></g>`
  );
}

export const traceMonogramme =
  '.trace.bras{stroke-dasharray:1;animation:bras .9s cubic-bezier(.23,1,.32,1) backwards}' +
  '.trace.bras-i{animation-delay:.28s}' +
  '.trace.point{transform-box:fill-box;transform-origin:center;animation:point .5s cubic-bezier(.34,1.56,.64,1) .9s backwards}' +
  '@keyframes bras{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}@keyframes point{from{transform:scale(0)}to{transform:scale(1)}}' +
  '@media (prefers-reduced-motion:reduce){.trace.bras,.trace.point{animation:none}}';

export function cadre(l: number, h: number, r = 22, fond = c.surface): string {
  return (
    `<rect width="${l}" height="${h}" rx="${r}" fill="${fond}"/>` +
    `<rect x=".5" y=".5" width="${l - 1}" height="${h - 1}" rx="${r - 0.5}" fill="none" stroke="${c.ligne}" stroke-opacity=".09"/>`
  );
}

export function relief(l: number, h: number, n: number, graine: number): string {
  const lignes: string[] = [];
  for (let k = 0; k < n; k++) {
    const base = (h / (n + 1)) * (k + 1);
    const points: string[] = [];
    for (let x = -20; x <= l + 20; x += 20) {
      const t = x / l;
      const y =
        base +
        Math.sin(t * 5.1 + k * 0.62 + graine) * 14 +
        Math.sin(t * 11.3 - k * 0.41 + graine * 1.7) * 5 +
        Math.sin(t * 2.2 + graine * 0.3) * 18 * Math.cos(k * 0.35);
      points.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    const maitresse = k % 4 === 2;
    lignes.push(
      `<path d="M${points.join('L')}" fill="none" stroke="${maitresse ? c.rose : c.ligne}" stroke-opacity="${maitresse ? 0.16 : 0.055}" stroke-width="1"/>`,
    );
  }
  return lignes.join('');
}

export function reperes(
  x: number,
  y: number,
  paires: readonly (readonly [string, string])[],
  o: { taille?: number; ecart?: number } = {},
): string {
  const taille = o.taille ?? 17;
  const ecart = o.ecart ?? 22;
  let curseur = x;
  let sortie = '';
  paires.forEach(([cle, valeur], i) => {
    if (i > 0) {
      sortie += `<path d="M${curseur} ${y - 2}V${y + taille + 16}" stroke="${c.ligne}" stroke-opacity=".12"/>`;
      curseur += ecart;
    }
    sortie +=
      `<text class="m" x="${curseur}" y="${y + 8}" font-size="10" fill="${c.terne}" letter-spacing=".08em">${echappe(cle.toUpperCase())}</text>` +
      `<text class="b" x="${curseur}" y="${y + 14 + taille}" font-size="${taille}" font-weight="500" fill="${c.texte}">${echappe(valeur)}</text>`;
    curseur += Math.max(largeur(valeur, taille, 'b'), largeur(cle, 10, 'm') * 1.08) + ecart;
  });
  return sortie;
}

export function etiquette(x: number, y: number, texte: string, couleur = c.rose): string {
  return (
    `<circle cx="${x + 3}" cy="${y - 3.6}" r="3" fill="${couleur}"/>` +
    `<text class="m" x="${x + 12}" y="${y}" font-size="11" fill="${c.terne}" letter-spacing=".08em">${echappe(texte.toUpperCase())}</text>`
  );
}
