export interface BookingPolicyTier {
  id?: number;
  min_days_before: number;
  deadline_offset: number;
  label: string | null;
}

export interface BookingPolicy {
  id: number;
  name: string;
  min_booking_days: number;
  max_dates_per_room: number;
  max_rooms_per_date: number;
  max_total_room_hours: number | null;
  is_active: boolean;
  tiers: BookingPolicyTier[];
  created_at: string;
}

export interface PolicyAudit {
  id: number;
  booking_policy_id: number;
  user_id: number | null;
  user?: { id: number; name: string } | null;
  action: 'CREATED' | 'UPDATED' | 'RECALCULATED';
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  created_at: string;
}

export interface PolicyRecalculation {
  affected: Array<{ document_id: number; deadline: string }>;
  count: number;
  dry_run: boolean;
}

export interface PolicyDraft {
  name: string;
  min_booking_days: number;
  max_dates_per_room: number;
  max_rooms_per_date: number;
  max_total_room_hours: number | null;
  tiers: BookingPolicyTier[];
}
