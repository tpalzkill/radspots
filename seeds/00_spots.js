
let locations = require('../locations')



exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('spots').del()
    .then(function () {
      // Inserts seed entries
      return knex('spots').insert(locations);
    });
};
