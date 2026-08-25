"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { EyeIcon, EyeOffIcon, LockKeyholeIcon, UserIcon } from "lucide-react"

import { login } from "@/app/login/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action] = useActionState(login, undefined)
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={nextPath ?? "/"} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">Логин</FieldLabel>
          <InputGroup>
            <InputGroupAddon><UserIcon /></InputGroupAddon>
            <InputGroupInput id="username" name="username" autoComplete="username" autoCapitalize="none" required autoFocus placeholder="Введите логин" />
          </InputGroup>
        </Field>
        <Field data-invalid={Boolean(state?.error)}>
          <FieldLabel htmlFor="password">Пароль</FieldLabel>
          <InputGroup>
            <InputGroupAddon><LockKeyholeIcon /></InputGroupAddon>
            <InputGroupInput id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required aria-invalid={Boolean(state?.error)} placeholder="Введите пароль" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {state?.error && <FieldError>{state.error}</FieldError>}
        </Field>
      </FieldGroup>
      {state?.error && <Alert variant="destructive"><AlertDescription>Проверьте данные и попробуйте ещё раз.</AlertDescription></Alert>}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending && <Spinner data-icon="inline-start" />}
      {pending ? "Входим…" : "Войти в dashboard"}
    </Button>
  )
}
