#!/bin/bash
cd ~/mukesh-sport/backend
node -e "
const bcrypt = require('bcryptjs');
const db = require('./src/db/db');
async function run() {
  const hash = await bcrypt.hash('Mukesh@321', 10);
  const phones = [
    '9376215337',
    '7201893638',
    '8469797285',
    '7041963526',
    '8849888261',
    '7621017706',
    '7600409340'
  ];
  for (const phone of phones) {
    const exists = await db('users').where({ phone }).first();
    if (exists) {
      console.log('Already exists: ' + phone);
      continue;
    }
    await db('users').insert({ name: phone, phone, password: hash, role: 'staff' });
    console.log('Created: ' + phone);
  }
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
"
