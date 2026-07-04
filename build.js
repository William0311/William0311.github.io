// Static build for GitHub Pages.
// 1) Bakes articles.json into blog.html between the <!--ARTICLES--> markers, so the
//    blog reads window.__BLOG_ARTICLES__ (all articles) without any server.
// 2) Bakes content.json into index.html between <!--TX:key-->...<!--/TX:key--> markers,
//    so portfolio paragraphs are editable from the local admin backend.
// Idempotent: re-running just refreshes the injected blocks. Run: node build.js
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BLOG = path.join(ROOT, 'blog.html');
const ARTICLES = path.join(ROOT, 'articles.json');
const INDEX = path.join(ROOT, 'index.html');
const CONTENT = path.join(ROOT, 'content.json');

// Also used by blog_server.js for on-the-fly preview of index.html.
function bakeContent(pageHtml, content) {
  for (const f of content) {
    if (!f.key || typeof f.text !== 'string') throw new Error('content.json: each entry needs key + text');
    const re = new RegExp('<!--TX:' + f.key + '-->[\\s\\S]*?<!--/TX:' + f.key + '-->');
    if (!re.test(pageHtml)) throw new Error('marker <!--TX:' + f.key + '--> not found in index.html');
    pageHtml = pageHtml.replace(re, () => '<!--TX:' + f.key + '-->' + f.text + '<!--/TX:' + f.key + '-->');
  }
  return pageHtml;
}

function build() {
  // 1) articles.json -> blog.html
  const articles = JSON.parse(fs.readFileSync(ARTICLES, 'utf8'));
  if (!Array.isArray(articles)) throw new Error('articles.json must be an array');

  const inject =
    '<!--ARTICLES-->\n' +
    '<script>window.__BLOG_ARTICLES__ = ' + JSON.stringify(articles) + ';</script>\n' +
    '<!--/ARTICLES-->';

  let html = fs.readFileSync(BLOG, 'utf8');
  const marker = /<!--ARTICLES-->[\s\S]*?<!--\/ARTICLES-->/;
  if (!marker.test(html)) throw new Error('markers <!--ARTICLES-->...<!--/ARTICLES--> not found in blog.html');

  html = html.replace(marker, () => inject);
  fs.writeFileSync(BLOG, html);
  console.log('Baked ' + articles.length + ' articles into blog.html');

  // 2) content.json -> index.html
  const content = JSON.parse(fs.readFileSync(CONTENT, 'utf8'));
  if (!Array.isArray(content)) throw new Error('content.json must be an array');
  fs.writeFileSync(INDEX, bakeContent(fs.readFileSync(INDEX, 'utf8'), content));
  console.log('Baked ' + content.length + ' text fields into index.html');
}

if (require.main === module) build();

module.exports = { bakeContent };
