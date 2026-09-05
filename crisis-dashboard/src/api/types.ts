// Type Definitions matching SRS v2.0 & Backend Schemas

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  scope_id: string;
  username: string;
}

export interface UserResponse {
  id: number;
  username: string;
  role: string;
  scope_id: string;
  is_active: boolean;
  created_at: string;
}

export interface StateSummaryItem {
  state_id: string;
  state_name: string;
  total_districts: number;
  total_phcs: number;
  critical_phcs_count: number;
  avg_stockout_risk: number;
  bed_occupancy_pct: number;
  stock_health_score: number;
  bed_health_score: number;
  staff_health_score: number;
  composite_score: number;
  status: 'critical' | 'warning' | 'adequate' | 'optimal';
}

export interface NationalOverviewResponse {
  total_phcs: number;
  reporting_phcs: number;
  reporting_rate_pct: number;
  critical_deficit_states_count: number;
  national_bed_occupancy_pct: number;
  in_transit_transfers_count: number;
  national_health_score: number;
  states: StateSummaryItem[];
  last_synced_at: string;
}

export interface DistrictSummaryItem {
  district_id: string;
  district_name: string;
  total_phcs: number;
  critical_phcs_count: number;
  avg_stockout_risk: number;
  bed_occupancy_pct: number;
  status: string;
}

export interface StateOverviewResponse {
  state_id: string;
  state_name: string;
  total_districts: number;
  total_phcs: number;
  active_alerts_count: number;
  stock_health_score: number;
  bed_health_score: number;
  staff_health_score: number;
  composite_score: number;
  districts: DistrictSummaryItem[];
  last_synced_at: string;
}

export interface PHCStockSummaryItem {
  medicine_id: string;
  quantity: number;
  unit: string;
  days_of_stock_left: number;
  expiry_date: string | null;
  is_critical: boolean;
}

export interface PHCDetailItem {
  id: string;
  name: string;
  block_name: string;
  latitude: number;
  longitude: number;
  contact_number: string | null;
  total_beds: number;
  occupied_beds: number;
  bed_occupancy_pct: number;
  stocks: PHCStockSummaryItem[];
  doctor_present: boolean;
  nurse_present: boolean;
  today_footfall: number;
  status: 'critical' | 'warning' | 'normal';
}

export interface DistrictDetailResponse {
  district_id: string;
  district_name: string;
  state_id: string;
  phcs: PHCDetailItem[];
  last_synced_at: string;
}

export interface AlertResponse {
  id: number;
  phc_id: string;
  phc_name?: string;
  district_name?: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  action_recommended?: string;
  linked_recommendation_id?: number;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  created_at: string;
}

export interface AlertsSummaryResponse {
  total_active_alerts: number;
  critical_count: number;
  warning_count: number;
  staff_shortage_count: number;
}

export interface RedistributionRecommendationResponse {
  id: number;
  medicine_id: string;
  from_phc_id: string;
  from_phc_name?: string;
  to_phc_id: string;
  to_phc_name?: string;
  quantity: number;
  distance_km: number;
  days_to_expiry: number;
  predicted_impact: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface TransferStatusHistoryItem {
  status: string;
  changed_at: string;
  changed_by: string;
  notes?: string;
}

export interface TransferResponse {
  id: number;
  recommendation_id: number;
  status: 'approved' | 'dispatched' | 'received';
  status_history: TransferStatusHistoryItem[];
  recommendation?: RedistributionRecommendationResponse;
}

export interface OutcomeSummaryResponse {
  total_transfers_completed: number;
  stockouts_prevented_count: number;
  accuracy_percentage: number;
}
