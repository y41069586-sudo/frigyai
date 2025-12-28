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
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve({
          isGoodQuality: true,
          issue: 'none',
          message: '',
          suggestion: '',
        });
        return;
      }

      // Verkleinere das Bild für schnellere Analyse
      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let totalBrightness = 0;
      let pixelCount = 0;
      let darkPixels = 0;
      let brightPixels = 0;

      // Berechne durchschnittliche Helligkeit
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Relative Luminanz
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
        totalBrightness += brightness;
        pixelCount++;

        if (brightness < 40) darkPixels++;
        if (brightness > 220) brightPixels++;
      }

      const avgBrightness = totalBrightness / pixelCount;
      const darkRatio = darkPixels / pixelCount;
      const brightRatio = brightPixels / pixelCount;

      console.log('[IMAGE-QUALITY] Brightness:', avgBrightness.toFixed(1), 'Dark ratio:', (darkRatio * 100).toFixed(1) + '%');

      // Zu dunkel - mehr als 60% dunkle Pixel oder Durchschnitt < 50
      if (avgBrightness < 50 || darkRatio > 0.6) {
        resolve({
          isGoodQuality: false,
          issue: 'too_dark',
          message: 'Oje, zu dunkel! 🌙',
          suggestion: 'Mach bitte das Licht an, damit ich deine Zutaten besser sehen kann.',
        });
        return;
      }

      // Zu hell - mehr als 50% überbelichtete Pixel
      if (avgBrightness > 220 || brightRatio > 0.5) {
        resolve({
          isGoodQuality: false,
          issue: 'too_bright',
          message: 'Zu hell! ☀️',
          suggestion: 'Das Bild ist überbelichtet. Versuche es ohne direktes Licht auf der Linse.',
        });
        return;
      }

      // Bild ist OK
      resolve({
        isGoodQuality: true,
        issue: 'none',
        message: '',
        suggestion: '',
      });
    };

    img.onerror = () => {
      // Bei Fehler trotzdem fortfahren
      resolve({
        isGoodQuality: true,
        issue: 'none',
        message: '',
        suggestion: '',
      });
    };

    img.src = base64Image;
  });
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
