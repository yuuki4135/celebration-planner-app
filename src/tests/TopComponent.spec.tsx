import * as React from "react";
import { Top } from "@/components/pages/top";
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Router, Route, Routes } from 'react-router-dom';
import userEvent from "@testing-library/user-event";
import { ChakraProvider } from "@chakra-ui/react";

// matchMediaのモック設定
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {},
    addEventListener: function() {},
    removeEventListener: function() {},
    dispatchEvent: function() {},
    media: '',
    onchange: null,
  };
};

const renderWithChakra = (ui: React.ReactElement) => {
  return render(
    <ChakraProvider>{ui}</ChakraProvider>
  );
};

// モックの修正・追加
const mockFetchCelebrationPlan = jest.fn();
const mockFetchReadyDetail = jest.fn().mockImplementation(async (celebration, item) => {
  return {
    title: "ケーキの予約",
    overview: "誕生日ケーキの予約に関する詳細情報",
    timeline: "2週間前までに予約",
    steps: [
      {
        step: "1. ケーキ店の選定",
        description: "好みに合うケーキ店を探す",
        duration: "1日",
        tips: ["口コミを確認", "アレルギー対応可能か確認"]
      }
    ],
    required_items: ["予約金", "注文書"],
    estimated_cost: "3,000円〜5,000円",
    considerations: ["サイズの確認", "デリバリー可能か確認"]
  };
});
const mockFetchItemDetail = jest.fn().mockImplementation(async (celebration, item) => {
  return {
    categories: [
      {
        name: "基本アイテム",
        items: [
          {
            name: "誕生日ケーキ",
            description: "お祝い用の特製ケーキ",
            estimated_budget: "3,000円〜5,000円",
            when_to_prepare: "2-3日前",
            notes: "アレルギー対応の確認が必要",
            recommendations: "地域の有名店で予約がおすすめ"
          }
        ]
      }
    ],
    total_budget_estimate: "5,000円〜10,000円"
  };
});
const mockFetchRelatedItems = jest.fn().mockImplementation(async (keyword) => {
  return [
    {
      itemName: "誕生日ケーキ 苺のショートケーキ",
      itemPrice: 3500,
      itemUrl: "https://example.com/cake1",
      imageUrl: "https://example.com/cake1.jpg",
      shopName: "ケーキ工房ABC",
      reviewAverage: 4.5
    },
    {
      itemName: "誕生日ケーキ チョコレートケーキ",
      itemPrice: 4000,
      itemUrl: "https://example.com/cake2",
      imageUrl: "https://example.com/cake2.jpg",
      shopName: "スイーツショップXYZ",
      reviewAverage: 4.2
    }
  ];
});

const mockFetchEventDetail = jest.fn().mockImplementation(async ({ celebration, event, prefecture, city }) => {
  return {
    eventDetails: {
      name: "バースデーパーティー",
      description: "誕生日を祝うためのパーティー",
      cultural_significance: "誕生日を祝う重要な行事",
      recommended_dates: [
        {
          date: "2024-03-15",
          time_slots: [
            {
              start_time: "12:00",
              end_time: "15:00",
              reason: "ランチタイムが最適"
            }
          ],
          reason: "週末で集まりやすい",
          is_holiday: false,
          considerations: "予約は早めに"
        }
      ],
      venue_suggestions: [
        {
          type: "レストラン",
          recommendations: ["ファミリーレストラン", "ホテルレストラン"],
          considerations: "個室の確認が必要"
        }
      ],
      estimated_budget: {
        min: "30,000円",
        max: "50,000円",
        breakdown: [
          {
            item: "会場費",
            amount: "20,000円"
          }
        ]
      },
      required_preparations: [
        {
          task: "会場予約",
          timeline: "1ヶ月前",
          details: "人数確認して予約"
        }
      ],
      participants: {
        required: ["家族"],
        optional: ["友人"],
        roles: [
          {
            role: "幹事",
            responsibility: "準備の取りまとめ"
          }
        ]
      },
      customs_and_etiquette: [
        {
          custom: "サプライズ演出",
          description: "ケーキと共にお祝い"
        }
      ]
    }
  };
});

const mockSearchPlaces = jest.fn().mockImplementation(async (prefecture, city, keyword) => {
  return {
    places: [
      {
        name: "レストランABC",
        address: "東京都渋谷区渋谷1-1-1",
        rating: 4.5,
        userRatingsTotal: 100,
        location: {
          lat: 35.6585805,
          lng: 139.7454329
        },
        placeId: "ChIJ123456789",
        types: ["restaurant", "food"],
        openNow: true,
        photos: [{
          reference: "photo_reference",
          width: 400,
          height: 300
        }]
      }
    ],
    searchInfo: {
      location: "東京都渋谷区",
      coordinates: {
        lat: 35.6585805,
        lon: 139.7454329
      },
      keyword: "レストラン"
    }
  };
});

jest.mock('@/hooks/useGemini', () => ({
  useGemini: () => ({
    fetchCelebrationPlan: mockFetchCelebrationPlan.mockImplementation(async (data) => {
      if (!data.text || !data.who) {
        return {
          error: 'Required fields missing',
          message: '',
          schedule: [],
          ready: [],
          events: [],
          items: []
        };
      }
      return {
        message: "お誕生日おめでとうございます！",
        schedule: [],
        ready: ["ケーキの予約", "プレゼントの準備"],
        events: ["バースデーパーティー"],
        items: ["ケーキ", "プレゼント"],
        error: null
      };
    }),
    fetchReadyDetail: mockFetchReadyDetail,
    fetchItemDetail: mockFetchItemDetail,
    fetchRelatedItems: mockFetchRelatedItems,
    fetchEventDetail: mockFetchEventDetail,
    isLoading: false,
    showResults: true,
    response: {
      message: "お誕生日おめでとうございます！",
      schedule: [],
      ready: ["ケーキの予約", "プレゼントの準備"],
      events: ["バースデーパーティー"],
      items: ["ケーキ", "プレゼント"],
      error: null
    }
  })
}));

// usePlaceのモックを修正
jest.mock('@/hooks/usePlace', () => ({
  usePlace: () => ({
    searchPlaces: mockSearchPlaces,
    places: [
      {
        name: "レストランABC",
        address: "東京都渋谷区渋谷1-1-1",
        rating: 4.5,
        userRatingsTotal: 100,
        location: {
          lat: 35.6585805,
          lng: 139.7454329
        },
        placeId: "ChIJ123456789",
        types: ["restaurant", "food"],
        openNow: true,
        photos: [{
          reference: "photo_reference",
          width: 400,
          height: 300
        }]
      }
    ],
    isLoading: false,
    error: null,
    searchInfo: {
      location: "東京都渋谷区",
      coordinates: {
        lat: 35.6585805,
        lon: 139.7454329
      },
      keyword: "レストラン"
    },
    resetPlaces: jest.fn() // resetPlacesを追加
  })
}));

// test関連のモックを追加
jest.mock('@/utils/calendar', () => ({
  createGoogleCalendarUrl: jest.fn(),
  createYahooCalendarUrl: jest.fn(),
  createICSFile: jest.fn().mockReturnValue('mock-ics-url'),
}));

describe("お祝い事入力画面", () => {
  beforeEach(() => {
    mockFetchCelebrationPlan.mockClear();
  });

  it("タイトルが表示されること", async () => {
    await act(async() => {
      renderWithChakra(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Top />} />
          </Routes>
        </MemoryRouter>
      );
    });
    expect(screen.getByText("🎉 お祝い事プランナー")).toBeInTheDocument();
  });

  it("お祝い事入力フォームは必須のエラーが表示されること", async () => {
    await act(async() => {
      renderWithChakra(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Top />} />
          </Routes>
        </MemoryRouter>
      );
    });
    userEvent.click(screen.getByRole("button", { name: "プランを作成" }));
    await waitFor(() => {
      expect(screen.getByText("お祝い事を入力してください")).toBeInTheDocument();
    });
  });

  it("誰のためのお祝い？は必須のエラーが表示されること", async () => {
    await act(async() => {
      renderWithChakra(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Top />} />
          </Routes>
        </MemoryRouter>
      );
    });
    userEvent.click(screen.getByRole("button", { name: "プランを作成" }));
    await waitFor(() => {
      expect(screen.getByText("誰のためのお祝いか入力してください")).toBeInTheDocument();
    });
  });
  it("お祝い事入力フォームと誰のためのお祝い？を入力し、プランを作成ボタンをクリックすると提案内容が表示されること", async () => {
    await act(async() => {
      renderWithChakra(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Top />} />
          </Routes>
        </MemoryRouter>
      );
    });

    const user = userEvent.setup();
    
    await act(async () => {
      const celebration = screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い");
      const who = screen.getByPlaceholderText("例: 娘、息子、恋人");
      await user.type(celebration, "誕生日");
      await user.type(who, "娘");
      await user.click(screen.getByRole("button", { name: "プランを作成" }));
    });

    await waitFor(async () => {
      expect(screen.getByText("概要", { exact: false })).toBeInTheDocument();
      expect(screen.getByText("準備リスト", { exact: false })).toBeInTheDocument();
      expect(screen.getByText("準備物リスト", { exact: false })).toBeInTheDocument();
      expect(screen.getByText("関連イベント", { exact: false })).toBeInTheDocument();
      expect(screen.getByText("推奨日程", { exact: false })).toBeInTheDocument();
    });
  });

  it("fetchCelebrationPlanが正しい引数で呼び出されること", async () => {
    renderWithChakra(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Top />} />
        </Routes>
      </MemoryRouter>
    );

    const celebration = screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い");
    const who = screen.getByPlaceholderText("例: 娘、息子、恋人");

    await act(async () => {
      await userEvent.type(celebration, "誕生日");
      await userEvent.type(who, "娘");
      await userEvent.click(screen.getByRole("button", { name: "プランを作成" }));
    });

    await waitFor(() => {
      expect(mockFetchCelebrationPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "誕生日",
          who: "娘"
        })
      );
    });
  });
});

describe("準備リストの詳細", () => {
  beforeEach(() => {
    mockFetchCelebrationPlan.mockClear();
    mockFetchReadyDetail.mockClear();
  });

  it("モーダルが表示され、内容が表示されること", async () => {
    const user = userEvent.setup()
    
    renderWithChakra(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Top />} />
        </Routes>
      </MemoryRouter>
    );

    // フォームに入力してプラン作成
    await act(async () => {
      const celebration = screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い");
      const who = screen.getByPlaceholderText("例: 娘、息子、恋人");
      await user.type(celebration, "誕生日");
      await user.type(who, "娘");
      await user.click(screen.getByRole("button", { name: "プランを作成" }));
    });

    // 準備リストの項目をクリック
    await waitFor(() => {
      const readyListItem = screen.getByText("ケーキの予約");
      user.click(readyListItem);
    });

    // モーダルの内容を検証
    await waitFor(() => {
      expect(mockFetchReadyDetail).toHaveBeenCalledWith("誕生日", "ケーキの予約");
      expect(screen.getByText("誕生日ケーキの予約に関する詳細情報")).toBeInTheDocument();
      expect(screen.getByText("2週間前までに予約")).toBeInTheDocument();
      expect(screen.getByText("1. ケーキ店の選定")).toBeInTheDocument();
      expect(screen.getByText("3,000円〜5,000円")).toBeInTheDocument();
    });
  });

  it("モーダルが表示され、内容が表示されること、モーダルを閉じるボタンが機能していること", async () => {
    renderWithChakra(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Top />} />
        </Routes>
      </MemoryRouter>
    );

    const celebration = screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い");
    const who = screen.getByPlaceholderText("例: 娘、息子、恋人");

    await act(async () => {
      await userEvent.type(celebration, "誕生日");
      await userEvent.type(who, "娘");
      await userEvent.click(screen.getByRole("button", { name: "プランを作成" }));
    });

    await waitFor(async () => {
      await userEvent.click(screen.getByText("ケーキの予約"));
    });
    await waitFor(() => {
      expect(screen.getByText("誕生日ケーキの予約に関する詳細情報")).toBeInTheDocument();
      expect(screen.getByText("2週間前までに予約")).toBeInTheDocument();
      expect(screen.getByText("1. ケーキ店の選定")).toBeInTheDocument();
      expect(screen.getByText("3,000円〜5,000円")).toBeInTheDocument();
    });

    await waitFor(async () => {
      await userEvent.click(screen.getByRole("button", { name: "閉じる" }));
    });

    await waitFor(() => {
      expect(screen.queryByText("誕生日ケーキの予約に関する詳細情報")).not.toBeInTheDocument();
    });
  });
});

describe("準備物リストの詳細", () => {
  beforeEach(() => {
    mockFetchCelebrationPlan.mockClear();
    mockFetchItemDetail.mockClear();
    mockFetchRelatedItems.mockClear();
  });

  it("モーダルが表示され、内容が表示されること", async () => {
    const user = userEvent.setup();
    
    renderWithChakra(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Top />} />
        </Routes>
      </MemoryRouter>
    );

    // フォームに入力してプラン作成
    await act(async () => {
      const celebration = screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い");
      const who = screen.getByPlaceholderText("例: 娘、息子、恋人");
      await user.type(celebration, "誕生日");
      await user.type(who, "娘");
      await user.click(screen.getByRole("button", { name: "プランを作成" }));
    });

    // 準備物リストの項目をクリック
    await waitFor(() => {
      const itemListItem = screen.getByText("ケーキ");
      user.click(itemListItem);
    });

    // モーダルの内容を検証
    await waitFor(() => {
      expect(mockFetchItemDetail).toHaveBeenCalledWith("誕生日", "ケーキ");
      expect(screen.getByText("基本アイテム")).toBeInTheDocument();
      expect(screen.getByText("誕生日ケーキ")).toBeInTheDocument();
      expect(screen.getByText("お祝い用の特製ケーキ")).toBeInTheDocument();
      expect(screen.getByText("3,000円〜5,000円")).toBeInTheDocument();
      expect(screen.getByText("5,000円〜10,000円")).toBeInTheDocument();
    });
  });

  it("モーダルを閉じるボタンが機能していること", async () => {
    const user = userEvent.setup();
    renderWithChakra(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Top />} />
        </Routes>
      </MemoryRouter>
    );

    // フォーム入力とプラン作成
    await act(async () => {
      await user.type(screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い"), "誕生日");
      await user.type(screen.getByPlaceholderText("例: 娘、息子、恋人"), "娘");
      await user.click(screen.getByRole("button", { name: "プランを作成" }));
    });

    // アイテムをクリック
    const itemLink = await screen.findByText("ケーキ");
    await user.click(itemLink);

    // モーダルの内容を確認
    await waitFor(() => {
      expect(screen.getByText("基本アイテム")).toBeInTheDocument();
    });

    // モーダルを閉じる
    const closeButton = screen.getByRole("button", { name: "閉じる" });
    await user.click(closeButton);

    // モーダルが閉じたことを確認
    await waitFor(() => {
      expect(screen.queryByText("基本アイテム")).not.toBeInTheDocument();
    });
  }, 10000);

  it("関連商品の検索が機能すること", async () => {
    const user = userEvent.setup();
    
    renderWithChakra(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Top />} />
        </Routes>
      </MemoryRouter>
    );

    // フォームに入力してプラン作成
    await act(async () => {
      const celebration = screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い");
      const who = screen.getByPlaceholderText("例: 娘、息子、恋人");
      await user.type(celebration, "誕生日");
      await user.type(who, "娘");
      await user.click(screen.getByRole("button", { name: "プランを作成" }));
    });

    // 準備物リストの項目をクリック
    await waitFor(async () => {
      const itemListItem = screen.getByText("ケーキ");
      await user.click(itemListItem);
    });

    // 商品を検索ボタンをクリック
    await waitFor(async () => {
      const searchButton = screen.getByTestId("search-item-0")
      await user.click(searchButton);
    });

    // 関連商品の検索結果を検証
    await waitFor(async () => {
      expect(screen.getByText("誕生日ケーキ 苺のショートケーキ")).toBeInTheDocument();
    });
  });
});

// モーダルのテストケースを修正
describe("関連イベントの詳細", () => {
  beforeEach(() => {
    mockFetchCelebrationPlan.mockClear();
    mockFetchEventDetail.mockClear();
  });

  it("モーダルが表示され、内容が表示されること", async () => {
    const user = userEvent.setup();
    
    renderWithChakra(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Top />} />
        </Routes>
      </MemoryRouter>
    );

    // フォームに入力してプラン作成
    await act(async () => {
      await user.type(screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い"), "誕生日");
      await user.type(screen.getByPlaceholderText("例: 娘、息子、恋人"), "娘");
      await user.click(screen.getByRole("button", { name: "プランを作成" }));
    });

    // イベントアイテムが表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByText("バースデーパーティー")).toBeInTheDocument();
    });

    // イベントをクリック
    await user.click(screen.getByText("バースデーパーティー"));

    // モーダルの内容を確認
    await waitFor(() => {
      expect(mockFetchEventDetail).toHaveBeenCalled();
      expect(screen.getByText("誕生日を祝うためのパーティー")).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  // 他のテストケースも同様に修正...（以下同じパターンで修正）
});

describe("関連イベントの詳細", () => {
  beforeEach(() => {
    mockFetchCelebrationPlan.mockClear();
    mockFetchEventDetail.mockClear();
  });

  it("モーダルが表示され、内容が表示されること", async () => {
    const user = userEvent.setup();
    
    renderWithChakra(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Top />} />
        </Routes>
      </MemoryRouter>
    );

    // フォームに入力してプラン作成
    await act(async () => {
      const celebration = screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い");
      const who = screen.getByPlaceholderText("例: 娘、息子、恋人");
      await user.type(celebration, "誕生日");
      await user.type(who, "娘");
      await user.click(screen.getByRole("button", { name: "プランを作成" }));
    });

    // 関連イベントの項目をクリック
    await waitFor(async () => {
      const eventItem = screen.getByText("バースデーパーティー");
      await user.click(eventItem);
    });

    // モーダルの内容を検証
    await waitFor(() => {
      expect(screen.getByText("誕生日を祝うためのパーティー")).toBeInTheDocument();
    });
  });

  it("モーダルを閉じるボタンが機能していること", async () => {
    renderWithChakra(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Top />} />
        </Routes>
      </MemoryRouter>
    );

    const celebration = screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い");
    const who = screen.getByPlaceholderText("例: 娘、息子、恋人");

    await act(async () => {
      await userEvent.type(celebration, "誕生日");
      await userEvent.type(who, "娘");
      await userEvent.click(screen.getByRole("button", { name: "プランを作成" }));
    });

    await waitFor(async () => {
      await userEvent.click(screen.getByText("バースデーパーティー"));
    });
    await waitFor(() => {
      expect(screen.getByText("誕生日を祝うためのパーティー")).toBeInTheDocument();
    });

    await waitFor(async () => {
      await userEvent.click(screen.getByRole("button", { name: "閉じる" }));
    });

    // 閉じた後の状態確認を修正
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("都道府県・市名が入っていれば周辺のお店を検索ボタンが表示されること", async () => {
    const user = userEvent.setup();
    
    renderWithChakra(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Top />} />
        </Routes>
      </MemoryRouter>
    );

    // フォームに入力
    const celebration = screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い");
    const who = screen.getByPlaceholderText("例: 娘、息子、恋人");
    const prefecture = screen.getByTestId("prefecture");
    const city = screen.getByTestId("city");

    // 各フィールドに順番に入力
    await user.type(celebration, "誕生日");
    await user.type(who, "娘");
    await user.selectOptions(prefecture, "東京都");
    await user.type(city, "渋谷区");

    // プラン作成ボタンをクリック
    await user.click(screen.getByRole("button", { name: "プランを作成" }));

    // 結果が表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByText("バースデーパーティー")).toBeInTheDocument();
    });

    // イベントをクリック
    const eventItem = screen.getByText("バースデーパーティー");
    await user.click(eventItem);

    // 検索ボタンが表示されるのを待つ
    await waitFor(() => {
      const searchButton = screen.getByRole("button", { name: "周辺のお店を検索" });
      expect(searchButton).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it("周辺のお店を検索ボタンを押せば情報が表示されること", async () => {
    const user = userEvent.setup();
    
    renderWithChakra(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Top />} />
        </Routes>
      </MemoryRouter>
    );

    // フォームに入力してプラン作成
    await act(async () => {
      const celebration = screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い");
      const who = screen.getByPlaceholderText("例: 娘、息子、恋人");
      const prefecture = screen.getByTestId("prefecture");
      const city = screen.getByTestId("city");
      
      await user.type(celebration, "誕生日");
      await user.type(who, "娘");
      await user.selectOptions(prefecture, "東京都");
      await user.type(city, "渋谷区");
      await user.click(screen.getByRole("button", { name: "プランを作成" }));
    });

    // 関連イベントの項目が表示されるのを待つ
    await waitFor(async () => {
      const eventItem = screen.getByText("バースデーパーティー");
      await user.click(eventItem);
    });

    // モーダルとボタンが表示されるのを待つ
    const searchButton = await screen.findByRole("button", { name: "周辺のお店を検索" });
    
    // ボタンをクリック
    await user.click(searchButton);

    // 検索結果が表示されることを確認
    await waitFor(() => {
      expect(mockSearchPlaces).toHaveBeenCalledWith("東京都", "渋谷区", "バースデーパーティー");
      expect(screen.getByTestId('place-name-0')).toHaveTextContent('レストランABC');
      expect(screen.getByTestId('place-address-0')).toHaveTextContent('東京都渋谷区渋谷1-1-1');
    });
  });
});

// 関連イベントの詳細のテストケースを修正
describe("関連イベントの詳細", () => {
  beforeEach(() => {
    mockFetchCelebrationPlan.mockClear();
    mockFetchEventDetail.mockClear();
  });

  it("モーダルが表示され、内容が表示されること", async () => {
    const user = userEvent.setup();
    
    renderWithChakra(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Top />} />
        </Routes>
      </MemoryRouter>
    );

    // フォーム入力とプラン作成
    await act(async () => {
      await user.type(screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い"), "誕生日");
      await user.type(screen.getByPlaceholderText("例: 娘、息子、恋人"), "娘");
      await user.click(screen.getByRole("button", { name: "プランを作成" }));
    });

    // イベントが表示されるのを待つ
    const eventButton = await screen.findByText("バースデーパーティー", {}, { timeout: 10000 });
    await user.click(eventButton);

    // モーダルの内容を確認
    const eventDescription = await screen.findByText("誕生日を祝うためのパーティー", {}, { timeout: 10000 });
    expect(eventDescription).toBeInTheDocument();
  }, 15000); // タイムアウトを15秒に設定

  it("都道府県・市名が入っていれば周辺のお店を検索ボタンが表示されること", async () => {
    const user = userEvent.setup();
    
    renderWithChakra(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Top />} />
        </Routes>
      </MemoryRouter>
    );

    // フォーム入力
    await act(async () => {
      await user.type(screen.getByPlaceholderText("例: 結婚式、誕生日、出産祝い"), "誕生日");
      await user.type(screen.getByPlaceholderText("例: 娘、息子、恋人"), "娘");
      await user.selectOptions(screen.getByTestId("prefecture"), "東京都");
      await user.type(screen.getByTestId("city"), "渋谷区");
      await user.click(screen.getByRole("button", { name: "プランを作成" }));
    });

    // イベントが表示されるのを待つ
    const eventButton = await screen.findByText("バースデーパーティー", {}, { timeout: 10000 });
    await user.click(eventButton);

    // 検索ボタンが表示されるのを確認
    const searchButton = await screen.findByRole("button", { name: "周辺のお店を検索" }, { timeout: 10000 });
    expect(searchButton).toBeInTheDocument();
  }, 15000);

  // 他のテストケースも同様に修正...
});
