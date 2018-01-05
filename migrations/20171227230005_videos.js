
exports.up = function(knex, Promise) {
  return knex.schema.createTable('videos', (table) => {

    table.integer('user_id').unsigned();
    table.foreign('user_id').references('users.id').onDelete('cascade');
    table.integer('spot_id').unsigned();
    table.foreign('spot_id').references('spots.id').onDelete('cascade');
    table.integer('upvotes');
    table.string('video');
    table.timestamps(true, true);
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('videos');
};
