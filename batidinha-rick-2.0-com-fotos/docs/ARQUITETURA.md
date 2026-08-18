# Arquitetura do Batidinha do Rick

## Objetivo da primeira versão

Entregar um sistema de uma única loja, preparado para expansão futura, com:

- cardápio público;
- batidinhas personalizáveis;
- entrega e retirada;
- pedidos salvos antes do redirecionamento ao WhatsApp;
- central de pedidos em tempo real;
- painel administrativo responsivo.

## Contextos do sistema

### Catálogo

Categorias, produtos, imagens, disponibilidade e promoções.

### Personalização de batidinhas

Quantidades, sabores, quantidade máxima de combinações, modo de preparo, adicionais e regras de preço.

### Pedido

Carrinho, cliente, endereço, bairro, taxa, pagamento, troco, observações e histórico de status.

### Operação

Central de pedidos, cozinha, entregadores, caixa e relatórios.

## Decisões técnicas

- **React + TypeScript:** interface tipada e reutilizável.
- **Vite:** desenvolvimento e geração otimizada dos arquivos de produção.
- **Supabase/PostgreSQL:** autenticação, banco, storage e realtime.
- **CSS responsivo:** identidade visual própria e experiência adaptada ao celular.
- **PWA:** instalação e suporte offline progressivo.

## Princípios de segurança

1. O cliente nunca determina preço final.
2. O servidor recalcula produtos, sabores, adicionais, promoções e entrega.
3. Pedidos públicos passam por uma rota de servidor validada.
4. RLS limita dados administrativos ao estabelecimento correto.
5. Credenciais administrativas nunca usam prefixo público ou `VITE_`.
6. O WhatsApp não é a fonte oficial do pedido; o banco é.

## Reaproveitamento do DistribuIA

### Reaproveitar

- componentes de interface genéricos;
- autenticação;
- cliente Supabase;
- catálogo e upload de imagens;
- bairros e taxas;
- central em tempo real;
- PWA, indicador offline e sincronização;
- conceitos de PDV e caixa.

### Reescrever ou adaptar

- modelo de produtos;
- itens de pedido;
- personalização de batidinhas;
- cálculo de preço;
- cardápio público;
- políticas RLS.

### Não incluir inicialmente

- NF-e/NFC-e;
- módulo SaaS;
- câmeras;
- compras e fornecedores;
- contas a pagar e receber;
- integração iFood;
- roteirização avançada.
