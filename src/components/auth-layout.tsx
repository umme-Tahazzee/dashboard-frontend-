import { GraduationCap } from "lucide-react"

// Shared split-screen frame for the login and signup pages.
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <GraduationCap className="size-6" /> Project Review
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Submit projects. Get reviewed. Keep improving.
          </h2>
          <p className="max-w-md text-primary-foreground/80">
            Students share their work, mentors approve or give feedback, all in one place.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70"> Project Review</p>
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-white/5" />
      </aside>
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
