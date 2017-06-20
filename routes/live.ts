import * as config from 'config';
import { createHash } from 'crypto';
import { readFile } from 'fs';
import * as Router from 'koa-router';
import { resolve } from 'path';
import { promisify } from 'util';

import { isValidUsername } from '../controllers/auth';
import { isValidToken } from '../controllers/channel';

const EXPIRES: number = config.get('credentials.tokenExpire') as any;
const HLS_DIR: string = config.get('hls.dir') as any;
const HLS_SECRET: string = config.get('hls.secret') as any;

const router = new Router();

const addToken = (pathname: string, ip: string, expires: string): string => {
  const hash = createHash('md5').update(`${expires}/live/${pathname}${ip} ${HLS_SECRET}`).digest('base64');
  const hashEscaped = hash.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${pathname}?md5=${hashEscaped}&expires=${expires}`;
};

router.get('/:username([A-Za-z0-9]+)\\.m3u8', async (ctx, next) => {
  const username: string = ctx.params.username;
  const token: string = ctx.query.token;

  const session = (ctx as any).session;

  if (
    !isValidUsername(username)
    || !token
    || !session
    || !session.channel
    || !session.channel[username]
    || Date.now() > (session.channel[username].expires as number)
    || !isValidToken(token, session.channel[username].secret)
  ) {
    ctx.status = 403;
    return;
  }

  const expires = session.channel[username].expires = Date.now() + EXPIRES;

  try {
    let file = await promisify(readFile)( resolve(HLS_DIR, `${username}.m3u8`), 'ascii' );
    file = file.replace(/^([^#].*)/mg, (match) => addToken(match, ctx.request.ip, expires.toString()));

    ctx.status = 200;
    ctx.type = 'application/x-mpegURL';
    ctx.body = file;

  } catch (e) {
    ctx.status = 404;
    return;
  }

  return;
});

export default router;
