# TransitOps — Smart Transport Operations Platform

TransitOps is a responsive, single-page web application designed for logistics companies to digitize vehicle registry tracking, operator compliance, cargo dispatch scheduling, maintenance work tickets, and corporate fuel/operational expense analysis.

---

## 🚀 Key Features

### 1. Roster & Asset Management
* **Vehicles Registry (CRUD)**: Log registration numbers, max payload capacities, initial odometers, acquisition costs, and region mapping. Includes document upload metadata management (inspections, permits, insurance).
* **Driver Management (CRUD)**: Track operator licensing, contact numbers, safety scores, and active duty roster states. Flag expiring (within 30 days) and expired licenses.

### 2. Dispatch Coordinator & Workflow Lifecycle
* **Automated Hard Constraints**:
  * Cargo weight cannot exceed vehicle maximum capacity.
  * Suspended operators or expired licenses are excluded from scheduling.
  * Vehicles/Drivers already active on a trip cannot be selected.
  * Retired or In-Shop vehicles are barred from dispatches.
* **Side-Effect Triggers**:
  * Dispatching transitions vehicle & driver to `On Trip`.
  * Completing a trip updates vehicle odometer, records diesel refuel volume + cost log, and returns both driver & vehicle to `Available`.
  * Cancelling an active dispatch reverts statuses to `Available`.

### 3. Maintenance Workshop Logs
* File service tickets (Oil Change, Brakes, Engine repair) per vehicle asset.
* **In-Shop Automation**: Creating an active maintenance ticket flips the vehicle status to `In Shop`. Releasing the vehicle restores it to `Available` (unless Retired).

### 4. Financial Outlay & ROI Reports
* Live compilation of operational cost ledgers (Fuel Logs + Maintenance Expenses).
* Metrics audited per vehicle and fleet-wide:
  * **Fuel Efficiency** (Distance / Liters)
  * **Asset ROI** ((Revenue - Operating Cost) / Acquisition Cost)
  * **Fleet Utilization** (Active Vehicles / Non-Retired Vehicles)
* Export audit registries to CSV and generate printable PDF summaries.

### 5. Role-Based Access Control (RBAC)
Simulate different access permissions depending on user roles:
* **Fleet Manager** ➜ Dashboard, Vehicles, Maintenance, Reports.
* **Driver** ➜ Dashboard, Trips.
* **Safety Officer** ➜ Dashboard, Drivers.
* **Financial Analyst** ➜ Dashboard, Fuel & Expenses, Reports.

### 6. Premium Theme & UX Options
* Interactive sidebar navigation and real-time status KPI widgets.
* Curved SVG stacked charts tracking operational yields (ROI) and diesel efficiency.
* Custom slate-navy dark mode toggle with smooth visual transitions.

---

## 🛠️ Local Setup & Running Instructions

### Prerequisites
* **Node.js** (v18.0.0 or higher recommended)
* **npm** (v9.0.0 or higher)

### 1. Install Project Dependencies
In your terminal, navigate to the project directory and run:
```bash
npm install
```

### 2. Start the Development Server
Launch the local Vite server:
```bash
npm run dev
```
The application will start, typically listening at: **`http://localhost:3000/`**

### 3. Build for Production
To bundle the project for production deployment:
```bash
npm run build
```
This generates optimized static files inside the `dist/` directory.

---

## 📝 Sample E2E Workflow to Validate

To verify platform functionality, log in as **Fleet Manager** or **Safety Officer** and perform the following sequence:
1. **Onboard Driver**: Roster a new driver named `Alex` with a future license expiry date (e.g. `2028-12-31`). Set status to `Available`.
2. **Register Vehicle**: Add a vehicle `Van-05` with a Max Cargo Capacity of `500` kg. Set status to `Available`.
3. **Plan Cargo Run**: Switch role to **Driver**, go to **Trips** view, click *Plan Cargo Run*. 
   * Select `Van-05` and `Alex`. 
   * Input Cargo Weight of `600` kg and attempt to submit. Verify the validation error blocks it.
   * Adjust weight to `450` kg and submit.
4. **Dispatch Trip**: Click *Dispatch* on the trip item. Verify that both the vehicle and driver statuses auto-flip to `On Trip`.
5. **Complete Trip**: Click *Complete*, input ending odometer `24950` and fuel used `40` L. Verify vehicle and driver return to `Available`.
6. **Log Maintenance**: Switch role to **Fleet Manager**, go to **Maintenance** view, book a ticket for `Van-05` with status `Active (In Shop)`. Verify `Van-05` status becomes `In Shop` and is excluded from subsequent trip dispatch selections.
7. **Verify Analytics**: Open **Reports** view. Verify the operational cost, fuel efficiency rating, and ROI percentage are recalculated dynamically.
