import db from './db';
import Users from './users';

const initDatabase = (): PromiseLike<any> => {
  return db.sync();
};

export {
  initDatabase,
  Users
};
