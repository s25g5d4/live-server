import * as Router from 'koa-router';

import ChannelController from '../controllers/channel';

const router = new Router();

router.get('/:username', async (ctx) => {
  const model = ctx.state.model = await ChannelController.renderChannel(ctx);

  if (model.status === 200) {
    ctx.status = 200;
    return await ctx.render('channel');

  } else if (model.status === 404) {
    ctx.status = 404;
    return await ctx.render('error-message');

  } else if (model.status === 403) {
    ctx.status = 403;
    return await ctx.render('error-message');

  } else {
    throw new Error('Unknown status code in Channel RenderChannel Controller');
  }
});

export default router;
