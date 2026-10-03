import type { ModelSlotId } from "@/lib/models.config";

export type ServiceCategory = "prototyping" | "custom" | "functional" | "miniatures" | "architectural";

export interface Service {
  id: ServiceCategory;
  title: string;
  description: string;
  modelId: ModelSlotId;
  /** Bento layout: the Prototyping tile spans two columns. */
  span?: 2;
}

/** Order matches the bento layout: row 1 then row 2. */
export const services: Service[] = [
  {
    id: "prototyping",
    title: "Prototyping",
    description: "Test fit and form before you invest in production.",
    modelId: "service-prototype",
    span: 2,
  },
  {
    id: "custom",
    title: "Custom models",
    description: "Gifts, name plates, replicas, anything you can describe.",
    modelId: "service-custom",
  },
  {
    id: "miniatures",
    title: "Miniatures",
    description: "Detailed figures and collectibles for tabletop and display.",
    modelId: "service-miniature",
  },
  {
    id: "functional",
    title: "Functional parts",
    description: "Brackets, clips, replacement parts that actually get used.",
    modelId: "service-functional",
  },
  {
    id: "architectural",
    title: "Architectural",
    description: "Scale models for presentations and students.",
    modelId: "service-architectural",
  },
];

/** Options for the quote form's category field. */
export const categoryOptions: { value: ServiceCategory | "other"; label: string }[] = [
  ...services.map((s) => ({ value: s.id, label: s.title })),
  { value: "other", label: "Something else" },
];
