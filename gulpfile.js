const fs = require('fs')
const { src, dest } = require('gulp')
const gulp = require('gulp')
const browserSync = require('browser-sync').create()
const gulpFileInclude = require('gulp-file-include')
const del = require('del')
const scss = require('gulp-sass')(require('sass'))
const gulpRename = require('gulp-rename')
const gulpUglifyEs = require('gulp-uglify-es').default
const gulpAutoPrefixer = require('gulp-autoprefixer')
const gulpGroupMediaQueries = require('gulp-group-css-media-queries')
const gulpCleanCss = require('gulp-clean-css')
const gulpImageMin = require('gulp-imagemin')
const gulpWebp = require('gulp-webp')
const gulpWebpHtml = require('gulp-webp-html')
const gulpWebpCss = require('gulp-webp-css')
const gulpSvgSprite = require('gulp-svg-sprite')
const gulpTtf2woff = require('gulp-ttf2woff')
const gulpTtf2woff2 = require('gulp-ttf2woff2')
const gulpFonter = require('gulp-fonter')

const projectPath = 'dist'
const sourcePath = 'src'

const path = {
  build: {
    html: '',
    css: 'css/',
    js: 'js/',
    img: 'img/',
    fonts: 'fonts/'
  },
  src: {
    html: '[^_]*.html',
    css: 'scss/style.scss',
    js: 'js/index.js',
    img: 'img/**/*.{jpg,jpeg,png,svg,gif,ico,webp}',
    fonts: 'fonts/*.ttf'
  },
  watch: {
    html: '**/*.html',
    css: 'scss/**/*.scss',
    js: 'js/**/*.js',
    img: 'img/**/*.{jpg,jpeg,png,svg,gif,ico,webp}'
  },
  clean: `./${projectPath}/`
}

Object.keys(path.build).forEach(key => path.build[key] = `${projectPath}/${path.build[key]}`)
Object.keys(path.src).forEach(key => path.src[key] = `${sourcePath}/${path.src[key]}`)
Object.keys(path.watch).forEach(key => path.watch[key] = `${sourcePath}/${path.watch[key]}`)


function browserSynchronizer () {
  browserSync.init({
    server: {
      baseDir: `./${projectPath}/`
    },
    port: 3000,
    open: false
    // notify: false
  })
}

function html () {
  return src(path.src.html)
    .pipe(gulpFileInclude())
    .pipe(gulpWebpHtml())
    .pipe(dest(path.build.html))
    .pipe(browserSync.stream())
}

function js () {
  return src(path.src.js)
    .pipe(dest(path.build.js))
    .pipe(gulpUglifyEs())
    .pipe(gulpRename({
      extname: '.min.js'
    }))
    .pipe(dest(path.build.js))
    .pipe(browserSync.stream())
}

function css () {
  return src(path.src.css)
    .pipe(scss({
      outputStyle: 'expanded'
    }))
    .pipe(gulpGroupMediaQueries())
    .pipe(gulpAutoPrefixer({
      overrideBrowserslist: ['last 5 versions'],
      cascade: true
    }))
    .pipe(gulpWebpCss())
    .pipe(dest(path.build.css))
    .pipe(gulpCleanCss())
    .pipe(
      gulpRename({
        extname: '.min.css'
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browserSync.stream())
}

function images () {
  return src(path.src.img)
    .pipe(gulpWebp({
      quality: 70
    }))
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(gulpImageMin({
      progressive: true,
      svgoPlugins: [{ removeViewBox: false }],
      interlaced: true,
      optimizationLevel: 3
    }))
    .pipe(dest(path.build.img))
    .pipe(browserSync.stream())
}

function fonts () {
  src(path.src.fonts)
    .pipe(gulpTtf2woff())
    .pipe(dest(path.build.fonts))
  return src(path.src.fonts)
    .pipe(gulpTtf2woff2())
    .pipe(dest(path.build.fonts))


}

gulp.task('svgSprite', function () {
  return src([`${sourcePath}/iconsprite/*.svg`])
    .pipe(gulpSvgSprite({
      mode: {
        stack: {
          sprite: '../icons/icons.svg',
          // example: true
        }
      }
    }))
    .pipe(dest(path.build.img))
})

gulp.task('otf2ttf', function () {
  return src([`${sourcePath}/fonts/*.otf`])
    .pipe(gulpFonter({
      formats: ['ttf']
    }))
    .pipe(dest(`${sourcePath}/fonts/`))
})

function fontsStyle () {
  // const fileContent = fs.readFileSync(sourcePath + '/scss/fonts.scss')
  // if (fileContent !== '') {
  //   return
  // }

  fs.writeFile(sourcePath + '/scss/fonts.scss', '', {}, () => {
    fs.readdir('./'+path.build.fonts, {},(err, items) => {
      console.log(path.build.fonts)
      console.log(err, items)
      if (!items) {
        return
      }
      items.forEach(filename => {
        console.log(filename)
        const [ fontName ] = filename.split('.')
        console.log(fontName)
        fs.appendFile(
          sourcePath + '/scss/fonts.scss',
          `@include font("${fontName}", "${filename}", "400", "regular"`,
          {},
          () => {})
      })
    })
  })

}

function watchFiles () {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.img], images)
}

function clean() {
  return del(path.clean)
}

const build = gulp.series(clean, gulp.parallel(js, css, images, html, fonts))
const watch = gulp.parallel(build, watchFiles, browserSynchronizer)

exports.default = watch
