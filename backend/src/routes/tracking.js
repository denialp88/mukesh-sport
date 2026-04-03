const express = require('express');
const db = require('../db/db');

const router = express.Router();

// GET /track/:token — public tracking page (no auth needed)
router.get('/:token', async (req, res) => {
  try {
    const job = await db('repair_jobs')
      .join('customers', 'repair_jobs.customer_id', 'customers.id')
      .select(
        'repair_jobs.job_id',
        'repair_jobs.item_name',
        'repair_jobs.status',
        'repair_jobs.received_date',
        'repair_jobs.estimated_completion',
        'repair_jobs.completed_date',
        'customers.name as customer_name'
      )
      .where('repair_jobs.tracking_token', req.params.token)
      .first();

    if (!job) {
      return res.status(404).render('tracking', { job: null, history: [], error: 'Job not found.' });
    }

    const history = await db('repair_status_history')
      .join('repair_jobs', 'repair_status_history.repair_job_id', 'repair_jobs.id')
      .select('repair_status_history.status', 'repair_status_history.note', 'repair_status_history.created_at')
      .where('repair_jobs.tracking_token', req.params.token)
      .orderBy('repair_status_history.created_at', 'asc');

    res.render('tracking', { job, history, error: null });
  } catch (err) {
    console.error('Tracking error:', err);
    res.status(500).render('tracking', { job: null, history: [], error: 'Server error.' });
  }
});

// GET /api/track/:token — JSON API for mobile app to fetch public tracking data
router.get('/api/:token', async (req, res) => {
  try {
    const job = await db('repair_jobs')
      .join('customers', 'repair_jobs.customer_id', 'customers.id')
      .select(
        'repair_jobs.job_id',
        'repair_jobs.item_name',
        'repair_jobs.status',
        'repair_jobs.received_date',
        'repair_jobs.estimated_completion',
        'repair_jobs.completed_date',
        'customers.name as customer_name'
      )
      .where('repair_jobs.tracking_token', req.params.token)
      .first();

    if (!job) return res.status(404).json({ error: 'Job not found.' });

    const history = await db('repair_status_history')
      .join('repair_jobs', 'repair_status_history.repair_job_id', 'repair_jobs.id')
      .select('repair_status_history.status', 'repair_status_history.note', 'repair_status_history.created_at')
      .where('repair_jobs.tracking_token', req.params.token)
      .orderBy('repair_status_history.created_at', 'asc');

    res.json({ job, history });
  } catch (err) {
    console.error('Tracking API error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
