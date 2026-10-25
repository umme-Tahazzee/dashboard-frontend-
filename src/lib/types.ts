export type Role = "STUDENT" | "MENTOR" | "ADMIN"
export type Status = "PENDING" | "APPROVED" | "REJECTED"

export type User = { id: string; name: string; email: string; role: Role }

export type Submission = {
  id: string
  projectName: string
  repoUrl: string
  liveLink: string
  description: string
  status: Status
  createdAt: string
  reviewedAt: string | null
  student: { id: string; name: string; email: string }
  feedbacks: { message: string; createdAt: string }[]
}

export type Stats = { total: number; pending: number; approved: number; rejected: number }

export const homeFor = (role: Role) => (role === "STUDENT" ? "/submit" : "/dashboard")
