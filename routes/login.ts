import * as Router from 'koa-router';

import { default as LoginController, ILoginErrorModel, ILoginSuccessModel } from '../controllers/login';

const router = new Router();

router.get('/', async (ctx) => {
  const model = ctx.state.model = await LoginController.renderForm(ctx);

  if (model.status === 200) {
    ctx.status = 200;
    ctx.state.csrf = (ctx as any).csrf;
    return await ctx.render('login');

  } else if (model.status === 403) {
    ctx.status = 403;
    return await ctx.render('error-message');

  } else {
    throw new Error('Unknown status code in Login RenderForm Controller');
  }
});

router.post('/', async (ctx, next) => {
  let model = await LoginController.login(ctx, next);

  if (model.status === 200) {
    ctx.status = 200;
    ctx.state.model = model as ILoginSuccessModel;
    return await ctx.render('success-message');

  } else if (model.status === 403) {
    ctx.status = 403;
    ctx.state.model = model as ILoginErrorModel;

    if (model.username) {
      return await ctx.render('error-message');
    }

    ctx.state.csrf = (ctx as any).csrf;
    return await ctx.render('login');
  } else {
    throw new Error('Unknown status code in Login Controller');
  }
});

export default router;
