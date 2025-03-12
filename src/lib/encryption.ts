export function maskToken(token: string): string {
  if (!token) return '';
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export function encryptToken(token: string): string {
  return btoa(token);
}

export function decryptToken(encryptedToken: string): string {
  return atob(encryptedToken);
}
