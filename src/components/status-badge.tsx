import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Status } from "@/lib/types"

const styles: Record<Status, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
}

const labels: Record<Status, string> = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" }

export function StatusBadge({ status }: { status: Status }) {
  return <Badge className={cn("border-transparent", styles[status])}>{labels[status]}</Badge>
}
