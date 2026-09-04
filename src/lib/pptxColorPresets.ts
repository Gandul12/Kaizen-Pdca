export interface PptxColorPreset {
  id: string;
  name: string;
  description: string;
  bgPrimary: string;   // background utama slide (tanpa '#', sesuai aturan pptxgenjs)
  bgSecondary: string; // background kartu/kotak
  accent: string;      // warna aksen utama (judul kecil, ikon, garis)
  textLight: string;   // teks di atas background gelap
}

export const PPTX_COLOR_PRESETS: PptxColorPreset[] = [
  { id: "navy-gold",      name: "Navy & Gold",              description: "Default, sesuai brand website",             bgPrimary: "0D1B30", bgSecondary: "16304F", accent: "D4A94C", textLight: "F2F4F8" },
  { id: "navy-orange",    name: "Navy & Oranye",            description: "Gaya deck Kaizen klasik",                   bgPrimary: "0D1B30", bgSecondary: "16304F", accent: "E8672C", textLight: "F2F4F8" },
  { id: "charcoal-silver",name: "Charcoal & Silver",        description: "Formal, untuk presentasi ke direksi",       bgPrimary: "1C1F24", bgSecondary: "2C3038", accent: "C7CCD1", textLight: "EEF0F2" },
  { id: "steel-yellow",   name: "Steel Grey & Safety Yellow", description: "Nuansa rambu keselamatan pabrik",         bgPrimary: "3A4149", bgSecondary: "252A30", accent: "F5C400", textLight: "F2F2F2" },
  { id: "concrete-rust",  name: "Concrete & Rust",          description: "Nuansa lantai produksi & logam",            bgPrimary: "33302B", bgSecondary: "4A4640", accent: "B5502E", textLight: "E8E2D8" },
  { id: "blue-copper",    name: "Deep Blue & Copper",       description: "Formal, lebih hangat dari navy biasa",      bgPrimary: "0F2A43", bgSecondary: "173A5C", accent: "C17B4A", textLight: "F5ECE0" },
  { id: "charcoal-teal",  name: "Charcoal & Teal",          description: "Gaya deck Pattern Cutting",                 bgPrimary: "181C1F", bgSecondary: "242A2E", accent: "2BB3A3", textLight: "F0ECE2" },
  { id: "monokrom",       name: "Monokrom",                 description: "Netral, aman untuk cetak hitam-putih",      bgPrimary: "1A1A1A", bgSecondary: "3A3A3A", accent: "8A8A8A", textLight: "F5F5F5" },
];

export const DEFAULT_PRESET = PPTX_COLOR_PRESETS[0];
