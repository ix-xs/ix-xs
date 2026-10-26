import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import worker, { images, policeNom, profil } from './src/index.ts';
import { rendre, type Presence, type Statut } from './src/carte.ts';
import { fichiers } from '../scripts/dessin.ts';

const polices = Object.fromEntries(
  Object.entries(fichiers).map(([cle, nom]) => [cle, readFileSync(new URL(`../assets/fonts/${nom}`, import.meta.url)).toString('base64')]),
) as Record<keyof typeof fichiers, string>;

const vars = new URL('.dev.vars', import.meta.url);
const secrets = existsSync(vars)
  ? Object.fromEntries(
      readFileSync(vars, 'utf8')
        .split(/\r?\n/)
        .filter((l) => l.includes('='))
        .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]),
    )
  : {};
const env = { DISCORD_ID: '782307250751406091', ...secrets };
const maintenant = Date.now();
const logo = (nom: string): string =>
  `data:image/svg+xml;base64,${readFileSync(new URL(`../assets/${nom}`, import.meta.url)).toString('base64')}`;

const vraie = (await (await fetch(`https://api.lanyard.rest/v1/users/${env.DISCORD_ID}`)).json()).data as Presence;
const pr = await profil(env);
const reelles = await images(vraie, pr, true);
const nom = await policeNom(vraie);
const humeur = vraie.activities.filter((a) => a.type === 4);

const demos: Record<string, { statut: Statut; presence: Partial<Presence>; grande?: string; petite?: string }> = {
  repos: { statut: 'idle', presence: { activities: humeur } },
  jeu: {
    statut: 'online',
    presence: {
      activities: [...humeur, { type: 0, name: 'Dofus', details: 'Hunting archmonsters', state: 'Server Imagiro', timestamps: { start: maintenant - 74 * 60000 } }],
    },
    grande: logo('logos/metamob.api.svg'),
  },
  code: {
    statut: 'dnd',
    presence: {
      activities: [{ type: 0, name: 'Visual Studio Code', details: 'Editing carte.ts', state: 'Workspace: ix-xs.dev', timestamps: { start: maintenant - 23 * 60000 } }],
    },
    grande: logo('logos/djs-bot.svg'),
    petite: logo('logo.svg'),
  },
  musique: {
    statut: 'online',
    presence: {
      activities: [...humeur, { type: 2, name: 'Spotify' }],
      spotify: { song: 'A song with a fairly long title, for the test', artist: 'Some artist', album: 'Some album', timestamps: { start: maintenant - 95000, end: maintenant + 130000 } },
    },
    grande: logo('logo.svg'),
  },
  absent: { statut: 'offline', presence: { activities: [] } },
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const [, premier, cle, format] = url.pathname.split('/');
  let corps: string | null = null;
  if (premier === 'demo' && cle && demos[cle]) {
    const d = demos[cle];
    const p = { ...vraie, ...d.presence, discord_status: d.statut } as Presence;
    corps = rendre(p, { ...reelles, grande: d.grande, petite: d.petite }, (k) => polices[k], { etroit: format === 'mobile', maintenant, nom, profil: pr });
  } else {
    const reponse = await worker.fetch(new Request(url), env);
    res.writeHead(reponse.status, Object.fromEntries(reponse.headers));
    res.end(await reponse.text());
    return;
  }
  res.writeHead(200, { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'no-store' });
  res.end(corps);
}).listen(4871, '127.0.0.1', () => console.log('http://localhost:4871'));
