import * as Router from 'koa-router';

const router = new Router();

router.get('/', async (ctx) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  });
});

router.get('/string', async (ctx) => {
  ctx.body = 'koa2 string';
});

router.get('/json', async (ctx) => {
  ctx.body = {
    title: 'koa2 json'
  };
});

export = router;
