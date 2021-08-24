const { src, dest, series } = require('gulp')
const stylus = require('gulp-stylus')
const rename = require('gulp-rename')
const rimraf = require('gulp-rimraf')
const cleancss = require('gulp-clean-css')
const clone = require('gulp-clone').sink()

const source_files = ['./src/solarized-css/solarized-dark.styl', './src/solarized-css/solarized-light.styl']
const output_dir = './dist'

const css = () => {
    return src(source_files)
        .pipe(stylus())
        .pipe(clone)
        .pipe(cleancss({ compatibility: 'ie8' }))
        .pipe(rename((path) => ({ 
            dirname: path.dirname,
            basename: path.basename + '.min',
            extname: '.css'})))
        .pipe(clone.tap())
        .pipe(dest(output_dir))
}
const clean = () => {
    return src(`${output_dir}/*.css`, { read: false })
        .pipe(rimraf())
}

exports.default = series(
    clean,
    css
)