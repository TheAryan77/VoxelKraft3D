/**
 * The only place 3D model files are referenced.
 *
 * To add a model: optimise it (see README), drop it in /public/models/<slot-id>.glb
 * and set `src` below. A slot with `src: null` renders a procedural placeholder.
 */

/** Self-hosted Draco decoder (copied from three/examples/jsm/libs/draco/gltf). */
export const DRACO_DECODER_PATH = "/draco/";

export type ModelSlotId =
  | "hero-print"
  | "hotend"
  | "service-prototype"
  | "service-custom"
  | "service-functional"
  | "service-miniature"
  | "service-architectural"
  | "work-01" | "work-02" | "work-03" | "work-04" | "work-05" | "work-06"
  | "cta-object";

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
  "hotend":                { src: null, placeholder: "nozzle",   label: "Printer nozzle / hotend (optional)" },
  // "Mercedes car" by funkyJeans on Sketchfab (CC BY 4.0, credited in the footer). 308k -> 53k triangles. Angled to a 3/4 view.
  "service-prototype":     { src: "/models/service-prototype-car.glb", finish: "wireframe", placeholder: "box", autoRotate: true, rotation: [0, 0.85, 0], margin: 0.44, lift: 0.08, label: "Service: Prototyping" },
  // "Human face" by thunk3d.scanner on Sketchfab (CC BY 4.0, credited in the footer). Simplified from 804k to 56k triangles.
  "service-custom":        { src: "/models/service-custom.glb", finish: "wireframe", placeholder: "figure", autoRotate: true, margin: 0.82, label: "Service: Custom models" },
  // "Steampunk Gear" by Darren McNerney 3D on Sketchfab (CC BY 4.0, credited in the footer). Turned 90° to face the camera.
  "service-functional":    { src: "/models/service-functional.glb", finish: "wireframe", placeholder: "gear", autoRotate: true, rotation: [0, Math.PI / 2, 0], label: "Service: Functional parts" },
  // "BatMinion" by Bernardo de Aquino on Sketchfab (CC BY 4.0, credited in the footer). Simplified from 209k to 59k triangles.
  "service-miniature":     { src: "/models/service-miniature.glb", finish: "wireframe", placeholder: "figure", autoRotate: true, margin: 0.72, label: "Service: Miniatures" },
  // "Medieval house" by Vanuartw on Sketchfab (CC BY 4.0, credited in the footer). 23 MB -> 705 KB: textures 512px, tangents stripped.
  "service-architectural": { src: "/models/service-architectural.glb", finish: "wireframe", placeholder: "building", autoRotate: true, margin: 0.88, lift: 0.05, label: "Service: Architectural" },
  "work-01":               { src: null, placeholder: "vase",     label: "Portfolio piece 1" },
  "work-02":               { src: null, placeholder: "figure",   label: "Portfolio piece 2" },
  "work-03":               { src: null, placeholder: "gear",     label: "Portfolio piece 3" },
  "work-04":               { src: null, placeholder: "building", label: "Portfolio piece 4" },
  "work-05":               { src: null, placeholder: "box",      label: "Portfolio piece 5 (optional)" },
  "work-06":               { src: null, placeholder: "torus",    label: "Portfolio piece 6 (optional)" },
  "cta-object":            { src: null, placeholder: "torus",    autoRotate: true, label: "Final CTA object (optional, can reuse hero)" },
};
