import React, { useState } from 'react';
import { Driver } from '../types';
import { 
  Plus, Search, ArrowUpDown, Trash2, Edit2, X, 
  Calendar, AlertTriangle, ShieldCheck, Mail, Send, CheckCircle2, AlertCircle
} from 'lucide-react';

interface DriversViewProps {
  drivers: Driver[];
  onAddDriver: (driver: Omit<Driver, 'id'>) => void;
  onUpdateDriver: (driver: Driver) => void;
  onDeleteDriver: (id: string) => void;
}

type SortField = 'name' | 'licenseNumber' | 'licenseCategory' | 'licenseExpiryDate' | 'contactNumber' | 'safetyScore' | 'status';
type SortOrder = 'asc' | 'desc';

export default function DriversView({
  drivers,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
}: DriversViewProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [scoreFilter, setScoreFilter] = useState('All');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Email simulation toast / alert state
  const [simulatedEmailSentTo, setSimulatedEmailSentTo] = useState<string | null>(null);

  // Form Fields state
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('Class A CDL');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [safetyScore, setSafetyScore] = useState<number>(95);
  const [status, setStatus] = useState<Driver['status']>('Available');

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Open add modal
  const openAddModal = () => {
    setName('');
    setLicenseNumber('');
    setLicenseCategory('Class A CDL');
    setLicenseExpiryDate('');
    setContactNumber('');
    setSafetyScore(95);
    setStatus('Available');
    setIsAddOpen(true);
  };

  // Open edit modal
  const openEditModal = (d: Driver) => {
    setSelectedDriver(d);
    setName(d.name);
    setLicenseNumber(d.licenseNumber);
    setLicenseCategory(d.licenseCategory);
    setLicenseExpiryDate(d.licenseExpiryDate);
    setContactNumber(d.contactNumber);
    setSafetyScore(d.safetyScore);
    setStatus(d.status);
    setIsEditOpen(true);
  };

  // Submissions
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !licenseNumber.trim() || !licenseExpiryDate) return;

    onAddDriver({
      name: name.trim(),
      licenseNumber: licenseNumber.trim().toUpperCase(),
      licenseCategory,
      licenseExpiryDate,
      contactNumber: contactNumber.trim(),
      safetyScore: Number(safetyScore),
      status,
    });

    setIsAddOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    if (!name.trim() || !licenseNumber.trim() || !licenseExpiryDate) return;

    onUpdateDriver({
      ...selectedDriver,
      name: name.trim(),
      licenseNumber: licenseNumber.trim().toUpperCase(),
      licenseCategory,
      licenseExpiryDate,
      contactNumber: contactNumber.trim(),
      safetyScore: Number(safetyScore),
      status,
    });

    setIsEditOpen(false);
  };

  // Email Notification simulator for expiring licenses
  const handleSimulateEmail = (driver: Driver) => {
    setSimulatedEmailSentTo(driver.name);
    setTimeout(() => {
      setSimulatedEmailSentTo(null);
    }, 5000); // clear banner after 5s
  };

  // Helper: check expiry status of driver
  const checkLicenseStatus = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysLeft < 0) {
      return { level: 'expired', label: 'EXPIRED', days: daysLeft };
    } else if (daysLeft <= 30) {
      return { level: 'critical', label: `EXPIRING SOON (${daysLeft}d)`, days: daysLeft };
    }
    return { level: 'valid', label: 'VALID', days: daysLeft };
  };

  // Helper to color safety score
  const getSafetyScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 75) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Filter & Sort
  const filteredAndSorted = drivers
    .filter(d => {
      const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.contactNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'All' || d.status === statusFilter;

      // Filter by Safety Score
      let matchScore = true;
      if (scoreFilter === 'excellent') matchScore = d.safetyScore >= 90;
      else if (scoreFilter === 'satisfactory') matchScore = d.safetyScore >= 75 && d.safetyScore < 90;
      else if (scoreFilter === 'risk') matchScore = d.safetyScore < 75;

      return matchSearch && matchStatus && matchScore;
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
    <div className="space-y-6" id="drivers-view-container">
      {/* Simulation Banner notification */}
      {simulatedEmailSentTo && (
        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between gap-3 animate-fade-in" id="simulation-toast">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm font-semibold">
              Notification Simulated! An electronic compliance warning was sent to <span className="underline">{simulatedEmailSentTo}</span>.
            </div>
          </div>
          <button onClick={() => setSimulatedEmailSentTo(null)} className="text-white hover:text-emerald-200 text-xs font-bold font-mono">
            Dismiss
          </button>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900" id="dri-title">Driver Operations Registry</h1>
          <p className="text-sm text-slate-500">Track and manage operator certifications, license expiries, safety records, and roster status.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 self-start sm:self-auto transition-colors"
          id="add-driver-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Operator</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center" id="drivers-filters-bar">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input 
            type="text" 
            placeholder="Search operator name, license..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            id="driver-search-input"
          />
        </div>

        {/* Filter selects */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Status */}
          <div className="flex-1 sm:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              id="dri-status-filter"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Safety Score Rating */}
          <div className="flex-1 sm:flex-initial">
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              id="dri-score-filter"
            >
              <option value="All">All Safety Scores</option>
              <option value="excellent">Excellent (90+)</option>
              <option value="satisfactory">Satisfactory (75-89)</option>
              <option value="risk">Safety Risk (Below 75)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="drivers-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Operator Name</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('licenseNumber')}>
                  <div className="flex items-center gap-1">
                    <span>License #</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('licenseCategory')}>
                  <div className="flex items-center gap-1">
                    <span>Class</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('licenseExpiryDate')}>
                  <div className="flex items-center gap-1">
                    <span>Expiry Date</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('safetyScore')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Safety Score</span>
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
                    <AlertTriangle className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">No operators matched filters</p>
                    <p className="text-xs">Adjust your search criteria or onboard a new driver.</p>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map(d => {
                  const lic = checkLicenseStatus(d.licenseExpiryDate);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors" id={`driver-row-${d.id}`}>
                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">{d.name}</td>
                      {/* License */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{d.licenseNumber}</td>
                      {/* Class */}
                      <td className="py-3.5 px-4 text-slate-500">
                        <span className="bg-slate-100 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">{d.licenseCategory}</span>
                      </td>
                      {/* Expiry */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-700">{d.licenseExpiryDate}</div>
                          {lic.level === 'expired' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-150 text-[9px] font-extrabold animate-pulse">
                              <AlertCircle className="w-2.5 h-2.5" /> EXPIRED
                            </span>
                          )}
                          {lic.level === 'critical' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-150 text-[9px] font-extrabold">
                              <AlertTriangle className="w-2.5 h-2.5" /> EXPIRING SOON
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Contact */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{d.contactNumber}</td>
                      {/* Safety */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${getSafetyScoreColor(d.safetyScore)}`}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {d.safetyScore}
                          </span>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          d.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          d.status === 'On Trip' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          d.status === 'Off Duty' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                          'bg-red-50 text-red-700 border-red-100 font-extrabold'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          {(lic.level === 'expired' || lic.level === 'critical') && (
                            <button
                              onClick={() => handleSimulateEmail(d)}
                              title="Simulate License Compliance Alert Email"
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-white rounded border border-amber-200 transition-all"
                              id={`alert-email-${d.id}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={() => openEditModal(d)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-200 rounded border border-slate-200 text-slate-600 transition-colors"
                            id={`edit-btn-${d.id}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Are you sure you want to offboard driver ${d.name}?`)) {
                                onDeleteDriver(d.id);
                              }
                            }}
                            className="p-1.5 bg-red-50 hover:bg-red-100 rounded border border-red-100 text-red-600 transition-colors"
                            id={`del-btn-${d.id}`}
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

      {/* Add Operator Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Onboard New Fleet Operator</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Driver Full Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" required placeholder="e.g. Liam Neeson" 
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">License Number <span className="text-red-500">*</span></label>
                  <input 
                    type="text" required placeholder="e.g. DL-8844221" 
                    value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">License Class</label>
                  <select 
                    value={licenseCategory} onChange={(e) => setLicenseCategory(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Class A CDL">Class A CDL (Commercial)</option>
                    <option value="Class B CDL">Class B CDL (Commercial)</option>
                    <option value="Standard">Standard Operator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">License Expiry Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" required 
                    value={licenseExpiryDate} onChange={(e) => setLicenseExpiryDate(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Safety Score (0-100)</label>
                  <input 
                    type="number" min={0} max={100}
                    value={safetyScore} onChange={(e) => setSafetyScore(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Contact Phone Number <span className="text-red-500">*</span></label>
                <input 
                  type="text" required placeholder="+1 (555) 777-1234" 
                  value={contactNumber} onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Roster Status</label>
                <select 
                  value={status} onChange={(e) => setStatus(e.target.value as Driver['status'])}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Onboard Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Operator Modal */}
      {isEditOpen && selectedDriver && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Edit Operator Profile</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Driver Full Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" required placeholder="e.g. Liam Neeson" 
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">License Number <span className="text-red-500">*</span></label>
                  <input 
                    type="text" required placeholder="e.g. DL-8844221" 
                    value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">License Class</label>
                  <select 
                    value={licenseCategory} onChange={(e) => setLicenseCategory(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Class A CDL">Class A CDL (Commercial)</option>
                    <option value="Class B CDL">Class B CDL (Commercial)</option>
                    <option value="Standard">Standard Operator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">License Expiry Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" required 
                    value={licenseExpiryDate} onChange={(e) => setLicenseExpiryDate(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Safety Score (0-100)</label>
                  <input 
                    type="number" min={0} max={100}
                    value={safetyScore} onChange={(e) => setSafetyScore(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Contact Phone Number <span className="text-red-500">*</span></label>
                <input 
                  type="text" required placeholder="+1 (555) 777-1234" 
                  value={contactNumber} onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Roster Status</label>
                <select 
                  value={status} onChange={(e) => setStatus(e.target.value as Driver['status'])}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold font-mono"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
