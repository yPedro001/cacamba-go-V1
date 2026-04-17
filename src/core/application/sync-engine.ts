import { useAppStore } from '@/store/useAppStore';
import { isLocacaoOverdue } from '@/core/domain/business-logic';
import { Locacao, Cacamba, Notificacao } from '@/core/domain/types';

/**
 * SyncEngine: Gerencia tarefas automáticas em segundo plano.
 * Focado em manter o estado do sistema coerente com o passar do tempo.
 */
class SyncEngine {
  private interval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  start() {
    if (this.interval) return;
    
    // Executa imediatamente ao iniciar
    this.process();
    
    // Ciclo de 5 minutos para tarefas de background
    this.interval = setInterval(() => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => this.process());
      } else {
        this.process();
      }
    }, 5 * 60 * 1000);

    // Re-valida quando o usuário volta para a aba
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.process();
      });
    }
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  private process() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const state = useAppStore.getState();
      const today = new Date();
      
      // Criar cache de notificações para busca O(1)
      const notificacaoIds = new Set(state.notificacoes.map((n: Notificacao) => n.id));
      
      // Criar mapa de caçambas por ID para busca O(1)
      const cacambasMap = new Map<string, Cacamba>(state.cacambas.map((c: Cacamba) => [c.id, c]));

      this.checkOverdue(state, today, notificacaoIds);
      this.checkNearExpiry(state, today, notificacaoIds);
      this.checkPendingLogistics(state, today, notificacaoIds, cacambasMap);
    } finally {
      this.isProcessing = false;
    }
  }

  private checkOverdue(state: any, today: Date, notifIds: Set<string>) {
    const { locacoes, addNotificacao, setLocacoes } = state;
    let modified = false;

    const updatedLocs = locacoes.map((loc: Locacao) => {
      const locId = loc.id!;
      if (isLocacaoOverdue(loc, today) && loc.status !== 'vencida' && loc.status !== 'concluida') {
        modified = true;
        
        const key = `retirada-${locId}`;
        if (!notifIds.has(key)) {
          addNotificacao({
            id: key,
            titulo: 'Retirada Necessária',
            mensagem: `A locação #${locId.slice(-4)} venceu. Favor retirar a caçamba.`,
            locacaoId: locId,
            lida: false
          });
        }
        return { ...loc, status: 'vencida' };
      }
      return loc;
    });

    if (modified) setLocacoes(updatedLocs);
  }

  private checkPendingLogistics(state: any, today: Date, notifIds: Set<string>, cacambasMap: Map<string, Cacamba>) {
    const { locacoes, addNotificacao } = state;

    locacoes.forEach((loc: Locacao) => {
      const locId = loc.id!;
      if (loc.status === ('concluida' as any)) return;

      // 1. Pagamento Pendente
      if (loc.status === 'a_pagar') {
        const key = `pgto-${locId}`;
        if (!notifIds.has(key)) {
          addNotificacao({
            id: key,
            titulo: 'Pagamento Pendente',
            mensagem: `A locação #${locId.slice(-4)} ainda não foi paga.`,
            locacaoId: locId,
            lida: false
          });
        }
      }

      // 2. Entrega Pendente
      // Busca eficiente da caçamba principal ou lista
      const cabId = loc.cacambaId || (loc.cacambaIds && loc.cacambaIds[0]);
      if (cabId) {
        const cab = cacambasMap.get(cabId);
        if (cab && !cab.dataEntrega && loc.status !== ('concluida' as any)) {
          const key = `entrega-${locId}`;
          if (!notifIds.has(key)) {
            addNotificacao({
              id: key,
              titulo: 'Entrega Pendente',
              mensagem: `A caçamba ${cab.codigo} precisa ser entregue para a locação #${locId.slice(-4)}.`,
              locacaoId: locId,
              lida: false
            });
          }
        }
      }
    });
  }

  private checkNearExpiry(state: any, today: Date, notifIds: Set<string>) {
    const { locacoes, addNotificacao } = state;
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    locacoes.forEach((loc: Locacao) => {
      const locId = loc.id!;
      if (loc.dataDevolucaoPrevista === tomorrowStr && loc.status === 'pago') {
        const key = `expiry-${locId}`;
        if (!notifIds.has(key)) {
          addNotificacao({
            id: key,
            titulo: 'Vencimento Próximo',
            mensagem: `A locação #${locId.slice(-4)} vence amanhã.`,
            locacaoId: locId,
            lida: false
          });
        }
      }
    });
  }
}

export const syncEngine = new SyncEngine();
