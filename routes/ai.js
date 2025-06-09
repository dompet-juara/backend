'use strict';

const axios = require('axios');
const { getDummyAIRecommendations } = require('../utils/dummyData');

const INTERNAL_AI_FEATURE_NAMES = [
    "Gaji", "Tabungan_Lama", "Investasi", "Pemasukan_Lainnya", "Bahan_Pokok",
    "Protein_Gizi", "Tempat_Tinggal", "Sandang", "Konsumsi_Praktis", "Barang_Jasa_Sekunder",
    "Pengeluaran_Tidak_Esensial", "Pajak", "Asuransi", "Sosial_Budaya", "Tabungan_Investasi"
];

const FLASK_API_EXPECTED_FEATURE_NAMES = [
    "Gaji",
    "Tabungan Lama",
    "Investasi",
    "Pemasukan Lainnya",
    "Bahan Pokok",
    "Protein & Gizi Tambahan",
    "Tempat Tinggal",
    "Sandang",
    "Konsumsi Praktis",
    "Barang & Jasa Sekunder",
    "Pengeluaran Tidak Esensial",
    "Pajak",
    "Asuransi",
    "Sosial & Budaya",
    "Tabungan / Investasi"
];

if (INTERNAL_AI_FEATURE_NAMES.length !== FLASK_API_EXPECTED_FEATURE_NAMES.length) {
    console.error("KRITIS: INTERNAL_AI_FEATURE_NAMES dan FLASK_API_EXPECTED_FEATURE_NAMES tidak memiliki panjang yang sama!");
}

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

if (!AI_SERVICE_URL) {
    console.warn("AI_SERVICE_URL not defined in .env. AI recommendations (non-chat) will be static or provide general tips.");
}
if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not defined in .env. AI Chat feature will not work.");
}

function mapCategoryToFeatureName(dbCategoryName) {
    if (!dbCategoryName) return null;

    const nameMapping = {
        "Gaji": "Gaji",
        "Tabungan Lama": "Tabungan_Lama",
        "Investasi": "Investasi",
        "Pemasukan Lainnya": "Pemasukan_Lainnya",

        "Bahan Pokok": "Bahan_Pokok",
        "Protein Gizi": "Protein_Gizi",
        "Tempat Tinggal": "Tempat_Tinggal",
        "Sandang": "Sandang",
        "Konsumsi Praktis": "Konsumsi_Praktis",
        "Barang Jasa Sekunder": "Barang_Jasa_Sekunder",
        "Pengeluaran Tidak Esensial": "Pengeluaran_Tidak_Esensial",
        "Pajak": "Pajak",
        "Asuransi": "Asuransi",
        "Sosial Budaya": "Sosial_Budaya",
        "Tabungan Investasi": "Tabungan_Investasi"
    };

    const mappedName = nameMapping[dbCategoryName];
    if (mappedName) {
        return mappedName;
    } else {
        console.warn(`mapCategoryToFeatureName: Category '${dbCategoryName}' not found in explicit mapping. Using generic conversion.`);
        return dbCategoryName.replace(/ & /g, "_").replace()
    }
}

async function getFinancialDataForAI(supabase, userId) {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const financialInputInternal = INTERNAL_AI_FEATURE_NAMES.reduce((acc, name) => {
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
            if (financialInputInternal.hasOwnProperty(featureName)) {
                financialInputInternal[featureName] += parseFloat(item.jumlah);
            } else {
                console.warn(`Unmapped income category from DB to internal feature name: DB='${item.kategori_pemasukan.nama}', MappedTo='${featureName}'`);
            }
        } else if (item.jumlah) {
            const featureNamePemasukanLainnya = "Pemasukan_Lainnya";
            if (financialInputInternal.hasOwnProperty(featureNamePemasukanLainnya)) {
                financialInputInternal[featureNamePemasukanLainnya] += parseFloat(item.jumlah);
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
            if (financialInputInternal.hasOwnProperty(featureName)) {
                financialInputInternal[featureName] += parseFloat(item.jumlah);
            } else {
                console.warn(`Unmapped outcome category from DB to internal feature name: DB='${item.kategori_pengeluaran.nama}', MappedTo='${featureName}'`);
            }
        }
    });

    const financialDataForFlaskAPI = {};
    for (let i = 0; i < INTERNAL_AI_FEATURE_NAMES.length; i++) {
        const internalName = INTERNAL_AI_FEATURE_NAMES[i];
        const flaskApiName = FLASK_API_EXPECTED_FEATURE_NAMES[i];
        financialDataForFlaskAPI[flaskApiName] = financialInputInternal[internalName] !== undefined ? financialInputInternal[internalName] : 0.0;
    }

    FLASK_API_EXPECTED_FEATURE_NAMES.forEach(name => {
        if (!financialDataForFlaskAPI.hasOwnProperty(name)) {
            financialDataForFlaskAPI[name] = 0.0;
            console.warn(`Flask API expected feature '${name}' was not populated from internal data after mapping, defaulting to 0.0`);
        }
    });

    console.log("Data being sent to Flask API:", JSON.stringify(financialDataForFlaskAPI, null, 2));
    return financialDataForFlaskAPI;
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
        if (!request.auth.isAuthenticated && process.env.NODE_ENV !== 'development') {
          return h.response(getDummyAIRecommendations()).code(200);
        }

        const userId = request.auth.credentials ? request.auth.credentials.id : null;
        if (!userId && process.env.NODE_ENV !== 'development') {
            console.warn("/ai/recommendations called without authenticated user in production-like environment.");
            return h.response(getDummyAIRecommendations()).code(200);
        }


        if (!AI_SERVICE_URL) {
            console.warn("/ai/recommendations: AI_SERVICE_URL not configured.");
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
            if (!userId) {
                 console.log("/ai/recommendations: No user ID, providing dummy recommendations (development mode or guest).");
                 return h.response(getDummyAIRecommendations()).code(200);
            }

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
            
            if (!aiResponse.data || aiResponse.data.error) {
                console.error("Error from Flask AI service:", aiResponse.data ? aiResponse.data.error : "No data in response");
                throw new Error(aiResponse.data ? aiResponse.data.error : "Unknown error from AI service");
            }
            
            const { prediction } = aiResponse.data;
            if (!prediction) {
                console.error("No 'prediction' field in AI service response:", aiResponse.data);
                throw new Error("Invalid response format from AI service: missing prediction.");
            }


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
            let serviceErrorDetail = 'Layanan Tidak Tersedia';
            if (error.response.data) {
                if (typeof error.response.data.error === 'string') {
                    serviceErrorDetail = error.response.data.error;
                } else if (typeof error.response.data === 'string') {
                    serviceErrorDetail = error.response.data;
                } else {
                    serviceErrorDetail = error.response.statusText || serviceErrorDetail;
                }
            }
            errorMessage = `Layanan AI mengembalikan error: ${serviceErrorDetail}`;
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