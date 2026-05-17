# Privacy Landing Page

Landing page mobile-first de assinatura de conteúdo exclusivo, inspirada no Privacy.

## Início rápido

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

---

## Como editar TUDO sem programar

### 1. Editar informações da modelo

Abra `/config/site.json` e altere a seção `model`:

```json
"model": {
  "name": "Seu Nome Aqui",
  "username": "@seuarroba",
  "avatar": "/media/avatar.jpg",
  "banner": "/media/banner.mp4",
  "bio": "Sua bio aqui...",
  "verified": true,
  "liveNow": false
}
```

### 2. Trocar fotos e vídeos

Coloque seus arquivos na pasta `/public/media/`:

| Arquivo | Uso |
|---------|-----|
| `avatar.jpg` | Foto do perfil (recomendado: 200×200px) |
| `banner.mp4` ou `banner.jpg` | Banner principal |
| `feed1.jpg`, `feed2.jpg`... | Fotos do feed |
| `feed4.mp4`... | Vídeos do feed |

**Formatos suportados:** JPG, PNG, WEBP, MP4, WEBM

### 3. Alterar preços e planos

```json
"plans": [
  {
    "title": "30 Dias",
    "price": "9,90",
    "badge": "Promocional",
    "badgeColor": "green",
    "highlight": true,
    "cta": "ASSINE AGORA 🔥",
    "extra": "+ BÔNUS EXCLUSIVO!"
  }
]
```

- `highlight: true` → plano destacado em laranja (apenas um)
- `badgeColor`: `green`, `orange`, `blue`, `gray`
- Adicione ou remova planos à vontade

### 4. Alterar o Super Combo

```json
"combo": {
  "title": "Meu Super Combo",
  "price": "99,90",
  "benefits": [
    "Acesso vitalício",
    "Grupo exclusivo",
    "WhatsApp direto"
  ]
}
```

### 5. Alterar feed bloqueado

```json
"feed": [
  {
    "type": "image",
    "src": "/media/feed1.jpg",
    "blur": true,
    "likes": "55.3K",
    "comments": "8.4K"
  },
  {
    "type": "video",
    "src": "/media/meu-video.mp4",
    "blur": true,
    "likes": "100K",
    "comments": "5K"
  }
]
```

- `blur: true` → conteúdo bloqueado com cadeado
- `blur: false` → conteúdo visível (para preview grátis)

### 6. Alterar popup de prova social

```json
"socialProof": {
  "enabled": true,
  "interval": 4000,
  "notifications": [
    { "name": "João S.", "action": "assinou", "plan": "30 Dias" },
    { "name": "Carlos M.", "action": "assinou", "plan": "Super Combo" }
  ]
}
```

- `interval`: tempo em ms entre notificações (4000 = 4 segundos)

### 7. Alterar FAQ

```json
"faq": [
  {
    "question": "É seguro?",
    "answer": "Sim, 100% seguro e discreto."
  }
]
```

### 8. Alterar banner de promoção

```json
"promo": {
  "enabled": true,
  "text": "PROMOÇÃO VÁLIDA ATÉ 31/12/2026"
}
```

---

## Estrutura de pastas

```
/
├── config/
│   └── site.json          ← EDITE AQUI
├── public/
│   └── media/             ← COLOQUE SUAS MÍDIAS AQUI
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Plans.tsx
│   ├── Feed.tsx
│   ├── Combo.tsx
│   ├── FAQ.tsx
│   ├── SocialProof.tsx
│   ├── Footer.tsx
│   └── icons/
│       ├── PrivacyLogo.tsx
│       ├── VerifiedIcon.tsx
│       ├── LockIcon.tsx
│       └── ...
├── types/
│   └── site.ts
└── README.md
```

## Clonar para outra modelo

1. Duplique a pasta do projeto
2. Edite `/config/site.json`
3. Substitua as mídias em `/public/media/`
4. `npm run dev`

Pronto! Novo perfil funcionando.

---

## Deploy (Vercel)

```bash
npm install -g vercel
vercel
```

Ou conecte o repositório em vercel.com.
