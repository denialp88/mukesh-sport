exports.up = function (knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('phone', 15).notNullable().unique();
      table.string('password').notNullable();
      table.enum('role', ['admin', 'staff']).defaultTo('staff');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('customers', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('phone', 15).notNullable();
      table.text('address').nullable();
      table.string('photo_url').nullable();
      table.timestamps(true, true);
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('customers').dropTableIfExists('users');
};
