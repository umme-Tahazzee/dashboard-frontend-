"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, LayoutDashboard, LogOut, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { homeFor, type User } from "@/lib/types"

type Audience = "student" | "mentor"

const NAV = {
  student: { label: "Submit project", icon: Send },
  mentor: { label: "Review dashboard", icon: LayoutDashboard },
} as const

// Client-side session guard + page chrome. Verifies the session with the API and
// bounces users who open the wrong area for their role.
export function AppShell({ audience, children }: { audience: Audience; children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let cancelled = false
    api<{ user: User }>("/auth/me")
      .then(({ data }) => {
        if (cancelled) return
        const isStudent = data.user.role === "STUDENT"
        if (isStudent !== (audience === "student")) router.replace(homeFor(data.user.role))
        else setUser(data.user)
      })
      .catch(async () => {
        // Clear a stale cookie first so the proxy does not bounce us straight back
        await api("/auth/logout", { method: "POST" }).catch(() => { })
        if (!cancelled) router.replace("/login")
      })
    return () => {
      cancelled = true
    }
  }, [audience, router])

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => { })
    router.replace("/login")
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const { label, icon: NavIcon } = NAV[audience]
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          Project Review
        </div>
        <nav className="flex-1 p-3">
          <span className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground">
            <NavIcon className="size-4" /> {label}
          </span>
        </nav>
        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </span>
            <div className="min-w-0 text-sm">
              <div className="truncate font-medium leading-tight">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-1 w-full justify-start" onClick={logout}>
            <LogOut /> Log out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:justify-end lg:px-8">
          <span className="font-semibold lg:hidden">Project Review</span>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary sm:inline">
              {user.role === "STUDENT" ? "Student" : "Mentor"}
            </span>
            <Button variant="outline" size="sm" className="lg:hidden" onClick={logout}>
              <LogOut /> Log out
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
