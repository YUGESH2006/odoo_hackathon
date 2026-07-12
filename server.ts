import express, { Request, Response } from 'express';
import { getDatabase, saveDatabase, DatabaseSchema } from './db';
import { Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, VehicleDocument } from './src/types';

const app = express();
app.use(express.json());

const PORT = 3001;

// Helper: check if driver license is expired
const isLicenseExpired = (expiryStr: string) => {
  const expiry = new Date(expiryStr);
  const today = new Date();
  return expiry.getTime() < today.getTime();
};

// -------------------------------------------------------------
// Core GET API: Sync All Collections
// -------------------------------------------------------------
app.get('/api/data', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db);
});

// -------------------------------------------------------------
// Vehicle Registry (CRUD)
// -------------------------------------------------------------
app.post('/api/vehicles', (req: Request, res: Response): void => {
  const newVeh = req.body;
  const db = getDatabase();

  // Enforce unique registration number
  const duplicate = db.vehicles.some(
    (v) => v.registrationNumber.toUpperCase() === newVeh.registrationNumber.toUpperCase()
  );
  if (duplicate) {
    res.status(400).json({ error: `Registration number ${newVeh.registrationNumber} already exists in the registry.` });
    return;
  }

  const created: Vehicle = {
    ...newVeh,
    id: 'v-' + Date.now(),
    registrationNumber: newVeh.registrationNumber.toUpperCase(),
    documents: newVeh.documents || []
  };

  db.vehicles.push(created);
  saveDatabase(db);
  res.status(201).json(created);
});

app.put('/api/vehicles/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const updatedVeh = req.body;
  const db = getDatabase();

  const index = db.vehicles.findIndex((v) => v.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Vehicle not found.' });
    return;
  }

  // Enforce unique registration number against other assets
  const duplicate = db.vehicles.some(
    (v) => v.id !== id && v.registrationNumber.toUpperCase() === updatedVeh.registrationNumber.toUpperCase()
  );
  if (duplicate) {
    res.status(400).json({ error: `Registration number ${updatedVeh.registrationNumber} is already allocated to another asset.` });
    return;
  }

  db.vehicles[index] = {
    ...db.vehicles[index],
    ...updatedVeh,
    registrationNumber: updatedVeh.registrationNumber.toUpperCase()
  };
  saveDatabase(db);
  res.json(db.vehicles[index]);
});

app.delete('/api/vehicles/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const db = getDatabase();

  db.vehicles = db.vehicles.filter((v) => v.id !== id);
  saveDatabase(db);
  res.status(204).send();
});

// Document Upload simulation
app.post('/api/vehicles/:id/documents', (req: Request, res: Response): void => {
  const { id } = req.params;
  const newDoc = req.body;
  const db = getDatabase();

  const vehicleIndex = db.vehicles.findIndex((v) => v.id === id);
  if (vehicleIndex === -1) {
    res.status(404).json({ error: 'Vehicle not found.' });
    return;
  }

  const createdDoc: VehicleDocument = {
    ...newDoc,
    id: 'doc-' + Date.now()
  };

  db.vehicles[vehicleIndex].documents.push(createdDoc);
  saveDatabase(db);
  res.status(201).json(createdDoc);
});

app.delete('/api/vehicles/:id/documents/:docId', (req: Request, res: Response): void => {
  const { id, docId } = req.params;
  const db = getDatabase();

  const vehicleIndex = db.vehicles.findIndex((v) => v.id === id);
  if (vehicleIndex === -1) {
    res.status(404).json({ error: 'Vehicle not found.' });
    return;
  }

  db.vehicles[vehicleIndex].documents = db.vehicles[vehicleIndex].documents.filter(d => d.id !== docId);
  saveDatabase(db);
  res.status(240).json({ success: true });
});

// -------------------------------------------------------------
// Driver Management (CRUD)
// -------------------------------------------------------------
app.post('/api/drivers', (req: Request, res: Response) => {
  const newDri = req.body;
  const db = getDatabase();

  const created: Driver = {
    ...newDri,
    id: 'd-' + Date.now()
  };

  db.drivers.push(created);
  saveDatabase(db);
  res.status(201).json(created);
});

app.put('/api/drivers/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const updatedDri = req.body;
  const db = getDatabase();

  const index = db.drivers.findIndex((d) => d.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Driver not found.' });
    return;
  }

  db.drivers[index] = {
    ...db.drivers[index],
    ...updatedDri
  };
  saveDatabase(db);
  res.json(db.drivers[index]);
});

app.delete('/api/drivers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  db.drivers = db.drivers.filter((d) => d.id !== id);
  saveDatabase(db);
  res.status(204).send();
});

// -------------------------------------------------------------
// Trip Management (CRUD & Workflow lifecycle side-effects)
// -------------------------------------------------------------
app.post('/api/trips', (req: Request, res: Response): void => {
  const newTrip = req.body;
  const db = getDatabase();

  const vehicle = db.vehicles.find((v) => v.id === newTrip.vehicleId);
  if (!vehicle) {
    res.status(400).json({ error: 'Selected vehicle not found.' });
    return;
  }

  const driver = db.drivers.find((d) => d.id === newTrip.driverId);
  if (!driver) {
    res.status(400).json({ error: 'Selected driver not found.' });
    return;
  }

  // Business Validation: Cargo Capacity Check
  if (newTrip.cargoWeight > vehicle.maxLoadCapacity) {
    res.status(400).json({
      error: `Cargo weight (${newTrip.cargoWeight} kg) exceeds maximum load capacity of ${vehicle.nameModel} (${vehicle.maxLoadCapacity} kg).`
    });
    return;
  }

  // Business Validation: Retired/In-Shop check
  if (vehicle.status === 'Retired' || vehicle.status === 'In Shop') {
    res.status(400).json({ error: `Vehicle is currently in '${vehicle.status}' status and cannot be dispatched.` });
    return;
  }

  // Business Validation: Driver certification/Roster status check
  if (isLicenseExpired(driver.licenseExpiryDate)) {
    res.status(400).json({ error: `Driver ${driver.name} holds an expired license. Operations blocked.` });
    return;
  }
  if (driver.status === 'Suspended') {
    res.status(400).json({ error: `Driver ${driver.name} is Suspended and cannot drive.` });
    return;
  }

  // Business Validation: Active trip concurrency check
  if (vehicle.status === 'On Trip') {
    res.status(400).json({ error: `Vehicle ${vehicle.registrationNumber} is already dispatched on an active mission.` });
    return;
  }
  if (driver.status === 'On Trip') {
    res.status(400).json({ error: `Driver ${driver.name} is already dispatched on an active mission.` });
    return;
  }

  const created: Trip = {
    ...newTrip,
    id: 't-' + Date.now(),
    odometerStart: vehicle.odometer,
    date: newTrip.date || new Date().toISOString().split('T')[0],
    status: 'Draft'
  };

  db.trips.push(created);
  saveDatabase(db);
  res.status(201).json(created);
});

// Dispatch Trip Lifecycle trigger
app.put('/api/trips/:id/dispatch', (req: Request, res: Response): void => {
  const { id } = req.params;
  const db = getDatabase();

  const tripIndex = db.trips.findIndex((t) => t.id === id);
  if (tripIndex === -1) {
    res.status(404).json({ error: 'Trip not found.' });
    return;
  }

  const trip = db.trips[tripIndex];
  if (trip.status !== 'Draft') {
    res.status(400).json({ error: `Cannot dispatch a trip that is currently '${trip.status}'.` });
    return;
  }

  // 1. Mark trip as Dispatched
  trip.status = 'Dispatched';

  // 2. Set vehicle status = On Trip
  db.vehicles = db.vehicles.map((v) =>
    v.id === trip.vehicleId ? { ...v, status: 'On Trip' } : v
  );

  // 3. Set driver status = On Trip
  db.drivers = db.drivers.map((d) =>
    d.id === trip.driverId ? { ...d, status: 'On Trip' } : d
  );

  saveDatabase(db);
  res.json({ trip, vehicles: db.vehicles, drivers: db.drivers });
});

// Complete Trip Lifecycle trigger
app.put('/api/trips/:id/complete', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { finalOdometer, fuelConsumed } = req.body;
  const db = getDatabase();

  const tripIndex = db.trips.findIndex((t) => t.id === id);
  if (tripIndex === -1) {
    res.status(404).json({ error: 'Trip not found.' });
    return;
  }

  const trip = db.trips[tripIndex];
  if (trip.status !== 'Dispatched') {
    res.status(400).json({ error: 'Only dispatched active trips can be marked complete.' });
    return;
  }

  if (finalOdometer < trip.odometerStart) {
    res.status(400).json({ error: `Final odometer (${finalOdometer} km) is less than starting odometer (${trip.odometerStart} km).` });
    return;
  }

  // 1. Mark trip as Completed
  trip.status = 'Completed';
  trip.odometerEnd = Number(finalOdometer);
  trip.fuelConsumed = Number(fuelConsumed);

  // 2. Release Vehicle back to Available & update odometer
  db.vehicles = db.vehicles.map((v) =>
    v.id === trip.vehicleId ? { ...v, status: 'Available', odometer: Number(finalOdometer) } : v
  );

  // 3. Release Driver back to Available
  db.drivers = db.drivers.map((d) =>
    d.id === trip.driverId ? { ...d, status: 'Available' } : d
  );

  // 4. Create automatic Fuel Log side effect
  const fuelLogCost = parseFloat((fuelConsumed * 1.45).toFixed(2));
  const fuelDate = new Date().toISOString().split('T')[0];

  const autoFuelLog: FuelLog = {
    id: 'f-auto-' + Date.now(),
    vehicleId: trip.vehicleId,
    liters: Number(fuelConsumed),
    cost: fuelLogCost,
    date: fuelDate
  };
  db.fuelLogs.push(autoFuelLog);

  // 5. Create automatic fuel expense registry
  const autoFuelExpense: Expense = {
    id: 'e-auto-f-' + Date.now(),
    vehicleId: trip.vehicleId,
    type: 'Fuel',
    amount: fuelLogCost,
    date: fuelDate,
    notes: `Refuel for Completed Mission #${id} (${trip.source} → ${trip.destination})`
  };
  db.expenses.push(autoFuelExpense);

  saveDatabase(db);
  res.json({ trip, vehicles: db.vehicles, drivers: db.drivers, fuelLogs: db.fuelLogs, expenses: db.expenses });
});

// Cancel Trip Lifecycle trigger
app.put('/api/trips/:id/cancel', (req: Request, res: Response): void => {
  const { id } = req.params;
  const db = getDatabase();

  const tripIndex = db.trips.findIndex((t) => t.id === id);
  if (tripIndex === -1) {
    res.status(404).json({ error: 'Trip not found.' });
    return;
  }

  const trip = db.trips[tripIndex];
  if (trip.status !== 'Dispatched') {
    res.status(400).json({ error: 'Only active dispatched trips can be cancelled.' });
    return;
  }

  // 1. Mark trip as Cancelled
  trip.status = 'Cancelled';

  // 2. Revert vehicle status to Available
  db.vehicles = db.vehicles.map((v) =>
    v.id === trip.vehicleId ? { ...v, status: 'Available' } : v
  );

  // 3. Revert driver status to Available
  db.drivers = db.drivers.map((d) =>
    d.id === trip.driverId ? { ...d, status: 'Available' } : d
  );

  saveDatabase(db);
  res.json({ trip, vehicles: db.vehicles, drivers: db.drivers });
});

app.delete('/api/trips/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  db.trips = db.trips.filter((t) => t.id !== id);
  saveDatabase(db);
  res.status(204).send();
});

// -------------------------------------------------------------
// Maintenance Module
// -------------------------------------------------------------
app.post('/api/maintenance', (req: Request, res: Response): void => {
  const newLog = req.body;
  const db = getDatabase();

  const logId = 'm-' + Date.now();
  const created: MaintenanceLog = {
    ...newLog,
    id: logId
  };

  db.maintenanceLogs.push(created);

  // 1. Side Effect: Active Maintenance -> Vehicle status becomes 'In Shop'
  if (newLog.status === 'Active') {
    db.vehicles = db.vehicles.map((v) =>
      v.id === newLog.vehicleId ? { ...v, status: 'In Shop' } : v
    );
  }

  // 2. Side Effect: Automatically book a corresponding general expense record
  const autoMaintExpense: Expense = {
    id: 'e-auto-m-' + Date.now(),
    vehicleId: newLog.vehicleId,
    type: 'Maintenance',
    amount: newLog.cost,
    date: newLog.date,
    notes: `${newLog.serviceType} Workshop Ticket (#${logId})`
  };
  db.expenses.push(autoMaintExpense);

  saveDatabase(db);
  res.status(201).json({ log: created, vehicles: db.vehicles, expenses: db.expenses });
});

// Complete Maintenance Release trigger
app.put('/api/maintenance/:id/complete', (req: Request, res: Response): void => {
  const { id } = req.params;
  const db = getDatabase();

  const logIndex = db.maintenanceLogs.findIndex((m) => m.id === id);
  if (logIndex === -1) {
    res.status(404).json({ error: 'Maintenance record not found.' });
    return;
  }

  const log = db.maintenanceLogs[logIndex];
  log.status = 'Completed';

  // Release vehicle back to Available, unless Retired (stays Retired)
  db.vehicles = db.vehicles.map((v) => {
    if (v.id === log.vehicleId) {
      return {
        ...v,
        status: v.status === 'Retired' ? 'Retired' : 'Available'
      };
    }
    return v;
  });

  saveDatabase(db);
  res.json({ log, vehicles: db.vehicles });
});

app.delete('/api/maintenance/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  db.maintenanceLogs = db.maintenanceLogs.filter((m) => m.id !== id);
  saveDatabase(db);
  res.status(204).send();
});

// -------------------------------------------------------------
// Fuel Logs APIs
// -------------------------------------------------------------
app.post('/api/fuel', (req: Request, res: Response) => {
  const newFuel = req.body;
  const db = getDatabase();

  const fuelId = 'f-' + Date.now();
  const created: FuelLog = {
    ...newFuel,
    id: fuelId
  };
  db.fuelLogs.push(created);

  // Automatically register a corresponding general expense record
  const autoExpense: Expense = {
    id: 'e-auto-f-' + Date.now(),
    vehicleId: newFuel.vehicleId,
    type: 'Fuel',
    amount: newFuel.cost,
    date: newFuel.date,
    notes: `Refuel diesel log (#${fuelId}) - ${newFuel.liters}L`
  };
  db.expenses.push(autoExpense);

  saveDatabase(db);
  res.status(201).json({ fuelLog: created, expenses: db.expenses });
});

app.delete('/api/fuel/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  db.fuelLogs = db.fuelLogs.filter((f) => f.id !== id);
  saveDatabase(db);
  res.status(204).send();
});

// -------------------------------------------------------------
// General Expenses APIs
// -------------------------------------------------------------
app.post('/api/expenses', (req: Request, res: Response) => {
  const newExp = req.body;
  const db = getDatabase();

  const created: Expense = {
    ...newExp,
    id: 'e-' + Date.now()
  };
  db.expenses.push(created);

  saveDatabase(db);
  res.status(201).json(created);
});

app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  db.expenses = db.expenses.filter((e) => e.id !== id);
  saveDatabase(db);
  res.status(204).send();
});

// Start Server listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[TransitOps Backend] Server running on http://localhost:${PORT}`);
});
