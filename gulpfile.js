const gulp = require('gulp'); // 引入gulp
const htmlImport = require('gulp-html-import');
const rename = require('gulp-rename'); //重新命名
// 解析html的页面
var uglify = require('gulp-uglify');// 压缩js
var cleanCSS = require('gulp-clean-css');// 压缩css
// var imagemin = require('gulp-imagemin'); // 压缩图片
var htmlmin = require('gulp-htmlmin');   //压缩html
var autoprefixer = require('gulp-autoprefixer'); //css游览器兼容
const connect = require('gulp-connect'); //引入gulp-connect模块 浏览器刷新
var rev = require('gulp-rev') //添加版本号
var babel = require('gulp-babel') // es6编译
var revCollector = require('gulp-rev-collector')
var del = require('del'); //每次构建gulp之前，清除目标文件dist
// const preprocess = require('gulp-preprocess'); // 打包命令对相应环境添加不同参数
//- 路径替换
 
//task()：定义任务
//src():源文件
// pipe():管道流，接通源头文件与目标文件的输出
// dest():输出文件的目的地
// watch():监视文件
 
/**
 * 需要编译代码路径
 */
var srcs = {
    'html': ['./page/*.html', '!./src/components/*.html'],
    "css": ['./page/css/*.css', './page/css/**/*.css'],
    "js": ['./page/js/*.js*','./page/js/**/*.js*'],
    "i18n": ['./page/i18n/**/*.*','./page/i18n/*.*'],
    "img": ['./page/images/*', './page/images/**/*'],
    "icon": ['./page/icons/*', './page/icons/**/*'],
    "vendor": ['./page/vendor/**/*.*','./page/vendor/*.*'],
}
// 编译es6并压缩js
gulp.task('jscompress', function () {
    // 1. 找到文件
    return gulp.src(srcs.js)
      .pipe(babel({presets:['es2015']}))
      // .pipe(preprocess({
      //   context: {
      //     // 此处可接受来自调用命令的 NODE_ENV 参数，默认为 development 开发测试环境
      //     NODE_ENV: process.env.NODE_ENV || 'test',
      //   },
      // }))
      .pipe(uglify())
      .pipe(rev()) //给文件添加hash编码
      .pipe(gulp.dest('dist/js'))
      .pipe(rev.manifest()) //生成rev-mainfest.json文件作为记录
      .pipe(gulp.dest('dist/rev/js/'))
});
gulp.task('i18ncompress', function () {
  // 1. 找到文件
  return gulp.src(srcs.i18n)
    .pipe(gulp.dest('dist/i18n/'))
});

gulp.task('vendorcompress', function () {
  // 1. 找到文件
  return gulp.src(srcs.vendor)
    .pipe(gulp.dest('dist/vendor/'))
});
 
// 编译压缩css并设置浏览器兼容 添加前缀
gulp.task('csscompress', function () {
    // 1. 找到文件
    return gulp.src(srcs.css)
        .pipe(autoprefixer({
            overrideBrowserslist: [
                "Android 4.1",
                "iOS 7.1",
                "Chrome > 31",
                "ff > 31",
                "ie >= 8"
            ],
            grid: true
        }))
        // 2. 压缩文件
        .pipe(cleanCSS())
        .pipe(rev())
        // 3. 另存压缩后的文件
        .pipe(gulp.dest('dist/css'))
      .pipe(rev.manifest())
      .pipe(gulp.dest('dist/rev/css'))
});
 
// 压缩 img
gulp.task('testImagemin', async function () {
    gulp.src(srcs.img)
        // .pipe(await imagemin())
        .pipe(gulp.dest('dist/images'))
});

// 压缩 img
gulp.task('testIconmin', async function () {
  gulp.src(srcs.icon)
      // .pipe(await imagemin())
      .pipe(gulp.dest('dist/icons'))
});
 
// 压缩html 并设置压缩属性
gulp.task('html', () => {
    var options = {
        collapseWhitespace: true,//压缩HTML
        collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
        removeComments: true,//清除HTML注释
        removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        minifyJS: true,//压缩js
        minifyCSS: true//压缩css
    };
    return gulp.src(srcs.html)
      // .pipe(htmlImport('./page/components/'))
      .pipe(rename(
        {
            dirname: ''
        }
      ))
      .pipe(htmlmin(options))
      .pipe(gulp.dest('dist'))
});
// 替换html中的js版本号
gulp.task('revHtml', function () {
    return gulp.src(['dist/rev/**/*.json', 'dist/*.html'])
      .pipe(revCollector())
      .pipe(gulp.dest('dist/'))
});
 
// 解决浏览器缓存
gulp.task('rev', function () {
    return gulp.src(['dist/rev/**/*.json', 'dist/*.html'])
      .pipe(revCollector({
          replaceReved: true, //允许替换, 已经被替换过的文件
          dirReplacements: {
              'css': 'css',
              'js': 'js',
              'json': 'json'
          }
      }))
      .pipe(gulp.dest('dist/'))
});
//监听变化执行任务
gulp.task('watchs', function () { 
    //当匹配任务变化才执行相应任务
    gulp.watch(srcs.html, gulp.series('html', 'rev'));
    gulp.watch(srcs.js, gulp.series('jscompress', 'rev'));
    gulp.watch(srcs.css, gulp.series('csscompress', 'rev'));
    gulp.watch(srcs.i18n, gulp.series('i18ncompress', 'rev'));
    gulp.watch(srcs.i18n, gulp.series('vendorcompress', 'rev'));
    gulp.watch(srcs.img, gulp.series('testImagemin'));
    gulp.watch(srcs.icon, gulp.series('testIconmin'));
    connect.server({
        root: 'dist', //根目录
        port: 9088,
        livereload: true, //自动更新
        host: '0.0.0.0'
    });
})
// 异步清楚dist 以外的文件
gulp.task('clean:dist', function () {
  return del(['dist/**'])
});
// 打包顺序
gulp.task('default', gulp.parallel('testImagemin','testIconmin', 'jscompress', 'i18ncompress', 'csscompress', 'vendorcompress','html'));
 
// build任务
gulp.task('build', gulp.series("clean:dist",
  gulp.series('default',
    gulp.parallel('revHtml')
  )
));
// serve任务
gulp.task('serve', gulp.series('build', 'watchs'));