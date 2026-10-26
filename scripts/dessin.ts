import { readFileSync } from 'node:fs';
import { habille, type Police } from './trace.ts';

export * from './trace.ts';

const racine = new URL('../assets/', import.meta.url);

export const fichiers: Record<Police, string> = {
  b: 'bricolage-grotesque-latin.woff2',
  m: 'fragment-mono-latin.woff2',
  g: 'gochi-hand-latin.woff2',
};

export const svg = habille((cle) => readFileSync(new URL(`fonts/${fichiers[cle]}`, racine)).toString('base64'));

export function logo(fichier: string, x: number, y: number, taille: number): string {
  const brut = readFileSync(new URL(fichier, racine), 'utf8');
  return brut
    .replace(/<\?xml[^>]*>/, '')
    .replace(/\s(width|height)="[^"]*"/g, '')
    .replace('<svg ', `<svg x="${x}" y="${y}" width="${taille}" height="${taille}" `);
}

export function icone(nom: string, x: number, y: number, taille: number, teinte: string): string {
  const brut = readFileSync(new URL(`icons/${nom}.svg`, racine), 'utf8');
  const chemin = /<path d="([^"]+)"/.exec(brut)?.[1] ?? '';
  return `<g transform="translate(${x} ${y}) scale(${taille / 24})" fill="${teinte}"><path d="${chemin}"/></g>`;
}

export function photo(fichier: string): string {
  return `data:image/png;base64,${readFileSync(new URL(fichier, racine)).toString('base64')}`;
}
