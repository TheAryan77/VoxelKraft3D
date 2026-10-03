import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Materials" };

export default function Page() {
  return <ComingSoon title="Materials" />;
}
