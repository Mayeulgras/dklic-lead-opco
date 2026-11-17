# Ranger les formations par secteur dans Odoo

À la fin du simulateur, le visiteur voit 3 formations dklic. Pour lui montrer
celles qui le concernent vraiment, le simulateur a besoin de savoir **à quels
secteurs s'adresse chaque formation**. Le secteur de l'entreprise du visiteur,
lui, est connu automatiquement : il vient de son code d'activité officiel.

Tant que ce n'est pas fait, le simulateur se débrouille avec les pôles, mais
c'est moins précis : un garage ou un cabinet d'avocats ne voient que des
formations générales.

Temps estimé : un quart d'heure.

## Ce qu'il faut faire dans Odoo

1. Dans les **catégories de la boutique en ligne**, créer une catégorie
   **« Secteurs »**, au même niveau que « Pôles », « Thèmes » et « Formateurs ».
2. Sous « Secteurs », créer les catégories ci-dessous, **avec exactement ces
   noms** (le simulateur les reconnaît par leur nom) :

   | Catégorie | Pour quelles entreprises |
   |---|---|
   | Tous secteurs | Formations utiles à toutes les entreprises |
   | Santé et médico-social | Hôpitaux, cliniques, EHPAD, aide à domicile, ESAT, action sociale |
   | Professions de santé | Médecins, dentistes, infirmiers, kinés, laboratoires, ambulances |
   | Petite enfance | Crèches, micro-crèches, écoles maternelles |
   | Industrie | Usines, ateliers de fabrication, énergie, eau, déchets |
   | BTP | Bâtiment, travaux publics, électriciens, plombiers… |
   | Transport et logistique | Transporteurs, entrepôts, coursiers, livraison |
   | Automobile | Garages, concessions, location de véhicules |
   | Commerce | Magasins, supermarchés, commerce de gros |
   | Hôtellerie et restauration | Hôtels, restaurants, cafés, traiteurs |
   | Artisanat alimentaire | Boulangeries, pâtisseries, boucheries, charcuteries, poissonneries |
   | Beauté et bien-être | Coiffeurs, instituts de beauté, spas |
   | Sport et loisirs | Clubs, salles de sport, loisirs |
   | Numérique | Informatique, logiciels, télécoms |
   | Banque, finance et assurance | Banques, assurances, courtiers |
   | Juridique et comptable | Avocats, notaires, experts-comptables |
   | Immobilier | Agences, syndics, promoteurs |
   | Conseil et services aux entreprises | Conseil, ingénierie, publicité, intérim, sécurité, nettoyage |
   | Enseignement et formation | Écoles, organismes de formation |
   | Culture et spectacle | Cinéma, audiovisuel, spectacle, patrimoine |
   | Agriculture | Exploitations agricoles, forêt, pêche |
   | Associations et administrations | Associations, collectivités |

3. Dans **chaque formation**, ajouter un ou plusieurs secteurs, dans le même
   champ que le pôle, le thème et le formateur. Une formation utile à toutes
   les entreprises reçoit « Tous secteurs ».
4. Prévenir Mayeul : une vérification automatique confirme que tout est
   reconnu (noms, formations oubliées).

**Bon à savoir**
- Une formation **sans aucun secteur ne sera plus proposée** dans le
  simulateur. Elle reste bien sûr sur la boutique.
- L'ordre reste celui du tri « En vedette » de la boutique : les formations
  placées en tête passent devant.
- Les changements sont pris en compte dans l'heure.
- Ces catégories apparaîtront sans doute comme filtre sur la boutique, comme
  les pôles. Le dire si ça gêne.

## Proposition pour les 22 formations (à corriger)

| Formation | Secteurs proposés |
|---|---|
| Diriger en temps de crise | Tous secteurs |
| L'art et la science de la vente | Commerce, Automobile, Immobilier, Banque, finance et assurance, Conseil et services aux entreprises |
| La stratégie de location | Automobile, Transport et logistique |
| Énergie et Vitalité | Tous secteurs |
| Prévention et épigénétique | Tous secteurs |
| Cerveau performant | Tous secteurs |
| Douleurs et inflammation chronique | Tous secteurs |
| Et vos hormones, on en parle ? | Tous secteurs |
| Management d'équipes | Santé et médico-social |
| Maîtriser les fondamentaux de l'IA Générative | Tous secteurs |
| Intégrer l'IA dans ses usages métier | Tous secteurs |
| Créer et déployer des agents IA | Numérique, Conseil et services aux entreprises |
| Maîtriser Claude et exploiter tout son potentiel | Numérique, Conseil et services aux entreprises |
| L'art de l'automatisation IT | Numérique |
| Face aux Maladies neuro-évolutives | Santé et médico-social, Professions de santé |
| Dénutrition et Fausses routes | Santé et médico-social |
| Préparer sa retraite | Tous secteurs |
| Les obligations de l'employeur | Tous secteurs |
| Contrats et ruptures sans risque | Tous secteurs |
| Massage prénatal | Beauté et bien-être |
| Chariot R489 : Conduire en sécurité | Industrie, BTP, Transport et logistique, Commerce, Agriculture |
| Chariot R485 : Conduire en sécurité | Industrie, Transport et logistique, Commerce |

**Questions à trancher**
- **Douleurs et inflammation chronique** : pour tous, ou plutôt pour les
  métiers physiques (BTP, industrie, transport, santé, aide à domicile) ?
- **L'art et la science de la vente** : pour tous, ou seulement les métiers
  avec des commerciaux ?
- **Management d'équipes** : son accroche parle de l'évaluation HAS, donc du
  médico-social. Est-ce bien réservé à ce secteur ?
