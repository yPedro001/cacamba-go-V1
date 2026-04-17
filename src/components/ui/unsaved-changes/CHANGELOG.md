# Changelog - Proteção Contra Alterações Não Salvas em Modais

## Visão Geral

Implementado sistema global de proteção contra fechamento acidental de modais com dados não salvos. O sistema exibe confirmação quando o usuário tenta fechar sem concluir o preenchimento.

## Data de Implementação

17/04/2026

## Arquivos Criados

### 1. Hook Principal
- `src/components/ui/unsaved-changes/useModalUnsavedChanges.ts`
  - Hook para detecção de alterações com deep equality
  - Suporte para React Hook Form

### 2. Componente de Diálogo
- `src/components/ui/unsaved-changes/UnsavedChangesConfirmDialog.tsx`
  - Diálogo de confirmação estilizado com tema dark/light
  - Botões: "Sim, fechar" / "Não, continuar preenchendo"

### 3. Modal Wrapper
- `src/components/ui/unsaved-changes/ModalWithUnsavedGuard.tsx`
  - Wrapper que integra proteção automaticamente
  - Para uso com objetos de estado simples

### 4. HOC
- `src/components/ui/unsaved-changes/withUnsavedChangesGuard.tsx`
  - Higher Order Component
  - Hook useModalUnsavedGuard

### 5. Índice
- `src/components/ui/unsaved-changes/index.ts`
  - Exports unificados

### 6. Exemplo de Integração
- `src/features/customers/components/CustomerModalWithGuard.tsx`
  - Exemplo com CustomerModal

## Regras Implementadas

### Comportamento do Aviso
O aviso só aparece se:
- ✅ Campo for alterado/editado
- ✅ Algo for digitado
- ✅ Algum campo for preenchido

O aviso NÃO aparece se:
- ❌ Modal estiver vazio (campos em branco)
- ❌ Usuário apenas abriu o modal sem modificar

### Ações que Disparam o Aviso
- Clique no botão de fechar (X)
- Pressionar tecla Esc
- Clicar fora do modal

### Mensagem
```
Tem certainty que deseja fechar? Seu progresso até aqui será perdido.
```

### Botões
- "Sim, fechar" - Fecha e descarta dados
- "Não, continuar preenchendo" - Mantém modal aberto

## Como Usar

### Opção 1: ModalWithUnsavedGuard (Recomendado)

```tsx
import { ModalWithUnsavedGuard } from '@/components/ui/unsaved-changes';

// Com useState
const [currentClient, setCurrentClient] = useState({ nome: '', telefone: '' });
const [savedClient] = useState({ nome: '', telefone: '' });

<ModalWithUnsavedGuard
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  formData={currentClient}
  initialData={savedClient}
  title="Novo Cliente"
>
  {/* campos do formulário */}
</ModalWithUnsavedGuard>
```

### Opção 2: useModalUnsavedGuard (Hook)

```tsx
import { useModalUnsavedGuard } from '@/components/ui/unsaved-changes';

function MeuModal({ isOpen, onClose }) {
  const { handleClose, hasChanges, ConfirmDialog } = useModalUnsavedGuard({
    formData: formState,
    initialData: initialState,
  });

  return (
    <>
      <ModalBase onClose={handleClose}>
        {/* conteúdo */}
      </ModalBase>
      {ConfirmDialog}
    </>
  );
}
```

### Opção 3: HOC

```tsx
import { withUnsavedChangesGuard } from '@/components/ui/unsaved-changes';

const ClienteModalProtegido = withUnsavedChangesGuard(CustomerModal, {
  formData: currentClient,
  initialData: savedClient,
});

<ClienteModalProtegido isOpen={isOpen} onClose={handleClose} />
```

## Integração com Modais Existentes

### CustomerModal
Vá para:
`src/features/customers/components/CustomerModal.tsx`

Substitua o render:

```tsx
// ANTES:
<ModalBase isOpen={isOpen} onClose={onClose} ...>

// DEPOIS:
<ModalWithUnsavedGuard
  isOpen={isOpen}
  onClose={onClose}
  formData={currentClient}
  initialData={savedClient || currentClient} // Use last saved state
>
```

Variação com hook:

```tsx
import { useModalUnsavedGuard } from '@/components/ui/unsaved-changes';

function CustomerModalContent({ isOpen, onClose, currentClient, setCurrentClient, isEditing }) {
  const { handleClose, hasChanges, ConfirmDialog } = useModalUnsavedGuard({
    formData: currentClient,
    initialData: isEditing ? previousClient : { nome: '', telefone: '', email: '', cpfCnpj: '' },
  });

  return (
    <>
      <ModalBase onClose={handleClose} ...>
        {/* conteúdo */}
      </ModalBase>
      {ConfirmDialog}
    </>
  );
}
```

### CacambaModal
Mesma abordagem:

```tsx
<ModalWithUnsavedGuard
  isOpen={isOpen}
  onClose={onClose}
  formData={currentCacamba}
  initialData={savedCacamba}
  title="Nova Caçamba"
>
  {/* campos */}
</ModalWithUnsavedGuard>
```

### LocacaoModal
Como usa react-hook-form:

```tsx
import { useForm } from 'react-hook-form';

// Dentro do componente
const form = useForm<LocacaoFormData>();

// Handler close
const handleClose = async () => {
  const canClose = !hasUnsavedChanges || await confirmClose(); // use hook
  if (canClose) onClose();
};
```

## Personalização

### Mensagem Customizada

```tsx
<ModalWithUnsavedGuard
  unsavedMessage="Se fechar, perderá os dados!"
  unsavedTitle="Atenção!"
>
```

### Tema

```tsx
theme="dark" // ou "light" ou "auto"
```

### Campos Específicos

Para verificar apenas campos específicos:

```tsx
const hasChanges = 
  currentClient.nome !== savedClient.nome ||
  currentClient.telefone !== savedClient.telefone;
```

## Testes Recomendados

1. ✅ Abrir modal vazio → fechar sem aviso
2. ✅ Abrir modal, digitar algo → fechar → ver aviso
3. ✅ Clicar "Sim, fechar" → modal fecha
4. ✅ Clicar "Não, continuar" → modal permanece
5. ✅ Pressionar Esc → ver aviso
6. ✅ Clicar fora do modal → ver aviso

## Histórico

| Data | Descrição |
|------|----------|
| 17/04/2026 | Implementação inicial |
| 17/04/2026 | Alteração no LocacaoModal - confirmação de fechamento sempre ativa |

## Atualização: LocacaoModal (17/04/2026)

### Problema Anterior
O sistema de detecção de alterações não salvas não estava funcionando corretamente no modal de locação, pois utilizava React Hook Form com estado interno complexo.

### Nova Abordagem Adotada
Modificação directa no `LocacaoModal.tsx` para sempre exibir a confirmação ao tentar fechar, independentemente de haver alterações ou não.

### Como Funciona Atualmente

#### 1. Estado Interno
```tsx
const [showCloseConfirm, setShowCloseConfirm] = useState(false);
```

#### 2. Handlers de Fechamento
```tsx
// Função que abre o diálogo de confirmação
const handleClose = () => {
  setShowCloseConfirm(true);
};

// Confirma o fechamento (descarta dados)
const handleConfirmClose = () => {
  setShowCloseConfirm(false);
  onClose();
};

// Cancela o fechamento (continua no modal)
const handleCancelClose = () => {
  setShowCloseConfirm(false);
};
```

#### 3. Diálogo de Confirmação
```tsx
<UnsavedChangesConfirmDialog
  isOpen={showCloseConfirm}
  onConfirm={handleConfirmClose}
  onCancel={handleCancelClose}
  message="Tem certeza que deseja cancelar o cadastro? Os dados preenchidos serão perdidos."
  confirmText="Sim, cancelar"
  cancelText="Não, continuar"
/>
```

#### 4. Bindings no ModalBase
```tsx
<ModalBase
  onClose={handleClose}  // Sempre passa por handleClose
  ...
>
  <Button onClick={handleClose}>Cancelar</Button>
</ModalBase>
```

### Fluxo Atual
1. Usuário abre o modal de locação
2. Usuário tenta fechar (X, Cancelar, Esc, ou clique fora)
3. handleClose() é chamado → setShowCloseConfirm(true)
4. Diálogo de confirmação aparece
5. Se "Sim, cancelar" → onClose() executado
6. Se "Não, continuar" → showCloseConfirm volta a false

### Diferença para os Demais Modais
- **Clientes/Caçambas**: Só mostra confirmação se houver alterações detectadas
- **Locação**: Sempre mostra confirmação (por padrão, para evitar fechamento acidental)

### Arquivos Modificados
- `src/features/rentals/components/LocacaoModal.tsx` - Adicionada lógica interna de confirmação
- `src/features/rentals/hooks/useRentalsController.ts` - Simplificado (remoção da lógica complexa)
- `src/features/rentals/components/LocacaoModalWithGuard.tsx` - Wrapper simplificado

### Uso do LocacaoModalWithGuard
```tsx
import { LocacaoModalWithGuard } from '@/features/rentals';

<LocacaoModalWithGuard 
  clientes={clientes}
  perfil={perfil}
  cacambas={cacambas}
  triggerButton={
    <Button>Nova Locação</Button>
  }
/>
```