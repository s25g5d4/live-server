import * as Koa from 'koa';
import * as Bodyparser from 'koa-bodyparser';
import * as json from 'koa-json';
import * as logger from 'koa-logger';
import * as onerror from 'koa-onerror';
import * as koaStatic from 'koa-static';
import * as views from 'koa-views';

import * as index from './routes/index';
import * as users from './routes/users';

const app = new Koa();
const bodyparser = Bodyparser();

// error handler
onerror(app);

// middlewares
app.use(bodyparser);
app.use(json());
app.use(logger());
app.use(koaStatic(__dirname + '/public'));

app.use(views(__dirname + '/views', {
  extension: 'ejs'
}));

// logger
app.use(async (ctx, next) => {
  const start = (new Date()).getTime();
  await next();
  const ms = (new Date()).getTime() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// routes
app
  .use(index.routes())
  .use(index.allowedMethods());

app
  .use(users.routes())
  .use(users.allowedMethods());

export = app;
