"use client";

import { cursorProps } from "@/lib/cursor";
import { cloneElement, useCallback, useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUpload } from "@/components/ui/file-upload";
import { SceneSlot } from "@/components/three/SceneSlot";
import type { StlDims } from "@/components/three/types";
import { categoryOptions } from "@/content/services";
import { materialOptions } from "@/content/materials";
import { cursorCopy, quoteCopy } from "@/content/site";
import { ACCEPT_ATTR, fileExtension, quoteSchema, validateFile, type QuoteFields } from "@/lib/quote/schema";
import { quotePrefill } from "@/lib/sceneStore";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

const STL_PREVIEW = process.env.NEXT_PUBLIC_FEATURE_STL_PREVIEW === "true";

type Status = { kind: "idle" } | { kind: "submitting" } | { kind: "success" } | { kind: "error"; message: string };

export function Quote() {
  const formId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dims, setDims] = useState<StlDims | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    reset,
    formState: { errors },
  } = useForm<QuoteFields>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { name: "", contact: "", material: "not-sure", quantity: 1, colour: "", notes: "" },
  });

  // "Ask about this" and "Make something like this" pre-fill the form.
  useEffect(
    () =>
      quotePrefill.subscribe(() => {
        const p = quotePrefill.get();
        if (!p) return;
        if (p.category) setValue("category", p.category, { shouldValidate: false });
        if (p.notes) {
          const current = getValues("notes")?.trim();
          setValue("notes", current ? `${current}\n${p.notes}` : p.notes);
        }
        setStatus((s) => (s.kind === "success" ? { kind: "idle" } : s));
      }),
    [setValue, getValues],
  );

  const onFiles = useCallback((files: File[]) => {
    setDims(null);
    if (files.length === 0) {
      setFile(null);
      setFileError(null);
      return;
    }
    if (files.length > 1) {
      setFileError(quoteCopy.errors.tooManyFiles);
      return;
    }
    const error = validateFile(files[0]);
    if (error) {
      setFile(null);
      setFileError(quoteCopy.errors[error]);
      return;
    }
    setFileError(null);
    setFile(files[0]);
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    if (fileError) return;
    setStatus({ kind: "submitting" });
    const body = new FormData();
    Object.entries(values).forEach(([k, v]) => v !== undefined && body.append(k, String(v)));
    const honeypot = (document.getElementById(`${formId}-company`) as HTMLInputElement | null)?.value;
    if (honeypot) body.append("company", honeypot);
    if (file) body.append("file", file);

    try {
      const res = await fetch("/api/quote", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: Record<string, string>;
      };
      if (res.ok && data.ok) {
        setStatus({ kind: "success" });
        reset();
        setFile(null);
        setDims(null);
        return;
      }
      if (data.fieldErrors) {
        for (const [field, message] of Object.entries(data.fieldErrors)) {
          if (field === "file") setFileError(message);
          else setError(field as keyof QuoteFields, { message });
        }
        setStatus({ kind: "idle" });
        return;
      }
      setStatus({ kind: "error", message: data.error ?? quoteCopy.errors.server });
    } catch {
      setStatus({ kind: "error", message: quoteCopy.errors.server });
    }
  });

  const showPreview = STL_PREVIEW && file && fileExtension(file.name) === "stl";
  const f = quoteCopy.fields;
  const fileErrorId = `${formId}-file-error`;

  return (
    <section id="quote" aria-labelledby="quote-heading" className="section-pad" {...cursorProps(cursorCopy.quote)}>
      <div className="container-site">
        <SectionHeading id="quote-heading" title={quoteCopy.heading} sub={quoteCopy.sub} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <FileUpload
              file={file}
              onChange={onFiles}
              accept={ACCEPT_ATTR}
              copy={quoteCopy.upload}
              invalid={!!fileError}
              describedBy={fileError ? fileErrorId : undefined}
            />
            {fileError && (
              <p id={fileErrorId} role="alert" className="text-sm text-error">
                {fileError}
              </p>
            )}
            {showPreview && (
              <div className="rounded-[20px] border border-line bg-surface p-2">
                <SceneSlot
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  scene={{ kind: "stl", file, onMeasured: setDims }}
                  className="aspect-[4/3] w-full overflow-hidden rounded-[14px] bg-surface-2/60"
                />
                <div className="flex items-center justify-between px-3 py-3 text-xs">
                  <span className="text-text-muted">{quoteCopy.upload.dimensions}</span>
                  <span className="font-machine text-text">
                    {dims ? `${dims.x.toFixed(1)} × ${dims.y.toFixed(1)} × ${dims.z.toFixed(1)} mm` : "…"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7">
            {status.kind === "success" ? (
              <div role="status" className="flex h-full min-h-[320px] flex-col items-start justify-center gap-6 rounded-[20px] border border-line bg-surface p-8 md:p-10">
                <p className="font-heading text-2xl text-text md:text-3xl">{quoteCopy.success}</p>
                <button
                  type="button"
                  onClick={() => setStatus({ kind: "idle" })}
                  className="text-sm text-text underline decoration-line underline-offset-[6px] transition-colors hover:decoration-pei"
                >
                  {quoteCopy.sendAnother}
                </button>
              </div>
            ) : (
              <form
                noValidate
                onSubmit={onSubmit}
                className="grid grid-cols-1 gap-5 rounded-[20px] border border-line bg-surface p-6 sm:grid-cols-2 md:p-8"
              >
                <Field id={`${formId}-name`} label={f.name} error={errors.name?.message}>
                  <input {...register("name")} autoComplete="name" className={inputClass(!!errors.name)} />
                </Field>
                <Field id={`${formId}-contact`} label={f.contact} error={errors.contact?.message}>
                  <input {...register("contact")} autoComplete="email" inputMode="email" className={inputClass(!!errors.contact)} />
                </Field>
                <Field id={`${formId}-category`} label={f.category} error={errors.category?.message}>
                  <select {...register("category")} defaultValue="" className={inputClass(!!errors.category)}>
                    <option value="" disabled>
                      {f.categoryPlaceholder}
                    </option>
                    {categoryOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id={`${formId}-material`} label={f.material} error={errors.material?.message}>
                  <select {...register("material")} className={inputClass(!!errors.material)}>
                    {materialOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id={`${formId}-quantity`} label={f.quantity} error={errors.quantity?.message}>
                  <input
                    {...register("quantity", { valueAsNumber: true })}
                    type="number"
                    min={1}
                    max={1000}
                    inputMode="numeric"
                    className={cn(inputClass(!!errors.quantity), "font-machine")}
                  />
                </Field>
                <Field id={`${formId}-colour`} label={f.colour} error={errors.colour?.message}>
                  <input {...register("colour")} placeholder={f.colourPlaceholder} className={inputClass(!!errors.colour)} />
                </Field>
                <Field id={`${formId}-notes`} label={f.notes} error={errors.notes?.message} className="sm:col-span-2">
                  <textarea {...register("notes")} rows={4} placeholder={f.notesPlaceholder} className={cn(inputClass(!!errors.notes), "h-auto py-3")} />
                </Field>

                {/* Honeypot */}
                <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label htmlFor={`${formId}-company`}>Company</label>
                  <input id={`${formId}-company`} name="company" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                  {status.kind === "error" ? (
                    <p role="alert" className="text-sm text-error">
                      {status.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <button
                    type="submit"
                    disabled={status.kind === "submitting"}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-molten px-8 text-sm font-semibold text-on-molten transition-[transform,background-color,opacity] duration-150 hover:bg-molten-hover active:scale-[0.97] disabled:opacity-60"
                  >
                    {status.kind === "submitting" ? quoteCopy.submitting : quoteCopy.submit}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function inputClass(invalid: boolean) {
  return cn(
    "h-12 w-full rounded-[12px] border bg-surface-2 px-4 text-sm text-text placeholder:text-text-muted/60 transition-colors",
    "hover:border-pei/40 focus-visible:border-pei/60",
    invalid ? "border-molten/70" : "border-line",
  );
}

function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
}) {
  const errorId = `${id}-error`;
  const control = cloneElement(children, {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  });
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm text-text-muted">
        {label}
      </label>
      {control}
      {error && (
        <p id={errorId} className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
