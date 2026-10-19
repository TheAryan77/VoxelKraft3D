/**
 * The only place 3D model files are referenced.
 *
 * To add a model: optimise it (see README), drop it in /public/models/<slot-id>.glb
 * and set `src` below. A slot with `src: null` renders a procedural placeholder.
 */

/**
 * The hero shows these in turn, each printed in from the bottom, changing every
 * HERO_MODEL_MS. Add an id here (and its entry below) to add a model; `name`
 * labels its dot.
 */
export interface HeroModel {
  id: ModelSlotId;
  name: string;
  /** Camera framing in the hero (margin: lower = bigger; lift: raise in the frame). */
  framing?: { margin: number; lift: number };
  mobileFraming?: { margin: number; lift: number };
}

export const HERO_MODELS: HeroModel[] = [
  { id: "hero-print", name: "Castle", framing: { margin: 0.94, lift: 0.07 }, mobileFraming: { margin: 0.9, lift: 0.02 } },
  { id: "hero-face", name: "Face", framing: { margin: 1.3, lift: 0.04 }, mobileFraming: { margin: 1.15, lift: 0.02 } },
  { id: "hero-goku", name: "Goku", framing: { margin: 1.12, lift: 0.03 }, mobileFraming: { margin: 1.05, lift: 0.01 } },
  { id: "hero-ironman", name: "Iron Man", framing: { margin: 1.12, lift: 0.03 }, mobileFraming: { margin: 1.0, lift: 0.01 } },
  { id: "hero-spaceship", name: "Spaceship", framing: { margin: 1.45, lift: 0.06 }, mobileFraming: { margin: 1.1, lift: 0.02 } },
];
export const HERO_MODEL_MS = 7000;

/** Self-hosted Draco decoder (copied from three/examples/jsm/libs/draco/gltf). */
export const DRACO_DECODER_PATH = "/draco/";

export type ModelSlotId =
  | "hero-print"
  | "hero-face"
  | "hero-goku"
  | "hero-ironman"
  | "hero-spaceship"
  | "hotend"
  | "work-01" | "work-02" | "work-03" | "work-04" | "work-05" | "work-06"
  | "cta-object"
  | "journey";

/** "solid" = as exported (see `saturation`); "wireframe" = raw triangle mesh. */
export type ModelFinish = "solid" | "wireframe";

export type PlaceholderKind = "vase" | "gear" | "figure" | "box" | "building" | "nozzle" | "torus";

export interface ModelEntry {
  src: string | null;          // e.g. "/models/hero-print.glb" — null = placeholder
  poster?: string;             // static image fallback for mobile / reduced motion
  placeholder: PlaceholderKind;
  scale?: number;              // final fit is automatic; this is a fine-tune multiplier
  /**
   * Space around the model in its slot. 1.2 is the default; lower = bigger.
   * Values under 1 let a spinning model's widest angle brush the edges.
   */
  margin?: number;
  /** Raise (+) or lower (−) the model in its slot, as a fraction of slot height. */
  lift?: number;
  /** Phone-width overrides (slots are a different shape there). */
  mobileMargin?: number;
  mobileLift?: number;
  rotation?: [number, number, number];
  autoRotate?: boolean;
  /**
   * Colour saturation, 0..1. Lower values drain the model's colours toward an
   * unpainted, raw-filament look (and make it matte). Default 1 = as exported.
   */
  saturation?: number;
  /** "wireframe" shows the raw triangles over a plain body. Default "solid". */
  finish?: ModelFinish;
  /** Set to false if the file was not compressed with Draco. */
  draco?: boolean;
  label: string;               // shown in dev-mode placeholder
}

export const MODELS: Record<ModelSlotId, ModelEntry> = {
  // "Low poly medieval castle" by assetfactory on Sketchfab (Sketchfab Standard licence). Collider mesh stripped.
  "hero-print":            { src: "/models/hero-print.glb", placeholder: "vase", autoRotate: true, saturation: 0.12, finish: "wireframe", label: "Hero signature print" },
  // "Human face" by thunk3d.scanner on Sketchfab (CC BY 4.0, credited in the footer). Simplified from 804k to 56k triangles.
  "hero-face":             { src: "/models/hero-face.glb", placeholder: "figure", autoRotate: true, finish: "wireframe", label: "Hero rotation: face" },
  // "DBXV2 Goku Damaged1" by 20062020year on Sketchfab (listed CC BY 4.0, credited in the footer). Rig baked to a static pose at load.
  "hero-goku":             { src: "/models/hero-goku.glb", placeholder: "figure", autoRotate: true, finish: "wireframe", label: "Hero rotation: Goku" },
  // "Iron Man Rig" by Darth Iron on Sketchfab (Sketchfab Standard licence). Rig baked to a static pose at load.
  "hero-ironman":          { src: "/models/hero-ironman.glb", placeholder: "figure", autoRotate: true, finish: "wireframe", label: "Hero rotation: Iron Man" },
  // "Star Sparrow Modular Spaceship" by Ebal Studios on Sketchfab (Sketchfab Standard licence).
  "hero-spaceship":        { src: "/models/hero-spaceship.glb", placeholder: "box", autoRotate: true, rotation: [0, 0.75, 0], finish: "wireframe", label: "Hero rotation: spaceship" },
  "hotend":                { src: null, placeholder: "nozzle",   label: "Printer nozzle / hotend (optional)" },
  "work-01":               { src: null, placeholder: "vase",     label: "Portfolio piece 1" },
  "work-02":               { src: null, placeholder: "figure",   label: "Portfolio piece 2" },
  "work-03":               { src: null, placeholder: "gear",     label: "Portfolio piece 3" },
  "work-04":               { src: null, placeholder: "building", label: "Portfolio piece 4" },
  "work-05":               { src: null, placeholder: "box",      label: "Portfolio piece 5 (optional)" },
  "work-06":               { src: null, placeholder: "torus",    label: "Portfolio piece 6 (optional)" },
  "cta-object":            { src: null, placeholder: "torus",    autoRotate: true, label: "Final CTA object (optional, can reuse hero)" },
  // "Mercedes car" by funkyJeans on Sketchfab (CC BY 4.0, credited in the footer). 308k -> 53k triangles.
  // "From idea to object" section: shown going from raw material to a finished, coloured piece.
  // Swap `src` for any other .glb with colours or textures (the last stage shows its real materials).
  "journey":               { src: "/models/journey-car.glb", placeholder: "box", rotation: [0, 0.85, 0], label: "Idea-to-object journey" },
};
