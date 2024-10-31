import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { Request, Response } from "express";

require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    : `日程は未定です。以下の形式で候補日を提案してください：
       "schedule": [
         { "date": "2024-05-01", "reason": "五月晴れで縁起が良い" },
         { "date": "2024-05-03", "reason": "連休中で参加しやすい" }
       ]`;

  return `
  あなたは日本のお祝い事のプランニングエキスパートです。
  お祝い事「${text}」の準備プランを${who}のために提案してください。

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
  3. eventsは空の場合でも最低1つのイベントを提案してください
  4. readyは具体的な準備項目を最低3つ以上列挙してください
  5. messageは100文字以上で具体的なアドバイスを含めてください
  6. エラーがない場合、errorはnullとしてください

  例えば「結婚式」の場合：
  - ready: ["会場の下見", "招待状の準備", "衣装の選定"]のように具体的に
  - events: [{"name": "結納", "description": "結婚の正式な申し込み"}]のように詳しく
  - schedule: 日取りの候補と理由を明確に

  返答は必ずこのJSON形式のみとし、追加の説明や会話は含めないでください。`;
};



export const AskCelebration = onRequest(async (request: Request, response: Response) => {
  response.set('Access-Control-Allow-Origin', 'http://localhost:5173'); // localhostを許可
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
  response.set('Access-Control-Allow-Origin', 'http://localhost:5173'); // localhostを許可
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
