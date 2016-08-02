/**
 * Doc task
 */

var gulp = require('gulp');
var runSequence = require('run-sequence');
var jsdoc = require('gulp-jsdoc3');

var config = require('../config');

gulp.task('doc', function (callback) {
  gulp.src(config.doc.static_files + config.doc.src, {read: false})
    .pipe(jsdoc(config.doc.jsdoc, callback));
});