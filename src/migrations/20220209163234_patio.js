exports.up = function (knex) {
  return knex.schema.createTable('patio', (t) => {
    t.increments();
    t.integer('capacidade').notNull();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('patio');
};