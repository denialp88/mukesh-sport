exports.up = function (knex) {
  return knex.schema
    .createTable('repair_jobs', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('job_id', 20).notNullable().unique(); // e.g., MKS-20240101-001
      table.string('tracking_token', 40).notNullable().unique(); // for public tracking URL
      table.uuid('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE');
      table.uuid('created_by').references('id').inTable('users');
      table.string('item_name').notNullable();
      table.text('problem_description').nullable();
      table.string('item_photo_url').nullable();
      table.decimal('estimated_cost', 10, 2).nullable();
      table.decimal('final_cost', 10, 2).nullable();
      table.date('estimated_completion').nullable();
      table.date('received_date').notNullable().defaultTo(knex.fn.now());
      table.date('completed_date').nullable();
      table.date('delivered_date').nullable();
      table.enum('status', ['received', 'in_progress', 'ready_for_pickup', 'delivered']).defaultTo('received');
      table.text('notes').nullable();
      table.timestamps(true, true);
    })
    .createTable('repair_status_history', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('repair_job_id').notNullable().references('id').inTable('repair_jobs').onDelete('CASCADE');
      table.uuid('updated_by').references('id').inTable('users');
      table.enum('status', ['received', 'in_progress', 'ready_for_pickup', 'delivered']).notNullable();
      table.text('note').nullable();
      table.string('photo_url').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('repair_status_history')
    .dropTableIfExists('repair_jobs');
};
