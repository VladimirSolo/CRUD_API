import http from 'http';

const PORT = process.env.PORT || 3000;

const server = http.createServer((request, response) => {
  response.write('Start CRUD!');
  response.end();
});

server.listen(PORT, () => {
  console.log(`Server has been started on port ${PORT}`);
});
