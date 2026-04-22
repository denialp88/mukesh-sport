#!/bin/bash
PGPASSWORD='MukeshSport2024!' psql -U mukesh_user -d mukesh_sport -c "
TRUNCATE TABLE repair_status_history CASCADE;
TRUNCATE TABLE repair_jobs CASCADE;
TRUNCATE TABLE installments CASCADE;
TRUNCATE TABLE installment_plans CASCADE;
TRUNCATE TABLE customers CASCADE;
"
echo "Done - cleared all data except users."
