import fs from 'fs';
import path from 'path';
import { 
  INITIAL_USERS, 
  INITIAL_VEHICLES, 
  INITIAL_DRIVERS, 
  INITIAL_TRIPS, 
  INITIAL_MAINTENANCE_LOGS, 
  INITIAL_FUEL_LOGS, 
  INITIAL_EXPENSES 
} from './src/initialData';
import { User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense } from './src/types';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

export interface DatabaseSchema {
  users: User[];
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
}

export function getDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    // Seed initial data
    const initialDb: DatabaseSchema = {
      users: INITIAL_USERS,
      vehicles: INITIAL_VEHICLES,
      drivers: INITIAL_DRIVERS,
      trips: INITIAL_TRIPS,
      maintenanceLogs: INITIAL_MAINTENANCE_LOGS,
      fuelLogs: INITIAL_FUEL_LOGS,
      expenses: INITIAL_EXPENSES,
    };
    saveDatabase(initialDb);
    return initialDb;
  }

  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error parsing db.json, returning seeded data:', err);
    return {
      users: INITIAL_USERS,
      vehicles: INITIAL_VEHICLES,
      drivers: INITIAL_DRIVERS,
      trips: INITIAL_TRIPS,
      maintenanceLogs: INITIAL_MAINTENANCE_LOGS,
      fuelLogs: INITIAL_FUEL_LOGS,
      expenses: INITIAL_EXPENSES,
    };
  }
}

export function saveDatabase(data: DatabaseSchema): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
