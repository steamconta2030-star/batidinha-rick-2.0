# Batidinha do Rick

Sistema web para operação da Batidinha do Rick, com cardápio digital, personalização de batidinhas, pedidos em tempo real, painel administrativo, cozinha, entrega e PDV.

## Estratégia

O projeto reutiliza padrões técnicos validados no DistribuIA, sem copiar módulos desnecessários nem credenciais:

- React 19 e TypeScript
- Vite
- CSS responsivo
- Supabase/PostgreSQL
- PWA e suporte offline progressivo
- atualização de pedidos em tempo real

## Desenvolvimento em ondas

1. Fundação, arquitetura e segurança
2. Catálogo, categorias, produtos e imagens
3. Quantidades, sabores, preparo e adicionais
4. Cardápio público e carrinho
5. Pedidos e central em tempo real
6. Entrega, retirada, bairros e taxas
7. Painel, cozinha, caixa e relatórios
8. Testes, segurança e publicação

Consulte [docs/ARQUITETURA.md](docs/ARQUITETURA.md) para as decisões técnicas.

## Regras de segurança

- Nunca versionar arquivos `.env`.
- Usar um projeto Supabase exclusivo para o Batidinha do Rick.
- Calcular preços e taxas no servidor.
- Isolar dados por estabelecimento.
- Validar toda entrada pública com Zod.
- Não transportar políticas RLS antigas sem revisão.

## Estado atual

- Cardápio público, carrinho e checkout funcionando em modo local.
- Entrega, retirada, bairros e taxas configuráveis.
- Painel administrativo, pedidos, cozinha, caixa e PWA incorporados.
- Supabase preparado para autenticação, persistência e atualização em tempo real.

Sem variáveis do Supabase, o aplicativo entra em modo demonstração e mantém carrinho e pedidos no navegador.
