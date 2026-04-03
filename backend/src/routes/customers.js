const express = require('express');
const db = require('../db/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/customers
router.get('/', authenticate, async (req, res) => {
  try {
    const { search } = req.query;
    let query = db('customers').orderBy('created_at', 'desc');

    if (search) {
      query = query.where(function () {
        this.where('name', 'ilike', `%${search}%`).orWhere('phone', 'ilike', `%${search}%`);
      });
    }

    const customers = await query;
    res.json({ customers });
  } catch (err) {
    console.error('Get customers error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/customers/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const customer = await db('customers').where({ id: req.params.id }).first();
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    const installmentPlans = await db('installment_plans')
      .where({ customer_id: req.params.id })
      .orderBy('created_at', 'desc');

    const repairJobs = await db('repair_jobs')
      .where({ customer_id: req.params.id })
      .orderBy('created_at', 'desc');

    res.json({ customer, installmentPlans, repairJobs });
  } catch (err) {
    console.error('Get customer error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/customers
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, phone, address, photo_url } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required.' });
    }

    const [customer] = await db('customers')
      .insert({ name, phone, address, photo_url })
      .returning('*');

    res.status(201).json({ customer });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/customers/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, phone, address, photo_url } = req.body;

    const [customer] = await db('customers')
      .where({ id: req.params.id })
      .update({ name, phone, address, photo_url, updated_at: db.fn.now() })
      .returning('*');

    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    res.json({ customer });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
