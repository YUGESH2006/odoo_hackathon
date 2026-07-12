import React, { useState } from 'react';
import { Trip, Vehicle, Driver } from '../types';
import { 
  Plus, Search, ArrowUpDown, Play, CheckCircle2, XCircle, 
  Trash2, Eye, X, AlertCircle, HelpCircle, MapPin, Weight, Route, DollarSign
} from 'lucide-react';

interface TripsViewProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onAddTrip: (trip: Omit<Trip, 'id'>) => boolean | string;
  onDispatchTrip: (tripId: string) => void;
  onCompleteTrip: (tripId: string, finalOdometer: number, fuelConsumed: number) => boolean | string;
  onCancelTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
}

type SortField = 'source' | 'destination' | 'cargoWeight' | 'plannedDistance' | 'status' | 'date' | 'revenue';
type SortOrder = 'asc' | 'desc';

export default function TripsView({
  trips,
  vehicles,
  drivers,
  onAddTrip,
  onDispatchTrip,
  onCompleteTrip,
  onCancelTrip,
  onDeleteTrip
}: TripsViewProps) {
  // Filters & Sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [activeTripForCompletion, setActiveTripForCompletion] = useState<Trip | null>(null);

  // Error feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Create Form Fields state
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState<number>(1000);
  const [plannedDistance, setPlannedDistance] = useState<number>(250);
  const [revenue, setRevenue] = useState<number>(1200);

  // Complete Form Fields state
  const [finalOdometer, setFinalOdometer] = useState<number>(0);
  const [fuelConsumed, setFuelConsumed] = useState<number>(0);

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Check if a driver's license is expired
  const isLicenseExpired = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    const today = new Date();
    return expiry.getTime() < today.getTime();
  };

  // Available vehicles for selection (Must be status == Available, and not Retired/In Shop)
  const availableVehiclesPool = vehicles.filter(v => v.status === 'Available');

  // Available drivers pool (Must be status == Available, non-expired license, non-Suspended)
  const availableDriversPool = drivers.filter(d => 
    d.status === 'Available' && 
    !isLicenseExpired(d.licenseExpiryDate)
  );

  // Open Create Trip Modal
  const openCreateModal = () => {
    setSource('');
    setDestination('');
    setFormError(null);

    // Pick first available vehicle & driver as defaults
    const firstVeh = availableVehiclesPool[0];
    const firstDri = availableDriversPool[0];
    setVehicleId(firstVeh ? firstVeh.id : '');
    setDriverId(firstDri ? firstDri.id : '');
    setCargoWeight(1000);
    setPlannedDistance(250);
    setRevenue(1200);

    setIsCreateOpen(true);
  };

  // Handle Create Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!source.trim() || !destination.trim() || !vehicleId || !driverId) {
      setFormError('Please fill out all fields. Ensure a vehicle and driver are selected.');
      return;
    }

    const selectedVeh = vehicles.find(v => v.id === vehicleId);
    if (!selectedVeh) {
      setFormError('Invalid vehicle selection.');
      return;
    }

    // HARD VALIDATION: Cargo Weight <= selected vehicle's Maximum Load Capacity
    if (cargoWeight > selectedVeh.maxLoadCapacity) {
      setFormError(`Cargo weight (${cargoWeight.toLocaleString()} kg) exceeds the maximum capacity of ${selectedVeh.nameModel} (${selectedVeh.maxLoadCapacity.toLocaleString()} kg). Please select a stronger vehicle or reduce cargo weight.`);
      return;
    }

    const selectedDri = drivers.find(d => d.id === driverId);
    if (!selectedDri) {
      setFormError('Invalid driver selection.');
      return;
    }

    // HARD VALIDATION: License Expiry or Suspended Check
    if (isLicenseExpired(selectedDri.licenseExpiryDate)) {
      setFormError(`Driver ${selectedDri.name} has an expired commercial license. Operation blocked.`);
      return;
    }

    if (selectedDri.status === 'Suspended') {
      setFormError(`Driver ${selectedDri.name} is currently Suspended. Operation blocked.`);
      return;
    }

    // Submit to App state
    const result = onAddTrip({
      source: source.trim(),
      destination: destination.trim(),
      vehicleId,
      driverId,
      cargoWeight: Number(cargoWeight),
      plannedDistance: Number(plannedDistance),
      status: 'Draft',
      odometerStart: selectedVeh.odometer,
      revenue: Number(revenue),
      date: new Date().toISOString().split('T')[0],
    });

    if (result === true) {
      setIsCreateOpen(false);
    } else {
      setFormError(typeof result === 'string' ? result : 'Failed to save trip.');
    }
  };

  // Open Complete Trip Modal
  const openCompleteModal = (trip: Trip) => {
    const matchedVeh = vehicles.find(v => v.id === trip.vehicleId);
    setActiveTripForCompletion(trip);
    setCompleteError(null);
    // Suggest final odometer: start odometer + planned distance
    const expectedOdometer = trip.odometerStart + trip.plannedDistance;
    setFinalOdometer(expectedOdometer);
    // Suggest fuel consumption (e.g. 12L per 100km)
    const suggestedFuel = Math.round((trip.plannedDistance / 100) * 14);
    setFuelConsumed(suggestedFuel);
    setIsCompleteOpen(true);
  };

  // Handle Completion Submit
  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompleteError(null);

    if (!activeTripForCompletion) return;

    if (finalOdometer < activeTripForCompletion.odometerStart) {
      setCompleteError(`Final odometer (${finalOdometer} km) cannot be lower than the starting odometer (${activeTripForCompletion.odometerStart} km).`);
      return;
    }

    if (fuelConsumed <= 0) {
      setCompleteError('Please enter a positive value for fuel consumed.');
      return;
    }

    const result = onCompleteTrip(activeTripForCompletion.id, Number(finalOdometer), Number(fuelConsumed));
    if (result === true) {
      setIsCompleteOpen(false);
      setActiveTripForCompletion(null);
    } else {
      setCompleteError(typeof result === 'string' ? result : 'Failed to complete trip.');
    }
  };

  // Filter & Sort
  const filteredAndSorted = trips
    .filter(t => {
      const matchSearch = t.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.destination.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'All' || t.status === statusFilter;

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      }
    });

  return (
    <div className="space-y-6" id="trips-view-container">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900" id="tri-title">Dispatch & Trip Planner</h1>
          <p className="text-sm text-slate-500 font-medium">Coordinate cargo runs, validate vehicle load capacities, dispatch drivers, and log final trip mileage.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 self-start sm:self-auto transition-colors animate-fade-in"
          id="schedule-trip-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Plan Cargo Run</span>
        </button>
      </div>

      {/* Filter and search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center" id="trips-filters-bar">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input 
            type="text" 
            placeholder="Search source or destination..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            id="trip-search-input"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            id="tri-status-filter"
          >
            <option value="All">All Trip States</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched (Active)</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table List Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="trips-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('source')}>
                  <div className="flex items-center gap-1">
                    <span>Route (Source → Dest)</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Driver</th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('cargoWeight')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Cargo Weight</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('plannedDistance')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Distance</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('revenue')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Revenue</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Route className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">No trips registered</p>
                    <p className="text-xs">Schedule a new cargo delivery run or change search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map(t => {
                  const veh = vehicles.find(v => v.id === t.vehicleId);
                  const dri = drivers.find(d => d.id === t.driverId);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors" id={`trip-row-${t.id}`}>
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-600">{t.date}</td>
                      {/* Route */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span>{t.source}</span>
                          <span className="text-slate-400 font-light">→</span>
                          <span>{t.destination}</span>
                        </div>
                      </td>
                      {/* Vehicle */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{veh ? veh.registrationNumber : 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400">{veh ? veh.nameModel : ''}</div>
                      </td>
                      {/* Driver */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">{dri ? dri.name : 'Unknown'}</td>
                      {/* Weight */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">{t.cargoWeight.toLocaleString()} kg</td>
                      {/* Distance */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {t.status === 'Completed' && t.odometerEnd ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-700">{(t.odometerEnd - t.odometerStart)} km</div>
                            <div className="text-[10px] text-slate-400 font-bold">Odo: {t.odometerStart} - {t.odometerEnd}</div>
                          </div>
                        ) : (
                          <span>{t.plannedDistance} km (est.)</span>
                        )}
                      </td>
                      {/* Revenue */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">${t.revenue.toLocaleString()}</td>
                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                          t.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse' :
                          t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {t.status === 'Draft' && (
                            <button
                              onClick={() => onDispatchTrip(t.id)}
                              title="Dispatch Vehicles & Operators"
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                              id={`dispatch-btn-${t.id}`}
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {t.status === 'Dispatched' && (
                            <>
                              <button
                                onClick={() => openCompleteModal(t)}
                                title="Complete Trip & Log Odometer"
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                                id={`complete-btn-${t.id}`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Complete</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Cancel this active dispatch? Vehicle and driver statuses will be reverted to Available.')) {
                                    onCancelTrip(t.id);
                                  }
                                }}
                                title="Cancel Dispatch"
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 rounded border border-red-100 text-red-600 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                                id={`cancel-btn-${t.id}`}
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Cancel</span>
                              </button>
                            </>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm('Delete this trip record permanently from history?')) {
                                onDeleteTrip(t.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 transition-all"
                            title="Delete Record"
                            id={`del-btn-${t.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Cargo Run / Create Trip Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Plan Cargo Dispatch Run</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[75vh]">
              {formError && (
                <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-lg flex items-start gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Route specification */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Source Hub <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" required placeholder="e.g. Chicago, IL" 
                    value={source} onChange={(e) => setSource(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Destination Hub <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" required placeholder="e.g. Dallas, TX" 
                    value={destination} onChange={(e) => setDestination(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Asset Allocation */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-4 my-2">
                
                {/* Vehicle select */}
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-800">
                    Allocate Transport Asset <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="" disabled>-- Select Available Vehicle --</option>
                    {availableVehiclesPool.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} ({v.type}) - Cap: {v.maxLoadCapacity.toLocaleString()}kg
                      </option>
                    ))}
                  </select>
                  {availableVehiclesPool.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-semibold">No vehicles currently Available.</p>
                  )}
                </div>

                {/* Driver select */}
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-800">
                    Assign Operator <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="" disabled>-- Select Certified Driver --</option>
                    {availableDriversPool.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} (Safety: {d.safetyScore}/100)
                      </option>
                    ))}
                  </select>
                  {availableDriversPool.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-semibold">No certified drivers currently Available.</p>
                  )}
                </div>

              </div>

              {/* Weight, Distance & Revenue */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Weight className="w-3.5 h-3.5 text-slate-400" />
                    Cargo Weight (kg)
                  </label>
                  <input 
                    type="number" min={1} required
                    value={cargoWeight} onChange={(e) => setCargoWeight(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Route className="w-3.5 h-3.5 text-slate-400" />
                    Distance (km)
                  </label>
                  <input 
                    type="number" min={1} required
                    value={plannedDistance} onChange={(e) => setPlannedDistance(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    Target Revenue ($)
                  </label>
                  <input 
                    type="number" min={1} required
                    value={revenue} onChange={(e) => setRevenue(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 p-4 -mx-6 -mb-6">
                <button 
                  type="button" onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-white font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={availableVehiclesPool.length === 0 || availableDriversPool.length === 0}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save as Draft Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip modal */}
      {isCompleteOpen && activeTripForCompletion && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-base">Complete Transport Mission</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{activeTripForCompletion.source} → {activeTripForCompletion.destination}</p>
              </div>
              <button onClick={() => setIsCompleteOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
              {completeError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{completeError}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Start Odometer:</span>
                  <span className="font-mono font-bold text-slate-800">{activeTripForCompletion.odometerStart.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Planned Distance:</span>
                  <span className="font-mono font-bold text-slate-800">+{activeTripForCompletion.plannedDistance} km</span>
                </div>
              </div>

              {/* Final Odometer */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Actual Ending Odometer (km)</label>
                <input 
                  type="number" min={activeTripForCompletion.odometerStart} required
                  value={finalOdometer} onChange={(e) => setFinalOdometer(Number(e.target.value))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <p className="text-[10px] text-slate-400">Total distance covered: {finalOdometer - activeTripForCompletion.odometerStart} km</p>
              </div>

              {/* Fuel Consumed */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Fuel Consumed (Liters)</label>
                <input 
                  type="number" min={1} required
                  value={fuelConsumed} onChange={(e) => setFuelConsumed(Number(e.target.value))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <p className="text-[10px] text-slate-400">Used to compute vehicle fuel efficiency metrics.</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" onClick={() => setIsCompleteOpen(false)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Go Back
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold font-mono"
                >
                  Record Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
