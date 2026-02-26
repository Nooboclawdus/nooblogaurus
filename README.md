# Nooblogaurus

> Blog personnel de Noobosaurus R3x — Bug bounty, outils, et cheat sheets de sécurité offensive.

**Live:** [nooblogaurus.online](https://nooblogaurus.online)

## À propos

Ce site regroupe mes articles, mes cheat sheets techniques, et quelques-uns de mes outils. C'est un blog statique généré avec Astro, hébergé sur GitHub Pages.

### Contenu

- **Articles** — Deep-dives techniques (IDOR, fuzzing, recon)
- **Sheets** — 40+ cheat sheets pour pentest et bug bounty
- **Tools** — Présentation de mes outils (Navarro, DNSpector, RedFlagger)

## Stack Technique

- **Framework:** [Astro](https://astro.build) 5.x
- **Styling:** Tailwind CSS 4.x
- **Syntax Highlighting:** highlight.js
- **Déploiement:** GitHub Pages
- **CI/CD:** GitHub Actions

## Structure

```
nooblogaurus/
├── src/
│   ├── components/       # Composants Astro réutilisables
│   ├── content/
│   │   ├── articles/    # Articles longs (markdown)
│   │   └── sheets/      # Cheat sheets (markdown)
│   ├── layouts/         # Layout principal
│   ├── pages/           # Routes du site
│   └── styles/          # CSS global
├── public/              # Assets statiques
└── astro.config.mjs     # Config Astro
```

## Développement Local

### Prérequis

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Commandes

| Commande | Action |
|----------|--------|
| `npm run dev` | Démarrer serveur local (`localhost:4321`) |
| `npm run build` | Build production (`./dist/`) |
| `npm run preview` | Prévisualiser le build |

## Ajout de Contenu

### Nouvel article

Créer `src/content/articles/mon-article.md`:

```markdown
---
title: "Mon titre"
description: "Description courte"
date: "2026-02-17"
tags: ["tag1", "tag2"]
---

# Contenu ici
```

Puis l'ajouter dans `src/pages/articles/index.astro`.

### Nouveau cheat sheet

Créer `src/content/sheets/mon-tool.md`:

```markdown
# mon-tool

> Description courte du tool

## Quickstart
...
```

Les cheat sheets suivent un format standardisé:
- Titre + description
- Quickstart (exemples rapides)
- Core Concepts (table des concepts)
- Syntax
- Options (tables organisées)
- Recipes (cas d'usage réels)
- Troubleshooting
- References

## Déploiement

Le site se déploie automatiquement sur GitHub Pages via GitHub Actions lors d'un push sur `main`.

### Pipeline

1. Build Astro (`npm run build`)
2. Déploiement sur `gh-pages` branch
3. Disponible sur `nooblogaurus.online`

## Contribution

Ce repo est personnel, mais si tu repères une erreur ou une amélioration possible:
- Ouvre une issue
- Propose une PR

## Licence

MIT — Utilise le contenu comme tu veux, crédite l'auteur si possible.

## Auteur

**Noobosaurus R3x**
- GitHub: [@Nooboclawdus](https://github.com/Nooboclawdus)
- Twitter: [@NoobosaurusR3x](https://twitter.com/NoobosaurusR3x)
- Site: [nooblogaurus.online](https://nooblogaurus.online)
