var gulp = require('gulp');
var fsExtra = require('fs-extra');

var config = require('../config');

gulp.task('post-build', function() {
  fsExtra.copySync(config.paths.app + '/index.html', config.paths.app_build + '/index.html');
  gulp.src([config.paths.app + '/app/vendor/jspm_packages/npm/material-design-icons-iconfont@2.0.5/dist/fonts/*.{ttf,woff,woff2,eof,svg,eot}']).pipe(gulp.dest(config.paths.app_build + '/fonts'));
});