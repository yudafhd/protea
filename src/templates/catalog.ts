export interface ThemeHighlight {
  label: string;
  value: string;
}

export interface CatalogTheme {
  id: string;
  name: string;
  category: "all" | "parallax" | "3d-interactive" | "botanical" | "minimal";
  categoryLabel: string;
  badge: string;
  subtitle: string;
  description: string;
  couple: string;
  weddingDate: string;
  location: string;
  route: string;
  previewImage: string;
  palette: string[];
  features: string[];
  highlights: ThemeHighlight[];
}

export const CATALOG_CATEGORIES = [
  { id: "all", label: "Semua Tema" },
  { id: "parallax", label: "Sinematik Parallax" },
  { id: "3d-interactive", label: "3D & Interaktif" },
  { id: "botanical", label: "Botani & Romantis" },
  { id: "minimal", label: "Minimalis Editorial" },
] as const;

export const THEME_CATALOG: CatalogTheme[] = [
  {
    id: "wizard",
    name: "A Love Beyond Magic",
    category: "parallax",
    categoryLabel: "Sinematik Parallax",
    badge: "Baru · Wizard Wedding",
    subtitle: "Dua Dunia, Satu Cerita Cinta",
    description: "Undangan bernuansa dunia sihir dengan kastil berkabut, burung hantu pembawa surat, panji burgundy, dan potret pasangan dalam komposisi paralaks berlapis.",
    couple: "Yuda & Putri",
    weddingDate: "Senin, 2 November 2026",
    location: "Sooko, Mojokerto",
    route: "/templates/wizard",
    previewImage: "/assets/wizard/preview.webp",
    palette: ["#410d12", "#956b37", "#efe3cd", "#30201d"],
    features: ["Paralaks Berlapis", "Nama Tamu Personal", "Kalender & Petunjuk Arah", "RSVP Digital"],
    highlights: [
      { label: "Gaya", value: "Wizard, Sepia, Burgundy" },
      { label: "Interaksi", value: "Scroll & Gerakan Pointer" },
      { label: "Format", value: "Portrait Responsif" },
      { label: "Aksesibilitas", value: "Pengurangan Animasi" },
    ],
  },
  {
    id: "grand-hall",
    name: "Grand Hall",
    category: "3d-interactive",
    categoryLabel: "3D & Interaktif",
    badge: "MVP · Portrait 3D",
    subtitle: "Perayaan di Bawah Cahaya Lentera",
    description: "Undangan portrait dengan satu karakter yang menyusuri hall gothic, lentera gantung, dan tiga kepingan informasi acara.",
    couple: "Yuda & Putri",
    weddingDate: "Sabtu, 12 Desember 2026",
    location: "The Sage House, Bandung",
    route: "/templates/grand-hall",
    previewImage: "/assets/models/grand-hall/preview.png",
    palette: ["#101c29", "#527d99", "#e5d1a7", "#bc7439"],
    features: ["Portrait-First", "1 Scene Blender GLB", "1 Karakter", "3 Titik Undangan"],
    highlights: [
      { label: "Teknologi", value: "Blender GLB + R3F" },
      { label: "Nuansa", value: "Gothic, Hangat, Magis" },
      { label: "Interaksi", value: "Tap-to-Walk" },
      { label: "Format", value: "Portrait Mobile" },
    ],
  },
  {
    id: "woodland",
    name: "Woodland Reverie",
    category: "parallax",
    categoryLabel: "Sinematik Parallax",
    badge: "✨ Sinematik Terpopuler",
    subtitle: "Petualangan Kisah Cinta di Hutan Pinus & Lembah Awan",
    description:
      "Pengalaman undangan berkesinambungan dengan ilustrasi multi-layer 2.5D. Tamu diajak menyusuri jalan setapak hutan berkabut, taman bunga bermekaran, hingga lembah awan dengan efek partikel keemasan yang lembut dan alur cerita yang hidup.",
    couple: "Adrian & Isabella",
    weddingDate: "Sabtu, 24 Oktober 2026",
    location: "Pine Hill Forest Pavilion, Lembang",
    route: "/templates/woodland",
    previewImage: "/assets/woodland/forest-preview.webp",
    palette: ["#526344", "#f6f3eb", "#c9a86a", "#3c4739"],
    features: [
      "Multi-layer Parallax 2.5D",
      "Efek Partikel Emas Melayang",
      "Soundtrack Akustik Terintegrasi",
      "RSVP Digital & Peta Lokasi",
    ],
    highlights: [
      { label: "Teknologi", value: "Parallax Depth Engine" },
      { label: "Nuansa", value: "Hangat, Dongeng, Romantis" },
      { label: "Kompatibilitas", value: "Ponsel, Tablet, & Desktop" },
      { label: "Durasi Cerita", value: "4 Babak Eksplorasi" },
    ],
  },
  {
    id: "enchanted",
    name: "Enchanted Vows",
    category: "3d-interactive",
    categoryLabel: "3D & Interaktif",
    badge: "🔮 3D Mini-Game Interaktif",
    subtitle: "Jelajahi Lorong Sihir Penuh Lentera Malam & Kepingan Cinta",
    description:
      "Undangan mini-game 3D WebGL real-time yang memukau. Tamu dapat menggerakkan karakter di lorong berbatu misterius, menyalakan lentera harapan, membuka fragmen surat cinta, dan mengirimkan restu dengan cara yang belum pernah ada sebelumnya.",
    couple: "Arthur & Genevieve",
    weddingDate: "Senin, 02 November 2026",
    location: "The Grand Conservatory & Mystic Hall",
    route: "/templates/enchanted",
    previewImage: "/assets/enchanted/preview.jpg",
    palette: ["#1e142b", "#2b3562", "#e6c265", "#d4af37"],
    features: [
      "Eksplorasi Karakter 3D Real-Time",
      "Kontrol D-Pad / Keyboard / Sentuh",
      "Koleksi 6 Kepingan Surat Undangan",
      "Audio Suasana Kastil Sihir",
    ],
    highlights: [
      { label: "Teknologi", value: "Three.js Spatial 3D" },
      { label: "Nuansa", value: "Misterius, Megah, Magis" },
      { label: "Interaksi", value: "Third-Person Walk & Orbit" },
      { label: "Koleksi", value: "6 Titik Kepingan Cerita" },
    ],
  },
  {
    id: "botanical",
    name: "Botanical Reverie",
    category: "botanical",
    categoryLabel: "Botani & Romantis",
    badge: "🌿 Elegan & Abadi",
    subtitle: "Keindahan Alami Bunga Liar & Bingkai Arsitektur Klasik",
    description:
      "Sentuhan botani abadi dengan transisi kedalaman spasial yang anggun. Dihiasi ilustrasi ranting daun organik, lengkungan klasik bertekstur, potret cinta pasangan, dan narasi puitis yang menyentuh hati setiap tamu.",
    couple: "Julian & Clara",
    weddingDate: "Minggu, 18 September 2026",
    location: "Villa Botanica Glasshouse, Bogor",
    route: "/templates/botanical",
    previewImage: "/assets/botanical/couple.webp",
    palette: ["#7b8867", "#c49282", "#f8f6f0", "#3c4739"],
    features: [
      "Transisi Kamera Spasial Halus",
      "Bingkai Lengkung Botani Organik",
      "Kisah Perjalanan & Jadwal Acara",
      "Reservasi RSVP Instan",
    ],
    highlights: [
      { label: "Teknologi", value: "Spatial Canvas Layering" },
      { label: "Nuansa", value: "Organik, Tenang, Elegan" },
      { label: "Gaya Tipografi", value: "Serif & Modern UI" },
      { label: "Audio", value: "String Quartet Romance" },
    ],
  },
  {
    id: "minimal",
    name: "Modern Vow",
    category: "minimal",
    categoryLabel: "Minimalis Editorial",
    badge: "🏛️ Minimalis Editorial",
    subtitle: "Kemurnian Garis Modern dan Tipografi Bersih Abadi",
    description:
      "Didedikasikan bagi pasangan yang mencintai kesederhanaan kontemporer yang berkelas. Menampilkan proporsi arsitektur modern, kontras tipografi berstandar editorial haute-couture, dan alur informasi yang rapi dan nyaman dibaca.",
    couple: "Oliver & Sophie",
    weddingDate: "Sabtu, 12 Desember 2026",
    location: "The Glasshouse Studio, Jakarta Selatan",
    route: "/templates/minimal",
    previewImage: "/assets/minimal/preview.jpg",
    palette: ["#a88b73", "#232220", "#f4f0e6", "#716e67"],
    features: [
      "Tipografi Editorial Kontemporer",
      "Tata Letak Geometris Presisi",
      "Panduan Dress Code & Acara",
      "Formulir Konfirmasi Tamu Elegan",
    ],
    highlights: [
      { label: "Teknologi", value: "Editorial Spatial Layout" },
      { label: "Nuansa", value: "Modern, Bersih, Berkelas" },
      { label: "Tipografi", value: "Studio Sans & Garamond" },
      { label: "Fokus", value: "Tipografi & Kejelasan Informasi" },
    ],
  },
];
