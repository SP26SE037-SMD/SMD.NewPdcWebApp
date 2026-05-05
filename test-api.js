const fetch = require('node-fetch');
async function run() {
  const res = await fetch('http://43.207.156.116/api/sessions/validate', { method: 'POST', body: '[]', headers: { 'Content-Type': 'application/json' } });
  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("BODY:", text);
}
run();
