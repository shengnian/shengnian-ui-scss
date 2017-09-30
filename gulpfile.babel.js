import gulp from 'gulp'
import del from 'del'
import rename from 'gulp-rename'
import postcss from 'gulp-postcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import sass from 'gulp-sass'


/*
 * Settings
 */
let paths = {
    scss: 'scss',
    css: 'css'
}

function cleanCss(done) {
  console.log(`Delete ${paths.css}`);
  return del([
    paths.css
  ], done)
}

gulp.task(cleanCss);

function scss(done) {
  gulp.src(paths.scss + '/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(paths.css))
    .on('end', () => {
      done();
    })
    .on('error', (err) => {
      done(err)
    })
}
gulp.task(scss);

function css(done) {
  var plugins = [
    autoprefixer({browsers: ['last 2 versions']}),
    cssnano()
  ];
  gulp.src(paths.css + '/*.css')
    .pipe(postcss(plugins))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(paths.css))
    .on('end', () => {
      done();
    })
    .on('error', (err) => {
      done(err)
    })
}

gulp.task(css);

gulp.task('build:css',  gulp.series(
  cleanCss,
  scss,
  css
));