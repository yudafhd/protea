# Aset undangan Wizard

Paket lapisan untuk undangan paralaks mengikuti `Gambar ChatGPT 18 Okt 2026, 23.45.41 (1).png`. Palet: kertas krem, sepia, burgundy, dan emas tua. Kanvas acuan 864 x 1820; aset dengan rasio berbeda ditempatkan secara independen, jangan diregangkan mengikuti seluruh kanvas.

Lihat [pratinjau semua PNG](./asset-preview.jpg), [inventaris dimensi dan transparansi](./asset-inventory.json), serta [prompt lengkap](./generation-prompts.json). PNG dibuat menggunakan built-in `image_gen`; SVG dibuat sebagai vektor. Aset sumber tetap tersedia dengan nama aslinya.

## Urutan lapisan

| Urutan belakang ke depan | File | Penempatan |
| --- | --- | --- |
| 1 | `wedding_parchment_bg.png` | Menutup seluruh halaman; latar opak. |
| 2 | `wedding_clouds_back.png` | Awan kiri dan kanan, pusat tetap terbuka untuk teks. |
| 3 | `wedding_landscape_lake.png` | Bagian bawah adegan; cakrawala memiliki alpha, air opak. |
| 4 | `wedding_castle_layer_01_clean.png` | Tengah bawah, dasar kastil menyatu dengan tepi danau. |
| 5 | `wedding_mist_front.png` | Kabut di depan dasar kastil; gunakan opacity sesuai kebutuhan. |
| 6 | `wedding_owl_letter.png` | Di atas kastil, sedikit ke kanan; bergerak terpisah. |
| 7 | `wedding_bride_foreground.png` | Depan kiri; dapat dipotong tepi kiri agar mengikuti poster. |
| 8 | `wedding_groom_foreground.png` | Depan kanan; dapat dipotong tepi kanan agar mengikuti poster. |
| 9 | `wedding_banner_lion_left.png` | Menggantung dari atas kiri. |
| 9 | `wedding_banner_serpent_right.png` | Menggantung dari atas kanan; samakan tinggi visual dengan panji kiri. |
| 10 | `wedding_gold_winged_orb.png` | Tengah bawah, di bawah kutipan. |
| 11 | SVG dan teks HTML | Bingkai, bintang, nama, tanggal, alamat, kutipan, dan nama tamu. |

## Ornamen vektor

- `gold-star.svg`: bintang delapan arah; gunakan beberapa ukuran kecil.
- `gold-frame.svg`: bingkai transparan mengikuti rasio poster, termasuk garis dan bintang tepi.
- `gold-date-circle.svg`: lingkaran kosong; letakkan angka tanggal sebagai teks HTML di atasnya.
- `gold-triangle-mark.svg`: simbol geometris untuk pemisah di atas tanggal.

## Pedoman gerak

- Gunakan pembungkus adegan dengan area luapan tersembunyi. Pertahankan rasio setiap gambar.
- Siapkan area tambahan sekitar 10-15% dari area tampil untuk latar, awan, dan lanskap agar gerakan tidak membuka tepi kosong.
- Pada lebar layar sekitar 390 px, mulai dengan pergeseran latar 0-3 px, awan/lanskap 4-8 px, kastil 8-12 px, dan figur 12-18 px. Nilai ini titik awal penataan, belum hasil pengujian halaman.
- Gerakkan panji dengan sudut sangat kecil dari titik tumpu atas. Untuk burung hantu, cukup translasi dan rotasi lembut; gambar ini satu pose, bukan animasi sayap.
- Teks utama dan nama tamu tetap stabil agar mudah dibaca. Nonaktifkan gerak ketika pengguna memilih pengurangan animasi.
- Figur adalah hasil rekonstruksi AI dari poster yang memotong sisi wajah/tubuh. Wajah, rambut, dan detail pakaian tidak dijamin identik piksel dengan poster; cocokkan kembali bila memakai foto pasangan asli.

## Pemeriksaan

Semua 11 PNG dapat dibuka. Sepuluh lapisan objek memiliki piksel transparan; latar kertas opak. Kanal alpha diperiksa dengan sampling berjarak 8 piksel dan komposit seluruh aset ditinjau secara visual di atas krem pada `asset-preview.jpg`. Pinggiran warna pada tampilan transparan perlu dinilai setelah compositing; pratinjau krem memperlihatkan hasil tampilnya.

## Template yang terintegrasi

Template tersedia di `/templates/wizard` dan masuk ke katalog kategori Sinematik Parallax. Nama tamu dapat dipersonalisasi melalui `/templates/wizard?to=Keluarga%20Pratama`.

- Komponen: `src/components/wizard/WizardInvitation.tsx`; gaya terisolasi dengan awalan `wizard-`.
- Konten: `src/templates/wizard/content.ts`. Nama, tanggal, alamat, dan jadwal dirender sebagai teks; seluruhnya dapat disesuaikan melalui konten/props komponen.
- Tanggal dan lokasi mengikuti poster. **Jam akad 09.00–10.00 dan resepsi 11.00–14.00 WIB adalah contoh**, perlu disesuaikan sebelum undangan dipakai. Profil tidak menambahkan nama lengkap atau orang tua yang belum diberikan.
- Tombol Buka Undangan menjalankan perjalanan kamera sekitar 3,6 detik menuju kastil tanpa menggulir dokumen. Kastil dan danau berada dalam satu bidang lanskap dengan garis air menyentuh kaki kastil, sehingga keduanya tetap menyambung selama zoom. Figur, awan, dan kabut bergerak dengan kedalaman berbeda. Sampul dapat dikunjungi kembali dengan gerak kamera mundur.
- Sesudah tiba, menu Pasangan, Acara, Surat, dan RSVP mengganti isi panel di dalam satu layar. Hanya isi panel yang panjang dapat digulir; adegan dan kamera tetap di tempat. Panel mengembalikan posisi baca ke atas saat bagian diganti.
- Pintasan keyboard Lewati Sampul tersedia. Preferensi pengurangan animasi langsung menampilkan posisi tujuan, termasuk bila preferensi berubah saat perjalanan berlangsung. Gerak pointer dinonaktifkan ketika pengurangan animasi aktif.
- Tombol kalender mengunduh `.ics` untuk kedua acara, dengan konversi WIB yang eksplisit. Petunjuk arah membuka pencarian Google Maps menggunakan alamat tertulis, bukan pin koordinat yang sudah diverifikasi.
- RSVP mengirim ke `/api/rsvp` menggunakan `invitationId="demo"` pada halaman pratinjau. Backend yang ada menyimpan ke `.data/rsvp.jsonl` atau direktori `PROTEA_DATA_DIR`. Untuk undangan terbit, berikan ID undangan yang valid melalui prop komponen.
- `scripts/prepare-wizard-assets.mjs` menyiapkan turunan WebP di `public/assets/wizard` serta menyalin SVG tanpa mengganti PNG sumber. Jalankan ulang setelah aset sumber berubah.
- Uji interaksi: `node tests/wizard-browser.mjs` (Edge headless; dapat diganti dengan `PLAYWRIGHT_CHANNEL`), setelah server lokal berjalan. `PLAYWRIGHT_BASE_URL` opsional.
