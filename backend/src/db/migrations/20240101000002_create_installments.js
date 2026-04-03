exports.up = function (knex) {
  return knex.schema
    .createTable('installment_plans', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE');
      table.uuid('created_by').references('id').inTable('users');
      table.string('product_name').notNullable();
      table.string('category').nullable();
      table.string('brand').nullable();
      table.string('model').nullable();
      table.decimal('total_price', 10, 2).notNullable();
      table.decimal('down_payment', 10, 2).defaultTo(0);
      table.decimal('remaining_balance', 10, 2).notNullable();
      table.integer('total_installments').notNullable();
      table.decimal('installment_amount', 10, 2).notNullable();
      table.enum('frequency', ['weekly', 'monthly', 'custom']).defaultTo('monthly');
      table.date('start_date').notNullable();
      table.enum('status', ['active', 'completed', 'defaulted']).defaultTo('active');
      table.text('notes').nullable();
      table.timestamps(true, true);
    })
    .createTable('installments', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('plan_id').notNullable().references('id').inTable('installment_plans').onDelete('CASCADE');
      table.integer('installment_number').notNullable();
      table.decimal('amount', 10, 2).notNullable();
      table.date('due_date').notNullable();
      table.date('paid_date').nullable();
      table.decimal('paid_amount', 10, 2).nullable();
      table.enum('payment_mode', ['cash', 'upi', 'bank_transfer', 'other']).nullable();
      table.enum('status', ['pending', 'paid', 'overdue']).defaultTo('pending');
      table.text('receipt_note').nullable();
      table.timestamps(true, true);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('installments')
    .dropTableIfExists('installment_plans');
};
