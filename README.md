<link rel="stylesheet" href="solarized-light-min.css" type="text/css" media="screen" />
<style type="text/css" media="screen">#wrapper { margin: auto; width:500px }</style>
<div id="wrapper">

# Solarized HTML stylesheet

This project aim is to provide general solarized light and dark themes
for HTML documents that mostly relies on standard HTML elements.

For examples and some more info, visit the [github project page](http://http://thomasf.github.com/solarized-css/)

## Features

* [normalize.css](http://necolas.github.com/normalize.css/) is included in the rendered .css-files.

## Integrations 

* A small set of org-mode html export specific styles are included. 


## TODO
* Small javascript to switch between light and dark theme.
* Deeper org-mode integration


## Development
[Stylus](http://learnboost.github.com/stylus/) is the style language used for building the .css-files.

To be able to build you need to have [nodejs](http://nodejs.org/) installed.

To install dependencies, run this from the repository root:

    npm install

Then you should be able to rebuild using:

    ./build
    
</div>
