import * as Router from 'koa-router';

import channel from './channel';
import live from './live';
import login from './login';
import logout from './logout';
import profile from './profile';
import signup from './signup';

const router = new Router();

const getIndex = async (ctx) => {
  await ctx.render('index', { });
};

router.get('/', getIndex);

router
  .use('/signup', signup.routes())
  .use('/signup', signup.allowedMethods());

router
  .use('/login', login.routes())
  .use('/login', login.allowedMethods());

router
  .use('/logout', logout.routes())
  .use('/logout', logout.allowedMethods());

router
  .use('/profile', profile.routes())
  .use('/profile', profile.allowedMethods());

router
  .use('/channel', channel.routes())
  .use('/channel', channel.allowedMethods());

router
  .use('/live', live.routes())
  .use('/live', live.allowedMethods());

export default router;
