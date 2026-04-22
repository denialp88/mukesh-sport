#!/bin/bash
PGPASSWORD='MukeshSport2024!' psql -U mukesh_user -d mukesh_sport -c "ALTER TABLE installments ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES users(id);"
