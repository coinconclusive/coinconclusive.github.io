# waffle-annie.github.io
my website :3

## `ahh` documentation

> Ahh, you need a blog!
>
> Annie's Hypertext Hyperlinker

See [`scripts/build.js`](scripts/build.js) for the implementation.

### Folder structure

```js
- "ahh.json" // config file (see below).
- config.sources
  - * ... {localFiles} // any files.
  - config.blog // directory with the blog
    - config.index.html? // index file for this directory.
    - config.template.blog? // template for a blog post.
    - id ... {posts} // each directory represents a single blog post.
      - config.index.source? {posts[id].source} // source markdown file.
      - * ... {posts[id].localFiles} // any local files for the blog.
- config.public // this is generated
  - {localFiles}... // the local files (template processed if needed).
  - config.blog // directory with the blog
    - config.index.html? // index file for this directory.
    - {posts}... // each directory represents a single blog post.
      - config.index.html? // config.template.blog with posts[id].source
      - {posts[id].localFiles}... // the local files (template processed if needed).
```

#### Example:

```lua
- ahh.json
- config.sources
  - index.html
  - style.css
  - blog
    - index.html
    - blog.html
    - post1
      - index.md
      - tomato.png
    - post2
      - index.md
      - data.json
    - post3 -- skipped, no index file
      - music.wav
- public
  - index.html -- processed as template
  - style.css
  - blog
    - index.html -- processed as template
    - post1
      - index.html -- processed template
      - tomato.png
    - post2
      - index.html -- processed template
      - data.json
```

### Templates

Some files are templates. This means that they are treated as if they were
[javascript template strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).

Predefined variables:
```typescript
{
  postIndex: {
    author: string, // author (from front matter)
    date: Date, // date (from front matter)
    title: string, // title (from front matter)
    description: string, // post description (from front matter)
    id: string, // post id
    html: string, // generated html
    files: string[] // local files
  },
  config: { // used internally, provided for completeness
    sourcesDir: string, // from ahh.json: .sources
    publicDir: string, // from ahh.json: .public
    blogDir: string, // from ahh.json: .blog
    sourceIndex: string, // from ahh.json: .index.source
    htmlIndex: string, // from ahh.json: .index.html
    blogTemplate: string, // from ahh.json: .template.blog (converted to full path)
    staticTemplateExts: string[], // from ahh.json: .template.static
  },
  // TODO:
  configJson: { ... } // directly from ahh.json
}
```

### Config file

> TODO: make a generic file copy function that uses `template.static`.

> **Warning**
>
> BUG: local blog files don't use `processTemplate`.
>
> BUG: files in subdirectories don't use `processTemplate`.

```js
{
  "sources": "./sources/", // directory where the website sources are.
  "public": "./public/", // directory where the generated website will go in.
  "blog": "blog/", // name of directory in `sources` that contains the blog data.
  "template": { // template information (js template strings)
    "static": [".html", ".css"], // files with these extensions are processed as templates.
    "blog": "blog/blog.html" // blog post template file.
  },
  "index": { // index file configuration.
    "source": "index.md", // blog post index file.
    "html": "index.html" // html index file. (blog post index files get converted into html index files)
  }
}
```

#### blog post markdown

[marked.js](https://marked.js.org/) is used to generate the HTML from Markdown. Required front matter:

```markdown
---
title: <post title> # not sanitized
description: <post description> # not sanitized
date: <creation date formatted as json> # example: 2023-01-18T20:11:42.035Z
author: <post author> # not sanitized
---

Your markdown goes here...
```

