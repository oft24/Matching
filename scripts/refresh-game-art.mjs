import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const outputDir = path.resolve('frontend/public/games');

const assets = [
  {
    id: 'valorant',
    url: 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/083baed63d306ee9ba41df4971ac0f6bb0222032-1920x1080.jpg?accountingTag=VAL',
  },
  { id: 'marvel-rivals', url: 'https://www.marvelrivals.com/pc/gw/20240301101352/data/share.jpg' },
  { id: 'rainbow-six', url: 'https://cdn.akamai.steamstatic.com/steam/apps/359550/header.jpg' },
  { id: 'pubg', url: 'https://cdn.akamai.steamstatic.com/steam/apps/578080/header.jpg' },
  { id: 'warzone', url: 'https://cdn.akamai.steamstatic.com/steam/apps/1938090/header.jpg' },
  { id: 'gta5', url: 'https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg' },
  { id: 'dead-by-daylight', url: 'https://cdn.akamai.steamstatic.com/steam/apps/381210/header.jpg' },
  {
    id: 'minecraft',
    url: 'https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/About-Minecraft_Featured-Image-0_570x321.jpg',
  },
];

await mkdir(outputDir, { recursive: true });

for (const asset of assets) {
  const response = await fetch(asset.url);
  if (!response.ok) throw new Error(`${asset.id}: HTTP ${response.status}`);
  const source = Buffer.from(await response.arrayBuffer());
  const destination = path.join(outputDir, `${asset.id}.webp`);
  await sharp(source)
    .resize(960, 540, { fit: 'cover', position: 'attention', withoutEnlargement: false })
    .webp({ quality: 82, effort: 5 })
    .toFile(destination);
  console.log(`GAME_ART_OK ${asset.id}`);
}
