import * as Router from 'koa-router';
import { default as ProfileController, IProfileErrorModel } from '../controllers/profile';

const router = new Router();

router.get('/', async (ctx) => {
  const model = ctx.state.model = await ProfileController.getSelfProfile(ctx);

  if (model.status === 200) {
    ctx.state.csrf = (ctx as any).csrf;
    return await ctx.render('profile');

  } else if (model.status === 403) {
    return await ctx.render('error-message');

  } else {
    throw new Error('Unknown status code in Profile GetSelfProfile Controller');
  }
});

router.post('/', async (ctx) => {
  const model = await ProfileController.updateSelfProfileCheck(ctx);

  if (model.status === 200) {
    let updateProfileModel = await ProfileController.updateSelfProfile(ctx, model);

    if (updateProfileModel.status === 200) {
      ctx.status = 200;
      ctx.state.model = updateProfileModel;
      return ctx.redirect('/profile');

    } else if (updateProfileModel.status === 403) {
      updateProfileModel = updateProfileModel as IProfileErrorModel;
      ctx.status = 403;
      ctx.state.model = updateProfileModel;
      return await ctx.render('/error-message');

    } else {
      throw new Error('Unknown status code in Profile UpdateSelfProfile Controller');
    }

  } else if (model.status === 403) {
    ctx.status = 403;
    ctx.state.model = model;
    return await ctx.render('error-message');

  } else if (model.status === 501) {
    ctx.status = 501;
    ctx.state.model = model;
    return await ctx.render('error-message');

  } else {
    throw new Error('Unknown status code in Profile UpdateSelfProfile Controller');
  }
});

router.get('/:username', async (ctx) => {
  const model = ctx.state.model = await ProfileController.getUserProfile(ctx);

  if (model.status === 200) {
    return await ctx.render('profile');

  } else if (model.status === 403 || model.status === 404) {
    return await ctx.render('error-message');

  } else {
    throw new Error('Unknown status code in Profile GetUserProfile Controller');
  }
});

export default router;
