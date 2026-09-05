/**
 * Showcase CSV Datasets for Telemetry Upload
 * Specifically structured to demonstrate statutory jurisdiction boundaries:
 * - State officers can ONLY upload for their state (e.g. INMP for Madhya Pradesh)
 * - District officers can ONLY upload for their district
 * - All India (National Admin) can upload from anywhere across the nation
 */

export interface ShowcaseDataset {
  id: string;
  name: string;
  filename: string;
  category: 'stock' | 'beds' | 'staff' | 'footfall';
  targetRole: string;
  authorizedScope: string;
  description: string;
  badge: {
    label: string;
    variant: 'success' | 'warning' | 'purple' | 'blue';
  };
  csvContent: string;
}

export const SHOWCASE_DATASETS: ShowcaseDataset[] = [
  {
    id: 'mp-crisis-stockout',
    name: 'MP Crisis Stockout Telemetry (Generates Active Alert in DB)',
    filename: 'sample_mp_crisis_stockout.csv',
    category: 'stock',
    targetRole: 'State Officer (MP - officer_inmp) or National Admin',
    authorizedScope: 'INMP (Madhya Pradesh)',
    description: 'Depletes Antivenom to 2 vials and Oxygen to 3 cylinders at Bhopal PHC. Triggers a CRITICAL alert and inter-district redistribution directive in DB to test live upload.',
    badge: {
      label: '🚨 CAUSES ISSUE TO ADDRESS',
      variant: 'warning',
    },
    csvContent: `phc_id,medicine_id,quantity,unit,expiry_date
PHC-MP-D1-P01,MED-ANTIVENOM,2,Vials,2027-04-30
PHC-MP-D1-P01,MED-OXYGEN-D,3,Cylinders,2027-02-15
PHC-MP-D1-P02,MED-IV-NACL,5,Bottles,2026-11-30
PHC-MP-D2-P01,MED-ANTIVENOM,180,Vials,2027-05-15
PHC-MP-D2-P02,MED-OXYGEN-D,45,Cylinders,2027-01-20`,
  },
  {
    id: 'mp-state-stock',
    name: 'Madhya Pradesh State Stock (Valid for INMP)',
    filename: 'sample_madhya_pradesh_stock.csv',
    category: 'stock',
    targetRole: 'State Officer (MP - officer_inmp) or National Admin',
    authorizedScope: 'INMP',
    description: 'Valid telemetry for 5 PHCs in Bhopal, Indore, and Jabalpur. Compliant with MP state officer jurisdiction.',
    badge: {
      label: 'STATE: INMP COMPLIANT',
      variant: 'blue',
    },
    csvContent: `phc_id,medicine_id,quantity,unit,expiry_date
PHC-MP-D1-P01,MED-ANTIVENOM,250,Vials,2027-04-30
PHC-MP-D1-P01,MED-OXYGEN-D,65,Cylinders,2027-02-15
PHC-MP-D1-P02,MED-IV-NACL,500,Bottles,2026-11-30
PHC-MP-D2-P01,MED-ANTIVENOM,180,Vials,2027-05-15
PHC-MP-D2-P02,MED-OXYGEN-D,45,Cylinders,2027-01-20
PHC-MP-D3-P01,MED-ANTIVENOM,120,Vials,2027-03-25`,
  },
  {
    id: 'mh-state-stock',
    name: 'Maharashtra State Stock (Valid for INMH)',
    filename: 'sample_maharashtra_stock.csv',
    category: 'stock',
    targetRole: 'State Officer (MH - officer_inmh) or National Admin',
    authorizedScope: 'INMH',
    description: 'Telemetry for Pune and Nagpur PHCs. Compliant for Maharashtra State Officers; triggers jurisdiction denial if uploaded by MP officers.',
    badge: {
      label: 'STATE: INMH COMPLIANT',
      variant: 'blue',
    },
    csvContent: `phc_id,medicine_id,quantity,unit,expiry_date
PHC-MH-PUN-01,MED-ANTIVENOM,320,Vials,2027-08-31
PHC-MH-PUN-01,MED-OXYGEN-D,85,Cylinders,2027-03-25
PHC-MH-PUN-02,MED-IV-NACL,650,Bottles,2026-10-31
PHC-MH-NAG-01,MED-ANTIVENOM,210,Vials,2027-06-15
PHC-MH-NAG-02,MED-OXYGEN-D,50,Cylinders,2027-02-28`,
  },
  {
    id: 'bhopal-district-stock',
    name: 'Bhopal District Stock (District Officer Scope)',
    filename: 'sample_bhopal_district_stock.csv',
    category: 'stock',
    targetRole: 'Bhopal District Officer, MP State Officer, or National Admin',
    authorizedScope: 'Bhopal District',
    description: 'Only Bhopal PHCs (PHC-MP-D1-P01, PHC-MP-D1-P02). Demonstrates district-level containment.',
    badge: {
      label: 'DISTRICT: BHOPAL ONLY',
      variant: 'purple',
    },
    csvContent: `phc_id,medicine_id,quantity,unit,expiry_date
PHC-MP-D1-P01,MED-ANTIVENOM,140,Vials,2027-04-30
PHC-MP-D1-P01,MED-OXYGEN-D,40,Cylinders,2027-02-15
PHC-MP-D1-P02,MED-IV-NACL,320,Bottles,2026-11-30
PHC-MP-D1-P02,MED-ANTIVENOM,95,Vials,2027-05-10`,
  },
  {
    id: 'cross-state-security-test',
    name: 'Cross-State Mixed Telemetry (Tests Security Denial)',
    filename: 'sample_cross_state_violation.csv',
    category: 'stock',
    targetRole: 'All India Admin (Accepted) vs State Officer (DENIED)',
    authorizedScope: 'Mixed (MP, Bihar, MH)',
    description: 'Contains rows for MP, Bihar, and MH. Demonstrates NDMA Sec 38 jurisdiction blocking: state officers get security alerts & blocked commit, while All-India admins have full clearance.',
    badge: {
      label: 'SECURITY TEST: CROSS-STATE',
      variant: 'warning',
    },
    csvContent: `phc_id,medicine_id,quantity,unit,expiry_date
PHC-MP-D1-P01,MED-ANTIVENOM,150,Vials,2027-04-30
PHC-BR-PAT-01,MED-OXYGEN-D,90,Cylinders,2027-03-10
PHC-MH-PUN-01,MED-IV-NACL,400,Bottles,2026-12-31
PHC-MP-D2-P01,MED-ANTIVENOM,110,Vials,2027-05-20
PHC-BR-MUZ-01,MED-ANTIVENOM,200,Vials,2027-06-15`,
  },
  {
    id: 'all-india-reconciliation',
    name: 'All-India National Reconciliation (National Admin)',
    filename: 'sample_all_india_stock.csv',
    category: 'stock',
    targetRole: 'National Admin (admin) - All India Clearance',
    authorizedScope: 'All-India (Pan-India)',
    description: 'Multi-state critical stock reconciliation spanning MP, MH, Bihar. Only All-India administrators can upload across state borders without restriction.',
    badge: {
      label: 'ALL-INDIA CLEARANCE',
      variant: 'success',
    },
    csvContent: `phc_id,medicine_id,quantity,unit,expiry_date
PHC-MP-D1-P01,MED-ANTIVENOM,300,Vials,2027-07-31
PHC-MH-PUN-01,MED-ANTIVENOM,350,Vials,2027-08-15
PHC-BR-PAT-01,MED-ANTIVENOM,400,Vials,2027-09-30
PHC-BR-MUZ-01,MED-OXYGEN-D,120,Cylinders,2027-04-20
PHC-MP-D2-P01,MED-OXYGEN-D,85,Cylinders,2027-05-10
PHC-MH-NAG-01,MED-IV-NACL,500,Bottles,2026-12-15`,
  },
];

/**
 * Creates a File object from showcase CSV text for instant testing
 */
export function createShowcaseFile(dataset: ShowcaseDataset): File {
  const blob = new Blob([dataset.csvContent], { type: 'text/csv;charset=utf-8;' });
  return new File([blob], dataset.filename, { type: 'text/csv' });
}
