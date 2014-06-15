$(document).ready(function() {
  $('#connectas-dropdown a').click(function(e) {
    console.log('connect as ' + e.target.id);

    var socket = io.connect('http://localhost:3001?client=' + e.target.id);
    socket.on('connect_ok', function (data) {
      console.log(data);
      $('#status').text('Connected (as ' + e.target.id + ')');
      $('#status').css({color: "#00de00"});

      socket.emit('my other event', { my: 'data' });
    });
  });

});