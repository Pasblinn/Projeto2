import { FormEvent, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'

function Login() {
  const { signIn } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      await signIn(email, password)
      toast.success('Sessao iniciada com sucesso')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao entrar'
      toast.error(message)
    } finally {
      setSubmitting(false)
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
      </Card>
    </div>
  )
}

export default Login
