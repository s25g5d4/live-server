console.log('Initiating server...');

import * as config from 'config';
import * as Koa from 'koa';
import * as Bodyparser from 'koa-bodyparser';
import * as CSRF from 'koa-csrf';
import * as json from 'koa-json';
import * as logger from 'koa-logger';
import * as onerror from 'koa-onerror';
import * as passport from 'koa-passport';
import * as RedisStore from 'koa-redis';
import * as session from 'koa-session';
// import * as koaStatic from 'koa-static';
import * as views from 'koa-views';

import { initAuthStrategy } from './controllers/auth';
import { initDatabase } from './models';
import index from './routes';
import nginxRTMP from './routes/nginx-rtmp';

// Database initiation must be called before nginxRTMP router loads
const initDB = initDatabase();

const app = new Koa();
const bodyparser = Bodyparser();
const sessStore = new RedisStore({
  url: config.get('session.url')
});

app.proxy = true;

// error handler
onerror(app);

// middlewares
app.use(bodyparser);
app.use(json());
app.use(logger());
// app.use(koaStatic(__dirname + '/public'));

app
  .use(nginxRTMP.routes())
  .use(nginxRTMP.allowedMethods());

app.keys = (config.get('session.keys') as string[]);
app.use(session({ store: sessStore }, app));
app.use(passport.initialize());
app.use(passport.session());
app.use(new CSRF());

const inits = [ initDB, initAuthStrategy() ];

app.use(views(__dirname + '/views', { extension: 'ejs' }));

const title = config.get('site.title');
app.use(async (ctx, next) => {
  ctx.state.site = {
    title,
    ip: ctx.request.ip.replace('::ffff:', '')
  };
  await next();
});

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

if (app.env === 'development') {
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      console.trace(err);
    }
  });
}

Promise.all(inits).then(() => {
  console.log('Server is ready.');
});
export = app;
