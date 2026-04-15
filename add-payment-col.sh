#!/bin/bash
PGPASSWORD='MukeshSport2024!' psql -U mukesh_user -d mukesh_sport -c "ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS payment_received BOOLEAN DEFAULT false;"
