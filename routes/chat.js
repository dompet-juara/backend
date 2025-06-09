"use strict";

const { generateChatResponse } = require("../services/geminiService");

module.exports = {
    name: "chat-routes",
    register: async function (server, options) {
        const { supabase } = options;

        async function getFinancialDataForAIChat(supabaseInstance, userId) {
            const today = new Date();
            const firstDayOfMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1,
            ).toISOString();
            const lastDayOfMonth = new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                0,
                23,
                59,
                59,
                999,
            ).toISOString();
            const AI_FEATURE_NAMES_CHAT = [
                "Gaji", "Tabungan_Lama", "Investasi", "Pemasukan_Lainnya", "Bahan_Pokok",
                "Protein_Gizi", "Tempat_Tinggal", "Sandang", "Konsumsi_Praktis", "Barang_Jasa_Sekunder",
                "Pengeluaran_Tidak_Esensial", "Pajak", "Asuransi", "Sosial_Budaya", "Tabungan_Investasi",
            ];
            const financialInput = AI_FEATURE_NAMES_CHAT.reduce((acc, name) => {
                acc[name] = 0.0;
                return acc;
            }, {});

            const mapCategoryToFeatureNameChat = (dbCategoryName) => {
                if (!dbCategoryName) return null;
                return dbCategoryName.replace(/ /g, "_");
            };

            try {
                const { data: incomeData, error: incomeError } =
                    await supabaseInstance
                        .from("pemasukan")
                        .select("jumlah, kategori_pemasukan(nama)")
                        .eq("user_id", userId)
                        .gte("tanggal", firstDayOfMonth)
                        .lte("tanggal", lastDayOfMonth);
                if (incomeError) {
                    console.error("Error fetching income data for chat context:", incomeError);
                    throw incomeError;
                }
                if (incomeData) {
                    incomeData.forEach((item) => {
                        if (item.kategori_pemasukan && item.kategori_pemasukan.nama) {
                            const featureName = mapCategoryToFeatureNameChat(
                                item.kategori_pemasukan.nama,
                            );
                            if (financialInput.hasOwnProperty(featureName))
                                financialInput[featureName] += parseFloat(item.jumlah);
                        } else if (item.jumlah) {
                            const featureNamePemasukanLainnya = "Pemasukan_Lainnya";
                            if (
                                financialInput.hasOwnProperty(
                                    featureNamePemasukanLainnya,
                                )
                            )
                                financialInput[featureNamePemasukanLainnya] +=
                                    parseFloat(item.jumlah);
                        }
                    });
                }


                const { data: outcomeData, error: outcomeError } =
                    await supabaseInstance
                        .from("pengeluaran")
                        .select("jumlah, kategori_pengeluaran(nama)")
                        .eq("user_id", userId)
                        .gte("tanggal", firstDayOfMonth)
                        .lte("tanggal", lastDayOfMonth);
                if (outcomeError) {
                    console.error("Error fetching outcome data for chat context:", outcomeError);
                    throw outcomeError;
                }
                if (outcomeData) {
                    outcomeData.forEach((item) => {
                        if (
                            item.kategori_pengeluaran &&
                            item.kategori_pengeluaran.nama
                        ) {
                            const featureName = mapCategoryToFeatureNameChat(
                                item.kategori_pengeluaran.nama,
                            );
                            if (financialInput.hasOwnProperty(featureName))
                                financialInput[featureName] += parseFloat(item.jumlah);
                        }
                    });
                }
            } catch (dbError) {
                throw dbError;
            }
            return financialInput;
        }

        server.route({
            method: "POST",
            path: "/ai/chat",
            options: {
                auth: { strategy: "jwt_auth_required" },
            },
            handler: async (request, h) => {
                if (!process.env.GEMINI_API_KEY) {
                    return h
                        .response({
                            role: "model",
                            parts: [
                                {
                                    text: "Layanan AI Chat tidak dikonfigurasi dengan benar (API Key tidak ditemukan).",
                                },
                            ],
                        })
                        .code(503);
                }

                const userId = request.auth.credentials.id;
                const { message, history } = request.payload;

                if (
                    !message ||
                    typeof message !== "string" ||
                    message.trim() === ""
                ) {
                    return h
                        .response({ error: "Pesan tidak boleh kosong." })
                        .code(400);
                }
                if (!Array.isArray(history)) {
                    return h
                        .response({
                            error: "Riwayat chat tidak valid (harus berupa array).",
                        })
                        .code(400);
                }

                for (const entry of history) {
                    if (!entry.role || (typeof entry.role !== 'string') || (entry.role !== 'user' && entry.role !== 'model')) {
                        return h.response({ error: "Riwayat chat tidak valid: setiap entri harus memiliki 'role' ('user' atau 'model')." }).code(400);
                    }
                    const textContent = entry.parts && entry.parts[0] && entry.parts[0].text !== undefined ? entry.parts[0].text : entry.text;
                    if (textContent === undefined || typeof textContent !== 'string') {
                         return h.response({ error: "Riwayat chat tidak valid: setiap entri harus memiliki konten teks." }).code(400);
                    }
                }


                let financialContext = null;
                try {
                    const rawFinancialData = await getFinancialDataForAIChat(
                        supabase,
                        userId,
                    );

                    if (rawFinancialData) {
                        const {
                            Gaji, Tabungan_Lama, Investasi, Pemasukan_Lainnya,
                            Bahan_Pokok, Protein_Gizi, Tempat_Tinggal, Sandang,
                            Konsumsi_Praktis, Barang_Jasa_Sekunder, Pengeluaran_Tidak_Esensial,
                            Pajak, Asuransi, Sosial_Budaya, Tabungan_Investasi,
                        } = rawFinancialData;

                        const totalIncome =
                            (Gaji ?? 0) +
                            (Tabungan_Lama ?? 0) +
                            (Investasi ?? 0) +
                            (Pemasukan_Lainnya ?? 0);
                        const totalOutcome =
                            (Bahan_Pokok ?? 0) + (Protein_Gizi ?? 0) + (Tempat_Tinggal ?? 0) +
                            (Sandang ?? 0) + (Konsumsi_Praktis ?? 0) + (Barang_Jasa_Sekunder ?? 0) +
                            (Pengeluaran_Tidak_Esensial ?? 0) + (Pajak ?? 0) + (Asuransi ?? 0) +
                            (Sosial_Budaya ?? 0) + (Tabungan_Investasi ?? 0);

                        financialContext = {
                            totalPemasukanBulanIni: totalIncome,
                            totalPengeluaranBulanIni: totalOutcome,
                            sisaSaldoBulanIni: totalIncome - totalOutcome,
                        };
                    }
                } catch (dataError) {
                    console.warn(
                        `Could not fetch financial context for chat for user ${userId}: ${dataError.message}`,
                    );
                }

                try {
                    const responseText = await generateChatResponse(
                        history,
                        message,
                        financialContext,
                    );
                    return h
                        .response({
                            role: "model",
                            parts: [{ text: responseText }],
                        })
                        .code(200);
                } catch (error) {
                    console.error(`Error in AI chat route (/ai/chat) during Gemini call for user ${userId}:`, error);
                    const errorMessage = error.message && error.message.startsWith("Layanan AI Chat saat ini tidak tersedia") ?
                        error.message :
                        error.message && error.message.startsWith("Terjadi masalah dengan kunci API") ?
                        error.message :
                        error.message && error.message.startsWith("Permintaan Anda tidak dapat diproses karena alasan keamanan") ?
                        error.message :
                        "Maaf, terjadi kesalahan internal saat memproses permintaan chat Anda. Silakan coba lagi.";

                    return h
                        .response({
                            role: "model",
                            parts: [
                                {
                                    text: errorMessage,
                                },
                            ],
                        })
                        .code(error.message && (error.message.includes("API key") || error.message.includes("konfigurasi")) ? 503 : 500);
                }
            },
        });
    },
};