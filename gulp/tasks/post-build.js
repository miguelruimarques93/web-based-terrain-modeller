'use strict';

var gulp = require('gulp');
var fsExtra = require('fs-extra');

var config = require('../config')

gulp.task('post-build', function() {
  fsExtra.copySync(config.paths.app + '/index.html', config.paths.app_build + '/index.html');
});