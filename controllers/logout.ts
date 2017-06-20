import { IRouterContext } from 'koa-router';

import { IControllerConfirmModel, IControllerErrorModel, IControllerSuccessModel } from './interfaces';

export interface ILogoutFormModel extends IControllerConfirmModel {};

export interface ILogoutFormErrorModel extends IControllerErrorModel {};

export interface ILogoutSuccessModel extends IControllerSuccessModel {};

export interface ILogoutErrorModel extends IControllerErrorModel {};

const renderForm = async (ctx: IRouterContext): Promise<ILogoutFormModel | ILogoutFormErrorModel> => {
  if ( !ctx.isAuthenticated() ) {
    return {
      status: 403,
      error: 'Logout Fail',
      message: 'You are not logged in yet!',
      next: {
        href: '/',
        description: 'Back to home'
      }
    };
  }

  return {
    status: 200,
    confirm: 'Logout',
    message: 'Do you really want to logout?',
    buttonYes: 'Yes',
    quit: {
      href: '/',
      description: 'Back to home'
    }
  };
};

const logout = async (ctx: IRouterContext): Promise<ILogoutSuccessModel | ILogoutErrorModel> => {
  const session = (ctx as any).session;

  if ( !ctx.isAuthenticated() ) {
    session.logoutRequestTime = null;
    return {
      status: 403,
      error: 'Logout Fail',
      message: 'Bad request. Please try again.',
      next: {
        href: '/',
        description: 'Back to home'
      }
    };
  }

  ctx.logout();
  return {
    status: 200,
    success: 'Logout Success',
    message: 'You are logged out.',
    next: {
      href: '/',
      description: 'Back to home'
    }
  };
};

export default {
  renderForm,
  logout
};
