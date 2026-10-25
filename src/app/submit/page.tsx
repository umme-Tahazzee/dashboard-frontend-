"use client"

import { useCallback, useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { FormField } from "@/components/form-field"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { ApiError, api, errorMessage } from "@/lib/api"
import type { Submission } from "@/lib/types"
import { submissionSchema, zodResolver, type SubmissionValues } from "@/lib/validation"

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })

function SubmissionForm({ onSubmitted }: { onSubmitted: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { projectName: "", repoUrl: "", liveLink: "", description: "" },
  })

  async function onSubmit(values: SubmissionValues) {
    try {
      await api("/submissions", { method: "POST", body: values })
      toast.success("Project submitted for review")
      reset()
      onSubmitted()
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError("repoUrl", { message: error.message })
      } else if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof SubmissionValues, { message })
        }
      } else {
        // Includes the 429 "too many submissions" message from the rate limiter
        toast.error(errorMessage(error))
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a project</CardTitle>
        <CardDescription>Each repository can only be submitted once.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Project name" htmlFor="projectName" error={errors.projectName?.message}>
            <Input id="projectName" {...register("projectName")} />
          </FormField>
          <FormField label="Repo URL" htmlFor="repoUrl" error={errors.repoUrl?.message}>
            <Input id="repoUrl" placeholder="https://github.com/owner/repo" {...register("repoUrl")} />
          </FormField>
          <FormField label="Live link" htmlFor="liveLink" error={errors.liveLink?.message}>
            <Input id="liveLink" placeholder="https://my-project.vercel.app" {...register("liveLink")} />
          </FormField>
          <FormField
            label="Description"
            htmlFor="description"
            error={errors.description?.message}
            hint="20 to 1000 characters. What does it do and what did you use?"
          >
            <Textarea id="description" rows={5} {...register("description")} />
          </FormField>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function MySubmissions({ items, loading }: { items: Submission[] | null; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My submissions</CardTitle>
        <CardDescription>Track the review status and mentor feedback.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && !items ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : items?.length ? (
          items.map((s) => (
            <div key={s.id} className="space-y-2 rounded-lg border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{s.projectName}</div>
                  <div className="text-xs text-muted-foreground">Submitted {formatDate(s.createdAt)}</div>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="flex gap-3 text-xs">
                <a href={s.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                  Repo <ExternalLink className="size-3" />
                </a>
                <a href={s.liveLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                  Live <ExternalLink className="size-3" />
                </a>
              </div>
              {s.feedbacks[0] && (
                <p className="rounded-md bg-muted p-2 text-sm">
                  <span className="font-medium">Mentor feedback: </span>
                  {s.feedbacks[0].message}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            You have not submitted anything yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function SubmitPage() {
  const [items, setItems] = useState<Submission[] | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data } = await api<Submission[]>("/submissions/mine")
      setItems(data)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    load()
  }, [load])

  return (
    <AppShell audience="student">
      <div className="grid gap-6 lg:grid-cols-2">
        <SubmissionForm onSubmitted={load} />
        <MySubmissions items={items} loading={loading} />
      </div>
    </AppShell>
  )
}
