import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generation_config: {"response_mime_type": "application/json"}
  });

  const prompt = `人気のあるクッキーレシピを日本語で5個リストアップしてください。json形式で返してください。`;

  const result = await model.generateContent(prompt);

  return result.response.text();
}

export const helloWorld = onRequest(async (request, response) => {
  response.set('Access-Control-Allow-Origin', 'http://localhost:5174'); // localhostを許可
  response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST'); // DELETEだけは拒否
  response.set('Access-Control-Allow-Headers', 'Content-Type'); 
  logger.info("Hello logs!", {structuredData: true});
  const result = await run();
  const decoded = result.replace(/```json/g, "").replace(/```/g, "").replace(/\\n/g, "\n");

  response.send(decoded);
});
