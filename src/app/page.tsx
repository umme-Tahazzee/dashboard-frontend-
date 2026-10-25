import { redirect } from "next/navigation"

// proxy.ts redirects "/" based on the session cookie; this is the fallback
export default function Home() {
  redirect("/login")
}
