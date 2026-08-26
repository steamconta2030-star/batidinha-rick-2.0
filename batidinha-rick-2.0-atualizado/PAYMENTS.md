# Pagamento online — Mercado Pago Pix

A integração foi preparada para usar Checkout Transparente via Orders API.

## Segurança

Nunca coloque `MERCADO_PAGO_ACCESS_TOKEN` no React, `.env` público ou em variável `VITE_*`.
A credencial deve existir somente nos Secrets das Supabase Edge Functions.

## Componentes adicionados

- `supabase/migrations/005_payments.sql`
- `supabase/functions/create-pix-payment/index.ts`
- `supabase/functions/mercadopago-webhook/index.ts`

## Configuração

1. Crie uma aplicação no Mercado Pago Developers.
2. Comece com credenciais de teste.
3. Cadastre uma chave Pix na conta Mercado Pago.
4. No projeto Supabase, adicione o secret `MERCADO_PAGO_ACCESS_TOKEN`.
5. Aplique a migration `005_payments.sql`.
6. Publique as duas Edge Functions.
7. No Mercado Pago, configure notificações do tópico `order` apontando para a URL pública da função `mercadopago-webhook`.
8. Teste integralmente antes de trocar para credenciais de produção.

## Fluxo

1. O pedido é criado pelo fluxo existente e o total continua sendo calculado/validado no servidor.
2. O frontend chama `create-pix-payment` com `orderId` e `payerEmail`.
3. A função busca o valor real do pedido no banco; o navegador não escolhe o valor cobrado.
4. A função cria uma order Pix no Mercado Pago com chave de idempotência baseada no pedido.
5. A resposta fornece QR Code/Copia e Cola/link para pagamento.
6. O pedido permanece com `payment_status = pending`.
7. O Mercado Pago envia uma notificação quando o estado muda.
8. O webhook não confia no status recebido: consulta `/v1/orders/{id}` no Mercado Pago e então atualiza o banco.
9. Quando a order estiver `processed/accredited`, o pedido recebe `payment_status = paid` e `paid_at`.

## Próxima etapa

Integrar a tela de checkout do React para:

- pedir e-mail do pagador quando Pix online for escolhido;
- chamar `create-pix-payment` depois que o pedido for criado;
- exibir QR Code, Copia e Cola e tempo de expiração;
- acompanhar `payment_status` em tempo real;
- diferenciar claramente `payment_method` de `payment_status`;
- definir a regra operacional: pedidos Pix só devem entrar na produção automaticamente depois de `paid`.

## Observação sobre webhook

Antes da produção, adicionar validação da assinatura/autenticidade da notificação conforme a configuração de Webhooks utilizada na aplicação Mercado Pago, além da reconsulta já implementada ao provedor.
