# Plano de melhorias

## Onda 0 — baseline

- [x] Inventário técnico.
- [x] TypeScript e build inicial.
- [x] Auditoria de dados, UX, qualidade e performance.

## Onda 1 — integridade

- [x] Restringir persistência Zustand a cache por usuário e preferência visual.
- [x] Hidratar CTRs, itens, locais e configurações por usuário.
- [x] Abortar hidratação quando a leitura do perfil falhar.
- [x] Limpar domínio ativo no logout.
- [x] Persistir vínculos do CTR.
- [x] Corrigir patches parciais e filtro de locais.
- [ ] Implementar fila/versionamento do `app_state`.
- [ ] Definir tombstones ou fonte autoritativa para exclusões.
- [ ] Consolidar e aplicar migration CTR/RLS no ambiente ativo, mediante aprovação.

## Onda 2 — UX

- [x] Impedir submit acidental pelo autocomplete.
- [x] Melhorar grids móveis de clientes e perfil.
- [x] Corrigir integridade visual do CTR.
- [ ] Exibir erros de validação em todos os formulários.
- [ ] Associar labels e controles críticos.
- [ ] Criar layouts móveis para tabelas.
- [ ] Revisar popover de notificações e navegação por teclado.

## Onda 3 — performance

- [x] Carregar exportadores apenas sob demanda.
- [x] Remover acúmulo do listener de visibilidade.
- [ ] Lazy-load de gráficos e mapa.
- [ ] Reduzir assinaturas amplas do Zustand.
- [ ] Medir novamente os bundles após build final.

## Onda 4 — qualidade

- [x] Atualizar Next.js dentro da linha 15.5.
- [ ] Configurar ESLint CLI não interativo.
- [ ] Adicionar testes unitários para regras puras.
- [ ] Adicionar integração de autenticação/sincronização/CTR.
- [ ] Decompor hotspots acima de 500 linhas de forma incremental.

## Rollback

Cada onda deve permanecer em commit separado. Não aplicar migrations remotas junto com mudanças de UI. Em falha, reverter apenas o commit da onda afetada.
