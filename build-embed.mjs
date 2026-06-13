import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('franklin.css', 'utf8').trim();
const js = fs.readFileSync('franklin.js', 'utf8').trim();

let body = html.split('<body class="intro-active">')[1].split('</body>')[0];
body = body.replace(/\s*<script src="franklin.js"><\/script>\s*/, '\n');

const fonts = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap" rel="stylesheet">',
].join('\n');

const header = [
  '<!-- ============================================================',
  '     FRANKLIN MASSAGE STUDIO',
  '     Paste this whole block into ONE Webflow HTML Embed (blank page),',
  '     then publish. Self-contained: fonts, styles, markup, script.',
  '     Studio images are served from Webflow.',
  '     ============================================================ -->',
].join('\n');

const out = `${header}\n${fonts}\n<style>\n${css}\n</style>\n${body.trim()}\n<script>\n${js}\n</script>\n`;
fs.writeFileSync('webflow-embed.html', out);
console.log('chars:', out.length);
