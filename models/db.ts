import * as config from 'config';
import * as Sequelize from 'sequelize';

const db = new Sequelize(config.get('database.uri') as string, config.get('database.options'));

export default db;
