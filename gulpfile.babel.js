
import gulp from 'gulp';
// var jade = require('gulp-jade');
import gulpLoadPlugins from 'gulp-load-plugins';
// import browserSync from 'browser-sync';
import {stream as wiredep} from 'wiredep';

var sassExternalVars = require('.');

// const reload = browserSync.reload;
const $ = gulpLoadPlugins(
      { pattern: '*' }
      );

var ace = false;

gulp.task('styles', () => {
  return gulp.src(['test/fixtures/.foo.base.json','test/fixtures/stub.scss'])
    .pipe( $.print() )
    // .pipe( $.plumber() )
    .pipe( sassExternalVars( {sass:false} ))
    .pipe( $.concat({ path: 'framework.scss'}))
    .pipe( gulp.dest('./src/sass'))
    .pipe($.sass({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError) )
    // .pipe( $.stripCssComments() )
    .pipe(gulp.dest('./bin/css'));
    // .pipe(reload({stream: true}));
});
