export type MaterialId = "pla" | "petg" | "abs" | "tpu" | "resin";

export interface MaterialSurface {
  color: string;
  roughness: number;
  metalness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  transmission?: number;
  thickness?: number;
  ior?: number;
  sheen?: number;
  sheenColor?: string;
  /** Faint horizontal layer lines from FDM printing. Resin prints are smooth. */
  layerLines: boolean;
  /** Sphere squashes slightly on hover. */
  squash?: boolean;
}

export interface Material {
  id: MaterialId;
  name: string;
  summary: string;
  bestFor: string;
  /** 1 to 5 */
  properties: { strength: number; flexibility: number; detail: number; heat: number };
  surface: MaterialSurface;
}

export const materials: Material[] = [
  {
    id: "pla",
    name: "PLA",
    summary: "Matte, easy to print and available in the most colours.",
    bestFor: "Display models, prototypes, gifts",
    properties: { strength: 3, flexibility: 1, detail: 4, heat: 1 },
    surface: { color: "#d9d1c4", roughness: 0.6, sheen: 0.4, sheenColor: "#fff2e0", layerLines: true },
  },
  {
    id: "petg",
    name: "PETG",
    summary: "Glossy and tough, with a little give. Handles water and sunlight.",
    bestFor: "Outdoor parts, containers, brackets",
    properties: { strength: 4, flexibility: 2, detail: 3, heat: 3 },
    surface: { color: "#8fa9b1", roughness: 0.15, transmission: 0.35, thickness: 1.2, ior: 1.57, layerLines: true },
  },
  {
    id: "abs",
    name: "ABS",
    summary: "Satin finish, strong and heat resistant. Can be sanded and smoothed.",
    bestFor: "Enclosures, car parts, tools",
    properties: { strength: 4, flexibility: 2, detail: 3, heat: 4 },
    surface: { color: "#4a4541", roughness: 0.4, layerLines: true },
  },
  {
    id: "tpu",
    name: "TPU",
    summary: "Soft and rubbery. Bends, squashes and springs back.",
    bestFor: "Gaskets, phone cases, grips",
    properties: { strength: 3, flexibility: 5, detail: 2, heat: 2 },
    surface: { color: "#2f2d2b", roughness: 0.8, sheen: 0.6, sheenColor: "#5a554f", layerLines: true, squash: true },
  },
  {
    id: "resin",
    name: "Resin",
    summary: "Smooth, sharp detail with no visible layers. More brittle than filament.",
    bestFor: "Miniatures, jewellery masters, fine detail",
    properties: { strength: 2, flexibility: 1, detail: 5, heat: 2 },
    surface: { color: "#b9ad9b", roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, layerLines: false },
  },
];

export const materialOptions = [
  ...materials.map((m) => ({ value: m.id, label: m.name })),
  { value: "not-sure", label: "Not sure" },
] as const;
