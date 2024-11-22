import * as React from 'react';

export interface Place {  // export を追加
  name: string;
  address: string;
  rating: number;
  userRatingsTotal: number;
  location: {
    lat: number;
    lng: number;
  };
  placeId: string;
  types: string[];
  openNow?: boolean;
  photos?: Array<{
    reference: string;
    width: number;
    height: number;
  }>;
}

interface SearchResult {
  success: boolean;
  places: Place[];
  searchInfo: {
    location: string;
    coordinates: {
      lat: number;
      lon: number;
    };
    keyword: string;
  };
}

interface UsePlace {
  searchPlaces: (prefecture: string, city: string, keyword: string) => Promise<SearchResult>;
  places: Place[];
  isLoading: boolean;
  error: string | null;
  searchInfo: SearchResult['searchInfo'] | null;
  resetPlaces: () => void;
}

export const usePlace = (): UsePlace => {
  const [places, setPlaces] = React.useState<Place[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchInfo, setSearchInfo] = React.useState<SearchResult['searchInfo'] | null>(null);

  const searchPlaces = async (prefecture: string, city: string, keyword: string): Promise<SearchResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const encodedPrefecture = encodeURIComponent(prefecture);
      const encodedCity = encodeURIComponent(city);
      const encodedKeyword = encodeURIComponent(keyword);
      
      const response = await fetch(
        `https://searchplaces-cti2s6vveq-an.a.run.app?prefecture=${encodedPrefecture}&city=${encodedCity}&keyword=${encodedKeyword}`
      );

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setPlaces(result.places);
        setSearchInfo(result.searchInfo);
      } else {
        throw new Error(result.error || '検索に失敗しました');
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
      setPlaces([]);
      setSearchInfo(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPlaces = () => {
    setPlaces([]);
    setIsLoading(false);
    setError(null);
    setSearchInfo(null);
  }

  return {
    searchPlaces,
    resetPlaces,
    places,
    isLoading,
    error,
    searchInfo
  };
};
