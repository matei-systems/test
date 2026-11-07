'use client'

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from 'react'
import type { ActionState } from '@/app/admin/actions'

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>

const PendingContext = createContext(false)

/**
 * Formular für Admin-Server-Actions mit Lade-Zustand, Erfolgs-/Fehlermeldung
 * und optionaler Sicherheitsabfrage (z. B. vor dem Löschen).
 *
 * Bewusst ohne das automatische Zurücksetzen von React-Form-Actions: Bei Validierungsfehlern
 * bleiben alle Eingaben erhalten. Mit `resetOnSuccess` wird nach Erfolg geleert.
 */
export function ActionForm({
  action,
  children,
  className,
  confirm,
  resetOnSuccess,
  id,
}: {
  action: Action
  children: React.ReactNode
  className?: string
  confirm?: string
  resetOnSuccess?: boolean
  id?: string
}) {
  const [state, dispatch, pending] = useActionState(action, null)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset()
  }, [state, resetOnSuccess])
  return (
    <form
      ref={ref}
      id={id}
      className={className}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (pending) return
        if (confirm && !window.confirm(confirm)) return
        const formData = new FormData(e.currentTarget)
        startTransition(() => dispatch(formData))
      }}
    >
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
      {state && !pending && (
        <p role="status" className={`adm-msg ${state.ok ? 'adm-msg--ok' : 'adm-msg--err'}`}>
          {state.message}
          {state.errors && Object.keys(state.errors).length > 0 && (
            <span className="adm-msg-list">
              {Object.entries(state.errors).map(([k, v]) => (
                <span key={k}>
                  {k}: {v}
                </span>
              ))}
            </span>
          )}
        </p>
      )}
    </form>
  )
}

export function SubmitButton({
  children,
  className = 'btn btn--primary btn--sm',
  pendingText = 'Speichert …',
}: {
  children: React.ReactNode
  className?: string
  pendingText?: string
}) {
  const pending = useContext(PendingContext)
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  )
}
