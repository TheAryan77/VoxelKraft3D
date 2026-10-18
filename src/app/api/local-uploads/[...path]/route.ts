import { NextResponse } from "next/server";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

/** Serves images uploaded from /admin during local development only. */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (process.env.NODE_ENV !== "development") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { path: parts } = await params;
  if (parts.some((p) => p === ".." || p.includes("/") || p.includes("\\"))) return NextResponse.json({ error: "Bad path" }, { status: 400 });
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const ext = parts.at(-1)?.split(".").pop() ?? "";
  if (!TYPES[ext]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const data = await readFile(path.join(process.cwd(), ".local-uploads", ...parts));
    return new NextResponse(data, { headers: { "Content-Type": TYPES[ext], "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
