const express = require('express');
const { nanoid } = require('nanoid');
const db = require('../db/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper: generate job ID like MKS-20240315-A3F
function generateJobId() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = nanoid(4).toUpperCase();
  return `MKS-${y}${m}${d}-${suffix}`;
}

// GET /api/repairs — all repair jobs
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search, from_date, to_date } = req.query;
    let query = db('repair_jobs')
      .join('customers', 'repair_jobs.customer_id', 'customers.id')
      .select(
        'repair_jobs.*',
        'customers.name as customer_name',
        'customers.phone as customer_phone'
      )
      .orderBy('repair_jobs.created_at', 'desc');

    if (status) query = query.where('repair_jobs.status', status);
    if (from_date) query = query.where('repair_jobs.received_date', '>=', from_date);
    if (to_date) query = query.where('repair_jobs.received_date', '<=', to_date);
    if (search) {
      query = query.where(function () {
        this.where('repair_jobs.job_id', 'ilike', `%${search}%`)
          .orWhere('customers.name', 'ilike', `%${search}%`)
          .orWhere('customers.phone', 'ilike', `%${search}%`)
          .orWhere('repair_jobs.item_name', 'ilike', `%${search}%`);
      });
    }

    const jobs = await query;
    res.json({ jobs });
  } catch (err) {
    console.error('Get repairs error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/repairs/:id — single repair job with status history
router.get('/:id', authenticate, async (req, res) => {
  try {
    const job = await db('repair_jobs')
      .join('customers', 'repair_jobs.customer_id', 'customers.id')
      .select(
        'repair_jobs.*',
        'customers.name as customer_name',
        'customers.phone as customer_phone'
      )
      .where('repair_jobs.id', req.params.id)
      .first();

    if (!job) return res.status(404).json({ error: 'Repair job not found.' });

    const history = await db('repair_status_history')
      .leftJoin('users', 'repair_status_history.updated_by', 'users.id')
      .select('repair_status_history.*', 'users.name as updated_by_name', 'users.phone as updated_by_phone')
      .where({ repair_job_id: req.params.id })
      .orderBy('repair_status_history.created_at', 'asc');

    res.json({ job, history });
  } catch (err) {
    console.error('Get repair error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/repairs — create repair job
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      customer_id,
      item_name,
      problem_description,
      item_photo_url,
      estimated_cost,
      estimated_completion,
      notes,
    } = req.body;

    if (!customer_id || !item_name) {
      return res.status(400).json({ error: 'customer_id and item_name are required.' });
    }

    const jobId = generateJobId();
    const trackingToken = nanoid(20);

    const [job] = await db('repair_jobs')
      .insert({
        job_id: jobId,
        tracking_token: trackingToken,
        customer_id,
        created_by: req.user.id,
        item_name,
        problem_description,
        item_photo_url,
        estimated_cost,
        estimated_completion,
        received_date: new Date().toISOString().split('T')[0],
        status: 'received',
        notes,
      })
      .returning('*');

    // Add initial status history entry
    await db('repair_status_history').insert({
      repair_job_id: job.id,
      updated_by: req.user.id,
      status: 'received',
      note: 'Item received for repair.',
    });

    const trackingUrl = `${process.env.APP_URL}/track/${trackingToken}`;

    res.status(201).json({ job, tracking_url: trackingUrl });
  } catch (err) {
    console.error('Create repair error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/repairs/:id/status — update repair status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, note, photo_url, payment_received } = req.body;

    // If only updating payment status (no status change)
    if (payment_received !== undefined && !status) {
      const [job] = await db('repair_jobs')
        .where({ id: req.params.id })
        .update({ payment_received, updated_at: db.fn.now() })
        .returning('*');
      if (!job) return res.status(404).json({ error: 'Repair job not found.' });
      return res.json({ job });
    }

    const validStatuses = ['received', 'in_progress', 'ready_for_pickup', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const updateData = { status, updated_at: db.fn.now() };
    if (status === 'delivered') updateData.delivered_date = new Date().toISOString().split('T')[0];
    if (status === 'ready_for_pickup' || status === 'delivered') {
      updateData.completed_date = new Date().toISOString().split('T')[0];
    }
    if (payment_received !== undefined) updateData.payment_received = payment_received;

    const [job] = await db('repair_jobs')
      .where({ id: req.params.id })
      .update(updateData)
      .returning('*');

    if (!job) return res.status(404).json({ error: 'Repair job not found.' });

    await db('repair_status_history').insert({
      repair_job_id: job.id,
      updated_by: req.user.id,
      status,
      note,
      photo_url,
    });

    res.json({ job });
  } catch (err) {
    console.error('Update repair status error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/repairs/:id/cost — set final cost
router.put('/:id/cost', authenticate, async (req, res) => {
  try {
    const { final_cost } = req.body;

    const [job] = await db('repair_jobs')
      .where({ id: req.params.id })
      .update({ final_cost, updated_at: db.fn.now() })
      .returning('*');

    if (!job) return res.status(404).json({ error: 'Repair job not found.' });

    res.json({ job });
  } catch (err) {
    console.error('Update repair cost error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/repairs/dashboard/summary
router.get('/dashboard/summary', authenticate, async (req, res) => {
  try {
    const received = await db('repair_jobs').where({ status: 'received' }).count('id as count').first();
    const inProgress = await db('repair_jobs').where({ status: 'in_progress' }).count('id as count').first();
    const readyForPickup = await db('repair_jobs').where({ status: 'ready_for_pickup' }).count('id as count').first();

    res.json({
      received: parseInt(received.count),
      in_progress: parseInt(inProgress.count),
      ready_for_pickup: parseInt(readyForPickup.count),
      total_active: parseInt(received.count) + parseInt(inProgress.count) + parseInt(readyForPickup.count),
    });
  } catch (err) {
    console.error('Repair dashboard error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
