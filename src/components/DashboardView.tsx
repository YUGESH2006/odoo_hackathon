import React, { useState } from 'react';
import { Vehicle, Driver, Trip } from '../types';
import { 
  Truck, CheckCircle, AlertTriangle, Play, HelpCircle, 
  Users, Percent, Filter, RotateCcw, MapPin, Gauge
} from 'lucide-react';

interface DashboardViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  onNavigate: (view: string) => void;
  allowedTabs: string[];
}

export default function DashboardView({ vehicles, drivers, trips, onNavigate, allowedTabs }: DashboardViewProps) {
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterRegion, setFilterRegion] = useState<string>('All');

  // Reset filters
  const resetFilters = () => {
    setFilterType('All');
    setFilterStatus('All');
    setFilterRegion('All');
  };

  // Filter vehicles based on selections
  const filteredVehicles = vehicles.filter(v => {
    const matchType = filterType === 'All' || v.type === filterType;
    const matchStatus = filterStatus === 'All' || v.status === filterStatus;
    const matchRegion = filterRegion === 'All' || v.region === filterRegion;
    return matchType && matchStatus && matchRegion;
  });

  // Calculate KPIs
  const totalVehiclesCount = vehicles.length;
  const nonRetiredVehicles = vehicles.filter(v => v.status !== 'Retired');
  const totalNonRetiredCount = nonRetiredVehicles.length;

  const activeVehiclesCount = vehicles.filter(v => v.status === 'On Trip').length;
  const availableVehiclesCount = vehicles.filter(v => v.status === 'Available').length;
  const inShopVehiclesCount = vehicles.filter(v => v.status === 'In Shop').length;
  const retiredVehiclesCount = vehicles.filter(v => v.status === 'Retired').length;

  const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
  const pendingTripsCount = trips.filter(t => t.status === 'Draft').length;
  const completedTripsCount = trips.filter(t => t.status === 'Completed').length;

  const driversOnDutyCount = drivers.filter(d => d.status === 'On Trip').length;
  const availableDriversCount = drivers.filter(d => d.status === 'Available').length;

  // Utilization formula: vehicles On Trip / total non-retired vehicles
  const utilization = totalNonRetiredCount > 0 
    ? Math.round((activeVehiclesCount / totalNonRetiredCount) * 100) 
    : 0;

  // Distinct types, statuses, and regions for filter lists
  const vehicleTypes = Array.from(new Set(vehicles.map(v => v.type)));
  const vehicleRegions = Array.from(new Set(vehicles.map(v => v.region).filter(Boolean))) as string[];

  // Counts for SVG Chart
  const statusCounts = {
    Available: vehicles.filter(v => v.status === 'Available').length,
    'On Trip': vehicles.filter(v => v.status === 'On Trip').length,
    'In Shop': vehicles.filter(v => v.status === 'In Shop').length,
    Retired: vehicles.filter(v => v.status === 'Retired').length,
  };

  const chartColors = {
    Available: '#10B981', // green
    'On Trip': '#3B82F6', // blue
    'In Shop': '#F59E0B', // amber
    Retired: '#6B7280', // gray
  };

  const maxChartCount = Math.max(...Object.values(statusCounts), 1);

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900" id="dash-title">Operations Control Center</h1>
          <p className="text-sm text-slate-500">Real-time status updates and key metrics for TransitOps fleet.</p>
        </div>
        
        {/* Quick Filters */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Type Filter */}
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            id="filter-type-select"
          >
            <option value="All">All Types</option>
            {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Status Filter */}
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            id="filter-status-select"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>

          {/* Region Filter */}
          <select 
            value={filterRegion} 
            onChange={(e) => setFilterRegion(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            id="filter-region-select"
          >
            <option value="All">All Regions</option>
            {vehicleRegions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {(filterType !== 'All' || filterStatus !== 'All' || filterRegion !== 'All') && (
            <button 
              onClick={resetFilters}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              id="reset-filters-btn"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        {/* Active Vehicles Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => allowedTabs.includes('Vehicles') && onNavigate('Vehicles')}
          id="kpi-active-vehicles"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Vehicles</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{activeVehiclesCount}</span>
              <span className="text-xs font-medium text-blue-600">On Trip</span>
            </div>
            <p className="text-[10px] text-slate-400">Total in operations: {totalNonRetiredCount}</p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Available Vehicles Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => allowedTabs.includes('Vehicles') && onNavigate('Vehicles')}
          id="kpi-available-vehicles"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Vehicles</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{availableVehiclesCount}</span>
              <span className="text-xs font-medium text-emerald-600">Ready</span>
            </div>
            <p className="text-[10px] text-slate-400">Ready for dispatch</p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Vehicles in Maintenance Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => allowedTabs.includes('Maintenance') && onNavigate('Maintenance')}
          id="kpi-maintenance-vehicles"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Maintenance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{inShopVehiclesCount}</span>
              <span className="text-xs font-medium text-amber-600">In Shop</span>
            </div>
            <p className="text-[10px] text-slate-400">Requires technical release</p>
          </div>
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Fleet Utilization Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          id="kpi-utilization"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fleet Utilization</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{utilization}%</span>
              <span className="text-xs font-medium text-purple-600">Efficient</span>
            </div>
            <p className="text-[10px] text-slate-400">Active / non-retired vehicles</p>
          </div>
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Second Line of KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="kpi-grid-2">
        {/* Active Trips Card */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => allowedTabs.includes('Trips') && onNavigate('Trips')}
          id="kpi-active-trips"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Dispatches</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{activeTripsCount}</span>
              <span className="text-xs font-medium text-blue-400">Dispatched</span>
            </div>
            <p className="text-[10px] text-slate-400">In transit right now</p>
          </div>
          <div className="p-3.5 bg-slate-800 text-blue-400 rounded-xl">
            <Play className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Trips Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => allowedTabs.includes('Trips') && onNavigate('Trips')}
          id="kpi-pending-trips"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Orders</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{pendingTripsCount}</span>
              <span className="text-xs font-medium text-slate-500">Drafts</span>
            </div>
            <p className="text-[10px] text-slate-400">Awaiting scheduling / dispatch</p>
          </div>
          <div className="p-3.5 bg-slate-100 text-slate-600 rounded-xl">
            <HelpCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Drivers On Duty Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => allowedTabs.includes('Drivers') && onNavigate('Drivers')}
          id="kpi-drivers-on-duty"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Drivers On Duty</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{driversOnDutyCount}</span>
              <span className="text-xs font-medium text-indigo-600">On Road</span>
            </div>
            <p className="text-[10px] text-slate-400">Available drivers: {availableDriversCount}</p>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Chart & Status Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-layout">
        
        {/* SVG Fleet Breakdown Chart Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between lg:col-span-1" id="fleet-chart-card">
          <div className="space-y-1 mb-4">
            <h3 className="font-semibold text-slate-900 text-sm">Fleet Status Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown of all registered transport assets.</p>
          </div>

          {/* SVG Visual Stacked Rings or Bars */}
          <div className="flex-1 flex flex-col justify-center space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = totalVehiclesCount > 0 ? Math.round((count / totalVehiclesCount) * 100) : 0;
              const color = chartColors[status as keyof typeof chartColors];
              return (
                <div key={status} className="space-y-1.5" id={`chart-row-${status.replace(' ', '-')}`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      {status}
                    </span>
                    <span className="font-semibold text-slate-900">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                  </div>
                  {/* Progress bar container */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${pct}%`,
                        backgroundColor: color 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center text-xs text-slate-400">
            <span>Total Fleet Size:</span>
            <span className="font-bold text-slate-700 text-sm">{totalVehiclesCount} Vehicles</span>
          </div>
        </div>

        {/* Filtered Vehicles Quick Overview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between lg:col-span-2" id="filtered-vehicles-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Monitored Assets ({filteredVehicles.length})</h3>
              <p className="text-xs text-slate-500">Live grid mapping to selected region and type filters.</p>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 text-[10px] font-medium">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">Available</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">On Trip</span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full">In Shop</span>
              <span className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full">Retired</span>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[220px]" id="monitored-assets-table-wrapper">
            {filteredVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                <Truck className="w-8 h-8 stroke-1" />
                <p className="text-xs">No vehicles match the selected filters.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-2">Vehicle ID</th>
                    <th className="pb-2">Model / Type</th>
                    <th className="pb-2">Region</th>
                    <th className="pb-2">Load Capacity</th>
                    <th className="pb-2">Odometer</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVehicles.slice(0, 5).map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors" id={`vehicle-row-${v.id}`}>
                      <td className="py-2.5 font-bold text-slate-900">{v.registrationNumber}</td>
                      <td className="py-2.5">
                        <div className="font-medium text-slate-800">{v.nameModel}</div>
                        <div className="text-[10px] text-slate-400">{v.type}</div>
                      </td>
                      <td className="py-2.5 text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {v.region || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600">{v.maxLoadCapacity.toLocaleString()} kg</td>
                      <td className="py-2.5 text-slate-600">
                        <span className="flex items-center gap-1 font-mono">
                          <Gauge className="w-3 h-3 text-slate-400" />
                          {v.odometer.toLocaleString()} km
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          v.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          v.status === 'On Trip' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          v.status === 'In Shop' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredVehicles.length > 5 && (
            <div className="text-right border-t border-slate-100 pt-3">
              <button 
                onClick={() => allowedTabs.includes('Vehicles') && onNavigate('Vehicles')}
                className="text-xs text-blue-600 font-semibold hover:underline"
                id="view-all-vehicles-link"
              >
                + View all {filteredVehicles.length} vehicles
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
