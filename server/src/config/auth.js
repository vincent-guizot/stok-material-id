export function jwtSecret() {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) throw new Error('JWT_SECRET wajib diatur untuk production.');
  return process.env.JWT_SECRET || 'stokmaterial_development_only_secret';
}
