

exports.up = function(knex, Promise) {
  return knex.schema.createTable('follows', (table) => {

  table.integer('user_followed').unsigned();
  table.foreign('user_followed').references('users.id').onDelete('cascade');
  table.integer('followed_by').unsigned();
  table.foreign('followed_by').references('users.id').onDelete('cascade');
});
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('follows');
};
