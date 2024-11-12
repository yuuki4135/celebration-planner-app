import * as React from 'react'

interface ApiResponse {
  message: string;
  schedule: Schedule[];
  ready: string[];
  events: string[]; // 文字列の配列に変更
  items: string[];
  error: string | null;
}

interface Schedule {
  date: string;
  reason: string;
}

interface FormInput {
  text: string;
  who: string;
  when: string;
}

interface ItemDetail {
  name: string;
  description: string;
  estimated_budget: string;
  when_to_prepare: string;
  notes: string;
  recommendations: string;
}

interface EventDetail {
  name: string;
  description: string;
  cultural_significance: string;
  recommended_dates: Array<{
    date: string;
    time_slots: Array<{
      start_time: string;
      end_time: string;
      reason: string;
    }>;
    reason: string;
    is_holiday: boolean;
    considerations: string;
  }>;
  venue_suggestions: Array<{
    type: string;
    recommendations: string[];
    considerations: string;
  }>;
  estimated_budget: {
    min: string;
    max: string;
    breakdown: Array<{
      item: string;
      amount: string;
    }>;
  };
  required_preparations: Array<{
    task: string;
    timeline: string;
    details: string;
  }>;
  participants: {
    required: string[];
    optional: string[];
    roles: Array<{
      role: string;
      responsibility: string;
    }>;
  };
  customs_and_etiquette: Array<{
    custom: string;
    description: string;
  }>;
}

interface fetchEventDetailInput {
  celebration: string;
  event: string;
  prefecture?: string;
  city?: string;
}

export const useGemini = () => {
  const [checkCelebrationError, setCheckCelebrationError] = React.useState<boolean>(false)
  const [response, setResponse] = React.useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [showResults, setShowResults] = React.useState<boolean>(false);

  const checkCelebration = async (text: string) => {
    const ex_query = new URLSearchParams({ text: text })
    fetch('https://iscelebration-cti2s6vveq-an.a.run.app?' + ex_query, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(response => {
      return response.json()
    }).then(data => {
      if('check' in data) setCheckCelebrationError(!data.check)
    }).catch(error => {
      console.error(error)
    })
  }

  const fetchCelebrationPlan = async (formData: FormInput): Promise<ApiResponse> => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        text: formData.text,
        who: formData.who,
        ...(formData.when && { when: formData.when })
      });

      const response = await fetch(`https://askcelebration-cti2s6vveq-an.a.run.app?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('APIリクエストに失敗しました');
      }

      const data: ApiResponse = await response.json();
      if(formData.when != '') data.schedule = []
      setResponse(data);
      setShowResults(true);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItemDetail = async (inputCelebration: string, text: string) => {
    try {
      const params = new URLSearchParams({ celebration: inputCelebration, text: text });
      const response = await fetch(
        `https://itemsdetail-cti2s6vveq-an.a.run.app?${params}`,
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching item details:', error);
      throw error;
    }
  }

  const fetchEventDetail = async ({ celebration, event, prefecture, city }: fetchEventDetailInput) => {
    try {
      const params = new URLSearchParams({ celebration, event });
      const response = await fetch(
        `https://eventdetail-cti2s6vveq-an.a.run.app?${params}`,
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching event details:', error);
      throw error;
    }
  }

  const fetchReadyDetail = async (inputCelebration: string, text: string) => {
    try {
      const params = new URLSearchParams({ celebration: inputCelebration, text: text });
      const response = await fetch(
        `https://readydetail-cti2s6vveq-an.a.run.app?${params}`,
      );
      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.error('Error fetching ready details:', error);
      throw error;
    }
  }

  const fetchRelatedItems = async (keyword: string) => {
    try {
      const params = new URLSearchParams({ keyword });
      const response = await fetch(
        `https://searchrelateditems-cti2s6vveq-an.a.run.app?${params}`,
      );
      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error('Error fetching related items:', error);
      throw error;
    }
  }

  return {
    checkCelebration,
    checkCelebrationError,
    response,
    isLoading,
    showResults,
    fetchCelebrationPlan,
    fetchItemDetail,
    fetchEventDetail,
    fetchReadyDetail,
    fetchRelatedItems
  }
}
