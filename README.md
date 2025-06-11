# Dompet Juara Backend

Dompet Juara adalah aplikasi backend manajemen keuangan yang menyediakan fitur pencatatan pemasukan, pengeluaran, rekomendasi AI, dan integrasi dengan Supabase serta layanan AI eksternal.

## Fitur Utama

- **Autentikasi JWT** (register, login, refresh token, logout, Google Sign-In)
- **Manajemen Pemasukan & Pengeluaran** (CRUD, kategori, import data)
- **Dashboard Ringkasan Keuangan**
- **Rekomendasi AI** (analisis perilaku keuangan via Flask API)
- **Chat AI** (menggunakan Google Gemini)
- **Upload Foto Profil**
- **Mode Tamu** (dummy data untuk eksplorasi tanpa login)

## Struktur Direktori

```
.env
.gitignore
LICENSE
package.json
README.md
schema.txt
server.js
supabase.js
routes/
  ai.js
  auth.js
  chat.js
  dashboard.js
  income.js
  outcome.js
  user.js
services/
  geminiService.js
tfjs_model/
  group1-shard1of1.bin
  model.json
utils/
  dummyData.js
```

## Instalasi

1. **Clone repository ini**
   ```sh
   git clone https://github.com/dompet-juara/backend.git
   cd backend
   ```
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Konfigurasi environment**
   - Salin `.env.example` ke `.env` (atau buat file `.env` baru) dan isi variabel berikut:
     - `SUPABASE_URL`
     - `SUPABASE_KEY`
     - `JWT_SECRET`
     - `REFRESH_TOKEN_SECRET`
     - `GOOGLE_CLIENT_ID_BACKEND`
     - `AI_SERVICE_URL`
     - `GEMINI_API_KEY`
4. **Jalankan server**
   ```sh
   node server.js
   ```
   Server berjalan di port 3000 (atau sesuai `PORT` di `.env`).

## Endpoint Utama

- `POST   /register` — Registrasi user baru
- `POST   /login` — Login user
- `POST   /refresh-token` — Refresh JWT
- `POST   /logout` — Logout user
- `GET    /income` — List pemasukan (dengan filter & pagination)
- `POST   /income` — Tambah pemasukan
- `PUT    /income/{id}` — Edit pemasukan
- `DELETE /income/{id}` — Hapus pemasukan
- `GET    /income/categories` — List kategori pemasukan
- `POST   /income/import` — Import pemasukan (format array)
- `GET    /outcome` — List pengeluaran (dengan filter & pagination)
- `POST   /outcome` — Tambah pengeluaran
- `PUT    /outcome/{id}` — Edit pengeluaran
- `DELETE /outcome/{id}` — Hapus pengeluaran
- `GET    /categories` — List kategori pengeluaran
- `POST   /outcome/import` — Import pengeluaran (format array)
- `GET    /dashboard/summary` — Ringkasan keuangan bulanan
- `GET    /ai/recommendations` — Rekomendasi AI (Flask API)
- `POST   /ai/chat` — Chat AI (Google Gemini)
- `POST   /users/profile-picture` — Upload foto profil

## Penjelasan Folder & File

- **server.js** — Entry point aplikasi Hapi.js.
- **supabase.js** — Inisialisasi Supabase client.
- **routes/** — Berisi seluruh route API:
  - `auth.js` — Autentikasi & otorisasi (register, login, refresh, logout, Google Sign-In)
  - `income.js` — Manajemen pemasukan
  - `outcome.js` — Manajemen pengeluaran
  - `dashboard.js` — Ringkasan keuangan
  - `ai.js` — Rekomendasi AI (Flask API)
  - `chat.js` — Chat AI (Google Gemini)
  - `user.js` — Upload foto profil
- **services/geminiService.js** — Integrasi dan utilitas untuk Google Gemini AI chat.
- **utils/dummyData.js** — Data dummy untuk mode tamu (guest).
- **tfjs_model/** — Model TensorFlow.js untuk klasifikasi perilaku keuangan.
- **schema.txt** — Struktur dan skema database PostgreSQL (Supabase).
- **.env** — Konfigurasi environment (jangan commit ke repo publik).
- **package.json** — Daftar dependencies dan metadata project.
- **LICENSE** — Lisensi MIT.

## Testing

Saat ini belum tersedia skrip testing otomatis. Jalankan server dan gunakan Postman/Insomnia untuk mencoba endpoint.

## Database

- Menggunakan **Supabase** (PostgreSQL)
- Struktur tabel dapat dilihat di [schema.txt](schema.txt)

## Model AI

- Model TensorFlow.js untuk klasifikasi perilaku keuangan tersedia di folder `tfjs_model/`
- Rekomendasi AI menggunakan Flask API eksternal (lihat variabel `AI_SERVICE_URL`)

## Lisensi

MIT License © 2025 dompet-juara

---

**Kontribusi & pertanyaan:** Silakan buka [issue](https://github.com/dompet-juara/backend/issues) di repo ini.