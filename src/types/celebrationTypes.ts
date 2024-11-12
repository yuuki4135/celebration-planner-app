
export interface ItemDetail {
  name: string;
  description: string;
  importance: string;
  estimated_budget: string;
  when_to_prepare: string;
  notes: string;
  recommendations: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  reason: string;
}

export interface RecommendedDate {
  date: string;
  reason: string;
  considerations?: string;
  is_holiday?: boolean;
  time_slots: TimeSlot[];
}

export interface EventDetail {
  description: string;
  cultural_significance: string;
  recommended_dates: RecommendedDate[];
}

export interface FormInput {
  text: string;
  who: string;
  when: string;
  prefecture?: string;
  city?: string;
}