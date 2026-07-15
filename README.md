<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript strict" />
  <img src="https://img.shields.io/badge/React_Query-data--fetching-FF4154?logo=reactquery&logoColor=white" alt="React Query" />
  <img src="https://img.shields.io/badge/Zustand-state-443E38" alt="Zustand" />
</p>

# ERP — Frontend

Interface web de l'ERP sur mesure : stock, production (BOM), commandes et
gestion commerciale (devis, factures, avoirs, bons de livraison), consommant
l'API [backend NestJS](../backend).

## Stack technique

- **Framework :** Next.js 14 (App Router)
- **Langage :** TypeScript strict
- **Données serveur :** React Query (cache, invalidation, mutations)
- **État client :** Zustand (auth, préférences UI)
- **Graphiques :** Recharts (dashboard & analytics)
- **Temps réel :** Server-Sent Events (statut d'envoi des emails)

## Installation

```bash
pnpm install
```

Créer un fichier `.env.local` à la racine avec l'URL de l'API backend :

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Lancer le projet

```bash
# développement
pnpm dev

# build de production
pnpm build
pnpm start
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Structure

```
src/
├── app/          # routes (App Router)
├── components/   # composants réutilisables
├── hooks/        # hooks React Query par domaine (useQuotes, useInvoices, useDeliveryNotes, ...)
├── lib/          # client API (axios) et fonctions d'appel par module
├── store/        # état global Zustand (auth, ...)
├── types/        # types TypeScript partagés
└── middleware.ts # protection des routes / redirections auth
```

## Conventions

- Chaque module métier (devis, factures, bons de livraison, stock, produits...)
  a son propre hook `use<Ressource>.ts` dans `hooks/`, qui encapsule les appels
  à `lib/api.ts` et la gestion du cache React Query.
- Les mutations qui déclenchent un envoi d'email (`useSendQuoteEmail`,
  `useSendDeliveryNoteEmail`, etc.) invalident systématiquement la requête
  correspondante après succès.
- Le suivi temps réel des emails (`useEmailStream`) se connecte en SSE via
  un token passé en query param (`EventSource` ne permet pas d'en-tête
  `Authorization`).

## Qualité

```bash
pnpm lint
pnpm run build   # valide aussi le typage TypeScript en mode strict
```

## En savoir plus sur Next.js

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation React Query](https://tanstack.com/query/latest)