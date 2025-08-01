/**
 * Utility functions for generating DiceBear avatars
 */

export interface AvatarOptions {
  seed?: string;
  size?: number;
  backgroundColor?: string;
  hair?: string[];
  accessories?: string[];
  clothing?: string[];
  eyes?: string[];
  mouth?: string[];
  skin?: string[];
}

/**
 * Generate a DiceBear Pixel Art avatar URL
 * @param options - Avatar generation options
 * @returns URL to the generated avatar
 */
export function generatePixelArtAvatar(options: AvatarOptions = {}): string {
  const {
    seed = Math.random().toString(36).substring(7),
    size = 256,
    backgroundColor,
    hair,
    accessories,
    clothing,
    eyes,
    mouth,
    skin
  } = options;

  const baseUrl = 'https://api.dicebear.com/9.x/pixel-art/svg';
  const params = new URLSearchParams();

  // Add seed
  params.append('seed', seed);

  // Add size
  params.append('size', size.toString());

  // Add optional parameters
  if (backgroundColor) {
    params.append('backgroundColor', backgroundColor);
  }

  if (hair && hair.length > 0) {
    params.append('hair', hair.join(','));
  }

  if (accessories && accessories.length > 0) {
    params.append('accessories', accessories.join(','));
  }

  if (clothing && clothing.length > 0) {
    params.append('clothing', clothing.join(','));
  }

  if (eyes && eyes.length > 0) {
    params.append('eyes', eyes.join(','));
  }

  if (mouth && mouth.length > 0) {
    params.append('mouth', mouth.join(','));
  }

  if (skin && skin.length > 0) {
    params.append('skin', skin.join(','));
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a random avatar with random features
 * @returns URL to a randomly generated avatar
 */
export function generateRandomAvatar(): string {
  const seed = Math.random().toString(36).substring(7);
  return generatePixelArtAvatar({ seed });
}

/**
 * Generate an avatar based on user's name (deterministic)
 * @param name - User's name to use as seed
 * @returns URL to the generated avatar
 */
export function generateAvatarFromName(name: string): string {
  return generatePixelArtAvatar({ seed: name.toLowerCase().replace(/\s+/g, '') });
}

/**
 * Generate an avatar based on user's email (deterministic)
 * @param email - User's email to use as seed
 * @returns URL to the generated avatar
 */
export function generateAvatarFromEmail(email: string): string {
  return generatePixelArtAvatar({ seed: email.toLowerCase().replace(/[^a-z0-9]/g, '') });
} 