<link rel="stylesheet" href="solarized-light.min.css" type="text/css" media="screen" />
<style type="text/css" media="screen">#wrapper { margin: auto; max-width:1000px; } p { max-width: 600px; } </style>
<div id="wrapper">

# Solarized CSS

This project aim is to provide general solarized light and dark colorschemes
for HTML documents.

Basically I wanted [solarized](http://ethanschoonover.com/solarized) colorschemes for [org-mode](http://orgmode.org) HTML exports. It is supposed to be used as a single stylesheet for HTML documents that uses regular HTML elements.

Repository: **[http://github.com/thomasf/solarized-css](https://github.com/thomasf/solarized-css)**

## Targeted integrations

* Org mode HTML exports
* Markdown

## Download CSS

**Light:** 
[uncompressed](http://thomasf.github.io/solarized-css/solarized-light.css)
 / [minimized](http://thomasf.github.io/solarized-css/solarized-light.min.css)
 
**Dark:**
[uncompressed](http://thomasf.github.io/solarized-css/solarized-dark.css)
 / [minimized](http://thomasf.github.io/solarized-css/solarized-dark.min.css)

## Using in HTML documents without downloading

Just insert one of these lines into the `<head>` section of any HTML file.

**Light version:**

    <link href="http://thomasf.github.io/solarized-css/solarized-light.min.css" rel="stylesheet"></link>

**Dark version:**

    <link href="http://thomasf.github.io/solarized-css/solarized-dark.min.css" rel="stylesheet"></link>

## Using in Org mode HTML exports without downloading

Put this or something similar at the top of your .org document:

**Light version:**

    #+INFOJS_OPT: view:t toc:t ltoc:t mouse:underline buttons:0 path:http://thomasf.github.io/solarized-css/org-info.min.js
    #+HTML_HEAD: <link rel="stylesheet" type="text/css" href="http://thomasf.github.io/solarized-css/solarized-light.min.css" />

**Dark version:**

    #+INFOJS_OPT: view:t toc:t ltoc:t mouse:underline buttons:0 path:http://thomasf.github.io/solarized-css/org-info.min.js
    #+HTML_HEAD: <link rel="stylesheet" type="text/css" href="http://thomasf.github.io/solarized-css/solarized-dark.min.css" />

(`#+STYLE:` changed to `#+HTML_HEAD:` in org-mode 8.0)

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
