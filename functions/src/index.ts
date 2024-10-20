/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest((request, response) => {
  response.set('Access-Control-Allow-Origin', 'http://localhost:5173'); // localhostを許可
  response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST'); // DELETEだけは拒否
  response.set('Access-Control-Allow-Headers', 'Content-Type'); 
  logger.info("Hello logs!", {structuredData: true});
  response.json({ "data": "Hello from Firebase!" });
});

// require('dotenv').config();
// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// async function run() {
//   // For text-only input, use the gemini-pro model
//   const model = genAI.getGenerativeModel({ 
//     model: "gemini-1.5-flash",
//     generation_config: {"response_mime_type": "application/json"}
//   });

//   const prompt = `次のJSONスキーマを使用して、
//                   人気のあるクッキーレシピを日本語で5個リストアップしてください。

//                   Recipe = {'recipe_name': str}
//                   Return: list[Recipe`;

//   const result = await model.generateContentStream(prompt);

//   let text = '';
//   for await (const chunk of result.stream) {
//     //const chunkText = chunk.text();
//     const chunkText = chunk.text();
//     console.log(chunkText);
//     text += chunkText;
//   }
// }

// run();