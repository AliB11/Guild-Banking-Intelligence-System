import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDecimal } from "@/lib/gbi/format";
import type { AlertSeverity, EarlyWarning } from "@/lib/gbi/types";
import { cn } from "@/lib/utils";

const SEVERITY_META: Record<AlertSeverity, { label: string; tone: string; icon: typeof AlertTriangle }> = {
  critical: { label: "بحرانی", tone: "border-rose-500/30 bg-rose-500/[0.08] text-rose-200", icon: ShieldAlert },
  warning: { label: "هشدار", tone: "border-gold-500/30 bg-gold-500/[0.07] text-gold-200", icon: AlertTriangle },
  info: { label: "اطلاع", tone: "border-sky-500/20 bg-sky-500/[0.05] text-sky-200", icon: Info },
};

export function EarlyWarningPanel({ alerts }: { alerts: EarlyWarning[] }) {
  return (
    <div className="space-y-2.5">
      {alerts.map((alert) => {
        const meta = SEVERITY_META[alert.severity];
        const Icon = meta.icon;
        return (
          <div key={alert.code} className={cn("rounded-xl border p-3", meta.tone)}>
            <div className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-extrabold">{alert.title}</p>
                  <Badge variant="ghost" className="!px-0 !py-0 text-[9px]">{meta.label}</Badge>
                </div>
                <p className="mt-1 text-[9.5px] leading-5 opacity-75">{alert.detail}</p>
              </div>
              {alert.value !== undefined && <span className="num text-[11px] font-black">{formatDecimal(alert.value, 1)}</span>}
            </div>
          </div>
        );
      })}
      {alerts.length === 0 && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-persian-500/20 bg-persian-500/[0.06] p-6 text-sm text-persian-200">
          <CheckCircle2 className="h-4 w-4" /> سامانه هشدار فعالی ثبت نکرده است.
        </div>
      )}
    </div>
  );
}
