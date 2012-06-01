#!/bin/sh

set -e

sol_src=src/solarized-css
npm_bin=./node_modules/.bin

${npm_bin}/stylus ${sol_src}/solarized-dark.styl -o .
${npm_bin}/stylus ${sol_src}/solarized-light.styl -o .

${npm_bin}/uglifycss solarized-dark.css > solarized-dark-min.css
${npm_bin}/uglifycss solarized-light.css > solarized-light-min.css
