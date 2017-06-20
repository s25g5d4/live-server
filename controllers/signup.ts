import { IRouterContext } from 'koa-router';
import { UniqueConstraintError } from 'sequelize';
import * as Validator from 'validator';

import Users from '../models/users';
import { generateSaltedPassword } from './auth';
import { IControllerErrorModel, IControllerModel, IControllerSuccessModel } from './interfaces';

export interface ISignupFormModel extends IControllerModel {};

export interface ISignupFormErrorModel extends IControllerErrorModel {
  username: string;
};

export interface ISignupCheckModel extends IControllerModel {
  username: string;
  email: string;
  password: string;
  errors?: {
    username?: string;
    email?: string;
    password?: string;
    tos?: string;
  };
};

export interface ISignupCheckErrorModel extends IControllerErrorModel {
  username: string;
}

export interface ISignupSuccessModel extends IControllerSuccessModel {
  username: string;
  email: string;
};

export interface ISignupErrorModel extends IControllerErrorModel {
  username: string;
  email: string;
  errors: {
    username?: string;
    email?: string;
  };
};

const renderForm = async (ctx: IRouterContext): Promise<ISignupFormModel | ISignupFormErrorModel> => {
  let model: ISignupFormModel | ISignupFormErrorModel;

  if (ctx.isAuthenticated()) {
    model = {
      status: 403,
      username: ctx.state.username,
      error: 'You Have Logged In',
      message: 'Please log out and try again.',
      next: {
        href: '/',
        description: 'Back to home'
      }
    };
  } else {
    model = {
      status: 200
    };
  }
  return model;
};

const signupCheck = async (ctx: IRouterContext): Promise<ISignupCheckModel | ISignupCheckErrorModel> => {
  const username: string = ctx.request.body.username;
  const password: string = ctx.request.body.password;
  const rePassword: string = ctx.request.body.rePassword;
  const email: string = ctx.request.body.email;
  const tos: string = ctx.request.body.tos;

  let model: ISignupCheckModel = { status: 200, username, email, password, errors: {} };
  let isError: boolean = false;

  if (ctx.isAuthenticated()) {
    return {
      status: 403,
      username: ctx.state.user.username,
      error: 'Already Logged In',
      message: `You have logged in as ${username}, please log out and try again.`,
      next: {
        href: '/',
        description: 'Back to home'
      }
    };
  }

  if (!username || username.length < 6 || !(Validator.isAlphanumeric(username) && Validator.isAlpha(username[0]))) {
    model.errors.username = 'Invalid username! ' +
      'A valid username must contain only alphabet and numeric digits, and contain at least 6 characters.';
    isError = true;
  }

  if (!password || !rePassword || password.length < 6 || password !== rePassword) {
    model.errors.password = 'Invalid or mismatching password! Password must longer than 6 characters.';
    isError = true;
  }

  if (!email || !Validator.isEmail(email)) {
    model.errors.email = 'Invalid email!';
    isError = true;
  }

  if (tos !== 'agree') {
    model.errors.tos = 'Please read and agree our Term of Services.';
    isError = true;
  }

  if (isError) {
    model.status = 400;
  }
  return model;
};

const signup = async (
  ctx: IRouterContext,
  userModel: ISignupCheckModel
): Promise<ISignupSuccessModel | ISignupErrorModel> => {

  const password = await generateSaltedPassword(userModel.password);
  const { username, email } = userModel;

  let model: ISignupSuccessModel | ISignupErrorModel;
  try {
    await Users.create({
      username,
      password,
      email
    });

    model = {
      status: 200,
      username,
      email,
      success: 'Registration Success',
      message: `Welcome, ${username}! You can login your account now.`,
      next: {
        href: '/login',
        description: 'Login'
      }
    };
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      err = err as UniqueConstraintError;

      model = {
        status: 403,
        username,
        email,
        errors: { },
        error: 'Signup Fail',
        message: 'Username or email has been registered.'
      };

      if (err.get('username').length) {
        model.errors.username = `User ${username} has been registered already.`;
      }
      if (err.get('email').length) {
        model.errors.email = `${email} has been registered already.`;
      }

    } else {
      throw err;
    }
  }

  return model;
};

export default {
  renderForm,
  signupCheck,
  signup
};
