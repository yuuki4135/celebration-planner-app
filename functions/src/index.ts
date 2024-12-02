import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {setGlobalOptions} from "firebase-functions/v2";
setGlobalOptions({
  region: "asia-northeast1",
});

import { Request, Response } from "express";

require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const allowDomain = process.env.ALLOW_DOMAIN

const fetch = require('node-fetch');
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// 地域の緯度経度を取得する関数を修正
async function getLocationCoordinates(prefecture: string, city: string) {
  try {
    const query = `${prefecture}${city}`;
    const GOOGLE_GEOCODING_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&region=jp&language=ja&key=${GOOGLE_GEOCODING_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results[0]) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lon: location.lng
      };
    }
    
    throw new Error('住所の座標を取得できませんでした');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

// getWeatherForecast関数を更新
async function getWeatherForecast(date: string, prefecture: string, city: string) {
  try {
    const { lat, lon } = await getLocationCoordinates(prefecture, city);
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const data = await response.json();
    
    // 指定された日付の天気予報を探す
    const targetDate = new Date(date);
    const forecast = data.list.find((item: any) => {
      const itemDate = new Date(item.dt * 1000);
      return itemDate.toDateString() === targetDate.toDateString();
    });

    if (forecast) {
      return {
        temp: Math.round(forecast.main.temp),
        weather: forecast.weather[0].main,
        description: forecast.weather[0].description,
        probability: Math.round(forecast.pop * 100)
      };
    }
    return null;
  } catch (error) {
    console.error('Weather forecast error:', error);
    return null;
  }
}

async function gemini(prompt: string){
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash-8b",
    generation_config: {"response_mime_type": "application/json"}
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

const jsonReplace = (str: string) => {
  return str.replace('JSON', '').replace('json', '').replace('```', '').replace('```', '');
}

const createPrompt = (text: string, who: string, when: string | null, weatherData: any[]): string => {
  const weatherInstruction = weatherData.length > 0
    ? `\n天気予報情報も考慮して提案してください：\n${
        weatherData
          .filter(w => w.forecast)
          .map(w => `${w.date}: 気温${w.forecast.temp}℃、${w.forecast.description}、降水確率${w.forecast.probability}%`)
          .join('\n')
      }`
    : '';

  const scheduleInstruction = when 
    ? `日程は${when}の予定です。scheduleキーは空の配列[]を返してください。` 
    : `日程は未定です。以下の期間で3～5個の候補日を提案してください:
     - 開始日: ${new Date().toISOString().split('T')[0]}
     - 終了日: ${new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
      ${weatherInstruction}
       
       "schedule": [
         { 
           "date": "2024-05-01", 
           "reason": "具体的な理由（季節/天候/暦/慣習など）"
           ${weatherData.length > 0 ? `,
           "weather": {
             "temp": "予想気温",
             "description": "天気予報",
             "probability": "降水確率"
           }` : ''}
         }
       ]`;

  return `
  あなたは日本のお祝い事のプランニングエキスパートです。
  「${text}」の準備プランを提案してください。
  ${who}のお祝いに参加する自分の立場に立って準備物やイベントを提案してください。

  ${scheduleInstruction}

  以下の形式で、JSON形式の返答のみを返してください：

  {
    "message": "お祝いの概要や全体的なアドバイスを記載",
    "schedule": [
      {
        "date": "YYYY-MM-DD形式の日付",
        "reason": "その日を選んだ理由"
      }
    ],
    "ready": [
      "必要な準備項目1",
      "必要な準備項目2"
    ],
    "items": [
      "準備物1",
      "準備物2"
    ],
    "events": [
      "結納",
      "前撮り",
      // ...他のイベント
    ],
    "error": null
  }

  注意事項：
  1. 必ず有効なJSON形式で返答してください
  2. 日付はYYYY-MM-DD形式で指定してください
  3. ${who}のお祝いに参加する自分の立場に立って提案してください
  4. eventsには「${text}」は含めないでください。${text}に関連する前後のイベントや付随するイベントの名前のみを列挙してください
  5. eventsの例：
     - 「結婚式」の場合 → ["結納", "前撮り", "披露宴", "二次会"]
     - 「誕生日」の場合 → ["前祝い", "当日パーティー", "記念写真撮影"]
     - "出産祝い"の場合 → ["お宮参り", "お食い初め", "ベビーシャワー"]
  6. readyは具体的な準備項目で考えられるものを全て列挙してください。最低5つ以上
  7. itemsは具体的な準備物で考えられるものを全て列挙してください。最低5つ以上
  8. messageは100文字以上で具体的なアドバイスを含めてください
  9. エラーがない場合、errorはnullとしてください
  10. eventsは最低5つ以上最高30個のイベントを提案してください
  11. イベントの説明は具体的な内容と意味を含めてください
  12. readyの準備項目は時系列順に並べてください 

  例えば「結婚式」の場合：
  - ready: ["会場の下見", "招待状の準備", "衣装の選定"]のように具体的に
  - items: 必要な準備物を具体的に列挙してください・身に着けるもの・持っていくもの・事前に準備するもの全てを含める
  - events: ["結納", "前撮り", "披露宴", "二次会"]のようにイベント名のみを列挙
  - schedule: 日取りの候補と理由を明確に
  - message: お祝いの意味や準備のポイントを具体的に

  返答は必ずこのJSON形式のみとし、追加の説明や会話は含めないでください。`;
};

export const AskCelebration = onRequest(async (request: Request, response: Response) => {
  response.set('Access-Control-Allow-Origin', allowDomain); // localhostを許可
  response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST'); // DELETEだけは拒否
  response.set('Access-Control-Allow-Headers', 'Content-Type'); 
  try {
    const text = String(request.query.text) || '';
    const who = String(request.query.who) || '';
    const when = request.query?.when ? String(request.query.when) : null;
    const prefecture = request.query.prefecture ? String(request.query.prefecture) : null;
    const city = request.query.city ? String(request.query.city) : null;

    // 地域情報が両方ある場合のみ天気予報を取得
    let weatherData: { date: string; forecast: any }[] = [];
    if (prefecture && city) {
      const dates = Array.from({length: 5}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date.toISOString().split('T')[0];
      });

      weatherData = await Promise.all(
        dates.map(async (date) => ({
          date,
          forecast: await getWeatherForecast(date, prefecture, city)
        }))
      );
    }

    const prompt = createPrompt(text, who, when, weatherData);
    const result = await gemini(prompt);
    const decoded = jsonReplace(result);
    const parsed = JSON.parse(decoded);
    
    // 天気予報情報の追加（地域情報がある場合のみ）
    if (Array.isArray(parsed.schedule) && weatherData.length > 0) {
      parsed.schedule = parsed.schedule.map((item: any) => {
        const weatherInfo = weatherData.find(w => w.date === item.date)?.forecast;
        return {
          ...item,
          weather: weatherInfo || null
        };
      });
    }

    response.send(JSON.stringify(parsed));
  } catch (error: any) {
    response.send(JSON.stringify({
      message: "申し訳ありません、プランの生成中にエラーが発生しました。",
      schedule: [],
      ready: [],
      events: [],
      error: error.message
    }));
  }
});

export const isCelebration = onRequest(async (request: Request, response: Response) => {
  response.set('Access-Control-Allow-Origin', allowDomain); // localhostを許可
  response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST'); // DELETEだけは拒否
  response.set('Access-Control-Allow-Headers', 'Content-Type'); 
  logger.info("Hello logs!", {structuredData: true});
  const text = String(request.query.text) || '';
  const prompt = `お祝い事の判定を行います。${text}がお祝い事であるかどうかを判定してください。;
                  以下のJSONキーで返答してください。
                  { "check": boolean }`;
  const result = await gemini(prompt);
  const decoded = jsonReplace(result);
  response.send(decoded);
})

export const itemsDetail = onRequest(async (request: Request, response: Response) => {
  response.set('Access-Control-Allow-Origin', allowDomain);
  response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
  response.set('Access-Control-Allow-Headers', 'Content-Type'); 

  try {
    const text = String(request.query.text) || '';
    const celebration = String(request.query.celebration) || '';
    const prompt = `
    あなたは日本のお祝い事の準備アドバイザーです。
    ${celebration}の準備物として${text}に関する詳細情報を提供してください。
    日本の文化や風習、運気なども考慮して提案してください。

    以下のJSON形式で返答してください：

    {
      "categories": [
        {
          "name": "基本情報",
          "items": [
            {
              "name": "商品名や種類",
              "description": "詳細な説明",
              "estimated_budget": "予算の目安",
              "when_to_prepare": "準備時期の目安",
              "notes": "選び方のコツや注意点",
              "recommendations": "運気アップのポイントや縁起物としての意味、おすすめの理由など"
            }
          ]
        }
      ],
      "total_budget_estimate": "合計予算の目安"
    }

    注意事項：
    1. 予算は具体的な金額範囲で記載
    2. 品の種類や選択肢は複数提案
    3. 準備時期は具体的な時期を記載
    4. 選び方のコツは具体的なアドバイスを含める
    5. recommendationsには日本の文化や風習に基づいた運気アップのポイントや縁起物としての意味を含める
    6. 色や数字や方角などの縁起の良い選び方があれば含める
    `;

    const result = await gemini(prompt);
    const decoded = jsonReplace(result);
    response.send(decoded);
  } catch (error: any) {
    response.send(JSON.stringify({
      categories: [],
      total_budget_estimate: "",
      error: error.message
    }));
  }
});

// 日付バリデーション用のユーティリティ関数を追加
const getDateRange = () => {
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today.setMonth(today.getMonth() + 12)).toISOString().split('T')[0];
  return { startDate, endDate };
};

const getUpcomingWeekends = () => {
  const weekends = [];
  const today = new Date();
  const endDate = new Date(today.setMonth(today.getMonth() + 12));
  let current = new Date();

  while (current <= endDate) {
    if (current.getDay() === 0 || current.getDay() === 6) {
      weekends.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  return weekends;
};

export const eventDetail = onRequest(async (request: Request, response: Response) => {
  response.set('Access-Control-Allow-Origin', allowDomain);
  response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
  response.set('Access-Control-Allow-Headers', 'Content-Type'); 

  try {
    const eventName = String(request.query.event) || '';
    const celebration = String(request.query.celebration) || '';
    const prefecture = request.query.prefecture ? String(request.query.prefecture) : null;
    const city = request.query.city ? String(request.query.city) : null;
    const { startDate, endDate } = getDateRange();
    const weekends = getUpcomingWeekends();

    // 天気予報データの取得（地域情報がある場合のみ）
    let weatherData: { date: string; forecast: any }[] = [];
    if (prefecture && city) {
      const next14Days = Array.from({length: 14}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date.toISOString().split('T')[0];
      });

      weatherData = await Promise.all(
        next14Days.map(async (date) => ({
          date,
          forecast: await getWeatherForecast(date, prefecture, city)
        }))
      );
    }

    // 天気予報の情報をプロンプトに追加
    const weatherInfo = weatherData.length > 0
      ? `\n\n利用可能な天気予報情報：\n${
          weatherData
            .filter(w => w.forecast)
            .map(w => `${w.date}: 気温${w.forecast.temp}℃、${w.forecast.description}、降水確率${w.forecast.probability}%`)
            .join('\n')
        }\n\n天気予報も考慮して最適な日時を提案してください。`
      : '';

    const prompt = `
    あなたは日本のお祝い事の準備アドバイザーです。
    ${celebration}に関連するイベント「${eventName}」の詳細情報を提供してください。

    以下の期間で候補日を提案してください：
    - 開始日: ${startDate}
    - 終了日: ${endDate}
    
    土日祝日の候補：${weekends.slice(0, 10).join(', ')}など
    ${weatherInfo}

    以下のJSON形式で返答してください：
    {
      "eventDetails": {
        "name": "イベント名",
        "description": "イベントの詳細な説明",
        "cultural_significance": "文化的な意義や由来",
        "recommended_dates": [
          {
            "date": "YYYY-MM-DD",
            "time_slots": [
              {
                "start_time": "10:00",
                "end_time": "12:00",
                "reason": "この時間帯を推奨する理由（混雑状況/気温/光の具合/慣習など）"
              }
            ],
            "reason": "この日程を推奨する理由（季節/気候/意味/参加のしやすさなど）",
            "is_holiday": boolean,
            "considerations": "気候や混雑状況、準備に必要な期間なども含めた考慮事項"
          }
        ],
        "venue_suggestions": [
          {
            "type": "会場タイプ",
            "recommendations": ["具体的な場所の提案"],
            "considerations": "選定時の注意点"
          }
        ],
        "estimated_budget": {
          "min": "最小予算",
          "max": "最大予算",
          "breakdown": [
            {
              "item": "費用項目",
              "amount": "金額の目安"
            }
          ]
        },
        "required_preparations": [
          {
            "task": "準備タスク",
            "timeline": "実施時期",
            "details": "詳細説明"
          }
        ],
        "participants": {
          "required": ["必須参加者"],
          "optional": ["任意参加者"],
          "roles": [
            {
              "role": "役割名",
              "responsibility": "責任内容"
            }
          ]
        },
        "customs_and_etiquette": [
          {
            "custom": "慣習やマナー",
            "description": "説明"
          }
        ]
      }
    }

    注意事項：
    1. recommended_datesは必ず${startDate}から${endDate}までの期間で提案してください
    2. 土日祝日を優先して提案してください（上記の候補日を参考に）
    3. 各候補日について、季節・天候・混雑状況なども含めた具体的な理由を記載してください
    4. 提案する日付は最低3つ以上としてください
    5. is_holidayは土日祝日の場合はtrue、平日の場合はfalseとしてください
    6. 準備期間や参加者の都合も考慮して提案してください
    7. 縁起の良い日や記念日なども考慮してください
    8. 過去の日付は絶対に提案しないでください
    9. time_slotsは各日付に対して2つ以上の時間帯を提案してください
    10. 時間帯は季節による日照時間、交通の便、混雑状況、参加者の都合などを考慮してください
    11. 時間帯の理由は具体的に記載してください
    `;

    const result = await gemini(prompt);
    const decoded = jsonReplace(result);
    const data = JSON.parse(decoded);

    // レスポンスの日付を検証と天気予報情報の追加
    if (data.eventDetails?.recommended_dates) {
      const today = new Date().toISOString().split('T')[0];
      data.eventDetails.recommended_dates = data.eventDetails.recommended_dates
        .filter((d: { date: string }) => d.date > today)
        .sort((a: { date: string }, b: { date: string }) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((date: any) => {
          // 天気予報情報がある場合は追加
          const weatherInfo = weatherData.find(w => w.date === date.date)?.forecast;
          return {
            ...date,
            weather: weatherInfo || null
          };
        });
      
      // 提案された日付が少なすぎる場合の処理
      if (data.eventDetails.recommended_dates.length < 3) {
        const defaultWeekends = weekends.slice(0, 3).map(date => {
          const weatherInfo = weatherData.find(w => w.date === date)?.forecast;
          return {
            date,
            reason: "週末の予定が立てやすい日程として提案",
            is_holiday: true,
            considerations: "多くの参加者が参加しやすい週末の日程です",
            weather: weatherInfo || null,
            time_slots: [
              {
                start_time: "10:00",
                end_time: "12:00",
                reason: "午前中の時間帯で比較的参加しやすい時間"
              },
              {
                start_time: "14:00",
                end_time: "16:00",
                reason: "午後の時間帯で比較的参加しやすい時間"
              }
            ]
          };
        });
        data.eventDetails.recommended_dates = defaultWeekends;
      }
    }
    
    response.send(JSON.stringify(data));
  } catch (error: any) {
    response.send(JSON.stringify({
      error: error.message
    }));
  }
});

export const readyDetail = onRequest(async (request: Request, response: Response) => {
  response.set('Access-Control-Allow-Origin', allowDomain);
  response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
  response.set('Access-Control-Allow-Headers', 'Content-Type'); 

  try {
    const text = String(request.query.text) || '';
    const celebration = String(request.query.celebration) || '';

    const prompt = `
    あなたは日本のお祝い事の準備アドバイザーです。
    ${celebration}の準備項目として「${text}」に関する詳細情報を提供してください。

    以下のJSON形式で返答してください：

    {
      "title": "準備項目の名前",
      "overview": "準備の概要説明",
      "timeline": "準備開始から完了までの推奨タイムライン",
      "steps": [
        {
          "step": "手順のタイトル",
          "description": "詳細な手順の説明",
          "duration": "所要時間の目安",
          "tips": [
            "実行時のコツや注意点"
          ]
        }
      ],
      "required_items": [
        "必要な物品やサービス"
      ],
      "estimated_cost": "費用の目安",
      "considerations": [
        "準備を進める上での注意点や配慮事項"
      ]
    }

    注意事項：
    1. 手順は具体的で実行可能な内容にしてください
    2. 費用は具体的な金額範囲で記載してください
    3. タイムラインは具体的な期間や日数で記載してください
    4. 各ステップの所要時間は現実的な目安を提供してください
    5. 準備に必要な物品やサービスは漏れなく記載してください
    6. 日本の文化や慣習に配慮した内容を含めてください
    7. 初めての人でも理解できる詳しい説明を心がけてください
    `;

    const result = await gemini(prompt);
    const decoded = jsonReplace(result);
    response.send(decoded);
  } catch (error: any) {
    response.send(JSON.stringify({
      error: error.message
    }));
  }
});

// 楽天APIの型定義
interface RakutenItem {
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  imageUrl: string;
  shopName: string;
  reviewAverage: number;
}

export const searchRelatedItems = onRequest(async (request: Request, response: Response) => {
  response.set('Access-Control-Allow-Origin', allowDomain);
  response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const keyword = String(request.query.keyword) || '';
    const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID;

    const params = new URLSearchParams({
      applicationId: RAKUTEN_APP_ID!,
      keyword: keyword,
      hits: '20',
      sort: '+reviewCount'
    });

    const rakutenResponse = await fetch(
      `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?${params}`,
      {
        method: 'GET',
      }
    );

    const data = await rakutenResponse.json();
    
    // レスポンスデータの整形
    const items: RakutenItem[] = data.Items.map((item: any) => ({
      itemName: item.Item.itemName,
      itemPrice: item.Item.itemPrice,
      itemUrl: item.Item.itemUrl,
      imageUrl: item.Item.mediumImageUrls[0].imageUrl,
      shopName: item.Item.shopName,
      reviewAverage: item.Item.reviewAverage
    }));

    response.send(JSON.stringify({ items }));
  } catch (error: any) {
    response.send(JSON.stringify({
      error: error.message,
      items: []
    }));
  }
});

// Google Places APIを使用して場所を検索する関数を修正
async function searchNearbyPlaces(lat: number, lon: number, keyword: string) {
  try {
    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    const radius = 10000; // 10km
    const language = 'ja';
    const type = 'establishment'; // ビジネス施設に限定

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      `location=${lat},${lon}` +
      `&radius=${radius}` +
      `&keyword=${encodeURIComponent(keyword)}` +
      `&language=${language}` +
      `&type=${type}` +
      `&key=${GOOGLE_PLACES_API_KEY}`
    );

    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API Error: ${data.status}`);
    }

    return (data.results || []).map((place: any) => ({
      name: place.name,
      address: place.vicinity,
      rating: place.rating || 0,
      userRatingsTotal: place.user_ratings_total || 0,
      location: place.geometry.location,
      placeId: place.place_id,
      types: place.types || [],
      openNow: place.opening_hours?.open_now,
      photos: place.photos?.map((photo: any) => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) || []
    }));
  } catch (error) {
    console.error('Places search error:', error);
    throw error;
  }
}

// searchPlaces関数のエラーハンドリングを改善
export const searchPlaces = onRequest(async (request: Request, response: Response) => {
  response.set('Access-Control-Allow-Origin', allowDomain);
  response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const prefecture = String(request.query.prefecture || '');
    const city = String(request.query.city || '');
    const keyword = String(request.query.keyword || '');

    if (!prefecture || !city || !keyword) {
      throw new Error('Prefecture, city, and keyword are required');
    }

    // 地理座標の取得
    const coordinates = await getLocationCoordinates(prefecture, city);
    if (!coordinates) {
      throw new Error('指定された地域の座標を取得できませんでした');
    }
    
    // 場所の検索
    const places = await searchNearbyPlaces(coordinates.lat, coordinates.lon, keyword);

    response.send(JSON.stringify({
      success: true,
      places,
      searchInfo: {
        location: `${prefecture}${city}`,
        coordinates,
        keyword
      }
    }));
  } catch (error: any) {
    console.error('Search places error:', error);
    response.status(500).send(JSON.stringify({
      success: false,
      error: error.message || '検索中にエラーが発生しました'
    }));
  }
});
