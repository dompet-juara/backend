---

# Dompet Juara - Backend Aplikasi Manajemen Keuangan 🏆💸

[![Framework](https://img.shields.io/badge/Framework-Hapi.js-orange.svg)](https://hapi.dev/)
[![Language](https://img.shields.io/badge/Language-Node.js%20(JavaScript)-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-Supabase%20(PostgreSQL)-3979FF.svg)](https://supabase.com)
[![AI Integration](https://img.shields.io/badge/AI%20Integration-TF.js%20%7C%20Flask%20%7C%20Gemini-blueviolet.svg)](#-integrasi-layanan-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

"Dompet Juara Backend" adalah sistem backend yang tangguh untuk aplikasi manajemen keuangan, menyediakan API untuk pencatatan pemasukan, pengeluaran, autentikasi pengguna, rekomendasi keuangan berbasis AI, dan integrasi dengan Supabase serta layanan AI eksternal seperti Google Gemini.

## 📖 Daftar Isi

*   [✨ Fitur Utama Backend](#-fitur-utama-backend)
*   [📝 Gambaran Umum Proyek Backend](#-gambaran-umum-proyek-backend)
*   [🛠️ Tumpukan Teknologi Backend](#️-tumpukan-teknologi-backend)
*   [🗂️ Struktur Direktori](#️-struktur-direktori)
*   [⚙️ Konfigurasi & Setup Awal (.env)](#️-konfigurasi--setup-awal-env)
*   [🚀 Instalasi](#-instalasi)
*   [⚡ Menjalankan Server](#-menjalankan-server)
*   [🧩 Arsitektur & Komponen Utama](#-arsitektur--komponen-utama)
*   [🔑 Endpoint API Utama](#-endpoint-api-utama)
*   [🛡️ Autentikasi & Otorisasi](#️-autentikasi--otorisasi)
*   [🗄️ Integrasi Database (Supabase)](#️-integrasi-database-supabase)
*   [🧠 Integrasi Layanan AI](#-integrasi-layanan-ai)
*   [👤 Mode Tamu](#-mode-tamu)
*   [🧪 Testing](#-testing)
*   [🤝 Berkontribusi](#-berkontribusi)
*   [📜 Lisensi](#-lisensi)
*   [🙏 Ucapan Terima Kasih](#-ucapan-terima-kasih)
*   [📧 Kontak / Penulis](#-kontak--penulis)

## ✨ Fitur Utama Backend

*   **Autentikasi JWT**: Register, login, refresh token, logout, dan integrasi Google Sign-In.
*   **Manajemen Pemasukan & Pengeluaran**: Operasi CRUD penuh, manajemen kategori, dan fitur import data.
*   **Dashboard Ringkasan Keuangan**: Menyediakan data agregat untuk ringkasan keuangan.
*   **Rekomendasi AI**: Analisis perilaku keuangan pengguna melalui integrasi dengan API Flask eksternal.
*   **Chat AI**: Fitur konsultasi keuangan menggunakan Google Gemini API.
*   **Upload Foto Profil**: Memungkinkan pengguna mengunggah dan memperbarui foto profil mereka.
*   **Mode Tamu**: Menyediakan data dummy untuk eksplorasi aplikasi tanpa perlu login.

## 📝 Gambaran Umum Proyek Backend

Proyek backend "Dompet Juara" berfungsi sebagai tulang punggung aplikasi, menangani logika bisnis, interaksi database, autentikasi pengguna, dan integrasi dengan layanan pihak ketiga. Dibangun dengan Hapi.js, backend ini dirancang untuk skalabilitas, keamanan, dan kemudahan pemeliharaan.

Fokus utama adalah pada:
1.  **API yang Terstruktur**: Menyediakan endpoint RESTful yang jelas dan konsisten.
2.  **Keamanan**: Implementasi autentikasi JWT dan praktik keamanan lainnya.
3.  **Modularitas**: Pemisahan logika dalam `routes`, `services`, dan `utils` untuk pengelolaan kode yang lebih baik.
4.  **Integrasi AI**: Memanfaatkan model lokal (TF.js) dan layanan eksternal untuk fitur cerdas.

## 🛠️ Tumpukan Teknologi Backend

*   **Framework**: [Hapi.js](https://hapi.dev/)
*   **Runtime Environment**: [Node.js](https://nodejs.org/)
*   **Bahasa Pemrograman**: JavaScript
*   **Database**: [Supabase](https://supabase.com) (menggunakan PostgreSQL)
*   **Autentikasi**: JSON Web Tokens (JWT)
*   **AI Model (Lokal)**: [TensorFlow.js](https://www.tensorflow.org/js)
*   **AI Chat**: [Google Gemini API](https://ai.google.dev/)
*   **AI Rekomendasi (Eksternal)**: API berbasis Flask
*   **Package Manager**: npm

## 🗂️ Struktur Direktori

```
dompet-juara-backend/
├── .env
├── .gitignore
├── LICENSE
├── package.json
├── README.md
├── schema.txt
├── server.js
├── supabase.js
├── routes/
│   ├── ai.js
│   ├── auth.js
│   ├── chat.js
│   ├── dashboard.js
│   ├── income.js
│   ├── outcome.js
│   └── user.js
├── services/
│   └── geminiService.js
├── tfjs_model/
│   ├── group1-shard1of1.bin
│   └── model.json
└── utils/
    └── dummyData.js
```

## ⚙️ Konfigurasi & Setup Awal (.env)

Sebelum menjalankan aplikasi, Anda perlu mengatur variabel environment.

1.  Salin file `.env.example` (jika ada) menjadi `.env`, atau buat file `.env` baru di root proyek.
2.  Isi variabel berikut dengan nilai yang sesuai:
    ```env
    SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY_OR_SERVICE_ROLE_KEY
    JWT_SECRET=YOUR_RANDOM_JWT_SECRET_KEY
    REFRESH_TOKEN_SECRET=YOUR_RANDOM_REFRESH_TOKEN_SECRET_KEY
    GOOGLE_CLIENT_ID_BACKEND=YOUR_GOOGLE_CLIENT_ID_FOR_BACKEND_VERIFICATION
    AI_SERVICE_URL=URL_TO_YOUR_FLASK_AI_RECOMMENDATION_SERVICE
    GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
    PORT=3000
    ```

## 🚀 Instalasi

1.  **Clone repository ini:**
    ```bash
    git clone https://github.com/dompet-juara/backend.git
    cd backend
    ```

2.  **Install dependensi:**
    ```bash
    npm install
    ```

## ⚡ Menjalankan Server

Setelah instalasi dan konfigurasi `.env` selesai, jalankan server dengan perintah:
```bash
node server.js
```
Secara default, server akan berjalan di `http://localhost:3000` (atau port yang Anda tentukan di `.env`).

## 🧩 Arsitektur & Komponen Utama

*   **`server.js`**: Titik masuk utama aplikasi. Menginisialisasi server Hapi.js, me-register plugin, dan mendefinisikan rute global.
*   **`supabase.js`**: Menginisialisasi dan mengekspor klien Supabase untuk interaksi database.
*   **`routes/`**: Direktori ini berisi semua definisi _handler_ untuk endpoint API. Setiap file merepresentasikan grup fungsionalitas:
    *   `auth.js`: Autentikasi.
    *   `income.js`: CRUD operasi untuk data pemasukan.
    *   `outcome.js`: CRUD operasi untuk data pengeluaran dan kategori.
    *   `dashboard.js`: Endpoint untuk data ringkasan keuangan.
    *   `ai.js`: Integrasi dengan layanan rekomendasi AI eksternal.
    *   `chat.js`: Integrasi dengan Google Gemini API untuk fitur chat AI.
    *   `user.js`: Manajemen profil pengguna.
*   **`services/`**: Berisi logika bisnis yang lebih kompleks atau integrasi dengan layanan eksternal.
    *   `geminiService.js`: Fungsi utilitas untuk berinteraksi dengan Google Gemini API.
*   **`utils/`**: Kumpulan fungsi pembantu atau data statis.
    *   `dummyData.js`: Menyediakan data contoh untuk mode tamu.
*   **`tfjs_model/`**: Berisi file model TensorFlow.js yang telah di-train.
*   **`schema.txt`**: Dokumen teks yang menjelaskan struktur tabel dan relasi dalam database.

## 🔑 Endpoint API Utama

Berikut adalah beberapa endpoint utama yang disediakan oleh backend:

*   **Autentikasi:**
    *   `POST /register`
    *   `POST /login`
    *   `POST /refresh-token`
    *   `POST /logout`
    *   `POST /auth/google`
*   **Pemasukan:**
    *   `GET /income`
    *   `POST /income`
    *   `PUT /income/{id}`
    *   `DELETE /income/{id}`
    *   `GET /income/categories`
    *   `POST /income/import`
*   **Pengeluaran:**
    *   `GET /outcome`
    *   `POST /outcome`
    *   `PUT /outcome/{id}`
    *   `DELETE /outcome/{id}`
    *   `GET /categories`
    *   `POST /outcome/import`
*   **Dashboard:**
    *   `GET /dashboard/summary`
*   **AI & Chat:**
    *   `GET /ai/recommendations`
    *   `POST /ai/chat`
*   **Profil Pengguna:**
    *   `POST /users/profile-picture`
    *   `GET /users/profile`

## 🛡️ Autentikasi & Otorisasi

*   Sistem autentikasi menggunakan **JSON Web Tokens (JWT)**.
*   Endpoint yang memerlukan autentikasi dilindungi dan mengharapkan `Authorization: Bearer <token>` header.
*   Mekanisme **refresh token** diimplementasikan.
*   **Google Sign-In** didukung.

## 🗄️ Integrasi Database (Supabase)

*   Backend ini menggunakan **Supabase** (PostgreSQL).
*   Klien Supabase diinisialisasi di `supabase.js`.
*   Struktur tabel dapat dirujuk pada file `schema.txt`.
*   Pastikan kebijakan **Row Level Security (RLS)** di Supabase dikonfigurasi.

## 🧠 Integrasi Layanan AI

Backend "Dompet Juara" mengintegrasikan beberapa kemampuan AI:

1.  **Model TensorFlow.js Lokal**:
    *   File model berada di direktori `tfjs_model/`.
2.  **Rekomendasi AI (Flask API)**:
    *   Berinteraksi dengan layanan AI eksternal.
    *   URL layanan dikonfigurasi melalui `AI_SERVICE_URL`.
3.  **Chat AI (Google Gemini)**:
    *   Menggunakan Google Gemini API.
    *   Integrasi dikelola melalui `services/geminiService.js` dan memerlukan `GEMINI_API_KEY`.

## 👤 Mode Tamu

*   Fitur **Mode Tamu** memungkinkan eksplorasi aplikasi tanpa akun.
*   Menggunakan data dummy dari `utils/dummyData.js`.

## 🧪 Testing

Saat ini, proyek belum dilengkapi dengan skrip _testing_ otomatis. Pengujian dilakukan secara manual menggunakan alat seperti Postman atau Insomnia.

## 🤝 Berkontribusi

1.  **Fork** repository ini.
2.  Buat **branch fitur** baru (`git checkout -b fitur-saya`).
3.  **Commit** perubahan Anda (`git commit -am 'Tambah fitur Xyz'`).
4.  **Push** ke branch Anda (`git push origin fitur-saya`).
5.  Buat **Pull Request** baru.

Jika Anda menemukan bug atau memiliki ide fitur, silakan buka [issue](https://github.com/dompet-juara/backend/issues) di repository.

## 📜 Lisensi

Proyek ini dilisensikan di bawah [**Lisensi MIT**](LICENSE).
MIT License © 2025 dompet-juara

## 🙏 Ucapan Terima Kasih

*   Tim Hapi.js, Supabase, TensorFlow.js, dan Google Gemini.
*   Komunitas _open-source_.

## 📧 Kontak / Penulis

*   **Tim Proyek**: Dompet Juara
*   **Organisasi GitHub**: [https://github.com/dompet-juara](https://github.com/dompet-juara)

---
