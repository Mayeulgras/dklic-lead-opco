# Application de génération de leads — Financement formation via OPCO

Document de spécification et de cadrage technique

---

## 1. Contexte et objectif

Le client édite un site web Odoo pour son activité de formation en entreprise. Il décroche une partie de ses contrats via les OPCO (Opérateurs de Compétences), qui financent la formation professionnelle des entreprises.

**Objectif** : transformer un visiteur du site en lead qualifié, en lui donnant une raison concrète de laisser ses coordonnées — connaître l'OPCO dont dépend son entreprise et une estimation du budget formation mobilisable — puis en l'orientant vers une prise de contact (étude de financement ou montage de dossier).

## 2. Résumé du besoin

Un bouton sur le site Odoo du client renvoie vers une application dédiée, codée sur mesure, qui :

1. Collecte via un formulaire en plusieurs étapes (UX soignée) : nom de l'entreprise, adresse, SIRET, SIREN, nom et prénom du contact, téléphone, email.
2. Détermine automatiquement l'OPCO de rattachement de l'entreprise et un budget de formation estimé.
3. Affiche les formations du catalogue Odoo correspondant au secteur d'activité de l'entreprise.
4. Propose deux actions de conversion : **« Étude de financement de vos formations »** ou **« Montage de dossier »**.

## 3. Point d'attention critique : ce que les données publiques permettent réellement

Ce point conditionne toute la faisabilité technique et doit être validé avec le client avant le développement.

| Donnée demandée | Disponibilité | Source |
|---|---|---|
| Identité entreprise (nom, adresse, SIRET, SIREN, code NAF) | ✅ Disponible en API publique, gratuite | API Recherche d'entreprises (recherche-entreprises.api.gouv.fr, DINUM) |
| OPCO de rattachement | ✅ Disponible via API tierce, à partir du SIRET/SIREN ou de l'IDCC | API CFADock (et outil équivalent chez France Compétences, dont les données de correspondance sont sous licence de réutilisation) |
| Budget formation exact et disponible en temps réel | ❌ **Non disponible en accès public** | Réservé à l'espace adhérent privé de l'entreprise sur le portail de son OPCO |

**Conséquence pratique** : le montant affiché à l'issue du formulaire ne peut pas être le solde réel du compte de l'entreprise. Ce sera une **estimation indicative**, calculée à partir de règles publiques (plafond de prise en charge par branche/IDCC, forfait horaire, effectif de l'entreprise) — la même approche que celle utilisée par les simulateurs commerciaux existants sur ce marché.

**Recommandation** : afficher clairement un libellé du type *« Budget estimatif, à confirmer avec votre OPCO »*, plutôt que de présenter le chiffre comme garanti. C'est un point à valider explicitement avec le client, car cela conditionne le discours commercial de l'outil.

## 4. Parcours utilisateur

**Contrainte technique** : l'ensemble du parcours (étapes 1 à 4) tient sur **une seule page** (une seule route), sans rechargement ni navigation entre URLs différentes. La progression d'étape en étape est gérée côté client par un state React (étape courante + données collectées), affiché dans un seul composant de formulaire multi-étapes. Le passage à l'étape 4 (résultat) se fait par changement d'affichage au sein de cette même page, une fois la réponse du backend d'orchestration reçue.

### Étape 1 — Identification de l'entreprise
- Champ de recherche par nom d'entreprise avec auto-complétion (interrogation de l'API Recherche d'entreprises en direct)
- Sélection dans la liste de résultats → pré-remplissage automatique de l'adresse, du SIRET, du SIREN et du code NAF
- Possibilité de saisie manuelle du SIRET si l'entreprise n'apparaît pas

### Étape 2 — Confirmation des informations entreprise
- Affichage des champs pré-remplis (adresse, SIRET, SIREN) pour validation/correction par l'utilisateur

### Étape 3 — Coordonnées du contact
- Nom, prénom, téléphone, email
- Case de consentement RGPD (obligatoire)

### Étape 4 — Résultat
- Nom de l'OPCO identifié
- Budget de formation estimé (avec mention "estimatif")
- Liste des formations du catalogue Odoo correspondant au secteur (code NAF) de l'entreprise
- Deux boutons d'action : *Étude de financement* / *Montage de dossier*

## 5. Design et identité visuelle

### 5.1 Charte graphique

| Usage | Couleur |
|---|---|
| Fond de page | Sable clair `#fdf9ef` |
| Fond secondaire (cards, sections) | Sable `#faf1da` |
| Boutons, accents, liens | Vert `#106d7a` |
| Texte | Noir classique `#000000` |

Police : **Poppins** (via `next/font/google`), utilisée comme police principale (`--font-sans`) pour tous les textes.

### 5.2 Fond animé — nuage de points
- Nuage de points (particules) en arrière-plan de la page, animé en continu, dérivant vers le coin haut-droit, en boucle infinie (une particule qui sort du viewport réapparaît côté opposé)
- Effet purement décoratif : positionné derrière le contenu (z-index bas), opacité réduite pour ne pas nuire à la lisibilité du formulaire, non interactif
- Implémentation recommandée : `<canvas>` + `requestAnimationFrame` (léger, sans dépendance lourde) ; alternative si besoin de configuration plus riche : `@tsparticles/react`
- Doit respecter `prefers-reduced-motion` (animation ralentie ou désactivée si l'utilisateur a activé la réduction de mouvement) et rester performant sur mobile (nombre de particules limité)

### 5.3 Logo
- Logo dklic fixe en haut à gauche de la page, visible à toutes les étapes du parcours (au-dessus du fond animé et du contenu du formulaire)
- Format à fournir par le client, SVG de préférence

### 5.4 Animations des champs du formulaire
- Chaque input du formulaire multi-étapes s'anime à l'apparition et à la disparition, lors des transitions entre étapes (fade + léger déplacement, style cohérent sur toutes les étapes)
- Implémentation recommandée : Framer Motion (`motion/react`), avec `AnimatePresence` pour animer la sortie des champs avant démontage lors du changement d'étape
- Respecter `prefers-reduced-motion` également pour ces animations

## 6. Architecture technique

```
Bouton (site Odoo client)
        │
        ▼
Page unique (app frontend) — formulaire multi-étapes en state client
        │  (étapes 1 à 3 : saisie)
        ▼
Backend d'orchestration (Next.js API routes)
        │
        ├──► API SIRET/SIREN (identité entreprise)
        ├──► API OPCO / IDCC (OPCO + budget estimé)
        └──► Odoo — CRM (création lead) + catalogue (formations)
        │
        ▼
Même page — affichage du résultat (étape 4 : OPCO, budget, formations, 2 CTA)
```

Le backend agrège les réponses des trois intégrations avant de renvoyer le résultat au frontend. Les deux boutons d'action finaux déclenchent soit l'envoi d'un email/notification interne, soit la mise à jour du lead Odoo avec le type de demande choisi. Il n'y a qu'une seule route/page dans l'application : toutes les étapes (saisie et résultat) s'affichent au sein du même composant, sans changement d'URL.

## 7. Détail des intégrations

### 6.1 Identité entreprise — API Recherche d'entreprises
- API publique, gratuite, sans authentification, maintenue par la DINUM (data.gouv.fr)
- Recherche par nom, SIREN ou SIRET
- Retourne : raison sociale, adresse, SIRET, SIREN, code NAF/APE, effectif (tranche)
- Usage : auto-complétion à l'étape 1, pré-remplissage à l'étape 2

### 6.2 Détermination de l'OPCO
- API CFADock : recherche par SIRET/SIREN ou par code IDCC (convention collective), retourne l'OPCO de rattachement
- **Fallback recommandé** : constituer une table de correspondance interne NAF → IDCC → OPCO (11 OPCO existants), à utiliser si l'API externe est indisponible ou ne retourne pas de résultat (entreprise pas encore rattachée formellement à un OPCO)
- Vérifier au démarrage du projet les conditions d'accès et de réutilisation de l'API CFADock (quotas, éventuel coût), et les conditions de licence si les tables France Compétences sont utilisées en complément

### 6.3 Budget de formation estimé
Calcul interne, à définir précisément avec le client, basé sur :
- L'effectif de l'entreprise (tranche donnée par l'API Recherche d'entreprises)
- Les plafonds de prise en charge publiés par branche/OPCO (forfait horaire + plafond annuel par salarié)
- Un affichage sous forme de fourchette plutôt qu'un chiffre unique, pour rester honnête sur le caractère estimatif

Ce module est le plus délicat du projet : il nécessite de construire et maintenir une base de règles par OPCO/branche, qui évolue chaque année.

### 6.4 Intégration Odoo
- Création du lead dans le CRM (modèle `crm.lead`) via l'API JSON-RPC ou XML-RPC d'Odoo, avec toutes les données collectées (entreprise, contact, OPCO identifié, budget estimé, action choisie)
- Requête sur le catalogue de formations (modèle produit ou modèle dédié formations) filtrée par secteur d'activité (code NAF) pour afficher les formations pertinentes en fin de parcours
- Nécessite la création d'un utilisateur technique/API côté Odoo avec les droits adéquats, limités aux modèles concernés

## 8. Stack technique recommandée

| Composant | Choix proposé |
|---|---|
| Frontend | Next.js (App Router) + TypeScript, shadcn/ui (composants), React Hook Form + Zod (validation par étape), Tailwind CSS — thème clair uniquement, pas de bascule sombre/clair |
| Charte graphique | Vert `#106d7a` (boutons/accents), Sable `#faf1da` et Sable clair `#fdf9ef` (fonds), texte noir `#000000` ; police Poppins (`next/font/google`) |
| Animations | Framer Motion (`motion/react`) pour les transitions d'entrée/sortie des inputs ; `<canvas>` + `requestAnimationFrame` (ou `@tsparticles/react`) pour le fond animé de particules |
| Backend | Next.js — API routes / Server Actions (couche d'orchestration intégrée, pas de service séparé) |
| Base de données | Légère (Postgres/SQLite) — cache des réponses API + table de correspondance NAF/IDCC/OPCO de secours |
| Intégration Odoo | JSON-RPC / XML-RPC natif d'Odoo, appelé depuis les routes API Next.js |
| Hébergement | Vercel (frontend + backend, déploiement unifié) |

## 9. RGPD et sécurité

- Collecte de données personnelles (nom, téléphone, email) : case de consentement explicite obligatoire à l'étape 3, lien vers la politique de confidentialité du client
- Transmission systématique en HTTPS
- Base légale probable : intérêt légitime (prospection B2B), à confirmer avec le client ou son conseil
- Minimisation des données : ne stocker que ce qui est nécessaire au traitement du lead
- Pas de stockage de données sensibles (aucune donnée bancaire ou d'identité personnelle sensible n'est collectée dans ce parcours)

## 10. Plan de réalisation

1. **Cadrage** — valider avec le client la méthode de calcul du budget estimé, le wording ("estimatif"), la maquette du formulaire, les accès Odoo nécessaires
2. **Intégrations de données** — API SIRET/SIREN, API/logique OPCO, table de correspondance de secours
3. **Développement frontend** — formulaire multi-étapes + page de résultat
4. **Développement backend** — orchestration des appels API, calcul du budget estimé
5. **Intégration Odoo** — création de lead CRM + requête catalogue formations
6. **Tests** — cas limites : SIRET invalide, entreprise non trouvée, OPCO non identifié, API externe indisponible, Odoo indisponible
7. **Mise en production** — intégration du bouton sur le site client, suivi analytics du taux de conversion par étape

## 11. Points ouverts à valider avec le client

- Formule exacte de calcul du budget estimé (précision souhaitée, sources de plafonds à utiliser, fréquence de mise à jour des règles par branche)
- Wording exact autour du caractère "estimatif" du montant affiché
- Accès techniques Odoo (identifiants API, droits, modèle de formations utilisé)
- Design/charte graphique à respecter (cohérence avec le site principal)
- Devenir des deux CTA finaux : formulaire de contact supplémentaire, prise de rendez-vous, simple notification interne ?
- Fichier logo dklic à récupérer (format SVG de préférence) pour l'intégration en haut à gauche
