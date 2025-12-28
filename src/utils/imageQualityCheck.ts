/**
 * Prüft die Bildqualität und gibt Feedback bei Problemen
 */

export interface ImageQualityResult {
  isGoodQuality: boolean;
  issue: 'too_dark' | 'too_bright' | 'too_blurry' | 'none';
  message: string;
  suggestion: string;
}

/**
 * Analysiert ein Base64-Bild auf Helligkeit und Qualität
 */
export const checkImageQuality = async (base64Image: string): Promise<ImageQualityResult> => {
  // Deaktiviert - immer als gut markieren
  return {
    isGoodQuality: true,
    issue: 'none',
    message: '',
    suggestion: '',
  };
};

/**
 * Gibt ein freundliches Emoji basierend auf dem Problem zurück
 */
export const getQualityEmoji = (issue: ImageQualityResult['issue']): string => {
  switch (issue) {
    case 'too_dark':
      return '🌙';
    case 'too_bright':
      return '☀️';
    case 'too_blurry':
      return '🔍';
    default:
      return '✨';
  }
};
