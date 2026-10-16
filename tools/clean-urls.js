// live-server middleware: mirrors vercel.json locally, so /doctors,
// /patients and the old URLs work on localhost the way they do on flacara.ai.
//   npx live-server --port=3002 --middleware="$PWD/tools/clean-urls.js" .
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const rewrites = { '/doctors': '/clinicians.html' };
const redirects = { '/clinicians': '/doctors', '/devices': '/doctors', '/software': '/doctors' };

module.exports = function (req, res, next) {
  const [pathname, query = ''] = req.url.split('?');
  const qs = query ? '?' + query : '';

  // /software.html → /software, /index.html → /
  if (pathname.endsWith('.html')) {
    let clean = pathname.slice(0, -5);
    if (clean.endsWith('/index')) clean = clean.slice(0, -5);
    clean = redirects[clean] || clean;
    res.statusCode = 308;
    res.setHeader('Location', (clean || '/') + qs);
    return res.end();
  }
  if (redirects[pathname]) {
    res.statusCode = 308;
    res.setHeader('Location', redirects[pathname] + qs);
    return res.end();
  }
  if (rewrites[pathname]) {
    req.url = rewrites[pathname] + qs;
    return next();
  }
  // /software → software.html when that file exists
  if (!path.extname(pathname) && pathname !== '/' &&
      fs.existsSync(path.join(root, pathname + '.html'))) {
    req.url = pathname + '.html' + qs;
  }
  next();
};
