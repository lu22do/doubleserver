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
var ioclient = require('socket.io-client');

var io_clients = [];

// socket io commands:
// client -> server    connection 
// server -> client    app_start_req(url)
// server -> client    app_stop_req

var headend_socket = ioclient.connect('http://localhost:3000?client=stb_server');
headend_socket.on('app_start_req', function(data) {
    console.log('app_start_req from headend');
    // 1- load multi device app
    load(data.path + data.name, function() {
        // 2- send to devices (stb, second screens)
        io_clients['stb'].emit('app_start_req', {url: 'stb_app'});
        if (io_clients['secscr1']) {
            io_clients['secscr1'].emit('app_start_req', {url: 'sec_scr_app'}); 
        }
        if (io_clients['secscr2']) {
            io_clients['secscr2'].emit('app_start_req', {url: 'sec_scr_app'}); 
        }
        if (io_clients['secscr3']) {
            io_clients['secscr3'].emit('app_start_req', {url: 'sec_scr_app'}); 
        }
    });
});

headend_socket.on('app_stop_req', function(data) {
    console.log('app_stop_req from headend');
    // tell all devices to stop the app
    io_clients['stb'].emit('app_stop_req');
    if (io_clients['secscr1']) {
        io_clients['secscr1'].emit('app_stop_req'); 
    }
    if (io_clients['secscr2']) {
        io_clients['secscr2'].emit('app_stop_req'); 
    }
    if (io_clients['secscr3']) {
        io_clients['secscr3'].emit('app_stop_req'); 
    }
});

io.on('connection', function (socket) {
    console.log('connection from ' + socket.request._query.client);
    io_clients[socket.request._query.client] = socket;

    socket.emit('connect_ok', { client: socket.request._query.client });
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

// setTimeout(load('http://localhost:3000/multiscreen_apps/app1'), 500);


function load(url, cb) {
    console.log('[STB SERVER] headend_port = ' + app.get('headend_port'));

    request(url).
        pipe(unzip.Extract({path: '.'})).
        on('close', function() {
            console.error('app downloaded');

            /* with dynamic route insertion - no way to remove and specify order */
            var stb_route = require(path.join(app_path, 'routes/stb_app'));
            var sec_scr_route = require(path.join(app_path, 'routes/sec_scr_app'));

            app.use('/stb_app', stb_route);
            app.use('/sec_scr_app', sec_scr_route);

            cb();
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
};

module.exports = app;
