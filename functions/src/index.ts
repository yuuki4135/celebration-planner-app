import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
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
  ��祝い事「${text}」の準備プランを提案してください。
  ${who}のお祝いに参加する自分の立場に立って準備物やイベントを提案してください。

  ${scheduleInstruction}

  以下の形式で、JSON形式の返答のみを返してください。会話文や説明は不要です：

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
      {
        "name": "関連イベント名1",
        "description": "イベントの説明"
      },
      {
        "name": "関連イベント名2",
        "description": "イベントの説明"
      }
    ],
    "error": null
  }

  注意事項：
  1. 必ず有効なJSON形式で返答してください
  2. 日付はYYYY-MM-DD形式で指定してください
  3. ${who}のお祝いに参加する自分の立場に立って提案してください
  4. eventsは空は許可されません。考えられるものすべてを列挙してください。最低5つ以上
  5. readyは具体的な準備項目で考えられるものを全て列挙してください。最低5つ以上
  6. itemsは具体的な準備物で考えられるものを全て列挙してください。最低5つ以上
  7. messageは100文字以上で具体的なアドバイスを含めてください
  8. エラーがない場合、errorはnullとしてください
  9. eventsは最低3つ以上のイベントを提��してください
  10. イベントの説明は具体的な内容と意味を含めてください
  11. readyの準備項目は時系列順に並べてください 

  例えば「結婚式」の場合：
  - ready: ["会場の下見", "招待状の準備", "衣装の選定"]のように具体的に
  - events: [{"name": "結納", "description": "結婚の正式な申し込み"}]のように詳しく
  - schedule: 日取りの候補と理由を明確に
  - message: お祝いの意味や準備のポイントを具体的に
  - items: 必要な準備物を具体的に列挙

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
                  以下のJSONスキーマーで返答してください。
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
    const prompt = `
    あなたはお祝い事の準備アドバイザーです。${text}に必要な準備物について、詳細な情報を提供してください。

    以下の形式でJSON形式の返答のみを返してください：

    {
      "categories": [
        {
          "name": "カテゴリ名（例：贈り物、装飾品、飲食物など）",
          "items": [
            {
              "name": "準備物の名称",
              "description": "詳細な説明",
              "importance": "必須 | 推奨 | オプション",
              "estimated_budget": "予算目安（円）",
              "when_to_prepare": "購入・準備時期の目安",
              "notes": "購入時の注意点や選び方のコツ"
            }
          ]
        }
      ],
      "total_budget_estimate": "合計予算目安（円）",
      "error": null
    }

    注意事項：
    1. 各カテゴリに最低3つ以上のアイテムを含めてください
    2. 予算は具体的な金額で示してください
    3. 準備時期は具体的な日数や期間で示してください
    4. 説明は100文字以上で具体的に記載してください
    `;

    const result = await gemini(prompt);
    const decoded = jsonReplace(result);
    const parsed = JSON.parse(decoded);

    // バリデーション
    if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
      throw new Error("Invalid response format");
    }

    response.send(decoded);
  } catch (error: any) {
    response.send(JSON.stringify({
      categories: [],
      total_budget_estimate: 0,
      error: error.message
    }));
  }
});
