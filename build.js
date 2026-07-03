// Static build for GitHub Pages.
// Bakes articles.json into blog.html between the <!--ARTICLES--> markers, so the
// blog reads window.__BLOG_ARTICLES__ (all articles) without any server.
// Idempotent: re-running just refreshes the injected block. Run: node build.js
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BLOG = path.join(ROOT, 'blog.html');
const ARTICLES = path.join(ROOT, 'articles.json');

const articles = JSON.parse(fs.readFileSync(ARTICLES, 'utf8'));
if (!Array.isArray(articles)) throw new Error('articles.json must be an array');

const inject =
  '<!--ARTICLES-->\n' +
  '<script>window.__BLOG_ARTICLES__ = ' + JSON.stringify(articles) + ';</script>\n' +
  '<!--/ARTICLES-->';

let html = fs.readFileSync(BLOG, 'utf8');
const marker = /<!--ARTICLES-->[\s\S]*?<!--\/ARTICLES-->/;
if (!marker.test(html)) throw new Error('markers <!--ARTICLES-->...<!--/ARTICLES--> not found in blog.html');

html = html.replace(marker, inject);
fs.writeFileSync(BLOG, html);
console.log('Baked ' + articles.length + ' articles into blog.html');
