import * as Router from 'koa-router';
import { default as LogoutController, ILogoutErrorModel, ILogoutSuccessModel } from '../controllers/logout';

const router = new Router();

router.get('/', async (ctx) => {
  const model = ctx.state.model = await LogoutController.renderForm(ctx);
  if (model.status === 200) {
    ctx.status = 200;
    ctx.state.csrf = (ctx as any).csrf;
    return await ctx.render('logout');

  } else if (model.status === 403) {
    ctx.status = 403;
    return await ctx.render('error-message');

  } else {
    throw new Error('Unknown status code in Logout RenderForm Controller');
  }
});

router.post('/', async (ctx) => {
  let model = await LogoutController.logout(ctx);

  if (model.status === 200) {
    ctx.status = 200;
    ctx.state.model = model as ILogoutSuccessModel;
    return await ctx.render('success-message');

  } else if (model.status === 403) {
    ctx.status = 403;
    ctx.state.model = model as ILogoutErrorModel;
    return await ctx.render('error-message');
  } else {
    throw new Error('Unknown status code in Logout Controller');
  }
});

export default router;
