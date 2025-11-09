import * as http from 'http';
import * as dotenv from 'dotenv';
import { router } from './routes/router';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (request, response) => {
  try {
    await router.handleRequest(request, response);
  } catch (error) {
    console.error('Unhandled error:', error);
    response.statusCode = 500;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ message: 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`Server has been started on port ${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});