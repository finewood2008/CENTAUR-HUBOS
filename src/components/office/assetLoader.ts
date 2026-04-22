/**
 * Asset loader for Hub OS virtual office.
 * Loads PNG sprites from public/assets/ and initializes the office engine.
 * Replaces pixel-agents' VSCode extension postMessage asset loading.
 */

import { buildDynamicCatalog, type LoadedAssetData } from './layout/furnitureCatalog';
import { setFloorSprites } from './floorTiles';
import { setWallSprites } from './wallTiles';
import { setCharacterTemplates } from './sprites/spriteData';
import type { SpriteData } from './types';
import { TILE_SIZE } from './types';

/** Parse a PNG image into SpriteData (2D array of hex color strings) */
function imageToSpriteData(img: HTMLImageElement): SpriteData {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  const sprite: SpriteData = [];
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a === 0) {
        row.push('');
      } else if (a === 255) {
        row.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
      } else {
        row.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a.toString(16).padStart(2, '0')}`);
      }
    }
    sprite.push(row);
  }
  return sprite;
}

/** Load a single image and return SpriteData */
async function loadSprite(url: string): Promise<SpriteData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(imageToSpriteData(img));
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

/** Load image and return HTMLImageElement */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

/** Extract character sprite frames from a character PNG.
 *  pixel-agents chars are 16x24 sprites in a spritesheet:
 *  Row 0: walk down (4 frames), Row 1: walk up (4 frames),
 *  Row 2: walk right (4 frames), + typing/reading frames
 */
function parseCharacterSheet(img: HTMLImageElement): {
  down: SpriteData[];
  up: SpriteData[];
  right: SpriteData[];
} {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const CHAR_W = 16;
  const CHAR_H = 24;
  const cols = Math.floor(img.naturalWidth / CHAR_W);
  const rows = Math.floor(img.naturalHeight / CHAR_H);

  function extractFrame(col: number, row: number): SpriteData {
    const imageData = ctx.getImageData(col * CHAR_W, row * CHAR_H, CHAR_W, CHAR_H);
    const { data } = imageData;
    const sprite: SpriteData = [];
    for (let y = 0; y < CHAR_H; y++) {
      const sRow: string[] = [];
      for (let x = 0; x < CHAR_W; x++) {
        const i = (y * CHAR_W + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a === 0) {
          sRow.push('');
        } else if (a === 255) {
          sRow.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
        } else {
          sRow.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a.toString(16).padStart(2, '0')}`);
        }
      }
      sprite.push(sRow);
    }
    return sprite;
  }

  // Extract frames - each character sheet has rows of frames
  // Row 0: down walk frames, Row 1: up walk frames, Row 2: right walk frames
  const down: SpriteData[] = [];
  const up: SpriteData[] = [];
  const right: SpriteData[] = [];

  for (let c = 0; c < Math.min(cols, 8); c++) {
    if (rows > 0) down.push(extractFrame(c, 0));
    if (rows > 1) up.push(extractFrame(c, 1));
    if (rows > 2) right.push(extractFrame(c, 2));
  }

  return { down, up, right };
}

/** Resolve asset path with Vite base URL */
function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${path}`.replace(/\/\//g, '/');
}

/** Load all floor tile PNGs */
async function loadFloors(): Promise<void> {
  const sprites: SpriteData[] = [];
  for (let i = 0; i <= 8; i++) {
    try {
      const sprite = await loadSprite(assetUrl(`assets/floors/floor_${i}.png`));
      sprites.push(sprite);
    } catch {
      // Floor not found, skip
    }
  }
  if (sprites.length > 0) {
    setFloorSprites(sprites);
  }
}

/** Load wall tiles */
async function loadWalls(): Promise<void> {
  try {
    const img = await loadImage(assetUrl('assets/walls/wall_0.png'));
    // wall_0.png is a 4x4 grid of 16x32 auto-tile pieces (64x128 total)
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const WALL_W = TILE_SIZE; // 16
    const WALL_H = TILE_SIZE * 2; // 32
    const cols = Math.floor(img.naturalWidth / WALL_W);
    const rows = Math.floor(img.naturalHeight / WALL_H);

    const wallSet: SpriteData[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const imageData = ctx.getImageData(c * WALL_W, r * WALL_H, WALL_W, WALL_H);
        const { data } = imageData;
        const sprite: SpriteData = [];
        for (let y = 0; y < WALL_H; y++) {
          const sRow: string[] = [];
          for (let x = 0; x < WALL_W; x++) {
            const i = (y * WALL_W + x) * 4;
            const rv = data[i], gv = data[i + 1], bv = data[i + 2], av = data[i + 3];
            if (av === 0) {
              sRow.push('');
            } else if (av === 255) {
              sRow.push(`#${rv.toString(16).padStart(2, '0')}${gv.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`);
            } else {
              sRow.push(`#${rv.toString(16).padStart(2, '0')}${gv.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}${av.toString(16).padStart(2, '0')}`);
            }
          }
          sprite.push(sRow);
        }
        wallSet.push(sprite);
      }
    }
    if (wallSet.length > 0) {
      setWallSprites([wallSet]);
    }
  } catch {
    // No wall sprites
  }
}

/** Load character sprites */
async function loadCharacters(): Promise<void> {
  const characters: Array<{ down: SpriteData[]; up: SpriteData[]; right: SpriteData[] }> = [];
  for (let i = 0; i <= 5; i++) {
    try {
      const img = await loadImage(assetUrl(`assets/characters/char_${i}.png`));
      characters.push(parseCharacterSheet(img));
    } catch {
      // Character not found, skip
    }
  }
  if (characters.length > 0) {
    setCharacterTemplates(characters);
  }
}

/** Load furniture catalog from manifest files */
async function loadFurniture(): Promise<void> {
  const FURNITURE_TYPES = [
    'BIN', 'BOOKSHELF', 'CACTUS', 'CLOCK', 'COFFEE', 'COFFEE_TABLE',
    'CUSHIONED_BENCH', 'CUSHIONED_CHAIR', 'DESK', 'DOUBLE_BOOKSHELF',
    'HANGING_PLANT', 'LARGE_PAINTING', 'LARGE_PLANT', 'PC',
    'PLANT', 'PLANT_2', 'POT', 'SMALL_PAINTING', 'SMALL_PAINTING_2',
    'SMALL_TABLE', 'SOFA', 'TABLE_FRONT', 'WHITEBOARD',
    'WOODEN_BENCH', 'WOODEN_CHAIR'
  ];

  const catalog: LoadedAssetData['catalog'] = [];
  const sprites: Record<string, SpriteData> = {};

  for (const type of FURNITURE_TYPES) {
    try {
      const manifestResp = await fetch(assetUrl(`assets/furniture/${type}/manifest.json`));
      if (!manifestResp.ok) continue;
      const manifest = await manifestResp.json();

      if (manifest.type === 'group' && manifest.members) {
        // Group furniture (e.g., DESK with DESK_FRONT and DESK_SIDE)
        for (const member of manifest.members) {
          try {
            const sprite = await loadSprite(assetUrl(`assets/furniture/${type}/${member.file}`));
            sprites[member.id] = sprite;
            catalog.push({
              id: member.id,
              label: manifest.name || type,
              category: manifest.category || 'misc',
              width: member.width,
              height: member.height,
              footprintW: member.footprintW,
              footprintH: member.footprintH,
              isDesk: manifest.category === 'desks',
              groupId: type,
              orientation: member.orientation,
              canPlaceOnSurfaces: manifest.canPlaceOnSurfaces,
              backgroundTiles: manifest.backgroundTiles,
              canPlaceOnWalls: manifest.canPlaceOnWalls,
              rotationScheme: manifest.rotationScheme,
            });
          } catch {
            // Skip failed member
          }
        }
      } else if (manifest.type === 'state-group' && manifest.members) {
        for (const member of manifest.members) {
          try {
            const sprite = await loadSprite(assetUrl(`assets/furniture/${type}/${member.file}`));
            sprites[member.id] = sprite;
            catalog.push({
              id: member.id,
              label: manifest.name || type,
              category: manifest.category || 'misc',
              width: member.width,
              height: member.height,
              footprintW: member.footprintW,
              footprintH: member.footprintH,
              isDesk: manifest.category === 'desks',
              groupId: type,
              state: member.state,
              canPlaceOnSurfaces: manifest.canPlaceOnSurfaces,
              backgroundTiles: manifest.backgroundTiles,
              canPlaceOnWalls: manifest.canPlaceOnWalls,
              animationGroup: member.animationGroup,
              frame: member.frame,
            });
          } catch {
            // Skip
          }
        }
      } else {
        // Single asset
        const file = manifest.file || `${type}.png`;
        try {
          const sprite = await loadSprite(assetUrl(`assets/furniture/${type}/${file}`));
          sprites[manifest.id || type] = sprite;
          catalog.push({
            id: manifest.id || type,
            label: manifest.name || type,
            category: manifest.category || 'misc',
            width: manifest.width || sprite[0]?.length || 16,
            height: manifest.height || sprite.length || 16,
            footprintW: manifest.footprintW || 1,
            footprintH: manifest.footprintH || 1,
            isDesk: manifest.category === 'desks',
            canPlaceOnSurfaces: manifest.canPlaceOnSurfaces,
            backgroundTiles: manifest.backgroundTiles,
            canPlaceOnWalls: manifest.canPlaceOnWalls,
          });
        } catch {
          // Skip
        }
      }
    } catch {
      // Manifest not found
    }
  }

  if (catalog.length > 0) {
    buildDynamicCatalog({ catalog, sprites });
  }
}

/** Load all assets and initialize the office engine */
export async function loadAllAssets(): Promise<void> {
  await Promise.all([
    loadFloors(),
    loadWalls(),
    loadCharacters(),
    loadFurniture(),
  ]);
}
