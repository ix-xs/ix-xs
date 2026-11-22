export const profil = {
  login: 'ix-xs',
  nom: 'ix-xs',
  role: 'independent developer',
  lieu: 'Var, France · remote',
  titre: ['Custom websites,', 'built to be', 'found.'],
  marque: 'found',
  accroche: 'I design your site, put it online and get it found on Google. One person, from the first idea to the follow-up.',
};

export const liens = [
  { cle: 'site', valeur: 'ix-xs.dev', url: 'https://ix-xs.dev', fichier: 'lien-site' },
  { cle: 'discord', valeur: 'ix_xs', url: 'https://discord.com/users/782307250751406091', fichier: 'lien-discord' },
  { cle: 'mail', valeur: 'contact@ix-xs.dev', url: 'mailto:contact@ix-xs.dev', fichier: 'lien-mail' },
  { cle: 'npm', valeur: '~ix-xs.dev', url: 'https://www.npmjs.com/~ix-xs.dev', fichier: 'lien-npm' },
] as const;

export const outils = [
  { depot: 'djs-bot', npm: '@ix-xs/djs-bot', ligne: 'Discord bots, fully typed. A TypeScript-first framework on top of discord.js.', une: true },
  { depot: 'twitch.api', npm: '@ix-xs/twitch.api', ligne: 'The whole Twitch API, typed. Helix and EventSub, zero dependency.' },
  { depot: 'youtube.api', npm: '@ix-xs/youtube.api', ligne: 'The complete YouTube API client: Data, live, Analytics and Reporting.' },
  { depot: 'metamob.api', npm: '@ix-xs/metamob.api', ligne: 'The Metamob API client (Dofus), monsters and zones called by name.' },
  { depot: 'node-comfort', npm: '@ix-xs/node-comfort', ligne: 'The zero-dependency standard library for Node.js.' },
] as const;

export const pile = [
  { famille: 'I speak', outils: [['typescript', 'TypeScript'], ['javascript', 'JavaScript'], ['html5', 'HTML'], ['css', 'CSS']] },
  { famille: 'It runs on', outils: [['nodedotjs', 'Node.js'], ['bun', 'Bun'], ['deno', 'Deno']] },
  { famille: 'I build with', outils: [['astro', 'Astro'], ['threedotjs', 'Three.js'], ['ejs', 'EJS'], ['electron', 'Electron']] },
  { famille: 'It talks to', outils: [['discorddotjs', 'discord.js'], ['twitch', 'Twitch'], ['youtube', 'YouTube'], ['sqlite', 'SQLite']] },
  { famille: 'Checked by', outils: [['vitest', 'Vitest'], ['eslint', 'ESLint'], ['prettier', 'Prettier'], ['githubactions', 'Actions']] },
  { famille: 'Shipped with', outils: [['cloudflare', 'Cloudflare'], ['npm', 'npm'], ['umami', 'Umami'], ['git', 'Git']] },
] as const;
