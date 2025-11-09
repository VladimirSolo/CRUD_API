import * as http from 'http';
import * as dotenv from 'dotenv';
import { router } from './routes/router';

dotenv.config();

const PORT = process.env.PORT || 3000;

export const createServer = () => {
  return http.createServer(async (request, response) => {
    try {
      await router.handleRequest(request, response);
    } catch (error) {
      console.error('Unhandled error:', error);
      response.statusCode = 500;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ message: 'Internal server error' }));
    }
  });
};

// Запускаем сервер только если файл запущен напрямую
if (require.main === module) {
  const server = createServer();

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
}