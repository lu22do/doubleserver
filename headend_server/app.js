var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fstream = require('fstream');
var tar = require('tar');
var zlib = require('zlib');
var fs = require('fs');
var zipdir = require('zip-dir');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
app.server = require('http').Server(app);
var io = require('socket.io')(app.server);

var io_clients = [];

io.on('connection', function (socket) {
    console.log('connection from ' + socket.request._query.client);
    io_clients[socket.request._query.client] = socket;

    socket.on('app_start_req', function (data) {
        console.log('app_start_req');
        data.path = 'http://localhost:3000/multiscreen_apps/';
        io_clients['stb_server'].emit('app_start_req', data);
    });

    socket.on('app_stop_req', function (data) {
        console.log('app_stop_req');
        io_clients['stb_server'].emit('app_stop_req', data);
    });
});

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

app.get('/multiscreen_apps/:app', function(req, res) {
    var app = req.params.app;
    console.log('get app =' + app);

    res.writeHead(200, {
        'Content-Type': 'application/zip'
    });

    zipdir('./multiscreen_apps/' + app, function (err, buffer) {
        res.end(buffer);
    });

    // with tar & fstream: 
    // fstream.Reader({ 'path': './stb_app', 'type': 'Directory' }) /* Read the source directory */
    //     .pipe(tar.Pack()) /* Convert the directory to a .tar file */
    //     .pipe(zlib.Gzip()) /* Compress the .tar file */
    //     .pipe(res);
});

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
