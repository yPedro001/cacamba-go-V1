# Auditoria completa do Caçamba Go

Data: 2026-08-12

## Baseline

- 119 arquivos em `src`, `supabase` e `docs` no início da auditoria.
- 102 arquivos TypeScript/TSX e aproximadamente 14,6 mil linhas.
- Stack confirmada: Next.js 15, React 19, TypeScript, Zustand, Supabase e Tailwind.
- TypeScript e build aprovavam; lint era um script `next lint` obsoleto; não havia testes automatizados.
- Obsidian em `D:\Obsidian\obsidian` não estava acessível.

## Mapa operacional

| Área | Entrada | Estado/persistência | Saída principal |
|---|---|---|---|
| Autenticação | `/login` | Supabase Auth + `perfis.app_state` | sessão e hidratação do store |
| Dashboard | `/` | Zustand | indicadores e atalhos |
| Clientes | `/clientes` | Zustand + `app_state` | cadastro, busca e exportação |
| Aluguéis | `/alugueis` | Zustand + `app_state` | contratos, status e recibos |
| Estoque | `/gerenciamento` | Zustand + `app_state` | caçambas e histórico |
| Mapa | `/mapa` | locações/caçambas + geocode | posições e filtros |
| CTR | `/ctr` | tabelas CTR + Zustand | preview, PDF, Word e impressão |
| Relatórios | `/relatorios` | dados agregados do store | gráficos e exportações |
| Perfil | `/perfil` | `perfis.app_state` | dados e padrões operacionais |

## Achados prioritários confirmados

| ID | Pri. | Problema | Estado após esta onda |
|---|---|---|---|
| DATA-01 | P0 | Estado de uma conta podia sobreviver à troca de usuário | Corrigido no cache persistido e logout |
| DATA-02 | P0 | Falha de leitura podia ser seguida por sobrescrita da nuvem | Corrigido: hidratação aborta no erro |
| CTR-01 | P0 | Itens/snapshots do CTR eram montados e descartados | Corrigido com inserção e compensação |
| AUTH-01 | P1 | Logout alternativo não encerrava Supabase | Corrigido |
| UX-01 | P1 | Sugestão de endereço podia submeter formulário | Corrigido com `type="button"` |
| UX-02 | P1 | Formulário de cliente/perfil quebrava em telas estreitas | Corrigido nos grids principais |
| PERF-01 | P1 | ExcelJS/jsPDF entravam no carregamento inicial | Corrigido com imports dinâmicos |
| PERF-02 | P2 | Listener de visibilidade acumulava | Corrigido |
| CTR-02 | P1 | PDF sem margens, rodapé cortado e assinaturas divergentes | Corrigido; exige novo smoke real |
| DATA-03 | P0 | Merge por união pode ressuscitar registros excluídos | Pendente de estratégia de versão/tombstone |
| DATA-04 | P0 | Updates concorrentes de `app_state` podem chegar fora de ordem | Pendente de fila/revisão no backend |
| DB-01 | P1 | Migrations/RPC/RLS possuem divergências | Pendente de validação no banco ativo |

## Pendências por área

- Formulários: renderizar erros RHF junto aos campos e associar todos os labels.
- Mobile: criar visualização em cards para tabelas extensas e simplificar o modal CTR.
- Mapa: remover controles duplicados e substituir hotlink dos ícones Leaflet.
- Relatórios: alternativa tabular acessível aos gráficos e lazy loading do Recharts.
- Qualidade: reduzir `any` prioritariamente em persistência, mapa e formulários.
- Banco: consolidar migrations e usar emissão atômica validando `auth.uid()`.
- Persistência: substituir o JSON integral por fila/revisão ou registros normalizados.

## Limites

Nenhuma migration, policy, dado remoto ou deploy foi alterado. Achados dependentes do Supabase ativo permanecem como pendência de ambiente.
