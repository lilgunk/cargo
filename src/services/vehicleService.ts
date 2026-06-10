// vehicleService — abstraction layer between UI/algorithm and vehicle data source.
//
// TODAY:  reads from local mockData.ts (no network, works offline)
// FUTURE: replace getAll / getById bodies with fetch('/api/vehicles') or Supabase query.
//         The rest of the app (algorithm, components) never needs to change.
//
// Example future swap:
//   getAll: async () => {
//     const { data } = await supabase.from('vehicles').select('*');
//     return data ?? [];
//   }

import { VEHICLES } from '../data/mockData';
import type { Vehicle } from '../types';

export const vehicleService = {
  getAll(): Vehicle[] {
    return VEHICLES;
  },

  getById(id: string): Vehicle | undefined {
    return VEHICLES.find(v => v.id === id);
  },

  getDefault(): Vehicle {
    return VEHICLES[VEHICLES.length - 1];
  },
};
