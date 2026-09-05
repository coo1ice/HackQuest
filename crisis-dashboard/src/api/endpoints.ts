// Typed API Functions matching exact backend endpoints and SRS v2.0 specifications

import { apiClient } from './client';
import type {
  TokenResponse,
  UserResponse,
  NationalOverviewResponse,
  StateOverviewResponse,
  DistrictDetailResponse,
  AlertResponse,
  AlertsSummaryResponse,
  RedistributionRecommendationResponse,
  TransferResponse,
  OutcomeSummaryResponse,
} from './types';

// 1. Authentication
export async function loginUser(credentials: { username: string; password: string }): Promise<TokenResponse> {
  return apiClient<TokenResponse>('/auth/login-json', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function getCurrentUser(): Promise<UserResponse> {
  return apiClient<UserResponse>('/auth/me');
}

export async function registerUser(payload: {
  username: string;
  password: string;
  role: 'national_admin' | 'state_officer' | 'district_officer' | 'phc_staff';
  scope_id: string;
}): Promise<UserResponse> {
  return apiClient<UserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 2. Visibility & Overview
export async function getNationalOverview(): Promise<NationalOverviewResponse> {
  return apiClient<NationalOverviewResponse>('/national/overview');
}

export async function getStateOverview(stateId: string): Promise<StateOverviewResponse> {
  return apiClient<StateOverviewResponse>(`/states/${encodeURIComponent(stateId)}/overview`);
}

export async function getDistrictPhcs(districtId: string): Promise<DistrictDetailResponse> {
  return apiClient<DistrictDetailResponse>(`/districts/${encodeURIComponent(districtId)}/phcs`);
}

// 3. Alerts
export async function getAlerts(params?: {
  severity?: string;
  status?: string;
  state_id?: string;
  district_id?: string;
}): Promise<AlertResponse[]> {
  const query = new URLSearchParams();
  if (params?.severity && params.severity !== 'all') query.set('severity', params.severity);
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.state_id && params.state_id !== 'all') query.set('state_id', params.state_id);
  if (params?.district_id && params.district_id !== 'all') query.set('district_id', params.district_id);

  const qs = query.toString();
  return apiClient<AlertResponse[]>(`/alerts${qs ? `?${qs}` : ''}`);
}

export async function getAlertsSummary(params?: { state_id?: string }): Promise<AlertsSummaryResponse> {
  const query = new URLSearchParams();
  if (params?.state_id && params.state_id !== 'all') query.set('state_id', params.state_id);
  const qs = query.toString();
  return apiClient<AlertsSummaryResponse>(`/alerts/summary${qs ? `?${qs}` : ''}`);
}

export async function updateAlertStatus(
  id: number,
  status: 'active' | 'acknowledged' | 'resolved'
): Promise<AlertResponse> {
  return apiClient<AlertResponse>(`/alerts/${id}/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
  });
}

// 4. Redistribution Recommendations & Decisions
export async function getRedistributionRecommendations(
  status?: 'pending' | 'approved' | 'rejected',
  state_id?: string
): Promise<RedistributionRecommendationResponse[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (state_id) params.append('state_id', state_id);
  const qs = params.toString();
  return apiClient<RedistributionRecommendationResponse[]>(`/redistribution/recommendations${qs ? `?${qs}` : ''}`);
}

export async function getRedistributionDetail(id: number): Promise<RedistributionRecommendationResponse> {
  return apiClient<RedistributionRecommendationResponse>(`/redistribution/recommendations/${id}`);
}

export async function approveRedistribution(id: number): Promise<TransferResponse> {
  return apiClient<TransferResponse>(`/redistribution/recommendations/${id}/approve`, {
    method: 'POST',
  });
}

export async function rejectRedistribution(
  id: number,
  reason = 'Discretionary officer override'
): Promise<RedistributionRecommendationResponse> {
  return apiClient<RedistributionRecommendationResponse>(
    `/redistribution/recommendations/${id}/reject?reason=${encodeURIComponent(reason)}`,
    {
      method: 'POST',
    }
  );
}

// 5. Transfer Tracking & Logistics
export async function getTransfers(
  params?: {
    status?: 'approved' | 'dispatched' | 'received';
    state_id?: string;
  } | 'approved' | 'dispatched' | 'received'
): Promise<TransferResponse[]> {
  const query = new URLSearchParams();
  if (typeof params === 'string') {
    query.append('status', params);
  } else if (params) {
    if (params.status) query.append('status', params.status);
    if (params.state_id) query.append('state_id', params.state_id);
  }
  const qs = query.toString();
  return apiClient<TransferResponse[]>(`/transfers${qs ? `?${qs}` : ''}`);
}

export async function getTransferDetail(id: number): Promise<TransferResponse> {
  return apiClient<TransferResponse>(`/transfers/${id}`);
}

export async function updateTransferStatus(
  id: number,
  payload: { status: 'approved' | 'dispatched' | 'received'; notes?: string }
): Promise<TransferResponse> {
  return apiClient<TransferResponse>(`/transfers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getOutcomesSummary(): Promise<OutcomeSummaryResponse> {
  return apiClient<OutcomeSummaryResponse>('/outcomes/summary');
}

export async function logOutcome(payload: {
  transfer_id: number;
  stockout_prevented: boolean;
  notes?: string;
}): Promise<{ status: string; transfer_id: number; stockout_prevented: boolean }> {
  return apiClient<{ status: string; transfer_id: number; stockout_prevented: boolean }>('/outcomes/log', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 6. PHC Bulk Telemetry Upload (CSV & Excel)
export interface BulkUploadResponse {
  status: 'validated' | 'committed';
  dry_run: boolean;
  filename: string;
  category: 'stock' | 'beds' | 'staff' | 'footfall';
  total_rows: number;
  valid_rows_count: number;
  flagged_rows_count: number;
  has_security_violations?: boolean;
  security_violations_count?: number;
  committed_records_count: number;
  alerts_created_count?: number;
  alerts_created?: Array<{
    phc_id: string;
    facility_name: string;
    district_id?: string;
    state_id?: string;
    resource_type: string;
    severity: string;
    stock_remaining: string;
    issue?: string;
  }>;
  recommendations_created?: Array<Record<string, any>>;
  preview_rows: Array<Record<string, any>>;
  columns_detected: string[];
  flagged_errors: Array<{ row: number; errors: string[] }>;
  processed_at: string;
}

export async function uploadPHCTelemetryFile(params: {
  file: File;
  category?: string;
  default_phc_id?: string;
  dry_run?: boolean;
}): Promise<BulkUploadResponse> {
  const formData = new FormData();
  formData.append('file', params.file);
  if (params.category) formData.append('category', params.category);
  if (params.default_phc_id) formData.append('default_phc_id', params.default_phc_id);
  formData.append('dry_run', params.dry_run ? 'true' : 'false');

  return apiClient<BulkUploadResponse>('/phc/bulk-upload', {
    method: 'POST',
    body: formData,
  });
}

