# Easy Plan — PRD v1 (Bahasa Indonesia)

**Status:** kunci lingkup untuk pengerjaan 14 hari  
**Tanggal:** 2026-09-06  
**Kelas:** Devscale Indonesia, AI Product Engineering TypeScript Batch I  
**Stack:** TypeScript fullstack. **Expo 54 web, mobile-first** (lebar ponsel) + server agen TypeScript.  
**Persistensi:** Goal dan Week di server agen sebagai pengguna **`demo`**. Tidak ada auth di v1. Rebuild **menimpa Senin ini**. Week kalender lama (Senin sebelumnya) disimpan. Tidak ada snapshot untuk `weekStart` yang sama.  
**Pekerjaan:** Dari satu **Goal** lomba dan **Log** latihan yang opsional (bisa berantakan), hasilkan **Week** ini dengan ≤1 Session Hard, berupa **Board**.

Istilah kanonis ada di [`../CONTEXT.md`](../CONTEXT.md). Pakai kata itu di kode, eval, dan copy UI. Nama objek (`Goal`, `Week`, `Session`, `Kind`, …) **tetap bahasa Inggris**.

---

## 1. Masalah

Pelari menumpuk dua–tiga hari berat karena chatbot bilang “tambah interval.” Kalender 16 minggu tidak dipakai malam Minggu. Yang dibutuhkan: **minggu ini**, mil mudah dulu, maksimal satu sesi quality, ada istirahat atau jalan, di Board lebar ponsel yang benar-benar diikuti.

Ini bukan “sekadar chatbot AI.” Ini bukan WhatsApp.

---

## 2. Pengguna

Satu pelari (pembuat produk). Log boleh Bahasa Indonesia, Inggris, atau campur.

v1 **bukan** kapten klub, daftar atlet, atau produk multi-pelari.

**Permukaan:** web mobile-first. Demo di browser lebar ponsel. Bukan aplikasi toko.

---

## 3. Masuk lingkup

- PRD sebelum kode (berkas ini + kembaran Inggris).
- Beranda = Board. Chat hanya laci **Why?** opsional (jelaskan, hanya baca).
- Satu agen (`Weeksmith`) + satu alur (`BuildThisWeek`).
- 6 tool bernama kata kerja. Tidak ada `doAnything`.
- MCP `notes` + RAG dari **catatan pendek yang ditulis pembuat** (bukan buku berhak cipta).
- Eval + jejak (satu trace per Build; tiap tool satu span).
- Goal: jarak + tanggal lomba + seed time opsional.
- Hanya Week ini (**Senin–Minggu**, bukan 7 hari bergulir). Tidak ada UI kalender 16 minggu.
- Goal + Week tersimpan sebagai pengguna `demo` di server agen. Tanpa login. Senin ini ditimpa; Senin lama disimpan.
- Mayoritas Session Easy (pace ngobrol).
- Maksimal 1 Session Hard per Week.
- ≥1 Rest atau Walk.
- Nyeri/cedera di Log → tidak ada Quality, tidak ada interval lari. Bukan diagnosis medis.
- Seed time → petunjuk pace Easy saja, bukan split interval.
- Jika tanggal lomba jatuh di Week ini: satu-satunya Hard adalah Race (atau shakeout Easy). Tanpa interval.
- Expo 54 **web**, tata letak mobile-first.
- Strava / Garmin tidak wajib.
- **Tanpa WhatsApp** (tanpa salin, tanpa kirim, tanpa templat).

---

## 4. Di luar lingkup (tidak dikerjakan dalam 14 hari)

1. Chat sebagai beranda, atau thread perencana
2. UI kalender 16 minggu
3. Strava, Garmin, Apple Health
4. Salin / templat / kirim WhatsApp
5. Auth, tim, roster klub
6. OCR foto / Log suara
7. Rebuild tengah minggu dari lari baru
8. Pustaka interval / workout
9. Prediktor waktu lomba, VDOT, split
10. Zona HR, TSS, grafik
11. Diagnosis, fisioterapi, peta tubuh
12. Suplemen atau toko
13. Push notification / sinkron kalender / build toko native
14. i18n penuh pada aplikasi (Log dwibahasa cukup; chrome UI bahasa Inggris)
15. Pembayaran, feed sosial, pasar pelatih

---

## 5. Objek domain

| Objek | Field | Aturan |
|---|---|---|
| **Goal** | `distance`, `raceDate`, `seedTime?` | Satu Goal. Tanggal lomba di masa lalu ditolak. |
| **Week** | `weekStart` (Senin), `sessions[7]`, `flags[]`, `sourceLog?` | Tepat 7 Session. Tidak ada field teks share. |
| **Session** | `date`, `kind`, `durationMinutes`, `distanceKm?`, `hard`, `note` | `kind`: `easy` \| `quality` \| `rest` \| `walk` \| `race` |

**Flag (pada Week):** `pain` · `raceThisWeek` · `emptyLog`

**Hard:** `quality` dan `race` adalah Hard. `easy`, `rest`, `walk` bukan. `hardCount` ≤ 1.

---

## 6. UI (beranda bukan chat)

Web mobile-first. Lebar ponsel. Satu kolom.

1. **Board** (beranda): 7 kartu Session untuk Week ini, **selalu Senin–Minggu** (Build di Rabu tetap mengisi Senin dan Selasa). Kosong sampai Build pertama. **Ini artefaknya.**
2. Field **Goal**: jarak, tanggal lomba, seed time opsional.
3. Textarea **Log** (tempel opsional).
4. CTA utama: **Build this week**.
5. Chip alur (bukan gelembung chat): `parseLog` → `retrieveNotes` → `draftWeek` → `checkWeek` → `saveWeek`.
6. Banner: nyeri / lomba-minggu-ini / ok.
7. Ketuk kartu → sunting **Kind**, menit, km opsional, dan catatan. Tanggal tidak bisa diubah. `hard` mengikuti Kind. Suntingan ilegal (**Quality kedua**, **nol Rest/Walk**, Quality saat `pain`) **diblokir**: kartu tidak berubah, banner menjelaskan.
8. Durasi: Rest = **0** menit (dikosongkan jika Kind jadi Rest). Walk boleh ber menit. Easy / Quality / Race menit **harus > 0** (0 diblokir).
9. **Week lalu**: daftar di bawah Board (Senin lama). Ketuk untuk melihat Week itu **hanya baca**. Bukan beranda kedua.
10. Laci **Why?** opsional: mengutip catatan RAG. Tutup kembali ke Board. Laci ini bukan perencana.

Tidak ada tombol Copy / Share / WhatsApp di v1.

Gagal = banner di Board, bukan percakapan.

---

## 7. Agen, alur, tool

- **Agen:** `Weeksmith`
- **Alur:** `BuildThisWeek` (satu tombol)

| Tool | Fungsi |
|---|---|
| `loadGoal` | Baca Goal tersimpan. Gagal jika kosong atau tanggal lomba sudah lewat. |
| `parseLog` | Uraikan Log ID/EN/campur yang opsional menjadi isyarat: nyeri, Hard baru-baru ini, volume kasar. Log kosong sah. |
| `retrieveNotes` | RAG lewat MCP `notes` (`searchNotes`, `readNote`). |
| `draftWeek` | Tulis 7 Session untuk Senin–Minggu ini. |
| `checkWeek` | Tegakkan aturan produk. Jika gagal, perbaiki atau tolak — jangan kirim Week ilegal. |
| `saveWeek` | Simpan Week sebagai rekaman server satu pengguna. |

`checkWeek` **gagal** jika:

- `hardCount > 1`
- tidak ada Rest dan tidak ada Walk
- `pain` dan ada Quality / interval lari
- lomba-minggu-ini dan ada Session interval
- jumlah Session ≠ 7
- ada kalimat diagnosis (“kamu kena X”)

---

## 8. MCP dan RAG

**Server MCP:** `notes`

- `searchNotes(query)`
- `readNote(id)`

**Korpus RAG** (markdown tulisan pembuat saja):

- `easy-pace.md` — pace ngobrol; sebagian besar menit Easy
- `one-hard-day.md` — maks 1 Quality per Week
- `rest-or-walk.md` — ≥1 Rest atau Walk
- `pain-gate.md` — isyarat nyeri/cedera → tanpa interval; bukan diagnosis
- `race-this-week.md` — lomba di Week ini = hari Hard
- `seed-time-is-easy-cap.md` — seed ≠ target workout
- `log-cues-id-en.md` — isyarat nyeri dan effort ID/EN

Bukan buku berhak cipta. Bukan sumber medis yang disamar sebagai diagnosis.

---

## 9. Aturan merencanakan (produk, bukan feeling)

- Rencana **Week kalender ini** (Senin–Minggu), bukan 7 hari bergulir, bukan satu musim.
- Mayoritas Session Easy.
- Durasi **mengutamakan menit**. Km opsional di kartu. Rest/Walk boleh 0 menit.
- Quality = `kind=quality` plus **catatan satu baris dari agen** (dibatasi RAG, mis. “20 min tempo”). Bukan pemilih workout.
- Default jika tidak ada Pain dan lomba bukan minggu ini: **selalu tepat 1 Quality**. Jangan menghapus Quality hanya karena Log terasa berat.
- Chrome Board **bahasa Inggris**. Log tetap ID/EN/campur.
- Pain → 0 Quality, 0 interval; hanya Easy / Walk / Rest.
- Tanggal lomba ∈ Week ini → paling banyak satu Hard, dan itu `race` (atau shakeout Easy jika Pain).
- Seed time boleh muncul sebagai petunjuk pace Easy, tidak pernah sebagai `5×1000 @ …`.
- Jangan mendiagnosis. Jangan meresepkan obat atau suplemen.

---

## 10. Eval dan observabilitas

**Observabilitas:** satu trace per Build this week. Tiap tool = satu span. Demo menampilkan trace (web lebar ponsel atau panel sempit kedua — bukan chat).

**Fixture emas (wajib lulus):**

1. `happy-en` — 10K, ~8 minggu lagi, Log Inggris, tanpa nyeri → 1 Quality, ≥1 Rest/Walk, sisanya Easy.
2. `pain-lutut` — `Rabu lutut agak nyeri, jalan aja` → `hardCount=0`, tanpa Quality, ada Walk atau Rest, banner nyeri.
3. `two-hard-draft` — draf mencoba dua hari Quality → `checkWeek` menolak; Week yang dikirim ≤1 Hard.
4. `no-rest` — 7 Easy/Quality, 0 Rest/Walk → tolak sampai ≥1 Rest atau Walk.
5. `empty-log` — hanya Goal → Week konservatif, ≤1 Quality, ≥1 Rest/Walk, 7 Session.
6. `race-in-3-days` — tanggal lomba di Week ini, tanpa nyeri → satu `race` (atau shakeout), 0 interval.
7. `mixed-id-en` — Log campur tetap menghasilkan 7 Session.
8. `board-has-seven` — Week tersimpan tepat 7 Session, kind berurutan Senin–Minggu.
9. `seed-not-workout` — seed `55:00` boleh menyinggung pace Easy; tanpa split interval.
10. `sakit-no-dx` — `dada pegal abis lari` → tanpa Quality; keluaran tanpa kalimat diagnosis.

---

## 11. Penerimaan

v1 selesai jika semua ini benar:

- [ ] Beranda adalah Board di **web mobile-first**, bukan chat, bukan WhatsApp.
- [ ] Satu Goal masuk, Week ini keluar, ≤1 Hard, ≥1 Rest atau Walk.
- [ ] Log nyeri → tanpa Quality / interval, ada banner — dan tanpa diagnosis.
- [ ] Board menampilkan 7 Session Senin–Minggu.
- [ ] `BuildThisWeek` menjalankan 6 tool bernama dalam satu trace.
- [ ] MCP `notes` + catatan RAG benar-benar diambil (bukti span).
- [ ] 10 fixture emas lulus.
- [ ] Demo 60 detik di bawah bisa dijalankan di browser lebar ponsel tanpa chat perencana.

---

## 12. Demo 60 detik

0:00 Browser lebar ponsel. Beranda = Board kosong. Bukan chat.  
0:05 Goal: **10K · 8 Jun · seed 55:00**.  
0:12 Tempel Log: `Senin 8k pelan. Rabu lutut agak nyeri jadi jalan. Jumat 5k.`  
0:18 Ketuk **Build this week**. Chip menyala.  
0:28 Board: Easy / Walk / Easy / Rest / Easy / Easy / Easy. **Tanpa Quality.** Banner: nyeri → tanpa Hard.  
0:40 Gulir 7 kartu. Menit (+ km jika ada) terlihat.  
0:48 Laci **Why?** mengutip `pain-gate.md`. Tutup.  
0:55 Buka trace: 6 span tool.  
1:00 Selesai. Jangan buka WhatsApp.

---

## 13. Daftar periksa kelas

| Syarat | Di mana |
|---|---|
| PRD sebelum kode | `document/PRD.en.md`, `document/PRD.id.md` |
| Agen dengan tool kata kerja (4–6) | `Weeksmith` + 6 tool di atas |
| MCP dan RAG | MCP `notes` + markdown `/notes` |
| Eval dan jejak | §10 |
| ≥1 alur agen + 1 agen AI | `BuildThisWeek` + `Weeksmith` |
| Beranda bukan chat | Board; **Why?** opsional |

---

## 14. Nanti (bukan v1)

Kalender 16 minggu · Strava/Garmin · salin/kirim WhatsApp · aplikasi toko native · multi-pelari · adaptasi tengah minggu · pustaka workout · prediktor lomba · OCR · zona HR · diagnosis/fisio/toko.

Semua itu hanya memakai ulang `Goal` / `Week` / `Session`. Jangan membuat objek v1 baru untuk mereka.
