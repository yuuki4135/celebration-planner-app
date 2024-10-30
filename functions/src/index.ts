import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run(request: string) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generation_config: {"response_mime_type": "application/json"}
  });

  const prompt = `${request}を以下のJSONスキーマーで返してください。
                  { "type": "object",
                    "properties": {
                      "recipe_name": { "type": "string" },
                    }
                  }`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
export const helloWorld = onRequest(async (request, response) => {
  response.set('Access-Control-Allow-Origin', 'http://localhost:5173'); // localhostを許可
  response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST'); // DELETEだけは拒否
  response.set('Access-Control-Allow-Headers', 'Content-Type'); 
  logger.info("Hello logs!", {structuredData: true});
  const text = String(request.query.text);
  const result = await run(text);
  const decoded = result.replace('JSON', '').replace('json', '').replace('```', '').replace('```', '');
  response.send(decoded);
});
