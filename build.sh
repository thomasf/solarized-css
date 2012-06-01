#!/bin/sh

set -e

sol_src=src/solarized-css
script_src=src/script
npm_bin=./node_modules/.bin
PATH="${npm_bin}:${PATH}"
export PATH

arg=$1

build_css() {
    stylus ${sol_src}/solarized-dark.styl -o .
    stylus ${sol_src}/solarized-light.styl -o .
    uglifycss solarized-dark.css > solarized-dark-min.css
    uglifycss solarized-light.css > solarized-light-min.css
}

build_js() {
    coffee -o . -c ${script_src}/styleswitch.coffee
    coffee -o . -c ${script_src}/org-info-extension.coffee
    cat  ${script_src}/org-info-src.js styleswitch.js org-info-extension.js > org-info.js
    uglifyjs -nc -o styleswitch.min.js styleswitch.js 
    uglifyjs -nc -o org-info.min.js org-info.js

}


case $arg in
    css-dev)
        stylus -l -w src/solarized-css/ -o .
        ;;
    gh-pages)
        git diff-files --quiet || (
            git status
            echo "Unclean, exiting"
            exit 1
        )
        git checkout gh-pages
        git merge master -m"merge master to gh-pages"
        pandoc index.md > index.html
        git add index.html && git commit -am"merged master" || echo "---" 
        git checkout master
        ;;
        
        *) 
        # default target is regular build
        build_css
        build_js
        ;;
esac



