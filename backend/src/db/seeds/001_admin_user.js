const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
  await knex('users').del();

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await knex('users').insert([
    {
      name: 'Mukesh',
      phone: '9999999999',
      password: hashedPassword,
      role: 'admin',
      is_active: true,
    },
  ]);
};
