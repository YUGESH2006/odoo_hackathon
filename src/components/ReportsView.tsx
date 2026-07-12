import React, { useState } from 'react';
import { Vehicle, Trip, MaintenanceLog, FuelLog, Expense } from '../types';
import { 
  BarChart3, FileSpreadsheet, Printer, ArrowUpDown, 
  TrendingUp, Fuel, Calculator, HelpCircle, AlertCircle, Info, ShieldAlert, DollarSign
} from 'lucide-react';

interface ReportsViewProps {
  vehicles: Vehicle[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
}

type SortField = 'registrationNumber' | 'nameModel' | 'fuelEfficiency' | 'totalDistance' | 'operationalCost' | 'revenue' | 'roi';
type SortOrder = 'asc' | 'desc';

export default function ReportsView({
  vehicles,
  trips,
  maintenanceLogs,
  fuelLogs,
  expenses
}: ReportsViewProps) {
  const [sortField, setSortField] = useState<SortField>('registrationNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Trigger Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Compile detailed metrics for each vehicle
  const compileReportData = () => {
    return vehicles.map(veh => {
      // Completed Trips for this vehicle
      const completedTrips = trips.filter(t => t.vehicleId === veh.id && t.status === 'Completed');
      
      // Calculate Total Distance from completed trips
      const totalDistance = completedTrips.reduce((sum, t) => {
        if (t.odometerEnd !== undefined) {
          return sum + (t.odometerEnd - t.odometerStart);
        }
        return sum + t.plannedDistance;
      }, 0);

      // Calculate Total Fuel consumed on completed trips
      const totalFuelConsumed = completedTrips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);

      // Calculate Fuel Efficiency (km / Liters)
      const fuelEfficiency = totalFuelConsumed > 0 
        ? parseFloat((totalDistance / totalFuelConsumed).toFixed(2)) 
        : 0;

      // Fuel expenses: sum of all fuel logs
      const fuelCostSum = fuelLogs
        .filter(f => f.vehicleId === veh.id)
        .reduce((sum, f) => sum + f.cost, 0);

      // Maintenance expenses: sum of all maintenance logs + maintenance expenses
      const maintCostSum = expenses
        .filter(e => e.vehicleId === veh.id && e.type === 'Maintenance')
        .reduce((sum, e) => sum + e.amount, 0);

      // Total Operational Cost (Fuel costs + Maintenance costs)
      const operationalCost = fuelCostSum + maintCostSum;

      // Completed Trips Revenue
      const totalRevenue = completedTrips.reduce((sum, t) => sum + t.revenue, 0);

      // ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
      // We multiply by 100 to get a percentage
      const roi = veh.acquisitionCost > 0 
        ? parseFloat((((totalRevenue - operationalCost) / veh.acquisitionCost) * 100).toFixed(2))
        : 0;

      return {
        vehicle: veh,
        registrationNumber: veh.registrationNumber,
        nameModel: veh.nameModel,
        type: veh.type,
        totalDistance,
        totalFuelConsumed,
        fuelEfficiency,
        operationalCost,
        revenue: totalRevenue,
        roi,
      };
    });
  };

  const reportRows = compileReportData();

  // Fleet Wide Calculations
  const fleetTotalDistance = reportRows.reduce((sum, r) => sum + r.totalDistance, 0);
  const fleetTotalFuel = reportRows.reduce((sum, r) => sum + r.totalFuelConsumed, 0);
  const fleetFuelEfficiency = fleetTotalFuel > 0 
    ? parseFloat((fleetTotalDistance / fleetTotalFuel).toFixed(2)) 
    : 0;

  const fleetTotalOpsCost = reportRows.reduce((sum, r) => sum + r.operationalCost, 0);
  const fleetTotalRevenue = reportRows.reduce((sum, r) => sum + r.revenue, 0);
  
  const totalFleetAcqCost = vehicles
    .filter(v => v.status !== 'Retired')
    .reduce((sum, v) => sum + v.acquisitionCost, 0);

  const fleetROI = totalFleetAcqCost > 0 
    ? parseFloat((((fleetTotalRevenue - fleetTotalOpsCost) / totalFleetAcqCost) * 100).toFixed(2))
    : 0;

  // Fleet Utilization % = vehicles On Trip / total non-retired vehicles
  const nonRetiredVehicles = vehicles.filter(v => v.status !== 'Retired');
  const activeVehicles = vehicles.filter(v => v.status === 'On Trip');
  const fleetUtilization = nonRetiredVehicles.length > 0 
    ? Math.round((activeVehicles.length / nonRetiredVehicles.length) * 100) 
    : 0;

  // Sorting
  const sortedReports = [...reportRows].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    }
  });

  // CSV Export
  const handleCSVExport = () => {
    const headers = [
      'Registration Number',
      'Vehicle Model',
      'Vehicle Type',
      'Total Distance (km)',
      'Total Fuel Used (L)',
      'Fuel Efficiency (km/L)',
      'Operational Cost ($)',
      'Revenue Generated ($)',
      'Return on Investment (ROI %)'
    ];

    const dataRows = reportRows.map(r => [
      r.registrationNumber,
      r.nameModel,
      r.type,
      r.totalDistance,
      r.totalFuelConsumed,
      r.fuelEfficiency,
      r.operationalCost,
      r.revenue,
      `${r.roi}%`
    ]);

    // CSV format builder
    const csvContent = [
      headers.join(','),
      ...dataRows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TransitOps_Fleet_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable Report trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="reports-view-container">
      
      {/* Printable CSS style tags hidden on standard UI but invoked during window.print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #reports-view-container, #reports-view-container * {
            visibility: visible;
          }
          #reports-view-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900" id="rep-title">Fleet Intelligence & ROI Analytics</h1>
          <p className="text-sm text-slate-500 font-medium font-sans">Evaluate critical diesel efficiency, fleet dispatches, service outlay logs, and true vehicle return metrics.</p>
        </div>

        <div className="flex gap-2.5 self-start sm:self-auto">
          <button 
            onClick={handleCSVExport}
            className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            id="csv-export-btn"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export to CSV</span>
          </button>
          <button 
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            id="pdf-print-btn"
          >
            <Printer className="w-4 h-4" />
            <span>Generate PDF Report</span>
          </button>
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">TransitOps Corporate Intelligence</h1>
        <p className="text-sm text-slate-600 font-semibold">Smart Logistics Fleet Performance Report</p>
        <p className="text-xs text-slate-400 mt-1 font-mono">Date Generated: {new Date().toLocaleDateString()} | Admin Officer: Sophia Chen</p>
      </div>

      {/* Fleet-Wide Intelligence Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="reports-fleet-kpis">
        {/* Fuel Efficiency */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Fuel className="w-4 h-4 text-indigo-500" />
            Average Fuel Efficiency
          </span>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900">{fleetFuelEfficiency}</span>
            <span className="text-xs font-bold text-slate-400">km / L</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Based on completed dispatches</p>
        </div>

        {/* Fleet Utilization */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calculator className="w-4 h-4 text-blue-500" />
            Active Dispatch Ratios
          </span>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900">{fleetUtilization}%</span>
            <span className="text-xs font-semibold text-blue-600">utilization</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">{activeVehicles.length} of {nonRetiredVehicles.length} non-retired vehicles</p>
        </div>

        {/* Operational Costs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-amber-500" />
            Operational Cost outlay
          </span>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900">${fleetTotalOpsCost.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Combined fuel refuels + maintenance</p>
        </div>

        {/* Vehicle ROI */}
        <div className="bg-emerald-950 text-emerald-50 p-5 rounded-2xl border border-emerald-900 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Fleet ROI Yield
          </span>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white">{fleetROI}%</span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-2">Yield on active acquisition value</p>
        </div>
      </div>

      {/* Advanced Comparative Charts Grid (Bonus priority 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="reports-charts">
        
        {/* Chart 1: Vehicle ROI Yield Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between" id="chart-roi-card">
          <div className="space-y-1 mb-4">
            <h4 className="font-bold text-slate-900 text-sm">Corporate Yield comparisons (Vehicle ROI %)</h4>
            <p className="text-[10px] text-slate-500 font-medium">ROI evaluates net cargo revenues offset by operating maintenance and fuel bills.</p>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-center">
            {reportRows.map(row => {
              // Scale positive vs negative
              const isPositive = row.roi >= 0;
              const absRoi = Math.min(Math.abs(row.roi), 100); // capped visual ceiling
              return (
                <div key={row.registrationNumber} className="flex items-center gap-3 text-xs" id={`chart-roi-${row.registrationNumber}`}>
                  <span className="w-16 font-bold text-slate-900">{row.registrationNumber}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden relative flex items-center">
                    <div 
                      className={`h-full rounded-lg transition-all duration-500 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${absRoi}%` }}
                    />
                    <span className="absolute right-2 font-mono font-bold text-slate-700 text-[10px]">
                      {row.roi}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Fuel Efficiency Rating (km / Liter) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between" id="chart-fuel-card">
          <div className="space-y-1 mb-4">
            <h4 className="font-bold text-slate-900 text-sm">Diesel Efficiency Rating (km / Liter)</h4>
            <p className="text-[10px] text-slate-500 font-medium">Standard efficiency metrics computed from completed odometer logs and fuel consumption ratios.</p>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-center">
            {reportRows.map(row => {
              // Scale visual bar (max 15 km/L ceiling)
              const pct = Math.min((row.fuelEfficiency / 15) * 100, 100);
              return (
                <div key={row.registrationNumber} className="flex items-center gap-3 text-xs" id={`chart-fuel-eff-${row.registrationNumber}`}>
                  <span className="w-16 font-bold text-slate-900">{row.registrationNumber}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden relative flex items-center">
                    <div 
                      className="h-full rounded-lg bg-indigo-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute right-2 font-mono font-bold text-slate-700 text-[10px]">
                      {row.fuelEfficiency > 0 ? `${row.fuelEfficiency} km/L` : '0 L (No Trips)'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Detailed Reports Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="reports-table-card">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Audit Registry</h3>
            <p className="text-xs text-slate-500 font-medium">Consolidated transport ledger audited for financial returns.</p>
          </div>
        </div>

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
                    <span>Vehicle Make</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('totalDistance')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Distance</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Liters Used</th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('fuelEfficiency')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Efficiency</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('operationalCost')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Operating Cost</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('revenue')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Revenues</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3 px-6 text-right cursor-pointer hover:bg-slate-100 transition-colors bg-slate-50 font-bold text-slate-800" onClick={() => handleSort('roi')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>ROI %</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedReports.map(r => (
                <tr key={r.registrationNumber} className="hover:bg-slate-50 transition-colors" id={`report-row-${r.registrationNumber}`}>
                  {/* Reg # */}
                  <td className="py-3.5 px-4 font-bold text-slate-900 tracking-wide">{r.registrationNumber}</td>
                  {/* Model */}
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    <div>{r.nameModel}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{r.type}</div>
                  </td>
                  {/* Distance */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600">{r.totalDistance.toLocaleString()} km</td>
                  {/* Liters */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600">{r.totalFuelConsumed.toLocaleString()} L</td>
                  {/* Efficiency */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-600">
                    {r.fuelEfficiency > 0 ? `${r.fuelEfficiency} km/L` : '—'}
                  </td>
                  {/* Ops cost */}
                  <td className="py-3.5 px-4 text-right font-mono text-rose-600 font-medium">-${r.operationalCost.toLocaleString()}</td>
                  {/* Revenue */}
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-bold">${r.revenue.toLocaleString()}</td>
                  {/* ROI */}
                  <td className={`py-3.5 px-6 text-right font-mono font-extrabold bg-slate-50/40 ${
                    r.roi > 0 ? 'text-emerald-700' : r.roi < 0 ? 'text-rose-600' : 'text-slate-400'
                  }`}>
                    {r.roi}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
