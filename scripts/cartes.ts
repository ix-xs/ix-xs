import { mkdir, writeFile } from 'node:fs/promises';
import { liens, outils, pile, profil } from '../profil.ts';
import { c, cligne, coupe, echappe, icone, largeur, logo, patte, photo, rangee, svg, trait, yeux } from './dessin.ts';

type Outil = (typeof outils)[number];
type Jour = { date: string; n: number };

const sortie = new URL('../dist/', import.meta.url);
const jeton = process.env['GITHUB_TOKEN'] ?? process.env['GH_TOKEN'];
const jour = new Date().toISOString().slice(0, 10);
const nombre = new Intl.NumberFormat('en-US');
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
  if (!jeton) return null;
  const requete = `query{user(login:"${profil.login}"){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`;
  const reponse = await lire<any>('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `Bearer ${jeton}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query: requete }),
  });
  const semaines = reponse?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  if (!Array.isArray(semaines)) return null;
  return semaines.flatMap((s: any) => s.contributionDays.map((d: any) => ({ date: d.date, n: d.contributionCount })));
}

const pasAnimes =
  '.pas{opacity:0;animation:pas 7s infinite both}' +
  '@keyframes pas{0%{opacity:0}3%{opacity:.95}45%{opacity:.4}62%,100%{opacity:0}}' +
  '@media (prefers-reduced-motion:reduce){.pas{animation:none;opacity:.4}}';

function trace(n: number, x: number, y: number, ecart: number, taille: number, cadence: number): string {
  return Array.from({ length: n }, (_, i) =>
    patte(x + i * ecart, i % 2 ? y - 14 : y, taille, 90, `class="pas" style="animation-delay:${(i * cadence).toFixed(2)}s"`),
  ).join('');
}

function medaillon(cx: number, cy: number, r: number): string {
  return (
    `<clipPath id="medaillon"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
    `<circle cx="${cx}" cy="${cy}" r="${r + 7}" fill="${c.fond}"/>` +
    `<g clip-path="url(#medaillon)"><rect x="${cx - r}" y="${cy - r}" width="${r}" height="${r * 2}" fill="${c.rose}"/><rect x="${cx}" y="${cy - r}" width="${r}" height="${r * 2}" fill="${c.surface}"/>` +
    `<image href="${photo('avatar.png')}" x="${cx - r}" y="${cy - r * 0.9}" width="${r * 2}" height="${r * 2}"/></g>`
  );
}

function phrase(x: number, y: number, lignes: string[], interligne: number): string {
  let sortie = '';
  lignes.forEach((ligne, i) => {
    const ou = ligne.indexOf(profil.marque);
    if (ou >= 0) sortie += trait(x + largeur(ligne.slice(0, ou), 21) - 6, y + i * interligne - 20, largeur(profil.marque, 21) + 14, 26);
  });
  return (
    sortie +
    lignes.map((l, i) => `<text class="b" x="${x}" y="${y + i * interligne}" font-size="21" font-weight="500" fill="${c.doux}">${echappe(l)}</text>`).join('')
  );
}

function entete(): string {
  const l = 880;
  const h = 290;
  const bord = 622;
  const corps =
    `<clipPath id="cadre"><rect width="${l}" height="${h}" rx="22"/></clipPath><g clip-path="url(#cadre)">` +
    `<rect width="${l}" height="${h}" fill="${c.fond}"/>` +
    `<path d="M${bord} 0C${bord - 40} 80 ${bord + 38} 190 ${bord - 12} ${h}H${l}V0Z" fill="${c.papier}"/>` +
    medaillon(bord + 128, 134, 96) +
    `<text class="m" x="44" y="58" font-size="12.5" fill="${c.rose}" letter-spacing=".08em">00 · ${echappe(profil.role.toUpperCase())}</text>` +
    `<text class="b" x="42" y="124" font-size="66" font-weight="800" fill="${c.texte}" letter-spacing="-.02em">${echappe(profil.nom)}</text>` +
    phrase(44, 166, [profil.phrase], 0) +
    `<text class="m" x="44" y="196" font-size="12.5" fill="${c.terne}">${echappe(profil.lieu)}</text>` +
    `<text class="g" x="44" y="236" font-size="19" fill="${c.rose}">${echappe(profil.devise)}</text>` +
    `<g fill="${c.rose}">${trace(13, 52, 272, 44, 1.1, 0.3)}</g>` +
    `</g>`;
  return svg({ l, h, titre: `${profil.nom}: ${profil.phrase}`, polices: ['b', 'm', 'g'], style: pasAnimes, corps });
}

function enteteEtroit(): string {
  const l = etroit;
  const h = 330;
  const corps =
    `<clipPath id="cadre"><rect width="${l}" height="${h}" rx="20"/></clipPath><g clip-path="url(#cadre)">` +
    `<rect width="${l}" height="${h}" fill="${c.fond}"/>` +
    `<path d="M${l - 150} 0C${l - 160} 70 ${l - 90} 150 ${l} 158V0Z" fill="${c.papier}"/>` +
    medaillon(l - 70, 72, 50) +
    `<text class="m" x="26" y="40" font-size="11.5" fill="${c.rose}" letter-spacing=".08em">00 · ${echappe(profil.role.toUpperCase())}</text>` +
    `<text class="b" x="24" y="104" font-size="58" font-weight="800" fill="${c.texte}" letter-spacing="-.02em">${echappe(profil.nom)}</text>` +
    phrase(26, 158, profil.phrase.split(/(?<=,) /), 28) +
    `<text class="m" x="26" y="218" font-size="12" fill="${c.terne}">${echappe(profil.lieu)}</text>` +
    profil.devise
      .split(/(?<=[.]) /)
      .map((t, i) => `<text class="g" x="26" y="${254 + i * 23}" font-size="18" fill="${c.rose}">${echappe(t)}</text>`)
      .join('') +
    `<g fill="${c.rose}">${trace(8, 34, 316, 40, 1, 0.4)}</g>` +
    `</g>`;
  return svg({ l, h, titre: `${profil.nom}: ${profil.phrase}`, polices: ['b', 'm', 'g'], style: pasAnimes, corps });
}

function pictogramme(cle: string, cx: number, cy: number, taille: number): string {
  const x = cx - taille / 2;
  const y = cy - taille / 2;
  if (cle === 'site')
    return `<path transform="translate(${x} ${y}) scale(${taille / 48})" fill="${c.encre}" d="M24 11H28.3Q30.5 11 32.2 9.6L40.15 3.03Q42 1.5 42.6 3.82L44.5 11.07Q45 13 45 15V36A10 10 0 0 1 35 46H13A10 10 0 0 1 3 36V15Q3 13 3.5 11.07L5.4 3.82Q6 1.5 7.85 3.03L15.8 9.6Q17.5 11 19.7 11Z"/>`;
  if (cle === 'mail')
    return (
      `<g transform="translate(${x} ${y}) scale(${taille / 24})"><path fill="${c.encre}" d="M2 6.5A2 2 0 0 1 4 4.5h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"/>` +
      `<path d="M3.5 7l8.5 6.2L20.5 7" fill="none" stroke="${c.rose}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`
    );
  return icone(cle, x, y, taille, c.encre);
}

function lien(cle: string, valeur: string): string {
  const taille = 12;
  const h = 28;
  const lc = 38;
  const lv = largeur(valeur, taille, 'm') + 26;
  const l = lc + lv;
  const corps =
    `<rect width="${l}" height="${h}" rx="14" fill="${c.surface}"/>` +
    `<path d="M14 0H${lc + 3}C${lc - 4} 10 ${lc + 6} 18 ${lc - 2} ${h}H14A14 14 0 0 1 14 0Z" fill="${c.rose}"/>` +
    pictogramme(cle, 19, h / 2, 14) +
    `<text class="m" x="${lc + 12}" y="18.2" font-size="${taille}" fill="${c.texte}">${echappe(valeur)}</text>`;
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

function badges(r: Releve): [string, string][] {
  const paires: [string, string][] = [];
  if (r.version) paires.push(['npm', `v${r.version}`]);
  if (r.telechargements !== undefined) paires.push(['30 days', `${nombre.format(r.telechargements)} dl`]);
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
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.rose}" stop-opacity=".32"/><stop offset="1" stop-color="${c.rose}" stop-opacity="0"/></linearGradient>` +
    `<path d="${ligne}L${x + l} ${y + h}L${x} ${y + h}Z" fill="url(#${id})"/>` +
    `<path d="${ligne}" fill="none" stroke="${c.rose}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<circle cx="${xf}" cy="${yf}" r="3" fill="${c.rose}"/>`
  );
}

const source = (x: number, y: number, r: Releve, ancre = 'start'): string =>
  `<text class="m" x="${x}" y="${y}" font-size="10" fill="${c.terne}" text-anchor="${ancre}">${echappe([histoire(r), `read ${jour}`].filter(Boolean).join(' · '))}</text>`;

function carte(outil: Outil, r: Releve, note?: string): string {
  const l = etroit;
  const h = 272;
  const haut = 82;
  const lignes = coupe(outil.ligne, 15, l - 44, 2);
  const corps =
    `<clipPath id="cadre"><rect width="${l}" height="${h}" rx="18"/></clipPath><g clip-path="url(#cadre)">` +
    `<rect width="${l}" height="${h}" fill="${c.surface}"/>` +
    `<path d="M0 0H${l}V${haut - 6}C${l * 0.7} ${haut + 10} ${l * 0.35} ${haut - 14} 0 ${haut + 4}Z" fill="${c.papier}"/>` +
    logo(`logos/${outil.depot}.svg`, 22, 18, 44) +
    `<text class="b" x="80" y="42" font-size="22" font-weight="700" fill="${c.texte}">${echappe(outil.depot)}</text>` +
    `<text class="m" x="80" y="61" font-size="11.5" fill="${c.papierDoux}">${echappe(outil.npm)}</text>` +
    (note ? `<text class="g" x="${l - 22}" y="64" font-size="17" fill="${c.rose}" text-anchor="end">${echappe(note)}</text>` : '') +
    yeux(l - 34, 30) +
    lignes.map((t, i) => `<text class="b" x="22" y="${120 + i * 21}" font-size="15" fill="${c.doux}">${echappe(t)}</text>`).join('') +
    courbe(r.serie, 22, 162, l - 44, 34, `courbe-${outil.depot.replace(/\W/g, '')}`) +
    rangee(22, 210, badges(r), 11) +
    source(22, h - 14, r) +
    `</g>`;
  return svg({ l, h, titre: `${outil.depot}: ${outil.ligne}`, polices: note ? ['b', 'm', 'g'] : ['b', 'm'], style: cligne, corps });
}

function une(outil: Outil, r: Releve): string {
  const l = 880;
  const h = 236;
  const bord = 300;
  const x0 = bord + 44;
  const lignes = coupe(outil.ligne, 19, l - x0 - 30, 2);
  const corps =
    `<clipPath id="cadre"><rect width="${l}" height="${h}" rx="22"/></clipPath><g clip-path="url(#cadre)">` +
    `<rect width="${l}" height="${h}" fill="${c.surface}"/>` +
    `<path d="M0 0H${bord}C${bord - 34} 70 ${bord + 30} 170 ${bord - 10} ${h}H0Z" fill="${c.papier}"/>` +
    logo(`logos/${outil.depot}.svg`, 32, 32, 64) +
    `<text class="b" x="32" y="146" font-size="32" font-weight="800" fill="${c.texte}" letter-spacing="-.01em">${echappe(outil.depot)}</text>` +
    `<text class="m" x="33" y="172" font-size="12.5" fill="${c.papierDoux}">${echappe(outil.npm)}</text>` +
    `<text class="g" x="${x0}" y="46" font-size="19" fill="${c.rose}">start here</text>` +
    yeux(l - 40, 38) +
    lignes.map((t, i) => `<text class="b" x="${x0}" y="${82 + i * 26}" font-size="19" fill="${c.doux}">${echappe(t)}</text>`).join('') +
    courbe(r.serie, x0, 132, l - x0 - 34, 36, 'courbe-une') +
    rangee(x0, 184, badges(r), 12) +
    source(l - 34, h - 16, r, 'end') +
    `</g>`;
  return svg({ l, h, titre: `${outil.depot}: ${outil.ligne}`, polices: ['b', 'm', 'g'], style: cligne, corps });
}

const etiquettes: Record<string, string> = {
  speak: 'I speak',
  run: 'it runs on',
  build: 'I build with',
  'talk to': 'it talks to',
  check: 'checked by',
  ship: 'shipped with',
};

function stack(colonnes: 1 | 2): string {
  const l = colonnes === 2 ? 880 : etroit;
  const rangeeH = 104;
  const pasX = colonnes === 2 ? 98 : 92;
  const h = Math.ceil(pile.length / colonnes) * rangeeH + 22;
  let corps = `<rect width="${l}" height="${h}" rx="22" fill="${c.surface}"/>`;
  pile.forEach((famille, i) => {
    const x0 = colonnes === 2 && i % 2 ? 462 : colonnes === 2 ? 34 : 26;
    const y0 = 24 + Math.floor(i / colonnes) * rangeeH;
    corps += `<text class="g" x="${x0}" y="${y0 + 18}" font-size="19" fill="${c.rose}">${echappe(etiquettes[famille.famille] ?? famille.famille)}</text>`;
    famille.outils.forEach(([nom, libelle], j) => {
      const cx = x0 + 22 + j * pasX;
      corps += icone(nom, cx - 14, y0 + 32, 28, c.doux);
      corps += `<text class="m" x="${cx}" y="${y0 + 80}" font-size="11" fill="${c.terne}" text-anchor="middle">${echappe(libelle)}</text>`;
    });
  });
  if (colonnes === 2) corps += `<path d="M440 26V${h - 26}" stroke="${c.texte}" stroke-opacity=".07" stroke-dasharray="2 6" stroke-linecap="round"/>`;
  return svg({ l, h, titre: 'Stack', polices: ['m', 'g'], corps });
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
  const large = semainesMax > 30;
  const l = large ? 880 : etroit;
  const cote = 12;
  const ecart = 3.2;
  const x0 = large ? 46 : 42;
  const y0 = 46;
  const dernier = new Date(`${annee.at(-1)?.date}T00:00:00Z`).getUTCDay();
  const jours = annee.slice(-Math.min(annee.length, (semainesMax - 1) * 7 + dernier + 1));
  const decalage = new Date(`${jours[0]?.date}T00:00:00Z`).getUTCDay();
  const semaines = Math.ceil((jours.length + decalage) / 7);
  const grille = y0 + 7 * (cote + ecart);
  const h = grille + (large ? 64 : 92);
  const actifs = annee.map((j) => j.n).filter((n) => n > 0).sort((a, b) => a - b);
  const seuils = [0.25, 0.5, 0.75].map((q) => actifs[Math.floor(q * (actifs.length - 1))] ?? 1);
  const teintes = [c.vide, '#4a3437', '#7d5459', '#c0858c', c.rose];
  const niveau = (n: number): number => (n === 0 ? 0 : 1 + seuils.filter((v) => n > v).length);
  const { total, plusLongue, enCours } = series(annee);
  const mois = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let cases = '';
  let reperes = '';
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
      if (s > 0 && s < semaines - 1) reperes += `<text class="m" x="${x}" y="${y0 - 12}" font-size="10.5" fill="${c.terne}">${mois[m]}</text>`;
    }
    if (i === jours.length - 1) cases += `<g class="ici" fill="${c.rose}">${patte(x + cote / 2, y + cote / 2 - 0.5, 0.95, 0)}</g>`;
    else cases += `<rect x="${x}" y="${y}" width="${cote}" height="${cote}" rx="3.2" fill="${teintes[niveau(j.n)]}"><title>${j.date}: ${j.n}</title></rect>`;
  });
  const lignes = ['', 'Mon', '', 'Wed', '', 'Fri', '']
    .map((t, d) => (t ? `<text class="m" x="${x0 - 10}" y="${y0 + d * (cote + ecart) + 9.5}" font-size="10" fill="${c.terne}" text-anchor="end">${t}</text>` : ''))
    .join('');
  const fort = (v: number | string): string => `<tspan font-weight="700" fill="${c.texte}">${v}</tspan>`;
  const point = `<tspan fill="${c.terne}">  ·  </tspan>`;
  const pied = grille + 34;
  const textes = large
    ? `<text class="b" x="${x0}" y="${pied}" font-size="15" fill="${c.doux}">${fort(nombre.format(total))} contributions in the last year${point}longest streak ${fort(plusLongue)} days${point}current streak ${fort(enCours)} days</text>`
    : `<text class="b" x="${x0 - 16}" y="${pied}" font-size="15" fill="${c.doux}">${fort(nombre.format(total))} contributions in the last year</text>` +
      `<text class="b" x="${x0 - 16}" y="${pied + 24}" font-size="15" fill="${c.doux}">longest streak ${fort(plusLongue)} days${point}current ${fort(enCours)}</text>`;
  const legende = large
    ? `<text class="m" x="${l - 128}" y="${pied}" font-size="10" fill="${c.terne}" text-anchor="end">less</text>` +
      teintes.map((t, i) => `<rect x="${l - 120 + i * 15}" y="${pied - 10}" width="${cote}" height="${cote}" rx="3.2" fill="${t}"/>`).join('') +
      `<text class="m" x="${l - 40}" y="${pied}" font-size="10" fill="${c.terne}">more</text>`
    : '';
  const style =
    '.ici{transform-box:fill-box;transform-origin:center;animation:ici 2.4s ease-in-out infinite}' +
    '@keyframes ici{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}' +
    '@media (prefers-reduced-motion:reduce){.ici{animation:none}}';
  const corps = `<rect width="${l}" height="${h}" rx="22" fill="${c.surface}"/>` + reperes + lignes + cases + textes + legende;
  return svg({ l, h, titre: `${total} contributions in the last year`, polices: ['b', 'm'], style, corps });
}

function sentier(): string {
  const style =
    '.pas{opacity:0;animation:pas 8s infinite both}' +
    '@keyframes pas{0%{opacity:0}3%{opacity:.7}50%{opacity:.25}70%,100%{opacity:0}}' +
    '@media (prefers-reduced-motion:reduce){.pas{animation:none;opacity:.3}}';
  return svg({ l: 880, h: 44, titre: 'A cat walked by', polices: [], style, corps: `<g fill="${c.rose}">${trace(19, 28, 28, 46, 0.95, 0.26)}</g>` });
}

await mkdir(sortie, { recursive: true });
const ecrire = (nom: string, contenu: string): Promise<void> => writeFile(new URL(nom, sortie), contenu);

await ecrire('entete.svg', entete());
await ecrire('entete-mobile.svg', enteteEtroit());
await ecrire('sentier.svg', sentier());
await ecrire('stack.svg', stack(2));
await ecrire('stack-mobile.svg', stack(1));
for (const l of liens) await ecrire(`${l.fichier}.svg`, lien(l.cle, l.valeur));

for (const outil of outils) {
  const r = await releve(outil.depot, outil.npm);
  if ('une' in outil) {
    await ecrire(`outil-${outil.depot}.svg`, une(outil, r));
    await ecrire(`outil-${outil.depot}-mobile.svg`, carte(outil, r, 'start here'));
  } else await ecrire(`outil-${outil.depot}.svg`, carte(outil, r));
  console.log(outil.depot, r);
}

const annee = await calendrier();
if (annee?.length) {
  await ecrire('activite.svg', activite(annee, 53));
  await ecrire('activite-mobile.svg', activite(annee, 23));
} else console.log('activite: pas de jeton, carte non regeneree');
