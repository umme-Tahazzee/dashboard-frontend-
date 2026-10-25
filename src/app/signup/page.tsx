"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { AuthLayout } from "@/components/auth-layout"
import { FormField } from "@/components/form-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ApiError, api, errorMessage } from "@/lib/api"
import { homeFor, type User } from "@/lib/types"
import { signupSchema, zodResolver, type SignupValues } from "@/lib/validation"

export default function SignupPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) })

  async function onSubmit({ name, email, password }: SignupValues) {
    try {
      const { data } = await api<{ user: User }>("/auth/signup", { method: "POST", body: { name, email, password } })
      toast.success("Account created")
      router.replace(homeFor(data.user.role))
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError("email", { message: error.message })
      } else {
        toast.error(errorMessage(error))
      }
    }
  }

  return (
    <AuthLayout>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Create your student account</CardTitle>
          <CardDescription>Submit your projects and get mentor feedback.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField label="Full name" htmlFor="name" error={errors.name?.message}>
              <Input id="name" autoComplete="name" {...register("name")} />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
            </FormField>
            <FormField
              label="Password"
              htmlFor="password"
              error={errors.password?.message}
              hint="At least 8 characters, with a letter and a number."
            >
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            </FormField>
            <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
            </FormField>
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Sign up"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
