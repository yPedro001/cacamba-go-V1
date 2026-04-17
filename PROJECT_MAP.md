# Mapa da Arquitetura: CaçambaGo 🗺️

Este documento fornece uma visão estruturada da organização do projeto, seguindo os princípios de Responsabilidade Única e Arquitetura Modular.

## 1. Árvore de Diretórios

```text
/raiz-do-projeto
  ├── src/
  │   ├── app/                # Next.js App Router (Páginas e API)
  │   ├── components/         # Componentes UI globais (Shadcn)
  │   ├── core/               # Lógica de Negócio (Entidades e Casos de Uso)
  │   ├── features/           # Módulos Funcionais (Map, Rentals, Customers)
  │   ├── infrastructure/     # Conectores Externos (API, Supabase)
  │   ├── lib/                # Funções utilitárias e configurações globais
  │   ├── shared/             # Providers e componentes compartilhados
  │   └── store/              # Gerenciamento de Estado Global (Zustand)
  ├── supabase/               # Scripts SQL de Schema e Migrations
  ├── docs/                   # Documentação do projeto (Email, Fluxos)
  ├── next.config.mjs         # Configurações do Framework
  ├── tailwind.config.ts      # Tokens de Design e Tematização
  └── package.json            # Dependências e Scripts
```

## 2. Descrição Funcional da Estrutura

### 📂 `src/app/`
Responsável pelo roteamento e layout da aplicação.
- `/mapa`: Centro de operações com mapa em tempo real.
- `/alugueis`: Gestão de contratos e locações.
- `/clientes`: Cadastro e histórico de clientes.
- `/api/geocode`: Proxy para geolocalização de endereços.

### 📂 `src/features/`
Contém os módulos de negócio verticais. Cada pasta (`customers`, `rentals`, `map`) agrupa seus próprios componentes internos, hooks especializados e tipos.
- `map/`: Lógica pesada de integração com **Leaflet** e renderização de markers.
- `rentals/`: Formulários complexos de locação e cálculos de vencimento.

### 📂 `src/core/`
O coração do sistema, independente de frameworks.
- `domain/`: Definição dos tipos (`types.ts`) que modelam o negócio (Cliente, Locacao, Caçamba).
- `application/`: Actions e lógica de transformação de dados.

### 📂 `src/infrastructure/`
Camada de integração com o mundo externo.
- `services/`: Cliente Supabase configurado e serviços de geocodificação.

### 📂 `src/store/`
Gerenciamento de estado reativo.
- `useAppStore.ts`: Store centralizada onde os dados do Supabase são espelhados para acesso instantâneo pelos componentes.

## 3. Arquivos Críticos

- `next.config.mjs`: Contém o flag `reactStrictMode: false`, crítico para a estabilidade do Leaflet Map.
- `src/app/globals.css`: Centraliza a importação do `leaflet.css` e tokens de cores do tema Premium.
- `src/store/useAppStore.ts`: Ponto único de verdade para o estado da aplicação.

---

Este mapa foi gerado automaticamente para garantir consistência entre o código e a documentação.
