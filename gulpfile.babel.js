import gulp from 'gulp'
import del from 'del'
import inquirer from 'inquirer'
import fs from 'fs'
import githubApi from 'github'
import glob from 'glob'
import path from 'path'
import streamQueue from 'streamqueue'

// gulp plugins
import clone from 'gulp-clone'
import concat from 'gulp-concat'
import copy from 'gulp-copy'
import foreach from 'gulp-foreach'
import git from 'gulp-git'
import insert from 'gulp-insert'
import print from 'gulp-print'
import prompt from 'gulp-prompt'
import rename from 'gulp-rename'
import replace from 'gulp-replace'
import util from 'gulp-util'


/*
 * Settings
 */
let semantic = {
  url: 'https://github.com/Semantic-Org/Semantic-UI-LESS',
  owner: 'Semantic-Org',
  repo: 'Semantic-UI-LESS',
  tag: undefined
}
let paths = {
  src: {
    root:         'less',
    definitions:  'less/definitions',
    themes:       'less/themes'
  },
  dest: {
    root:       'dist',
    scss:       'dist/scss',
    variables:  'dist/scss/variables'
  }
}

function cleanSrc(done) {
  console.log(`Cleaning ${paths.src.root} directory...`);
  return del([
    paths.src.root
  ], done)
}
gulp.task(cleanSrc);

function cleanDest(done) {
  console.log(`Cleaning ${paths.dest.root} directory...`);
  return del([
    paths.dest.root
  ], done)
}
gulp.task(cleanDest);


// Clean the temporary and build directories
gulp.task('clean', gulp.series(
  cleanSrc,
  cleanDest
));

// Retrieve the desired release of Semantic UI Less
function fetch (done, tag) {
  if ( !tag ) {
    var github = new githubApi({
      debug: false
    });

    determineLatestTag();
  }
  else {
    console.log('Retrieving Semantic UI Less ' + tag + '...');

    cloneRepo(tag);
  }

  // Determine the latest release by tag
  function determineLatestTag() {
    github.repos.getReleases({
      owner:    semantic.owner,
      repo:     semantic.repo,
      per_page: 1
    }, function(error, result) {
      promptForTag(result.data[0].tag_name);
    });
  }

  // Prompt for the tag to fetch defaulting to the latest
  function promptForTag(latestTag) {
    var questions = [
        {
            type:    'input',
            name:    'tag',
            message: 'Which release would you like to fetch?',
            default: latestTag
        }
    ];

    inquirer.prompt(questions).then(answers => {
      cloneRepo(answers.tag)
    });
  }

  // Clone Semantic UI repository
  function cloneRepo(desiredTag) {
    git.clone(semantic.url, {
      args: paths.src.root,
      // cwd:  paths.temp,
      quiet: true
    }, function(error) {
      if (error) throw error;

      semantic.tag = desiredTag;

      checkoutTag(desiredTag);
    });
  }

  // Checkout desired Semantic UI release
  function checkoutTag(desiredTag) {
    git.checkout('tags/' + desiredTag, {
        args: '-q',
        cwd:  paths.src.root,
        quiet: true
    }, function(error) {
        done(error);
        console.log('Done fetching ' + desiredTag);
        if (error) throw error;
    });

    done();
  }
}
gulp.task(fetch);

// Copy assets
function copyAssets (done) {
  console.log('Copy assets');

  gulp.src(`${paths.src.themes}/default/assets/**/*`)
    .pipe(gulp.dest(`${paths.dest.scss}/assets/`))
    .on('end', () => {
        done();
    })
    .on('error', (err) => {
        done(err);
    })
}
gulp.task(copyAssets);

// Convert LESS to SCSS
function convert (done) {
  console.log('Converting LESS to SCSS');
  // Index global variables for reference during the convert
  var globals = {};

  var themes = glob.sync(paths.src.themes + '/*/*/*.variables'),
      stream = new streamQueue({ objectMode: true });

  themes.forEach(function(themeDir) {
    var baseName  = path.basename(themeDir, path.extname(themeDir)),
        extName   = path.extname(themeDir),
        themeName = path.dirname(themeDir).match(/.+\/(.+)\/.+$/)[1];

    // console.log(baseName)
    // console.log(extName)
    // console.log(themeName)
    // var themeName = themeDir.match(/.+\/(.+)\/.+$/)[1];
    // var moduleName = themeDir.match(/.+\/(.+)\/(.+)$/)[2];
    // var defaultDir = themeDir.replace(new RegExp('/' + moduleName, 'g'), '');
    // console.log(moduleName)
    if (baseName === 'site' && extName === '.variables') {
      globals[themeName] = {};
      stream.queue(
        gulp.src(themeDir)
        // We don't want to replace but I didn't find a gulp match plugin for file contents
        // This really should be replaced
        .pipe(replace(/^\s*@(?!font-face\s|import\s|media\s|keyframes\s|-|\{)([\w\d]+?)[\s:]/gmi, function(string, variableName) {
            globals[themeName][variableName] = true;
            return string;
        }))
      );
    }
  });

  // Convert LESS syntax to SCSS syntax
  var sources = [
      paths.src.definitions + '/*/*.less',
      paths.src.themes + '/*/*/*.variables',
      // paths.src.themes + '/*/*/*.overrides'
  ];
  gulp.src(sources, { base: process.cwd() })
    .pipe(foreach(function(stream, file) {
      // console.log(file.relative)
      var baseName  = path.basename(file.relative, path.extname(file.relative)),
          extName   = path.extname(file.relative),
          themeName = path.dirname(file.relative).match(/.+\/(.+)\/.+$/)[1];

      // Definitions are not a theme
      if (themeName == 'definitions') {
          themeName = 'default';
      }

      if (extName == '.less') {

          // Remove @import '../../theme.config'; from definitions
          // stream.pipe(replace(/@import '\.\.\/\.\.\/theme\.config';/g, ''));

          // Remove @import (multiple) '../../theme.config'; from definitions
          // stream.pipe(replace(/@import \(multiple\) '\.\.\/\.\.\/theme\.config';/g, '@import \'../../variables/default\';'));
          stream.pipe(replace(/@import \(multiple\) '\.\.\/\.\.\/theme\.config';/g, ''));

          // Remove below Theme
          /*******************************
                      Theme
          *******************************/
          stream.pipe(replace(/\/\*\*+\s*Theme\s*\*+\//g, ''));


          // Rmove @type    : 'global';
          // Rmove @element : 'site';
          // @type    : 'element';
          // @element : 'icon';
          // https://github.com/sun-zheng-an/gulp-shell/issues/23
          stream.pipe(replace(/@(element\s*|type\s*):\s*'\w*';/g, ''));

          // Remove over 3 blank line
          stream.pipe(replace(/^(\s*\n){2,}/gm, ''))
          // stream.pipe(replace(/^\n{2,}$/gm, ''))

          // Remove .loadUIOverrides(); from definitions
          stream.pipe(replace(/\.loadUIOverrides\(\);/g, ''));

          //  Replace
          // * # Semantic UI - Breadcrumb
          stream.pipe(replace(/Semantic\s+UI/g, 'Shengnian UI'))

          // Replace
          // * http://github.com/semantic-org/semantic-ui/
          stream.pipe(replace(/semantic-org\/semantic-ui\//g, 'shengnian/shengnian-ui'))

      }

      // Redefine globals with prefixed defaults
      if (baseName != 'site' && extName == '.variables' && globals[themeName]) {
          var string = '';
          Object.keys(globals[themeName]).forEach(function(variable) {
              var varFirstChar = variable.substring(0, 1),
                  varRemainder = variable.substring(1, variable.length);

              string += '$' + baseName + varFirstChar.toUpperCase() + varRemainder + ': $' + variable + ';\n';
          });

          stream.pipe(insert.prepend(string));
      }

      // Replace variables (@ with $)
      // Prefix with the filename if not global
      // Uppercase first letter of the match to maintain camelcase
      stream.pipe(replace(/@(?!font-face\s|import\s|media\s|keyframes\s|-)(\{)?([\w\d]{1})([\w\d\-]*)/g, function(string, openingBrace, nameFirstChar, nameRemainder) {
          var replacement  = '$',
              variableName = nameFirstChar + nameRemainder;

          if (openingBrace) {
              replacement += openingBrace;
          }

          // Do not prefix globals
          //if (variableName in globals[themeName] || variableName in globals['default']) {
          if (baseName == 'site') {
              replacement += nameFirstChar;
          }
          else {
              replacement += baseName + nameFirstChar.toUpperCase();
          }

          return replacement + nameRemainder;
      }));

      return stream;
    }))

    // Replace $1px to $_1px
    .pipe(replace(/\$([\d]+)px/g, '\$_$1px'))

    // Replace ', relative);' to ');'
    .pipe(replace(/,\s*relative\);/g, '\);'))

    // Replace mixins
    .pipe(replace(/\.([\w\-]*)\s*\((.*)\)\s*\{/g, '@mixin $1\($2\)\n{'))

    // Remove .loadFonts(); from definitions
    // stream.pipe(replace(/\.loadFonts\(\);/g, ''));

    // Replace when to @if
    .pipe(replace(/@mixin\s*(.*\(\)\s*)\s*when\s*\((\$\w*)\)\s*(\{[\s\S]+\n\}\n.*\);$)/gm, '@if \($2\) \{\n @mixin $1 $3 \n \}'))

    .pipe(replace(/@mixin\s*(.*\(\)\s*)\s*when\s*\((\$\w*)\)\s*(\{[\s\S]+\n\}$)/gm, '@if \($2\) \{\n @mixin $1 $3 \n \}'))

    // Replace includes
    .pipe(replace(/\.([\w\-]*\(.*\)\s*;)/g, '@include $1'))

    // Replace string literals
    .pipe(replace(/~"([^"]*)"/g, '#{"$1"}'))

    // Replace spin with adjust-hue
    .pipe(replace(/spin\(/g, 'adjust-hue('))

    // Remove 14px to 14
    // .pipe(replace(/\$emSize\s*:\s*[\d]+px;/g, '\$emSize      : 14;'))

    //Replace unit(..., ...) with ((n / $emSize) * 1rem;
    // .pipe(replace(/unit\((.*),\s(\w*)\);/g, '$1 \* 1$2;'))

    // Replace unit(..., ...) with string literal
    // .pipe(replace(/unit\((.*),\s(\w*)\);/g, 'strip-units($1) + "$2";'))

    // Replace unit(..., ...) with string literal
    .pipe(replace(/unit\((.*),\s(\w*)\);/g, '#{$1 + "$2"};'))

    // Replace 0em|0rem|0px to 0
    .pipe(replace(/\s+0em|\s+0rem|\s+0px/g, ' 0'))

    // Fix calc() string literals
    // Ruby sass doesn't mind this but libsass will throw a 'invalid operands for multiplication' error
    .pipe(replace(/#{"calc\((.*)\)"}/g, function(string, match) {
        match = match.replace(/"}/g, '" + ');
        match = match.replace(/#{"/g, ' + "');

        return '#{"calc(' + match + ')"}';
    }))

    // Add new lines before opening comments
    // mostly cosmetic but it makes the files much easier to read after concat
    .pipe(replace(/\/\*{2,}/g, '\n\n$&'))

    // Rename less files to scss
    .pipe(rename(function(path) {

    var baseName  = path.basename,
        extName = path.extname;

    if (path.extname == '.less') {
      path.dirname = path.dirname.match(/.+\/(.+)\/(.+)$/)[2];
    } else if (path.extname == '.variables') {
      path.dirname = path.dirname.replace(new RegExp(paths.src.root + '/', 'g'), '');
        // .replace(new RegExp('\/globals', 'g'), '\/variables');
    }

      // path.dirname = path.dirname.replace(new RegExp(paths.src.root + '/', 'g'), '');

      // if (path.extname != '.variables' && path.extname != '.overrides') {
      // }

      // Rename 'site.variables' to '_variables.scss'
      // if (baseName == 'site' && extName == '.variables') {
      //   path.basename = '_variables';
      // } else if (baseName == 'reset' && extName == '.variables') {
      //   path.basename = '_reset_variables';
      // } else {
      path.basename = '_' + path.basename;
      // }

      // if (path.extname == '.less') {
      path.extname = '.scss';
      // }

      return path;
    }))

    .pipe(gulp.dest(paths.dest.scss))
      .on('end', () => {
          done();
      })
      .on('error', (err) => {
          done(err);
      });
}
gulp.task(convert);

// Copy variables to '${paths.dest.scss} + /variables'
function copyVars (done) {
  // var stream = new streamQueue({ objectMode: true })
  // stream.queue(
    gulp.src('functions/*.scss')
      .pipe(gulp.dest(paths.dest.scss));
  // );
  // stream.queue(
    gulp.src(paths.dest.scss + '/themes/default/**/*.scss')
      .pipe(gulp.dest(paths.dest.scss + '/variables/'))
      .on('end', () => {
        done();
      })
      .on('error', (err) => {
        done(err);
      })
  // );

  // done();
}

gulp.task(copyVars);


// Create _variables.scss and append scss module
function buildVars(done) {
  console.log('Converting default variables');
  var defaultThemes = glob.sync(paths.dest.scss + '/themes/default/*/*.scss');
  var streamQ = new streamQueue({ objectMode: true });
  var fileVars = [];
  defaultThemes.forEach(function(themeDir) {
    var moduleName = themeDir.match(/.+\/(.+)\/(.+)$/)[1];
    var varPathName = themeDir.replace(new RegExp('.*' + paths.dest.scss + '/themes/default', 'g'), '\.');
    var outputPath = varPathName.replace(new RegExp('_', 'g'), '').replace(new RegExp('\.scss', 'g'), '');
    if (moduleName == 'globals') {
      fileVars.unshift(outputPath);
    } else {
      fileVars.push(outputPath);
    }
  })

  var fsWrite = fs.createWriteStream(paths.dest.scss + '/variables/_variables.scss', {
    encoding: 'utf8',
    flags: 'a' // 'a' means appending (old data will be preserved)
  });

  for(var i = 0, len = fileVars.length; i < len; i ++) {
    fsWrite.write('@import \'');
    fsWrite.write(fileVars[i]);
    fsWrite.write('\';')
    fsWrite.write('\n');
  }

  gulp.src(paths.dest.scss + '/variables/_variables.scss')
    .pipe(rename(function(path) {
      // var baseName  = path.basename,
          // extName = path.extname;

          path.basename = 'shengnian-ui';
    }))
    .pipe(insert.prepend('@import \'./mixins\';\n'))
    .pipe(insert.prepend('@import \'./functions\';\n'))
    .pipe(insert.prepend('@import \'./variables/variables\';\n'))
    .pipe(gulp.dest(paths.dest.scss))
      .on('end', () => {
          done();
      })
      .on('error', (err) => {
        done(err)
      })
}

gulp.task(buildVars);


function build (done) {
  gulp.series(
    copyAssets,
    convert,
    copyVars,
    buildVars
  )(done);
}

// Build SCSS version of Semantic UI
gulp.task(build);

// Tasks
// Default to perform all tasks in the order required to release a build
function defaultTask(done) {
    gulp.series(
        cleanSrc,
        cleanDest,
        fetch,
        copyAssets,
        convert,
        copyVars,
        buildVars
    )(done)
}

gulp.task('default', defaultTask)
