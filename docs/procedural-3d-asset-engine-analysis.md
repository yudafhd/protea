# Analisis: Procedural 3D Asset Engine

Dokumen ini menerjemahkan [spesifikasi sumber](./procedural-3d-asset-engine-spec.md) menjadi keputusan arsitektur dan urutan kerja untuk codebase Protea. Spesifikasi sumber adalah *north star* produk; dokumen ini bukan pengganti detailnya.

## Ringkasan keputusan

Target yang diminta bukan renderer JSON generik, melainkan bahasa pemodelan 3D tervalidasi yang dapat diproduksi AI dan dieksekusi secara deterministik oleh Three.js. Bentuk sistem yang paling tepat adalah hibrida: geometry procedural untuk hard-surface dan bentuk organik parametrik, dengan GLB sebagai jalur aset kompleks.

Kualitas visual harus menjadi hasil satu pipeline utuh—geometry, material, surface detail, lighting, environment, camera, imperfection, motion, dan color management—bukan atribut dari geometry saja.

## Posisi codebase saat ini

Protea sudah memiliki beberapa fondasi teknik yang relevan:

- Zod dan fungsi `parseExperience()` sudah digunakan untuk validasi dokumen pengalaman.
- Dunia `magic` membuktikan bahwa Shape/Extrude, TubeGeometry, BufferGeometry, instancing, shader noise, multi-light setup, dan animasi dapat berjalan di runtime yang sekarang.
- Canvas-level error boundary dan fallback HTML sudah tersedia.
- React Three Fiber dan Drei sudah terpasang, sehingga engine tidak perlu dimulai dari renderer mentah.

Namun kemampuan tersebut masih berupa komponen React yang ditulis manual. Belum ada recipe aset yang dapat mendeskripsikan, memvalidasi, lalu membangun objek yang sama secara data-driven.

Kesenjangan utama:

- `experienceSchema` adalah schema layout undangan versi 1, bukan schema pemodelan aset.
- Tipe layer `model` sudah diizinkan schema, tetapi `LayerRenderer` belum memiliki jalur render model.
- Belum ada versioned asset recipe, capability registry, semantic validation, atau fallback per geometry/modifier.
- Belum ada abstraction umum untuk profile, extrude, lathe, sweep/tube, modifier stack, CSG, atau GLB.
- Material procedural yang ada masih lokal pada dunia `magic`; belum menjadi material library berbasis recipe.
- Environment/PMREM dan konfigurasi color pipeline eksplisit belum tampak pada Canvas utama.
- Error boundary yang ada menangani kegagalan Canvas secara keseluruhan, belum isolasi kegagalan per aset, diagnostic code, atau debug overlay.
- Belum ada acceptance test visual, performance budget, atau golden recipe untuk mengukur istilah “berkualitas tinggi” dan “realistis”.

## Keputusan arsitektur yang disarankan

### 1. Pisahkan asset recipe dari experience document

Jangan memperbesar `experienceSchema` menjadi bahasa modeling. Buat domain tersendiri, misalnya `AssetRecipeV1`, lalu biarkan layer `model` merujuk ke recipe inline atau ID aset. Pemisahan ini menjaga template undangan tetap stabil dan memungkinkan engine dipakai di luar produk undangan.

Kontrak minimum recipe sebaiknya mencakup:

- metadata: `version`, `id`, `units`, `upAxis`, dan seed;
- hierarchy komponen dengan transform dan nama semantik;
- geometry sebagai discriminated union;
- modifier stack yang urut dan tervalidasi per jenis geometry;
- material references dan material library;
- detail/surface treatment;
- scene presentation: environment, lighting, camera;
- optional animation, physics, interaction, dan GLB resource;
- quality/performance hints seperti segment budget, LOD, dan shadow policy.

### 2. Gunakan pipeline compile, bukan eksekusi JSON langsung

Alur runtime yang aman:

`unknown input -> structural parse -> semantic validation -> capability check -> normalized IR -> resource plan -> Three.js objects`

Structural validation memastikan bentuk data benar. Semantic validation menangani hubungan antarnilai, misalnya profile tertutup untuk extrude atau modifier yang kompatibel. Capability check mencegah recipe memakai fitur yang tidak tersedia. Normalized intermediate representation memberi default eksplisit dan membuat hasil deterministik.

`customMesh` tidak boleh berarti JavaScript/shader arbitrer dari AI. Ia harus berupa format data terbatas, ukuran dibatasi, dan indeks/atribut diverifikasi untuk menghindari crash, alokasi berlebih, atau eksekusi kode.

### 3. Perlakukan realism sebagai preset dan sistem kualitas

Environment, studio lights, tone mapping, shadow policy, dan camera harus dapat dipakai sebagai preset tervalidasi. Material juga sebaiknya menggunakan preset semantik (`wood`, `brushedMetal`, `cloth`, dan seterusnya) yang dapat dioverride secara terkontrol. Ini memberi AI vocabulary yang stabil dan hasil yang lebih konsisten daripada membiarkannya menebak semua angka.

Imperfection harus seeded agar render dapat direproduksi, di-cache, dan diuji. Detail mikro perlu menggunakan texture/shader/normal variation bila memungkinkan; menambah geometry untuk setiap goresan akan cepat merusak performa.

### 4. Jadikan hybrid sebagai bagian schema sejak awal

Walaupun GLB berada di prioritas implementasi lebih akhir, tipe resource dan node `gltf` perlu dirancang sejak schema v1 agar tidak memerlukan perubahan kontrak besar. Runtime loader-nya dapat awalnya menghasilkan placeholder yang jelas bila kapabilitas belum aktif.

## Urutan implementasi yang lebih aman

1. **Kontrak dan kualitas** — definisikan vocabulary, versioning, koordinat/satuan, seed, batas resource, error codes, fixture, dan target performa/visual.
2. **Vertical slice pertama** — schema + validator + compiler kecil untuk profile/extrude/lathe/tube, transform hierarchy, PBR material dasar, fallback, dan satu layer model yang benar-benar dirender.
3. **Visual foundation** — bevel yang konsisten, material presets, procedural maps, studio lighting, Environment/PMREM, ACES/sRGB, camera presets, dan shadow policy.
4. **Detail dan skala** — instancing, LOD/performance guards, imperfection seeded, seams/grooves/decals, cache, serta disposal lifecycle.
5. **Ekstensi modeling** — modifier tambahan, CSG, GLB, animation, lalu physics. CSG dan subdivision sebaiknya masuk setelah topology/error behavior teruji karena risikonya lebih tinggi.
6. **AI authoring** — prompt/image analysis ke recipe hanya setelah schema, validator, compiler, dan diagnostics stabil. AI harus memilih teknik dari capability manifest, bukan mengarang API Three.js.

Vertical slice pertama sebaiknya menggunakan tiga golden assets yang mewakili masalah berbeda: pedang (profile/extrude/bevel/metal), vas atau trophy (lathe/material), dan bunga sederhana (curve/tube/instancing/motion). Ini menguji bahasa modeling tanpa langsung membangun seluruh daftar fitur.

## Kriteria selesai yang perlu ditambahkan

Spesifikasi sangat kuat sebagai arah visual, tetapi kata “realistis” belum dapat diuji. Setiap milestone sebaiknya memiliki ukuran berikut:

- recipe invalid tidak pernah menjatuhkan seluruh Canvas dan selalu menghasilkan diagnostic terstruktur;
- output deterministik untuk recipe dan seed yang sama;
- golden recipes lolos unit test schema/compiler dan visual regression pada viewport tetap;
- tidak ada resource leak setelah mount/unmount atau pergantian recipe;
- batas vertex, texture size, light count, draw calls, dan waktu frame ditetapkan per tier perangkat;
- fallback terlihat jelas saat fitur/resource gagal;
- seluruh material memakai color-space yang benar dan preset render yang konsisten;
- aksesibilitas/fallback non-WebGL tetap tersedia untuk konteks invitation player.

## Risiko utama

- **Scope terlalu lebar.** Modeling, material authoring, rendering, physics, dan AI generation adalah beberapa produk sekaligus. Vertical slice wajib mendahului feature breadth.
- **Modifier universal sulit diwujudkan.** Bevel, bend, subdivision, dan CSG tidak aman untuk semua topology; compatibility matrix perlu menjadi bagian capability system.
- **Kualitas versus perangkat mobile.** Protea saat ini juga menargetkan pengalaman interaktif; kualitas desktop tidak boleh diam-diam menjadi baseline mobile.
- **Schema mengunci terlalu dini.** Gunakan versioning, discriminated unions, dan normalized IR agar format publik tidak terikat langsung pada constructor Three.js.
- **AI menghasilkan data valid tetapi buruk.** Validator struktural tidak cukup; diperlukan semantic constraints, bounded ranges, presets, examples, dan evaluasi visual.

## Kesimpulan

Instruksi ini layak dijadikan arah baru engine, dan sebagian proof-of-concept sudah ada di folder `src/components/magic`. Langkah berikut yang paling bernilai bukan langsung menambah CSG atau physics, melainkan menetapkan kontrak `AssetRecipeV1` beserta validator, capability registry, diagnostics, dan satu end-to-end renderer. Setelah itu kualitas visual dapat dibangun sebagai layer sistematis di atas fondasi yang dapat diuji.
