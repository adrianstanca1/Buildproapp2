import http from 'http';

const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Deployment Diagnosis: OK');
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Diagnosis server running at http://0.0.0.0:${port}/`);
});
