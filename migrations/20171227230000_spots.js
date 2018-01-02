

exports.up = function(knex, Promise) {
  return knex.schema.createTable('spots', (table) => {
  table.increments();
  table.string('spot_name').notNullable();
  table.string('spot_location').notNullable();
  table.float('sketch_level');
  table.integer('upvotes');
  table.string('type');
  table.string('image');
});
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('spots');
};
