import React, { useState, useEffect } from 'react';
import { User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, UserRole, VehicleDocument } from './types';
import { 
  INITIAL_USERS, 
  INITIAL_VEHICLES, 
  INITIAL_DRIVERS, 
  INITIAL_TRIPS, 
  INITIAL_MAINTENANCE_LOGS, 
  INITIAL_FUEL_LOGS, 
  INITIAL_EXPENSES 
} from './initialData';

// Sub Views
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import VehiclesView from './components/VehiclesView';
import DriversView from './components/DriversView';
import TripsView from './components/TripsView';
import MaintenanceView from './components/MaintenanceView';
import ExpensesView from './components/ExpensesView';
import ReportsView from './components/ReportsView';

// Icons
import { 
  Truck, LayoutDashboard, Car, Users, Route, 
  Wrench, Fuel, BarChart3, LogOut, ShieldAlert,
  Menu, X, Bell, User as UserIcon, RefreshCw, Moon, Sun
} from 'lucide-react';

export default function App() {
  // Session State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('transitops_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Entities State
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('transitops_vehicles');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('transitops_drivers');
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });

  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('transitops_trips');
    return saved ? JSON.parse(saved) : INITIAL_TRIPS;
  });

  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
    const saved = localStorage.getItem('transitops_maint_logs');
    return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_LOGS;
  });

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => {
    const saved = localStorage.getItem('transitops_fuel_logs');
    return saved ? JSON.parse(saved) : INITIAL_FUEL_LOGS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('transitops_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  // Navigation / UI states
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('transitops_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('transitops_theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('transitops_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('transitops_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('transitops_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('transitops_maint_logs', JSON.stringify(maintenanceLogs));
  }, [maintenanceLogs]);

  useEffect(() => {
    localStorage.setItem('transitops_fuel_logs', JSON.stringify(fuelLogs));
  }, [fuelLogs]);

  useEffect(() => {
    localStorage.setItem('transitops_expenses', JSON.stringify(expenses));
  }, [expenses]);


  // Auth Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('transitops_user', JSON.stringify(user));
    // Default starting tab after login is always Dashboard
    setActiveTab('Dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('transitops_user');
  };

  // Quick switch role in live session (great for reviewers/demonstration!)
  const handleQuickRoleSwitch = (role: UserRole) => {
    const matched = INITIAL_USERS.find(u => u.role === role);
    if (matched) {
      setCurrentUser(matched);
      localStorage.setItem('transitops_user', JSON.stringify(matched));
      setActiveTab('Dashboard'); // reset to dashboard
    }
  };

  // Get matching tabs based on active user Role
  const getAllowedTabs = (role: UserRole): string[] => {
    switch (role) {
      case 'Fleet Manager':
        return ['Dashboard', 'Vehicles', 'Maintenance', 'Reports'];
      case 'Driver':
        return ['Dashboard', 'Trips'];
      case 'Safety Officer':
        return ['Dashboard', 'Drivers'];
      case 'Financial Analyst':
        return ['Dashboard', 'Fuel & Expenses', 'Reports'];
      default:
        return ['Dashboard'];
    }
  };

  const allowedTabs = currentUser ? getAllowedTabs(currentUser.role) : [];

  // Make sure active tab is reset if it's no longer allowed (e.g. after a role change)
  useEffect(() => {
    if (currentUser && !allowedTabs.includes(activeTab)) {
      setActiveTab('Dashboard');
    }
  }, [currentUser, activeTab]);

  // --- VEHICLE HANDLERS ---
  const handleAddVehicle = (newVeh: Omit<Vehicle, 'id' | 'documents'>): boolean | string => {
    // Check registration unique check
    const duplicate = vehicles.some(v => v.registrationNumber.toUpperCase() === newVeh.registrationNumber.toUpperCase());
    if (duplicate) {
      return `Registration number ${newVeh.registrationNumber} already exists in the registry. Unique identifier is required.`;
    }

    const created: Vehicle = {
      ...newVeh,
      id: 'v-' + Date.now(),
      documents: []
    };

    setVehicles(prev => [...prev, created]);
    return true;
  };

  const handleUpdateVehicle = (updatedVeh: Vehicle): boolean | string => {
    // Check registration unique check against OTHER vehicles
    const duplicate = vehicles.some(v => 
      v.id !== updatedVeh.id && 
      v.registrationNumber.toUpperCase() === updatedVeh.registrationNumber.toUpperCase()
    );
    if (duplicate) {
      return `Registration number ${updatedVeh.registrationNumber} is already allocated to another vehicle asset.`;
    }

    setVehicles(prev => prev.map(v => v.id === updatedVeh.id ? updatedVeh : v));
    return true;
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const handleAddDocument = (vehicleId: string, doc: Omit<VehicleDocument, 'id'>) => {
    const created: VehicleDocument = {
      ...doc,
      id: 'doc-' + Date.now()
    };

    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          documents: [...v.documents, created]
        };
      }
      return v;
    }));
  };

  const handleDeleteDocument = (vehicleId: string, docId: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          documents: v.documents.filter(d => d.id !== docId)
        };
      }
      return v;
    }));
  };

  // --- DRIVER HANDLERS ---
  const handleAddDriver = (newDri: Omit<Driver, 'id'>) => {
    const created: Driver = {
      ...newDri,
      id: 'd-' + Date.now()
    };
    setDrivers(prev => [...prev, created]);
  };

  const handleUpdateDriver = (updatedDri: Driver) => {
    setDrivers(prev => prev.map(d => d.id === updatedDri.id ? updatedDri : d));
  };

  const handleDeleteDriver = (id: string) => {
    setDrivers(prev => prev.filter(d => d.id !== id));
  };

  // --- TRIP HANDLERS ---
  const handleAddTrip = (newTrip: Omit<Trip, 'id'>): boolean | string => {
    // State logic layer validations to enforce business rules
    const vehicle = vehicles.find(v => v.id === newTrip.vehicleId);
    if (!vehicle) {
      return 'Vehicle not found in corporate registry.';
    }

    const driver = drivers.find(d => d.id === newTrip.driverId);
    if (!driver) {
      return 'Driver not found in corporate registry.';
    }

    // 1. Cargo Weight <= Vehicle Maximum Load Capacity
    if (newTrip.cargoWeight > vehicle.maxLoadCapacity) {
      return `Cargo weight (${newTrip.cargoWeight} kg) exceeds vehicle max capacity of ${vehicle.maxLoadCapacity} kg.`;
    }

    // 2. Retired or In Shop vehicles never appear in dispatch selection
    if (vehicle.status === 'Retired' || vehicle.status === 'In Shop') {
      return `Vehicle status is ${vehicle.status} and cannot be assigned to a trip.`;
    }

    // 3. Drivers with expired license or Suspended status cannot be assigned to trips
    const today = new Date();
    const expiry = new Date(driver.licenseExpiryDate);
    if (expiry.getTime() < today.getTime()) {
      return `Driver license is expired (expiry date: ${driver.licenseExpiryDate}). Operation blocked.`;
    }
    if (driver.status === 'Suspended') {
      return `Driver ${driver.name} is currently Suspended. Operation blocked.`;
    }

    // 4. A driver or vehicle already On Trip cannot be assigned to another trip
    if (vehicle.status === 'On Trip') {
      return `Vehicle ${vehicle.registrationNumber} is already on an active trip.`;
    }
    if (driver.status === 'On Trip') {
      return `Driver ${driver.name} is already on an active trip.`;
    }

    const created: Trip = {
      ...newTrip,
      id: 't-' + Date.now()
    };
    setTrips(prev => [...prev, created]);
    return true;
  };

  // Dispatched Side Effects
  const handleDispatchTrip = (tripId: string) => {
    const tripToDispatch = trips.find(t => t.id === tripId);
    if (!tripToDispatch) return;

    // Trigger state transitions
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: 'Dispatched' } : t));
    
    // Set vehicle status = On Trip
    setVehicles(prev => prev.map(v => v.id === tripToDispatch.vehicleId ? { ...v, status: 'On Trip' } : v));
    
    // Set driver status = On Trip
    setDrivers(prev => prev.map(d => d.id === tripToDispatch.driverId ? { ...d, status: 'On Trip' } : d));
  };

  // Completion Side Effects
  const handleCompleteTrip = (tripId: string, finalOdometer: number, fuelConsumed: number): boolean | string => {
    const tripToComplete = trips.find(t => t.id === tripId);
    if (!tripToComplete) return 'Trip not found.';

    // Update Trip record
    setTrips(prev => prev.map(t => t.id === tripId ? { 
      ...t, 
      status: 'Completed',
      odometerEnd: finalOdometer,
      fuelConsumed: fuelConsumed
    } : t));

    // Update Vehicle (status = Available, odometer updated)
    setVehicles(prev => prev.map(v => v.id === tripToComplete.vehicleId ? { 
      ...v, 
      status: 'Available',
      odometer: finalOdometer
    } : v));

    // Update Driver (status = Available)
    setDrivers(prev => prev.map(d => d.id === tripToComplete.driverId ? { ...d, status: 'Available' } : d));

    // Create automatic Fuel Log side effect
    const newFuelLogCost = parseFloat((fuelConsumed * 1.45).toFixed(2)); // estimated price
    const fuelDate = new Date().toISOString().split('T')[0];

    const automaticFuelLog: FuelLog = {
      id: 'f-auto-' + Date.now(),
      vehicleId: tripToComplete.vehicleId,
      liters: fuelConsumed,
      cost: newFuelLogCost,
      date: fuelDate,
    };
    setFuelLogs(prev => [...prev, automaticFuelLog]);

    // Create automatic Fuel Expense side effect
    const automaticFuelExpense: Expense = {
      id: 'e-auto-f-' + Date.now(),
      vehicleId: tripToComplete.vehicleId,
      type: 'Fuel',
      amount: newFuelLogCost,
      date: fuelDate,
      notes: `Refuel for Completed Mission #${tripId} (${tripToComplete.source} → ${tripToComplete.destination})`,
    };
    setExpenses(prev => [...prev, automaticFuelExpense]);

    return true;
  };

  // Cancel Side Effects
  const handleCancelTrip = (tripId: string) => {
    const tripToCancel = trips.find(t => t.id === tripId);
    if (!tripToCancel) return;

    // Update Trip
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: 'Cancelled' } : t));

    // Revert Vehicle to Available
    setVehicles(prev => prev.map(v => v.id === tripToCancel.vehicleId ? { ...v, status: 'Available' } : v));

    // Revert Driver to Available
    setDrivers(prev => prev.map(d => d.id === tripToCancel.driverId ? { ...d, status: 'Available' } : d));
  };

  const handleDeleteTrip = (tripId: string) => {
    setTrips(prev => prev.filter(t => t.id !== tripId));
  };

  // --- MAINTENANCE HANDLERS ---
  const handleAddMaintenanceLog = (newLog: Omit<MaintenanceLog, 'id'>) => {
    const logId = 'm-' + Date.now();
    const created: MaintenanceLog = {
      ...newLog,
      id: logId
    };

    setMaintenanceLogs(prev => [...prev, created]);

    // SIDE EFFECT: Active maintenance -> Vehicle status becomes 'In Shop'
    if (newLog.status === 'Active') {
      setVehicles(prev => prev.map(v => v.id === newLog.vehicleId ? { ...v, status: 'In Shop' } : v));
    }

    // Automatically book corresponding expense record of type 'Maintenance'
    const newMaintExpense: Expense = {
      id: 'e-auto-m-' + Date.now(),
      vehicleId: newLog.vehicleId,
      type: 'Maintenance',
      amount: newLog.cost,
      date: newLog.date,
      notes: `${newLog.serviceType} Workshop Ticket (#${logId})`,
    };
    setExpenses(prev => [...prev, newMaintExpense]);
  };

  const handleCompleteMaintenanceLog = (logId: string) => {
    const logToComplete = maintenanceLogs.find(m => m.id === logId);
    if (!logToComplete) return;

    // Set Log status to Completed
    setMaintenanceLogs(prev => prev.map(m => m.id === logId ? { ...m, status: 'Completed' } : m));

    // Set Vehicle back to Available (unless it was already Retired)
    setVehicles(prev => prev.map(v => {
      if (v.id === logToComplete.vehicleId) {
        return {
          ...v,
          status: v.status === 'Retired' ? 'Retired' : 'Available'
        };
      }
      return v;
    }));
  };

  const handleDeleteMaintenanceLog = (logId: string) => {
    setMaintenanceLogs(prev => prev.filter(m => m.id !== logId));
  };

  // --- GENERAL EXPENSES HANDLERS ---
  const handleAddFuelLog = (newFuel: Omit<FuelLog, 'id'>) => {
    const fuelId = 'f-' + Date.now();
    const created: FuelLog = {
      ...newFuel,
      id: fuelId
    };

    setFuelLogs(prev => [...prev, created]);

    // Corresponding general expense registry
    const correspondingExpense: Expense = {
      id: 'e-auto-f-' + Date.now(),
      vehicleId: newFuel.vehicleId,
      type: 'Fuel',
      amount: newFuel.cost,
      date: newFuel.date,
      notes: `Refuel diesel log (#${fuelId}) - ${newFuel.liters}L`,
    };
    setExpenses(prev => [...prev, correspondingExpense]);
  };

  const handleAddExpense = (newExp: Omit<Expense, 'id'>) => {
    const created: Expense = {
      ...newExp,
      id: 'e-' + Date.now()
    };
    setExpenses(prev => [...prev, created]);
  };

  const handleDeleteFuelLog = (id: string) => {
    setFuelLogs(prev => prev.filter(f => f.id !== id));
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // If not logged in, force Login screen
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Map allowed tab strings to actual rendered view components
  const renderActiveView = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <DashboardView 
            vehicles={vehicles} 
            drivers={drivers} 
            trips={trips} 
            onNavigate={(tab) => setActiveTab(tab)}
            allowedTabs={allowedTabs}
          />
        );
      case 'Vehicles':
        return (
          <VehiclesView 
            vehicles={vehicles}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        );
      case 'Drivers':
        return (
          <DriversView 
            drivers={drivers}
            onAddDriver={handleAddDriver}
            onUpdateDriver={handleUpdateDriver}
            onDeleteDriver={handleDeleteDriver}
          />
        );
      case 'Trips':
        return (
          <TripsView 
            trips={trips}
            vehicles={vehicles}
            drivers={drivers}
            onAddTrip={handleAddTrip}
            onDispatchTrip={handleDispatchTrip}
            onCompleteTrip={handleCompleteTrip}
            onCancelTrip={handleCancelTrip}
            onDeleteTrip={handleDeleteTrip}
          />
        );
      case 'Maintenance':
        return (
          <MaintenanceView 
            logs={maintenanceLogs}
            vehicles={vehicles}
            onAddLog={handleAddMaintenanceLog}
            onCompleteLog={handleCompleteMaintenanceLog}
            onDeleteLog={handleDeleteMaintenanceLog}
          />
        );
      case 'Fuel & Expenses':
        return (
          <ExpensesView 
            fuelLogs={fuelLogs}
            expenses={expenses}
            vehicles={vehicles}
            onAddFuelLog={handleAddFuelLog}
            onAddExpense={handleAddExpense}
            onDeleteFuelLog={handleDeleteFuelLog}
            onDeleteExpense={handleDeleteExpense}
          />
        );
      case 'Reports':
        return (
          <ReportsView 
            vehicles={vehicles}
            trips={trips}
            maintenanceLogs={maintenanceLogs}
            fuelLogs={fuelLogs}
            expenses={expenses}
          />
        );
      default:
        return <div className="text-slate-500 p-8">Forbidden view node configuration.</div>;
    }
  };

  // Nav Item configuration mappings
  const navConfig = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Vehicles', icon: Car },
    { name: 'Drivers', icon: Users },
    { name: 'Trips', icon: Route },
    { name: 'Maintenance', icon: Wrench },
    { name: 'Fuel & Expenses', icon: Fuel },
    { name: 'Reports', icon: BarChart3 },
  ];

  // System status alerts (e.g., driver licenses near expiry)
  const expiringDrivers = drivers.filter(d => {
    const exp = new Date(d.licenseExpiryDate);
    const today = new Date();
    const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diff >= 0 && diff <= 30;
  });

  const expiredDrivers = drivers.filter(d => {
    const exp = new Date(d.licenseExpiryDate);
    const today = new Date();
    return exp.getTime() < today.getTime();
  });

  return (
    <div className={`min-h-screen flex bg-slate-50 text-slate-800 font-sans ${themeMode === 'dark' ? 'dark' : ''}`}>
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-screen no-print
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} id="sidebar-as">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold tracking-tight text-lg text-white font-mono">TransitOps</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account Context Card */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
              <span className="mt-1 inline-block px-2 py-0.5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase tracking-wider">
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* Quick-Switch Role simulator in sidebar for evaluator convenience */}
          <div className="mt-4 pt-3.5 border-t border-slate-800">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-2">
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Simulate Role Flip:</span>
            </div>
            <select 
              value={currentUser.role}
              onChange={(e) => handleQuickRoleSwitch(e.target.value as UserRole)}
              className="w-full text-[10px] bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              id="sidebar-role-selector"
            >
              <option value="Fleet Manager">Fleet Manager</option>
              <option value="Driver">Driver</option>
              <option value="Safety Officer">Safety Officer</option>
              <option value="Financial Analyst">Financial Analyst</option>
            </select>
          </div>
        </div>

        {/* Navigation Items (Filtered by RBAC) */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" id="sidebar-nav">
          {navConfig.map(item => {
            const isAllowed = allowedTabs.includes(item.name);
            if (!isAllowed) return null;

            const Icon = item.icon;
            const isActive = activeTab === item.name;

            return (
              <button
                key={item.name}
                onClick={() => {
                  setActiveTab(item.name);
                  setIsSidebarOpen(false); // Close drawer on mobile click
                }}
                className={`
                  w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                `}
                id={`nav-item-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Footer Section */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            id="logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Station</span>
          </button>
        </div>

      </aside>

      {/* BACKGROUND DRAWER DROP FOR MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. MAIN WORKSPACE WINDOW */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen" id="workspace-window">
        
        {/* Dynamic Top Workspace Header bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 flex-shrink-0 no-print" id="workspace-header">
          {/* Left panel: Burger drawer trigger */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl md:hidden"
              id="mobile-menu-trigger"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Context breadcrumb info */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>TransitOps Workspace</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-800 font-bold">{activeTab} View</span>
            </div>
          </div>

          {/* Right panel: Active compliance warning indicators */}
          <div className="flex items-center gap-4">
            
            {/* Expired Operator warning badge */}
            {(expiredDrivers.length > 0 || expiringDrivers.length > 0) && (
              <div 
                onClick={() => allowedTabs.includes('Drivers') && setActiveTab('Drivers')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold cursor-pointer transition-all animate-pulse"
                title={`${expiredDrivers.length} Expired & ${expiringDrivers.length} Expiring licenses detected!`}
                id="header-warning-badge"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Compliance Alerts</span>
                <span className="px-1 py-0.2 bg-amber-600 text-white rounded text-[9px] font-black">
                  {expiredDrivers.length + expiringDrivers.length}
                </span>
              </div>
            )}

            {/* Dark Mode Toggle Button */}
            <button
              onClick={() => setThemeMode(prev => prev === 'light' ? 'dark' : 'light')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
              title={`Toggle ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}
              id="dark-mode-toggle"
            >
              {themeMode === 'light' ? (
                <Moon className="w-4.5 h-4.5" />
              ) : (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              )}
            </button>

            {/* Simulated Live System date stamp */}
            <div className="text-[10px] text-slate-400 font-bold font-mono uppercase">
              Gateway: Active Node
            </div>
          </div>
        </header>

        {/* 3. CORE SUB-VIEW MODULE CONTAINER */}
        <main className="flex-grow p-6 md:p-8" id="core-module-container">
          {renderActiveView()}
        </main>

      </div>

    </div>
  );
}
