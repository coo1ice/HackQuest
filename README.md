# HackQuest • National Health Resource Operations Dashboard (NHRM-India)

A public health incident command, national logistics orchestration, and district surveillance platform built for the Ministry of Health & Family Welfare (MoHFW), Government of India.

---

## 🌟 Overview & Architecture

This operational platform connects **36 States & Union Territories** and over **31,480+ Primary and Community Health Centers (PHCs/CHCs)** to provide real-time telemetry, automated triage, emergency inventory redistribution, and cold-chain transfer logistics.

The application features **5 core connected operational modules**:

1. **National Overview (`/national-overview`)**:
   - High-fidelity interactive Spatial Cartography of India with state-level vulnerability telemetry.
   - Live KPI ledger tracking monitored facilities, critical deficit states, national ICU bed saturation, and in-transit logistics.
   - Floating Command Panel with live telemetry, bed occupancy, stock runrate, and rapid state drill-down.
   - States Ranked by Urgency Registry with multi-category triage filters.

2. **State & District Drill-down (`/state-district-drill-down`)**:
   - Deep-dive into state health commands (e.g. Bihar State Resource Command).
   - Priority Redistribution Matrix pairing deficit hubs (e.g. Muzaffarpur, Vaishali) with surplus buffer depots (e.g. Patna, Nalanda).
   - Granular PHC/CHC Telemetry Ledger with live stock runway, bed occupancy, doctor roster ratios, and transfer requisition.
   - Interactive slide-in Emergency Redistribution modal with Green Corridor authorization.

3. **Urgent Alert Feed (`/urgent-alert-feed`)**:
   - Real-time national surveillance alert feed with countdown depletion clocks.
   - Multi-tier filtering by severity (Critical `<48h`, Warning `48-96h`, Staffing Deficits), supply category, and geographic zone.
   - Automated logistics recommendations with direct deep-linking to emergency redistribution approval.

4. **Emergency Redistribution (`/emergency-redistribution`)**:
   - Statutory allocation execution under the National Disaster Management Act (NDMA Sec 38).
   - Tactical transit corridor telemetry and cold-chain route ribbons (+2°C to +8°C).
   - Side-by-side facility diagnostics comparing donor buffer integrity with recipient deficit load.
   - Algorithmic match reasoning matrix and legal endorsement digital signature terminal.

5. **Inter-District Transfer Tracking (`/inter-district-transfer-tracking`)**:
   - National logistics dispatch console tracking active cross-district shipments.
   - 4-stage live stepper: Recommended &rarr; Approved &rarr; Dispatched [LIVE TRANSIT] &rarr; Received & Reconciled.
   - Vehicle continuous telemetry stream with live speed, driver contact, compartment temperature sensors, and dispatch milestones.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Running Locally

```bash
# Navigate to the dashboard directory
cd crisis-dashboard

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Visit the local development server (typically `http://localhost:5173`).

### Building for Production

```bash
cd crisis-dashboard
npm run build
```

---

## 🛠️ Technology Stack
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (Clinical Cool-Slate institutional color architecture)
- **Icons**: Lucide React & Google Material Symbols Outlined
- **Design System**: Operational Control-Room specifications adhering to `DESIGN.md`
