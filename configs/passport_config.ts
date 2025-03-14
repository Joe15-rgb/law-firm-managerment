/*=============================================
=            Passport auth strategy           =
=============================================*/

import { type PassportStatic } from 'passport';
import { compare } from 'bcryptjs';
import { Strategy } from 'passport-local';
import type { User } from '@prisma/client';
const LocalStrategy = Strategy;

export type InitializePassportParams = {
  passport: PassportStatic;
  getUserByEmail: (email: string) => Promise<User | null>;
  getUserById: (id: number | string) => Promise<User | null>;
};

const initializePassport = ({
  passport,
  getUserByEmail,
  getUserById,
}: InitializePassportParams) => {
  const authenticateUser = async (
    email: string,
    password: string,
    done: (
      error: any,
      user?: User | false,
      options?: { message: string }
    ) => void
  ) => {
    const user = await getUserByEmail(email);
    if (!user) return done(null, false, { message: 'Invalid Crudentials' });
    try {
      if (await compare(password, user.passwordHash)) return done(null, user);
      return done(null, false, { message: 'Invalid Crudentials' });
    } catch (error) {
      return done(error);
    }
  };

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));
  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number | string, done) => {
    try {
      const user = await getUserById(id);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  });
};

export default initializePassport;
