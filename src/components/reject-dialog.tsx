"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export function RejectDialog({
  projectName,
  open,
  busy,
  onClose,
  onConfirm,
}: {
  projectName: string
  open: boolean
  busy: boolean
  onClose: () => void
  onConfirm: (feedback: string) => void
}) {
  const [feedback, setFeedback] = useState("")
  const [touched, setTouched] = useState(false)
  const invalid = feedback.trim().length === 0

  function submit() {
    setTouched(true)
    if (!invalid) onConfirm(feedback.trim())
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject “{projectName}”</DialogTitle>
          <DialogDescription>Tell the student what to fix. They will see this message.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Textarea
            rows={4}
            value={feedback}
            maxLength={1000}
            placeholder="e.g. The live link returns a 404 and the README is missing."
            onChange={(e) => setFeedback(e.target.value)}
            aria-invalid={touched && invalid}
          />
          {touched && invalid && (
            <p role="alert" className="text-xs text-destructive">
              Feedback is required when rejecting a project.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={busy}>
            {busy ? "Rejecting..." : "Reject project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
