import { c, echappe, habille, largeur, patte, type Police } from '../../scripts/trace.ts';

export type Statut = 'online' | 'idle' | 'dnd' | 'offline';

export interface Activite {
  type: number;
  name: string;
  details?: string;
  state?: string;
  application_id?: string;
  timestamps?: { start?: number; end?: number };
  assets?: { large_image?: string; large_text?: string; small_image?: string };
  emoji?: { name?: string; id?: string; animated?: boolean };
}

export interface Presence {
  discord_user: {
    id: string;
    username: string;
    global_name?: string | null;
    avatar?: string | null;
    public_flags?: number;
    avatar_decoration_data?: { asset: string } | null;
    primary_guild?: { tag?: string | null; badge?: string | null; identity_guild_id?: string | null; identity_enabled?: boolean } | null;
    collectibles?: { nameplate?: { asset: string } | null } | null;
    display_name_styles?: { colors: number[]; effect_id: number; font_id: number } | null;
  };
  discord_status: Statut;
  activities: Activite[];
  active_on_discord_desktop?: boolean;
  active_on_discord_mobile?: boolean;
  active_on_discord_web?: boolean;
  kv?: Record<string, string>;
  spotify?: {
    song: string;
    artist: string;
    album: string;
    album_art_url?: string | null;
    timestamps: { start: number; end: number };
  } | null;
}

export interface Profil {
  badges?: string[];
  pronoms?: string;
  theme?: [string, string];
}

export type Images = Record<string, string | undefined>;

const verbes: Record<number, string> = { 0: 'playing', 1: 'streaming', 2: 'listening to', 3: 'watching', 5: 'competing in' };
const statuts: Record<Statut, string> = { online: 'online', idle: 'idle', dnd: 'do not disturb', offline: 'offline' };
const repos: Record<'la' | 'absent', string> = {
  la: 'Nothing running. The cat has the keyboard.',
  absent: 'Offline. The cat is guarding the keyboard.',
};

const drapeaux: [number, string][] = [
  [1, '5e74e9b61934fc1f67c65515d1f7e60d'],
  [2, '3f9748e53446a137a052f3454e2de41e'],
  [4, 'bf01d1073931f921909045f3a39fd264'],
  [8, '2717692c7dca7289b35297368a940dd0'],
  [64, '8a88d63823d8a71cd5e390baa45efa02'],
  [128, '011940fd013da3f7fb926e4a1cd2e618'],
  [256, '3aa41de486fa12454c3761e8e223442e'],
  [512, '7060786766c9c840eb3019e725d2b358'],
  [16384, '848f79194d4be5ff5f81505cbd0ce1e6'],
  [131072, '6df5892e0f35b051f8b61eace34f4967'],
  [262144, 'fee1624003e2fee35cb398e125dc479b'],
  [4194304, '6bdc42827a38498929a4920da12695d9'],
];

// identifiants de police du client Discord, relevés dans son JavaScript public
export const polices: Record<number, string> = {
  1: 'bangers',
  2: 'biorhyme',
  3: 'cherry-bomb-one',
  4: 'chicle',
  6: 'museomoderno',
  8: 'pixelify-sans',
  12: 'zilla-slab',
  13: 'playpen-sans',
  14: 'orbitron',
  15: 'new-rocker',
  16: 'kalam',
};

const cdn = 'https://cdn.discordapp.com';

const image = (cle: string, app: string | undefined): string | undefined => {
  if (cle.startsWith('mp:')) return `https://media.discordapp.net/${cle.slice(3)}`;
  if (cle.startsWith('spotify:')) return `https://i.scdn.co/image/${cle.slice(8)}`;
  return app ? `${cdn}/app-assets/${app}/${cle}.png?size=160` : undefined;
};

export function principale(p: Presence): Activite | undefined {
  return p.activities.find((a) => a.type !== 4);
}

function badges(p: Presence, profil: Profil): string[] {
  const flags = p.discord_user.public_flags ?? 0;
  const connus = profil.badges?.length ? profil.badges : drapeaux.filter(([bit]) => flags & bit).map(([, icone]) => icone);
  const ajoutes = (p.kv?.['badges'] ?? '').split(',').map((s) => s.trim()).filter((s) => /^[0-9a-f]{32}$/.test(s));
  return [...new Set([...connus, ...ajoutes])].slice(0, 13);
}

export function adresses(p: Presence, profil: Profil, anime: boolean): Images {
  const a = principale(p);
  const perso = p.activities.find((x) => x.type === 4);
  const u = p.discord_user;
  const clan = u.primary_guild;
  const liste: Images = {
    avatar: u.avatar ? `${cdn}/avatars/${u.id}/${u.avatar}.png?size=256` : `${cdn}/embed/avatars/${Number(BigInt(u.id) >> 22n) % 6}.png`,
    deco: u.avatar_decoration_data ? `${cdn}/avatar-decoration-presets/${u.avatar_decoration_data.asset}.png?size=160&passthrough=${anime}` : undefined,
    plaque: u.collectibles?.nameplate ? `${cdn}/assets/collectibles/${u.collectibles.nameplate.asset}static.png` : undefined,
    clan: clan?.badge && clan.identity_guild_id ? `${cdn}/guild-tag-badges/${clan.identity_guild_id}/${clan.badge}.png?size=32` : undefined,
    grande: a?.type === 2 && p.spotify?.album_art_url ? p.spotify.album_art_url : a?.assets?.large_image ? image(a.assets.large_image, a.application_id) : undefined,
    petite: a?.assets?.small_image ? image(a.assets.small_image, a.application_id) : undefined,
    emoji: perso?.emoji?.id ? `${cdn}/emojis/${perso.emoji.id}.${perso.emoji.animated ? 'gif' : 'png'}?size=48` : undefined,
  };
  badges(p, profil).forEach((hash, i) => (liste[`badge${i}`] = `${cdn}/badge-icons/${hash}.png`));
  return liste;
}

function tronque(texte: string, taille: number, max: number, poids: 400 | 700 = 400): string {
  if (largeur(texte, taille, 'b', poids) <= max) return texte;
  let court = texte;
  while (court.length > 1 && largeur(`${court}…`, taille, 'b', poids) > max) court = court.slice(0, -1);
  return `${court.trimEnd()}…`;
}

function coupe(texte: string, taille: number, max: number, lignes: number): string[] {
  const sortie: string[] = [];
  let courante = '';
  for (const mot of texte.split(/\s+/)) {
    const essai = courante ? `${courante} ${mot}` : mot;
    if (largeur(essai, taille) <= max || !courante) courante = essai;
    else {
      sortie.push(courante);
      courante = mot;
    }
  }
  if (courante) sortie.push(courante);
  if (sortie.length > lignes) {
    sortie.length = lignes;
    sortie[lignes - 1] = tronque(`${sortie[lignes - 1]}…`, taille, max);
  }
  return sortie;
}

function duree(depuis: number, maintenant: number): string {
  const minutes = Math.floor((maintenant - depuis) / 60000);
  if (minutes < 1) return 'just started';
  const h = Math.floor(minutes / 60);
  return h ? `for ${h}h ${String(minutes % 60).padStart(2, '0')}m` : `for ${minutes}m`;
}

const minutage = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

function theme(p: Presence, profil: Profil): [string, string] {
  const brut = (p.kv?.['theme'] ?? '').split(',').map((s) => s.trim().replace(/^#/, ''));
  if (brut.length === 2 && brut.every((s) => /^[0-9a-f]{6}$/i.test(s))) return [`#${brut[0]}`, `#${brut[1]}`];
  return profil.theme ?? [c.rose, c.fond];
}

function nom(p: Presence, x: number, y: number, taille: number, police: boolean): { defs: string; dessin: string; attributs: string } {
  const u = p.discord_user;
  const texte = echappe(u.global_name || u.username);
  const style = u.display_name_styles;
  const couleurs = style?.colors?.length ? style.colors.map(hex) : [c.texte];
  const effet = style?.effect_id ?? 1;
  const famille = police ? 'n,b' : 'b';
  const degrade = couleurs.length > 1 && [2, 7, 8].includes(effet);
  const defs =
    (degrade
      ? `<linearGradient id="nom" x1="0" x2="1" spreadMethod="reflect">${couleurs
          .map((t, i) => `<stop offset="${(i / (couleurs.length - 1)).toFixed(2)}" stop-color="${t}"/>`)
          .join('')}<animateTransform attributeName="gradientTransform" type="translate" values="-.5 0;.5 0;-.5 0" dur="${effet === 7 ? 3 : 8}s" repeatCount="indefinite"/></linearGradient>`
      : '') +
    (effet === 3 || effet === 6
      ? `<filter id="effet" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="${effet === 3 ? 3 : 2}" result="h"/><feFlood flood-color="${couleurs[0]}" flood-opacity="${effet === 3 ? 0.9 : 0.6}"/><feComposite in2="h" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
      : effet === 5 || effet === 8
        ? `<filter id="effet" x="-10%" y="-20%" width="130%" height="150%"><feDropShadow dx="${effet === 5 ? 2 : 0}" dy="2" stdDeviation="0" flood-color="${effet === 5 ? (couleurs[1] ?? c.encre) : '#000'}" flood-opacity="${effet === 5 ? 0.9 : 0.55}"/></filter>`
        : '');
  const remplissage = degrade ? 'url(#nom)' : couleurs[0];
  const filtre = [3, 5, 6, 8].includes(effet) ? ' filter="url(#effet)"' : '';
  const contour = effet === 4 ? ` stroke="#000" stroke-width="${taille / 9}" paint-order="stroke" stroke-linejoin="round"` : '';
  const brillance =
    effet === 8
      ? `<clipPath id="reflet"><rect x="${x - 4}" y="${y - taille}" width="600" height="${taille * 0.52}"/></clipPath><text x="${x}" y="${y}" font-family="${famille}" font-size="${taille}" font-weight="700" fill="#fff" opacity=".22" clip-path="url(#reflet)">${texte}</text>`
      : '';
  return {
    defs,
    attributs: `font-family="${famille}" font-weight="700" fill="${remplissage}"${filtre}${contour}`,
    dessin: `<text x="${x}" y="${y}" font-family="${famille}" font-size="${taille}" font-weight="700" fill="${remplissage}"${filtre}${contour}>${texte}</text>${brillance}`,
  };
}

function regard(statut: Statut, cx: number, cy: number, fond: string): string {
  const oeil = (x: number): string => {
    if (statut === 'online')
      return `<g class="oeil"><ellipse cx="${x}" cy="${cy}" rx="3.6" ry="4.4" fill="${c.rose}"/><ellipse cx="${x}" cy="${cy}" rx="1" ry="3.4" fill="${c.encre}"/></g>`;
    if (statut === 'idle')
      return `<ellipse cx="${x}" cy="${cy}" rx="3.6" ry="4.4" fill="${c.rose}"/><ellipse cx="${x}" cy="${cy}" rx="1" ry="3.4" fill="${c.encre}"/><path d="M${x - 4.4} ${cy - 5}H${x + 4.4}V${cy - 0.3}Q${x} ${cy + 1.3} ${x - 4.4} ${cy - 0.3}Z" fill="${fond}"/><path d="M${x - 3.8} ${cy - 0.4}Q${x} ${cy + 1.2} ${x + 3.8} ${cy - 0.4}" stroke="${c.rose}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    return `<path d="M${x - 3.6} ${cy - 0.6}Q${x} ${cy + 2.8} ${x + 3.6} ${cy - 0.6}" stroke="${statut === 'dnd' ? '#f28b82' : c.terne}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  };
  return `<rect x="${cx - 17}" y="${cy - 10}" width="34" height="20" rx="10" fill="${fond}"/>` + oeil(cx - 6) + oeil(cx + 6);
}

function medaillon(images: Images, cx: number, cy: number, r: number, fond: string, statut: Statut): string {
  const d = r * 2 * 1.2;
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="${fond}"/>` +
    `<clipPath id="avatar"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
    (images['avatar']
      ? `<image href="${images['avatar']}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#avatar)" preserveAspectRatio="xMidYMid slice"/>`
      : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.rose}"/>`) +
    (images['deco'] ? `<image href="${images['deco']}" x="${cx - d / 2}" y="${cy - d / 2}" width="${d}" height="${d}"/>` : '') +
    regard(statut, cx + r * 0.72, cy + r * 0.78, fond)
  );
}

function bulle(p: Presence, images: Images, x: number, y: number, max: number, fond: string): string {
  const perso = p.activities.find((a) => a.type === 4);
  if (!perso || (!perso.state && !perso.emoji)) return '';
  const emojiTexte = perso.emoji && !perso.emoji.id ? `${perso.emoji.name} ` : '';
  const decale = images['emoji'] ? 22 : 0;
  const texte = tronque(`${emojiTexte}${perso.state ?? ''}`.trim(), 14, max - 28 - decale);
  const l = largeur(texte, 14) + 28 + decale + (emojiTexte ? 6 : 0);
  return (
    `<g><circle cx="${x - 10}" cy="${y + 34}" r="4" fill="${fond}"/><circle cx="${x - 2}" cy="${y + 24}" r="7" fill="${fond}"/>` +
    `<rect x="${x}" y="${y}" width="${l}" height="32" rx="16" fill="${fond}"/>` +
    (images['emoji'] ? `<image href="${images['emoji']}" x="${x + 13}" y="${y + 7}" width="18" height="18"/>` : '') +
    `<text class="b" x="${x + 14 + decale}" y="${y + 21}" font-size="14" fill="${c.texte}">${echappe(texte)}</text></g>`
  );
}

function identite(p: Presence, profil: Profil, images: Images, x: number, y: number, max: number): string {
  const u = p.discord_user;
  const pronoms = p.kv?.['pronoms'] ?? profil.pronoms;
  const ligne = `${u.username}${pronoms ? ` · ${pronoms}` : ''}`;
  let sortie = `<text class="m" x="${x}" y="${y}" font-size="13" fill="${c.doux}">${echappe(ligne)}</text>`;
  const clan = u.primary_guild;
  if (clan?.tag && clan.identity_enabled !== false) {
    const px = x + largeur(ligne, 13, 'm') + 12;
    const l = largeur(clan.tag, 12, 'b', 700) + (images['clan'] ? 34 : 18);
    if (px + l < x + max)
      sortie +=
        `<rect x="${px}" y="${y - 15}" width="${l}" height="21" rx="6" fill="#000" fill-opacity=".35"/>` +
        (images['clan'] ? `<image href="${images['clan']}" x="${px + 6}" y="${y - 12}" width="15" height="15"/>` : '') +
        `<text class="b" x="${px + (images['clan'] ? 26 : 9)}" y="${y}" font-size="12" font-weight="700" fill="${c.texte}">${echappe(clan.tag)}</text>`;
  }
  return sortie;
}

function rangeeBadges(images: Images, x: number, y: number): string {
  const liste = Object.keys(images).filter((k) => k.startsWith('badge') && images[k]);
  if (!liste.length) return '';
  const l = liste.length * 27 + 10;
  return (
    `<rect x="${x}" y="${y}" width="${l}" height="32" rx="9" fill="#000" fill-opacity=".3"/>` +
    liste.map((k, i) => `<image href="${images[k]}" x="${x + 7 + i * 27}" y="${y + 5}" width="22" height="22"/>`).join('')
  );
}

function vignette(src: string | undefined, x: number, y: number, taille: number, petite?: string): string {
  const r = taille * 0.18;
  const fond = src
    ? `<clipPath id="vignette"><rect x="${x}" y="${y}" width="${taille}" height="${taille}" rx="${r}"/></clipPath><image href="${src}" x="${x}" y="${y}" width="${taille}" height="${taille}" clip-path="url(#vignette)" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="${x}" y="${y}" width="${taille}" height="${taille}" rx="${r}" fill="${c.papier}"/><g fill="${c.rose}">${patte(x + taille / 2, y + taille / 2 - 2, taille / 34, 0)}</g>`;
  if (!petite) return fond;
  const pr = taille * 0.17;
  const px = x + taille - pr * 0.6;
  const py = y + taille - pr * 0.6;
  return (
    fond +
    `<clipPath id="petite"><circle cx="${px}" cy="${py}" r="${pr}"/></clipPath><circle cx="${px}" cy="${py}" r="${pr + 3}" fill="${c.surface}"/>` +
    `<image href="${petite}" x="${px - pr}" y="${py - pr}" width="${pr * 2}" height="${pr * 2}" clip-path="url(#petite)" preserveAspectRatio="xMidYMid slice"/>`
  );
}

function activite(p: Presence, images: Images, x: number, y: number, l: number, h: number, maintenant: number): string {
  const a = principale(p);
  let sortie = `<rect x="${x}" y="${y}" width="${l}" height="${h}" rx="16" fill="#000" fill-opacity=".28"/>`;
  if (!a) {
    const texte = repos[p.discord_status === 'offline' ? 'absent' : 'la'].split(/(?<=[.]) /);
    return (
      sortie +
      texte
        .map((t, i) => `<text class="g" x="${x + 22}" y="${y + h / 2 + 6 + i * 26 - (texte.length - 1) * 13}" font-size="21" fill="${c.rose}">${echappe(t)}</text>`)
        .join('')
    );
  }
  const taille = Math.min(84, h - 62);
  const tx = x + 22 + taille + 18;
  const max = l - (tx - x) - 20;
  const spotify = a.type === 2 && p.spotify;
  const titre = spotify ? p.spotify!.song : a.name;
  const lignes = spotify ? [p.spotify!.artist, p.spotify!.album] : [a.details, a.state].filter((v): v is string => Boolean(v));
  sortie +=
    `<text class="g" x="${x + 22}" y="${y + 30}" font-size="18" fill="${c.rose}">${verbes[a.type] ?? 'playing'}</text>` +
    vignette(images['grande'], x + 22, y + 44, taille, images['petite']) +
    `<text class="b" x="${tx}" y="${y + 62}" font-size="17" font-weight="700" fill="${c.texte}">${echappe(tronque(titre, 17, max, 700))}</text>` +
    lignes
      .slice(0, 2)
      .map((t, i) => `<text class="b" x="${tx}" y="${y + 84 + i * 19}" font-size="13.5" fill="${c.doux}">${echappe(tronque(t, 13.5, max))}</text>`)
      .join('');
  const bas = y + 44 + taille - 2;
  if (spotify) {
    const { start, end } = p.spotify!.timestamps;
    const part = Math.min(1, Math.max(0, (maintenant - start) / (end - start)));
    const barre = max - 84;
    sortie +=
      `<rect x="${tx}" y="${bas - 4}" width="${barre}" height="4" rx="2" fill="#fff" fill-opacity=".12"/>` +
      `<rect x="${tx}" y="${bas - 4}" width="${Math.max(4, barre * part)}" height="4" rx="2" fill="${c.rose}"/>` +
      `<text class="m" x="${tx + max}" y="${bas}" font-size="11" fill="${c.terne}" text-anchor="end">${minutage(maintenant - start)} / ${minutage(end - start)}</text>`;
  } else if (a.timestamps?.start) {
    sortie += `<text class="m" x="${tx}" y="${bas}" font-size="11.5" fill="${c.terne}">${duree(a.timestamps.start, maintenant)}</text>`;
  }
  return sortie;
}

function apropos(p: Presence, x: number, y: number, max: number, lignes: number): { dessin: string; h: number } {
  const bio = p.kv?.['bio'];
  if (!bio) return { dessin: '', h: 0 };
  const texte = coupe(bio.replace(/\\n/g, ' '), 14, max, lignes);
  return {
    dessin:
      `<text class="m" x="${x}" y="${y}" font-size="10.5" fill="${c.terne}" letter-spacing=".08em">ABOUT ME</text>` +
      texte.map((t, i) => `<text class="b" x="${x}" y="${y + 22 + i * 19}" font-size="14" fill="${c.doux}">${echappe(t)}</text>`).join(''),
    h: 22 + texte.length * 19 + 8,
  };
}

function plateformes(p: Presence): string {
  const ou = [p.active_on_discord_desktop && 'desktop', p.active_on_discord_mobile && 'mobile', p.active_on_discord_web && 'web'].filter(Boolean);
  return statuts[p.discord_status] + (ou.length && p.discord_status !== 'offline' ? ` on ${ou.join(' + ')}` : '');
}

function banniere(l: number, h: number, couleurs: [string, string]): string {
  const pas = Array.from({ length: Math.ceil(l / 70) }, (_, i) => patte(30 + i * 70, i % 2 ? h * 0.38 : h * 0.62, 1.3, 90)).join('');
  return (
    `<linearGradient id="ban" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${couleurs[0]}"/><stop offset="1" stop-color="${c.papier}"/></linearGradient>` +
    `<rect width="${l}" height="${h}" fill="url(#ban)"/><g fill="${c.encre}" opacity=".12">${pas}</g>`
  );
}

export function rendre(
  p: Presence,
  images: Images,
  base64: (cle: Police) => string,
  o: { etroit: boolean; maintenant: number; nom?: string; profil?: Profil },
): string {
  const profil = o.profil ?? {};
  const svg = habille(base64);
  const u = p.discord_user;
  const pseudo = u.global_name || u.username;
  const a = principale(p);
  const couleurs = theme(p, profil);
  const interieur = '#141416';
  const titre = `${pseudo} on Discord: ${statuts[p.discord_status]}${a ? `, ${verbes[a.type] ?? 'playing'} ${a.type === 2 && p.spotify ? p.spotify.song : a.name}` : ''}`;
  const style =
    (o.nom ? `@font-face{font-family:n;src:url(data:font/woff2;base64,${o.nom})}` : '') +
    '.oeil{transform-box:fill-box;transform-origin:center;animation:cligne 5s infinite}' +
    '@keyframes cligne{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}}' +
    '@media (prefers-reduced-motion:reduce){.oeil{animation:none}}';
  const cadre = (l: number, h: number): string =>
    `<linearGradient id="bord" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${couleurs[0]}"/><stop offset="1" stop-color="${couleurs[1]}"/></linearGradient>` +
    `<rect width="${l}" height="${h}" rx="24" fill="url(#bord)"/><rect x="3" y="3" width="${l - 6}" height="${h - 6}" rx="21" fill="${interieur}"/>` +
    `<linearGradient id="voile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${couleurs[0]}" stop-opacity=".16"/><stop offset=".6" stop-color="${couleurs[0]}" stop-opacity="0"/></linearGradient>` +
    `<rect x="3" y="3" width="${l - 6}" height="${h - 6}" rx="21" fill="url(#voile)"/>`;
  const source = (l: number, h: number): string =>
    `<text class="m" x="${l - 24}" y="${h - 14}" font-size="9.5" fill="${c.terne}" text-anchor="end" opacity=".7">live from discord</text>`;
  const membre = (x: number, y: number, l: number, attributs: string): string => {
    const h = 60;
    const perso = p.activities.find((a) => a.type === 4);
    const sous = a ? `${verbes[a.type] ?? 'playing'} ${a.type === 2 && p.spotify ? p.spotify.song : a.name}` : perso?.state || plateformes(p);
    const d = 46;
    return (
      `<clipPath id="membre"><rect x="${x}" y="${y}" width="${l}" height="${h}" rx="12"/></clipPath><g clip-path="url(#membre)">` +
      `<rect x="${x}" y="${y}" width="${l}" height="${h}" fill="#000" fill-opacity=".3"/>` +
      (images['plaque'] ? `<image href="${images['plaque']}" x="${x}" y="${y}" width="${l}" height="${h}" preserveAspectRatio="xMaxYMid slice"/>` : '') +
      `</g>` +
      `<clipPath id="mini"><circle cx="${x + 32}" cy="${y + 30}" r="19"/></clipPath>` +
      (images['avatar'] ? `<image href="${images['avatar']}" x="${x + 13}" y="${y + 11}" width="38" height="38" clip-path="url(#mini)"/>` : '') +
      (images['deco'] ? `<image href="${images['deco']}" x="${x + 32 - d / 2}" y="${y + 30 - d / 2}" width="${d}" height="${d}"/>` : '') +
      `<text x="${x + 64}" y="${y + 28}" font-size="18" ${attributs}>${echappe(pseudo)}</text>` +
      `<text class="b" x="${x + 64}" y="${y + 47}" font-size="12.5" fill="${c.doux}">${echappe(tronque(sous, 12.5, l - 84))}</text>`
    );
  };
  const haut = (l: number, hb: number): string =>
    `<clipPath id="haut-carte"><path d="M3 24A21 21 0 0 1 24 3H${l - 24}A21 21 0 0 1 ${l - 3} 24V${hb}H3Z"/></clipPath>` +
    `<g clip-path="url(#haut-carte)">${banniere(l, hb, couleurs)}</g>`;

  if (!o.etroit) {
    const l = 880;
    const hb = 128;
    const gauche = 360;
    const x0 = gauche + 28;
    const large = l - gauche - 56;
    const bio = apropos(p, x0 + 6, 236, large - 12, 2);
    const h = 392 + bio.h;
    const n = nom(p, 40, 254, 36, Boolean(o.nom));
    const depart = 146 + 60 + 14 + bio.h;
    const corps =
      `<defs>${n.defs}</defs>` +
      cadre(l, h) +
      haut(l, hb) +
      medaillon(images, 100, hb + 6, 58, interieur, p.discord_status) +
      bulle(p, images, 182, hb - 50, 420, interieur) +
      n.dessin +
      identite(p, profil, images, 41, 284, gauche - 50) +
      rangeeBadges(images, 38, 300) +
      `<text class="m" x="41" y="${h - 26}" font-size="11.5" fill="${c.terne}">${echappe(plateformes(p))}</text>` +
      membre(x0, 146, large, n.attributs) +
      bio.dessin +
      activite(p, images, x0, depart, large, h - depart - 34, o.maintenant) +
      source(l, h);
    return svg({ l, h, titre, polices: ['b', 'm', 'g'], style, corps });
  }

  const l = 412;
  const hb = 132;
  const bio = apropos(p, 26, 438, l - 52, 3);
  const debut = 420 + bio.h;
  const h = debut + 196;
  const n = nom(p, 24, 266, 32, Boolean(o.nom));
  const corps =
    `<defs>${n.defs}</defs>` +
    cadre(l, h) +
    haut(l, hb) +
    medaillon(images, 78, hb + 10, 52, interieur, p.discord_status) +
    bulle(p, images, 160, hb + 16, l - 180, interieur) +
    n.dessin +
    identite(p, profil, images, 25, 294, l - 50) +
    rangeeBadges(images, 22, 308) +
    membre(18, 348, l - 36, n.attributs) +
    bio.dessin +
    `<text class="m" x="26" y="${debut + 4}" font-size="12" fill="${c.terne}">${echappe(plateformes(p))}</text>` +
    activite(p, images, 18, debut + 18, l - 36, 150, o.maintenant) +
    source(l, h);
  return svg({ l, h, titre, polices: ['b', 'm', 'g'], style, corps });
}
