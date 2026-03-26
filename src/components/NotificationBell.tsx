import React, { useState } from 'react'
import { Bell, Check, X, Trash2, CalendarClock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'

export function NotificationBell() {
  const router = useRouter()
  const { notificacoes, marcarNotificacaoLida, marcarTodasLidas } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notificacoes.filter(n => !n.lida).length

  const handleNotificacaoClick = (id: string, locacaoId?: string) => {
    marcarNotificacaoLida(id)
    setIsOpen(false)
    if (locacaoId) {
      router.push(`/alugueis?highlightId=${locacaoId}`)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
        aria-label="Notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
              <h3 className="font-bold text-sm">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={marcarTodasLidas}
                  className="text-xs font-semibold text-accent hover:text-accent-dark transition-colors flex items-center gap-1"
                >
                  <Check size={14} /> Marcar todas lidas
                </button>
              )}
            </div>
            
            <div className="max-h-[350px] overflow-y-auto">
              {notificacoes.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground flex flex-col items-center">
                  <Bell className="h-8 w-8 text-muted/50 mb-2" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notificacoes.slice(0, 50).map((not) => (
                    <div
                      key={not.id}
                      onClick={() => handleNotificacaoClick(not.id, not.locacaoId)}
                      className={`flex gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        !not.lida ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        <div className={`p-1.5 rounded-full ${!not.lida ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                          <CalendarClock size={16} />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-sm ${!not.lida ? 'font-bold' : 'font-medium'}`}>
                            {not.titulo}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {new Date(not.dataCriacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                        <p className={`text-xs ${!not.lida ? 'text-foreground font-medium' : 'text-muted-foreground'} line-clamp-2 leading-relaxed`}>
                          {not.mensagem}
                        </p>
                      </div>
                      {!not.lida && (
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-accent"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-border bg-muted/20 p-2 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-medium w-full py-1"
              >
                Fechar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
