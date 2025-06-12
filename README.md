# Dompet Juara - Backend Aplikasi Manajemen Keuangan 🏆💸

[![Framework](https://img.shields.io/badge/Framework-Hapi.js-orange.svg)](https://hapi.dev/)
[![Language](https://img.shields.io/badge/Language-Node.js%20(JavaScript)-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-Supabase%20(PostgreSQL)-3979FF.svg)](https://supabase.com)
[![AI Integration](https://img.shields.io/badge/AI%20Integration-TF.js%20%7C%20FastAPI%20%7C%20Gemini-blueviolet.svg)](#-integrasi-layanan-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) 

"Dompet Juara Backend" adalah sistem *backend* yang tangguh untuk aplikasi manajemen keuangan, menyediakan *API* untuk pencatatan pemasukan, pengeluaran, autentikasi pengguna, rekomendasi keuangan berbasis *AI*, dan integrasi dengan `Supabase` serta layanan *AI* eksternal seperti `Google Gemini`.

## 📖 Daftar Isi

*   [✨ Fitur Utama Backend](#-fitur-utama-backend)
*   [📝 Gambaran Umum Proyek Backend](#-gambaran-umum-proyek-backend)
*   [🛠️ Tumpukan Teknologi Backend (*Tech Stack*)](#️-tumpukan-teknologi-backend-tech-stack)
*   [🗂️ Struktur Direktori](#️-struktur-direktori)
*   [⚙️ Konfigurasi & Setup Awal (`.env`)](#️-konfigurasi--setup-awal-env)
*   [🚀 Instalasi](#-instalasi)
*   [⚡ Menjalankan Server](#-menjalankan-server)
*   [🧩 Arsitektur & Komponen Utama](#-arsitektur--komponen-utama)
*   [🔑 *Endpoint API* Utama](#-endpoint-api-utama)
*   [🛡️ Autentikasi & Otorisasi](#️-autentikasi--otorisasi)
*   [🗄️ Integrasi Database (`Supabase`)](#️-integrasi-database-supabase)
*   [🧠 Integrasi Layanan *AI*](#-integrasi-layanan-ai)
*   [👤 Mode Tamu](#-mode-tamu)
*   [🧪 *Testing*](#-testing)
*   [🤝 Berkontribusi](#-berkontribusi)
*   [📜 Lisensi](#-lisensi)
*   [🙏 Ucapan Terima Kasih](#-ucapan-terima-kasih)
*   [📧 Kontak / Penulis](#-kontak--penulis)

## ✨ Fitur Utama Backend

*   **Autentikasi `JWT`**: Registrasi, *login*, *refresh token*, *logout*, dan integrasi *Google Sign-In*.
*   **Manajemen Pemasukan & Pengeluaran**: Operasi *CRUD* penuh, manajemen kategori, dan fitur impor data.
*   **Dashboard Ringkasan Keuangan**: Menyediakan data agregat untuk ringkasan keuangan.
*   **Rekomendasi *AI***: Analisis perilaku keuangan pengguna melalui integrasi dengan *API* `FastAPI` eksternal.
*   **Chat *AI***: Fitur konsultasi keuangan menggunakan `Google Gemini API`.
*   **Unggah Foto Profil**: Memungkinkan pengguna mengunggah dan memperbarui foto profil mereka.
*   **Mode Tamu**: Menyediakan *dummy data* untuk eksplorasi aplikasi tanpa perlu *login*.

## 📝 Gambaran Umum Proyek Backend

Proyek *backend* "Dompet Juara" berfungsi sebagai tulang punggung aplikasi, menangani logika bisnis, interaksi *database*, autentikasi pengguna, dan integrasi dengan layanan pihak ketiga. Dibangun dengan `Hapi.js`, *backend* ini dirancang untuk skalabilitas, keamanan, dan kemudahan pemeliharaan.

Fokus utama adalah pada:
1.  ***API* yang Terstruktur**: Menyediakan *endpoint RESTful* yang jelas dan konsisten.
2.  **Keamanan**: Implementasi autentikasi `JWT` dan praktik keamanan lainnya.
3.  **Modularitas**: Pemisahan logika dalam `routes`, `services`, dan `utils` untuk pengelolaan kode yang lebih baik.
4.  **Integrasi *AI***: Memanfaatkan model lokal (`TF.js`) dan layanan eksternal untuk fitur cerdas.

## 🛠️ Tumpukan Teknologi Backend (*Tech Stack*)

*   **Framework**: [Hapi.js](https://hapi.dev/)
*   **Runtime Environment**: [Node.js](https://nodejs.org/)
*   **Bahasa Pemrograman**: JavaScript
*   **Database**: [Supabase](https://supabase.com) (menggunakan `PostgreSQL`)
*   **Autentikasi**: JSON Web Tokens (`JWT`)
*   **Model *AI* (Lokal)**: [TensorFlow.js](https://www.tensorflow.org/js)
*   **Chat *AI***: [Google Gemini API](https://ai.google.dev/)
*   **Rekomendasi *AI* (Eksternal)**: *API* berbasis `FastAPI`
*   **Package Manager**: `npm`

## 🗂️ Struktur Direktori

Berikut adalah struktur direktori utama dari proyek backend "Dompet Juara":
```text
backend-main/
├── utils/                      # Folder untuk fungsi-fungsi utilitas dan helper
│   └── dummyData.js            # Berisi data dummy untuk testing dan development
├── tfjs_model/                 # Folder untuk model machine learning TensorFlow.js
│   ├── model.json              # Konfigurasi model TensorFlow.js
│   └── group1-shard1of1.bin    # File binary model TensorFlow.js
├── services/                   # Folder untuk layanan-layanan aplikasi
│   └── geminiService.js        # Layanan untuk integrasi dengan Google Gemini AI
├── routes/                     # Folder untuk endpoint API
│   ├── user.js                 # Endpoint untuk manajemen user
│   ├── outcome.js              # Endpoint untuk pengelolaan pengeluaran
│   ├── income.js               # Endpoint untuk pengelolaan pemasukan
│   ├── dashboard.js            # Endpoint untuk data dashboard
│   ├── chat.js                 # Endpoint untuk fitur chat
│   ├── auth.js                 # Endpoint untuk autentikasi
│   └── ai.js                   # Endpoint untuk fitur AI
├── .env                        # File konfigurasi environment variables (API keys, database credentials, dll)
├── supabase.js                 # Konfigurasi koneksi ke Supabase (database)
├── server.js                   # File utama server Node.js
├── schema.txt                  # Skema database dan struktur data
├── package.json                # Konfigurasi dependensi dan script npm
├── package-lock.json           # Lock file untuk versi dependensi
├── README.md                   # Dokumentasi proyek
├── LICENSE                     # Lisensi proyek
└── .gitignore                  # File untuk mengabaikan file dalam git
```

## ⚙️ Konfigurasi & Setup Awal (`.env`)

Sebelum menjalankan aplikasi, Anda perlu mengatur variabel *environment*.

1.  Buat file `.env` baru di *root* proyek.
2.  Isi variabel berikut dengan nilai yang sesuai:
    ```env
    SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY_OR_SERVICE_ROLE_KEY
    JWT_SECRET=YOUR_RANDOM_JWT_SECRET_KEY
    REFRESH_TOKEN_SECRET=YOUR_RANDOM_REFRESH_TOKEN_SECRET_KEY
    GOOGLE_CLIENT_ID_BACKEND=YOUR_GOOGLE_CLIENT_ID_FOR_BACKEND_VERIFICATION
    AI_SERVICE_URL=URL_TO_YOUR_FASTAPI_AI_RECOMMENDATION_SERVICE
    GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
    PORT=3000
    ```

## 🚀 Instalasi

1.  **Gandakan repositori ini (*Clone this repository*):**
    ```bash
    git clone https://github.com/dompet-juara/backend.git
    cd backend
    ```

2.  **Instal dependensi (*Install dependencies*):**
    ```bash
    npm install
    ```

## ⚡ Menjalankan Server

Setelah instalasi dan konfigurasi `.env` selesai, jalankan server dengan perintah:
```bash
node server.js
```
Secara *default*, server akan berjalan di `http://localhost:3000` (atau *port* yang Anda tentukan di `.env`).

## 🧩 Arsitektur & Komponen Utama

*   **`server.js`**: Titik masuk utama aplikasi. Menginisialisasi server `Hapi.js`, me-*register plugin*, dan mendefinisikan rute global.
*   **`supabase.js`**: Menginisialisasi dan mengekspor klien `Supabase` untuk interaksi *database*.
*   **`routes/`**: Direktori ini berisi semua definisi *handler* untuk *endpoint API*. Setiap file merepresentasikan grup fungsionalitas:
    *   `auth.js`: Autentikasi.
    *   `income.js`: Operasi *CRUD* untuk data pemasukan.
    *   `outcome.js`: Operasi *CRUD* untuk data pengeluaran dan kategori.
    *   `dashboard.js`: *Endpoint* untuk data ringkasan keuangan.
    *   `ai.js`: Integrasi dengan layanan rekomendasi *AI* eksternal (berbasis `FastAPI`).
    *   `chat.js`: Integrasi dengan `Google Gemini API` untuk fitur *chat AI*.
    *   `user.js`: Manajemen profil pengguna.
*   **`services/`**: Berisi logika bisnis yang lebih kompleks atau integrasi dengan layanan eksternal.
    *   `geminiService.js`: Fungsi utilitas untuk berinteraksi dengan `Google Gemini API`.
*   **`utils/`**: Kumpulan fungsi pembantu atau data statis.
    *   `dummyData.js`: Menyediakan data contoh untuk mode tamu.
*   **`tfjs_model/`**: Berisi file model `TensorFlow.js` yang telah di-*train*.
*   **`schema.txt`**: Dokumen teks yang menjelaskan struktur tabel dan relasi dalam *database*.

## 🔑 *Endpoint API* Utama

Berikut adalah beberapa *endpoint* utama yang disediakan oleh *backend*:

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
*   ***AI* & Chat:**
    *   `GET /ai/recommendations` (Menghubungi layanan `FastAPI`)
    *   `POST /ai/chat` (Menggunakan `Gemini API`)
*   **Profil Pengguna:**
    *   `POST /users/profile-picture`
    *   `GET /users/profile`

## 🛡️ Autentikasi & Otorisasi

*   Sistem autentikasi menggunakan **JSON Web Tokens (`JWT`)**.
*   *Endpoint* yang memerlukan autentikasi dilindungi dan mengharapkan *header* `Authorization: Bearer <token>`.
*   Mekanisme ***refresh token*** diimplementasikan.
*   ***Google Sign-In*** didukung.

## 🗄️ Integrasi Database (`Supabase`)

*   *Backend* ini menggunakan **`Supabase`** (`PostgreSQL`).
*   Klien `Supabase` diinisialisasi di `supabase.js`.
*   Struktur tabel dapat dirujuk pada file `schema.txt`.
*   Pastikan kebijakan **Row Level Security (RLS)** di `Supabase` dikonfigurasi dengan benar untuk keamanan data.

## 🧠 Integrasi Layanan *AI*

*Backend* "Dompet Juara" mengintegrasikan beberapa kemampuan *AI*:

1.  **Model `TensorFlow.js` Lokal**:
    *   File model berada di direktori `tfjs_model/`. Model ini dapat digunakan untuk inferensi sisi server jika diperlukan.
2.  **Rekomendasi *AI* (`FastAPI` API)**:
    *   Berinteraksi dengan layanan *AI* eksternal yang dibangun menggunakan `FastAPI` untuk memberikan rekomendasi keuangan.
    *   URL layanan ini dikonfigurasi melalui variabel *environment* `AI_SERVICE_URL`.
3.  **Chat *AI* (`Google Gemini`)**:
    *   Menggunakan `Google Gemini API` untuk fitur konsultasi keuangan interaktif.
    *   Integrasi dikelola melalui `services/geminiService.js` dan memerlukan `GEMINI_API_KEY`.

## 👤 Mode Tamu

*   Fitur **Mode Tamu** memungkinkan pengguna untuk menjelajahi fungsionalitas dasar aplikasi tanpa perlu membuat akun atau *login*.
*   Mode ini menggunakan *dummy data* yang disediakan oleh `utils/dummyData.js` untuk mensimulasikan pengalaman pengguna.

## 🧪 *Testing*

Saat ini, proyek belum dilengkapi dengan skrip *testing* otomatis (seperti unit test atau integration test). Pengujian dilakukan secara manual menggunakan alat bantu *API client* seperti `Postman` atau `Insomnia` untuk memverifikasi fungsionalitas *endpoint*.

## 🤝 Berkontribusi

1.  ***Fork*** repositori ini.
2.  Buat ***branch fitur*** baru (`git checkout -b fitur-saya`).
3.  ***Commit*** perubahan Anda (`git commit -am 'Tambah fitur Xyz'`).
4.  ***Push*** ke *branch* Anda (`git push origin fitur-saya`).
5.  Buat ***Pull Request*** baru.

Jika Anda menemukan *bug* atau memiliki ide fitur, silakan buka [*issue*](https://github.com/dompet-juara/backend/issues) di repositori. <!-- Ganti dengan URL issues repo Anda -->

## 📜 Lisensi

Proyek ini dilisensikan di bawah [**Lisensi MIT**](LICENSE). <!-- Pastikan path ke file LICENSE benar -->
MIT License © 2025 dompet-juara <!-- Ganti tahun dan nama pemilik jika perlu -->

## 🙏 Ucapan Terima Kasih

*   Tim `Hapi.js`, `Supabase`, `TensorFlow.js`, `FastAPI`, dan `Google Gemini`.
*   Komunitas *open-source* atas kontribusi dan alat-alat yang luar biasa.

## 📧 Kontak / Penulis

*   **Tim Proyek**: Dompet Juara
*   **Organisasi `GitHub`**: [https://github.com/dompet-juara](https://github.com/dompet-juara) <!-- Ganti dengan URL organisasi GitHub Anda -->
*   **Email**: [juaradompet@gmail.com](mailto:juaradompet@gmail.com) <!-- Ganti dengan email kontak yang relevan -->
