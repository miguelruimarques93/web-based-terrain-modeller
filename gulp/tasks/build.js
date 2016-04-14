/**
 * Build tasks
 */

'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');

gulp.task('build:development', function (callback) {
  runSequence(
    'cleanup',
    // 'set-environment:development',
    // 'update-revision',
    'compile-sass',
    'compile-templates',
    'post-build',
    callback
  );
});