<!--
Dokumen sumber (disimpan 2026-09-11).
Isinya dipertahankan dari instruksi yang diberikan pengguna dan menjadi product/architecture brief.
-->

TUJUAN

Membangun sistem procedural 3D berbasis Three.js yang mampu menghasilkan aset 3D berkualitas tinggi dan terasa realistis, tanpa selalu bergantung pada file GLB. Target sistem bukan sekadar JSON viewer atau kumpulan primitive, tetapi sebuah Procedural 3D Asset Engine yang dapat digunakan AI untuk membangun objek dari recipe terstruktur.

KESIMPULAN UTAMA

Kualitas visual seperti ThreeUI / Meng To bukan berasal dari Three.js saja.

Realism lebih tepat dianggap sebagai kombinasi:

Geometry

* Material
* Surface Detail
* Lighting
* Environment
* Camera
* Imperfection
* Motion
* Color Management

Three.js berfungsi sebagai renderer, scene engine, interaction engine, dan runtime untuk menyatukan semua komponen tersebut.

1. GLB TIDAK WAJIB

Tidak semua aset harus dibuat di Blender lalu di-export menjadi GLB.

Objek seperti:

* pedang
* koin
* trophy
* meja
* lemari
* rak
* lampu
* bangunan
* rumah isometrik
* furniture sederhana
* icon 3D
* produk hard-surface

dapat dibuat langsung melalui procedural geometry di Three.js.

Teknik utama:

* Shape
* ExtrudeGeometry
* LatheGeometry
* TubeGeometry
* BufferGeometry
* Curve
* CSG
* Instancing
* custom geometry

GLB lebih cocok digunakan untuk:

* manusia
* hewan
* wajah
* tanaman sangat realistis
* pakaian kompleks
* kain dengan lipatan rumit
* sepatu
* sculpture organik
* model yang terlalu mahal jika dibuat procedural

Arsitektur terbaik adalah hybrid:

Procedural Three.js
+
Optional GLB Assets

2. JANGAN TERLALU BERGANTUNG PADA PRIMITIVE

Pendekatan lama:

BoxGeometry
SphereGeometry
CylinderGeometry

cocok untuk blocking, tetapi hasil akhirnya mudah terlihat seperti prototype.

AI seharusnya dapat membangun bentuk melalui profile dan modifier.

Contoh pedang:

Blade
→ custom 2D profile
→ extrusion
→ taper
→ bevel
→ cutting edge
→ fuller / groove

Guard
→ custom curve
→ extrusion
→ bevel

Grip
→ cylindrical core
→ wrap detail
→ roughness variation

Pommel
→ lathe geometry

Dengan pendekatan ini AI benar-benar melakukan procedural modeling, bukan sekadar menumpuk primitive.

3. BEVEL SANGAT PENTING

Edge matematis 90 derajat membuat objek terlihat artificial.

Bevel kecil dapat menangkap highlight dari lighting sehingga bentuk terasa jauh lebih nyata.

Setiap objek sebaiknya mempertimbangkan:

* bevel
* thickness
* joints
* seams
* gaps
* reveals
* contact points

Jangan membuat surface tipis tanpa volume jika objek aslinya memiliki ketebalan.

4. MATERIAL BUKAN SEKADAR WARNA

Material seharusnya mendeskripsikan bagaimana permukaan bereaksi terhadap cahaya.

Contoh material kayu:

* base color
* roughness
* normal
* wood grain
* color variation
* micro surface variation

Metal:

* metalness
* roughness
* normal
* scratches
* environment reflection

Kain:

* albedo
* normal
* roughness
* sheen
* fiber variation

Plastik:

* roughness
* clearcoat
* subtle normal variation
* environment reflection

Engine sebaiknya mendukung procedural texture dan PBR material.

5. LIGHTING ADALAH BAGIAN DARI KUALITAS MODEL

Lighting sebaiknya diperlakukan seperti studio fotografi.

Setup umum:

Environment / HDRI
+
Key Light
+
Fill Light
+
Rim Light
+
Bounce Light

Jangan hanya menggunakan AmbientLight dan satu DirectionalLight.

Lighting harus membantu menjelaskan:

* silhouette
* bevel
* material
* depth
* separation
* volume

6. ENVIRONMENT MAP DAN PMREM

Material PBR membutuhkan environment yang bisa direfleksikan.

Pipeline:

Environment
→ PMREM
→ Environment Map
→ PBR Material

Tanpa environment yang baik, metal, kaca, plastik glossy, kain, dan material reflective akan terlihat flat.

7. COLOR PIPELINE

Renderer sebaiknya menggunakan color management yang benar.

Contoh:

renderer.outputColorSpace = THREE.SRGBColorSpace

renderer.toneMapping = THREE.ACESFilmicToneMapping

renderer.toneMappingExposure = sekitar 1.0 sampai 1.2

ACES membantu highlight dan brightness terlihat lebih natural dan lebih dekat dengan fotografi.

8. REALISM MEMBUTUHKAN BEBERAPA SKALA DETAIL

Gunakan tiga level detail:

MACRO DETAIL

* silhouette
* proportion
* bentuk utama

MESO DETAIL

* grooves
* joints
* lipatan
* panel
* lekukan
* structural detail

MICRO DETAIL

* scratches
* fiber
* normal variation
* roughness variation
* grain
* surface imperfection

Contoh pedang:

blade shape
+
fuller
+
edge
+
micro scratches

Contoh kain:

cloth shape
+
fold
+
fiber

Contoh kayu:

furniture shape
+
joint
+
wood grain

9. IMPERFECTION MEMBUAT OBJEK LEBIH NATURAL

Objek dunia nyata tidak sepenuhnya sempurna.

Gunakan variasi kecil seperti:

* subtle asymmetry
* tiny rotation variation
* surface noise
* roughness variation
* micro scratches
* edge wear
* slight color variation

Hindari noise berlebihan.

Imperfection harus halus dan terkontrol.

10. MOTION DAPAT MEMBANTU PERSEPSI MATERIAL

Beberapa material akan terasa lebih nyata ketika bergerak.

Contoh:

cloth
→ wind simulation

flower
→ gentle sway

plant
→ subtle wind movement

rope
→ spring physics

pendant
→ inertia

Motion dapat membantu pengguna memahami berat, fleksibilitas, dan jenis material suatu objek.

11. EKSPERIMEN PROCEDURAL FLOWER

Kita telah membuat prototype bunga tanpa GLB.

Jenis bunga:

* Daisy
* Tulip
* Rose
* Lily
* Sunflower

Struktur:

Flower
├── curved stem
├── procedural leaves
├── custom petal geometry
├── layered petals
├── flower center
├── PBR materials
├── studio lighting
└── subtle wind animation

Petal dapat dikontrol melalui parameter:

* length
* width
* curl
* cup
* twist
* rotation
* layer
* count

Contoh konsep recipe:

{
"type": "flower",
"species": "rose",
"petalLayers": 5,
"petalCount": 40,
"petal": {
"length": 0.8,
"width": 0.35,
"curl": 0.18,
"cup": 0.3
}
}

Ini membuktikan bahwa objek organik tertentu juga dapat dibuat secara procedural tanpa GLB.

12. PELAJARAN DARI BUG PROTOTYPE

Prototype bunga sempat gagal render karena menggunakan geometry yang tidak tersedia di runtime.

Karena itu engine harus memiliki:

* schema validation
* supported feature validation
* geometry capability check
* fallback geometry
* runtime error boundary
* visible debug overlay
* graceful failure

Recipe yang dihasilkan AI tidak boleh langsung dieksekusi tanpa validasi.

13. SCHEMA JSON LAMA TERLALU SEDERHANA

Schema lama seperti:

{
"type": "box",
"position": [],
"rotation": [],
"scale": []
}

tidak cukup untuk membuat aset berkualitas tinggi.

Schema baru sebaiknya mendukung:

Asset

geometry

* primitive
* profile
* extrude
* lathe
* tube
* curve
* sweep
* customMesh
* csg
* gltf

modifiers

* bevel
* taper
* bend
* twist
* noise
* subdivision
* mirror
* array

material

* albedo
* roughness
* metalness
* normal
* ao
* clearcoat
* sheen
* transmission
* emissive

detail

* seams
* grooves
* scratches
* decals
* edgeWear
* surfaceVariation

environment

lighting

camera

animation

physics

interaction

14. ENGINE HARUS MEMILIH TEKNIK MODELING

AI tidak boleh selalu menggunakan metode yang sama.

Flow ideal:

User Prompt / Image Reference
↓
Shape Analysis
↓
Object Decomposition
↓
Material Analysis
↓
Technique Selection
↓

Hard Surface
→ Procedural Geometry

Organic Simple
→ Parametric Procedural Geometry

Complex Organic
→ GLB

Mixed Scene
→ Procedural + GLB

15. TARGET ARSITEKTUR SISTEM

Sistem sebaiknya menjadi:

AI
↓
3D Recipe
↓
Recipe Validator
↓
Procedural 3D Engine
↓
Three.js Runtime
↓
Rendered Scene

Three.js runtime akan menerjemahkan recipe menjadi:

* geometry
* materials
* procedural textures
* environment
* lighting
* camera
* animation
* physics
* interaction

16. TARGET AKHIR PROJECT

Target project bukan:

JSON Viewer Three.js

melainkan:

Procedural 3D Asset Engine

Engine tersebut nantinya dapat digunakan untuk membuat:

* pedang
* koin
* trophy
* furniture
* kamar
* rumah isometrik
* bunga
* tanaman sederhana
* icon 3D
* product visualization
* interactive web object
* decorative object
* architecture
* game-like scene

17. PRIORITAS IMPLEMENTASI

Urutan pengembangan yang disarankan:

1. Recipe schema baru
2. Recipe validator
3. Profile geometry
4. Extrude system
5. Lathe system
6. Tube / sweep system
7. Bevel system
8. CSG
9. Material library
10. Procedural texture generator
11. Environment / PMREM
12. Studio lighting preset
13. ACES color pipeline
14. Detail / imperfection system
15. GLB loader
16. Animation
17. Physics
18. Camera presets
19. AI recipe generator
20. Image reference → recipe analysis

PRINSIP UTAMA

Jangan meminta AI:

"buat model 3D menggunakan Three.js"

Tetapi berikan AI bahasa modeling yang jelas:

"analisis bentuk, pecah objek menjadi komponen, tentukan profile, extrusion, lathe, curve, bevel, material, detail permukaan, environment, lighting, dan animation, kemudian hasilkan recipe yang tervalidasi."

Target akhirnya adalah membuat AI mempunyai bahasa 3D yang cukup kaya untuk membangun objek secara sistematis, bukan sekadar menebak kombinasi BoxGeometry, CylinderGeometry, dan SphereGeometry.
