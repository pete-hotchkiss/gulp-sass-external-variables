# gulp-sass-external-variables

Parses and external JSON source, injecting properties which are subsequently available as part of SASS processing

_**Note**_: This is heavily based on the seemingly inactive [gulp-json-sass]( https://github.com/rbalicki2/gulp-json-sass) so much of the credit must go to it's author.

My beef with the current solution, is it's not the greatest at handling complex object structures, and I wanted a way to parse ```JSON.array``` values to SASS Lists.

It also tripped up if you tried to pass it anything other than numerical values.

**_Coming Soon_**:
 - Parsing Object structures to Maps ( for SASS 3.3 and beyond )
 - Additional configuration settings to define if arrays are flattened to lists or not, to be passed in options object

This process is useful for setting up global variables and flags that effect what your final ```.css``` file will contain - for example if you wanted to produce multiple themed based instances of a core CSS file based on build-time iterations.

## Installing

The usual npm jive to install module and all it's dependencies...

```npm i --save gulp-sass-external-variables```

## Using

Once installed the package is interfaced directly into your gulp task as part of your normal SASS compilation.

The module requires a ```.json``` file to complete; the contents of which are injected in to the files and subsequently available

Personally I'm a fan of ```gulp-load-plugins``` to do the heavy lifting of creating your package varialbes, but for verbosities sake, the below examples define these manually

```javascript
var jsonSass = require('gulp-json-sass'),
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    sass = require('gulp-ruby-sass');

gulp.task('sass', function() {
  return gulp
    .src(['./external.json', '/path/to/your/base/sass/file.scss'])
    .pipe(jsonSass({
      sass: false
    }))
    .pipe(concat('output.sass'))
    .pipe(sass())
    .pipe(gulp.dest('dest/'));
});

```
This will build a new _.css_ file named output to the _dest_ folder. So assuming you also had the following:

In the root of your project a file ```external.json```
```javascript
{
  "best-olympics": "London",
  "array-to-list": [ "gold", "silver", "bronze" ],
  "second": {
    "best": "Rio"
  }
}
```
<<<<<<< HEAD
... and where ever you store you main SASS library, a file ```file.scss```
=======
... and where ever you store you main SASS library.
>>>>>>> f25e1210aa7639a69884c7b5f9f6b40eebef2f19
```sass
@each $item in $array-to-list {
  .medal--#{$item} {
    content: '#{$item}';
  }
}

div.heading { content: $best-olympics; }
div.subheading { content: $second-best; }
```
**Note** the injected code is inserted at the very top of this document.

This will result in the below CSS being generated
```css
.medal--gold { content: 'gold'; }
.medal--silver { content: 'silver'; }
.medal--bronze { content: 'bronze'; }
div.heading { content: 'London'; }
div.subheading { content: 'Rio'; }
```
