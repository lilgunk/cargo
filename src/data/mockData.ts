import type { Vehicle, CargoItem, PlacementStep } from '../types';

export const VEHICLES: Vehicle[] = [
  {
    id: 'small',
    name: 'Furgon S',
    length: 2800,
    width: 1600,
    height: 1650,
    maxWeight: 800,
  },
  {
    id: 'medium',
    name: 'Mercedes Sprinter L2H2',
    length: 3665,
    width: 1787,
    height: 1940,
    maxWeight: 1100,
  },
  {
    id: 'large',
    name: 'Mercedes Sprinter L3H2',
    length: 4325,
    width: 1787,
    height: 1940,
    maxWeight: 1350,
  },
];

export const SAMPLE_CARGO: CargoItem[] = [
  {
    id: 'box-1',
    name: 'Box A',
    length: 600,
    width: 400,
    height: 300,
    weight: 15,
    quantity: 8,
    color: '#818cf8',
  },
  {
    id: 'box-2',
    name: 'Box B',
    length: 800,
    width: 600,
    height: 400,
    weight: 25,
    quantity: 4,
    color: '#34d399',
  },
  {
    id: 'box-3',
    name: 'Box C',
    length: 1000,
    width: 500,
    height: 500,
    weight: 30,
    quantity: 2,
    color: '#fbbf24',
  },
];

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
