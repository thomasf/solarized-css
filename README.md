# Solarized HTML stylesheet

This is a quick hack because I wanted a [solarized](http://ethanschoonover.com/solarized) theme for [org-mode](http://orgmode.org) HTML exports. It is supposed to be used as a single stylesheet for HTML documents that uses regular HTML elements.

A small set of org-mode html export specific styles are included

Some default html elements are not restyled yet.

[normalize.css](http://necolas.github.com/normalize.css/) is included in the rendered .css-files.

[Here](http://datamaskinen.medeltiden.org/downloads/osinstall/osinstall.html) is an example org-mode HTML export that uses the light version style sheet.


## Development
[Stylus](http://learnboost.github.com/stylus/) is the style language used for building the .css-files.

To be able to build you need to have [nodejs](http://nodejs.org/) installed.

To install dependencies, run this from the repository root:

    npm install

Then you should be able to rebuild using:

    ./build
    
