var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	mongoose = require('mongoose'),
	users = {};

server.listen(8080);

// serve static files
app.use(express.static(__dirname + '/static/'));

// routes
app.get('/', function(req, res) {
	res.sendfile(__dirname + '/static/index.html');
});
app.post('/', function(req, res) {
	res.send('teeheheheheh')
});
app.get('/about', function(req, res) {
	res.send('hi im george')
})
app.get('/anotherpage', function(req, res) {
	res.send('im some other page')
})

mongoose.connect('mongodb://stateofdebate.com/chat', function(err) {
	if (err) {
		console.log(err);
	} else {
		console.log('Connected to mongodb!');
	}
});

var chatSchema = mongoose.Schema({
	nick: String,
	msg: String,
	created: {
		type: Date,
		default: Date.now
	}
});

var Chat = mongoose.model('Message', chatSchema);

io.sockets.on('connection', function(socket) {
	var query = Chat.find({});
	query.sort('-created').limit().exec(function(err, docs) {
		if (err) throw err;
		socket.emit('load old msgs', docs);
	});

	socket.on('new user', function(data, callback) {
		if (data in users) {
			callback(false);
		} else {
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicknames();
		}
	});

	function updateNicknames() {
		io.sockets.emit('usernames', Object.keys(users));
	}

	socket.on('send message', function(data, callback) {
		
		var msg = data.trim();
		//var msg = data();
		console.log('after trimming message is: ' + msg);
		if (msg.substr(0, 3) === '/w ') {
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			if (ind !== -1) {
				var name = msg.substring(0, ind);
				var msg = msg.substring(ind + 1);
				if (name in users) {
					users[name].emit('whisper', {
						msg: msg,
						nick: socket.nickname
					});
					console.log('message sent is: ' + msg);
					console.log('Whisper!');
				} else {
					callback('Error!  Enter a valid user.');
				}
			} else {
				callback('Error!  Please enter a message for your whisper.');
			}
		} else {
			var newMsg = new Chat({
				msg: msg,
				nick: socket.nickname
			});
			newMsg.save(function(err) {
				if (err) throw err;
				io.sockets.emit('new message', {
					msg: msg,
					nick: socket.nickname
				});
			});
		}
	});

	socket.on('disconnect', function(data) {
		if (!socket.nickname) return;
		delete users[socket.nickname];
		updateNicknames();
	});
});