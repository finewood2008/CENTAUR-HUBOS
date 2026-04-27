/**
 * Hub OS custom office layout.
 * Leader has a private office (left), employees work in the main area (right).
 * Layout: 25 cols x 16 rows
 * 
 * Legend:
 *   0 = WALL
 *   1 = FLOOR_1 (main office - warm wood)
 *   7 = FLOOR_7 (leader office - premium floor)
 *   9 = FLOOR_9 (break area - checkered)
 *   255 = VOID
 */

import type { OfficeLayout, PlacedFurniture, TileType } from './types';

const COLS = 25;
const ROWS = 16;

// prettier-ignore
const tiles: TileType[] = [
  // Row 0-1: void/roof margin
  255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
  255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
  // Row 2: top wall
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,255,
  // Row 3: leader office top
    0,  7,  7,  7,  7,  7,  7,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,255,
  // Row 4
    0,  7,  7,  7,  7,  7,  7,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,255,
  // Row 5
    0,  7,  7,  7,  7,  7,  7,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,255,
  // Row 6: door between leader office and main
    0,  7,  7,  7,  7,  7,  7,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,255,
  // Row 7
    0,  7,  7,  7,  7,  7,  7,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,255,
  // Row 8
    0,  7,  7,  7,  7,  7,  7,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,255,
  // Row 9: leader office bottom
    0,  7,  7,  7,  7,  7,  7,  0,  1,  1,  1,  1,  1,  1,  1,  1,  0,  9,  9,  9,  9,  9,  9,  0,255,
  // Row 10
    0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  0,  9,  9,  9,  9,  9,  9,  0,255,
  // Row 11
  255,255,255,255,255,255,255,  0,  1,  1,  1,  1,  1,  1,  1,  1,  0,  9,  9,  9,  9,  9,  9,  0,255,
  // Row 12
  255,255,255,255,255,255,255,  0,  1,  1,  1,  1,  1,  1,  1,  1,  0,  9,  9,  9,  9,  9,  9,  0,255,
  // Row 13: bottom wall
  255,255,255,255,255,255,255,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,255,
  // Row 14-15: void
  255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
  255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
];

const tileColors = new Array(COLS * ROWS).fill(null);

// Furniture placement
const furniture: PlacedFurniture[] = [
  // === Leader's Office (left room) ===
  // Leader's desk (front-facing, 3x2) at top-center of leader room
  { uid: 'leader-desk', type: 'DESK_FRONT', col: 2, row: 3, color: null },
  // Leader's PC on desk
  { uid: 'leader-pc', type: 'PC_FRONT_ON_1', col: 3, row: 3, color: null },
  // Leader's chair (facing desk = UP)
  { uid: 'leader-chair', type: 'CUSHIONED_CHAIR_BACK', col: 3, row: 5, color: null },
  // Bookshelf in leader's office
  { uid: 'leader-bookshelf', type: 'DOUBLE_BOOKSHELF', col: 1, row: 3, color: null },
  // Plant in leader's office
  { uid: 'leader-plant', type: 'LARGE_PLANT', col: 5, row: 3, color: null },
  // Small painting on leader's wall
  { uid: 'leader-painting', type: 'SMALL_PAINTING', col: 4, row: 2, color: null },

  // === Main Office Area (right room) - Employee Workstations ===
  // Workstation 1 (top-left of main area)
  { uid: 'desk-1', type: 'DESK_FRONT', col: 9, row: 3, color: null },
  { uid: 'pc-1', type: 'PC_FRONT_ON_1', col: 10, row: 3, color: null },
  { uid: 'chair-1', type: 'CUSHIONED_CHAIR_BACK', col: 10, row: 5, color: null },

  // Workstation 2 (top-right)
  { uid: 'desk-2', type: 'DESK_FRONT', col: 13, row: 3, color: null },
  { uid: 'pc-2', type: 'PC_FRONT_ON_2', col: 14, row: 3, color: null },
  { uid: 'chair-2', type: 'CUSHIONED_CHAIR_BACK', col: 14, row: 5, color: null },

  // Workstation 3 (middle-left)
  { uid: 'desk-3', type: 'DESK_FRONT', col: 9, row: 7, color: null },
  { uid: 'pc-3', type: 'PC_FRONT_ON_3', col: 10, row: 7, color: null },
  { uid: 'chair-3', type: 'CUSHIONED_CHAIR_BACK', col: 10, row: 9, color: null },

  // Workstation 4 (middle-right)
  { uid: 'desk-4', type: 'DESK_FRONT', col: 13, row: 7, color: null },
  { uid: 'pc-4', type: 'PC_FRONT_ON_1', col: 14, row: 7, color: null },
  { uid: 'chair-4', type: 'CUSHIONED_CHAIR_BACK', col: 14, row: 9, color: null },

  // Workstation 5 (bottom-left)
  { uid: 'desk-5', type: 'DESK_FRONT', col: 9, row: 10, color: null },
  { uid: 'pc-5', type: 'PC_FRONT_ON_2', col: 10, row: 10, color: null },
  { uid: 'chair-5', type: 'CUSHIONED_CHAIR_BACK', col: 10, row: 12, color: null },

  // === Decorations ===
  // Whiteboard in main area
  { uid: 'whiteboard', type: 'WHITEBOARD', col: 19, row: 2, color: null },
  // Plants
  { uid: 'plant-1', type: 'PLANT', col: 8, row: 3, color: null },
  { uid: 'plant-2', type: 'CACTUS', col: 22, row: 3, color: null },
  // Clock
  { uid: 'clock', type: 'CLOCK', col: 16, row: 2, color: null },
  // Large painting
  { uid: 'painting-main', type: 'LARGE_PAINTING', col: 20, row: 2, color: null },

  // === Break Area (bottom-right room) ===
  // Sofa
  { uid: 'sofa', type: 'SOFA_FRONT', col: 18, row: 10, color: null },
  // Coffee table
  { uid: 'coffee-table', type: 'COFFEE_TABLE', col: 19, row: 11, color: null },
  // Coffee machine
  { uid: 'coffee', type: 'COFFEE', col: 22, row: 9, color: null },
  // Potted plant
  { uid: 'break-plant', type: 'POT', col: 17, row: 9, color: null },
  // Bin
  { uid: 'bin', type: 'BIN', col: 22, row: 12, color: null },
];

export function createHubOSLayout(): OfficeLayout {
  return {
    version: 1,
    cols: COLS,
    rows: ROWS,
    tiles,
    tileColors,
    furniture,
    layoutRevision: 1,
  };
}
