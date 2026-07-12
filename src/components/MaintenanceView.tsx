import React, { useState } from 'react';
import { MaintenanceLog, Vehicle } from '../types';
import { 
  Plus, Search, ArrowUpDown, CheckCircle, Trash2, X, 
  AlertCircle, PenTool, ClipboardList, ShieldAlert, Calendar, DollarSign
} from 'lucide-react';

interface MaintenanceViewProps {
  logs: MaintenanceLog[];
  vehicles: Vehicle[];
  onAddLog: (log: Omit<MaintenanceLog, 'id'>) => void;
  onCompleteLog: (logId: string) => void;
  onDeleteLog: (logId: string) => void;
}

type SortField = 'date' | 'serviceType' | 'cost' | 'status';
type SortOrder = 'asc' | 'desc';

export default function MaintenanceView({
  logs,
  vehicles,
  onAddLog,
  onCompleteLog,
  onDeleteLog,
}: MaintenanceViewProps) {
  // Filters & sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form Fields state
  const [vehicleId, setVehicleId] = useState('');
  const [serviceType, setServiceType] = useState('Oil Change');
  const [customServiceType, setCustomServiceType] = useState('');
  const [cost, setCost] = useState<number>(150);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Active' | 'Completed'>('Active');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [formError, setFormError] = useState<string | null>(null);

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    // Pick first non-retired vehicle as default
    const nonRetired = vehicles.filter(v => v.status !== 'Retired');
    setVehicleId(nonRetired[0] ? nonRetired[0].id : '');
    setServiceType('Oil Change');
    setCustomServiceType('');
    setCost(150);
    setNotes('');
    setStatus('Active');
    setDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setIsAddOpen(true);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!vehicleId) {
      setFormError('Please select a vehicle.');
      return;
    }

    const finalServiceType = serviceType === 'Other' ? customServiceType.trim() : serviceType;
    if (!finalServiceType) {
      setFormError('Please describe the service type.');
      return;
    }

    onAddLog({
      vehicleId,
      serviceType: finalServiceType,
      date,
      cost: Number(cost),
      notes: notes.trim(),
      status,
    });

    setIsAddOpen(false);
  };

  // Filter & Sort
  const filteredAndSorted = logs
    .filter(log => {
      const veh = vehicles.find(v => v.id === log.vehicleId);
      const reg = veh ? veh.registrationNumber.toLowerCase() : '';
      const model = veh ? veh.nameModel.toLowerCase() : '';
      
      const matchSearch = log.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reg.includes(searchTerm.toLowerCase()) ||
                          model.includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'All' || log.status === statusFilter;

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

  const activeVehiclesPool = vehicles.filter(v => v.status !== 'Retired');

  return (
    <div className="space-y-6" id="maintenance-view-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900" id="maint-title">Fleet Maintenance Workshop</h1>
          <p className="text-sm text-slate-500 font-medium">Schedule repairs, track servicing history, manage workshop labor costs, and restore transport assets.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 self-start sm:self-auto transition-colors animate-fade-in"
          id="log-maintenance-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Log Service Order</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center" id="maint-filters-bar">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input 
            type="text" 
            placeholder="Search service logs, registration..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            id="maint-search-input"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            id="maint-status-filter"
          >
            <option value="All">All Service States</option>
            <option value="Active">Active (In Shop)</option>
            <option value="Completed">Completed (Released)</option>
          </select>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="maint-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">
                    <span>Service Date</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('serviceType')}>
                  <div className="flex items-center gap-1">
                    <span>Service Details</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4">Notes & Diagnostic Notes</th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('cost')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Cost (USD)</span>
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
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <PenTool className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">No service records booked</p>
                    <p className="text-xs">File a workshop ticket or refine search filters.</p>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map(log => {
                  const veh = vehicles.find(v => v.id === log.vehicleId);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors" id={`maint-row-${log.id}`}>
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{log.date}</td>
                      {/* Vehicle */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{veh ? veh.registrationNumber : 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400">{veh ? veh.nameModel : ''}</div>
                      </td>
                      {/* Type */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">{log.serviceType}</td>
                      {/* Notes */}
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={log.notes}>
                        {log.notes || '—'}
                      </td>
                      {/* Cost */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-950">${log.cost.toLocaleString()}</td>
                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.status === 'Active' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
                          'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {log.status === 'Active' ? 'Active (In Shop)' : 'Completed'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {log.status === 'Active' && (
                            <button
                              onClick={() => {
                                if (confirm('Complete this repair order? Vehicle will be released and marked as Available.')) {
                                  onCompleteLog(log.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                              id={`complete-maint-${log.id}`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Release Vehicle</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Delete this maintenance record permanently from archives?')) {
                                onDeleteLog(log.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 transition-all"
                            title="Delete Record"
                            id={`del-btn-${log.id}`}
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

      {/* Add Maintenance Ticket Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Book Vehicle Workshop Ticket</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2 border border-red-100 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Vehicle allocation */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Select Fleet Vehicle <span className="text-red-500">*</span></label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  required
                >
                  <option value="" disabled>-- Select Vehicle --</option>
                  {activeVehiclesPool.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} - {v.nameModel} ({v.status})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 font-medium">Retired assets cannot receive service orders.</p>
              </div>

              {/* Service Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Service Category</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
                  >
                    <option value="Oil Change">Oil & Filter Service</option>
                    <option value="Brake Pad Replacement">Brake Service</option>
                    <option value="Tire Rotation">Tire Rotation / Replacement</option>
                    <option value="Engine Diagnostics">Engine Repair</option>
                    <option value="Annual Inspection">Federal Compliance Inspection</option>
                    <option value="Other">Other Custom Service</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    Estimated Cost ($)
                  </label>
                  <input 
                    type="number" min={0} required
                    value={cost} onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>

              {/* Custom type input */}
              {serviceType === 'Other' && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-xs font-semibold text-slate-700">Describe Service Type <span className="text-red-500">*</span></label>
                  <input 
                    type="text" required placeholder="e.g. Headlight ballast replacement" 
                    value={customServiceType} onChange={(e) => setCustomServiceType(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              )}

              {/* Date and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Booking Date
                  </label>
                  <input 
                    type="date" required 
                    value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">State of Ticket</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Active' | 'Completed')}
                    className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white font-bold"
                  >
                    <option value="Active">Active (In Shop)</option>
                    <option value="Completed">Completed (History Only)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Service Notes / Mechanics Instructions</label>
                <textarea 
                  rows={2}
                  placeholder="Describe mechanics reports, diagnostic codes, parts swapped..." 
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {status === 'Active' && (
                <div className="bg-amber-50 text-amber-800 text-[10px] p-2.5 rounded-lg border border-amber-100 flex items-start gap-1.5 font-medium">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-500" />
                  <span>CRITICAL: Booking an Active maintenance ticket automatically sets vehicle status to 'In Shop' and deletes it from the active dispatch pool.</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 p-4 -mx-6 -mb-6">
                <button 
                  type="button" onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-white font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Create Workshop Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
