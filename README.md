# Batidinha do Rick 2.0

Repositório principal do sistema **Batidinha do Rick 2.0**.

## Versão oficial

A versão atualmente tratada como oficial e destinada a evolução, testes e publicação é:

`batidinha-rick-2.0-atualizado/`

Essa versão contém o cardápio público, carrinho, checkout, painel administrativo, pedidos, cozinha, entrega, caixa, integração com Supabase, PWA e recursos de operação em tempo real.

## Pastas legadas

As pastas abaixo permanecem temporariamente no repositório apenas para preservar histórico e facilitar comparação durante a consolidação:

- `Batidinha do rick 2.0/`
- `batidinha-rick-2.0-com-fotos/`

Não faça novas alterações nessas versões. Novas correções e funcionalidades devem ser aplicadas em `batidinha-rick-2.0-atualizado/`.

## Desenvolvimento local

```bash
cd batidinha-rick-2.0-atualizado
npm ci
npm run dev
```

Para validar uma alteração antes de publicar:

```bash
npm run build
```

## Supabase

Copie `.env.example` para `.env.local` dentro da pasta oficial e preencha apenas as variáveis públicas necessárias. Nunca versione chaves secretas ou `service_role`.

## Publicação

Os workflows do repositório estão sendo alinhados para compilar e publicar exclusivamente `batidinha-rick-2.0-atualizado/`.

## Consolidação futura

Depois da validação completa da versão oficial em produção, as versões legadas poderão ser removidas em um pull request separado e claramente identificado. Nenhuma exclusão de legado deve ser feita antes dessa validação.
