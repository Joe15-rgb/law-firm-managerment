import initializePassport from "@configs/passport_config";
import passport from 'passport';
import { PrismaClient, type User } from "@prisma/client";
import { getCache, setCache } from "@tools/cache";

const prisma = new PrismaClient();
const DEFAULT_CACHE_TTL = process.env.USER_CACHE_TTL ? parseInt(process.env.USER_CACHE_TTL) : 600;

// Type pour les clés de recherche utilisateur
type UserLookupKey = 'id' | 'email';

/**
 * Helper générique pour la récupération d'utilisateur avec cache
 */
async function getCachedUser(
  keyType: UserLookupKey,
  value: string | number,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<User | null> {
  const cacheKey = `user:${keyType}:${value}`;

  try {
    const cachedUser = await getCache(cacheKey);
    if (cachedUser) return cachedUser as User;

    const whereCondition = keyType === 'id'
      ? { [keyType]: String(value) }
      : { [keyType]: value };

    const user = await prisma.user.findUnique({
      where: whereCondition as any
      ,
    });

    if (user) {
      await setCache(cacheKey, user, ttl);
    } else {
      // Cache les "non trouvés" pour éviter les attaques de pénétration
      await setCache(cacheKey, null, 60); // 1 minute pour les null
    }

    return user;
  } catch (error) {
    console.error(`Error in getCachedUser(${keyType}:${value}):`, error);
    throw error;
  }
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
  return getCachedUser('email', email);
};

export const getUserById = async (id: string | number): Promise<User | null> => {
  return getCachedUser('id', id);
};

// Initialisation Passport avec gestion d'erreurs
export function AuthenticatedUser() {
  try {
    initializePassport({
      passport,
      getUserByEmail,
      getUserById,
    });
  } catch (error) {
    console.error('Failed to initialize passport:', error);
    process.exit(1);
  }
}