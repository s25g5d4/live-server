import * as Router from 'koa-router';
import {
  default as SignupController,
  ISignupCheckErrorModel,
  ISignupCheckModel,
  ISignupErrorModel,
  ISignupSuccessModel
} from '../controllers/signup';

const router = new Router();

router.get('/', async (ctx): Promise<void> => {
  const model = ctx.state.model = await SignupController.renderForm(ctx);

  if (model.status === 200) {
    ctx.status = 200;
    ctx.state.csrf = (ctx as any).csrf;
    return await ctx.render('signup');

  } else if (model.status === 403) {
    ctx.status = 403;
    return await ctx.render('error-message');

  } else {
    throw new Error('Unknown status code in Signup RenderForm Controller');
  }

});

router.post('/', async (ctx): Promise<void> => {
  let model = await SignupController.signupCheck(ctx);

  if (model.status === 200) {
    model = model as ISignupCheckModel;
    let signupModel = await SignupController.signup(ctx, model);

    if (signupModel.status === 200) {
      ctx.status = 200;
      signupModel = signupModel as ISignupSuccessModel;
      ctx.state.model = signupModel;
      return await ctx.render('success-message');

    } else if (signupModel.status === 403) {
      signupModel = signupModel as ISignupErrorModel;

      model.status = 403;
      model.errors = signupModel.errors;

      ctx.status = 403;
      ctx.state.model = model;
      ctx.state.csrf = (ctx as any).csrf;
      return await ctx.render('signup');

    } else {
      throw new Error('Unknown status code in Signup Controller');
    }

  } else if (model.status === 400) {
    ctx.status = 400;
    ctx.state.model = model;
    ctx.state.csrf = (ctx as any).csrf;
    return await ctx.render('signup');

  } else if (model.status === 403) {
    ctx.status = 403;
    ctx.state.model = model as ISignupCheckErrorModel;
    return await ctx.render('error-message');

  } else {
    throw new Error('Unknown status code in SignupCheck Controller');
  }

});

export default router;
