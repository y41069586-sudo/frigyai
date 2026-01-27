/**
 * Input validation utilities for common fields
 */

export const VALIDATION_RULES = {
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Ungültige E-Mail-Adresse',
    minLength: 5,
    maxLength: 254,
  },
  PASSWORD: {
    minLength: 8,
    minLengthMessage: 'Passwort muss mindestens 8 Zeichen lang sein',
    requireUppercase: false, // German users prefer no uppercase requirement for common passphrases
    requireNumber: false,
    requireSpecial: false,
  },
  WEIGHT: {
    minValue: 30,
    maxValue: 300,
    message: 'Gewicht muss zwischen 30 und 300 kg liegen',
  },
  HEIGHT: {
    minValue: 100,
    maxValue: 250,
    message: 'Größe muss zwischen 100 und 250 cm liegen',
  },
  AGE: {
    minValue: 13,
    maxValue: 120,
    message: 'Alter muss zwischen 13 und 120 Jahren liegen',
  },
  IMAGE_FILE_SIZE: {
    maxBytes: 5 * 1024 * 1024, // 5MB
    message: 'Bild darf maximal 5 MB groß sein',
  },
  IMAGE_DIMENSIONS: {
    maxWidth: 4096,
    maxHeight: 4096,
    minWidth: 100,
    minHeight: 100,
    message: 'Bildabmessungen müssen zwischen 100x100 und 4096x4096 Pixeln liegen',
  },
};

/**
 * Validate email address
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'E-Mail-Adresse ist erforderlich' };
  }

  if (email.length < VALIDATION_RULES.EMAIL.minLength || email.length > VALIDATION_RULES.EMAIL.maxLength) {
    return { valid: false, error: 'E-Mail-Adresse muss zwischen 5 und 254 Zeichen lang sein' };
  }

  if (!VALIDATION_RULES.EMAIL.pattern.test(email)) {
    return { valid: false, error: VALIDATION_RULES.EMAIL.message };
  }

  return { valid: true };
};

/**
 * Validate password
 */
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: 'Passwort ist erforderlich' };
  }

  if (password.length < VALIDATION_RULES.PASSWORD.minLength) {
    return { valid: false, error: VALIDATION_RULES.PASSWORD.minLengthMessage };
  }

  if (VALIDATION_RULES.PASSWORD.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, error: 'Passwort muss mindestens einen Großbuchstaben enthalten' };
  }

  if (VALIDATION_RULES.PASSWORD.requireNumber && !/[0-9]/.test(password)) {
    return { valid: false, error: 'Passwort muss mindestens eine Zahl enthalten' };
  }

  if (VALIDATION_RULES.PASSWORD.requireSpecial && !/[!@#$%^&*]/.test(password)) {
    return { valid: false, error: 'Passwort muss mindestens ein Sonderzeichen (!@#$%^&*) enthalten' };
  }

  return { valid: true };
};

/**
 * Validate weight in kg
 */
export const validateWeight = (weight: number | string): { valid: boolean; error?: string } => {
  const numWeight = typeof weight === 'string' ? parseFloat(weight) : weight;

  if (isNaN(numWeight)) {
    return { valid: false, error: 'Gewicht muss eine Zahl sein' };
  }

  if (numWeight < VALIDATION_RULES.WEIGHT.minValue || numWeight > VALIDATION_RULES.WEIGHT.maxValue) {
    return { valid: false, error: VALIDATION_RULES.WEIGHT.message };
  }

  return { valid: true };
};

/**
 * Validate height in cm
 */
export const validateHeight = (height: number | string): { valid: boolean; error?: string } => {
  const numHeight = typeof height === 'string' ? parseFloat(height) : height;

  if (isNaN(numHeight)) {
    return { valid: false, error: 'Größe muss eine Zahl sein' };
  }

  if (numHeight < VALIDATION_RULES.HEIGHT.minValue || numHeight > VALIDATION_RULES.HEIGHT.maxValue) {
    return { valid: false, error: VALIDATION_RULES.HEIGHT.message };
  }

  return { valid: true };
};

/**
 * Validate age
 */
export const validateAge = (age: number | string): { valid: boolean; error?: string } => {
  const numAge = typeof age === 'string' ? parseInt(age, 10) : age;

  if (isNaN(numAge)) {
    return { valid: false, error: 'Alter muss eine Zahl sein' };
  }

  if (numAge < VALIDATION_RULES.AGE.minValue || numAge > VALIDATION_RULES.AGE.maxValue) {
    return { valid: false, error: VALIDATION_RULES.AGE.message };
  }

  return { valid: true };
};

/**
 * Validate image file size (in bytes)
 */
export const validateImageFileSize = (sizeInBytes: number): { valid: boolean; error?: string } => {
  if (sizeInBytes > VALIDATION_RULES.IMAGE_FILE_SIZE.maxBytes) {
    return { valid: false, error: VALIDATION_RULES.IMAGE_FILE_SIZE.message };
  }

  return { valid: true };
};

/**
 * Validate image dimensions
 */
export const validateImageDimensions = (
  width: number,
  height: number
): { valid: boolean; error?: string } => {
  if (
    width < VALIDATION_RULES.IMAGE_DIMENSIONS.minWidth ||
    width > VALIDATION_RULES.IMAGE_DIMENSIONS.maxWidth ||
    height < VALIDATION_RULES.IMAGE_DIMENSIONS.minHeight ||
    height > VALIDATION_RULES.IMAGE_DIMENSIONS.maxHeight
  ) {
    return { valid: false, error: VALIDATION_RULES.IMAGE_DIMENSIONS.message };
  }

  return { valid: true };
};

/**
 * Get image dimensions from File or data URL
 */
export const getImageDimensions = (
  fileOrDataUrl: File | string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const handleLoad = () => {
      resolve({ width: img.width, height: img.height });
    };

    const handleError = () => {
      reject(new Error('Could not load image'));
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    if (typeof fileOrDataUrl === 'string') {
      // Data URL
      img.src = fileOrDataUrl;
    } else {
      // File
      const reader = new FileReader();
      reader.addEventListener('load', (e) => {
        img.src = e.target?.result as string;
      });
      reader.addEventListener('error', handleError);
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};
