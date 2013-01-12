#!/bin/sh

set -e

sol_src=src/solarized-css
script_src=src/script
export PATH

arg=$1

build_css() {
    ./node_modules/.bin/stylus ${sol_src}/solarized-dark.styl -o .
    ./node_modules/.bin/stylus ${sol_src}/solarized-light.styl -o .
    ./node_modules/.bin/uglifycss solarized-dark.css > solarized-dark.min.css
    ./node_modules/.bin/uglifycss solarized-light.css > solarized-light.min.css
}

build_js() {
    ./node_modules/.bin/coffee -o . -c ${script_src}/styleswitch.coffee
    ./node_modules/.bin/coffee -o . -c ${script_src}/org-info-extension.coffee
    cat  ${script_src}/org-info-src.js styleswitch.js org-info-extension.js > org-info.js
    ./node_modules/.bin/uglifyjs -nc -o styleswitch.min.js styleswitch.js
    ./node_modules/.bin/uglifyjs -nc -o org-info.min.js org-info.js

}


case $arg in
    css-dev)
        ./node_modules/.bin/stylus -l -w src/solarized-css/ -o .
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
