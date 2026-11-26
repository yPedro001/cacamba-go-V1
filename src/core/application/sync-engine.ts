import { AppState, useAppStore } from '@/store/useAppStore';
import { isLocacaoEncerrada, isLocacaoOverdue } from '@/core/domain/business-logic';
import { Cacamba, Locacao } from '@/core/domain/types';
import { addDaysLocalISO } from '@/lib/domain-helpers';

/**
 * SyncEngine: Gerencia tarefas automáticas em segundo plano.
 * Focado em manter o estado do sistema coerente com o passar do tempo, sem gerar spam de alertas.
 */
class SyncEngine {
  private interval: ReturnType<typeof setInterval> | null = null;
  private isProcessing = false;
  private readonly handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && !document.hidden) {
      this.process();
    }
  };

  start() {
    if (this.interval) return;

    this.process();

    this.interval = setInterval(() => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
          () => this.process()
        );
      } else {
        this.process();
      }
    }, 5 * 60 * 1000);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private process() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const state = useAppStore.getState();
      if (!state.usuarioAtual) return;

      const today = new Date();
      const notificacaoIds = new Set(state.notificacoes.map((n) => n.id));
      const cacambasMap = new Map<string, Cacamba>(state.cacambas.map((c) => [c.id, c]));

      this.checkOverdue(state, today, notificacaoIds);
      this.checkNearExpiry(state, today, notificacaoIds);
      this.checkPendingLogistics(state, notificacaoIds, cacambasMap);
    } finally {
      this.isProcessing = false;
    }
  }

  private checkOverdue(state: AppState, today: Date, notifIds: Set<string>) {
    const { locacoes, addNotificacao, setLocacoes } = state;
    let modified = false;

    const updatedLocs = locacoes.map((loc: Locacao): Locacao => {
      const locId = loc.id;
      if (!locId) return loc;

      if (isLocacaoOverdue(loc, today) && loc.status !== 'vencida' && !isLocacaoEncerrada(loc.status)) {
        modified = true;

        const key = `retirada-${locId}`;
        if (!notifIds.has(key)) {
          notifIds.add(key);
          addNotificacao({
            id: key,
            tipo: 'error',
            titulo: 'Retirada Necessária',
            mensagem: `A locação #${locId.slice(-4)} venceu. Favor verificar a retirada.`,
            locacaoId: locId,
            lida: false,
          });
        }
        return { ...loc, status: 'vencida' };
      }
      return loc;
    });

    if (modified) {
      setLocacoes(updatedLocs);
    }
  }

  private checkPendingLogistics(
    state: AppState,
    notifIds: Set<string>,
    cacambasMap: Map<string, Cacamba>
  ) {
    const { locacoes, addNotificacao } = state;

    locacoes.forEach((loc: Locacao) => {
      const locId = loc.id;
      if (!locId || isLocacaoEncerrada(loc.status)) return;

      if (loc.status === 'entrega_pendente') {
        const cabId = loc.cacambaId || (loc.cacambaIds && loc.cacambaIds[0]);
        const cab = cabId ? cacambasMap.get(cabId) : undefined;
        if (!cab || !cab.dataEntrega) {
          const key = `entrega-${locId}`;
          if (!notifIds.has(key)) {
            notifIds.add(key);
            addNotificacao({
              id: key,
              tipo: 'info',
              titulo: 'Entrega Pendente',
              mensagem: cab
                ? `A caçamba ${cab.codigo} aguarda entrega para a locação #${locId.slice(-4)}.`
                : `A locação #${locId.slice(-4)} aguarda entrega.`,
              locacaoId: locId,
              lida: false,
            });
          }
        }
      }
    });
  }

  private checkNearExpiry(state: AppState, today: Date, notifIds: Set<string>) {
    const { locacoes, addNotificacao } = state;
    const tomorrowStr = addDaysLocalISO(today, 1);

    locacoes.forEach((loc: Locacao) => {
      const locId = loc.id;
      if (!locId) return;

      // Vencimento próximo aplica-se a locações ativas em uso (nunca às já encerradas)
      if (loc.dataDevolucaoPrevista === tomorrowStr && loc.status === 'em_uso') {
        const key = `expiry-${locId}`;
        if (!notifIds.has(key)) {
          notifIds.add(key);
          addNotificacao({
            id: key,
            tipo: 'warning',
            titulo: 'Vencimento Próximo',
            mensagem: `A locação #${locId.slice(-4)} vence amanhã.`,
            locacaoId: locId,
            lida: false,
          });
        }
      }
    });
  }
}

export const syncEngine = new SyncEngine();
