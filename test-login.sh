#!/bin/bash
echo "=== Testing direct API (port 3000) ==="
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","password":"admin123"}'

echo ""
echo ""
echo "=== Testing via Nginx (port 80) ==="
curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","password":"admin123"}'

echo ""
echo ""
echo "=== Checking DB users ==="
cd ~/mukesh-sport/backend
node -e "
const db = require('./src/db/db');
db('users').select('id','name','phone','role','is_active').then(u => {
  console.log('Users in DB:', JSON.stringify(u, null, 2));
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
"

echo ""
echo "=== Recent PM2 logs ==="
pm2 logs mukesh-sport-api --lines 10 --nostream
