# Mapa da Arquitetura: CaçambaGo 🗺️

> **Última Atualização:** 2026-04-29
> **Status:** Em desenvolvimento ativo
> **Stack:** Next.js 14 + Supabase + TypeScript + Shadcn/UI + Leaflet

---

## 1. Visão Geral do Projeto

Sistema SaaS de gestão de locação de caçambas com foco em:
- **Gestão de Caçambas**: Controle de estoque, status e localização
- **Locações**: Contratos, vencimentos, financeiro
- **Clientes**: Cadastro, histórico, endereços múltiplos
- **CTR (Controle de Transporte de Resíduos)**: Geração e gestão de documentos legais
- **Mapa em Tempo Real**: Visualização de caçambas e entregas via Leaflet

---

## 2. Árvore de Diretórios

```text
/raiz-do-projeto
├── src/
│   ├── app/                    # Next.js App Router (Páginas e API)
│   │   ├── pagina.tsx          # Dashboard principal
│   │   ├── mapa/               # Mapa em tempo real (Leaflet)
│   │   ├── alugueis/            # Gestão de locações
│   │   ├── clientes/           # Cadastro de clientes
│   │   ├── gerenciamento/      # Gestão de caçambas e inventário
│   │   ├── ctr/                # Documentação CTR
│   │   ├── relatorios/         # Relatórios e métricas
│   │   ├── perfil/             # Configurações da empresa
│   │   ├── login/              # Autenticação
│   │   └── api/geocode/        # Proxy de geolocalização
│   ├── components/             # Componentes UI globais (Shadcn)
│   │   ├── ui/                 # Componentes base (Button, Input, Modal, etc.)
│   │   ├── Sidebar.tsx         # Navegação lateral
│   │   ├── Header.tsx          # Cabeçalho com notificações
│   │   └── AddressAutocomplete.tsx  # Busca de endereços
│   ├── core/                   # Lógica de Negócio
│   │   ├── domain/
│   │   │   ├── types.ts        # Definições de tipos (Cliente, Locacao, Cacamba)
│   │   │   ├── schemas.ts      # Validação Zod
│   │   │   ├── business-logic.ts  # Cálculos financeiros
│   │   │   └── ctr-types.ts    # Tipos específicos de CTR
│   │   └── application/        # Actions e transformações
│   ├── features/               # Módulos Funcionais
│   │   ├── map/                # Mapa Leaflet (componentes, hooks)
│   │   ├── rentals/            # Locações (modal, resumo, recibo)
│   │   ├── customers/          # Clientes (tabela, modal)
│   │   ├── inventory/          # Inventário de caçambas
│   │   └── ctr/                # Módulo CTR completo
│   ├── infrastructure/         # Conectores Externos
│   │   ├── api/                # Serviços (geocode)
│   │   └── supabase/           # Cliente e config Supabase
│   ├── lib/                    # Utilitários (masks, currency, utils)
│   ├── shared/                 # Providers (BackgroundSync)
│   └── store/                  # Zustand (useAppStore.ts)
├── supabase/                   # Scripts SQL (migrations, schema)
├── docs/                       # Documentação (email_templates.md)
├── schema_definitions.json     # Schema das tabelas
└── schema_paths.json           # Mapeamento de caminhos
```

---

## 3. Principais Features

### 🗺️ Mapa (Leaflet)
- Visualização de caçambas no mapa
- Marcadores por status (disponivel, locada, entrega_pendente, vencida)
- Filtros por status
- Overlay de informações

### 📋 Locações (Rentals)
- **LocacaoModal**: Formulário completo com:
  - Cliente existente ou novo cadastro rápido
  - Seleção de caçamba (específica ou automática)
  - Endereço com autocomplete e geolocalização
  - Cálculo automático: **valor × quantidade de caçambas**
  - Financials: valor bruto, taxas, valor líquido
  - Salvamento de endereço no cliente
- **RentalsSummary**: Dashboard de locações ativas
- **ReciboModal**: Geração de recibos

### 👥 Clientes (Customers)
- Cadastro com múltiplos endereços
- Histórico de locações
- Busca por CPF/CNPJ ou telefone

### 📦 Inventário (Inventory)
- Gestão de caçambas (código, status, tamanho)
- Histórico de status
- Modal de edição

### 📄 CTR (Controle de Transporte de Resíduos)
- **CTRForm**: Criação de documentos CTR
- **CTRHistoryTable**: Histórico de documentos
- **CTRDocumentPreview**: Visualização/impressão
- **LocalDescarteManager**: Gestão de locais de descarte
- **SelecaoAlugueis**: Seleção de locações vinculadas
- **ConflitosAlert**: Alertas de inconsistências

### ⚙️ Perfil
- Configurações da empresa (nome, CNPJ, contato)
- **Padrões Operacionais**:
  - Valor padrão de aluguel
  - Tamanho padrão de caçamba
  - Taxa de maquininha padrão
  - Juros de parcelamento

---

## 4. Stack Técnica

| Categoria | Tecnologia |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript |
| UI | Shadcn/UI + Tailwind CSS |
| Mapa | Leaflet + React-Leaflet |
| Estado | Zustand |
| Banco | Supabase (PostgreSQL) |
| Validação | Zod |
| Icons | Lucide React |
| Auth | Supabase Auth |

---

## 5. Banco de Dados (Principais Tabelas)

| Tabela | Descrição |
|--------|-----------|
| `cacambas` | Estoque de caçambas (id, identificador, codigo, status) |
| `alugueis` | Locações (clienteId, cacambaId, valor, datas, status) |
| `clientes` | Cadastro de clientes (nome, cpfCnpj, telefone, endereços) |
| `perfil` | Configurações da empresa |
| `locais_descarte` | Locais de descarte para CTR |

---

## 6. Padrões de Código

- **Arquitetura Modular**: Features isoladas em `src/features/`
- **Validação com Zod**: Schema definido em `core/domain/schemas.ts`
- **Estado Centralizado**: Zustand store em `src/store/useAppStore.ts`
- **Componentes Shadcn**: UI base em `src/components/ui/`
- **Nomenclatura**: PascalCase para componentes, camelCase para funções

---

## 7. Histórico de Mudanças Recentes

### 2026-04-29
- ✅ Cálculo automático do valor de aluguel baseado na quantidade de caçambas
- ✅ Label atualizado showing "Valor Total (n × R$ valor)"

---

*Este documento deve ser atualizado a cada feature significativa.*
