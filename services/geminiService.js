'use strict';

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("GEMINI_API_KEY not found in .env. Gemini chat feature will not work.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
}) : null;

const formatClientHistoryForGemini = (clientHistory) => {
    if (!Array.isArray(clientHistory)) {
        console.warn("GEMINI_SERVICE: Invalid chat history from client: not an array. Treating as empty.");
        return [];
    }
    return clientHistory.map(entry => {
        const role = (entry.role === 'user' || entry.role === 'model') ? entry.role : 'user';
        const textContent = entry.parts && Array.isArray(entry.parts) && entry.parts.length > 0 && entry.parts[0].text !== undefined
            ? entry.parts[0].text
            : entry.text !== undefined
                ? entry.text
                : "";
        return {
            role: role,
            parts: [{ text: String(textContent) }]
        };
    }).filter(entry => entry.parts[0].text.trim() !== "");
};

const PROMPT_TEMPLATE_FINANCIAL_CHAT = (financialContext) => {
    let contextString = "Anda adalah asisten keuangan yang ramah dan membantu bernama 'Dompet Juara AI'. ";
    if (financialContext) {
        contextString += `Berikut adalah ringkasan keuangan pengguna saat ini (jika relevan dengan pertanyaan): Total Pemasukan: ${financialContext.totalPemasukanBulanIni}, Total Pengeluaran: ${financialContext.totalPengeluaranBulanIni}, Sisa Saldo: ${financialContext.sisaSaldoBulanIni}. `;
    }
    contextString += "Jawab pertanyaan pengguna dengan singkat, jelas, dan relevan dengan keuangan. Jika pertanyaan di luar topik keuangan, tolak dengan sopan. Jaga agar respons tetap di bawah 250 token output. Hindari penggunaan markdown tebal atau miring kecuali sangat penting. Berikan jawaban dalam Bahasa Indonesia yang baik dan benar.";

    return {
        systemInstruction: {
            parts: [{ text: contextString }]
        }
    };
};

function sanitizeHistoryForGemini(history) {
    if (!history || history.length === 0) {
        console.log("GEMINI_SERVICE: sanitizeHistoryForGemini - Input history is empty or null, returning [].");
        return [];
    }
    console.log("GEMINI_SERVICE: sanitizeHistoryForGemini - Input history:", JSON.stringify(history));

    let sanitized = [];

    let firstUserIndex = history.findIndex(msg => msg.role === 'user');

    if (firstUserIndex === -1) {
        console.warn("GEMINI_SERVICE: sanitizeHistoryForGemini - History contains no 'user' messages. Returning empty history for startChat.");
        return [];
    }

    sanitized.push(history[firstUserIndex]);
    let expectedNextRole = 'model';

    for (let i = firstUserIndex + 1; i < history.length; i++) {
        const message = history[i];
        if (message.role === expectedNextRole) {
            sanitized.push(message);
            expectedNextRole = (expectedNextRole === 'user') ? 'model' : 'user';
        } else {
            if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === message.role) {
                console.warn(`GEMINI_SERVICE: sanitizeHistoryForGemini - Consecutive '${message.role}' roles. Replacing last added message with current one at index ${i}.`);
                sanitized[sanitized.length - 1] = message;
            } else {
                console.warn(`GEMINI_SERVICE: sanitizeHistoryForGemini - Role mismatch or broken sequence. Expected '${expectedNextRole}', got '${message.role}' at index ${i}. Skipping this message to maintain alternation.`);
            }
        }
    }
    console.log("GEMINI_SERVICE: sanitizeHistoryForGemini - Resulting sanitized history:", JSON.stringify(sanitized));
    return sanitized;
}


async function generateChatResponse(clientChatHistory, userMessage, financialDataForAI) {
    if (!model) {
        throw new Error("Layanan AI Chat saat ini tidak tersedia karena konfigurasi API Key belum lengkap.");
    }

    const initialFormattedHistory = formatClientHistoryForGemini(clientChatHistory);
    let historyForGemini;

    if (userMessage === "SYSTEM_TRIGGER_GREETING") {
        console.log("GEMINI_SERVICE: System trigger greeting. History for Gemini will be empty.");
        historyForGemini = [];
    } else {
        console.log("GEMINI_SERVICE: Processing user message. Original client history (after format):", JSON.stringify(initialFormattedHistory, null, 2));
        historyForGemini = sanitizeHistoryForGemini(initialFormattedHistory);
        console.log("GEMINI_SERVICE: History after sanitizeHistoryForGemini for startChat:", JSON.stringify(historyForGemini, null, 2));
    }

    const { systemInstruction } = PROMPT_TEMPLATE_FINANCIAL_CHAT(financialDataForAI);

    try {
        console.log("GEMINI_SERVICE: Attempting to model.startChat with history:", JSON.stringify(historyForGemini, null, 2));
        console.log("GEMINI_SERVICE: Sending user message to AI:", userMessage);

        const chat = model.startChat({
            history: historyForGemini,
            generationConfig: {
                maxOutputTokens: 300,
                temperature: 0.7,
            },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
            systemInstruction: systemInstruction
        });

        const result = await chat.sendMessage(userMessage);
        const response = result.response;

        if (response.promptFeedback && response.promptFeedback.blockReason) {
            console.error("GEMINI_SERVICE: Prompt blocked by Gemini:", response.promptFeedback.blockReason, response.promptFeedback.safetyRatings);
            let userFriendlyBlockReason = response.promptFeedback.blockReason;
            if (response.promptFeedback.blockReason === "SAFETY") userFriendlyBlockReason = "keamanan konten";
            else if (response.promptFeedback.blockReason === "OTHER") userFriendlyBlockReason = "alasan lain";
            throw new Error(`Permintaan Anda tidak dapat diproses karena alasan ${userFriendlyBlockReason}. Mohon ajukan pertanyaan yang berbeda.`);
        }

        const text = response.text();
        console.log("GEMINI_SERVICE: Received response text from AI:", text);
        return text;

    } catch (error) {
        console.error("GEMINI_SERVICE: Error during Gemini API call:", error.message);
        if (error.response) {
            console.error("GEMINI_SERVICE: Error response status:", error.response.status);
            console.error("GEMINI_SERVICE: Error response data:", JSON.stringify(error.response.data, null, 2));
        } else if (error.details) {
             console.error("GEMINI_SERVICE: Error details:", JSON.stringify(error.details, null, 2));
        } else {
            console.error("GEMINI_SERVICE: Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        }


        if (error.message && error.message.includes("API key not valid")) {
            throw new Error("Terjadi masalah dengan kunci API layanan AI. Silakan hubungi administrator.");
        }
        if (error.message && (
            error.message.includes("must have alternating roles of 'user' and 'model'") ||
            error.message.includes("must alternate between 'user' and 'model' roles.") ||
            error.message.includes("should be with role 'user'") ||
            error.message.includes("Text not found")
            )
        ) {
             console.error("GEMINI_SERVICE SDK Error: History role alternation/start/content issue.", { userMessage, historyForGeminiContent: JSON.stringify(historyForGemini), errorMessage: error.message });
             throw new Error("Terjadi kesalahan dalam format atau urutan riwayat chat. Silakan coba mulai percakapan baru jika masalah berlanjut.");
        }
        if (error.message && (error.name === 'GoogleGenerativeAIError' || error.message.includes('[GoogleGenerativeAI Error]'))) {
             const cleanedMessage = error.message.replace(/\[GoogleGenerativeAI Error\]:? /g, '');
             if (cleanedMessage.includes("Invalid JSON payload") || cleanedMessage.includes("Could not parse request")) {
                throw new Error("Maaf, terjadi masalah internal saat mengirim permintaan ke layanan AI. Silakan coba lagi.");
             }
            throw new Error(`Maaf, terjadi masalah dengan layanan AI: ${cleanedMessage}`);
        }
        throw error;
    }
}

module.exports = { generateChatResponse };