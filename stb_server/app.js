var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var fs = require('fs');
var unzip = require('unzip');
var zlib = require('zlib');

var app = express();
app.server = require('http').Server(app);
var io = require('socket.io')(app.server);

io.sockets.on('connection', function (socket) {
  socket.emit('connect_ok', { client: socket.request._query.client });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

var routes = require('./routes/index');
var users = require('./routes/users');


var app_path = path.join(__dirname, 'tmp_app');

function deleteFolderRecursive(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

deleteFolderRecursive(app_path);
fs.mkdirSync(app_path);
process.chdir(app_path);
// fs.symlinkSync(path.join(__dirname, 'node_modules'), path.join(app_path, 'node_modules'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// /// catch 404 and forwarding to error handler
// app.use(function(req, res, next) {
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

// /// error handlers

// // development error handler
// // will print stacktrace
// if (app.get('env') === 'development') {
//     app.use(function(err, req, res, next) {
//         res.status(err.status || 500);
//         res.render('error', {
//             message: err.message,
//             error: err
//         });
//     });
// }

// // production error handler
// // no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//         message: err.message,
//         error: {}
//     });
// });

setTimeout(function() {
    console.log('[STB SERVER] headend_port = ' + app.get('headend_port'));
    request('http://localhost:3000/multiscreen_app.zip').
        pipe(unzip.Extract({path: '.'})).
        on('close', function() {
            console.error('all writes are now complete.');
            var stb_route = require(path.join(app_path, 'routes/stb_app'));
            var sec_scr_route = require(path.join(app_path, 'routes/sec_scr_app'));

            app.use('/stb_app', stb_route);
            app.use('/sec_scr_app', sec_scr_route);
        });

/* with tar 
    request('http://localhost:3000/stb_app.zip').
        pipe(zlib.Gunzip()).
        pipe(tar.Extract({ path: '.'})).
        on('end', function() {
            console.error('all writes are now complete.');
            var app_route = require(path.join(app_path, 'routes/index'));
            app.use('/app', app_route);
        });
*/
/*
    request('http://localhost:' +  app.get('headend_port') + '/stb_app.zip').
        pipe(zlib.createUnzip()).
        pipe(fs.createWriteStream(path.join(__dirname, 'tmp_app')));
*/
/*
    request('http://localhost:' +  app.get('headend_port') + '/stb_app.zip').
        pipe(fs.createWriteStream('stb_app.zip')).
        on('finish', function() {
            console.error('all writes are now complete.');
            fs.createReadStream('path/to/archive.zip').pipe(unzip.Extract({ path: 'output/path' }));
        });
*/
}, 500);

module.exports = app;
