import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { useAuth } from '../hooks/useAuth'
import type { SelfSignUpType } from '../services/mockAuthService'

type Mode = 'login' | 'signup'

export function AuthScreen() {
  const { error, createAccount, signIn } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [type, setType] = useState<SelfSignUpType>('customer')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [taxId, setTaxId] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail)
    setPassword('123456')
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await createAccount(type, { name, phone, taxId, address, city, email, password })
      } else {
        await signIn({ email, password })
      }
    } catch (submitError) {
      void submitError
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-primary-50/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">Beauty Shop</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Gestão de agendamentos para salões e barbearias
          </p>
        </div>

        <Card>
          <div className="mb-6 flex gap-1 rounded-full bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Criar conta
            </button>
          </div>

          {mode === 'signup' && (
            <div className="mb-5 flex gap-2">
              <button
                type="button"
                onClick={() => setType('customer')}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  type === 'customer'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                }`}
              >
                Sou cliente
              </button>
              <button
                type="button"
                onClick={() => setType('business')}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  type === 'business'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                }`}
              >
                Sou um empreendimento
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4">
            {mode === 'signup' && (
              <>
                <Input
                  label={type === 'customer' ? 'Nome' : 'Nome do empreendimento'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Telefone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <Input
                  label={type === 'customer' ? 'CPF' : 'CNPJ'}
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  required
                />
                {type === 'business' && (
                  <>
                    <Input
                      label="Endereço"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                    <Input
                      label="Cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </>
                )}
              </>
            )}
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              {submitting ? 'Enviando…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>
        </Card>

        {mode === 'login' && (
          <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 p-4">
            <p className="text-xs font-medium text-neutral-500">
              Protótipo — contas de demonstração (senha: 123456)
            </p>
            <ul className="mt-2 grid gap-1 text-xs text-neutral-500">
              <li>
                <button
                  type="button"
                  className="text-primary-700 hover:underline"
                  onClick={() => fillDemo('cliente@demo.com')}
                >
                  cliente@demo.com
                </button>{' '}
                — cliente
              </li>
              <li>
                <button
                  type="button"
                  className="text-primary-700 hover:underline"
                  onClick={() => fillDemo('salao@demo.com')}
                >
                  salao@demo.com
                </button>{' '}
                — empreendimento
              </li>
              <li>
                <button
                  type="button"
                  className="text-primary-700 hover:underline"
                  onClick={() => fillDemo('ana@demo.com')}
                >
                  ana@demo.com
                </button>{' '}
                — profissional
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
