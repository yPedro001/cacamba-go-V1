"use client"
import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthActions } from '@/core/application/useAuthActions'
import { Lock, Mail, User, ArrowRight, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { login, register } = useAuthActions()
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (isLogin) {
      const ok = await login(form.email, form.senha)
      if (ok) {
        router.push('/')
      } else {
        setError('E-mail ou senha incorretos.')
      }
    } else {
      if (!form.nome || !form.email || !form.senha) {
        setError('Preencha todos os campos.')
        return
      }
      const ok = await register(form.nome, form.email, form.senha)
      if (ok) {
        setSuccess('Conta criada com sucesso! Faça login.')
        setIsLogin(true)
      } else {
        setError('Este e-mail já está em uso.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 mb-4 transform -rotate-6">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Caçamba<span className="text-accent">Go</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Gestão inteligente de resíduos</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">
              {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isLogin 
                ? 'Entre com suas credenciais para gerenciar suas operações.' 
                : 'Junte-se a centenas de empresas e simplifique sua logística.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input 
                      placeholder="Nome Completo" 
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white focus:ring-accent"
                      value={form.nome}
                      onChange={e => setForm({...form, nome: e.target.value})}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input 
                    type="email" 
                    placeholder="email@empresa.com" 
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white focus:ring-accent"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input 
                    type="password" 
                    placeholder="Sua senha secreta" 
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white focus:ring-accent"
                    value={form.senha}
                    onChange={e => setForm({...form, senha: e.target.value})}
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>}
              {success && <p className="text-green-500 text-sm font-medium">{success}</p>}

              <Button type="submit" className="w-full bg-accent hover:bg-accent-dark text-white font-bold h-11 shadow-lg shadow-accent/20 group">
                {isLogin ? 'Entrar Agora' : 'Finalizar Cadastro'}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col border-t border-slate-800 pt-6 mt-2">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
              className="text-slate-400 hover:text-white transition-colors text-sm underline underline-offset-4"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já possui conta? Faça login'}
            </button>
          </CardFooter>
        </Card>
        
        <p className="text-center text-slate-600 text-xs mt-8">
          &copy; 2026 CaçambaGo Systems. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
