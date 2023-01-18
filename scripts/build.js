const process = require('process')
const fs = require('fs');
const path = require('path');
const fm = require('front-matter');
const marked = require('marked');

const configFile = './ahh.json';

if(!fs.existsSync(configFile) || !fs.statSync(configFile).isFile()) {
  console.error(`config file not found (${configFile}), aborting.`);
  process.exit(1);
}

console.log(`found config file: ${configFile}`);

/**
 * @type {{
 *   public: string,
 *   sources: string,
 *   blog: string,
 *   index: { source: string, html: string }
 * }} 
*/
const configJson = JSON.parse(fs.readFileSync(configFile).toString());

/**
 * @param {object} o object
 * @param {string} k path
 */
function checkObjectKey(o, k, prefix = '') {
  const i = k.indexOf('.');
  if(i > 0) {
    checkObjectKey(o, k.slice(0, i), prefix);
    checkObjectKey(
      o[k.slice(0, i)],
      k.slice(i + 1),
      prefix + (prefix ? '.' : '') + k.slice(0, i)
    );
  } else if(!o[k]) {
    console.error(`missing required key: '${prefix}${prefix?'.':''}${k}', aborting.`);
    process.exit(1);
  }
}

checkObjectKey(configJson, `sources`);
checkObjectKey(configJson, `public`);
checkObjectKey(configJson, `blog`);
checkObjectKey(configJson, `index.source`);
checkObjectKey(configJson, `index.html`);
checkObjectKey(configJson, `template.blog`);

const config = {
  sourcesDir: configJson.sources,
  publicDir: configJson.public,
  blogDir: path.join(configJson.sources, configJson.blog),
  sourceIndex: configJson.index.source,
  htmlIndex: configJson.index.html,
  blogTemplate: configJson.template.blog,
};

console.log(`sources: ${config.sourcesDir}`);
console.log(`public: ${config.publicDir}`);
console.log(`blog: ${config.blogDir}`);

function* walkDir(dir) {
  for(const f of fs.readdirSync(dir)) {
    const ff = path.join(dir, f);
    if(fs.statSync(ff).isDirectory())
      yield* walkDir(ff);
    else yield ff;
  }
}

/**
 * @type {{[id: string]: {
 *   author: string,
 *   date: Date,
 *   title: string,
 *   description: string,
 *   id: string,
 *   html: string,
 *   files: string[]
 * }}}
 */
const postIndex = {};

for(const blogDir of fs.readdirSync(config.blogDir)) {
  const fullBlogDir = path.join(config.blogDir, blogDir);
  if(fs.statSync(fullBlogDir).isDirectory()) {
    console.log(`- blog post: ${blogDir} (${fullBlogDir})`);
    const sourceIndexFile = path.join(fullBlogDir, config.sourceIndex);
    if(!fs.existsSync(sourceIndexFile)
    || !fs.statSync(sourceIndexFile).isFile()) {
      console.error("source index file not found, skipping.");
      continue;
    }
    const source = fs.readFileSync(sourceIndexFile);
    const { attributes, body } = fm(source);
    const html = marked.marked(body);
    
    checkObjectKey(attributes, 'author', '[post metadata]');
    checkObjectKey(attributes, 'description', '[post metadata]');
    checkObjectKey(attributes, 'date', '[post metadata]');
    checkObjectKey(attributes, 'author', '[post metadata]');

    const metadata = {
      title: attributes.title,
      description: attributes.description,
      date: new Date(attributes.date),
      author: attributes.author,
    };

    const files = [];
    for(const f of fs.readdirSync(fullBlogDir)) {
      files.push(path.join(ff, f));
    }

    postIndex[blogDir] = { id: blogDir, html, files, ...metadata };
  }
}

/**
 * @param {string} source
 * @return {string}
 */
function processHtml(source, $) {
  return new Function('$', 'return `' + source.replace(/`/g, '\\`') + '`')($);
}

for(const [id, post] of Object.entries(postIndex)) {
  const indexPath = path.join(config.blogDir, post.id, config.htmlIndex);
  console.log(`writing post ${id}: ${indexPath}`);
  fs.writeFileSync(indexPath, processHtml(post.html));
}
