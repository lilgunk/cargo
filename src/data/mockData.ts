import type { Vehicle, CargoItem, PlacementStep } from '../types';

// ---------------------------------------------------------------------------
// VEHICLES
//
// Dimension sources:
//   Sprinter 311 CDI L3H2  — Mercedes-Benz official data (W907 generation)
//   Sprinter L2H2          — Mercedes-Benz official data (W907 generation)
//   Furgon S               — generic small van, approximate
//
// Wheel arch data:
//   heightFromFloor  — ~270 mm  (approximate, verify on physical vehicle)
//   intrusionPerSide — (cargoWidth - widthBetweenArches) / 2
//                      Sprinter: (1762 - 1232) / 2 = 265 mm  [official arch-to-arch = 1232 mm]
//   startX / endX    — estimated from rear-axle position, mark as approximate
// ---------------------------------------------------------------------------

export const VEHICLES: Vehicle[] = [
  {
    // -----------------------------------------------------------------------
    // Furgon S — small front-wheel-drive van (VW Caddy / Ford Transit Connect class)
    // Flat floor: no wheel arch intrusion into cargo area.
    // Dimensions: approximate / generic.
    // -----------------------------------------------------------------------
    id: 'small',
    name: 'Furgon S',
    length: 1800,   // mm — approximate
    width:  1530,   // mm — approximate
    height: 1250,   // mm — approximate
    maxWeight: 600, // kg — approximate
    cargoVolume: 3.3,
    wheelArches: [], // flat floor — no arches
  },

  {
    // -----------------------------------------------------------------------
    // Mercedes-Benz Sprinter L2H2 (W907)
    // Source: Mercedes-Benz official technical data
    //   Cargo length:              3665 mm  [official]
    //   Interior width:            1762 mm  [official]
    //   Interior height (H2):      1900 mm  [official]
    //   Width between wheel arches: 1232 mm  [official]
    //   Payload (3.5t GVW):       ~1100 kg  [official, varies by spec]
    //   Cargo volume:               10.5 m³  [official]
    //
    // Wheel arch geometry:
    //   intrusionPerSide = (1762 - 1232) / 2 = 265 mm
    //   heightFromFloor  = 270 mm  [APPROXIMATE — verify on vehicle]
    //   startX           = 800 mm from front wall  [APPROXIMATE]
    //   endX             = 2400 mm from front wall  [APPROXIMATE]
    // -----------------------------------------------------------------------
    id: 'medium',
    name: 'Mercedes Sprinter L2H2',
    length: 3665,
    width:  1762,
    height: 1900,
    maxWeight: 1100,
    cargoVolume: 10.5,
    wheelArches: [
      {
        heightFromFloor:  270,  // APPROXIMATE
        intrusionPerSide: 265,  // = (1762 - 1232) / 2
        startX: 800,            // APPROXIMATE
        endX:   2400,           // APPROXIMATE
      },
    ],
    images: undefined,
  },

  {
    // -----------------------------------------------------------------------
    // Mercedes-Benz Sprinter 311 CDI L3H2 Maxi Furgon (W907)
    // Source: Mercedes-Benz official technical data
    //   Cargo length:              4325 mm  [official — "Maxi" extended body]
    //   Interior width:            1762 mm  [official]
    //   Interior height (H2):      1900 mm  [official]
    //   Width between wheel arches: 1232 mm  [official]
    //   Max payload (3.5t GVW):   ~1100 kg  [official, base variant]
    //   Cargo volume:               14.1 m³  [official]
    //
    // Wheel arch geometry:
    //   intrusionPerSide = (1762 - 1232) / 2 = 265 mm
    //   heightFromFloor  = 270 mm  [APPROXIMATE — verify on vehicle]
    //   startX           = 2600 mm from front wall  [APPROXIMATE]
    //   endX             = 4000 mm from front wall  [APPROXIMATE]
    //
    // Notes:
    //   - The 311 designation means 3.5t GVW, 114 hp diesel
    //   - Actual payload depends on optional equipment (can be 900–1200 kg)
    //   - Rear door opening (approx): 1540 mm wide × 1820 mm high
    //   - Side door opening (approx): 1200 mm wide × 1760 mm high
    // -----------------------------------------------------------------------
    id: 'large',
    name: 'Mercedes Sprinter 311 CDI L3H2',
    length: 4325,
    width:  1762,
    height: 1900,
    maxWeight: 1100,
    cargoVolume: 14.1,
    wheelArches: [
      {
        heightFromFloor:  270,  // APPROXIMATE — verify on physical vehicle
        intrusionPerSide: 265,  // = (1762 - 1232) / 2  [official arch-to-arch = 1232 mm]
        startX: 2600,           // APPROXIMATE — rear axle zone
        endX:   4000,           // APPROXIMATE
      },
    ],
    images: {
      front: '/vehicles/sprinter-l3h2-front.png',
      side:  '/vehicles/sprinter-l3h2-side.png',
    },
    // Cutaway side photo — calibration measured in the 1334×890 source image
    cargoView: {
      src: '/vehicles/sprinter-cutaway.png',
      imgW: 1536,
      imgH: 1024,
      cargoLeft:  575,  // px: partition post behind cab
      cargoRight: 1438, // px: rear door inner edge
      cargoTop:   236,  // px: ceiling
      cargoFloor: 687,  // px: floor
      cropY: 55,        // cut top whitespace
      cropH: 760,       // show to y=815 — includes wheels
    },
  },
];

// ---------------------------------------------------------------------------
// SAMPLE CARGO — default items loaded on first launch
// ---------------------------------------------------------------------------
export const SAMPLE_CARGO: CargoItem[] = [
  {
    id: 'box-1',
    name: 'Box A',
    length: 600,
    width:  400,
    height: 300,
    weight: 15,
    quantity: 8,
    color: '#818cf8',
  },
  {
    id: 'box-2',
    name: 'Box B',
    length: 800,
    width:  600,
    height: 400,
    weight: 25,
    quantity: 4,
    color: '#34d399',
  },
  {
    id: 'box-3',
    name: 'Box C',
    length: 1000,
    width:  500,
    height: 500,
    weight: 30,
    quantity: 2,
    color: '#fbbf24',
  },
];

// ---------------------------------------------------------------------------
// MOCK_STEPS — kept for StepsPanel (currently hidden)
// ---------------------------------------------------------------------------
export const MOCK_STEPS: PlacementStep[] = [
  {
    stepIndex: 1,
    cargoId: 'box-1',
    cargoName: 'Box A · 600×400×300',
    position: { x: 0, y: 0, z: 0 },
    description: 'Placed at front wall, on floor',
  },
  {
    stepIndex: 2,
    cargoId: 'box-2',
    cargoName: 'Box B · 800×600×400',
    position: { x: 600, y: 0, z: 0 },
    description: 'Next to Box A, on floor',
  },
  {
    stepIndex: 3,
    cargoId: 'box-3',
    cargoName: 'Box C · 1000×500×500',
    position: { x: 1400, y: 0, z: 0 },
    description: 'First row complete, on floor',
  },
  {
    stepIndex: 4,
    cargoId: 'box-1',
    cargoName: 'Box A · 600×400×300',
    position: { x: 0, y: 800, z: 0 },
    description: 'Second row, on floor',
  },
  {
    stepIndex: 5,
    cargoId: 'box-1',
    cargoName: 'Box A · 600×400×300',
    position: { x: 0, y: 0, z: 300 },
    description: 'Second layer, above Box A',
  },
];
