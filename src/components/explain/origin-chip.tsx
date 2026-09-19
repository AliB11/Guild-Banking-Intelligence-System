import { ORIGIN_LABELS, type NumberOrigin } from "@/lib/gbi/sources/types";
import { Badge } from "@/components/ui/badge";

const VARIANT: Record<NumberOrigin, "gold" | "persian" | "violet" | "slate"> = {
  sample: "slate",
  official: "persian",
  model: "gold",
  internal: "violet",
};

export function OriginChip({ origin }: { origin: NumberOrigin }) {
  const meta = ORIGIN_LABELS[origin];
  return (
    <Badge variant={VARIANT[origin]} title={meta.hint}>
      {meta.label}
    </Badge>
  );
}
