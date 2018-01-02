// Update with your config settings.

module.exports = {

  development: {
    client: 'pg',
    connection: {
<<<<<<< HEAD
      host: '127.0.0.1',
      database: 'rad',
      user: 'melissawarren',
      password: 'password'
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
=======
      filename: './dev.sqlite3'
>>>>>>> 4c26a242c3c2a1ff6742884e929760cedadbb8c9
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
<<<<<<< HEAD
=======
    },
    migrations: {
      tableName: 'knex_migrations'
>>>>>>> 4c26a242c3c2a1ff6742884e929760cedadbb8c9
    }
  }

};
