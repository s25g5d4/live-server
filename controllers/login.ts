import * as passport from 'koa-passport';
import { IRouterContext } from 'koa-router';
import * as Validator from 'validator';

import { IUser } from './auth';
import { IControllerErrorModel, IControllerModel, IControllerSuccessModel } from './interfaces';

export interface ILoginFormModel extends IControllerModel {};

export interface ILoginFormErrorModel extends IControllerErrorModel {
  username: string;
};

export interface ILoginSuccessModel extends IControllerSuccessModel {
  username?: string;
};

export interface ILoginErrorModel extends IControllerErrorModel {
  username?: string;
};

const renderForm = async (ctx: IRouterContext): Promise<ILoginFormModel | ILoginFormErrorModel> => {
  if (ctx.isAuthenticated()) {
    return {
      status: 403,
      username: ctx.state.user.username,
      error: 'Already Logged In',
      message: `You have already logged in as ${ctx.state.user.username}.`,
      next: {
        href: '/',
        description: 'Back to home'
      }
    };
  }

  return {
    status: 200
  };
};

const login = async (ctx: IRouterContext, next: () => Promise<any>): Promise<ILoginSuccessModel | ILoginErrorModel> => {
  const username: string = ctx.request.body.username;
  const password: string = ctx.request.body.password;

  if (ctx.isAuthenticated()) {
    return {
      status: 403,
      username: ctx.state.user.username,
      error: 'Already Logged In',
      message: `You have already logged in as ${ctx.state.user.username}.`,
      next: {
        href: '/',
        description: 'Back to home'
      }
    };
  }

  if (!username || !password || username.length < 6 || password.length < 6) {
    return {
      status: 403,
      error: 'Login Fail',
      message: 'Invalid username or password.'
    };
  }

  let email: string;
  let isEmail: boolean;

  if (Validator.isEmail(username)) {
    email = username;
    isEmail = true;

  } else if ( !Validator.isAlphanumeric(username) || !Validator.isAlpha(username[0]) ) {
    return {
      status: 403,
      error: 'Login Fail',
      message: 'Invalid username or password.'
    };
  }

  const user: IUser = await new Promise<IUser>((ok, fail) => {
    passport.authenticate('local', (err, loginUser) => {
      if (err) {
        return fail(err);
      }

      if (loginUser) {
        return ctx.login(loginUser).then(() => {
          return ok(loginUser);
        });
      }

      return ok(null);
    })(ctx, next);
  });

  if (!user) {
    return {
      status: 403,
      error: 'Login Fail',
      message: "Your username or password doesn't match our records."
    };
  }

  return {
    status: 200,
    success: 'Login Success',
    message: `Welcome back, ${user.username}!`,
    next: {
      href: '/',
      description: 'Back to home'
    }
  };
};

export default {
  renderForm,
  login
};
