var gulp = require('gulp');
var del = require('del');
var config = require('../config');

gulp.task('cleanup', function() {
  del.sync(config.paths.app_build);
});