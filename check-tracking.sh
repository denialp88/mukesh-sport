#!/bin/bash
cd ~/mukesh-sport/backend
node -e '
const db = require("./src/db/db");
db("repair_jobs").select("job_id","tracking_token","status").limit(3).then(r => {
  console.log(JSON.stringify(r,null,2));
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
'
