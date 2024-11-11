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

async function gemini(prompt: string){
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generation_config: {"response_mime_type": "application/json"}
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

const jsonReplace = (str: string) => {
  return str.replace('JSON', '').replace('json', '').replace('```', '').replace('```', '');
}

const createPrompt = (text: string, who: string, when: string | null): string => {
  const scheduleInstruction = when 
  ? `日程は${when}の予定です。scheduleキーは空の配列[]を返してください。` 
  : `日程は未定です。以下の期間で3～5個の候補日を提案してください：
     - 開始日: ${new Date().toISOString().split('T')[0]}
     - 終了日: ${new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
     
     "schedule": [
       { "date": "2024-05-01", "reason": "具体的な理由（季節/天候/暦/慣習など）" },
       { "date": "2024-05-03", "reason": "具体的な理由（参加のしやすさ/意味など）" }
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
  - items: 必要な準備物を具体的に列挙、身に着けるもの・持っていくもの・事前に準備するもの全てを含める
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
    const prompt = createPrompt(text, who, when);
    const result = await gemini(prompt);
    const decoded = jsonReplace(result);
    const parsed = JSON.parse(decoded);
    // バリデーション
    if (!parsed.message || !Array.isArray(parsed.ready) || parsed.ready.length < 3) {
      throw new Error("Invalid response format");
    }
    response.send(decoded);
  } catch (error: any) {
    response.send(JSON.stringify({
      message: "申し訳ありません。プランの生成中にエラーが発生しました。",
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
                  以下のJSON��キーマーで返答してください。
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
    6. 色や数字、方角などの縁起の良い選び方があれば含める
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

// 土日祝日判定用の関数を追加
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
    const { startDate, endDate } = getDateRange();
    const weekends = getUpcomingWeekends();

    const prompt = `
    あなたは日本のお祝い事の準備アドバイザーです。
    ${celebration}に関連するイベント「${eventName}」の詳細情報を提供してください。

    以下の期間で候補日を提案してください：
    - 開始日: ${startDate}
    - 終了日: ${endDate}
    
    土日祝日の候補：${weekends.slice(0, 10).join(', ')}など

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
        ],
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
    2. 土日祝日を優先して提案してください（上記の候補日を参考）
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
    
    // レスポンスの日付を検証
    const data = JSON.parse(decoded);
    if (data.eventDetails?.recommended_dates) {
      const today = new Date().toISOString().split('T')[0];
      data.eventDetails.recommended_dates = data.eventDetails.recommended_dates
        .filter((d: { date: string }) => d.date > today)
        .sort((a: { date: string }, b: { date: string }) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // 提案された日付が少なすぎる場合、デフォルトの週末を追加
      if (data.eventDetails.recommended_dates.length < 3) {
        const defaultWeekends = weekends.slice(0, 3).map(date => ({
          date,
          reason: "週末の予定が立てやすい日程として提案",
          is_holiday: true,
          considerations: "多くの参加者が参加しやすい週末の日程です"
        }));
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
