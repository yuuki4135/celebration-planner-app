import * as React from 'react'

interface ApiResponse {
  message: string;
  schedule: Schedule[];
  ready: string[];
  events: Event[];
  items: string[];
  error: string | null;
}

interface Schedule {
  date: string;
  reason: string;
}

interface Event {
  name: string;
  description: string;
}

interface FormInput {
  text: string;
  who: string;
  when: string;
}

export const useGemini = () => {
  const [checkCelebrationError, setCheckCelebrationError] = React.useState<boolean>(false)
  const [response, setResponse] = React.useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [showResults, setShowResults] = React.useState<boolean>(false);

  const checkCelebration = async (text: string) => {
    const ex_query = new URLSearchParams({ text: text })
    fetch('https://iscelebration-cti2s6vveq-uc.a.run.app?' + ex_query, {
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

      const response = await fetch(`https://askcelebration-cti2s6vveq-uc.a.run.app?${params}`, {
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

  const fetchItemDetail = async (text: string) => {
    try {
      const response = await fetch(
        `https://itemsdetail-cti2s6vveq-uc.a.run.app?text=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching item details:', error);
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
  }
}
