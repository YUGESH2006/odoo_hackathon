import React, { useState } from 'react';
import { FuelLog, Expense, Vehicle, ExpenseType } from '../types';
import { 
  Plus, Search, ArrowUpDown, Trash2, Fuel, DollarSign, 
  Settings, X, AlertCircle, Info, Calendar, BarChart3, Receipt
} from 'lucide-react';

interface ExpensesViewProps {
  fuelLogs: FuelLog[];
  expenses: Expense[];
  vehicles: Vehicle[];
  onAddFuelLog: (log: Omit<FuelLog, 'id'>) => void;
  onAddExpense: (exp: Omit<Expense, 'id'>) => void;
  onDeleteFuelLog: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

type SortField = 'date' | 'vehicle' | 'amount' | 'type';
type SortOrder = 'asc' | 'desc';

export default function ExpensesView({
  fuelLogs,
  expenses,
  vehicles,
  onAddFuelLog,
  onAddExpense,
  onDeleteFuelLog,
  onDeleteExpense
}: ExpensesViewProps) {
  // Tabs: 'summary' | 'fuel' | 'general'
  const [activeTab, setActiveTab] = useState<'summary' | 'fuel' | 'general'>('summary');

  // Filters & sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modals state
  const [isAddFuelOpen, setIsAddFuelOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Form states - Fuel
  const [fuelVehId, setFuelVehId] = useState('');
  const [fuelLiters, setFuelLiters] = useState<number>(45);
  const [fuelCost, setFuelCost] = useState<number>(65);
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split('T')[0]);

  // Form states - Expense
  const [expVehId, setExpVehId] = useState('');
  const [expType, setExpType] = useState<ExpenseType>('Toll');
  const [expAmount, setExpAmount] = useState<number>(15);
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  // Pre-calculate per-vehicle operational cost breakdowns
  const getVehicleOpsSummary = () => {
    return vehicles.map(veh => {
      // Fuel cost: sum of all fuel logs for this vehicle
      const totalFuelCost = fuelLogs
        .filter(f => f.vehicleId === veh.id)
        .reduce((sum, f) => sum + f.cost, 0);

      // Maintenance cost: sum of all expenses of type 'Maintenance' for this vehicle
      const totalMaintCost = expenses
        .filter(e => e.vehicleId === veh.id && e.type === 'Maintenance')
        .reduce((sum, e) => sum + e.amount, 0);

      // Toll & other costs: sum of all expenses of type 'Toll' or 'Misc'
      const totalTollCost = expenses
        .filter(e => e.vehicleId === veh.id && e.type === 'Toll')
        .reduce((sum, e) => sum + e.amount, 0);

      const totalMiscCost = expenses
        .filter(e => e.vehicleId === veh.id && e.type === 'Misc')
        .reduce((sum, e) => sum + e.amount, 0);

      const cumulativeOpsCost = totalFuelCost + totalMaintCost + totalTollCost + totalMiscCost;

      return {
        vehicle: veh,
        totalFuelCost,
        totalMaintCost,
        totalTollCost,
        totalMiscCost,
        cumulativeOpsCost,
      };
    });
  };

  const vehicleSummaries = getVehicleOpsSummary();

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Open add fuel
  const openAddFuel = () => {
    setFuelVehId(vehicles[0] ? vehicles[0].id : '');
    setFuelLiters(45);
    setFuelCost(65);
    setFuelDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setIsAddFuelOpen(true);
  };

  // Open add expense
  const openAddExpense = () => {
    setExpVehId(vehicles[0] ? vehicles[0].id : '');
    setExpType('Toll');
    setExpAmount(15);
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpNotes('');
    setFormError(null);
    setIsAddExpenseOpen(true);
  };

  // Submit Fuel
  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelVehId) return;

    onAddFuelLog({
      vehicleId: fuelVehId,
      liters: Number(fuelLiters),
      cost: Number(fuelCost),
      date: fuelDate,
    });

    setIsAddFuelOpen(false);
  };

  // Submit Expense
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expVehId) return;

    onAddExpense({
      vehicleId: expVehId,
      type: expType,
      amount: Number(expAmount),
      date: expDate,
      notes: expNotes.trim(),
    });

    setIsAddExpenseOpen(false);
  };

  // Total Fleet Expense sum
  const totalFleetFuel = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalFleetMaint = expenses.filter(e => e.type === 'Maintenance').reduce((sum, e) => sum + e.amount, 0);
  const totalFleetToll = expenses.filter(e => e.type === 'Toll').reduce((sum, e) => sum + e.amount, 0);
  const totalFleetMisc = expenses.filter(e => e.type === 'Misc').reduce((sum, e) => sum + e.amount, 0);
  const grandTotalExpenses = totalFleetFuel + totalFleetMaint + totalFleetToll + totalFleetMisc;

  // Sorting lists
  const sortedFuelLogs = [...fuelLogs]
    .filter(log => {
      const veh = vehicles.find(v => v.id === log.vehicleId);
      const searchStr = veh ? `${veh.registrationNumber} ${veh.nameModel}`.toLowerCase() : '';
      return searchStr.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        return sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      } else if (sortField === 'amount') {
        return sortOrder === 'asc' ? a.cost - b.cost : b.cost - a.cost;
      }
      return 0;
    });

  const sortedExpenses = [...expenses]
    .filter(exp => {
      const veh = vehicles.find(v => v.id === exp.vehicleId);
      const searchStr = veh ? `${veh.registrationNumber} ${veh.nameModel} ${exp.notes || ''}`.toLowerCase() : '';
      return searchStr.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        return sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      } else if (sortField === 'amount') {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else if (sortField === 'type') {
        return sortOrder === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type);
      }
      return 0;
    });

  return (
    <div className="space-y-6" id="expenses-view-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900" id="exp-title">Financial & Fuel Logs</h1>
          <p className="text-sm text-slate-500 font-medium">Log diesel consumption, highway tolls, standard services, and evaluate vehicle lifetime operational costs.</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={openAddFuel}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            id="log-diesel-btn"
          >
            <Fuel className="w-4 h-4" />
            <span>Log Diesel</span>
          </button>
          <button 
            onClick={openAddExpense}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            id="log-toll-btn"
          >
            <DollarSign className="w-4 h-4" />
            <span>Log Other Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="expenses-kpis">
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Operations Costs</span>
          <span className="text-2xl font-extrabold text-white mt-1">${grandTotalExpenses.toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 mt-1">Sum of fuel, parts & transit tolls</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cumulative Fuel Cost</span>
          <span className="text-2xl font-extrabold text-indigo-600 mt-1">${totalFleetFuel.toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 mt-1">Total liters logged: {fuelLogs.reduce((sum, f) => sum + f.liters, 0).toLocaleString()} L</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Maintenance Service Outlay</span>
          <span className="text-2xl font-extrabold text-amber-600 mt-1">${totalFleetMaint.toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 mt-1">Completed repairs: {expenses.filter(e => e.type === 'Maintenance').length} logs</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tolls & Freight Misc</span>
          <span className="text-2xl font-extrabold text-slate-800 mt-1">${(totalFleetToll + totalFleetMisc).toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 mt-1">Tolls: ${totalFleetToll} | Misc: ${totalFleetMisc}</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200" id="expenses-tabs">
        <button
          onClick={() => { setActiveTab('summary'); setSearchTerm(''); }}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'summary' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          id="summary-tab-btn"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Vehicle Operational Costs</span>
        </button>
        <button
          onClick={() => { setActiveTab('fuel'); setSearchTerm(''); }}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'fuel' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          id="diesel-tab-btn"
        >
          <Fuel className="w-4 h-4" />
          <span>Fuel Ledger ({fuelLogs.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('general'); setSearchTerm(''); }}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          id="toll-tab-btn"
        >
          <Receipt className="w-4 h-4" />
          <span>General Expense Book ({expenses.length})</span>
        </button>
      </div>

      {/* SEARCH (if not on summary) */}
      {activeTab !== 'summary' && (
        <div className="relative w-full max-w-sm" id="expenses-search-row">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'fuel' ? 'diesel logs' : 'expenses'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            id="expense-search-field"
          />
        </div>
      )}

      {/* 1. VEHICLE COST BREAKDOWNS TAB */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="expenses-summary-panel">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Automated Operational Cost Registry</h3>
            <p className="text-xs text-slate-500 font-medium">Cumulative breakdown per asset: Fuel Ledger + Maintenance Workshop Outlay + Highway Fees.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6">Vehicle Registration</th>
                  <th className="py-3 px-4">Model Description</th>
                  <th className="py-3 px-4 text-right">Fuel Logs</th>
                  <th className="py-3 px-4 text-right">Workshop Maintenance</th>
                  <th className="py-3 px-4 text-right">Tolls & Freight Misc</th>
                  <th className="py-3 px-6 text-right bg-slate-50 font-bold text-slate-800">Total Operational Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {vehicleSummaries.map(({ vehicle, totalFuelCost, totalMaintCost, totalTollCost, totalMiscCost, cumulativeOpsCost }) => (
                  <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors" id={`summary-row-${vehicle.id}`}>
                    <td className="py-4 px-6 font-bold text-slate-900 tracking-wide">{vehicle.registrationNumber}</td>
                    <td className="py-4 px-4 font-medium text-slate-800">{vehicle.nameModel}</td>
                    <td className="py-4 px-4 text-right font-mono text-slate-600">${totalFuelCost.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-mono text-slate-600">${totalMaintCost.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-mono text-slate-600">${(totalTollCost + totalMiscCost).toLocaleString()}</td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-slate-950 bg-slate-50/40">${cumulativeOpsCost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. FUEL LEDGER TAB */}
      {activeTab === 'fuel' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in" id="fuel-logs-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">
                      <span>Refuel Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4 text-right">Refuel Volume</th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('amount')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Refuel Cost</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Unit Price per L</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedFuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Fuel className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium">No refuels logged</p>
                    </td>
                  </tr>
                ) : (
                  sortedFuelLogs.map(log => {
                    const veh = vehicles.find(v => v.id === log.vehicleId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors" id={`fuel-row-${log.id}`}>
                        <td className="py-3.5 px-6 font-mono font-semibold text-slate-600">{log.date}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{veh ? veh.registrationNumber : 'Unknown'}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">{log.liters.toLocaleString()} Liters</td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">${log.cost.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400">${(log.cost / log.liters).toFixed(2)}/L</td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => {
                              if (confirm('Delete this fuel receipt log? This will update vehicle lifetime expense reports.')) {
                                onDeleteFuelLog(log.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. GENERAL EXPENSES TAB */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in" id="other-expenses-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('type')}>
                    <div className="flex items-center gap-1">
                      <span>Category</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Notes & Expense Details</th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('amount')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Amount</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Receipt className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium">No expenses recorded</p>
                    </td>
                  </tr>
                ) : (
                  sortedExpenses.map(exp => {
                    const veh = vehicles.find(v => v.id === exp.vehicleId);
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors" id={`exp-row-${exp.id}`}>
                        <td className="py-3.5 px-6 font-mono font-semibold text-slate-600">{exp.date}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{veh ? veh.registrationNumber : 'Unknown'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            exp.type === 'Fuel' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            exp.type === 'Maintenance' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            exp.type === 'Toll' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {exp.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">{exp.notes || '—'}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-950">${exp.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => {
                              if (confirm('Delete this expense line item? This will update vehicle lifetime expense reports.')) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Diesel Modal */}
      {isAddFuelOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Fuel Card Diesel Refuel Log</h3>
              <button onClick={() => setIsAddFuelOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFuelSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Refueled Vehicle <span className="text-red-500">*</span></label>
                <select
                  value={fuelVehId}
                  onChange={(e) => setFuelVehId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  required
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} - {v.nameModel}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Refuel Date</label>
                  <input 
                    type="date" required 
                    value={fuelDate} onChange={(e) => setFuelDate(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Volume (Liters)</label>
                  <input 
                    type="number" min={1} required
                    value={fuelLiters} onChange={(e) => setFuelLiters(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Fuel Bill Cost (USD)</label>
                <input 
                  type="number" min={1} required
                  value={fuelCost} onChange={(e) => setFuelCost(Number(e.target.value))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 p-4 -mx-6 -mb-6">
                <button 
                  type="button" onClick={() => setIsAddFuelOpen(false)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-white font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Log Diesel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Record Other Transport Expense</h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Linked Vehicle <span className="text-red-500">*</span></label>
                <select
                  value={expVehId}
                  onChange={(e) => setExpVehId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  required
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} - {v.nameModel}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Expense Category</label>
                  <select 
                    value={expType}
                    onChange={(e) => setExpType(e.target.value as ExpenseType)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white font-bold text-slate-800"
                  >
                    <option value="Toll">Turnpike Toll Fee</option>
                    <option value="Maintenance">Workshop Repair/Parts</option>
                    <option value="Misc">Miscellaneous Fee</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Billing Amount ($)</label>
                  <input 
                    type="number" min={1} required
                    value={expAmount} onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Date of Expense</label>
                <input 
                  type="date" required 
                  value={expDate} onChange={(e) => setExpDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Expense Description Notes</label>
                <input 
                  type="text" placeholder="e.g. I-80 Turnpike toll tollway fee" 
                  value={expNotes} onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 p-4 -mx-6 -mb-6">
                <button 
                  type="button" onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-white font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
