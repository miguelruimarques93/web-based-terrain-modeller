var gulp = require('gulp');
var gulpInsert = require('gulp-insert');
var gulpSass = require('gulp-sass');
var gulpSourcemaps = require('gulp-sourcemaps');
var gulpInject = require('gulp-inject');
var sassJspm = require('sass-jspm-importer');
// var autoprefixer = require('gulp-autoprefixer');

var config = require('../config');

gulp.task('compile-sass', function () {
  return gulp.src(config.sass.src)
    .pipe(gulpInject(gulp.src(config.sass.routes_src, {read: false, cwd: config.paths.app + '/app'}), {
      starttag: '/* inject:imports */',
      endtag: '/* endinject */',
      transform: function (filepath) {
        return '@import ".' + filepath + '";';
      }
    }))
    .pipe(gulpSourcemaps.init())
    .pipe(gulpSass({
      functions: sassJspm.resolve_function('/src/app/vendor/jspm_packages/'),
      importer: sassJspm.importer
    })
    .on('error', function (e) { 
      console.log("Failed to compile SASS: ", e.message);
      this.emit('end');
    }))
    .pipe(gulpSourcemaps.write('.' /* write as a separate file */))
    // .pipe(autoprefixer())
    .pipe(gulp.dest(config.sass.dest));
    
});