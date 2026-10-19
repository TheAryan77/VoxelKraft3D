export type ServiceCategory = "prototyping" | "custom" | "functional" | "miniatures" | "architectural";

export interface Service {
  id: ServiceCategory;
  title: string;
  description: string;
}

/** What we make. Feeds the quote form's category field. */
export const services: Service[] = [
  {
    id: "prototyping",
    title: "Prototyping",
    description: "Test fit and form before you invest in production.",
  },
  {
    id: "custom",
    title: "Custom models",
    description: "Gifts, name plates, replicas, anything you can describe.",
  },
  {
    id: "miniatures",
    title: "Miniatures",
    description: "Detailed figures and collectibles for tabletop and display.",
  },
  {
    id: "functional",
    title: "Functional parts",
    description: "Brackets, clips, replacement parts that actually get used.",
  },
  {
    id: "architectural",
    title: "Architectural",
    description: "Scale models for presentations and students.",
  },
];

/** Options for the quote form's category field. */
export const categoryOptions: { value: ServiceCategory | "other"; label: string }[] = [
  ...services.map((s) => ({ value: s.id, label: s.title })),
  { value: "other", label: "Something else" },
];
