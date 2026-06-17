const { spawn } = require('child_process');
const shadcn = spawn('/c/Program Files/nodejs/npx', ['shadcn@latest', 'init'], { stdio: ['pipe', 'pipe', 'pipe'] });
shadcn.stdin.write('\n');
shadcn.stdin.end();
shadcn.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});
shadcn.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});
shadcn.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
