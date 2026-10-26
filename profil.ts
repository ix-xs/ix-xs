export const profil = {
  login: 'ix-xs',
  nom: 'ix-xs',
  phrase: 'I build websites, Discord bots and tools.',
  marque: 'websites',
  role: 'independent developer',
  lieu: 'La Seyne-sur-Mer, France',
  devise: "A perfectly normal GitHub profile. At least, that's what we tell the cat.",
};

export const liens = [
  { cle: 'site', valeur: 'ix-xs.dev', url: 'https://ix-xs.dev', fichier: 'lien-site' },
  { cle: 'npm', valeur: '~ix-xs.dev', url: 'https://www.npmjs.com/~ix-xs.dev', fichier: 'lien-npm' },
  { cle: 'discord', valeur: 'ix_xs', url: 'https://discord.com/users/782307250751406091', fichier: 'lien-discord' },
  { cle: 'mail', valeur: 'contact@ix-xs.dev', url: 'mailto:contact@ix-xs.dev', fichier: 'lien-mail' },
] as const;

export const outils = [
  { depot: 'djs-bot', npm: '@ix-xs/djs-bot', ligne: 'Discord bots, fully typed. A TypeScript-first framework on top of discord.js.', une: true },
  { depot: 'twitch.api', npm: '@ix-xs/twitch.api', ligne: 'The whole Twitch API, typed. Helix and EventSub, zero dependency.' },
  { depot: 'youtube.api', npm: '@ix-xs/youtube.api', ligne: 'The complete YouTube API client: Data, live, Analytics and Reporting.' },
  { depot: 'metamob.api', npm: '@ix-xs/metamob.api', ligne: 'The Metamob API client (Dofus), monsters and zones called by name.' },
  { depot: 'node-comfort', npm: '@ix-xs/node-comfort', ligne: 'The zero-dependency standard library for Node.js.' },
] as const;

export const pile = [
  { famille: 'speak', outils: [['typescript', 'TypeScript'], ['javascript', 'JavaScript'], ['html5', 'HTML'], ['css', 'CSS']] },
  { famille: 'run', outils: [['nodedotjs', 'Node.js'], ['bun', 'Bun'], ['deno', 'Deno']] },
  { famille: 'build', outils: [['astro', 'Astro'], ['threedotjs', 'Three.js'], ['ejs', 'EJS'], ['electron', 'Electron']] },
  { famille: 'talk to', outils: [['discorddotjs', 'discord.js'], ['twitch', 'Twitch'], ['youtube', 'YouTube'], ['sqlite', 'SQLite']] },
  { famille: 'check', outils: [['vitest', 'Vitest'], ['eslint', 'ESLint'], ['prettier', 'Prettier'], ['githubactions', 'Actions']] },
  { famille: 'ship', outils: [['cloudflare', 'Cloudflare'], ['npm', 'npm'], ['umami', 'Umami'], ['git', 'Git']] },
] as const;
