var sass = require('gulp-sass'),
    jsonSass = require('../'),
    gutil = require('gulp-util'),
    path = require('path')
    concat = require('gulp-concat'),
    through2 = require('through2'),
    gulp = require('gulp'),
    fs = require('fs'),
    test = require('tape'),
    chalk = require('chalk'),
    print = require('gulp-print');

function runTests(t, opt) {
  var suffix = opt.sass ? 'sass' : 'scss';

  opt.sassShouldCompile = opt.sassShouldCompile === undefined ? true : opt.sassShouldCompile;
  opt.jsonShouldCompile = opt.jsonShouldCompile === undefined ? true : opt.jsonShouldCompile;

  var fileObj;
  var failedSassCompilation = false;
  var failedJsonCompilation = false;

  var stream = through2.obj(function cacheNonJsonFileForLaterComparison(file, encoding, done) {
    if (file.path.match('stub')) {
      fileObj = file;
    }
    this.push(file);
    done();
  });


  stream
    .pipe(jsonSass(opt))
      .on('error', function() {
        failedJsonCompilation = true;
        t.end();
      })
      .on('end', function() {
        if (opt.jsonShouldCompile && !failedJsonCompilation) {
          t.pass('json compiled successfully, as expected');
        } else if (!opt.jsonShouldCompile && failedJsonCompilation) {
          t.pass('json failed to compile, as expected');
        } else if (opt.jsonShouldCompile && failedJsonCompilation) {
          t.fail('json failed to compile when expected to pass');
        } else if (!opt.jsonShouldCompile && !failedJsonCompilation) {
          t.fail('json compiled when it was expected to fail');
        }
      })
    .pipe(through2.obj(function runJsonSassTests(file, encoding, done) {
      if (!file.path.match('stub')) {
        t.equal(file.contents.toString().split('\n').length, 7, 'test json should result in a 7 line file');
      } else {
        t.equal(file.contents.toString(), fileObj.contents.toString(), 'non-json files should not be modified (content)');
        t.equal(file.path, fileObj.path, 'non-json files should not be modified (file path)');
      }
      this.push(file);
      done();
    }))
    .pipe(concat('test.' + suffix))
    // .pipe( gulp.dest('./bin'))
    // .pipe( print() )
    // .pipe( through2.obj(function runJsonSassTests(file, encoding, done) {
    //   console.log( "file", suffix, file.contents.toString() );
    // }))
    .pipe( sass() )
      .on('error', function sassCompilationFail() {
        console.log('////');
        failedSassCompilation = true;
      })
      .on('end', function sassCompilationEnd() {
        console.log('>> compiled');
        if (opt.sassShouldCompile && !failedSassCompilation) {
          t.pass('sass compiled successfully, as expected');
        } else if (!opt.sassShouldCompile && failedSassCompilation) {
          t.pass('sass failed to compile, as expected');
        } else if (opt.sassShouldCompile && failedSassCompilation) {
          console.log('....')
          t.fail('sass failed to compile when expected to pass');
        } else if (!opt.sassShouldCompile && !failedSassCompilation) {
          t.fail('sass compiled when it was expected to fail');
        }
      })
    // .pipe( gulp.dest('./bin'))
    .pipe(through2.obj(function endTest(file, encoding, done) {
      t.end();
      done();
    }));

  stream.write(new gutil.File({
    path: opt.src,
    contents: fs.readFileSync(opt.src)
  }));

  stream.write(new gutil.File({
    path: path.join(__dirname, './fixtures/stub.' + suffix),
    contents: fs.readFileSync(path.join(__dirname, './fixtures/stub.' + suffix))
  }));

  stream.end();
}

function setupTest(name, opt) {
  test(name, function(t) {
    console.log(chalk.yellow('Test: ' + name) + chalk.green(opt.sass ? ' (sass mode)' : ' (scss mode)'));
    runTests(t, opt);
  })
}

sasses = [false];

for (var i = 0; i < sasses.length; i++) {
  console.log("Called: ", i);
  setupTest('base case', {
    src: path.join(__dirname, './fixtures/.foo.base.json'),
    sassShouldCompile: true,
    sass: sasses[false]
  });

  setupTest('base case minus numeric, illegal character support should not break the plugin', {
    src: path.join(__dirname, './fixtures/.foo.base.json'),
    prefixFirstNumericCharacter: false,
    escapeIllegalCharacters: false,
    sass: sasses[i]
  });

  setupTest('proper support for variables that begin with numbers', {
    src: path.join(__dirname, './fixtures/numbers.json'),
    sass: sasses[i]
  });

  // setupTest('fails when variables begin with numbers and prefixFirstNumericCharacter === false', {
  //   src: path.join(__dirname, './fixtures/numbers.json'),
  //   sassShouldCompile: false,
  //   prefixFirstNumericCharacter: false,
  //   sass: sasses[i]
  // });

}
