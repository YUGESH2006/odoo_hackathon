import React, { useState } from 'react';
import { Vehicle, VehicleDocument } from '../types';
import { 
  Plus, Search, ArrowUpDown, Trash2, Edit2, FileText, 
  X, Calendar, ClipboardList, AlertCircle, Info
} from 'lucide-react';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'documents'>) => boolean | string;
  onUpdateVehicle: (vehicle: Vehicle) => boolean | string;
  onDeleteVehicle: (id: string) => void;
  onAddDocument: (vehicleId: string, doc: Omit<VehicleDocument, 'id'>) => void;
  onDeleteDocument: (vehicleId: string, docId: string) => void;
}

type SortField = 'registrationNumber' | 'nameModel' | 'type' | 'maxLoadCapacity' | 'odometer' | 'acquisitionCost' | 'status' | 'region';
type SortOrder = 'asc' | 'desc';

export default function VehiclesView({
  vehicles,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onAddDocument,
  onDeleteDocument
}: VehiclesViewProps) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('registrationNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Modal / Drawer State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDocOpen, setIsDocOpen] = useState(false);

  // Selected vehicle for Edit or Document Management
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Form Fields State
  const [regNum, setRegNum] = useState('');
  const [nameModel, setNameModel] = useState('');
  const [type, setType] = useState('Truck');
  const [maxLoad, setMaxLoad] = useState<number>(3000);
  const [odometer, setOdometer] = useState<number>(0);
  const [acqCost, setAcqCost] = useState<number>(35000);
  const [status, setStatus] = useState<Vehicle['status']>('Available');
  const [region, setRegion] = useState('East');

  // Document Form State
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState('Registration');
  const [docExpiry, setDocExpiry] = useState('');

  // Error Feedback
  const [formError, setFormError] = useState<string | null>(null);

  // Sorting trigger
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setRegNum('');
    setNameModel('');
    setType('Truck');
    setMaxLoad(3000);
    setOdometer(0);
    setAcqCost(35000);
    setStatus('Available');
    setRegion('East');
    setFormError(null);
    setIsAddOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setRegNum(v.registrationNumber);
    setNameModel(v.nameModel);
    setType(v.type);
    setMaxLoad(v.maxLoadCapacity);
    setOdometer(v.odometer);
    setAcqCost(v.acquisitionCost);
    setStatus(v.status);
    setRegion(v.region || 'East');
    setFormError(null);
    setIsEditOpen(true);
  };

  // Open Document Manager
  const openDocDrawer = (v: Vehicle) => {
    setSelectedVehicle(v);
    setDocName('');
    setDocCategory('Registration');
    setDocExpiry('');
    setIsDocOpen(true);
  };

  // Handle Add Form Submission
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!regNum.trim() || !nameModel.trim()) {
      setFormError('Please fill out all required fields.');
      return;
    }

    const result = onAddVehicle({
      registrationNumber: regNum.trim().toUpperCase(),
      nameModel: nameModel.trim(),
      type,
      maxLoadCapacity: Number(maxLoad),
      odometer: Number(odometer),
      acquisitionCost: Number(acqCost),
      status,
      region,
    });

    if (result === true) {
      setIsAddOpen(false);
    } else {
      setFormError(typeof result === 'string' ? result : 'Failed to add vehicle.');
    }
  };

  // Handle Edit Form Submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedVehicle) return;
    if (!regNum.trim() || !nameModel.trim()) {
      setFormError('Please fill out all required fields.');
      return;
    }

    const result = onUpdateVehicle({
      ...selectedVehicle,
      registrationNumber: regNum.trim().toUpperCase(),
      nameModel: nameModel.trim(),
      type,
      maxLoadCapacity: Number(maxLoad),
      odometer: Number(odometer),
      acquisitionCost: Number(acqCost),
      status,
      region,
    });

    if (result === true) {
      setIsEditOpen(false);
    } else {
      setFormError(typeof result === 'string' ? result : 'Failed to update vehicle.');
    }
  };

  // Handle Document Upload simulation
  const handleAddDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !docName.trim() || !docExpiry) return;

    onAddDocument(selectedVehicle.id, {
      name: docName.trim(),
      category: docCategory,
      expiryDate: docExpiry,
    });

    // Refresh selected vehicle instance in state
    const updatedVeh = vehicles.find(v => v.id === selectedVehicle.id);
    if (updatedVeh) {
      setSelectedVehicle(updatedVeh);
    }

    setDocName('');
    setDocCategory('Registration');
    setDocExpiry('');
  };

  // Handle Document Delete
  const handleDelDoc = (docId: string) => {
    if (!selectedVehicle) return;
    onDeleteDocument(selectedVehicle.id, docId);

    // Refresh selected vehicle
    const updatedVeh = vehicles.find(v => v.id === selectedVehicle.id);
    if (updatedVeh) {
      setSelectedVehicle(updatedVeh);
    }
  };

  // Extract distinct lists for filtering
  const distinctTypes = Array.from(new Set(vehicles.map(v => v.type)));
  const distinctRegions = Array.from(new Set(vehicles.map(v => v.region).filter(Boolean))) as string[];

  // Filter and sort vehicle records
  const filteredAndSorted = vehicles
    .filter(v => {
      const matchSearch = v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.nameModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'All' || v.status === statusFilter;
      const matchType = typeFilter === 'All' || v.type === typeFilter;
      const matchRegion = regionFilter === 'All' || v.region === regionFilter;

      return matchSearch && matchStatus && matchType && matchRegion;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle fallback for optional fields
      if (valA === undefined) valA = '';
      if (valB === undefined) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      }
    });

  return (
    <div className="space-y-6" id="vehicles-view-container">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900" id="veh-title">Fleet Vehicle Registry</h1>
          <p className="text-sm text-slate-500">Add, edit, inspect, and manage corporate vehicle registrations and assets.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 self-start sm:self-auto transition-colors"
          id="add-vehicle-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center" id="veh-filters-bar">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input 
            type="text" 
            placeholder="Search Registration, Model..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            id="vehicle-search-input"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Status Select */}
          <div className="flex-1 sm:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              id="veh-status-filter"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          {/* Type Select */}
          <div className="flex-1 sm:flex-initial">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              id="veh-type-filter"
            >
              <option value="All">All Types</option>
              {distinctTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Region Select */}
          <div className="flex-1 sm:flex-initial">
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              id="veh-region-filter"
            >
              <option value="All">All Regions</option>
              {distinctRegions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="vehicles-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('registrationNumber')}>
                  <div className="flex items-center gap-1">
                    <span>Reg #</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('nameModel')}>
                  <div className="flex items-center gap-1">
                    <span>Model Name</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('type')}>
                  <div className="flex items-center gap-1">
                    <span>Type</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('maxLoadCapacity')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Cargo Limit</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('odometer')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Odometer</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('region')}>
                  <div className="flex items-center gap-1">
                    <span>Region</span>
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
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">No vehicle registries found</p>
                    <p className="text-xs">Try relaxing search parameters or register a new transport asset.</p>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors" id={`vehicle-row-${v.id}`}>
                    {/* Reg # */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 tracking-wide">{v.registrationNumber}</td>
                    {/* Model */}
                    <td className="py-3.5 px-4 font-medium text-slate-800">{v.nameModel}</td>
                    {/* Type */}
                    <td className="py-3.5 px-4 text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">{v.type}</span>
                    </td>
                    {/* Limit */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">{v.maxLoadCapacity.toLocaleString()} kg</td>
                    {/* Odo */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">{v.odometer.toLocaleString()} km</td>
                    {/* Region */}
                    <td className="py-3.5 px-4 text-slate-600">{v.region || '—'}</td>
                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        v.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        v.status === 'On Trip' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        v.status === 'In Shop' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => openDocDrawer(v)}
                          title="Manage Documents"
                          className="p-1.5 bg-slate-50 hover:bg-slate-200 rounded border border-slate-200 text-slate-600 transition-colors"
                          id={`docs-btn-${v.id}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => openEditModal(v)}
                          title="Edit Vehicle"
                          className="p-1.5 bg-slate-50 hover:bg-slate-200 rounded border border-slate-200 text-slate-600 transition-colors"
                          id={`edit-btn-${v.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete vehicle ${v.registrationNumber}?`)) {
                              onDeleteVehicle(v.id);
                            }
                          }}
                          title="Delete Vehicle"
                          className="p-1.5 bg-red-50 hover:bg-red-100 rounded border border-red-100 text-red-600 transition-colors"
                          id={`del-btn-${v.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Add New Fleet Vehicle</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[70vh]">
              {formError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Registration Number <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. VAN-05" 
                    value={regNum}
                    onChange={(e) => setRegNum(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold uppercase"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Vehicle Make / Model <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ford Transit 350" 
                    value={nameModel}
                    onChange={(e) => setNameModel(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Semi">Semi</option>
                    <option value="Box Truck">Box Truck</option>
                    <option value="SUV">SUV</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Max Capacity (kg)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={maxLoad}
                    onChange={(e) => setMaxLoad(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Initial Odometer (km)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={odometer}
                    onChange={(e) => setOdometer(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Acquisition Cost (USD)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={acqCost}
                    onChange={(e) => setAcqCost(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Region</label>
                  <select 
                    value={region} 
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="Midwest">Midwest</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as Vehicle['status'])}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-bold text-slate-800"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Create Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {isEditOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Edit Vehicle: {selectedVehicle.registrationNumber}</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[70vh]">
              {formError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Registration Number <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. VAN-05" 
                    value={regNum}
                    onChange={(e) => setRegNum(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold uppercase"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Vehicle Make / Model <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ford Transit 350" 
                    value={nameModel}
                    onChange={(e) => setNameModel(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Semi">Semi</option>
                    <option value="Box Truck">Box Truck</option>
                    <option value="SUV">SUV</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Max Capacity (kg)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={maxLoad}
                    onChange={(e) => setMaxLoad(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Odometer (km)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={odometer}
                    onChange={(e) => setOdometer(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Acquisition Cost (USD)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={acqCost}
                    onChange={(e) => setAcqCost(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Region</label>
                  <select 
                    value={region} 
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="Midwest">Midwest</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as Vehicle['status'])}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-bold text-slate-800"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold font-mono"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Manager sliding Drawer or Modal */}
      {isDocOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-md border-l border-slate-200 shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Vehicle Documents</h3>
                <p className="text-xs text-slate-500 font-bold">{selectedVehicle.registrationNumber} — {selectedVehicle.nameModel}</p>
              </div>
              <button onClick={() => setIsDocOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Document Entry Form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  Add Document Record
                </h4>
                
                <form onSubmit={handleAddDocSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Document Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. State Emission Cert" 
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                      <select 
                        value={docCategory}
                        onChange={(e) => setDocCategory(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="Registration">Registration</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Permit">Permit</option>
                        <option value="Inspection">Inspection</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Expiry Date</label>
                      <input 
                        type="date" 
                        required
                        value={docExpiry}
                        onChange={(e) => setDocExpiry(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Attach Document Metadata
                  </button>
                </form>
              </div>

              {/* Saved Documents */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Credentials</h4>
                
                {selectedVehicle.documents.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    <FileText className="w-8 h-8 stroke-1 mx-auto mb-1 text-slate-300" />
                    <p>No attached documents</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedVehicle.documents.map(doc => {
                      // Check expiry
                      const expDate = new Date(doc.expiryDate);
                      const today = new Date();
                      const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                      const isExpired = daysLeft < 0;
                      const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;

                      return (
                        <div 
                          key={doc.id} 
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-xs text-slate-800">{doc.name}</div>
                            <div className="flex gap-1.5 items-center">
                              <span className="bg-slate-100 text-[9px] text-slate-600 font-bold px-1.5 py-0.5 rounded">
                                {doc.category}
                              </span>
                              <span className={`text-[9px] font-medium flex items-center gap-1 font-mono ${
                                isExpired ? 'text-red-600 font-bold' :
                                isExpiringSoon ? 'text-amber-600 font-bold' :
                                'text-slate-400'
                              }`}>
                                <Calendar className="w-3 h-3" />
                                {doc.expiryDate} {isExpired ? '(EXPIRED)' : isExpiringSoon ? `(${daysLeft}d left)` : ''}
                              </span>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleDelDoc(doc.id)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Footer informational */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>Federal regulations mandate that commercial trucks carry active registration, standard inspections, and liability policies. TransitOps marks critical expired documents in red.</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
