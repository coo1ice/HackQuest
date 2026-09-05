# Design Specification: National Health Resource Operations Dashboard (NHRM-India)

A national public health resource dashboard for government health officials in India, used to monitor medicine stock, bed availability, and staff attendance across thousands of Primary Health Centres (PHCs), and to approve emergency resource redistribution between districts.

## Audience & Context
- **Users**: State and district health officials — not developers, not consumers.
- **Context**: Checking during ordinary operations and during health emergencies (outbreaks, flood disasters, seasonal surges).
- **Tone**: Calm, authoritative, and trustworthy under stress; visual register of an operations control room or hospital management center.

## Design Direction & Constraints
1. **Color Palette**:
   - Cool, neutral base: off-white or light slate/gray-blue (`bg-slate-100`, `bg-white`, `border-slate-300`).
   - Avoid warm cream/clay and avoid near-black/neon gimmickry.
   - Urgent/Severity: reserved exclusively for alerts and critical stock states (muted red `#b91c1c` / amber), never used decoratively.
   - Buffer/Surplus: calm sky/secondary slate accents (`#0369a1`).
2. **Typography**:
   - Single strong sans-serif font family.
   - Clear type scale.
   - No all-caps labels, no tracked-out decorative eyebrow text above headings, no trailing arrow glyphs appended to buttons or links.
3. **Structure & Dividers**:
   - Structural elements (borders, dividers, numbering) encode real meaning (e.g. dividing districts or facilities), not decorative chrome.
   - No gradient washes, no glassmorphism, no generic template cards.
4. **Tone of Voice**:
   - Plain language a district officer would use; active voice.
   - No developer jargon (no "webhook", "sync job", "JSON payload").
   - Buttons describe the explicit action ("Approve transfer", "Reject transfer", "Sign in").
   - Empty and error states explain what happened and what to do next without apologizing or technical dumps.
5. **Form Factor**:
   - Desktop-first for control room monitors; fully responsive on tablet for field officers.

## Core Screens
1. **National Overview**: Map of India shaded by aggregate stock/capacity health; compact side panel listing states ranked by severity; header showing last-sync freshness.
2. **State & District Drill-down**: Severity-shaded district summary; sortable list of PHCs with stock %, bed occupancy %, staff attendance %; priority redistribution matrix.
3. **Urgent Alert Feed**: Chronological, severity-sorted list; each alert names the PHC, the resource, predicted time-to-stockout, and links directly to recommended action.
4. **Redistribution Approval Screen (Centerpiece)**: Surplus-district $\to$ deficit-district match; visible reasoning (distance, days-to-expiry, quantity, predicted demand); approve or reject action attributed to named official.
5. **Transfer Tracking**: Horizontal status pipeline: Recommended $\to$ Approved $\to$ Dispatched $\to$ Received.
