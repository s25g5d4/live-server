import * as Sequelize from 'sequelize';
import { Instance } from 'sequelize';
import db from './db';

export interface IUsersAttributes {
  id?: number;
  username?: string;
  password?: string;
  email?: string;
  nick?: string;
  active?: boolean;
  canStream?: boolean;
  level?: number;
  streamKey?: string;
  profile?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface IUsersInstance extends Instance<IUsersAttributes>, IUsersAttributes {
  dataValues: IUsersAttributes;
};

const Users = db.define<IUsersInstance, IUsersAttributes>('Users', {
  id:        { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  username:  { type: Sequelize.STRING(32), allowNull: false, unique: true },
  password:  { type: Sequelize.STRING(128), allowNull: false },
  email:     { type: Sequelize.STRING(256), allowNull: false, unique: true },
  nick:      { type: Sequelize.STRING(128), allowNull: true },
  active:    { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
  canStream: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
  level:     { type: Sequelize.INTEGER, defaultValue: 1000, allowNull: false },
  streamKey: { type: Sequelize.STRING(32), allowNull: true, unique: true },
  profile:   { type: Sequelize.TEXT }
});

export default Users;
