"use client";
// Aceternity UI — File Upload, restyled and made controlled: one file at a
// time, validation done by the caller so errors can be specific.
import { cn } from "@/lib/utils";
import React, { useId, useRef } from "react";
import { motion } from "motion/react";
import { IconUpload, IconX } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

const mainVariant = {
  initial: { x: 0, y: 0 },
  animate: { x: 14, y: -14, opacity: 0.95 },
};

const secondaryVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export interface FileUploadCopy {
  title: string;
  hint: string;
  photoHint: string;
  drop: string;
  remove: string;
}

export const FileUpload = ({
  file,
  onChange,
  accept,
  copy,
  invalid,
  describedBy,
}: {
  file: File | null;
  /** Receives every dropped or picked file; the caller validates and decides. */
  onChange: (files: File[]) => void;
  /** Value for the native input's accept attribute. */
  accept: string;
  copy: FileUploadCopy;
  invalid?: boolean;
  describedBy?: string;
}) => {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    noKeyboard: true,
    onDrop: (accepted, rejected) => onChange([...accepted, ...rejected.map((r) => r.file)]),
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        whileHover="animate"
        className={cn(
          "group/file relative block w-full overflow-hidden rounded-[20px] border bg-surface p-8 transition-colors md:p-10",
          "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-molten has-[input:focus-visible]:outline",
          isDragActive ? "border-pei" : invalid ? "border-molten/70" : "border-line hover:border-pei/50",
        )}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={accept}
          onChange={(e) => {
            onChange(Array.from(e.target.files || []));
            e.target.value = "";
          }}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className="peer sr-only"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]">
          <GridPattern />
        </div>
        <div className="relative z-20 flex flex-col items-start">
          <label htmlFor={inputId} className="cursor-pointer font-heading text-lg text-text after:absolute after:inset-0 after:content-['']">
            {copy.title}
          </label>
          <p className="mt-2 max-w-[42ch] text-sm text-text-muted">{copy.hint}</p>
          <p className="mt-1 max-w-[42ch] text-sm text-text-muted">{copy.photoHint}</p>
          <div className="relative mt-8 w-full">
            {file ? (
              <motion.div
                layoutId="file-upload"
                className="relative z-40 flex w-full flex-col gap-2 overflow-hidden rounded-[12px] border border-line bg-surface-2 p-4"
              >
                <div className="flex w-full items-center justify-between gap-4">
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="min-w-0 truncate text-sm text-text">
                    {file.name}
                  </motion.p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange([]);
                    }}
                    className="relative z-50 grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-muted transition hover:bg-surface hover:text-text active:scale-[0.97]"
                    aria-label={copy.remove}
                  >
                    <IconX size={16} />
                  </button>
                </div>
                <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted font-machine">
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </motion.span>
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="uppercase">
                    {file.name.split(".").pop()}
                  </motion.span>
                </div>
              </motion.div>
            ) : (
              <div className="relative h-24 w-24">
                <motion.div
                  layoutId="file-upload"
                  variants={mainVariant}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative z-40 flex h-24 w-24 items-center justify-center rounded-[12px] border border-line bg-surface-2"
                >
                  {isDragActive ? (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-1 text-xs text-text">
                      {copy.drop}
                      <IconUpload className="h-4 w-4 text-pei" />
                    </motion.p>
                  ) : (
                    <IconUpload className="h-5 w-5 text-text-muted" stroke={1.5} />
                  )}
                </motion.div>
                <motion.div
                  variants={secondaryVariant}
                  className="absolute inset-0 z-30 rounded-[12px] border border-dashed border-pei bg-transparent opacity-0"
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex shrink-0 scale-105 flex-wrap items-center justify-center gap-x-px gap-y-px bg-line/40">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`flex h-10 w-10 shrink-0 rounded-[2px] ${
                index % 2 === 0 ? "bg-surface" : "bg-surface shadow-[0px_0px_1px_3px_var(--color-bg)_inset]"
              }`}
            />
          );
        }),
      )}
    </div>
  );
}
