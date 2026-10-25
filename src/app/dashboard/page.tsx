"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, ChevronLeft, ChevronRight, ExternalLink, Search, X } from "lucide-react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { RejectDialog } from "@/components/reject-dialog"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api, errorMessage, type PageMeta } from "@/lib/api"
import type { Stats, Status, Submission } from "@/lib/types"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

const FILTERS: { value: Status | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
]

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function StatsCards({ stats }: { stats: Stats | null }) {
  const cards = [
    { label: "Total", value: stats?.total, tone: "" },
    { label: "Pending", value: stats?.pending, tone: "text-amber-600 dark:text-amber-400" },
    { label: "Approved", value: stats?.approved, tone: "text-emerald-600 dark:text-emerald-400" },
    { label: "Rejected", value: stats?.rejected, tone: "text-rose-600 dark:text-rose-400" },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} size="sm">
          <CardContent>
            <div className="text-sm text-muted-foreground">{card.label}</div>
            {card.value === undefined ? (
              <Skeleton className="mt-1 h-8 w-12" />
            ) : (
              <div className={cn("text-3xl font-semibold tabular-nums", card.tone)}>{card.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [status, setStatus] = useState<Status | "ALL">("ALL")
  const [searchInput, setSearchInput] = useState("")
  const search = useDebounced(searchInput.trim())
  const [page, setPage] = useState(1)

  const [rows, setRows] = useState<Submission[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)

  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<Submission | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Filter, search and pagination are all executed by the API / database
  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (status !== "ALL") params.set("status", status)
    if (search) params.set("search", search)

    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for the fetch below
    setLoading(true)
    api<Submission[]>(`/submissions?${params}`, { signal: controller.signal })
      .then(({ data, meta }) => {
        setRows(data)
        setMeta(meta ?? null)
        setLoading(false)
      })
      .catch((error) => {
        if (error?.name === "AbortError") return
        toast.error(errorMessage(error))
        setLoading(false)
      })
    return () => controller.abort()
  }, [status, search, page, reloadKey])

  const loadStats = useCallback(async () => {
    try {
      setStats((await api<Stats>("/submissions/stats")).data)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    loadStats()
  }, [loadStats])

  async function review(submission: Submission, decision: "APPROVED" | "REJECTED", feedback?: string) {
    setBusyId(submission.id)
    try {
      await api(`/submissions/${submission.id}/review`, {
        method: "PATCH",
        body: { status: decision, feedback },
      })
      toast.success(`“${submission.projectName}” ${decision === "APPROVED" ? "approved" : "rejected"}`)
      setRejecting(null)
      setReloadKey((k) => k + 1)
      loadStats()
    } catch (error) {
      toast.error(errorMessage(error))
      // Someone else may have reviewed it already, so refresh to show the true state
      setReloadKey((k) => k + 1)
      loadStats()
    } finally {
      setBusyId(null)
    }
  }

  const changeStatus = (value: Status | "ALL") => {
    setStatus(value)
    setPage(1)
  }

  return (
    <AppShell audience="mentor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Review dashboard</h1>
          <p className="text-sm text-muted-foreground">Approve or reject student project submissions.</p>
        </div>

        <StatsCards stats={stats} />

        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
                {FILTERS.map((f) => (
                  <Button
                    key={f.value}
                    size="sm"
                    variant={status === f.value ? "default" : "outline"}
                    aria-pressed={status === f.value}
                    onClick={() => changeStatus(f.value)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search project or student"
                  aria-label="Search submissions"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No submissions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="max-w-xs whitespace-normal">
                          <div className="font-medium">{s.projectName}</div>
                          <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                          <div className="mt-1 flex gap-3 text-xs">
                            <a href={s.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                              Repo <ExternalLink className="size-3" />
                            </a>
                            <a href={s.liveLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                              Live <ExternalLink className="size-3" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{s.student.name}</div>
                          <div className="text-xs text-muted-foreground">{s.student.email}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(s.createdAt)}</TableCell>
                        <TableCell>
                          <StatusBadge status={s.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {s.status === "PENDING" ? (
                            <div className="flex justify-end gap-1.5">
                              <Button size="sm" disabled={busyId === s.id} onClick={() => review(s, "APPROVED")}>
                                <Check /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={busyId === s.id}
                                onClick={() => setRejecting(s)}
                              >
                                <X /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {s.reviewedAt ? `Reviewed ${formatDate(s.reviewedAt)}` : "Reviewed"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {meta ? `${meta.total} result${meta.total === 1 ? "" : "s"} · Page ${meta.page} of ${meta.totalPages}` : ""}
              </span>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" disabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft /> Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading || !meta || page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {rejecting && (
        <RejectDialog
          open
          projectName={rejecting.projectName}
          busy={busyId === rejecting.id}
          onClose={() => setRejecting(null)}
          onConfirm={(feedback) => review(rejecting, "REJECTED", feedback)}
        />
      )}
    </AppShell>
  )
}
