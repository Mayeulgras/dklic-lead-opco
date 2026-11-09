# Cadrage du calcul de financement OPCO

Ce document fait foi pour le moteur de calcul (`lib/financement/`). Il consigne la
demande du responsable de l'entreprise, ce qui a été vérifié sur sources
officielles, et les décisions qui en découlent.

Dernière mise à jour : 2026-10-02

---

## 0. Refonte du 2026-09-16 — modèle des concurrents (fait foi)

**Cette section remplace les décisions des §3 et suivants.** Le simulateur à
curseurs (formule 30 €/h × 7 h × jours × apprenants) est abandonné. Il reste
consultable au commit `e52e075`.

### Pourquoi

Six simulateurs concurrents ont été analysés : Matchers (cité par le
responsable), Mon Budget OPCO, MonBudgetFormation, Mon Financement OPCO,
L'Agence Sauvage, Alfie Formation. **Aucun ne propose de curseurs.** Tous
affichent un seul chiffre : le budget annuel que l'OPCO accorde au plan de
développement des compétences d'une entreprise de cette taille. Décision prise
avec le développeur : on fait comme eux.

### Le parcours (3 écrans)

1. **Entreprise** — un champ, nom ou SIRET.
2. **« Nous avons trouvé votre entreprise »** — on montre l'OPCO et la taille
   détectés (taille corrigeable), puis on demande les coordonnées. Le contact est
   demandé **avant le montant**, après avoir prouvé que l'outil sait (modèle
   L'Agence Sauvage).
3. **Budget** — le plafond annuel, l'OPCO, « ordre de grandeur indicatif », un
   bouton « Être rappelé par un conseiller ».

### Le calcul

Une lecture de tableau : `PLAFONDS_ANNUELS[opco][taille]` dans
`lib/financement/budget.ts`.

| OPCO | Moins de 11 | 11 à 49 | Origine |
|---|---|---|---|
| Afdas | 1 100 € | 1 800 € | critères 2026 |
| AKTO | 4 500 € | 5 600 € | règles de prise en charge 2026 |
| OPCO Atlas | 8 000 € | 8 000 € | panorama OGMA 2026 |
| Constructys | 3 500 € | 5 000 € | source secondaire pour 3 500 € ; aucun budget national publié (« contactez vos interlocuteurs en région ») |
| OCAPIAT | 3 000 € | 5 000 € | **estimé** (plafond publié par stagiaire seulement) |
| L'Opcommerce | 2 000 € | 4 000 € | IDCC 2216, commerce de détail |
| OPCO 2i | 6 000 € | 6 000 € | moins de 50 salariés |
| OPCO EP | 4 200 € | 4 200 € | branche coiffure, IDCC 2596 |
| OPCO Mobilités | 1 500 € | 1 800 € | Services de l'automobile 2026 |
| OPCO Santé | 2 500 € | 2 500 € | source secondaire |
| Uniformation | 5 000 € | 5 000 € | moins de 50 salariés |

- **50 salariés et plus** : pas de montant, « Sur étude » — le financement se
  décide projet par projet.
- **OPCO non identifié** (aucune convention déclarée, ~1 entreprise sur 3) :
  **fourchette** entre le plus bas et le plus haut des onze OPCO (1 100 € à
  8 000 € sous 11 salariés). Une médiane était affichée au départ : elle tombait
  pile sur les plafonds de Constructys et d'OCAPIAT, si bien qu'on ne pouvait
  plus distinguer « OPCO trouvé » de « OPCO inconnu ». Une fourchette ne peut
  jamais être confondue avec un montant précis.

OPCO EP était auparavant à 10 000 € : cette valeur venait d'une branche de niche
(mandataires judiciaires). Remplacée par la branche coiffure, représentative des
TPE de cet OPCO, qui pèse 24 % du trafic mesuré.

### Ce qui est conservé

L'identification de l'OPCO par IDCC (948 conventions, §2 et
`scripts/generer-table-idcc.mjs`) — c'est exactement ce que les concurrents
mettent en avant (« sans chercher votre IDCC »).

---

## 1. Demande du responsable (mail reçu, verbatim)

> Bonjour Mayeul,
>
> Au vu de cette réponse apportée par CLAUDE, je pense qu'il faudrait construire
> le logiciel autour de :
>
> - Du nombre de salarié(es) dans l'entreprise.
> - Compter 30€ (moyenne) / heure sur 7 heures / jour de formation sur 3 jour de
>   formation entre 5 et 12 apprenants par jour :
>   - A/ soit 1 jour : entre 1050€ et 2520€
>   - B/ soit 2 jours : entre 2100€ et 5040€
>   - C/ soit 3 jours : entre 3150€ et 7560€
>
> - Rajouter (peut-être) 10% de plus car l'entreprise pourrait proposer à son
>   OPCO un "Plan de formation" précis qui devrait être accepté.
>
> Le progiciel de la société MATCHER n'est pas juste comme nous le savions mais
> enregistre les noms / adresse mail / téléphone etc...
> L'idée est que cela puisse être comme un jeu pour l'entreprise et un moyen de
> les contacter lorsqu'il laisse leur « contact »

### Ce qu'il faut en retenir

1. **La formule est arithmétiquement cohérente** : `30 € × 7 h × jours × apprenants`.
   Les six montants de la grille se vérifient exactement.
2. **Ce n'est pas un « budget disponible »** mais le **coût d'une action de
   formation**, donc le montant que l'OPCO rembourserait. Tout le wording doit
   suivre : « coût finançable », jamais « budget disponible ».
3. **La précision n'est pas l'objectif** : l'argument MATCHER dit explicitement
   que la capture de contact prime sur l'exactitude du chiffre.
4. **Le résultat doit être ludique** : l'étape 4 est un simulateur manipulable,
   pas un chiffre asséné.

---

## 1 bis. Texte explicatif joint au mail (verbatim)

Le responsable s'appuyait sur cette explication, transmise avec sa demande. Elle
est reproduite ici parce qu'elle est la source des deux erreurs corrigées au §2.
**Ne pas la traiter comme une référence : le §2 fait foi.**

> il n'existe pas de "montant dû" fixe et unique que l'entreprise pourrait
> interroger comme un solde de compte (contrairement au CPF, qui est un compte
> individuel avec un montant crédité). Le financement OPCO fonctionne par
> remboursement/prise en charge action par action.
>
> **1. La contribution versée par l'entreprise** (ce n'est pas ce qui détermine
> son droit) — Les entreprises versent une Contribution à la Formation
> Professionnelle (CFP) via l'URSSAF, calculée sur la masse salariale brute :
> 0,55% pour les entreprises de moins de 11 salariés, 1% au-delà. Cette
> contribution alimente un pot mutualisé par branche, elle n'ouvre pas un
> « droit » individuel proportionnel à ce que l'entreprise a versé.
>
> **2. Le calcul du montant de prise en charge pour une formation donnée** —
> Quand une entreprise demande "combien vais-je toucher pour cette formation",
> l'OPCO calcule au cas par cas :
> - Plan de développement des compétences : un forfait horaire (NPEC) fixé par la
>   branche/l'OPCO, généralement entre 15 € et 40 € par heure et par stagiaire,
>   multiplié par le nombre d'heures de formation, avec un plafond annuel par
>   salarié.
> - Contrats d'apprentissage : calcul au prorata journalier : montant versé =
>   (NPEC annuel / 365) × nombre de jours du contrat. France compétences publie le
>   NPEC de référence, et les branches professionnelles peuvent le moduler de ±20%
> - Frais annexes (transport, hébergement, repas) : forfaits séparés, variables
>   selon l'OPCO.
>
> **3. Les variables qui font varier le résultat** — L'OPCO de rattachement
> (déterminé par la convention collective/code IDCC) ; La taille de l'entreprise :
> les TPE-PME de moins de 50 salariés bénéficient d'une prise en charge quasi
> intégrale grâce au cofinancement de France Compétences ; Le type de dispositif
> mobilisé (plan de compétences, Pro-A, apprentissage, FNE-Formation) ; Le montant
> réel des contributions déjà versées peut aussi jouer un rôle dans certains OPCO.
>
> **Implication pour votre outil** : si vous voulez afficher un "montant auquel
> l'entreprise a droit", il faudra probablement demander à l'utilisateur : son
> OPCO/branche, sa taille, le type de formation visée et sa durée — le résultat
> sera une estimation du remboursement possible pour une action de formation
> précise, pas un solde disponible générique.

---

## 2. Vérifications sur sources officielles

Le texte du §1 bis a été recoupé sur sources officielles le 2026-09-03.
Résultat : le principe général est bon, **deux affirmations sont fausses**.

### Confirmé

| Élément | Valeur | Source |
|---|---|---|
| Taux CFP, moins de 11 salariés | 0,55 % de la masse salariale | Urssaf |
| Taux CFP, 11 salariés et plus | 1 % | Urssaf |
| Pas de solde interrogeable | Financement action par action, pot mutualisé par branche | France Compétences |
| Nomenclature INSEE des tranches d'effectif | Voir §4 | INSEE / Sirene |

### Corrigé

**Le NPEC n'est pas le forfait horaire du plan de développement des compétences.**
Le NPEC est un montant **annuel forfaitaire par contrat d'apprentissage**, fixé
par les branches et publié par France Compétences. Deux dispositifs distincts
avaient été fusionnés. Ne pas réutiliser ce terme dans l'interface.

**« Les TPE-PME de moins de 50 salariés bénéficient d'une prise en charge quasi
intégrale » est faux.** Données France Compétences : les entreprises de moins de
50 salariés cofinancent **en moyenne 38 %** par versements volontaires, part qui
monte à **67 % au-delà de 50 salariés**.

### Le seuil de 50 salariés

La dotation France Compétences aux OPCO pour le plan de développement des
compétences est **réservée aux entreprises de moins de 50 salariés**. Au-delà, on
change de mécanisme (budgets conventionnels de branche, versements volontaires),
on ne passe pas à un taux dégradé.

**Conséquence commerciale : le discours « votre OPCO finance cette formation »
est solide sous 50 salariés et fragile au-dessus. La cible naturelle du
simulateur est la TPE-PME.**

### Forfaits horaires réellement publiés

Il n'existe **aucun barème national unique** : chaque OPCO publie sa grille,
révisée chaque année.

| Branche / OPCO | Forfait constaté |
|---|---|
| Uniformation (cohésion sociale) | 15 €/h, + 3 € cofinancement branche = 18 €/h |
| Uniformation, remplacement < 11 sal. | 13 €/h |
| Atlas — bureaux d'études (Syntec) | 40 € HT/h, plafonné à 150 h par formation |
| AKTO — inter-entreprises | plafonné à 60 €/h/salarié |
| Estimation générale de marché | 18 à 45 €/h |

Soit un rapport de **1 à 4** selon la branche. Les 30 €/h retenus sont un milieu
de fourchette défendable, mais légèrement optimistes.

**C'est ce qui rend l'identification de l'OPCO indispensable** : elle détermine le
tarif horaire, donc le premier facteur du montant. Elle n'est pas une accroche
décorative.

### Plafonds — point critique

| Barème | Plafond |
|---|---|
| Uniformation, < 50 salariés | 5 000 €/an |
| OPCOMMERCE (IDCC 2216), 11-49 salariés | 4 000 €/an par salarié |
| Autre barème, 11-49 salariés | 10 000 €/an, **sans frais annexes** |
| Uniformation | 2 000 € par jour de 7 heures |

**La grille du responsable culmine à 7 560 € et sa journée maximale vaut 2 520 €
— au-dessus du plafond journalier de 2 000 € constaté, et au-dessus du plafond
annuel de plusieurs OPCO.** Le montant le plus attractif de la grille dépasse donc
ce qui serait réellement financé chez plusieurs opérateurs.

C'est le scénario de la déception au téléphone : le modèle doit **écrêter**, pas
seulement multiplier.

### Frais annexes

Transport, hébergement, repas font l'objet de forfaits séparés — mais certains
barèmes les excluent explicitement. À conditionner à l'OPCO, jamais à afficher
systématiquement.

---

## 3. Décisions retenues

### Rôle du nombre de salariés

Trois lectures étaient possibles. **Retenu : l'effectif plafonne la taille du
groupe et conditionne l'éligibilité, il ne multiplie pas le montant.**

Écarté : faire du nombre de salariés un multiplicateur de sessions. Raisons —
le pot est mutualisé (aucun droit proportionnel à l'effectif), les plafonds
annuels l'interdisent mécaniquement, et une entreprise de 10 000 salariés
afficherait plusieurs millions d'euros, ce qui décrédibilise l'outil auprès des
grands comptes qui le testeront par curiosité.

L'effectif agit donc sur trois leviers réels :
1. Il **plafonne le groupe** (une entreprise de 6 salariés ne forme pas 12 personnes)
2. Il **conditionne l'accès aux fonds mutualisés** (seuil de 50 salariés)
3. Il **détermine le taux de cofinancement** (~38 % sous 50 salariés, ~67 % au-dessus)

### Identification de l'OPCO : CFADock abandonné

La spec §7.2 prévoyait l'API CFADock. **Elle n'est plus utilisable** : le portail
est passé derrière une clé développeur réservée aux CFA, et tous les chemins
`/api/*` renvoient désormais la coquille du site.

Solution retenue, meilleure que la prévue : **l'API Recherche d'entreprises que
l'on interroge déjà renvoie l'IDCC** dans `complements.liste_idcc` et
`siege.liste_idcc`. La correspondance IDCC → OPCO est dérivée de la table
SIRET-OPCO officielle de France Compétences (data.gouv.fr, Licence Ouverte 2.0,
108 Mo) : 3,6 millions d'établissements agrégés donnent **948 IDCC** couvrant les
11 OPCO, dans un fichier de quelques kilo-octets.

Bénéfices : aucun appel réseau supplémentaire, aucune clé, aucun quota, et une
table régénérable par `node scripts/generer-table-idcc.mjs` quand France
Compétences publie une nouvelle version.

Un IDCC dont l'OPCO majoritaire ne dépasse pas 60 % est écarté (5 cas) plutôt que
tranché au hasard. Les valeurs d'échappement `9999` (hors convention), `9998`
(non déterminée) et `0000` ne désignent aucune branche et sont ignorées.

**Limite connue** : l'IDCC est souvent absent — Danone renvoie `9999`. Dans ce
cas l'OPCO reste non identifié et le barème moyen s'applique, ce que l'interface
énonce explicitement. Un repli NAF → OPCO reste possible mais demanderait une
autre source.

### Le +10 %

Non retenu tel quel : aucun mécanisme ne donne 10 % de plus parce qu'un dossier
est bien rédigé. La modulation de ±20 % évoquée est décidée par la branche sur le
NPEC (apprentissage), pas par la qualité du dossier.

**Re-fondé sur les frais annexes et dispositifs complémentaires** (Pro-A,
FNE-Formation), qui sont des gisements réels que beaucoup d'entreprises oublient
de demander. Même ordre de grandeur, mais défendable — et cela donne au CTA
« Montage de dossier » un argument concret.

---

## 4. Nomenclature INSEE des tranches d'effectif

Le champ `tranche_effectif_salarie` de l'API Recherche d'entreprises renvoie un
**code**, pas un nombre.

| Code | Effectif | Code | Effectif |
|---|---|---|---|
| `NN` | Non employeur / inconnu | `21` | 50 à 99 |
| `00` | 0 salarié | `22` | 100 à 199 |
| `01` | 1 ou 2 | `31` | 200 à 249 |
| `02` | 3 à 5 | `32` | 250 à 499 |
| `03` | 6 à 9 | `41` | 500 à 999 |
| `11` | 10 à 19 | `42` | 1 000 à 1 999 |
| `12` | 20 à 49 | `51` | 2 000 à 4 999 |
| | | `52` | 5 000 à 9 999 |
| | | `53` | 10 000 et plus |

Deux pièges vérifiés sur l'API :

- **Le seuil de 50 salariés coïncide exactement** avec la frontière `12` / `21`.
  L'éligibilité aux fonds mutualisés est donc déterminable sans ambiguïté.
- **Le seuil de 11 salariés tombe à l'intérieur du code `11`** (10 à 19). Une
  entreprise de ce code peut être en dessous ou au-dessus. Le taux de CFP n'est
  donc pas déterminable avec certitude pour cette tranche.
- **L'effectif du siège vaut souvent `NN` alors que celui de l'entreprise est
  renseigné** (vérifié sur Danone : siège `NN`, entreprise `42`). Toujours lire le
  champ racine, et prévoir un repli quand tout est à `NN`.

---

## 5. Points encore ouverts

- **Entreprises de moins de 5 salariés** (codes `00`, `01`, `02`) : la fourchette
  5-12 apprenants ne s'applique pas, et ces codes représentent une part énorme de
  la base SIRENE. Session inter-entreprises mutualisée ? Autre plancher ?
- **Les 30 €/h** sont-ils le tarif de vente dklic ou une moyenne de prise en
  charge ? Dans le premier cas le montant affiché devient un devis, avec les
  implications commerciales que cela suppose.
- **Maintenance des barèmes** : construire une table de forfaits par OPCO, c'est
  accepter de la réviser chaque année. Alternative honnête : afficher une
  fourchette large assumée (« entre X et Y selon votre branche ») et faire de la
  précision le service vendu par le CTA.
- **Politique de confidentialité** : couvre-t-elle la collecte de coordonnées à
  des fins de prospection ? (voir `NEXT_PUBLIC_PRIVACY_POLICY_URL`)

---

## 6. Sources

- [Urssaf — contributions à la formation professionnelle](https://www.urssaf.fr/accueil/employeur/cotisations/liste-cotisations/formation-professionnelle.html)
- [France Compétences — soutien au plan de développement des compétences](https://www.francecompetences.fr/fiche-ruf/le-soutien-au-plan-de-developpement-des-competences-des-entreprises/)
- [France Compétences — qu'est-ce que le NPEC](https://www.francecompetences.fr/faq/quest-ce-que-le-npec/)
- [Centre Inffo — dotation OPCO entreprises de moins de 50 salariés](https://www.centre-inffo.fr/site-droit-formation/actualites-droit/repartition-de-la-dotation-aux-opco-pour-le-developpement-des-competences-des-entreprises-de-moins-de-50-salaries)
- [Uniformation — financement du plan de développement des compétences](https://www.uniformation.fr/particulier/salaries/formation-et-financements/autres-dispositifs-de-formation/le-plan-de-developpement-des-competences/financement)
- [Opco Atlas — critères de financement bureaux d'études](https://www.opco-atlas.fr/criteres-financement/bureaux-detudes-techniques-ingenieurs-et-conseils)
- [AKTO — règles de prise en charge 2026](https://www.akto.fr/regles-de-prise-en-charge-organisme-de-formation/)
- [Plafonds OPCOMMERCE IDCC 2216](https://mon-budget-opco.fr/info-pratique/par-branche/plafond-opco-opcommerce-idcc-2216-commerce-detail-alimentation-2026)
- [INSEE / Sirene — nomenclature des tranches d'effectif](https://www.sirene.fr/sirene/public/variable/tefet)
