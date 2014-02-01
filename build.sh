#!/bin/sh

set -e

echo deprecated, moving to grunt file

exit 1

sol_src=src/solarized-css
script_src=src/script
export PATH

arg=$1

case $arg in
  css-dev)
    ./node_modules/.bin/stylus -l -w src/solarized-css/ -o .
    ;;
  gh-pages)
    #FIXME this process needs to be changed 
    #FIXME built files are in the /build instead of /

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
esac
