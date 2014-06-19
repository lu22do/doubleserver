$(document).ready(function() {
  $('#connectas-dropdown a').click(function(e) {
    console.log('connect as ' + e.target.id);

    $('#status').text('Connecting...');

    var socket = io.connect('?client=' + e.target.id);
    
    socket.on('connect_ok', function (data) {
      console.log('connect_ok ' + data);
      $('#status').text('Connected (as ' + e.target.id + ')');
      $('#status').css({color: "#00de00"});
    });

    socket.on('app_start_req', function (data) {
      console.log('app_start_req ' + data.url);
      $('iframe').attr('src', data.url);
    });

    socket.on('app_stop_req', function (data) {
      console.log('app_stop_req');
      $('iframe').attr('src', '');
    });

  });

});