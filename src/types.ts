export type UserRole = 'Fleet Manager' | 'Driver' | 'Safety Officer' | 'Financial Analyst';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';

export interface VehicleDocument {
  id: string;
  name: string;
  category: string;
  expiryDate: string; // YYYY-MM-DD
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  nameModel: string;
  type: string; // e.g., "Truck", "Van", "Semi", "Box Truck"
  maxLoadCapacity: number; // in kg
  odometer: number; // in km
  acquisitionCost: number; // in USD
  status: VehicleStatus;
  documents: VehicleDocument[];
  region?: string; // e.g., "North", "South", "East", "West"
}

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string; // e.g., "Class A CDL", "Class B CDL", "Standard"
  licenseExpiryDate: string; // YYYY-MM-DD
  contactNumber: string;
  safetyScore: number; // 0-100
  status: DriverStatus;
}

export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number; // in kg
  plannedDistance: number; // in km
  status: TripStatus;
  odometerStart: number;
  odometerEnd?: number;
  fuelConsumed?: number; // in liters
  revenue: number; // in USD
  date: string; // YYYY-MM-DD
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: string; // e.g., "Oil Change", "Brake Pad Replacement", "Tire Rotation"
  date: string; // YYYY-MM-DD
  cost: number; // in USD
  notes: string;
  status: 'Active' | 'Completed';
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number; // in USD
  date: string; // YYYY-MM-DD
}

export type ExpenseType = 'Toll' | 'Maintenance' | 'Fuel' | 'Misc';

export interface Expense {
  id: string;
  vehicleId: string;
  type: ExpenseType;
  amount: number; // in USD
  date: string; // YYYY-MM-DD
  notes?: string;
}
