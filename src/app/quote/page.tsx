import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Get a quote" };

export default function Page() {
  return <ComingSoon title="Get a quote" />;
}
