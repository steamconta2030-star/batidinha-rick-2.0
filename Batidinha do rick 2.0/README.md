# Batidinha do Rick — Cardápio Online

Landing page de uma página só para a **Batidinha do Rick** (Ipatinga), feita para receber tráfego pago (anúncios) e converter direto em pedido no WhatsApp.

## Estrutura

```
.
├── index.html   → página inteira (HTML + CSS + JS num arquivo só)
└── README.md    → este arquivo
```

Não tem build, não tem dependências para instalar. É só abrir/publicar o `index.html`.

## Como subir no GitHub

1. Crie um repositório novo no GitHub (ex: `batidinha-do-rick`).
2. Envie os arquivos desta pasta para o repositório:

   ```bash
   git init
   git add .
   git commit -m "Cardápio online da Batidinha do Rick"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/batidinha-do-rick.git
   git push -u origin main
   ```

## Como publicar de graça (GitHub Pages)

1. No repositório, vá em **Settings → Pages**.
2. Em "Build and deployment", escolha **Deploy from a branch**.
3. Selecione a branch `main` e a pasta `/ (root)`.
4. Salve. Em alguns minutos o site fica no ar em:
   `https://SEU-USUARIO.github.io/batidinha-do-rick/`

Esse é o link que pode ser usado no anúncio (Meta Ads / Instagram).

## Antes de rodar o anúncio

- Confirme o número de WhatsApp no `index.html` (procure por `5531985011514`).
- Quando o sabor açaí estiver disponível, procure por `flavor-soon` e `em breve` no `index.html` e atualize o texto do selo.
- Teste o botão "Pedir agora no WhatsApp" no celular antes de impulsionar.
