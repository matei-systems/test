import { redirect } from 'next/navigation'
import { LogoMark } from '@/components/site/Logo'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { getAdminSession, isAdminConfigured } from '@/lib/auth'
import { HashGenerator } from '@/components/admin/HashGenerator'
import { isDatabaseConfigured } from '@/lib/db'
import { loginAction } from '../actions'

export const metadata = { title: 'Anmelden' }

export default async function LoginPage() {
  if (await getAdminSession()) redirect('/admin')
  const configured = isAdminConfigured()
  return (
    <main className="adm-login">
      <div className="adm-login-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <LogoMark size={40} />
          <div>
            <p style={{ fontWeight: 600, letterSpacing: '0.12em', fontSize: '0.95rem' }}>RM Mobile Auto Aufbereitung</p>
            <p style={{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)' }}>Admin-Bereich</p>
          </div>
        </div>
        {!configured ? (
          <>
            <div className="adm-warn">
              <span>
                Der Admin-Zugang ist noch nicht eingerichtet.
                {!isDatabaseConfigured() && ' Außerdem ist noch keine Datenbank verbunden.'} Lege dein Admin-Passwort in zwei
                Schritten fest:
              </span>
            </div>
            {!process.env.ADMIN_PASSWORD_HASH && <HashGenerator />}
          </>
        ) : (
          <ActionForm action={loginAction} className="adm-form">
            <div className="field">
              <label htmlFor="username">Benutzername</label>
              <input id="username" name="username" className="input" autoComplete="username" required autoFocus />
            </div>
            <div className="field">
              <label htmlFor="password">Passwort</label>
              <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
            </div>
            <SubmitButton className="btn btn--primary btn--block" pendingText="Anmelden …">
              Anmelden
            </SubmitButton>
          </ActionForm>
        )}
        <p style={{ marginTop: 20, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          Geschützter Bereich. Anmeldeversuche werden begrenzt.
        </p>
      </div>
    </main>
  )
}
