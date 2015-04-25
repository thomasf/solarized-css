# Solarized HTML stylesheet

[![Join the chat at https://gitter.im/thomasf/solarized-css](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/thomasf/solarized-css?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This project aim is to provide general solarized light and dark colorshcemes
for HTML documents that mostly relies on standard HTML elements.

For examples and some more info, visit the [Solarized-CSS GitHub page](http://thomasf.github.io/solarized-css/)

## Specifically targeted integrations
* Org mode HTML exports
* Markdown
* Any HTML document that mostly relies on standard HTML elements.

## Development
[Stylus](http://learnboost.github.com/stylus/) is the style language used for building the .css-files.

To be able to build you need to have [nodejs](http://nodejs.org/) installed.

To install dependencies, run this from the repository root:

    npm install

Then you should be able to rebuild using:

    grunt
    
