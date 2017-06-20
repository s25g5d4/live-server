import * as Router from 'koa-router';
import * as Validator from 'validator';

import Users from '../models/users';

const SRS_HOST = 'rtmp://127.0.0.1:1945';

const router = new Router();

router.prefix('/nginx-rtmp');

router.get('/', async (ctx) => {
  ctx.status = 403;
  ctx.body = 'Forbidden';
});

router.post('/', async (ctx) => {
  interface IStringObject {
    [index: string]: string;
  }

  const { call, app, name: streamKey } = ctx.request.body as IStringObject;

  if (call === 'play' || call === 'connect') {
    ctx.status = 200;
    ctx.body = 'OK';
    return;
  }

  if (app !== 'live' || !Validator.isAlphanumeric(streamKey)) {
    ctx.status = 403;
    ctx.body = 'Forbidden';
    return;
  }

  const user = await Users.findOne({
    where: { streamKey },
    attributes: [ 'username' ],
    raw: true
  });

  if (!user) {
    ctx.status = 403;
    ctx.body = 'Forbidden';
    return;
  }

  ctx.status = 302;
  ctx.redirect(`${SRS_HOST}/live/${user.username}`);
});

export default router;
