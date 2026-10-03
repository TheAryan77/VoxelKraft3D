import { z } from "zod";
import { categoryOptions } from "@/content/services";
import { materialOptions } from "@/content/materials";
import { quoteCopy } from "@/content/site";

/** Shared by the form and /api/quote so both reject the same things. */

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MODEL_EXTENSIONS = ["stl", "obj", "3mf", "step", "stp"] as const;
export const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png"] as const;
const ALLOWED = new Set<string>([...MODEL_EXTENSIONS, ...PHOTO_EXTENSIONS]);

/** For the file input's accept attribute. */
export const ACCEPT_ATTR = [...MODEL_EXTENSIONS, ...PHOTO_EXTENSIONS].map((e) => `.${e}`).join(",");

export function fileExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export type FileError = keyof Pick<typeof quoteCopy.errors, "fileTooLarge" | "fileType" | "tooManyFiles">;

export function validateFile(file: { name: string; size: number }): FileError | null {
  if (!ALLOWED.has(fileExtension(file.name))) return "fileType";
  if (file.size > MAX_FILE_BYTES) return "fileTooLarge";
  return null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s()-]{7,20}$/;

const categoryValues = categoryOptions.map((o) => o.value) as [string, ...string[]];
const materialValues = materialOptions.map((o) => o.value) as [string, ...string[]];

const e = quoteCopy.errors;

export const quoteSchema = z.object({
  name: z.string().trim().min(1, e.name).max(120, e.name),
  contact: z
    .string()
    .trim()
    .refine((v) => EMAIL.test(v) || (PHONE.test(v) && v.replace(/\D/g, "").length >= 7), e.contact),
  category: z.enum(categoryValues, e.category),
  material: z.enum(materialValues, e.material),
  quantity: z.number(e.quantity).int(e.quantity).min(1, e.quantity).max(1000, e.quantity),
  colour: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export type QuoteFields = z.infer<typeof quoteSchema>;
