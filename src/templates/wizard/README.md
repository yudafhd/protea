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

Template Wizard menjadi halaman utama `/`, tetap tersedia di `/templates/wizard`, dan masuk ke katalog kategori Sinematik Parallax di `/catalog`. Tautan `/guest/ahmad%20yuda%20fahrudin` menampilkan nama penerima **Ahmad Yuda Fahrudin**, termasuk isian awal RSVP. Nama dari path didekode, spasi dirapikan, dan setiap kata diawali huruf kapital. Personalisasi melalui `/templates/wizard?to=Keluarga%20Pratama` atau `/?to=Keluarga%20Pratama` juga tetap tersedia. Jalankan `node tests/wizard-routes-browser.mjs` untuk memeriksa rute, nama tamu, ukuran teks penerima di HP kecil, dan warna menu.

- Komponen: `src/components/wizard/WizardInvitation.tsx`; gaya terisolasi dengan awalan `wizard-`.
- Konten: `src/templates/wizard/content.ts`. Nama, tanggal, alamat, dan jadwal dirender sebagai teks; seluruhnya dapat disesuaikan melalui konten/props komponen.
- Tanggal dan lokasi mengikuti poster. **Jam akad 09.00–10.00 dan resepsi 11.00–14.00 WIB adalah contoh**, perlu disesuaikan sebelum undangan dipakai. Profil tidak menambahkan nama lengkap atau orang tua yang belum diberikan.
- Tombol Buka Undangan menjalankan perjalanan kamera sekitar 9,3 detik menuju kastil tanpa menggulir dokumen. Kastil dan danau berada dalam satu bidang lanskap dengan garis air menyentuh kaki kastil, sehingga keduanya tetap menyambung selama zoom. Figur, awan, dan kabut bergerak dengan kedalaman berbeda. Sampul dapat dikunjungi kembali dengan gerak kamera mundur.
- Sesudah tiba, menu Pasangan, Acara, RSVP, dan Gift mengganti isi panel di dalam satu layar. Gift berada di menu terakhir. Pilihan kehadiran serta jumlah tamu pada RSVP masing-masing menempati satu baris. Hanya isi panel yang panjang dapat digulir; adegan dan kamera tetap di tempat. Panel mengembalikan posisi baca ke atas saat bagian diganti.
- Perpindahan menu memakai fade keluar 150 ms lalu reveal tiap elemen 560 ms dengan jeda bertahap maksimal 275 ms. `useWizardChapters.ts` mengatur teks, foto, profil, jadwal, lokasi, field RSVP, ucapan dinamis, dan kartu rekening; elemen di bawah layar menunggu sampai digulir. Klik cepat mengikuti tujuan terakhir, formulir tetap terpasang agar isian tersimpan, dan pengurangan gerak menampilkan isi langsung. Uji Chromium/WebKit: `node tests/wizard-chapters-browser.mjs`.
- Pintasan keyboard Lewati Sampul tersedia. Preferensi pengurangan animasi langsung menampilkan posisi tujuan, termasuk bila preferensi berubah saat perjalanan berlangsung. Gerak pointer dinonaktifkan ketika pengurangan animasi aktif.
- Sampul memiliki gerakan otomatis tanpa kursor: awan dan kabut bergeser beberapa piksel, burung hantu melayang, panji berayun, dan bintang berpendar. Pose animasi ditahan selama perjalanan kamera; animasi otomatis dinonaktifkan saat pengurangan animasi dipilih.
- Tombol kalender mengunduh `.ics` untuk kedua acara, dengan konversi WIB yang eksplisit. Google map membuka tautan Google Maps yang diberikan pengguna melalui `mapsUrl` di `content.ts`.
- RSVP aktif meneruskan jawaban ke Google Form pengguna melalui tab baru dengan isian awal. Tamu harus menekan Kirim di Google Form agar jawaban tersimpan. Jika `googleForm` dihapus dari konten, formulir menggunakan `/api/rsvp` dengan `invitationId="demo"` pada pratinjau; backend menyimpan ke `.data/rsvp.jsonl` atau `PROTEA_DATA_DIR`.
- `scripts/prepare-wizard-assets.mjs` menyiapkan turunan WebP di `public/assets/wizard` serta menyalin SVG tanpa mengganti PNG sumber. Jalankan ulang setelah aset sumber berubah.
- Uji interaksi: `node tests/wizard-browser.mjs` (Edge headless; dapat diganti dengan `PLAYWRIGHT_CHANNEL`), setelah server lokal berjalan. `PLAYWRIGHT_BASE_URL` opsional.
- Pemuatan awal menunggu semua gambar pada sampul dan bagian tersembunyi selesai diunduh serta didekode, tekstur latar, tiga font, dan tiga berkas audio. Indikator menunjukkan persentase jumlah aset yang siap. Jika ada aset gagal dimuat, tombol Coba lagi mengulangi pemuatan; sampul belum bisa dibuka sebelum seluruh aset siap. Audio disimpan di memori untuk dipakai sesudah ketukan Buka undangan tanpa unduhan ulang maupun autoplay. Uji loader, kegagalan gambar, ukuran teks penerima, dan salam Arab di Chromium/WebKit: `node tests/wizard-loading-browser.mjs`.

## Musik dan suara pintu

Musik aktif adalah **The Ironbound Storybook**, dari berkas `The_Ironbound_Storybook.mp3` yang disediakan pengguna di root proyek (sekitar 2 menit 54 detik / 4,18 MB). Versi web di `/assets/wizard/audio/ironbound-storybook.mp3` berdurasi 90 detik, MP3 stereo 32 kHz / 96 kbps, sekitar 1,08 MB. Potongan awal diproses dengan normalisasi loudness dan crossfade dua detik antara akhir serta awal agar pengulangan tetap halus. Berkas sumber tetap utuh.

Jalankan `npm run assets:wizard-music` untuk membuat ulang versi web; diperlukan FFmpeg di PATH atau variabel `FFMPEG_PATH` yang menunjuk executable. Efek engsel/kayu serta musik orisinal lama **A Letter Beneath the Moon** tetap dapat dibuat ulang dengan `npm run assets:wizard-audio`; WAV musik lama tidak dipakai sebagai latar aktif.

`useWizardAudio.ts` membuat AudioContext setelah klik Buka Undangan atau pintasan keyboard. Musik masuk selama 1,2 detik pada gain 0,22, berulang selama membaca, dan memudar saat kembali ke sampul. Efek pintu buka 2,8 detik dan tutup 2 detik memakai gain 0,32 serta dipicu satu kali ketika progres kamera berada di antara 0,62 dan 0,95, mengikuti gerak daun pintu. Perjalanan instan/pengurangan animasi tidak memainkan efek pintu. Jika aset terlambat dimuat, efek yang sudah lewat dilewati.

Tombol suara membisukan musik dan efek secara bersamaan, mempertahankan pilihan selama berpindah bagian atau kembali ke sampul. Audio ditangguhkan ketika tab tersembunyi, efek pintu yang aktif dihentikan, dan konteks ditutup saat komponen dilepas. Kegagalan unduhan ditangani loader awal; kegagalan pemutaran setelah sampul dibuka dapat dicoba ulang melalui tombol suara.

Pada Safari yang mendukung Audio Session API, sesi diatur ke `playback` agar musik tidak mengikuti sakelar silent iPhone, lalu dikembalikan saat komponen dilepas. Browser tanpa API ini tetap memakai Web Audio biasa; mode silent perangkat dapat memengaruhi suara. Konteks yang terhenti ditampilkan sebagai tombol coba ulang, dan ketukan pengguna melanjutkan konteks tanpa menggandakan musik. Jalankan `node tests/audio-browser.mjs` setelah server lokal berjalan untuk menguji Chromium dan WebKit (pasang browser dengan `npx playwright install chromium webkit`).

## Gerbang dan aula kastel

Tiga aset tambahan dibuat menggunakan built-in `image_gen`. Prompt lengkap dan referensinya tersimpan di [castle-generation-prompts.json](./castle-generation-prompts.json).

| Sumber PNG | Turunan untuk web | Peran |
| --- | --- | --- |
| `wedding_castle_gate_left.png` | `/assets/wizard/castle-gate-left.webp` | Daun gerbang kiri dengan kanal alpha. |
| `wedding_castle_gate_right.png` | `/assets/wizard/castle-gate-right.webp` | Daun gerbang kanan dengan kanal alpha. |
| `wedding_castle_hall.png` | `/assets/wizard/castle-hall.webp` | Latar aula opak, perspektif terpusat, palet sepia, burgundy, dan emas tua. |

Perjalanan masuk berdurasi 9,3 detik: adegan luar 4,2 detik, perpindahan ke gerbang 0,9 detik, jeda 0,6 detik, dan pembukaan pintu 3,6 detik. Seluruh teks dan tombol sampul memudar selama 0,3 detik saat undangan dibuka, lalu muncul kembali dengan transisi yang sama setelah perjalanan pulang selesai. Putri keluar ke kiri dan Yuda ke kanan, bersamaan dengan burung yang membesar ke arah kamera lalu melintas keluar layar. Kamera mendekati kastel dengan pembesaran maksimal 1,25 kali dan titik fokus di tengah, sebelum adegan luar menghilang dan gerbang muncul. Perjalanan kembali berdurasi 7 detik. Percepatan dan perlambatan menggunakan kurva sinus, dengan interpolasi halus pada awal serta akhir gerak pintu. Setelah kamera mendekati kastel, gerbang menutup seluruh area undangan dari tepi ke tepi, kedua daun pintu membuka, lalu panel perkamen muncul di atas latar aula. Gerak memakai satu progres kamera yang sama sehingga perjalanan kembali ke sampul membalik urutan ini. CSS memotong bagian kayu di bawah lengkung untuk memenuhi tinggi dan lebar layar; rasio sumber dipertahankan dan tepi pertemuan pintu tetap sejajar di tengah.

Pengurangan animasi langsung menampilkan aula dan isi undangan tanpa gerak pintu. Aset baru dimuat lebih awal agar tersedia ketika sampul dibuka. Jadwal, peta, kalender, dan pengiriman RSVP tetap memakai konten serta alur yang sudah ada.

## Foto bersama di bagian Pasangan

Versi sebelumnya: foto `DSC01262.jpg` diedit menggunakan built-in `image_gen` menjadi `wedding_couple_wizard.png`. Outfit diubah menjadi jubah charcoal dengan lapisan burgundy, detail emas, serta dasi senada; latar studio menjadi taupe hangat. Sumber asli tetap di lokasi semula. Prompt dan asal foto tercatat di [couple-generation-prompt.json](./couple-generation-prompt.json). Turunan WebP tersedia di `/assets/wizard/couple-wizard.webp`; gunakan `scripts/prepare-wizard-assets.mjs` untuk menyiapkannya kembali.

Bagian Pasangan menampilkan satu foto bersama dalam bingkai tipis yang mempertahankan komposisi foto secara penuh. Teks pembuka dan kutipan mengikuti naskah pengguna di `content.ts`. Header nama/tanggal, judul dekoratif, dan keterangan foto di panel telah dihapus; kalimat pembuka ditutup setelah ?doa restu? agar tetap utuh. Bagian Acara langsung menampilkan tanggal dan jadwal, sedangkan RSVP langsung menampilkan formulir. Judul bagian tetap tersedia untuk pembaca layar dan fokus keyboard. Foto pasangan pada sampul tetap menggunakan lapisan animasi yang sudah ada.

## Integrasi Google Form untuk RSVP

Area penutup RSVP menampilkan Ucapan & Doa, menggantikan kutipan dan nama/tanggal. Sumber respons harus dipasang oleh pemilik Google Form melalui [panduan penghubung ucapan](./GOOGLE-WISHES-SETUP.md). URL deployment disimpan pada variabel server `WIZARD_WISHES_URL`. Tanpa konfigurasi ini, tampilan kosong dan belum membaca respons asli. API hanya mengeluarkan nama serta ucapan, dengan daftar terbaru lebih dahulu dan pembaruan saat tab kembali aktif.

Form pengguna: `https://forms.gle/L9SjecJwKp5GW2Fn9`. Konfigurasi `googleForm` dalam `content.ts` berisi URL responder, ID kolom Nama Lengkap (`986528962`), Kehadiran (`877086558`), Jumlah tamu (`1498135098`), serta Ucapan & Doa (`2606285`). Nilai kehadiran harus sama persis dengan pilihan pada Google Form. Jika kolom dihapus/dibuat ulang, perbarui ID isian.

Tombol Lanjut ke Google Form memakai navigasi GET bawaan browser dan membuka jawaban yang telah diisi pada tab baru. Nama awal mengikuti `?to=` pada link undangan dan masih dapat diedit. Jumlah tamu tidak diteruskan saat memilih tidak hadir karena kolom itu opsional di Google Form. Membuka form tidak menampilkan pesan berhasil atau membuat catatan lokal; konfirmasi baru tersimpan setelah tamu menekan Kirim di Google Form. Pengujian browser mencegat navigasi ke Google sehingga tidak membuat respons uji.

Form yang diperiksa belum memiliki kolom atau pengumpulan email. Untuk email akun Google, pemilik form dapat mengaktifkan Settings > Responses > Collect email addresses > Verified; tamu akan diminta login serta mengonfirmasi pengumpulan email. Nama akun Google tidak otomatis menjadi jawaban Nama Lengkap melalui pengaturan ini.

## QR lokasi

Bagian Acara menyediakan QR yang mengarah ke `https://maps.app.goo.gl/JRXDjYGB8LeEy6cB8`, sama dengan tombol Google maps. Tombol Unduh QR lokasi mengunduh PNG 1024 x 1024 px dari `/assets/wizard/location-qr.png`. QR memakai hitam-putih dan ruang kosong di sekelilingnya agar mudah dipindai. Setelah mengubah `mapsUrl` dalam `content.ts`, jalankan `npm run assets:wizard-qr` untuk membuat ulang QR. Tes mendekode gambar untuk memastikan isinya sesuai tautan pada konten.

## Gift

Bagian Gift menggantikan Surat di panel dan navigasi. Rekening disetel melalui `giftAccounts` dalam `content.ts`, berisi `bank`, `number`, `holder`, dan penanda opsional `isDemo`. Data awal adalah Bank Contoh dengan nomor `0000000000`, atas nama Yuda & Putri, serta label rekening contoh. Tombol salin menggunakan clipboard dan menampilkan pesan bila penyalinan gagal agar nomor tetap dapat disalin manual.

## Bulan pada sampul

`wedding_moon.png` dibuat dari referensi poster menggunakan built-in `image_gen`, dengan latar transparan dan warna ivory-sepia. Turunan WebP 768 px berada di `/assets/wizard/moon.webp`. Bulan ditempatkan di kiri atas kastel (kiri 27%, atas 48,5%, lebar 24%) di antara lapisan awan dan kastel, dengan gerak paralaks kecil pada sampul. Saat undangan dibuka, bulan membesar hingga 3,2 kali dan bergerak ke tengah layar, lalu memudar mengikuti akhir adegan luar. Prompt lengkap tersimpan di [moon-generation-prompt.json](./moon-generation-prompt.json).

## Foto piknik HD

Foto aktif bagian Pasangan diganti dengan foto piknik dari lampiran pengguna, ditingkatkan menggunakan built-in `image_gen`. Sumber hasil edit ada di `wedding_couple_picnic_hd.png`; versi web di `/assets/wizard/couple-picnic-hd.webp`. Peningkatan meliputi kejernihan, tekstur dan pencahayaan alami, dengan pakaian putih dan suasana taman dipertahankan. Bingkai mengikuti rasio foto sehingga wajah, pose duduk, dan alas piknik tidak terpotong. Prompt lengkap ada di [picnic-generation-prompts.json](./picnic-generation-prompts.json). Aset versi Wizard sebelumnya tetap tersedia sebagai arsip.

## Perkenalan masing-masing mempelai

Lanjutan bagian Pasangan menampilkan Yuda lalu Putri, masing-masing dengan foto di tengah di atas nama lengkap dan nama orang tua. Gambar transparan menggunakan aset yang sama dengan sampul: `/assets/wizard/groom.webp` dan `/assets/wizard/bride.webp`. Kedua bagian menggunakan impor gambar yang sama agar revisi gambar sampul juga tampil di perkenalan mempelai.

Nama lengkap dan nama orang tua disetel melalui `partnerProfiles.groom` serta `partnerProfiles.bride` di `content.ts`. Data perkenalan mengikuti kiriman pengguna: Ahmad Yuda Fahrudin, putra dari Bpk Yusuf Wibisono dan Ibu Siti Romadoni; Rischyanti Putri Octavia, putri dari Alm. Bpk Sugeng Utomo dan Ibu Sulastri. Nama singkat dan foto pada sampul tidak diganti.

## Jejak Putri dan Yuda

Setelah perjalanan pembukaan selesai, `WizardFootsteps` menampilkan dua rangkaian jejak dengan teks nama Putri dan Yuda yang mengikuti langkah. Nama mengikuti `content.bride` dan `content.groom`, ditampilkan tanpa kotak, border, background, atau padding label. Tujuan dipilih acak dalam area baca; kaki kiri dan kanan menapak bergantian, meninggalkan jejak sepia yang diam dan memudar selama 3,2 detik. Masing-masing memakai sepuluh elemen jejak yang digunakan kembali agar jumlah elemen tetap terbatas.

Lapisan mengikuti ukuran area baca, berada di atas latar perkamen tetapi di bawah seluruh isi dan navigasi, serta meneruskan klik dan sentuhan ke konten. Animasi berhenti ketika tab browser tersembunyi, undangan kembali ke sampul, atau pengurangan gerakan aktif. Efek ini berupa visual tanpa tambahan audio. Jalankan `node tests/wizard-footsteps-browser.mjs` dengan server lokal untuk memeriksa langkah, urutan lapisan, perubahan ukuran, interaksi formulir, dan siklus animasi di Chromium dan WebKit.
