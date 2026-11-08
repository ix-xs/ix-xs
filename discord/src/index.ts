import { adresses, polices as policesNom, rendre, type Images, type Presence, type Profil } from './carte.ts';
import type { Police } from '../../scripts/trace.ts';

const fichiers: Record<Police, string> = {
  b: 'bricolage-grotesque-latin.woff2',
  m: 'fragment-mono-latin.woff2',
  g: 'gochi-hand-latin.woff2',
};

interface Env {
  DISCORD_ID: string;
  PROFIL_PUBLIC?: string;
  DECO_ANIMEE?: string;
}

const memoire = new Map<string, string>();

function base64(octets: Uint8Array): string {
  let binaire = '';
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}

async function brut(url: string): Promise<{ type: string; donnees: string } | undefined> {
  try {
    const reponse = await fetch(url);
    if (!reponse.ok) return undefined;
    return {
      type: reponse.headers.get('content-type')?.split(';')[0] ?? 'image/png',
      donnees: base64(new Uint8Array(await reponse.arrayBuffer())),
    };
  } catch {
    return undefined;
  }
}

async function donnee(url: string | undefined): Promise<string | undefined> {
  if (!url) return undefined;
  const connue = memoire.get(url);
  if (connue) return connue;
  const r = await brut(url);
  if (!r) return undefined;
  const uri = `data:${r.type};base64,${r.donnees}`;
  if (memoire.size > 60) memoire.clear();
  memoire.set(url, uri);
  return uri;
}

export async function images(p: Presence, profil: Profil, anime: boolean): Promise<Images> {
  const liste = Object.entries(adresses(p, profil, anime));
  const resolues = await Promise.all(liste.map(([, url]) => donnee(url)));
  return Object.fromEntries(liste.map(([cle], i) => [cle, resolues[i]]));
}

// les polices du site vivent dans le dépôt du profil, à côté des cartes
export async function policesSite(): Promise<Record<Police, string>> {
  const entrees = await Promise.all(
    (Object.keys(fichiers) as Police[]).map(async (cle) => {
      const url = `https://raw.githubusercontent.com/ix-xs/ix-xs/main/assets/fonts/${fichiers[cle]}`;
      let donnees = memoire.get(url);
      if (!donnees) {
        donnees = (await brut(url))?.donnees ?? '';
        if (donnees) memoire.set(url, donnees);
      }
      return [cle, donnees] as const;
    }),
  );
  return Object.fromEntries(entrees) as Record<Police, string>;
}

export async function policeNom(p: Presence): Promise<string | undefined> {
  const famille = policesNom[p.discord_user.display_name_styles?.font_id ?? 0];
  if (!famille) return undefined;
  const cle = `police:${famille}`;
  const connue = memoire.get(cle);
  if (connue) return connue;
  for (const poids of [700, 400]) {
    const r = await brut(`https://cdn.jsdelivr.net/fontsource/fonts/${famille}@latest/latin-${poids}-normal.woff2`);
    if (r) {
      memoire.set(cle, r.donnees);
      return r.donnees;
    }
  }
  return undefined;
}

let dernier: { quand: number; profil: Profil } | undefined;

// Discord ne donne les badges, pronoms et couleurs de profil qu'à un compte utilisateur : dstn.to les relaie publiquement
export async function profil(env: Env): Promise<Profil> {
  if (env.PROFIL_PUBLIC === 'non') return {};
  if (dernier && Date.now() - dernier.quand < 10 * 60000) return dernier.profil;
  try {
    const reponse = await fetch(`https://dcdn.dstn.to/profile/${env.DISCORD_ID}`);
    if (!reponse.ok) return dernier?.profil ?? {};
    const brut = (await reponse.json()) as {
      badges?: { icon?: string }[];
      user_profile?: { pronouns?: string; theme_colors?: number[] | null };
    };
    const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;
    const couleurs = brut.user_profile?.theme_colors;
    const sortie: Profil = {
      badges: (brut.badges ?? []).map((b) => b.icon ?? '').filter((icone) => /^[0-9a-f]{32}$/.test(icone)),
      pronoms: brut.user_profile?.pronouns || undefined,
      theme: couleurs?.length === 2 ? [hex(couleurs[1]), hex(couleurs[0])] : undefined,
    };
    dernier = { quand: Date.now(), profil: sortie };
    return sortie;
  } catch {
    return dernier?.profil ?? {};
  }
}

export default {
  async fetch(requete: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(requete.url);
    if (pathname !== '/' && pathname !== '/mobile') return new Response('Not found', { status: 404 });
    const reponse = await fetch(`https://api.lanyard.rest/v1/users/${env.DISCORD_ID}`).catch(() => null);
    const corps = (await reponse?.json().catch(() => null)) as { success?: boolean; data?: Presence } | null;
    if (!corps?.success || !corps.data) return new Response('Lanyard unavailable', { status: 502 });
    const p = corps.data;
    const pr = await profil(env);
    const [imgs, nom, polices] = await Promise.all([images(p, pr, env.DECO_ANIMEE !== 'non'), policeNom(p), policesSite()]);
    const svg = rendre(p, imgs, (cle) => polices[cle], { etroit: pathname === '/mobile', maintenant: Date.now(), nom, profil: pr });
    return new Response(svg, {
      headers: {
        'content-type': 'image/svg+xml; charset=utf-8',
        'cache-control': 'no-cache, no-store, must-revalidate, max-age=0',
      },
    });
  },
};
