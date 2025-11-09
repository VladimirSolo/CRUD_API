import cluster from 'cluster';
import { Worker } from 'cluster';
import os from 'os';
import http from 'http';
import dotenv from 'dotenv';
import { createServer } from './index';
import { db } from './db/database';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);
const numCPUs = os.availableParallelism() - 1 || 1;

if (!cluster.isWorker) {
  console.log(`Primary process ${process.pid} is running`);
  console.log(`Starting ${numCPUs} workers...`);

  const workers: Worker[] = [];
  let currentWorkerIndex = 0;

  // Создаем воркеры
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork({
      WORKER_PORT: (PORT + i + 1).toString(),
      WORKER_ID: i.toString()
    });
    workers.push(worker);

    // Обрабатываем сообщения от воркеров (операции с БД)
    worker.on('message', (message: any) => {
      if (message.type === 'db-operation') {
        try {
          const result = db.handleOperation(message.action, message.data);
          worker.send({
            messageId: message.messageId,
            result
          });
        } catch (error: any) {
          worker.send({
            messageId: message.messageId,
            error: error.message
          });
        }
      }
    });

    console.log(`Worker ${worker.process.pid} started on port ${PORT + i + 1}`);
  }

  // Обработка завершения воркеров
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    const index = workers.indexOf(worker);
    if (index !== -1) {
      const newWorker = cluster.fork({
        WORKER_PORT: (PORT + index + 1).toString(),
        WORKER_ID: index.toString()
      });

      // Добавляем обработчик сообщений для нового воркера
      newWorker.on('message', (message: any) => {
        if (message.type === 'db-operation') {
          try {
            const result = db.handleOperation(message.action, message.data);
            newWorker.send({
              messageId: message.messageId,
              result
            });
          } catch (error: any) {
            newWorker.send({
              messageId: message.messageId,
              error: error.message
            });
          }
        }
      });

      workers[index] = newWorker;
      console.log(`New worker ${newWorker.process.pid} started on port ${PORT + index + 1}`);
    }
  });

  // Load Balancer
  const loadBalancer = http.createServer((req, res) => {
    const workerPort = PORT + currentWorkerIndex + 1;

    console.log(`Load Balancer: Forwarding request to worker on port ${workerPort}`);

    // Round-robin: переключаемся на следующего воркера
    currentWorkerIndex = (currentWorkerIndex + 1) % numCPUs;

    // Проксируем запрос к воркеру
    const options = {
      hostname: 'localhost',
      port: workerPort,
      path: req.url,
      method: req.method,
      headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
      console.error(`Error forwarding request to worker on port ${workerPort}:`, error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Load balancer error' }));
    });

    req.pipe(proxyReq);
  });

  loadBalancer.listen(PORT, () => {
    console.log(`\n🚀 Load Balancer is listening on port ${PORT}`);
    console.log(`Workers are running on ports ${PORT + 1} to ${PORT + numCPUs}`);
    console.log(`Available parallelism: ${os.availableParallelism()}`);
    console.log(`Number of workers: ${numCPUs}\n`);
  });

  process.on('SIGINT', () => {
    console.log('\nShutting down load balancer and workers...');
    loadBalancer.close(() => {
      console.log('Load balancer closed');
      for (const worker of workers) {
        worker.kill();
      }
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down load balancer and workers...');
    loadBalancer.close(() => {
      console.log('Load balancer closed');
      for (const worker of workers) {
        worker.kill();
      }
      process.exit(0);
    });
  });

} else {
  // Воркер процесс
  const workerPort = parseInt(process.env.WORKER_PORT || '4001', 10);
  const workerId = process.env.WORKER_ID || '0';

  const server = createServer();

  server.listen(workerPort, () => {
    console.log(`Worker ${process.pid} (ID: ${workerId}) is listening on port ${workerPort}`);
  });

  process.on('SIGINT', () => {
    console.log(`\nWorker ${process.pid} shutting down...`);
    server.close(() => {
      console.log(`Worker ${process.pid} closed`);
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log(`\nWorker ${process.pid} shutting down...`);
    server.close(() => {
      console.log(`Worker ${process.pid} closed`);
      process.exit(0);
    });
  });
}