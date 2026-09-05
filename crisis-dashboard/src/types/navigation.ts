export type PageId =
  | 'national-overview'
  | 'state-district-drill-down'
  | 'urgent-alert-feed'
  | 'emergency-redistribution'
  | 'inter-district-transfer-tracking'
  | 'login';

export interface NavigationContext {
  page: PageId;
  stateId?: string;
  districtName?: string;
  facilityCode?: string;
  facilityName?: string;
  directiveRef?: string;
  directiveId?: number;
  shipmentId?: string;
  transferId?: number;
}
