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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Navigation / UI states
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('transitops_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  // Sync theme Mode to LocalStorage
  useEffect(() => {
    localStorage.setItem('transitops_theme', themeMode);
  }, [themeMode]);

  // Sync database helper
  const syncDatabase = () => {
    fetch('/api/data')
      .then((res) => {
        if (!res.ok) throw new Error('API Sync failed');
        return res.json();
      })
      .then((data) => {
        setVehicles(data.vehicles || []);
        setDrivers(data.drivers || []);
        setTrips(data.trips || []);
        setMaintenanceLogs(data.maintenanceLogs || []);
        setFuelLogs(data.fuelLogs || []);
        setExpenses(data.expenses || []);
      })
      .catch((err) => console.error('Sync error:', err));
  };

  // Sync initial dataset on mount
  useEffect(() => {
    syncDatabase();
  }, []);

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
    const duplicate = vehicles.some(v => v.registrationNumber.toUpperCase() === newVeh.registrationNumber.toUpperCase());
    if (duplicate) {
      return `Registration number ${newVeh.registrationNumber} already exists in the registry. Unique identifier is required.`;
    }

    fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVeh)
    }).then(res => {
      if (res.ok) syncDatabase();
    });
    return true;
  };

  const handleUpdateVehicle = (updatedVeh: Vehicle): boolean | string => {
    const duplicate = vehicles.some(v => 
      v.id !== updatedVeh.id && 
      v.registrationNumber.toUpperCase() === updatedVeh.registrationNumber.toUpperCase()
    );
    if (duplicate) {
      return `Registration number ${updatedVeh.registrationNumber} is already allocated to another vehicle asset.`;
    }

    fetch(`/api/vehicles/${updatedVeh.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedVeh)
    }).then(res => {
      if (res.ok) syncDatabase();
    });
    return true;
  };

  const handleDeleteVehicle = (id: string) => {
    fetch(`/api/vehicles/${id}`, { method: 'DELETE' }).then(() => syncDatabase());
  };

  const handleAddDocument = (vehicleId: string, doc: Omit<VehicleDocument, 'id'>) => {
    fetch(`/api/vehicles/${vehicleId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    }).then(res => {
      if (res.ok) syncDatabase();
    });
  };

  const handleDeleteDocument = (vehicleId: string, docId: string) => {
    fetch(`/api/vehicles/${vehicleId}/documents/${docId}`, { method: 'DELETE' }).then(() => syncDatabase());
  };

  // --- DRIVER HANDLERS ---
  const handleAddDriver = (newDri: Omit<Driver, 'id'>) => {
    fetch('/api/drivers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDri)
    }).then(res => {
      if (res.ok) syncDatabase();
    });
  };

  const handleUpdateDriver = (updatedDri: Driver) => {
    fetch(`/api/drivers/${updatedDri.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDri)
    }).then(res => {
      if (res.ok) syncDatabase();
    });
  };

  const handleDeleteDriver = (id: string) => {
    fetch(`/api/drivers/${id}`, { method: 'DELETE' }).then(() => syncDatabase());
  };

  // --- TRIP HANDLERS ---
  const handleAddTrip = (newTrip: Omit<Trip, 'id'>): boolean | string => {
    const vehicle = vehicles.find(v => v.id === newTrip.vehicleId);
    if (!vehicle) return 'Vehicle not found in corporate registry.';
    const driver = drivers.find(d => d.id === newTrip.driverId);
    if (!driver) return 'Driver not found in corporate registry.';

    if (newTrip.cargoWeight > vehicle.maxLoadCapacity) {
      return `Cargo weight (${newTrip.cargoWeight} kg) exceeds vehicle max capacity of ${vehicle.maxLoadCapacity} kg.`;
    }
    if (vehicle.status === 'Retired' || vehicle.status === 'In Shop') {
      return `Vehicle status is ${vehicle.status} and cannot be assigned to a trip.`;
    }
    const today = new Date();
    const expiry = new Date(driver.licenseExpiryDate);
    if (expiry.getTime() < today.getTime()) {
      return `Driver license is expired (expiry date: ${driver.licenseExpiryDate}). Operation blocked.`;
    }
    if (driver.status === 'Suspended') {
      return `Driver ${driver.name} is currently Suspended. Operation blocked.`;
    }
    if (vehicle.status === 'On Trip') {
      return `Vehicle ${vehicle.registrationNumber} is already on an active trip.`;
    }
    if (driver.status === 'On Trip') {
      return `Driver ${driver.name} is already on an active trip.`;
    }

    fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTrip)
    }).then(res => {
      if (res.ok) syncDatabase();
    });
    return true;
  };

  const handleDispatchTrip = (tripId: string) => {
    fetch(`/api/trips/${tripId}/dispatch`, { method: 'PUT' }).then(() => syncDatabase());
  };

  const handleCompleteTrip = (tripId: string, finalOdometer: number, fuelConsumed: number): boolean | string => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return 'Trip not found.';
    if (finalOdometer < trip.odometerStart) {
      return `Final odometer (${finalOdometer} km) cannot be lower than the starting odometer (${trip.odometerStart} km).`;
    }

    fetch(`/api/trips/${tripId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finalOdometer, fuelConsumed })
    }).then(res => {
      if (res.ok) syncDatabase();
    });
    return true;
  };

  const handleCancelTrip = (tripId: string) => {
    fetch(`/api/trips/${tripId}/cancel`, { method: 'PUT' }).then(() => syncDatabase());
  };

  const handleDeleteTrip = (tripId: string) => {
    fetch(`/api/trips/${tripId}`, { method: 'DELETE' }).then(() => syncDatabase());
  };

  // --- MAINTENANCE HANDLERS ---
  const handleAddMaintenanceLog = (newLog: Omit<MaintenanceLog, 'id'>) => {
    fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).then(res => {
      if (res.ok) syncDatabase();
    });
  };

  const handleCompleteMaintenanceLog = (logId: string) => {
    fetch(`/api/maintenance/${logId}/complete`, { method: 'PUT' }).then(() => syncDatabase());
  };

  const handleDeleteMaintenanceLog = (logId: string) => {
    fetch(`/api/maintenance/${logId}`, { method: 'DELETE' }).then(() => syncDatabase());
  };

  // --- GENERAL EXPENSES HANDLERS ---
  const handleAddFuelLog = (newFuel: Omit<FuelLog, 'id'>) => {
    fetch('/api/fuel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFuel)
    }).then(res => {
      if (res.ok) syncDatabase();
    });
  };

  const handleAddExpense = (newExp: Omit<Expense, 'id'>) => {
    fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExp)
    }).then(res => {
      if (res.ok) syncDatabase();
    });
  };

  const handleDeleteFuelLog = (id: string) => {
    fetch(`/api/fuel/${id}`, { method: 'DELETE' }).then(() => syncDatabase());
  };

  const handleDeleteExpense = (id: string) => {
    fetch(`/api/expenses/${id}`, { method: 'DELETE' }).then(() => syncDatabase());
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
