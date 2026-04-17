# CaçambaGo
Sistema completo de gerenciamento de caçambas de entulho.

## Instruções para Executar

1. **Pré-requisitos**: Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
2. **Instalar Dependências**: Abra o terminal nesta pasta e execute:
   ```bash
   npm install
   ```
3. **Configuração Supabase**:
   - Crie um arquivo `.env.local` na raiz contendo:
     ```
     NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
     NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key_aqui
     ```
   - Execute o SQL contido em `supabase/schema.sql` no [SQL Editor do Supabase](https://supabase.com) para criar todas as tabelas, Storage e Triggers em Tempo Real. As triggers já vão automatizar o status da caçamba com base na tabela de aluguéis.
4. **Executar em Desenvolvimento**:
   ```bash
   npm run dev
   ```
   Abra `http://localhost:3000` no seu navegador.

A interface está adaptada para "Dark Mode" de acordo com os requisitos e utiliza os ícones do Lucide, Leaflet (Mapas), e Recharts (Gráficos) com o layout Shadcn e Tailwind CSS.
