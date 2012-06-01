#!/bin/sh

set -e

sol_src=src/solarized-css
npm_bin=./node_modules/.bin
PATH="${npm_bin}:${PATH}"
export PATH

arg=$1

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
        git add index.html
        git commit -am"merged master" 
        git checkout master
        ;;
        
        *)
        # default target is regular build
        stylus ${sol_src}/solarized-dark.styl -o .
        stylus ${sol_src}/solarized-light.styl -o .
        uglifycss solarized-dark.css > solarized-dark-min.css
        uglifycss solarized-light.css > solarized-light-min.css
        ;;
esac



