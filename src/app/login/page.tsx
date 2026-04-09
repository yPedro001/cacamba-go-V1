"use client"
import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { OtpInput } from '@/components/ui/otp-input'
import { useAuthActions } from '@/core/application/useAuthActions'
import { Mail, User, ArrowRight, Truck, KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ViewState = 'LOGIN' | 'CADASTRO' | 'CADASTRO_CODIGO' | 'ESQUECI_SENHA' | 'ESQUECI_SENHA_CODIGO' | 'ESQUECI_SENHA_NOVA'

export default function LoginPage() {
  const { login, register, verifyOtp, sendPasswordReset, resetPassword, resendOtp } = useAuthActions()
  const router = useRouter()
  
  const [viewState, setViewState] = useState<ViewState>('LOGIN')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    codigo: ''
  })

  // Evita reenvios simultâneos ou flood de botões
  const [cooldown, setCooldown] = useState(0)

  // Reseta os estados de erro/sucesso ao mudar a view
  const changeView = (view: ViewState) => {
    setViewState(view)
    setError('')
    setSuccess('')
  }

  const startCooldown = () => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const submitLogin = async () => {
    if (!form.email || !form.senha) {
      setError('Preencha e-mail e senha.')
      return
    }
    setIsLoading(true)
    const res = await login(form.email, form.senha)
    setIsLoading(false)
    if (res.success) {
      router.push('/')
    } else {
      // Tradução de erros comuns do Supabase
      const errorMsg = res.error?.includes('Invalid login credentials') 
        ? 'E-mail ou senha incorretos. Verifique seus dados.' 
        : res.error || 'Erro ao realizar login.';
      setError(errorMsg)
    }
  }

  const submitCadastro = async () => {
    if (!form.nome || !form.email || !form.senha) {
      setError('Preencha todos os campos.')
      return
    }
    if (form.senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    setIsLoading(true)
    const res = await register(form.nome, form.email, form.senha)
    setIsLoading(false)

    if (res.success) {
      setSuccess(`Código enviado para o e-mail: ${form.email}.`)
      changeView('CADASTRO_CODIGO')
      startCooldown()
    } else {
      setError(res.error || 'Erro ao realizar cadastro.')
    }
  }

  const submitCadastroCodigo = async () => {
    if (!form.codigo) {
      setError('Por favor, informe o código recebido.')
      return
    }
    setIsLoading(true)
    const res = await verifyOtp(form.email, form.codigo, 'signup')
    setIsLoading(false)

    if (res.success) {
      router.push('/')
    } else {
      setError(res.error || 'Código inválido ou expirado.')
    }
  }

  const submitEsqueciSenha = async () => {
    if (!form.email) {
      setError('Informe seu e-mail.')
      return
    }
    setIsLoading(true)
    const res = await sendPasswordReset(form.email)
    setIsLoading(false)

    if (res.success) {
      setSuccess(`Enviamos um código de recuperação para ${form.email}.`)
      changeView('ESQUECI_SENHA_CODIGO')
      startCooldown()
    } else {
      // Por segurança, não expor que o e-mail não existe, a não ser que o modelo exija
      setError('Seu e-mail for válido, você receberá um código.')
      changeView('ESQUECI_SENHA_CODIGO')
      startCooldown()
    }
  }

  const submitEsqueciSenhaCodigo = async () => {
    if (!form.codigo) {
      setError('Infome o código fornecido no e-mail.')
      return
    }
    setIsLoading(true)
    const res = await verifyOtp(form.email, form.codigo, 'recovery')
    setIsLoading(false)

    if (res.success) {
      setSuccess('Código verificado! Crie sua nova senha.')
      changeView('ESQUECI_SENHA_NOVA')
    } else {
      setError(res.error || 'Código inválido ou expirado.')
    }
  }

  const submitEsqueciSenhaNova = async () => {
    if (!form.senha || form.senha !== form.confirmarSenha) {
      setError('As senhas não coincidem ou estão vazias.')
      return
    }
    if (form.senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    setIsLoading(true)
    const res = await resetPassword(form.senha)
    setIsLoading(false)

    if (res.success) {
      setSuccess('Senha redefinida com sucesso! Faça login.')
      changeView('LOGIN')
      setForm({...form, senha: '', confirmarSenha: '', codigo: ''})
    } else {
      setError(res.error || 'Erro ao redefinir senha.')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    switch (viewState) {
      case 'LOGIN': return submitLogin()
      case 'CADASTRO': return submitCadastro()
      case 'CADASTRO_CODIGO': return submitCadastroCodigo()
      case 'ESQUECI_SENHA': return submitEsqueciSenha()
      case 'ESQUECI_SENHA_CODIGO': return submitEsqueciSenhaCodigo()
      case 'ESQUECI_SENHA_NOVA': return submitEsqueciSenhaNova()
    }
  }

  const handleReenviarCodigo = async () => {
    if (cooldown > 0) return;
    setIsLoading(true)
    let res;
    if (viewState === 'CADASTRO_CODIGO') {
      res = await resendOtp(form.email, 'signup')
    } else if (viewState === 'ESQUECI_SENHA_CODIGO') {
      res = await resendOtp(form.email, 'recovery')
    }
    setIsLoading(false)
    if (res?.success) {
      setSuccess('Código reenviado!')
      startCooldown()
    } else {
      setError(res?.error || 'Erro ao reenviar código.')
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
              {viewState === 'LOGIN' && 'Bem-vindo de volta'}
              {viewState === 'CADASTRO' && 'Crie sua conta'}
              {viewState === 'CADASTRO_CODIGO' && 'Confirme seu E-mail'}
              {viewState === 'ESQUECI_SENHA' && 'Recuperar Senha'}
              {viewState === 'ESQUECI_SENHA_CODIGO' && 'Código de Recuperação'}
              {viewState === 'ESQUECI_SENHA_NOVA' && 'Criar Nova Senha'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {viewState === 'LOGIN' && 'Entre com suas credenciais para gerenciar suas operações.'}
              {viewState === 'CADASTRO' && 'Junte-se a centenas de empresas e simplifique sua logística.'}
              {viewState === 'CADASTRO_CODIGO' && 'Enviamos um código de 8 dígitos para o seu e-mail.'}
              {viewState === 'ESQUECI_SENHA' && 'Vamos te ajudar a recuperar o acesso.'}
              {viewState === 'ESQUECI_SENHA_CODIGO' && 'Insira o código enviado pro seu e-mail para confirmar a verificação.'}
              {viewState === 'ESQUECI_SENHA_NOVA' && 'Proteja sua conta com uma senha forte.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* CAMPO NOME (Cadastro Inicial) */}
              {viewState === 'CADASTRO' && (
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input 
                      placeholder="Nome Completo" 
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white focus:ring-accent"
                      value={form.nome}
                      onChange={e => setForm({...form, nome: e.target.value})}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* CAMPO EMAIL (Usado em Login, Cadastro e Esqueci Senha) */}
              {['LOGIN', 'CADASTRO', 'ESQUECI_SENHA'].includes(viewState) && (
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input 
                      type="email" 
                      placeholder="email@empresa.com" 
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white focus:ring-accent"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* CAMPO SENHA (Usado em Login e Cadastro Inicial) */}
              {['LOGIN', 'CADASTRO'].includes(viewState) && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <PasswordInput 
                      placeholder={viewState === 'LOGIN' ? "Sua senha secreta" : "Crie uma senha forte"}
                      className="bg-slate-800/50 border-slate-700 text-white focus:ring-accent"
                      value={form.senha}
                      onChange={e => setForm({...form, senha: e.target.value})}
                      disabled={isLoading}
                    />
                  </div>
                  
                  {viewState === 'CADASTRO' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <PasswordInput 
                        placeholder="Confirme sua senha" 
                        className="bg-slate-800/50 border-slate-700 text-white focus:ring-accent"
                        value={form.confirmarSenha}
                        onChange={e => setForm({...form, confirmarSenha: e.target.value})}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* CAMPO CÓDIGO (OTP Signup e OTP Recovery) */}
              {['CADASTRO_CODIGO', 'ESQUECI_SENHA_CODIGO'].includes(viewState) && (
                <div className="py-4">
                  <OtpInput 
                    value={form.codigo}
                    onChange={val => setForm({...form, codigo: val})}
                    disabled={isLoading}
                    length={8}
                  />
                  <p className="text-center text-xs text-slate-500 mt-4">
                    Digite o código de 8 dígitos que enviamos para <br/>
                    <span className="text-slate-300 font-medium">{form.email}</span>
                  </p>
                </div>
              )}

              {/* CAMPOS NOVA SENHA E CONFIRMAR (OTP Recovery) */}
              {viewState === 'ESQUECI_SENHA_NOVA' && (
                <>
                  <div className="space-y-2">
                    <PasswordInput 
                      placeholder="Nova senha secreta" 
                      className="bg-slate-800/50 border-slate-700 text-white focus:ring-accent"
                      value={form.senha}
                      onChange={e => setForm({...form, senha: e.target.value})}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <PasswordInput 
                      placeholder="Confirme a nova senha" 
                      className="bg-slate-800/50 border-slate-700 text-white focus:ring-accent"
                      value={form.confirmarSenha}
                      onChange={e => setForm({...form, confirmarSenha: e.target.value})}
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}

              {/* FEEDBACK MENSAGENS */}
              {error && <p className="text-red-500 text-sm font-medium animate-in slide-in-from-top-1">{error}</p>}
              {success && <p className="text-green-500 text-sm font-medium animate-in slide-in-from-top-1">{success}</p>}

              {/* BOTAO PRIMARIO */}
              <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent-dark text-white font-bold h-11 shadow-lg shadow-accent/20 group">
                {isLoading ? 'Aguarde...' : (
                  <>
                    {viewState === 'LOGIN' && 'Entrar Agora'}
                    {viewState === 'CADASTRO' && 'Criar Conta'}
                    {['CADASTRO_CODIGO', 'ESQUECI_SENHA_CODIGO'].includes(viewState) && 'Validar Código'}
                    {viewState === 'ESQUECI_SENHA' && 'Receber Código'}
                    {viewState === 'ESQUECI_SENHA_NOVA' && 'Redefinir Senha'}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              {/* BOTOES SECUNDARIOS / LINKS AUXILIARES */}
              {['CADASTRO_CODIGO', 'ESQUECI_SENHA_CODIGO'].includes(viewState) && (
                <Button 
                  type="button"
                  variant="ghost" 
                  disabled={cooldown > 0 || isLoading}
                  onClick={handleReenviarCodigo}
                  className="w-full text-slate-400 hover:text-white"
                >
                  {cooldown > 0 ? `Aguarde ${cooldown}s para reenviar` : 'Não recebi o código'}
                </Button>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex flex-col border-t border-slate-800 pt-6 mt-2 space-y-3">
            {viewState === 'LOGIN' && (
               <button 
                type="button"
                onClick={() => changeView('ESQUECI_SENHA')}
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                Esqueceu sua senha?
              </button>
            )}
            
            {(viewState === 'LOGIN' || viewState === 'CADASTRO') && (
              <button 
                type="button"
                onClick={() => changeView(viewState === 'LOGIN' ? 'CADASTRO' : 'LOGIN')}
                className="text-slate-400 hover:text-white transition-colors text-sm underline underline-offset-4"
              >
                {viewState === 'LOGIN' ? 'Não tem uma conta? Cadastre-se' : 'Já possui conta? Faça login'}
              </button>
            )}

            {!['LOGIN', 'CADASTRO'].includes(viewState) && (
              <button 
                type="button"
                onClick={() => changeView('LOGIN')}
                className="text-accent hover:text-white transition-colors text-sm"
              >
                Voltar para o Login
              </button>
            )}
          </CardFooter>
        </Card>
        
        <p className="text-center text-slate-600 text-xs mt-8">
          &copy; {new Date().getFullYear()} CaçambaGo Systems. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
