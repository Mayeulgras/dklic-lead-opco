/**
 * URL de la politique de confidentialité du client, exigée par la case de
 * consentement RGPD (spec §9). Renseignée par variable d'environnement pour
 * pointer vers la page du site Odoo sans toucher au code.
 *
 * Tant qu'elle n'est pas définie, le libellé de consentement s'affiche sans
 * lien : mieux vaut pas de lien qu'un lien mort qui donne l'illusion de la
 * conformité.
 */
export const PRIVACY_POLICY_URL =
  process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL?.trim() || null
