# DESIGN.md — CaçambaGo

> Sistema de design canônico do **CaçambaGo** (`hallmark: modern-minimal / utilitário industrial`, `macrostructure: Workbench (app) + Split/Auth (login) + Bottom-Bar App Shell (mobile)`, `designed-as-app`).
> Todas as rotas, modais, tabelas, mapas e fluxos devem consumir exclusivamente os tokens de [src/app/globals.css](file:///c:/Users/pedro/OneDrive/Documentos/00-Projetos/17-%20cacamba-go-V1/src/app/globals.css) e [tailwind.config.ts](file:///c:/Users/pedro/OneDrive/Documentos/00-Projetos/17-%20cacamba-go-V1/tailwind.config.ts).

---

## 1. Identidade & Direção Visual ("Logística Bruta & Precisão de Pátio")

- **Contexto real:** Operação mista entre **escritório/pátio** (desktop: planejamento, conferência financeira, relatórios e emissão de CTR) e **rua/obra** (celular sob sol forte ou turno noturno: entregas, retiradas, localização no mapa, recibos e PIX em poucos toques).
- **Âncora cromática da marca:** Obsidiana / Grafite de pátio + **Âmbar/Cobre industrial** (`#D97706` / `#EE8E2C`), alinhada ao logotipo oficial do CaçambaGo — eliminando 100% dos gradientes roxo/índigo genéricos, `italic` em títulos, glows artificiais e emojis decorativos como ícones de UI.
- **Orçamento de Accent:** A cor de destaque (`--primary` / `--accent`) ocupa no máximo **5% da área visível** (CTA principal, item ativo de navegação, foco/realce pontual). Nunca preencher cards inteiros com accent sólido.
- **Iconografia:** Exclusivamente `lucide-react` com espessura consistente (`strokeWidth={2}`) e proporção alinhada à tipografia.

---

## 2. Paleta Semântica (Light "Concreto Diurno" & Dark "Grafite Noturno")

Cores definidas via tokens HSL/RGB em `globals.css` (sem valores HEX hardcoded nos componentes de UI):

| Token Semântico | Light (`Concreto Diurno`) | Dark (`Grafite Noturno`) | Uso & Contraste |
|---|---|---|---|
| `--background` (`paper`) | `36 22% 95%` (`#F5F3EE`) | `30 10% 9%` (`#191715`) | Fundo base da aplicação (sem `#fff`/`#000` puros) |
| `--card` / `--popover` (`paper-2`) | `40 30% 98%` (`#FCFBF8`) | `30 10% 13%` (`#24211D`) | Cards, Sidebar, Header, Modais |
| `--muted` / `--secondary` (`paper-3`) | `36 16% 89%` (`#E8E4DA`) | `30 9% 18%` (`#322E29`) | Cabeçalhos de tabela, chips inativos, hover sutil |
| `--border` (`rule`) | `36 13% 79%` (`#D0CBC0`) | `30 8% 25%` (`#45403A`) | Bordas `1px` nítidas |
| `--input` (`rule-strong`) | `35 12% 66%` (`#B2ABA0`) | `30 8% 34%` (`#5E574F`) | Bordas de campos e controles (>= 3:1 UI) |
| `--foreground` (`ink`) | `28 14% 12%` (`#231E1A`) | `38 18% 93%` (`#F1EEE7`) | Texto principal (> 12:1) |
| `--muted-foreground` (`muted-ink`) | `30 10% 34%` (`#5F584E`) | `34 10% 66%` (`#B0A99F`) | Rótulos, metadados, placeholders (> 5.2:1) |
| `--primary` (`accent`) | `24 85% 42%` (`#C64D10`) | `31 89% 54%` (`#F18F24`) | CTA principal e navegação ativa (>= 4.8:1 c/ ink dedicado) |
| `--primary-foreground` (`accent-ink`) | `40 30% 98%` (`#FCFBF8`) | `28 20% 9%` (`#1B1611`) | Texto sobre botão primário |
| `--ring` (`focus`) | `214 82% 41%` (`#125DC0`) | `204 90% 65%` (`#56B6F7`) | Anel `:focus-visible` nítido |

### Estados Operacionais (UI, Gráficos e Pinos de Mapa — Cor + Rótulo + Ícone)
- **Disponível / Pago / Sucesso:** Light `#156E44` em `#E7F6EE` | Dark `#5AD197` em `#162E22`
- **Entrega Pendente / Info:** Light `#1B5AA8` em `#E8F1FC` | Dark `#6BB0FF` em `#182A42`
- **Em Uso / Alerta:** Light `#8A5200` em `#FDF3DE` (texto escuro em fundo âmbar — **nunca branco sobre amarelo**) | Dark `#F5BA42` em `#362912`
- **Vencida / Crítico / Erro:** Light `#B9261E` em `#FCEAE9` | Dark `#F97A70` em `#3B1A18`

---

## 3. Tipografia (2 + 1 Disciplinada)

Carregamento via `next/font/google` no `layout.tsx` (`display: 'swap'`):
1. **Display (`--font-display`) — `Space Grotesk` (`600`, `700`):** Títulos de página (`h1`), títulos de modais e wordmark `CaçambaGo`. **`font-style: normal` obrigatório** (proibido `italic`), `tracking: -0.02em`, `line-height: 1.15`.
2. **UI & Corpo (`--font-body`) — `IBM Plex Sans` (`400`, `500`, `600`, `700`):** Menus, botões, formulários, tabelas e textos corridos.
3. **Técnica / Tabular (`--font-mono`) — `JetBrains Mono` (`500`, `700`):** Restrita a códigos de caçamba (`C-001`), números de CTR, CPF/CNPJ, CEP e valores monetários com `font-variant-numeric: tabular-nums`.
4. **Exceção documental preservada:** As fontes cursivas locais `'Allura'` e `'PlaywriteCOGuides'` ficam isoladas exclusivamente dentro das folhas A4 impressas/PDF do CTR e do Recibo.

### Piso Legível & Mobile-First
- **Menor texto na UI:** `12px` (`text-xs`). Eliminadas ocorrências de `8px/9px/10px`.
- **Inputs/Selects/Textareas no mobile (`< 768px`):** mínimo `16px` (`text-base md:text-sm`) para impedir auto-zoom no iOS Safari e garantir leitura ao sol.
- **Headings (`h1`):** `clamp(1.375rem, 2.2vw + 0.9rem, 1.875rem)` com `min-w-0` e quebra segura.

---

## 4. Layout Desktop vs Mobile App-Like

- **Viewport & Scroll:** `viewportFit: 'cover'`, `overflow-x: clip` no `html`/`body`, padding inferior seguro em telas móveis (`pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-8`).
- **Desktop (`>= 768px`):**
  - Sidebar adaptável ao tema (`bg-card border-r border-border`, colapsável entre `72px` e `240px`), agrupando todas as rotas incluindo `Docs / Ajuda` (`/documentacoes`).
  - Header limpo (`h-14`) com título da tela atual, CTA rápido `+ Nova Locação`, alternância de tema, sino de notificações e atalho de Perfil.
- **Mobile (`< 768px`, validado em `320px`, `375px`, `414px`):**
  - Header compacto (`h-14`) sem menu hambúrguer; popover de notificações contido dentro da largura do viewport (`inset-x-3`).
  - **Bottom Navigation Bar fixa** com 5 acessos principais ergonômicos para uso com o polegar (`Início`, `Aluguéis`, botão destacado `+ Nova`, `Mapa`, `Mais` abrindo Bottom Sheet com `CTR`, `Clientes`, `Gerenciamento`, `Relatórios`, `Perfil`, `Ajuda` e `Sair`).
  - **Listas responsivas:** Tabelas extensas usam **Cards empilhados no mobile (`md:hidden`)** e `<Table>` no desktop (`hidden md:block`).
  - **Modais no mobile (`ModalBase`):** Comportam-se como **Bottom Sheets** (`items-end md:items-center`, `max-h-[92dvh]`, rodapé `sticky bottom-0` com `env(safe-area-inset-bottom)`) para preservar botões visíveis com teclado virtual aberto.

---

## 5. Contrato Interativo & Preservação do CTR

- **Alvos de toque:** Mínimo `44px` (`min-h-[44px]`) em botões, links clicáveis, abas e campos de entrada no mobile; texto clicável com `whitespace-nowrap`.
- **Motion controlado:** Proibido `transition-all` — usar apenas transições explícitas de cor/borda/opacidade/transformação (`150ms–180ms cubic-bezier(0.16, 1, 0.3, 1)`), respeitando `@media (prefers-reduced-motion: reduce)`.
- **8 estados explícitos:** Default, Hover (`@media (hover: hover)`), Focus (`outline: 2px solid hsl(var(--ring))` sem layout shift), Active (`translate-y-px`), Disabled (`opacity-50 pointer-events-none`), Loading (spinner inline sem mudar largura), Error (borda `1px` vermelha + mensagem objetiva inline) e Success.
- **Camadas (`z-index`) nomeadas:** `--z-nav: 300`, `--z-dropdown: 350`, `--z-modal: 400`, `--z-confirm: 450`, `--z-toast: 500`.
- **Módulo CTR:** O template oficial A4 (`ctr-document-service.ts`), sua numeração, brasão, declarações, assinaturas, exportação PDF (`html2canvas` + `jsPDF`), Word (`.doc`) e impressão permanecem integralmente preservados em layout/regras, com correção de bugs técnicos (sanitização HTML, `ctr_itens.snapshot`, perfil na reimpressão, texto da classe de resíduo e visualização em escala no celular).
