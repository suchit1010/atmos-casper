import http from 'http';

const data = JSON.stringify({
  projectName: "Test Project",
  entityType: "biochar",
  lat: 23.0,
  lng: 72.6,
  areaHa: 5,
  metadata: {
    biocharYieldTonnes: 50
  }
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/verify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(JSON.stringify(JSON.parse(body), null, 2)));
});

req.on('error', console.error);
req.write(data);
req.end();
