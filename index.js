var through = require('through'),
    chalk = require('chalk'),
    gulpmatch = require('gulp-match'),
    path = require('path'),
    gutil = require('gulp-util');

// from http://stackoverflow.com/questions/17191265/legal-characters-for-sass-and-scss-variable-names
var escapableCharactersRegex = /(["!#$%&\'()*+,.\/:;\s<=>?@\[\]^\{\}|~])/g;
function replaceEscapableCharacters(str) {
  return str.replace(escapableCharactersRegex, function(a,b) {
    return '\\' + b;
  });
}
var firstCharacterIsNumber = /^[0-9]/;

module.exports = function(opt) {
  opt = opt || {};
  opt.sass = !!opt.sass;
  opt.eol = opt.sass ? '' : ';';
  opt.ignoreJsonErrors = !!opt.ignoreJsonErrors;
  opt.escapeIllegalCharacters = opt.escapeIllegalCharacters === undefined ? true : opt.escapeIllegalCharacters;
  opt.firstCharacter = opt.firstCharacter || '_';
  opt.prefixFirstNumericCharacter = opt.prefixFirstNumericCharacter === undefined ? true : opt.prefixFirstNumericCharacter;
  // If no parseObjectsAsMaps opt value is parsed assume true
  opt.parseObjectsAsMaps = opt.parseObjectsAsMaps === undefined ? true : opt.parseObjectsAsMaps;
  opt.delim = opt.delim || '-';

  // process the JSON
  var sassVariables = [];

  function processJSON(file) {

    // if it does not have a .json suffix, ignore the file
    if (!gulpmatch(file, /^.*\.(json)/ )) {
      this.push(file);
      return;
    }

    // load the JSON
    try {
      var parsedJSON = JSON.parse(file.contents);
    } catch (e) {
      if (opt.ignoreJsonErrors) {
        console.log(chalk.red('[gulp-json-sass]') + ' Invalid JSON in ' + file.path + '. (Continuing.)');
      } else {
        console.log(chalk.red('[gulp-json-sass]') + ' Invalid JSON in ' + file.path);
        this.emit('error', e);
      }
      return;
    }



    loadVariablesRecursive(parsedJSON, '', function pushVariable(assignmentString) {
      console.log('Pushing >>>>>>> ', assignmentString);
      sassVariables.push(assignmentString);
    }, false, null);

    var sass = sassVariables.join('\n');
    file.contents = Buffer(sass);

    file.path = gutil.replaceExtension(file.path, opt.sass ? '.sass' : '.scss');

    this.push(file);
  }

  function loadVariablesRecursive(obj, path, cb, sub, mp) {

    // if( sub && mp ) { console.log( "****", sub, mp ) };
    if( sub && mp ) { sassVariables.push('$'+ mp + ': (') };

    // console.log('path', path);
    //  Loops through everything...
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var val = obj[key];

        // escape invalid sass characters
        if (opt.escapeIllegalCharacters) {
          key = replaceEscapableCharacters(key);
        }

        // sass variables cannot begin with a number
        if (path === '' && firstCharacterIsNumber.exec(key) && opt.prefixFirstNumericCharacter) {
          key = opt.firstCharacter + key;
        }

        if (typeof val !== 'object') {
          console.log('val', key, val);

          // depending on if we're in a sub-object or not
          if( sub ) {

            cb('\'' + path + key + '\': \'' + val + '\',' );
          } else {
            cb('$' + path + key + ': \'' + val + '\'' + opt.eol);
          }
        } else {
          if ( val.length !== undefined ) {
            // TODO: Optional flag in passed opt object to determine if arrays are flattened or not
            // TODO: Parse on data types - to colour names dont get stringfied...
            // TODO: Write a test for this...
            cb('$' + path + key + ': ' + JSON.stringify(val).replace('[','').replace(']','') +  opt.eol);
          } else {
            //  TODO: convert complex object structures to sass maps
            console.log("parsing: ", "val:",val, "pk", path+key+ ':(' + 1 + ');' );

            // cb('$' + path + key + ': (' + loadVariablesRecursive(val, '' ,cb,true) + ')' + opt.eol)
            loadVariablesRecursive(val, '' , cb, true, path+key);
            // loadVariablesRecursive(val, path + key + opt.delim, cb, true);
          }
        }
      }
    }

    if( sub && mp ) { sassVariables.push(');'); }
  }
  return through(processJSON);
}
