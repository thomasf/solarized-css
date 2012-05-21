#!/bin/sh

set -e

./node_modules/.bin/stylus src/solarized-dark.styl -o .
./node_modules/.bin/stylus src/solarized-light.styl -o .

./node_modules/.bin/uglifycss solarized-dark.css > solarized-dark-min.css
./node_modules/.bin/uglifycss solarized-light.css > solarized-light-min.css
