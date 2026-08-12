# Validação final

## Gates executados

| Gate | Resultado |
|---|---|
| `npx tsc --noEmit` | Aprovado durante a implementação |
| `npm run build` | Aprovado com Next.js 15.5.23 |
| `git diff --check` | Aprovado após correção de whitespace |
| `npm run lint` | Script legado; ainda não é gate confiável |
| Testes automatizados | Projeto não possui suíte configurada |

## Performance observada

Imports dinâmicos removeram os exportadores pesados do carregamento inicial:

- Dashboard: 517 kB → 187 kB.
- Clientes: 532 kB → 202 kB.
- Aluguéis: 591 kB → 261 kB.
- Gerenciamento: 582 kB → 253 kB.
- Relatórios: 630 kB → 300 kB.

## Smokes manuais necessários

- Login com conexão normal e com falha de leitura.
- Troca de conta A → B → A sem dados cruzados.
- Logout por sidebar, header e perfil.
- Cadastro, edição e exclusão de cliente/aluguel/caçamba.
- Emissão CTR com vários aluguéis e verificação de `ctr_itens`.
- Novo PDF/Word CTR: margens, rodapé e assinaturas.
- Layout de cliente e perfil em 360×800 e 768×1024.
- Exportação PDF e Excel após os imports dinâmicos.

## Não validado nesta execução

- Banco Supabase ativo, migrations, RLS e RPC.
- Microsoft Word real.
- Deploy Vercel.
- Fluxos autenticados por navegador sem credenciais de teste.
