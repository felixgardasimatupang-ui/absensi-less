# Audit Mendalam Repositori `absensi-less`

Tanggal audit: 18 Mei 2026  
Scope: aplikasi mobile Expo/React Native pada folder `AbsensiLes`.

## Ringkasan Eksekutif

Audit menemukan bahwa fondasi aplikasi sudah cukup rapi (struktur folder jelas, pemisahan store/service/screen baik), tetapi ada beberapa risiko penting di area **keamanan**, **reliability**, **konfigurasi environment**, dan **quality gate**.

Status ringkas:
- **High**: 3 temuan
- **Medium**: 6 temuan
- **Low**: 5 temuan

Prioritas perbaikan pertama:
1. Tambahkan validasi token dan refresh/session strategy yang konsisten.
2. Hapus default API localhost untuk production build dan pakai environment yang tervalidasi.
3. Tambahkan quality gate (lint + typecheck + test) di CI.

---

## Metodologi Audit

Audit dilakukan dengan pendekatan static code review pada:
- konfigurasi project (`package.json`, `app.json`, `tsconfig.json`),
- arsitektur auth & API layer,
- flow absensi (scan/manual/history),
- keamanan data dan error handling,
- kesiapan deploy.

Tidak dilakukan dynamic pentest atau backend-side verification pada audit ini.

---

## Temuan Detail & Rekomendasi

## 1) HIGH — Default API URL ke localhost berisiko salah konfigurasi production
**Lokasi**: `src/config.ts`

### Detail
`API_URL` fallback ke `http://localhost:3000/api`. Pada perangkat fisik/mobile production, localhost akan menunjuk ke device sendiri, bukan server API sesungguhnya.

### Dampak
- Aplikasi gagal berfungsi ketika env tidak ter-set.
- Risiko salah kirim build ke user dengan endpoint invalid.

### Rekomendasi
- Wajibkan `EXPO_PUBLIC_API_URL` tersedia di semua environment.
- Tambahkan guard yang melempar error jelas saat variabel env tidak tersedia.
- Bedakan env dev/staging/prod dengan EAS profiles atau config plugin.

---

## 2) HIGH — Tidak ada quality gate minimal (lint, test, typecheck) pada scripts
**Lokasi**: `package.json`

### Detail
Scripts hanya `start/android/ios/web`. Tidak ada `lint`, `typecheck`, `test`.

### Dampak
- Potensi bug runtime meningkat.
- Regressions sulit terdeteksi sebelum rilis.

### Rekomendasi
- Tambahkan script: `lint`, `typecheck`, `test`.
- Terapkan CI pipeline (GitHub Actions) untuk menjalankan checks pada pull request.

---

## 3) HIGH — Logout network call di client dapat gagal diam-diam dan tidak ada retry policy
**Lokasi**: `src/store/useAuthStore.ts`

### Detail
`logout` memanggil endpoint server dan hanya `console.error` bila gagal, lalu tetap clear state lokal.

### Dampak
- Token server-side bisa tetap aktif bila backend memakai revocation list.
- Menyulitkan audit session lifecycle.

### Rekomendasi
- Implementasikan token revocation strategy yang tegas (best-effort + telemetry/event).
- Catat kegagalan logout ke observability channel (Sentry/log backend).
- Pertimbangkan background retry terbatas saat jaringan kembali normal.

---

## 4) MEDIUM — Tidak ada skema validasi payload/response API di client
**Lokasi**: `src/services/attendanceService.ts`, `src/services/api.ts`, screens auth

### Detail
Response API langsung dipakai tanpa runtime validation (mis. Zod/Yup/io-ts).

### Dampak
- Jika response backend berubah, bug akan muncul di runtime.
- Error handling jadi tidak konsisten.

### Rekomendasi
- Tambahkan schema validation untuk response penting (`login`, `history`, `students`, `attendance`).
- Standarkan tipe error API (status code + message + code).

---

## 5) MEDIUM — Permission & privacy flow lokasi belum menyertakan edukasi/consent detail
**Lokasi**: `src/utils/locationHelper.ts`, `src/screens/student/ScanQRScreen.tsx`

### Detail
Aplikasi meminta lokasi dan mendeteksi mocked location, namun belum ada layar penjelasan kebijakan data lokasi secara eksplisit sebelum request.

### Dampak
- Risiko trust issue dan potensi friction user.
- Berpotensi bermasalah pada compliance internal/kebijakan institusi.

### Rekomendasi
- Tambahkan pre-permission screen (kenapa lokasi dibutuhkan, bagaimana disimpan, berapa lama).
- Tautkan ke privacy policy yang jelas.

---

## 6) MEDIUM — Ketergantungan auth state hanya dari `user`, tidak ada verifikasi token startup
**Lokasi**: `src/navigation/AppNavigator.tsx`, `src/store/useAuthStore.ts`

### Detail
Jika ada user persisted tetapi token expired/invalid, pengalaman user bisa tidak konsisten sampai request pertama 401 terjadi.

### Dampak
- UX membingungkan (masuk ke tab lalu force logout saat API call).

### Rekomendasi
- Tambahkan bootstrap auth check saat startup (`/auth/me` atau token introspection ringan).
- Gunakan loading/splash state sampai validasi selesai.

---

## 7) MEDIUM — Error handling UI belum memiliki pattern global
**Lokasi**: berbagai screen (`LoginScreen`, `RegisterScreen`, `ManualAttendanceScreen`, `ScanQRScreen`)

### Detail
Sebagian menggunakan `Alert`, sebagian `Snackbar`, format pesan berbeda-beda.

### Dampak
- UX tidak konsisten.
- Sulit maintenance untuk i18n dan analytics error.

### Rekomendasi
- Buat utility global `showAppError()` + map error code ke pesan terstandar.
- Pisahkan technical error vs user-friendly error.

---

## 8) MEDIUM — Potensi masalah kompatibilitas Firebase Messaging di Expo-managed workflow
**Lokasi**: `package.json`

### Detail
Project memakai `@react-native-firebase/messaging` bersama Expo managed dependencies. Integrasi FCM pada Expo perlu setup spesifik (native config/EAS build) dan sering menjadi titik gagal jika tidak lengkap.

### Dampak
- Notification dapat gagal pada build nyata walau kode compile.

### Rekomendasi
- Pastikan strategi notifikasi dipilih jelas: `expo-notifications` murni atau RN Firebase dengan prebuild/EAS dan config lengkap.
- Dokumentasikan keputusan arsitektur notifikasi.

---

## 9) LOW — Role selection di register membatasi admin (bagus), tapi tanpa guard backend bisa disalahgunakan
**Lokasi**: `src/screens/auth/RegisterScreen.tsx`

### Detail
UI hanya menyediakan role student/tutor, namun keamanan role harus tetap dipastikan backend.

### Dampak
- Jika backend longgar, escalation privilege bisa terjadi via request manual.

### Rekomendasi
- Pastikan backend memaksa whitelist role yang boleh self-register.
- Role admin harus provisioning terpisah.

---

## 10) LOW — Beberapa magic string status absensi tersebar
**Lokasi**: service/screen terkait absensi

### Detail
Nilai `'hadir' | 'izin' | 'alpa'` dipakai di banyak tempat.

### Dampak
- Potensi typo dan inkonsistensi.

### Rekomendasi
- Pusatkan konstanta/enums domain attendance pada satu file.

---

## 11) LOW — Belum terlihat dokumentasi kontribusi & workflow rilis
**Lokasi**: repository root

### Detail
Belum ada indikator `CONTRIBUTING.md` / release checklist di scope audit.

### Dampak
- Onboarding developer lebih lambat.

### Rekomendasi
- Tambahkan panduan branch strategy, commit convention, dan release process.

---

## 12) LOW — Telemetry/monitoring belum terlihat
**Lokasi**: aplikasi secara umum

### Detail
Belum ada integrasi observability error/runtime (mis. Sentry).

### Dampak
- Incident sulit ditelusuri pada production.

### Rekomendasi
- Tambahkan crash/error monitoring dan basic business events.

---

## Rencana Perbaikan Prioritas (30 Hari)

### Minggu 1 (Critical Foundation)
- Hard fail bila `EXPO_PUBLIC_API_URL` tidak tersedia.
- Tambah script `lint`, `typecheck`, `test`.
- Setup CI minimal untuk menjalankan ketiga script.

### Minggu 2 (Auth & Reliability)
- Implement auth bootstrap check saat startup.
- Rapikan logout lifecycle + observability event.
- Standardisasi global API error handler.

### Minggu 3 (Security & Privacy UX)
- Tambahkan pre-permission location explanation.
- Dokumentasi privacy data lokasi.
- Review notifikasi architecture (Expo vs RN Firebase).

### Minggu 4 (Maintainability)
- Domain constants untuk attendance status.
- Tambahkan CONTRIBUTING + release checklist.
- Integrasi crash/error monitoring.

---

## Checklist Verifikasi Setelah Perbaikan

- [ ] Build dev/staging/prod memakai API URL yang benar.
- [ ] PR gagal merge bila lint/typecheck/test gagal.
- [ ] Startup auth state tervalidasi tanpa flicker UX.
- [ ] Error UI konsisten dan dapat ditelusuri via logs.
- [ ] Permission lokasi memiliki edukasi dan consent yang jelas.
- [ ] Observability aktif untuk error kritikal.

---

## Catatan Penutup

Secara umum, basis aplikasi sudah baik untuk MVP internal. Fokus utama berikutnya adalah **hardening operasional**: quality gate, ketegasan environment config, standardisasi auth lifecycle, dan observability production. Dengan menutup gap tersebut, reliabilitas dan keamanan aplikasi akan naik signifikan tanpa perlu refactor besar.
