import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function syncDbPlugin(): Plugin {
  const dbDir = path.resolve(__dirname, '.data');
  const dbFile = path.resolve(dbDir, 'db.json');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return {
    name: 'sync-db-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/data' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (fs.existsSync(dbFile)) {
            try {
              const data = fs.readFileSync(dbFile, 'utf-8');
              res.end(data);
              return;
            } catch (e) {
              console.error('Error reading db.json', e);
            }
          }
          res.end(JSON.stringify({ empty: true }));
          return;
        }

        if (req.url === '/api/data' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              parsed.updatedAt = Date.now();
              fs.writeFileSync(dbFile, JSON.stringify(parsed, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ ok: true, updatedAt: parsed.updatedAt }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(e) }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), syncDbPlugin()],
  server: {
    host: true, // Expose to local network
    port: 5173,
    allowedHosts: true, // Allow Cloudflare / Mobile Tunnel / Any host
    cors: true
  }
})
