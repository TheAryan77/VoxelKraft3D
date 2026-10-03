import type { MaterialId } from "@/content/materials";
import type { ModelSlotId } from "@/lib/models.config";

export interface StlDims {
  x: number;
  y: number;
  z: number;
}

/** Per-slot camera framing. */
export interface Framing {
  /** Space around the model; 1 = edge to edge. Default 1.2. */
  margin?: number;
  /** Raise the model in the frame, as a fraction of the slot height. */
  lift?: number;
}

/**
 * What a slot should render, as plain data. Keeping this free of three.js
 * imports lets DOM components describe scenes without pulling three into the
 * main bundle.
 */
export type SlotSceneDescriptor =
  | {
      kind: "model";
      id: ModelSlotId;
      mode?: "default" | "print-reveal";
      interactive?: boolean;
      active?: boolean;
      parallax?: boolean;
      hotend?: boolean;
      framing?: Framing;
      onFail?: () => void;
    }
  | { kind: "material"; materialId: MaterialId; hovered: boolean }
  | { kind: "stl"; file: File; onMeasured?: (dims: StlDims) => void; onFail?: () => void };
