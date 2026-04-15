#!/bin/bash
cd ~/mukesh-sport/backend
node -e '
const db = require("./src/db/db");
async function clearData() {
  await db("repair_status_history").del();
  await db("repair_jobs").del();
  await db("installments").del();
  await db("installment_plans").del();
  console.log("Cleared: repair_status_history, repair_jobs, installments, installment_plans");
  console.log("Kept: customers, users");
  process.exit(0);
}
clearData().catch(e => { console.error(e); process.exit(1); });
'
