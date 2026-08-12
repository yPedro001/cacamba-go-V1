# Auditoria geral do Caçamba Go — 2026-08-11

## Escopo e validações

- Auditoria estática proporcional, sem alterações automáticas fora do CTR e da seleção de clientes.
- `npx tsc --noEmit --pretty false`: aprovado.
- `npm run build`: aprovado com Next.js 15.5.15.
- `npm audit --omit=dev`: 9 vulnerabilidades reportadas (6 altas e 3 moderadas).
- Vault `D:\Obsidian\obsidian`: indisponível no ambiente desta execução.

## Achados priorizados

| ID | Prioridade | Área | Evidência | Impacto | Recomendação | Esforço |
|---|---|---|---|---|---|---|
| AUD-01 | P1 | Sessão/estado | `src/store/useAppStore.ts`, `useAuthActions.ts`, `useCTRController.ts` | Dados de CTR, locais e configurações podem permanecer ao trocar de conta no mesmo navegador. | Criar reset completo por sessão e carregar todos os slices pelo usuário atual. | Médio |
| AUD-02 | P1 | Sincronização | `src/core/application/useAuthActions.ts` | Uma falha de leitura do Supabase pode ser seguida por sincronização de dados locais/default, sobrescrevendo dados válidos. | Tratar o erro antes do merge e impedir sincronização após leitura falha. | Pequeno |
| AUD-03 | P1 | CTR/dados | `src/core/application/ctr-service.ts` | A emissão monta itens de vínculo com aluguéis, mas não grava `ctr_itens`. | Persistir CTR e itens de forma atômica. | Médio |
| AUD-04 | P1 | Numeração CTR | `src/core/application/ctr-service.ts`, `supabase/sql/production-deploy.sql` | Número baseado nos últimos dígitos de `Date.now()` pode colidir. | Usar sequência atômica por usuário/ano já prevista nas migrations. | Médio |
| AUD-05 | P1 | Conta | `src/app/perfil/page.tsx`, `src/core/application/useDataActions.ts` | “Excluir conta” limpa apenas dados locais e não exclui conta/dados remotos. | Renomear a ação ou implementar exclusão real no backend. | Médio |
| AUD-06 | P1 | Dependências | `package.json`, `npm audit --omit=dev` | Dependências de produção possuem avisos conhecidos. | Atualizar Next para versão corrigida compatível, renovar lockfile e reauditar. | Pequeno/médio |
| AUD-07 | P1* | Supabase | `supabase/sql/production-deploy.sql` | Script de produção não contém habilitação explícita de RLS. Risco depende do banco realmente implantado. | Comparar com migrations canônicas e validar policies no ambiente ativo. | Médio |
| AUD-08 | P2 | CTR/Supabase | `src/core/application/ctr-service.ts` | Falha na consulta filtrada de locais dispara fallback sem filtro e mascara o erro original. | Remover fallback global e oferecer retry. | Pequeno |
| AUD-09 | P2 | Persistência | `src/features/ctr/hooks/useCTRController.ts` | Falhas ao salvar local/padrão ainda podem atualizar estado local como sucesso. | Confirmar estado somente após persistência ou marcar operação offline. | Pequeno |
| AUD-10 | P2 | Qualidade | `package.json` | Script `next lint` não funciona como gate confiável no Next atual; não há suíte automatizada central. | Configurar ESLint CLI e testes focados nos fluxos críticos. | Médio |
| AUD-11 | P2 | Performance | `src/core/application/sync-engine.ts` | Listener de `visibilitychange` não é removido e acumula após ciclos de login/logout. | Guardar callback e removê-lo em `stop()`. | Pequeno |
| AUD-12 | P2 | Responsividade | `src/components/AppShell.tsx` | Detecção mobile baseada em `window.innerWidth` não reage a redimensionamento/rotação. | Usar media query reativa ou CSS responsivo. | Pequeno |
| AUD-13 | P2 | Autenticação/UX | `src/app/login/page.tsx`, `src/components/ui/otp-input.tsx` | Fluxo exibe inconsistência entre código OTP de 6 e 8 dígitos. | Centralizar o tamanho em uma configuração. | Pequeno |
| AUD-14 | P2 | API | `src/app/api/geocode/route.ts` | Endpoint não limita tamanho/tempo e devolve detalhes de debug. | Validar entrada, aplicar timeout/cache simples e remover debug público. | Pequeno |
| AUD-15 | P3 | Documentação | `PROJECT_MAP.md`, `package.json` | Documentação informa Next 14, mas projeto usa Next 15.5.15. | Atualizar mapa técnico. | Pequeno |
| AUD-16 | P3 | Tipagem | `src/core/domain/types.ts` | Contratos centrais ainda usam `any` para notificações/configurações. | Tipar gradualmente, começando por persistência e CTR. | Médio |

`P1*`: prioridade potencial; confirmar no ambiente Supabase implantado antes de classificar como falha ativa.

## Ordem recomendada

1. Corrigir isolamento de sessão e sincronização (`AUD-01`, `AUD-02`).
2. Garantir integridade do CTR e numeração (`AUD-03`, `AUD-04`).
3. Corrigir a ação de exclusão de conta (`AUD-05`).
4. Atualizar dependências e validar RLS real (`AUD-06`, `AUD-07`).
5. Resolver P2 em lotes pequenos, cada um com teste de regressão.
