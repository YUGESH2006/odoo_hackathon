import { User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u-1',
    email: 'manager@transitops.com',
    name: 'Eleanor Vance',
    role: 'Fleet Manager',
  },
  {
    id: 'u-2',
    email: 'driver@transitops.com',
    name: 'Alex Rodriguez',
    role: 'Driver',
  },
  {
    id: 'u-3',
    email: 'safety@transitops.com',
    name: 'Marcus Brody',
    role: 'Safety Officer',
  },
  {
    id: 'u-4',
    email: 'finance@transitops.com',
    name: 'Sophia Chen',
    role: 'Financial Analyst',
  },
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v-1',
    registrationNumber: 'VAN-05',
    nameModel: 'Ford Transit 350',
    type: 'Van',
    maxLoadCapacity: 1200,
    odometer: 24500,
    acquisitionCost: 45000,
    status: 'Available',
    documents: [
      { id: 'doc-1', name: 'Annual Safety Inspection', category: 'Registration', expiryDate: '2026-12-15' },
      { id: 'doc-2', name: 'Fleet Insurance Policy', category: 'Insurance', expiryDate: '2026-08-01' },
    ],
    region: 'Midwest',
  },
  {
    id: 'v-2',
    registrationNumber: 'SEMI-01',
    nameModel: 'Freightliner Cascadia',
    type: 'Semi',
    maxLoadCapacity: 18000,
    odometer: 142300,
    acquisitionCost: 135000,
    status: 'On Trip',
    documents: [
      { id: 'doc-3', name: 'DOT Registration Certificate', category: 'Registration', expiryDate: '2027-02-10' },
    ],
    region: 'East',
  },
  {
    id: 'v-3',
    registrationNumber: 'BOX-02',
    nameModel: 'Isuzu NPR-HD',
    type: 'Box Truck',
    maxLoadCapacity: 4500,
    odometer: 89400,
    acquisitionCost: 72000,
    status: 'In Shop',
    documents: [
      { id: 'doc-4', name: 'State Emissions Pass', category: 'Permit', expiryDate: '2026-07-20' }, // near expiry
    ],
    region: 'North',
  },
  {
    id: 'v-4',
    registrationNumber: 'SUV-03',
    nameModel: 'Chevrolet Suburban',
    type: 'SUV',
    maxLoadCapacity: 800,
    odometer: 195000,
    acquisitionCost: 55000,
    status: 'Retired',
    documents: [],
    region: 'South',
  },
  {
    id: 'v-5',
    registrationNumber: 'TRK-07',
    nameModel: 'Ram 3500 HD',
    type: 'Truck',
    maxLoadCapacity: 2800,
    odometer: 54100,
    acquisitionCost: 61000,
    status: 'Available',
    documents: [
      { id: 'doc-5', name: 'Commercial Vehicle Insurance', category: 'Insurance', expiryDate: '2026-06-30' }, // expired
    ],
    region: 'East',
  },
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'd-1',
    name: 'Alex Rodriguez',
    licenseNumber: 'DL-9847291',
    licenseCategory: 'Class A CDL',
    licenseExpiryDate: '2027-09-14',
    contactNumber: '+1 (555) 234-5678',
    safetyScore: 94,
    status: 'Available',
  },
  {
    id: 'd-2',
    name: 'Sarah Jenkins',
    licenseNumber: 'DL-3819402',
    licenseCategory: 'Class A CDL',
    licenseExpiryDate: '2026-08-05', // expiring within 30 days
    contactNumber: '+1 (555) 876-5432',
    safetyScore: 97,
    status: 'On Trip',
  },
  {
    id: 'd-3',
    name: 'David Kojo',
    licenseNumber: 'DL-7483920',
    licenseCategory: 'Class B CDL',
    licenseExpiryDate: '2026-06-20', // expired
    contactNumber: '+1 (555) 432-1098',
    safetyScore: 82,
    status: 'Off Duty',
  },
  {
    id: 'd-4',
    name: 'Michael Vance',
    licenseNumber: 'DL-1122334',
    licenseCategory: 'Standard',
    licenseExpiryDate: '2028-11-02',
    contactNumber: '+1 (555) 999-8888',
    safetyScore: 54, // low safety score
    status: 'Suspended',
  },
  {
    id: 'd-5',
    name: 'Liam Neeson',
    licenseNumber: 'DL-8844221',
    licenseCategory: 'Class A CDL',
    licenseExpiryDate: '2026-07-13', // expiring in 2 days
    contactNumber: '+1 (555) 777-1234',
    safetyScore: 90,
    status: 'Available',
  },
];

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 't-1',
    source: 'Chicago, IL',
    destination: 'Indianapolis, IN',
    vehicleId: 'v-1', // Ford Transit (Van-05)
    driverId: 'd-1', // Alex Rodriguez
    cargoWeight: 450,
    plannedDistance: 295,
    status: 'Completed',
    odometerStart: 24205,
    odometerEnd: 24500,
    fuelConsumed: 32, // 295 km / 32 L = ~9.2 km/L
    revenue: 1200,
    date: '2026-07-02',
  },
  {
    id: 't-2',
    source: 'Detroit, MI',
    destination: 'Cleveland, OH',
    vehicleId: 'v-2', // SEMI-01
    driverId: 'd-2', // Sarah Jenkins
    cargoWeight: 14500,
    plannedDistance: 270,
    status: 'Dispatched',
    odometerStart: 142030,
    revenue: 2800,
    date: '2026-07-11',
  },
  {
    id: 't-3',
    source: 'Louisville, KY',
    destination: 'Nashville, TN',
    vehicleId: 'v-5', // TRK-07
    driverId: 'd-5', // Liam Neeson
    cargoWeight: 1500,
    plannedDistance: 280,
    status: 'Draft',
    odometerStart: 54100,
    revenue: 1500,
    date: '2026-07-12',
  },
];

export const INITIAL_MAINTENANCE_LOGS: MaintenanceLog[] = [
  {
    id: 'm-1',
    vehicleId: 'v-3', // BOX-02
    serviceType: 'Brake Rotor & Pad Replacement',
    date: '2026-07-10',
    cost: 850,
    notes: 'Severe grinding reported. Replaced front rotors and pads. Flushed brake fluid.',
    status: 'Active',
  },
  {
    id: 'm-2',
    vehicleId: 'v-1', // VAN-05
    serviceType: 'Regular Oil & Filter Service',
    date: '2026-06-15',
    cost: 120,
    notes: 'Used full synthetic 5W-30. Checked all fluids. Tire pressure adjusted.',
    status: 'Completed',
  },
];

export const INITIAL_FUEL_LOGS: FuelLog[] = [
  {
    id: 'f-1',
    vehicleId: 'v-1',
    liters: 32,
    cost: 48.5,
    date: '2026-07-02',
  },
  {
    id: 'f-2',
    vehicleId: 'v-2',
    liters: 180,
    cost: 295.0,
    date: '2026-07-05',
  },
  {
    id: 'f-3',
    vehicleId: 'v-5',
    liters: 45,
    cost: 67.5,
    date: '2026-07-08',
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e-1',
    vehicleId: 'v-1',
    type: 'Fuel',
    amount: 48.5,
    date: '2026-07-02',
    notes: 'Fuel log f-1',
  },
  {
    id: 'e-2',
    vehicleId: 'v-2',
    type: 'Fuel',
    amount: 295.0,
    date: '2026-07-05',
    notes: 'Fuel log f-2',
  },
  {
    id: 'e-3',
    vehicleId: 'v-5',
    type: 'Fuel',
    amount: 67.5,
    date: '2026-07-08',
    notes: 'Fuel log f-3',
  },
  {
    id: 'e-4',
    vehicleId: 'v-3',
    type: 'Maintenance',
    amount: 850,
    date: '2026-07-10',
    notes: 'Brake Rotor & Pad Replacement (m-1)',
  },
  {
    id: 'e-5',
    vehicleId: 'v-1',
    type: 'Maintenance',
    amount: 120,
    date: '2026-06-15',
    notes: 'Regular Oil Service (m-2)',
  },
  {
    id: 'e-6',
    vehicleId: 'v-2',
    type: 'Toll',
    amount: 45.0,
    date: '2026-07-11',
    notes: 'I-80 Turnpike toll tollway fee',
  },
  {
    id: 'e-7',
    vehicleId: 'v-1',
    type: 'Misc',
    amount: 25.0,
    date: '2026-07-02',
    notes: 'Cargo cleaning fee',
  },
];
