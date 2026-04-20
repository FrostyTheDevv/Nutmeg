const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');
const net = require('net');

const LAVALINK_PATH = path.join(__dirname, '..', '..', 'lavalink');
const LAVALINK_JAR = path.join(LAVALINK_PATH, 'Lavalink_v4.jar');
const LAVALINK_HOST = '127.0.0.1';
let LAVALINK_PORT = 2333; 

console.log('🎵 Frosty Music Bot - Auto Launcher');
console.log('═══════════════════════════════════════════════════\n');


if (!fs.existsSync(LAVALINK_JAR)) {
  console.error('❌ Lavalink_v4.jar not found!');
  console.error(`📂 Expected location: ${LAVALINK_JAR}`);
  console.log('\n💡 Download from: https://github.com/lavalink-devs/Lavalink/releases');
  process.exit(1);
}


function findAvailablePort(startPort = 2333) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, LAVALINK_HOST, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}

function checkLavalink(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://${LAVALINK_HOST}:${port}/version`, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startLavalink() {
  LAVALINK_PORT = await findAvailablePort(2333);
  
  console.log('🚀 Starting Lavalink server...');
  console.log(`📂 Location: ${LAVALINK_PATH}`);
  console.log(`🔌 Port: ${LAVALINK_PORT} (auto-selected)\n`);

  const lavalink = spawn('java', [
    '-Xmx1G',
    `-Dserver.port=${LAVALINK_PORT}`,
    '-jar', 
    'Lavalink_v4.jar'
  ], {
    cwd: LAVALINK_PATH,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    detached: false
  });

  let lavalinkReady = false;

  lavalink.stdout.on('data', (data) => {
    const output = data.toString();
    
    if (!lavalinkReady && (output.includes('Lavalink is ready') || output.includes('Started Launcher'))) {
      lavalinkReady = true;
      console.log('✅ Lavalink is ready!\n');
    }
    
    if (process.env.SHOW_LAVALINK_LOGS === 'true') {
      console.log('[Lavalink]', output.trim());
    }
  });

  lavalink.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('ERROR') || output.includes('Exception')) {
      console.error('[Lavalink Error]', output.trim());
    }
  });

  lavalink.on('error', (error) => {
    console.error('❌ Failed to start Lavalink:', error.message);
    if (error.message.includes('ENOENT')) {
      console.error('💡 Java is not installed or not in PATH!');
      console.error('   Install Java 17+: https://adoptium.net/');
    }
    process.exit(1);
  });

  console.log('⏳ Waiting for Lavalink to initialize...');
  for (let i = 0; i < 60; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const ready = await checkLavalink(LAVALINK_PORT);
    if (ready) {
      return { process: lavalink, port: LAVALINK_PORT, ready: true };
    }
  }

  console.error('❌ Lavalink startup timeout (60 seconds)');
  console.error('💡 Check lavalink/application.yml and lavalink/lavalink.err for errors');
  lavalink.kill();
  process.exit(1);
}

async function startBot() {
  console.log('🤖 Starting Discord Music Bot...');
  console.log('═══════════════════════════════════════════════════\n');

  const bot = spawn('node', ['index.js'], {
    stdio: 'inherit',
    cwd: __dirname,
    shell: true,
    env: { 
      ...process.env, 
      LAVALINK_PORT: LAVALINK_PORT,
      LAVALINK_HOST: LAVALINK_HOST 
    }
  });

  bot.on('error', (error) => {
    console.error('❌ Bot failed to start:', error.message);
    process.exit(1);
  });

  return bot;
}

let lavalinkProcess = null;
let botProcess = null;

function cleanup() {
  console.log('\n🛑 Shutting down gracefully...');
  if (botProcess) {
    botProcess.kill();
  }
  if (lavalinkProcess) {
    console.log('🔴 Stopping Lavalink...');
    lavalinkProcess.kill();
  }
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

(async () => {
  try {
    const lavalinkResult = await startLavalink();
    if (lavalinkResult) {
      lavalinkProcess = lavalinkResult.process;
      console.log(`\n✅ Lavalink ready on port ${lavalinkResult.port}\n`);
    }
    
    botProcess = await startBot();
    
    botProcess.on('exit', (code) => {
      console.log(`\n🛑 Bot stopped with code ${code}`);
      cleanup();
    });
    
  } catch (error) {
    console.error('❌ Startup error:', error.message);
    cleanup();
    process.exit(1);
  }
})();
