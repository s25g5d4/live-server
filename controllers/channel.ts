import * as config from 'config';
import { createHash, randomBytes } from 'crypto';
import { IRouterContext } from 'koa-router';
import { promisify } from 'util';

import Users from '../models/users';
import { isValidUsername } from './auth';
import { IControllerErrorModel, IControllerModel } from './interfaces';

const EXPIRES: number = config.get('credentials.tokenExpire') as any;

export interface IChannelErrorModel extends IControllerErrorModel { };

export interface IChannelModel extends IControllerModel {
  username: string;
  token: string;
}

export interface IChannelRefreshModel extends IChannelModel { };

const renderChannel = async (ctx: IRouterContext): Promise<IChannelErrorModel | IChannelModel> => {
  const username = ctx.params.username;
  if (!isValidUsername(username)) {
    return {
      status: 403,
      error: 'Bad Request',
      message: 'Invalid username.'
    };
  }

  const user = await Users.findOne({
    where: { username },
    attributes: [ 'canStream' ],
    raw: true
  });
  if (!user || !user.canStream) {
    return {
      status: 404,
      error: 'Not Found',
      message: `User ${username} is not registered yet or account is not activated.`
    };
  }

  const session = (ctx as any).session;

  let token: string;
  if ( session.channel && session.channel[username] && Date.now() <= session.channel[username].expires ) {
    console.log('generate');
    token = await generateToken(session.channel[username].secret);
  } else {
    console.log('refresh');
    token = await refreshSecret(ctx, username);
  }

  return {
    status: 200,
    username,
    token
  };
};

export const isValidToken = (token: string, secret: string): boolean => {
  const tokenSplit = token.split('.');
  if (tokenSplit.length !== 2) {
    return false;
  }

  const salt = tokenSplit[0];
  const hash = tokenSplit[1];
  return createHash('sha256').update(`${salt}.${secret}`).digest('hex') === hash;
};

const generateToken = async (secret: string) => {
  let salt = (await promisify(randomBytes)(8)).toString('base64');
  salt = salt.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''); // url safe
  return salt + '.' + createHash('sha256').update(`${salt}.${secret}`).digest('hex');
};

const refreshSecret = async (ctx: IRouterContext, username: string): Promise<string> => {
  const session = (ctx as any).session;
  if (!session.channel) {
    session.channel = {};
  }

  const secret = (await promisify(randomBytes)(16)).toString('hex');
  session.channel[username] = {
    secret,
    expires: Date.now() + EXPIRES
  };

  return await generateToken(secret);
};

export default {
  renderChannel
};
