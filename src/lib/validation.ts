import { z } from "zod"
import type { FieldValues, Resolver } from "react-hook-form"

// Minimal zod -> react-hook-form bridge (keeps the first message per field)
export function zodResolver<T extends FieldValues>(schema: z.ZodType<T>): Resolver<T> {
  return async (values) => {
    const result = schema.safeParse(values)
    if (result.success) return { values: result.data, errors: {} }

    const errors: Record<string, { type: string; message: string }> = {}
    for (const issue of result.error.issues) {
      const key = issue.path.join(".")
      errors[key] ??= { type: "validation", message: issue.message }
    }
    return { values: {}, errors } as ReturnType<Resolver<T>> extends Promise<infer R> ? R : never
  }
}

const email = z.string().trim().min(1, "Email is required").email("Enter a valid email address")

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
})

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name is too long"),
    email,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters")
      .regex(/[A-Za-z]/, "Password must contain a letter")
      .regex(/\d/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

const httpUrl = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(300, `${label} is too long`)
    .refine((v) => {
      try {
        return ["http:", "https:"].includes(new URL(v).protocol)
      } catch {
        return false
      }
    }, `${label} must be a valid http(s) URL`)

export const submissionSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(3, "Project name must be at least 3 characters")
    .max(100, "Project name must be at most 100 characters"),
  repoUrl: httpUrl("Repo URL").refine((v) => {
    try {
      const { hostname, pathname } = new URL(v)
      const host = hostname.replace(/^www\./i, "").toLowerCase()
      return (
        ["github.com", "gitlab.com", "bitbucket.org"].includes(host) &&
        pathname.split("/").filter(Boolean).length >= 2
      )
    } catch {
      return false
    }
  }, "Use a repository link on GitHub, GitLab or Bitbucket, e.g. https://github.com/owner/repo"),
  liveLink: httpUrl("Live link"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be at most 1000 characters"),
})

export type LoginValues = z.infer<typeof loginSchema>
export type SignupValues = z.infer<typeof signupSchema>
export type SubmissionValues = z.infer<typeof submissionSchema>
