var socket  = require( './node_modules/socket.io' );
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = [];
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();

app.use(express.static('public'));
app.use('/css',express.static(__dirname + '/public/css'));
app.use('/font',express.static(__dirname + '/public/font'));
app.use('/js',express.static(__dirname + '/public/js'));
/*
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js',express.static(path.join(__dirname, 'public/js')));
app.use('/font',express.static(path.join(__dirname, 'public/font')));
app.use('/css',express.static(path.join(__dirname, 'public/css')));
*/
io.on('connection', function(socket){
	socket.on('newuser', function(data,status){
		var userExist = users.filter(function(item) { return item.nickname === data.nickname; });
	  	if(userExist.length > 0){
	  		status({status:false});
	  	} else{
	  		socket.nickname = data.nickname;
	  		var obj = {
	  			nickname: data.nickname,
	  			socketid: socket.id,
	  			emailhash: data.emailhash
	  		};
	  		users.push(obj);
	  		status({status:true});
	  		emitusers();
	  	}
	});

	socket.on('sendmessage',function(data){
		io.to(data.receiver).emit('receivemessage', {sender:socket.id,nickname:socket.nickname,message:data.message});
	});

	socket.on('disconnect', function(){
	    users = users.filter(function(item) { return item.nickname !== socket.nickname; });
	    emitusers();
	});

	function emitusers(){
		setTimeout(function(){
			io.emit('users',users);
		}, 1000);
	}
});


http.listen(appEnv.port, appEnv.bind, function() {
    console.log("server starting on " + appEnv.url)
})