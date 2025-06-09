const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("GEMINI_API_KEY not found in .env. Gemini chat feature will not work.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null;

const PROMPT_TEMPLATE_FINANCIAL_CHAT = (history, userMessage, financialContext) => {
    let contextString = "Anda adalah asisten keuangan yang ramah dan membantu bernama 'Dompet Juara AI'. ";
    if (financialContext) {
        contextString += `Berikut adalah ringkasan keuangan pengguna saat ini (jika relevan dengan pertanyaan): ${JSON.stringify(financialContext)}. `;
    }
    contextString += "Jawab pertanyaan pengguna dengan singkat, jelas, dan relevan dengan keuangan. Jika pertanyaan di luar topik keuangan, tolak dengan sopan. ";

    const chatHistory = history.map(entry => ({
        role: entry.role,
        parts: [{ text: entry.parts[0].text }]
    }));

    return {
        contents: [
            ...chatHistory,
            { role: "user", parts: [{ text: userMessage }] }
        ],
        systemInstruction: {
            parts: [{
                text: contextString
            }]
        }
    };
};


async function generateChatResponse(chatHistory, userMessage, financialDataForAI) {
    if (!model) {
        return "Layanan AI Chat saat ini tidak tersedia karena konfigurasi API Key belum lengkap.";
    }

    try {
        const promptConfig = PROMPT_TEMPLATE_FINANCIAL_CHAT(chatHistory, userMessage, financialDataForAI);

        const chat = model.startChat({
            history: promptConfig.contents.filter(c => c.role !== 'user' || c.parts[0].text !== userMessage),
            generationConfig: {
                maxOutputTokens: 250,
                temperature: 0.7,
            },
        });

        const result = await chat.sendMessage(userMessage);
        const response = result.response;
        const text = response.text();
        return text;

    } catch (error) {
        console.error("Error calling Gemini API:", error.message);
        if (error.message.includes("API key not valid")) {
            return "Terjadi masalah dengan kunci API layanan AI. Silakan hubungi administrator.";
        }
        if (error.response && error.response.promptFeedback && error.response.promptFeedback.blockReason) {
            console.error("Prompt blocked due to safety settings:", error.response.promptFeedback.blockReason);
            return "Permintaan Anda tidak dapat diproses karena alasan keamanan konten. Mohon ajukan pertanyaan yang berbeda.";
        }
        return "Maaf, saya tidak bisa merespons saat ini. Coba beberapa saat lagi.";
    }
}

module.exports = { generateChatResponse };