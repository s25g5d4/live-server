import { createHash } from 'crypto';
import * as escapeHTML from 'escape-html';
import { IRouterContext } from 'koa-router';
import { UniqueConstraintError } from 'sequelize';
import * as Validator from 'validator';

import Users from '../models/users';
import { checkPassword, generateRandomBase58, generateSaltedPassword, IUser } from './auth';
import { IControllerErrorModel, IControllerModel } from './interfaces';

interface IUserProfile extends IUser {
  active: boolean;
  canStream: boolean;
  streamKey: string;
  profile: string;
  createdAt: Date;
}

export interface IProfileModel extends IControllerModel {
  isSelf: boolean;
  user: Partial<IUserProfile>;
}

export type IProfileErrorModel = IControllerErrorModel;

export interface IProfileCheckModel extends IControllerModel {
  active?: boolean;
  email?: string;
  oldPassword?: string;
  newPassword?: string;
  generateStreamKey?: boolean;
  profile?: string;
}

export interface IProfileCheckErrorModel extends IControllerErrorModel {
  errors?: {
    active?: string;
    email?: string;
    password?: string;
    generateStreamKey?: string;
  };
}

const getSelfProfile = async (ctx: IRouterContext): Promise<IProfileModel | IProfileErrorModel> => {
  if ( !ctx.isAuthenticated() ) {
    return {
      status: 403,
      error: 'Not Logged In',
      message: 'You have to login to see your profile.',
      next: {
        href: '/login',
        description: 'Login now'
      }
    };
  }

  const userDetail = await Users.findById(ctx.state.user.id, {
    attributes: [ 'active', 'canStream', 'streamKey', 'createdAt', 'profile' ],
    raw: true
  });

  const user: IUserProfile = {
    id: ctx.state.user.id,
    username: ctx.state.user.username,
    nick: ctx.state.user.nick,
    email: ctx.state.user.email,
    avatar: ctx.state.user.avatar,
    active: userDetail.active,
    canStream: userDetail.canStream,
    streamKey: userDetail.streamKey,
    profile: userDetail.profile,
    createdAt: userDetail.createdAt
  };

  return {
    status: 200,
    isSelf: true,
    user
  };
};

const checkFields = (email, oldPassword, newPassword, rePassword, generateStreamKey, streamProfile) => {
    const emailIsValid: boolean = typeof email === 'undefined' || Validator.isEmail(email);
    const passwordIsValid: boolean = (
         typeof oldPassword === 'undefined'
      && typeof newPassword === 'undefined'
      && typeof rePassword === 'undefined'
    ) || (
         oldPassword
      && newPassword
      && rePassword
      && oldPassword.length >= 6
      && newPassword.length >= 6
      && rePassword.length >= 6
      && newPassword === rePassword
    );
    const genKeyIsValid: boolean = typeof generateStreamKey === 'undefined' || generateStreamKey === 'yes';
    const profileIsValid: boolean = typeof streamProfile === 'undefined' || !!streamProfile;

    return {
      email: emailIsValid,
      password: passwordIsValid,
      generateStreamKey: genKeyIsValid,
      streamProfile: profileIsValid
    };
};

const updateSelfProfileCheck = async (ctx: IRouterContext): Promise<IProfileCheckModel | IProfileCheckErrorModel> => {
  if ( !ctx.isAuthenticated() ) {
    return {
      status: 403,
      error: 'Not Logged In',
      message: 'You have to login to update your profile.',
      next: {
        href: '/login',
        description: 'Login now'
      }
    };
  }

  if (typeof ctx.request.body.active !== 'undefined') {
    if (ctx.request.body.active === 'yes') {
      return {
        status: 200,
        active: true
      };
    }

    return {
      status: 400,
      errors: {
        active: 'Bad request. active field value should be yes.'
      },
      error: 'Bad Request',
      message: 'There are errors in your profile update request.',
      next: {
        href: '/profile',
        description: 'Back to profile'
      }
    };
  }

  interface IStringObject { [index: string]: string; }
  const {
    email,
    oldPassword,
    newPassword,
    rePassword,
    generateStreamKey,
    streamProfile
  } = ctx.request.body as IStringObject;

  const fieldsIsValid = checkFields(email, oldPassword, newPassword, rePassword, generateStreamKey, streamProfile);

  if ( !Object.values(fieldsIsValid).every((e) => e) ) {
    const errorModel: IProfileCheckErrorModel = {
      status: 400,
      errors: {},
      error: 'Bad Request',
      message: 'There are errors in your profile update request.',
      next: {
        href: '/profile',
        description: 'Back to profile'
      }
    };
    if (!fieldsIsValid.email) {
      errorModel.errors.email = 'Invalid email address.';
    }
    if (!fieldsIsValid.password) {
      errorModel.errors.password = 'Invalid password.';
    }
    if (!fieldsIsValid.generateStreamKey) {
      errorModel.errors.generateStreamKey = 'Invalid value of generateStreamKey field.';
    }

    return errorModel;
  }

  if (!email && !oldPassword && !generateStreamKey && !streamProfile) {
    return {
      status: 400,
      error: 'Bad Request',
      message: 'You post a request to update your profile, but there is nothing to update with.',
      next: {
        href: '/profile',
        description: 'Back to profile'
      }
    };
  }

  const model: IProfileCheckModel = {
    status: 200
  };
  if (email) {
    model.email = email;
  }
  if (oldPassword) {
    model.oldPassword = oldPassword;
    model.newPassword = newPassword;
  }
  if (generateStreamKey) {
    model.generateStreamKey = true;
  }
  if (streamProfile) {
    model.profile = streamProfile;
  }

  return model;
};

const ActivateUserAccount = async (ctx: IRouterContext): Promise<IProfileModel | IProfileErrorModel> => {
  const userDetail = await Users.findById(ctx.state.user.id, {
    attributes: [ 'id', 'active', 'canStream' ]
  });

  if (userDetail.active) {
    return {
      status: 403,
      error: 'Already Activated',
      message: 'Your account has been activated already.',
      next: {
        href: '/profile',
        description: 'Back to profile'
      }
    };
  } else {
    userDetail.active = true;
    userDetail.canStream = true;
    await userDetail.save();
    return await getSelfProfile(ctx);
  }
};

const updateSelfProfile = async (ctx: IRouterContext, profileModel: IProfileCheckModel):
Promise<IProfileModel | IProfileErrorModel> => {

  if (profileModel.active) {
    return await ActivateUserAccount(ctx);
  }

  interface IUpdateFields {
    email?: string;
    password?: string;
    streamKey?: string;
    profile?: string;
  }

  const { email, oldPassword, newPassword, generateStreamKey, profile } = profileModel;

  const attributes: string[] = [ 'id' ];
  const updateFields: IUpdateFields = {};
  if (email && email !== ctx.state.user.email) {
    attributes.push('email');
    updateFields.email = email;
  }
  if (newPassword) {
    attributes.push('password');
  }
  if (generateStreamKey) {
    attributes.push('streamKey');
  }
  if (profile) {
    attributes.push('profile');
    updateFields.profile = escapeHTML(profile);
  }

  const user = await Users.findById(ctx.state.user.id, { attributes });
  const { streamKey: oldStreamKey } = user;

  if (oldPassword) {
    if ( !checkPassword(user.password, oldPassword) ) {
      return {
        status: 403,
        error: 'Password Mismatch',
        message: "Current password doesn't match your record.",
        next: {
          href: '/profile',
          description: 'Back to profile'
        }
      };
    } else {
      updateFields.password = await generateSaltedPassword(newPassword);
    }
  }

  if (generateStreamKey) {
    do {
      updateFields.streamKey = await generateRandomBase58(23);
    } while (updateFields.streamKey === oldStreamKey);
  }

  let streamKeyConflict = false;
  Object.assign(user, updateFields);
  try {
    await user.save();

  } catch (e) {
    if (e instanceof UniqueConstraintError) {
      if ( (e as UniqueConstraintError).get('email').length > 0 ) {
        return {
          status: 403,
          error: 'Email Conflict',
          message: 'New email address you requested to update has been used by another user.',
          next: {
            href: '/profile',
            description: 'Back to profile'
          }
        };

      } else if ( (e as UniqueConstraintError).get('streamKey').length > 0 ) {
        streamKeyConflict = true;

      } else {
        throw e;
      }

    } else {
      throw e;
    }
  }

  if (streamKeyConflict) {
    while (true) {
      updateFields.streamKey = await generateRandomBase58(23);
      if (updateFields.streamKey === oldStreamKey) {
        continue;
      }

      Object.assign(user, updateFields);

      try {
        await user.save();
        break;
      } catch (e) {
        if (e instanceof UniqueConstraintError && (e as UniqueConstraintError).get('streamKey').length > 0 ) {
          continue;
        }
        throw e;
      }
    }
  }

  return getSelfProfile(ctx);
};

const getUserProfile = async (ctx: IRouterContext): Promise<IProfileModel | IProfileErrorModel> => {
  const username: string = ctx.params.username;
  if ( !username || username.length < 6 || !(Validator.isAlphanumeric(username) && Validator.isAlpha(username[0])) ) {
    return {
      status: 403,
      error: 'Invalid Username',
      message: 'Check your request.',
      next: {
        href: '/profile',
        description: 'Back to my profile'
      }
    };
  }

  if (ctx.isAuthenticated() && username === ctx.state.user.username) {
    return await getSelfProfile(ctx);
  }

  const user: Partial<IUserProfile> = await Users.findOne({
    attributes: [ 'email', 'username', 'nick', 'active', 'canStream', 'profile', 'createdAt' ],
    raw: true,
    where: { username }
  });

  if (!user) {
    return {
      status: 404,
      error: 'User Not Found',
      message: `${username} is not registered yet.`,
      next: {
        href: '/signup',
        description: 'Want to signup?'
      }
    };
  }

  user.avatar = `//www.gravatar.com/avatar/${createHash('md5').update(user.email).digest('hex')}.jpg`;
  user.email = null;

  return {
    status: 200,
    isSelf: false,
    user
  };
};

export default {
  getSelfProfile,
  updateSelfProfileCheck,
  updateSelfProfile,
  getUserProfile
};
