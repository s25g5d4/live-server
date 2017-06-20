import * as bs58 from 'bs58';
import * as config from 'config';
import { createHash, randomBytes } from 'crypto';
import * as passport from 'koa-passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { promisify } from 'util';
import * as Validator from 'validator';

import Users from '../models/users';

const pwkey = config.get('credentials.pwkey');

export interface IUser {
  id: number;
  username: string;
  nick: string;
  email: string;
  avatar: string;
};

interface IUserAuth extends IUser {
  password: string;
}

export const isValidUsername = (username) => {
  return (
    typeof username === 'string'
    && username.length >= 6
    && Validator.isAlphanumeric(username)
    && Validator.isAlpha(username[0])
  );
};

export const checkPassword = (salted: string, password: string): boolean => {
  return salted.substr(64, 64) === createHash('sha256').update(salted.substr(0, 64) + password + pwkey).digest('hex');
};

export const generateSaltedPassword = async (password: string): Promise<string> => {
  const salt = (await promisify(randomBytes)(48)).toString('base64');
  return salt + createHash('sha256').update(salt + password + pwkey).digest('hex');
};

export const generateRandomBase58 = async (length): Promise<string> => {
  return bs58.encode( (await promisify(randomBytes)(length)) );
};

export const initAuthStrategy = () => {

  passport.serializeUser((user: IUser, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (str: string, done) => {
    try {
      const user: Partial<IUser> = await Users.findById(str, {
        attributes: [ 'id', 'username', 'nick', 'email' ],
        raw: true
      });

      Object.assign(user, {
        avatar: `http://www.gravatar.com/avatar/${createHash('md5').update(user.email).digest('hex')}.jpg`
      });
      return done(null, user);
    } catch (err) {
      return done(err, undefined);
    }
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user: Partial<IUserAuth> = await Users.findOne({
          where: Validator.isEmail(username) ? { email: username } : { username },
          attributes: [ 'id', 'username', 'password', 'nick', 'email' ],
          raw: true
        });

        if (!user) {
          done(null, false);
        }

        if ( checkPassword(user.password, password) ) {
          Object.assign(user, {
            avatar: `http://www.gravatar.com/avatar/${createHash('md5').update(user.email).digest('hex')}.jpg`
          });
          user.password = null;
          done(null, user as IUser);
        } else {
          done(null, false);
        }

      } catch (err) {
        done(err);
      }
    })
  );

};
