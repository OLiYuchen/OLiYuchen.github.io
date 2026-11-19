// Film the page frame by frame.
//
//   node --experimental-websocket capture.mjs [out.mp4] [fps]
//
// Starts Chrome headless with a debugging port, opens film.html at 1920 x 1080,
// and for every frame sets the time with render(t), takes a screenshot over
// the DevTools protocol and pipes it to ffmpeg. No dependencies beyond Node 20,
// Chrome and ffmpeg.
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || path.join(here, '../../assets/img/paira/intro/paira-film.mp4');
const fps = +(process.argv[3] || 30);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9337;

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu-vsync', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + path.join(here, '.chrome'),
  '--window-size=1920,1080', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let target;
for (let i = 0; i < 60 && !target; i++) {
  try {
    const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
    target = list.find(t => t.type === 'page');
  } catch (e) { await sleep(150); }
}
if (!target) { chrome.kill(); throw new Error('Chrome did not come up'); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0; const waiting = new Map(); const events = [];
ws.addEventListener('message', m => {
  const d = JSON.parse(m.data);
  if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id); }
  else if (d.method) events.push(d);
});
const send = (method, params = {}) => new Promise(r => {
  const id = ++seq; waiting.set(id, r); ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result && r.result.result && r.result.result.value;
};

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: pathToFileURL(path.join(here, 'film.html')).href + '?capture=1' });
for (let i = 0; i < 200 && !events.some(e => e.method === 'Page.loadEventFired'); i++) await sleep(50);
const ready = await evaluate(`(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  return { fonts: document.fonts.check('600 96px "Playfair Display"') && document.fonts.check('500 27px "Instrument Sans"'),
           images: [...document.images].every(i => i.naturalWidth > 0), duration: window.DURATION };
})()`);
console.log('ready', JSON.stringify(ready));
if (!ready.fonts || !ready.images) { chrome.kill(); throw new Error('fonts or images did not load'); }

// STILLS="1.2,4.6" writes those moments to stills/ as PNGs instead of a film
if (process.env.STILLS) {
  const fs = await import('node:fs');
  fs.mkdirSync(path.join(here, 'stills'), { recursive: true });
  for (const t of process.env.STILLS.split(',').map(Number)) {
    await evaluate('render(' + t + ')');
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(here, 'stills', 't' + t.toFixed(2) + '.png'), Buffer.from(shot.result.data, 'base64'));
  }
  ws.close(); chrome.kill(); console.log('stills written'); process.exit(0);
}

const frames = Math.round(ready.duration * fps);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps),
  '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let f = 0; f < frames; f++) {
  await evaluate('render(' + (f / fps).toFixed(4) + ')');
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 95, captureBeyondViewport: false });
  const buf = Buffer.from(shot.result.data, 'base64');
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 60 === 0) process.stdout.write('  frame ' + f + '/' + frames + '\n');
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));

// the two posters: the opening logo for before it plays, and the two sides of
// the app for anyone who has asked for less motion
const fs = await import('node:fs');
for (const [t, name] of [[1.3, 'paira-film-poster.jpg'], [14.9, 'paira-film-still.jpg']]) {
  await evaluate('render(' + t + ')');
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86 });
  fs.writeFileSync(path.join(path.dirname(out), name), Buffer.from(shot.result.data, 'base64'));
}
ws.close(); chrome.kill();
console.log('wrote', out, frames, 'frames in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
