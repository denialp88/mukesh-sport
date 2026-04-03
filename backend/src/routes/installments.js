const express = require('express');
const db = require('../db/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/installments/plans — all plans
router.get('/plans', authenticate, async (req, res) => {
  try {
    const { status, customer_id } = req.query;
    let query = db('installment_plans')
      .join('customers', 'installment_plans.customer_id', 'customers.id')
      .select(
        'installment_plans.*',
        'customers.name as customer_name',
        'customers.phone as customer_phone'
      )
      .orderBy('installment_plans.created_at', 'desc');

    if (status) query = query.where('installment_plans.status', status);
    if (customer_id) query = query.where('installment_plans.customer_id', customer_id);

    const plans = await query;
    res.json({ plans });
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/installments/plans/:id — single plan with installments
router.get('/plans/:id', authenticate, async (req, res) => {
  try {
    const plan = await db('installment_plans')
      .join('customers', 'installment_plans.customer_id', 'customers.id')
      .select(
        'installment_plans.*',
        'customers.name as customer_name',
        'customers.phone as customer_phone'
      )
      .where('installment_plans.id', req.params.id)
      .first();

    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    const installments = await db('installments')
      .where({ plan_id: req.params.id })
      .orderBy('installment_number', 'asc');

    res.json({ plan, installments });
  } catch (err) {
    console.error('Get plan error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/installments/plans — create plan + auto-generate installments
router.post('/plans', authenticate, async (req, res) => {
  try {
    const {
      customer_id,
      product_name,
      category,
      brand,
      model,
      total_price,
      down_payment,
      total_installments,
      frequency,
      start_date,
      notes,
    } = req.body;

    if (!customer_id || !product_name || !total_price || !total_installments || !start_date) {
      return res.status(400).json({
        error: 'customer_id, product_name, total_price, total_installments, and start_date are required.',
      });
    }

    const dp = parseFloat(down_payment) || 0;
    const remaining = parseFloat(total_price) - dp;
    const emiAmount = parseFloat((remaining / parseInt(total_installments)).toFixed(2));

    const [plan] = await db('installment_plans')
      .insert({
        customer_id,
        created_by: req.user.id,
        product_name,
        category,
        brand,
        model,
        total_price,
        down_payment: dp,
        remaining_balance: remaining,
        total_installments,
        installment_amount: emiAmount,
        frequency: frequency || 'monthly',
        start_date,
        notes,
      })
      .returning('*');

    // Auto-generate installment rows
    const installmentRows = [];
    const start = new Date(start_date);

    for (let i = 0; i < total_installments; i++) {
      const dueDate = new Date(start);
      if (frequency === 'weekly') {
        dueDate.setDate(dueDate.getDate() + i * 7);
      } else {
        dueDate.setMonth(dueDate.getMonth() + i);
      }

      installmentRows.push({
        plan_id: plan.id,
        installment_number: i + 1,
        amount: emiAmount,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending',
      });
    }

    await db('installments').insert(installmentRows);

    const installments = await db('installments')
      .where({ plan_id: plan.id })
      .orderBy('installment_number', 'asc');

    res.status(201).json({ plan, installments });
  } catch (err) {
    console.error('Create plan error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/installments/:id/pay — mark installment as paid
router.put('/:id/pay', authenticate, async (req, res) => {
  try {
    const { paid_amount, payment_mode, receipt_note } = req.body;

    const installment = await db('installments').where({ id: req.params.id }).first();
    if (!installment) return res.status(404).json({ error: 'Installment not found.' });

    const [updated] = await db('installments')
      .where({ id: req.params.id })
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        paid_amount: paid_amount || installment.amount,
        payment_mode: payment_mode || 'cash',
        receipt_note,
        updated_at: db.fn.now(),
      })
      .returning('*');

    // Check if all installments for this plan are paid
    const pendingCount = await db('installments')
      .where({ plan_id: installment.plan_id })
      .whereNot({ status: 'paid' })
      .count('id as count')
      .first();

    if (parseInt(pendingCount.count) === 0) {
      await db('installment_plans')
        .where({ id: installment.plan_id })
        .update({ status: 'completed', updated_at: db.fn.now() });
    }

    res.json({ installment: updated });
  } catch (err) {
    console.error('Pay installment error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/installments/dashboard — today, overdue, upcoming
router.get('/dashboard/summary', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const todayDue = await db('installments')
      .join('installment_plans', 'installments.plan_id', 'installment_plans.id')
      .join('customers', 'installment_plans.customer_id', 'customers.id')
      .select(
        'installments.*',
        'installment_plans.product_name',
        'customers.name as customer_name',
        'customers.phone as customer_phone'
      )
      .where('installments.due_date', today)
      .where('installments.status', 'pending');

    const overdue = await db('installments')
      .join('installment_plans', 'installments.plan_id', 'installment_plans.id')
      .join('customers', 'installment_plans.customer_id', 'customers.id')
      .select(
        'installments.*',
        'installment_plans.product_name',
        'customers.name as customer_name',
        'customers.phone as customer_phone'
      )
      .where('installments.due_date', '<', today)
      .where('installments.status', 'pending');

    const upcoming = await db('installments')
      .join('installment_plans', 'installments.plan_id', 'installment_plans.id')
      .join('customers', 'installment_plans.customer_id', 'customers.id')
      .select(
        'installments.*',
        'installment_plans.product_name',
        'customers.name as customer_name',
        'customers.phone as customer_phone'
      )
      .where('installments.due_date', '>', today)
      .where('installments.due_date', '<=', db.raw(`DATE '${today}' + INTERVAL '7 days'`))
      .where('installments.status', 'pending');

    res.json({
      today_due: todayDue,
      overdue,
      upcoming,
      summary: {
        today_count: todayDue.length,
        today_amount: todayDue.reduce((sum, i) => sum + parseFloat(i.amount), 0),
        overdue_count: overdue.length,
        overdue_amount: overdue.reduce((sum, i) => sum + parseFloat(i.amount), 0),
        upcoming_count: upcoming.length,
        upcoming_amount: upcoming.reduce((sum, i) => sum + parseFloat(i.amount), 0),
      },
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
