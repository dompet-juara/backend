'use strict';

const axios = require('axios');
const { getDummyAIRecommendations } = require('../utils/dummyData');
const { generateChatResponse } = require('../services/geminiService');

const AI_FEATURE_NAMES = [
    "Gaji", "Tabungan_Lama", "Investasi", "Pemasukan_Lainnya", "Bahan_Pokok",
    "Protein_Gizi", "Tempat_Tinggal", "Sandang", "Konsumsi_Praktis", "Barang_Jasa_Sekunder",
    "Pengeluaran_Tidak_Esensial", "Pajak", "Asuransi", "Sosial_Budaya", "Tabungan_Investasi"
];

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

if (!AI_SERVICE_URL) {
    console.warn("AI_SERVICE_URL not defined in .env. AI recommendations (non-chat) will be static or provide general tips.");
}
if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not defined in .env. AI Chat feature will not work.");
}

function mapCategoryToFeatureName(dbCategoryName) {
    if (!dbCategoryName) return null;
    return dbCategoryName.replace(/ /g, "_");
}

async function getFinancialDataForAI(supabase, userId) {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const financialInput = AI_FEATURE_NAMES.reduce((acc, name) => {
        acc[name] = 0.0;
        return acc;
    }, {});

    const { data: incomeData, error: incomeError } = await supabase
        .from('pemasukan')
        .select('jumlah, kategori_pemasukan(nama)')
        .eq('user_id', userId)
        .gte('tanggal', firstDayOfMonth)
        .lte('tanggal', lastDayOfMonth);

    if (incomeError) {
        console.error("Error fetching income data for AI:", incomeError);
        throw incomeError;
    }

    incomeData.forEach(item => {
        if (item.kategori_pemasukan && item.kategori_pemasukan.nama) {
            const featureName = mapCategoryToFeatureName(item.kategori_pemasukan.nama);
            if (financialInput.hasOwnProperty(featureName)) {
                financialInput[featureName] += parseFloat(item.jumlah);
            }
        } else if (item.jumlah) {
            const featureNamePemasukanLainnya = "Pemasukan_Lainnya";
            if (financialInput.hasOwnProperty(featureNamePemasukanLainnya)) {
                financialInput[featureNamePemasukanLainnya] += parseFloat(item.jumlah);
            }
        }
    });

    const { data: outcomeData, error: outcomeError } = await supabase
        .from('pengeluaran')
        .select('jumlah, kategori_pengeluaran(nama)')
        .eq('user_id', userId)
        .gte('tanggal', firstDayOfMonth)
        .lte('tanggal', lastDayOfMonth);

    if (outcomeError) {
        console.error("Error fetching outcome data for AI:", outcomeError);
        throw outcomeError;
    }
    
    outcomeData.forEach(item => {
        if (item.kategori_pengeluaran && item.kategori_pengeluaran.nama) {
            const featureName = mapCategoryToFeatureName(item.kategori_pengeluaran.nama);
            if (financialInput.hasOwnProperty(featureName)) {
                financialInput[featureName] += parseFloat(item.jumlah);
            }
        }
    });
    return financialInput;
}

function getTailoredAdvice(prediction) {
    let advice = {
        summary: `Perilaku keuangan Anda saat ini diklasifikasikan sebagai: ${prediction}.`,
        tips: []
    };

    switch (prediction.toLowerCase()) {
        case 'boros':
            advice.tips = [
                "Tinjau pengeluaran non-esensial Anda. Bisakah Anda mengurangi pembelian impulsif?",
                "Buat anggaran terperinci dan lacak setiap pengeluaran selama sebulan.",
                "Tetapkan tujuan keuangan yang jelas untuk memotivasi menabung.",
                "Coba aturan 50/30/20: 50% kebutuhan, 30% keinginan, 20% tabungan/pembayaran utang."
            ];
            break;
        case 'cukup boros':
             advice.tips = [
                "Identifikasi satu atau dua area pengeluaran 'keinginan' untuk sedikit dikurangi.",
                "Cari alternatif yang lebih murah untuk beberapa pembelian rutin Anda.",
                "Otomatiskan transfer reguler kecil ke rekening tabungan Anda."
            ];
            break;
        case 'seimbang':
            advice.tips = [
                "Kerja bagus menjaga keseimbangan! Pertahankan terus.",
                "Pertimbangkan apakah Anda dapat lebih mengoptimalkan tabungan atau investasi Anda.",
                "Tinjau anggaran Anda secara berkala untuk memastikannya masih selaras dengan tujuan Anda."
            ];
            break;
        case 'hemat':
            advice.tips = [
                "Anda sudah pandai menabung! Pastikan Anda juga menikmati hidup.",
                "Jelajahi opsi investasi untuk membuat tabungan Anda berkembang.",
                "Pertimbangkan untuk menyisihkan anggaran kecil untuk 'dana hiburan' jika belum."
            ];
            break;
        case 'sangat hemat':
            advice.tips = [
                "Kebiasaan menabung yang luar biasa! Pastikan hemat Anda tidak menyebabkan stres yang tidak perlu.",
                "Pastikan Anda memiliki dana darurat yang kuat.",
                "Jika Anda memiliki tujuan yang jelas, pertimbangkan apakah percepatan investasi memungkinkan."
            ];
            break;
        default:
            advice.tips = [
                "Lacak pengeluaran Anda secara teratur untuk memahami pola pengeluaran.",
                "Tetapkan anggaran yang realistis untuk setiap kategori pengeluaran.",
                "Tinjau kebiasaan keuangan Anda setiap bulan dan sesuaikan anggaran Anda jika perlu."
            ];
            if (prediction && prediction.startsWith("Unknown_Class_Index_")) {
                 advice.summary = "Kami telah menganalisis data Anda, tetapi pola perilaku ini baru bagi sistem kami!";
            }
    }
    return advice;
}

module.exports = {
  name: 'ai-routes',
  register: async function (server, options) {
    const { supabase } = options;

    server.route({
      method: 'GET',
      path: '/ai/recommendations',
      options: { auth: 'jwt_guest_accessible' },
      handler: async (request, h) => {
        if (!request.auth.isAuthenticated) {
          return h.response(getDummyAIRecommendations()).code(200);
        }

        const userId = request.auth.credentials.id;
        if (!AI_SERVICE_URL) {
            return h.response({
                message: 'Layanan AI (rekomendasi) tidak dikonfigurasi. Berikut adalah tips umum.',
                tips: [
                    "Lacak pengeluaran Anda secara teratur.",
                    "Tetapkan anggaran untuk setiap kategori.",
                    "Tinjau kebiasaan belanja Anda setiap bulan."
                ]
            }).code(200);
        }

        try {
            const financialData = await getFinancialDataForAI(supabase, userId);
            const totalSum = Object.values(financialData).reduce((sum, val) => sum + val, 0);

            if (totalSum < 1000) {
                 return h.response({
                    message: 'Data keuangan bulan ini belum cukup untuk memberikan rekomendasi AI yang dipersonalisasi. Silakan tambahkan lebih banyak catatan pemasukan/pengeluaran.',
                    tips: [
                        "Tambahkan pemasukan Anda untuk bulan ini.",
                        "Catat pengeluaran Anda dalam berbagai kategori.",
                        "Semakin banyak data yang Anda berikan, semakin baik AI dapat membantu Anda."
                    ]
                }).code(200);
            }

            const aiResponse = await axios.post(`${AI_SERVICE_URL}/predict`, financialData);
            const { prediction } = aiResponse.data;

            const tailoredAdvice = getTailoredAdvice(prediction);

            return h.response({
                message: tailoredAdvice.summary,
                tips: tailoredAdvice.tips,
            }).code(200);

        } catch (error) {
          console.error("Error in AI recommendation route (/ai/recommendations):", error.message);
          let errorMessage = 'Gagal mendapatkan rekomendasi AI saat ini.';
          if (error.response) {
            console.error("AI Service Error Data:", error.response.data);
            console.error("AI Service Error Status:", error.response.status);
            errorMessage = `Layanan AI mengembalikan error: ${error.response.data.error || error.response.statusText || 'Layanan Tidak Tersedia'}`;
          } else if (error.request) {
            console.error("AI Service No Response:", error.request);
            errorMessage = 'Tidak ada respons dari layanan AI. Mungkin sedang tidak tersedia sementara.';
          } else {
            console.error("Internal error processing AI recommendation:", error);
          }

          return h.response({
            message: errorMessage + " Berikut adalah beberapa tips umum sebagai gantinya:",
            tips: [
                "Pastikan semua pemasukan dan pengeluaran Anda untuk bulan berjalan sudah tercatat.",
                "Kategorikan pengeluaran Anda secara akurat untuk wawasan yang lebih baik.",
                "Tinjau dasbor keuangan Anda secara berkala."
            ]
          }).code(500);
        }
      },
    });
  },
};