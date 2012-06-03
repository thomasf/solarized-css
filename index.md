<link rel="stylesheet" href="solarized-light.min.css" type="text/css" media="screen" />
<style type="text/css" media="screen">#wrapper { margin: auto; max-width:1000px; } p { max-width: 600px; } </style>
<div id="wrapper">

# Solarized CSS

## What?

This project aim is to provide general solarized light and dark colorschemes
for HTML documents.

Basically I wanted [solarized](http://ethanschoonover.com/solarized) colorschemes for [org-mode](http://orgmode.org) HTML exports. It is supposed to be used as a single stylesheet for HTML documents that uses regular HTML elements.

## Targeted integrations

* Org mode HTML exports
* Markdown
* Any HTML document that mostly relies on standard HTML elements.

## Download

**Light:** 
 / [Uncompressed](http://thomasf.github.com/solarized-css/solarized-light.css)
 / [Minimized](http://thomasf.github.com/solarized-css/solarized-light.min.css)
 /
 
**Dark:**
[Uncompressed CSS](http://thomasf.github.com/solarized-css/solarized-dark.css)
[Minimized CSS](http://thomasf.github.com/solarized-css/solarized-dark.min.css)

## Github

For source, build scripts, README, source and acknowledgments:
[https://github.com/thomasf/solarized-css](https://github.com/thomasf/solarized-css)

## Use it!

### With any HTML document

For basic usage, just insert one of these links into the `<head>` section of any HTML file.

**Light version:**

    <link href="http://thomasf.github.com/solarized-css/solarized-light.min.css" rel="stylesheet"></link>

**Dark version:**

    <link href="http://thomasf.github.com/solarized-css/solarized-dark.min.css" rel="stylesheet"></link>

### With Org mode documents

Put this or something similar at the top of your .org document:

    #+INFOJS_OPT: view:info toc:t ltoc:t mouse:underline buttons:0 path:http://thomasf.github.com/solarized-css/org-info.min.js
    #+STYLE: <link rel="stylesheet" type="text/css" href="http://thomasf.github.com/solarized-css/solarized-light.min.css" />

## Examples
- [Most or all HTML elements.](test/html.html)
- [Markdown](test/markdown.html) [(markdown source)](test/markdown.md)
- [Org mode](test/org-hacks.html) [(org source)](test/org-hacks.org)

## Acknowledgments
* Ethan Schoonover for creating the [solarized](http://ethanschoonover.com/solarized) color scheme
* HTML element test page based on [snippr snippet](http://snipplr.com/view/8121/)
* Org mode test page from [worg](http://orgmode.org/worg/)
* Markdown test page from [markdowncss](https://bitbucket.org/kevinburke/markdowncss/)
* Normalize.css, [normalize.css](http://necolas.github.com/normalize.css/)

</div>
