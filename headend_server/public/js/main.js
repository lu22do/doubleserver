var reqid = 0;
var running_app_id = -1;

$(document).ready(function() {
    var socket = io.connect('http://localhost:3000?client=headend_web_client');
    
    socket.on('news', function (data) {
        console.log('news ' + data);
    });


    $('#startapp1').click(function() {
        if (running_app_id == -1) {
            running_app_id = reqid++;
            socket.emit('app_start_req', {reqid: running_app_id, name: 'app1'});            
        }
    });

    $('#stopapp1').click(function() {
        if (running_app_id != -1) {
            socket.emit('app_stop_req', {reqid: reqid, name: 'app2'});
            running_app_id = -1;
        }
    });
});