import db from './db';
import Users from './Users';

const initDatabase = (): PromiseLike<any> => {
  return db.sync();
};

export {
  initDatabase,
  Users
};
