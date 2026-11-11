# Brancher Odoo et le mail de notification

Le code est prêt : quand un visiteur laisse ses coordonnées, l'application
crée le client dans Odoo et envoie un mail à l'équipe. Il ne manque que les
accès. Cette page dit lesquels demander, où les mettre et comment vérifier.

## Ce qui se passe à chaque demande

1. **Odoo** reçoit :
   - la **société** (fiche contact « société » : nom, adresse, SIRET) ;
   - la **personne**, rattachée à la société (nom, téléphone, email) ;
   - une **opportunité CRM** nommée « Simulateur OPCO – *société* », avec
     l'étiquette « Simulateur OPCO » et tout le détail : OPCO, taille, budget
     annoncé, date du consentement.

   Rien n'est créé en double : une société déjà connue (même SIRET ou SIREN),
   une personne déjà connue (même email dans la société) ou une opportunité
   encore ouverte sont réutilisées, sans écraser ce qu'un commercial a modifié.

2. **Le mail** part ensuite à l'adresse de l'équipe, avec toutes les
   coordonnées et le lien vers l'opportunité. « Répondre » écrit directement au
   prospect.

3. **« Être rappelé »** ajoute une note sur l'opportunité, une activité
   « Appeler » au commercial désigné, et envoie un mail « Demande de rappel ».

**Filet de sécurité.** Si Odoo ne répond pas (panne, clé expirée), le mail part
quand même et prévient en rouge : « saisir ce contact à la main ». Le visiteur
ne voit une erreur que si Odoo **et** le mail échouent tous les deux.

## Ce qu'il faut obtenir

### Odoo

- [ ] **Un utilisateur dédié à l'application**, par exemple « Simulateur
      site » (Paramètres > Utilisateurs > Nouveau). Droits suffisants :
      *Ventes : Utilisateur — tous les documents* et *Contacts : Création*.
      Pour que l'étiquette se crée toute seule : *Ventes : Administrateur*, ou
      bien créer l'étiquette « Simulateur OPCO » à la main (CRM > Configuration
      > Étiquettes).
      Attention : sur Odoo en ligne, chaque utilisateur est facturé. On peut
      aussi prendre la clé d'un compte existant, mais c'est moins sûr.
- [ ] **Sa clé API** : se connecter avec cet utilisateur, Préférences >
      Sécurité du compte > Nouvelle clé API. Choisir la durée maximale. La clé
      ne s'affiche qu'**une fois** : la copier tout de suite.
- [ ] **Le commercial qui reçoit les opportunités** (facultatif) : son
      identifiant Odoo, que `npm run verifier` affiche. Sans lui, les
      opportunités restent « non attribuées ».

### Mail

- [ ] **L'adresse qui reçoit les demandes.**
- [ ] **Les réglages SMTP de la messagerie qui envoie** : serveur, port,
      identifiant, mot de passe. Chez Google ou Microsoft avec la double
      authentification, il faut un « mot de passe d'application ». Brevo ou
      Resend fournissent aussi des réglages SMTP.

## Où les mettre

- **Sur l'ordinateur** : copier `.env.example` en `.env.local` et remplir.
- **En ligne (Vercel)** : Settings > Environment Variables, mêmes noms, puis
  redéployer.

Ces valeurs ne quittent jamais le serveur : le navigateur du visiteur ne les
voit pas.

## Vérifier

1. `npm run verifier` : contrôle la clé Odoo, les droits, les champs utilisés
   et la connexion au serveur mail, **sans rien créer ni envoyer**. Chaque
   point rouge dit quoi corriger.
2. `npm run essai-envoi` : vrai envoi de bout en bout, avec une société
   « TEST SIMULATEUR DKLIC - A SUPPRIMER ». Vérifier l'opportunité dans Odoo et
   les deux mails reçus, puis supprimer les fiches de test dans Odoo.
3. Faire un parcours complet sur le site.

## À ne pas oublier ensuite

- **La clé API Odoo expire au bout de 3 mois au plus.** Mettre un rappel dans
  l'agenda pour la renouveler avant. Si elle expire, les mails continuent
  d'arriver avec l'alerte « saisir à la main ».
- **La politique de confidentialité** doit mentionner que les coordonnées sont
  enregistrées dans Odoo et transmises par mail à l'équipe.
