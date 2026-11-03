/**
 * Language helpers. French pages live under /fr/ (homepage /fr/), English everywhere else.
 * Local preview serves pages under /content/, which is skipped.
 */

const FR = {
  Home: 'Accueil',
  Breadcrumb: "Fil d'Ariane",
  Carousel: 'Carrousel',
  'Carousel Slide Controls': 'Contrôles du carrousel',
  'Previous Slide': 'Diapositive précédente',
  'Next Slide': 'Diapositive suivante',
  'Show Slide': 'Afficher la diapositive',
  'Winner Slide Controls': 'Contrôles des gagnants',
  'Previous Winner': 'Gagnant précédent',
  'Next Winner': 'Gagnant suivant',
  'Show Winner': 'Afficher le gagnant',
  'Choose screenshot': "Choisir une capture d'écran",
  'Previous screenshot': "Capture d'écran précédente",
  'Next screenshot': "Capture d'écran suivante",
  'Show screenshot': "Afficher la capture d'écran",
  of: 'de',
  'Previous game': 'Jeu précédent',
  'Next game': 'Jeu suivant',
  Close: 'Fermer',
  Search: 'Rechercher',
  'Close navigation': 'Fermer la navigation',
  'Open navigation': 'Ouvrir la navigation',
  'Main navigation': 'Navigation principale',
  Table: 'Tableau',
  'Embedded video': 'Vidéo intégrée',
  'Play video': 'Lire la vidéo',
};

/**
 * @returns {'en'|'fr'} language of the current page
 */
export function getLanguage() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const first = segments[0] === 'content' ? segments[1] : segments[0];
  return first === 'fr' ? 'fr' : 'en';
}

/**
 * @returns {string} path prefix of the current language ('' for English, '/fr' for French)
 */
export function getLanguagePrefix() {
  return getLanguage() === 'fr' ? '/fr' : '';
}

/**
 * @returns {string} homepage of the current language
 */
export function getHomePath() {
  return getLanguage() === 'fr' ? '/fr/' : '/';
}

/**
 * Path of the current page in the other language (EN /en/x <-> FR /fr/x, / <-> /fr/).
 * Pages that only exist in one language resolve through the redirects sheet.
 * @returns {string}
 */
export function getAlternatePath() {
  const path = window.location.pathname.replace(/^\/content(?=\/)/, '');
  if (getLanguage() === 'fr') {
    const rest = path.replace(/^\/fr\/?/, '');
    return rest && rest !== 'index' ? `/en/${rest}` : '/';
  }
  const rest = path.replace(/^\/(en\/?)?/, '');
  return rest && rest !== 'index' ? `/fr/${rest}` : '/fr/';
}

/**
 * Translates a UI string (English source text) into the page language.
 * @param {string} text English text
 * @returns {string}
 */
export function t(text) {
  return (getLanguage() === 'fr' && FR[text]) || text;
}
