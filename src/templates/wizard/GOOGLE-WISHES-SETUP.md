# Menampilkan ucapan dari Google Form

Daftar menampilkan maksimal tiga kartu ucapan dalam satu area. Ucapan berikutnya dapat dilihat dengan menggulir daftar, termasuk melalui keyboard saat daftar mendapat fokus. Tinggi area mengikuti tiga kartu pertama dan menyesuaikan ukuran layar.

Tampilan Ucapan & Doa menggantikan kutipan, nama pasangan, dan tanggal di area penutup RSVP. Daftar mengambil nama serta jawaban Ucapan & Doa yang sudah benar-benar dikirim melalui Google Form, terbaru lebih dahulu (maksimal 100). Respons tanpa ucapan dilewati. Email, jumlah tamu, dan jawaban lain tidak ditampilkan.

Tautan pengisian `forms.gle` tidak menyediakan akses membaca respons. Pemilik form perlu memasang penghubung berikut melalui akun Google miliknya.

1. Buka Google Form dalam mode **edit**, lalu buka **More / tiga titik → Script editor / Apps Script**.
2. Salin isi [wizard-wishes-google-apps-script.gs](../../../scripts/wizard-wishes-google-apps-script.gs) ke `Code.gs`, lalu simpan. Pertahankan judul pertanyaan **Nama Lengkap** dan **Ucapan & Doa** atau sesuaikan judul dalam script.
3. Pilih fungsi **setupWizardWishes**, klik **Run / Jalankan**, lalu izinkan akses ke form. Ini mencatat ID form dari editor; ID tautan pengisian bukan penggantinya.
4. Pilih **Deploy → New deployment → Web app**. Atur **Execute as: Me** dan **Who has access: Anyone**, lalu deploy. Feed ini hanya mengeluarkan nama dan ucapan yang akan tampil publik di undangan.
5. Salin URL deployment berakhiran `/exec`, lalu isi variabel server pada `.env.local` (atau pengaturan lingkungan hosting):

   ```dotenv
   WIZARD_WISHES_URL=https://script.google.com/macros/s/ID_DEPLOYMENT/exec
   ```

6. Jalankan ulang server lokal, atau terapkan ulang konfigurasi pada hosting. Buka menu RSVP; gulir ke Ucapan & Doa. Gunakan Perbarui ucapan setelah mengirim Google Form. Daftar juga diperbarui saat kembali ke tab undangan dan setiap 60 detik selama bagian RSVP aktif.

Tanpa URL deployment, area ini menampilkan pesan kosong; belum ada respons asli yang diambil. Jika koneksi gagal, tersedia tombol untuk mencoba kembali. Respons dirender sebagai teks sehingga HTML pada ucapan tidak dijalankan. Saat memperbarui script Google, buat versi deployment baru melalui Manage deployments agar `/exec` menggunakan kode terbaru.

Rujukan Google: [deploy web app](https://developers.google.com/apps-script/guides/web), [FormApp](https://developers.google.com/apps-script/reference/forms/form-app), [FormResponse](https://developers.google.com/apps-script/reference/forms/form-response).
