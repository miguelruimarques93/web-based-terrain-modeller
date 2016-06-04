/**
 * Build tasks
 */

var gulp = require('gulp');
var runSequence = require('run-sequence');

gulp.task('build:development', function (callback) {
  runSequence(
    'cleanup',
    'glslify',
    'compile-sass',
    'post-build',
    callback
  );
});