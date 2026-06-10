import { FormEvent, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { seedDemoData } from '@/services/seed'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'

interface LocationState {
  from?: string
}

function Login() {
  const { signIn, session, loading } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const redirectTo = (location.state as LocationState | null)?.from ?? '/dashboard'

  useEffect(() => {
    if (!loading && session) {
      navigate(redirectTo, { replace: true })
    }
  }, [loading, session, navigate, redirectTo])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      await signIn(email, password)
      toast.success('Sessao iniciada com sucesso')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao entrar'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSeed() {
    if (seeding) return
    setSeeding(true)
    try {
      await seedDemoData()
      toast.success('Dados de demonstracao carregados; entre com admin@rjusinagem.com.br')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar demonstracao'
      toast.error(message)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">RJ Usinagem</h1>
          <p className="mt-1 text-sm text-gray-500">Acesse seu painel de gestao</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="email"
            type="email"
            label="E-mail"
            placeholder="seu@email.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            name="password"
            type="password"
            label="Senha"
            placeholder="********"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" variant="primary" fullWidth loading={submitting}>
            Entrar
          </Button>
        </form>

        <div className="mt-4 border-t border-gray-100 pt-3 text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={seeding}
            onClick={handleSeed}
          >
            Carregar dados de demonstracao
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Login
