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
  district_id?: string;
}): Promise<AlertResponse[]> {
  const query = new URLSearchParams();
  if (params?.severity && params.severity !== 'all') query.set('severity', params.severity);
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.district_id) query.set('district_id', params.district_id);

  const qs = query.toString();
  return apiClient<AlertResponse[]>(`/alerts${qs ? `?${qs}` : ''}`);
}

export async function getAlertsSummary(): Promise<AlertsSummaryResponse> {
  return apiClient<AlertsSummaryResponse>('/alerts/summary');
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
  status?: 'pending' | 'approved' | 'rejected'
): Promise<RedistributionRecommendationResponse[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiClient<RedistributionRecommendationResponse[]>(`/redistribution/recommendations${qs}`);
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
export async function getTransfers(status?: 'approved' | 'dispatched' | 'received'): Promise<TransferResponse[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiClient<TransferResponse[]>(`/transfers${qs}`);
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
