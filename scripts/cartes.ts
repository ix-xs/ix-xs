import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { liens, outils, pile, profil } from '../profil.ts';
import { c, cadre, coupe, echappe, etiquette, icone, largeur, logo, monogramme, relief, reperes, svg, traceMonogramme } from './dessin.ts';

type Outil = (typeof outils)[number];
type Jour = { date: string; n: number };

const sortie = new URL('../dist/', import.meta.url);
const jeton = process.env['GITHUB_TOKEN'] ?? process.env['GH_TOKEN'];
const jour = new Date().toISOString().slice(0, 10);
const nombre = new Intl.NumberFormat('en-US');
const large = 880;
const etroit = 412;

async function lire<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const reponse = await fetch(url, init);
    if (!reponse.ok) return null;
    return (await reponse.json()) as T;
  } catch {
    return null;
  }
}

const github = (chemin: string): Promise<any> =>
  lire(`https://api.github.com${chemin}`, {
    headers: { accept: 'application/vnd.github+json', ...(jeton ? { authorization: `Bearer ${jeton}` } : {}) },
  });

async function calendrier(): Promise<Jour[] | null> {
  const fichier = process.env['CALENDRIER'];
  const reponse = fichier
    ? JSON.parse(await readFile(fichier, 'utf8'))
    : jeton
      ? await lire<any>('https://api.github.com/graphql', {
          method: 'POST',
          headers: { authorization: `Bearer ${jeton}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            query: `query{user(login:"${profil.login}"){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`,
          }),
        })
      : null;
  const semaines = reponse?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  if (!Array.isArray(semaines)) return null;
  return semaines.flatMap((s: any) => s.contributionDays.map((d: any) => ({ date: d.date, n: d.contributionCount })));
}

const surligne =
  '.arrive{animation:arrive .6s cubic-bezier(.23,1,.32,1) backwards}' +
  '@keyframes arrive{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
  '@media (prefers-reduced-motion:reduce){.arrive{animation:none}}';

function titre(x: number, y: number, lignes: readonly string[], taille: number, interligne: number): string {
  const attributs = `class="b" font-size="${taille}" font-weight="800" letter-spacing="-.02em"`;
  let dessin =
    `<filter id="surligne" x="-.07" y=".06" width="1.14" height=".92"><feFlood flood-color="${c.rose}"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  lignes.forEach((ligne, i) => {
    const base = y + i * interligne;
    const retard = `style="animation-delay:${(0.1 + i * 0.08).toFixed(2)}s"`;
    const fin = ligne.endsWith('.') ? ligne.slice(0, -1) : ligne;
    let morceaux: string;
    if (fin === profil.marque) {
      morceaux =
        `<text ${attributs} x="${x + taille * 0.08}" y="${base}" fill="${c.encre}" filter="url(#surligne)">${echappe(fin)}</text>` +
        (fin !== ligne
          ? `<text ${attributs} x="${x + taille * 0.08}" y="${base}" fill="none"><tspan>${echappe(fin)}</tspan><tspan dx="${(taille * 0.14).toFixed(1)}" fill="${c.rose}">.</tspan></text>`
          : '');
    } else {
      morceaux =
        `<text ${attributs} x="${x}" y="${base}" fill="${c.texte}"><tspan>${echappe(fin)}</tspan>` +
        (fin !== ligne ? `<tspan fill="${c.rose}">.</tspan>` : '') +
        '</text>';
    }
    dessin += `<g class="arrive" ${retard}>${morceaux}</g>`;
  });
  return dessin;
}

function entete(): string {
  const l = large;
  const h = 364;
  const lignes = coupe(profil.accroche, 16, 470, 3);
  const corps =
    `<clipPath id="cadre"><rect width="${l}" height="${h}" rx="24"/></clipPath>` +
    cadre(l, h, 24, c.fond) +
    `<g clip-path="url(#cadre)">${relief(l, h, 11, 1.3)}</g>` +
    monogramme(l - 280, 64, 220, { classe: 'trace' }) +
    `<g class="arrive">${etiquette(44, 58, `${profil.nom} · ${profil.role}`)}</g>` +
    titre(42, 118, profil.titre, 46, 52) +
    lignes.map((t, i) => `<text class="b arrive" style="animation-delay:.3s" x="44" y="${270 + i * 24}" font-size="16" fill="${c.doux}">${echappe(t)}</text>`).join('') +
    `<text class="m arrive" style="animation-delay:.4s" x="44" y="${h - 32}" font-size="11" fill="${c.terne}" letter-spacing=".08em">${echappe(profil.lieu.toUpperCase())}</text>`;
  return svg({ l, h, titre: `${profil.nom}, ${profil.role}: ${profil.titre.join(' ')}`, polices: ['b', 'm'], style: traceMonogramme + surligne, corps });
}

function enteteEtroit(): string {
  const l = etroit;
  const lignes = coupe(profil.accroche, 15, l - 52, 5);
  const h = 270 + lignes.length * 22 + 50;
  const corps =
    `<clipPath id="cadre"><rect width="${l}" height="${h}" rx="22"/></clipPath>` +
    cadre(l, h, 22, c.fond) +
    `<g clip-path="url(#cadre)">${relief(l, h, 9, 2.1)}</g>` +
    monogramme(l - 108, 22, 84, { classe: 'trace' }) +
    `<g class="arrive">${etiquette(26, 44, profil.role)}</g>` +
    titre(24, 144, profil.titre, 34, 40) +
    lignes.map((t, i) => `<text class="b arrive" style="animation-delay:.3s" x="26" y="${270 + i * 22}" font-size="15" fill="${c.doux}">${echappe(t)}</text>`).join('') +
    `<text class="m arrive" style="animation-delay:.4s" x="26" y="${h - 26}" font-size="10.5" fill="${c.terne}" letter-spacing=".08em">${echappe(profil.lieu.toUpperCase())}</text>`;
  return svg({ l, h, titre: `${profil.nom}, ${profil.role}: ${profil.titre.join(' ')}`, polices: ['b', 'm'], style: traceMonogramme + surligne, corps });
}

function pictogramme(cle: string, cx: number, cy: number, taille: number): string {
  const x = cx - taille / 2;
  const y = cy - taille / 2;
  if (cle === 'site') return monogramme(x - taille * 0.08, y - taille * 0.08, taille * 1.16);
  if (cle === 'mail')
    return (
      `<g transform="translate(${x} ${y}) scale(${taille / 24})" fill="none" stroke="${c.texte}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
      `<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.2 8.5-6.2"/></g>`
    );
  return icone(cle, x, y, taille, c.texte);
}

function lien(cle: string, valeur: string): string {
  const taille = 12.5;
  const h = 36;
  const l = 44 + largeur(valeur, taille, 'm') + 18;
  const corps =
    `<rect x=".5" y=".5" width="${l - 1}" height="${h - 1}" rx="${h / 2}" fill="${c.surface}" stroke="${c.ligne}" stroke-opacity=".12"/>` +
    pictogramme(cle, 24, h / 2, 16) +
    `<text class="m" x="42" y="22.5" font-size="${taille}" fill="${c.texte}">${echappe(valeur)}</text>`;
  return svg({ l, h, titre: `${cle}: ${valeur}`, polices: ['m'], corps });
}

interface Releve {
  version?: string;
  licence?: string;
  telechargements?: number;
  etoiles?: number;
  versions?: number;
  depuis?: string;
  maj?: string;
  serie?: number[];
}

async function releve(depot: string, paquet: string): Promise<Releve> {
  const [npm, dl, jours, repo] = await Promise.all([
    lire<any>(`https://registry.npmjs.org/${paquet.replace('/', '%2F')}`),
    lire<any>(`https://api.npmjs.org/downloads/point/last-month/${paquet}`),
    lire<any>(`https://api.npmjs.org/downloads/range/last-month/${paquet}`),
    github(`/repos/${profil.login}/${depot}`),
  ]);
  const derniere = npm?.['dist-tags']?.latest;
  return {
    version: derniere,
    licence: (derniere && npm?.versions?.[derniere]?.license) ?? repo?.license?.spdx_id,
    telechargements: typeof dl?.downloads === 'number' ? dl.downloads : undefined,
    etoiles: typeof repo?.stargazers_count === 'number' ? repo.stargazers_count : undefined,
    versions: npm?.versions ? Object.keys(npm.versions).length : undefined,
    depuis: npm?.time?.created,
    maj: derniere ? npm?.time?.[derniere] : undefined,
    serie: Array.isArray(jours?.downloads) ? jours.downloads.map((j: any) => j.downloads) : undefined,
  };
}

function chiffres(r: Releve): [string, string][] {
  const paires: [string, string][] = [];
  if (r.version) paires.push(['version', `v${r.version}`]);
  if (r.telechargements !== undefined) paires.push(['30 days', nombre.format(r.telechargements)]);
  if (r.etoiles) paires.push(['stars', nombre.format(r.etoiles)]);
  if (r.licence) paires.push(['license', r.licence]);
  return paires;
}

const mois = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const quand = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

function histoire(r: Releve): string {
  const morceaux: string[] = [];
  if (r.versions) morceaux.push(`${r.versions} releases${r.depuis ? ` since ${mois.format(new Date(r.depuis))}` : ''}`);
  if (r.maj) morceaux.push(`latest ${quand.format(new Date(r.maj))}`);
  return morceaux.join(' · ');
}

function courbe(serie: number[] | undefined, x: number, y: number, l: number, h: number, id: string): string {
  if (!serie || serie.length < 2) return '';
  const max = Math.max(1, ...serie);
  const pas = l / (serie.length - 1);
  const points = serie.map((v, i) => [x + i * pas, y + h - (v / max) * h]);
  let ligne = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const mx = (x0 + x1) / 2;
    ligne += `C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  const [xf, yf] = points[points.length - 1];
  return (
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.rose}" stop-opacity=".22"/><stop offset="1" stop-color="${c.rose}" stop-opacity="0"/></linearGradient>` +
    `<path d="M${x} ${y + h}H${x + l}" stroke="${c.ligne}" stroke-opacity=".08"/>` +
    `<path d="${ligne}L${x + l} ${y + h}L${x} ${y + h}Z" fill="url(#${id})"/>` +
    `<path class="trait-courbe" pathLength="1" d="${ligne}" fill="none" stroke="${c.rose}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<circle cx="${xf}" cy="${yf}" r="3.2" fill="${c.rose}"/>`
  );
}

const traceCourbe =
  '.trait-courbe{stroke-dasharray:1;animation:courbe 1.4s cubic-bezier(.23,1,.32,1) .2s backwards}' +
  '@keyframes courbe{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
  '@media (prefers-reduced-motion:reduce){.trait-courbe{animation:none}}';

const source = (x: number, y: number, r: Releve, ancre = 'start'): string =>
  `<text class="m" x="${x}" y="${y}" font-size="10" fill="${c.terne}" text-anchor="${ancre}">${echappe([histoire(r), `read ${jour}`].filter(Boolean).join(' · '))}</text>`;

function carte(outil: Outil, r: Releve, enTete?: string): string {
  const l = etroit;
  const h = 300;
  const lignes = coupe(outil.ligne, 15, l - 48, 2);
  const corps =
    cadre(l, h, 20) +
    logo(`logos/${outil.depot}.svg`, 24, 24, 44) +
    `<text class="b" x="82" y="44" font-size="21" font-weight="700" fill="${c.texte}">${echappe(outil.depot)}</text>` +
    `<text class="m" x="82" y="63" font-size="11.5" fill="${c.terne}">${echappe(outil.npm)}</text>` +
    (enTete ? etiquette(l - 24 - largeur(enTete, 11, 'm') * 1.08 - 12, 30, enTete) : '') +
    `<path d="M24 88H${l - 24}" stroke="${c.ligne}" stroke-opacity=".08"/>` +
    lignes.map((t, i) => `<text class="b" x="24" y="${118 + i * 21}" font-size="15" fill="${c.doux}">${echappe(t)}</text>`).join('') +
    courbe(r.serie, 24, 160, l - 48, 36, `courbe-${outil.depot.replace(/\W/g, '')}`) +
    reperes(24, 214, chiffres(r), { taille: 15, ecart: 14 }) +
    source(24, h - 20, r);
  return svg({ l, h, titre: `${outil.depot}: ${outil.ligne}`, polices: ['b', 'm'], style: traceCourbe, corps });
}

function une(outil: Outil, r: Releve): string {
  const l = large;
  const h = 260;
  const bord = 300;
  const x0 = bord + 40;
  const lignes = coupe(outil.ligne, 19, l - x0 - 36, 2);
  const corps =
    cadre(l, h, 24) +
    `<path d="M${bord} 28V${h - 28}" stroke="${c.ligne}" stroke-opacity=".08"/>` +
    logo(`logos/${outil.depot}.svg`, 36, 36, 64) +
    `<text class="b" x="36" y="146" font-size="32" font-weight="800" fill="${c.texte}" letter-spacing="-.01em">${echappe(outil.depot)}</text>` +
    `<text class="m" x="37" y="172" font-size="12.5" fill="${c.terne}">${echappe(outil.npm)}</text>` +
    etiquette(37, h - 36, 'start here') +
    lignes.map((t, i) => `<text class="b" x="${x0}" y="${66 + i * 26}" font-size="19" fill="${c.doux}">${echappe(t)}</text>`).join('') +
    courbe(r.serie, x0, 116, l - x0 - 36, 40, 'courbe-une') +
    reperes(x0, 176, chiffres(r), { taille: 18, ecart: 22 }) +
    source(l - 36, h - 22, r, 'end');
  return svg({ l, h, titre: `${outil.depot}: ${outil.ligne}`, polices: ['b', 'm'], style: traceCourbe, corps });
}

function stack(colonnes: 1 | 2): string {
  const l = colonnes === 2 ? large : etroit;
  const rangeeH = 108;
  const pasX = colonnes === 2 ? 98 : 92;
  const h = Math.ceil(pile.length / colonnes) * rangeeH + 26;
  let corps = cadre(l, h, 22);
  pile.forEach((famille, i) => {
    const x0 = colonnes === 2 && i % 2 ? 470 : colonnes === 2 ? 36 : 26;
    const y0 = 28 + Math.floor(i / colonnes) * rangeeH;
    corps += etiquette(x0, y0 + 12, famille.famille);
    famille.outils.forEach(([nom, libelle], j) => {
      const cx = x0 + 22 + j * pasX;
      corps += icone(nom, cx - 14, y0 + 30, 28, c.doux);
      corps += `<text class="m" x="${cx}" y="${y0 + 80}" font-size="11" fill="${c.terne}" text-anchor="middle">${echappe(libelle)}</text>`;
    });
  });
  if (colonnes === 2) corps += `<path d="M${l / 2} 28V${h - 28}" stroke="${c.ligne}" stroke-opacity=".08"/>`;
  return svg({ l, h, titre: 'Stack', polices: ['m'], corps });
}

function series(jours: Jour[]): { total: number; plusLongue: number; enCours: number } {
  const total = jours.reduce((s, j) => s + j.n, 0);
  let plusLongue = 0;
  let suite = 0;
  for (const j of jours) {
    suite = j.n > 0 ? suite + 1 : 0;
    plusLongue = Math.max(plusLongue, suite);
  }
  let enCours = 0;
  for (let i = jours.length - 1; i >= 0; i--) {
    if (jours[i].n > 0) enCours++;
    else if (i < jours.length - 1) break;
  }
  return { total, plusLongue, enCours };
}

function activite(annee: Jour[], semainesMax: number): string {
  const ample = semainesMax > 30;
  const l = ample ? large : etroit;
  const cote = 12;
  const ecart = 3.2;
  const x0 = ample ? 48 : 44;
  const y0 = 50;
  const dernier = new Date(`${annee.at(-1)?.date}T00:00:00Z`).getUTCDay();
  const jours = annee.slice(-Math.min(annee.length, (semainesMax - 1) * 7 + dernier + 1));
  const decalage = new Date(`${jours[0]?.date}T00:00:00Z`).getUTCDay();
  const semaines = Math.ceil((jours.length + decalage) / 7);
  const grille = y0 + 7 * (cote + ecart);
  const h = grille + 82;
  const actifs = annee.map((j) => j.n).filter((n) => n > 0).sort((a, b) => a - b);
  const seuils = [0.25, 0.5, 0.75].map((q) => actifs[Math.floor(q * (actifs.length - 1))] ?? 1);
  const teintes = [c.vide, '#3a2b2e', '#6a464c', '#b27a82', c.rose];
  const niveau = (n: number): number => (n === 0 ? 0 : 1 + seuils.filter((v) => n > v).length);
  const { total, plusLongue, enCours } = series(annee);
  const noms = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let cases = '';
  let repere = '';
  let dernierMois = -1;
  jours.forEach((j, i) => {
    const k = i + decalage;
    const s = Math.floor(k / 7);
    const d = k % 7;
    const x = x0 + s * (cote + ecart);
    const y = y0 + d * (cote + ecart);
    const m = new Date(`${j.date}T00:00:00Z`).getUTCMonth();
    if (d === 0 && m !== dernierMois) {
      dernierMois = m;
      if (s > 0 && s < semaines - 1) repere += `<text class="m" x="${x}" y="${y0 - 12}" font-size="10.5" fill="${c.terne}">${noms[m]}</text>`;
    }
    if (i === jours.length - 1) cases += `<circle class="ici" cx="${x + cote / 2}" cy="${y + cote / 2}" r="${cote / 2.4}" fill="${c.rose}"><title>${j.date}: ${j.n}</title></circle>`;
    else cases += `<rect x="${x}" y="${y}" width="${cote}" height="${cote}" rx="3" fill="${teintes[niveau(j.n)]}"><title>${j.date}: ${j.n}</title></rect>`;
  });
  const lignes = ['', 'Mon', '', 'Wed', '', 'Fri', '']
    .map((t, d) => (t ? `<text class="m" x="${x0 - 10}" y="${y0 + d * (cote + ecart) + 9.5}" font-size="10" fill="${c.terne}" text-anchor="end">${t}</text>` : ''))
    .join('');
  const paires: [string, string][] = [
    ['last year', `${nombre.format(total)} contributions`],
    ['longest streak', `${plusLongue} days`],
    ['current streak', `${enCours} days`],
  ];
  const pied = reperes(x0 - 4, grille + 22, ample ? paires : paires.slice(0, 2), { taille: ample ? 17 : 15, ecart: ample ? 24 : 16 });
  const legende = ample
    ? `<text class="m" x="${l - 130}" y="${grille + 52}" font-size="10" fill="${c.terne}" text-anchor="end">less</text>` +
      teintes.map((t, i) => `<rect x="${l - 122 + i * 15}" y="${grille + 42}" width="${cote}" height="${cote}" rx="3" fill="${t}"/>`).join('') +
      `<text class="m" x="${l - 42}" y="${grille + 52}" font-size="10" fill="${c.terne}">more</text>`
    : '';
  const style =
    '.ici{transform-box:fill-box;transform-origin:center;animation:ici 2.4s ease-in-out infinite}' +
    '@keyframes ici{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}' +
    '@media (prefers-reduced-motion:reduce){.ici{animation:none}}';
  const corps = cadre(l, h, 22) + repere + lignes + cases + pied + legende;
  return svg({ l, h, titre: `${total} contributions in the last year`, polices: ['b', 'm'], style, corps });
}

function signature(): string {
  const l = large;
  const h = 48;
  const corps =
    `<linearGradient id="filet-g" x1="0" x2="1"><stop offset="0" stop-color="${c.ligne}" stop-opacity="0"/><stop offset="1" stop-color="${c.ligne}" stop-opacity=".3"/></linearGradient>` +
    `<linearGradient id="filet-d" x1="0" x2="1"><stop offset="0" stop-color="${c.ligne}" stop-opacity=".3"/><stop offset="1" stop-color="${c.ligne}" stop-opacity="0"/></linearGradient>` +
    `<path d="M40 24H${l / 2 - 30}" stroke="url(#filet-g)"/><path d="M${l / 2 + 30} 24H${l - 40}" stroke="url(#filet-d)"/>` +
    monogramme(l / 2 - 13, 11, 26, { classe: 'trace' });
  return svg({ l, h, titre: 'ix-xs', polices: [], style: traceMonogramme, corps });
}

await mkdir(sortie, { recursive: true });
const ecrire = (nom: string, contenu: string): Promise<void> => writeFile(new URL(nom, sortie), contenu);

await ecrire('entete.svg', entete());
await ecrire('entete-mobile.svg', enteteEtroit());
await ecrire('signature.svg', signature());
await ecrire('stack.svg', stack(2));
await ecrire('stack-mobile.svg', stack(1));
for (const l of liens) await ecrire(`${l.fichier}.svg`, lien(l.cle, l.valeur));

for (const outil of outils) {
  const r = await releve(outil.depot, outil.npm);
  if ('une' in outil) {
    await ecrire(`outil-${outil.depot}.svg`, une(outil, r));
    await ecrire(`outil-${outil.depot}-mobile.svg`, carte(outil, r, 'start here'));
  } else await ecrire(`outil-${outil.depot}.svg`, carte(outil, r));
  console.log(outil.depot, r.version ?? '?');
}

const annee = await calendrier();
if (annee?.length) {
  await ecrire('activite.svg', activite(annee, 53));
  await ecrire('activite-mobile.svg', activite(annee, 23));
} else console.log('activite: pas de jeton, carte non regeneree');
