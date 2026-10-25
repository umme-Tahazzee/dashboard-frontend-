"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { homeFor, type User } from "@/lib/types"

type Audience = "student" | "mentor"

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
        await api("/auth/logout", { method: "POST" }).catch(() => {})
        if (!cancelled) router.replace("/login")
      })
    return () => {
      cancelled = true
    }
  }, [audience, router])

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => {})
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

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="font-semibold tracking-tight">Project Review</span>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-sm sm:block">
              <div className="font-medium leading-tight">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            <Badge variant="secondary">{user.role === "STUDENT" ? "Student" : "Mentor"}</Badge>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut /> Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
