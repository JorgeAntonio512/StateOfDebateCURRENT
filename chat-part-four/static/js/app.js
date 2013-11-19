// uncomment this to remove the global scope and console access		
//		jQuery(function($){
var $nickForm = $('#setNick');
var $nickError = $('#nickError');
var $nickBox = $('#nickname');
var $users = $('#users');
var $messageForm = $('#send-message');
var $messageBox = $('#message');
var $chat = $('#chat');



// When the user clicks submit, do these thangs			
$nickForm.submit(function(e) {
	e.preventDefault();
	// get the username from the input box
	var myUsername = $nickBox.val();

	// create a socket and connect to the server
	var socket = io.connect();
	// tell the server that a new user is created
	socket.emit('new user', myUsername, function(data) {
		if (data) {
			$('#nickWrap').hide();
			$('#contentWrap').show();
		} else {
			$nickError.html('That username is already taken!  Try again.');
		}
	});
	// do some set up stuff now that we have a socket and have figured out our own username
	setUpMessageBoxNowThatWeHaveASocket(socket, myUsername);
});

// let's get the messagebox set up

function setUpMessageBoxNowThatWeHaveASocket(socket, myUsername) {

	function displayMsg(data) {	
		// check if the message is from the current user
		var isMessageFromMyself = data.nick === myUsername;
		// set the message to the css class for left or right
		var cssClassForUser;
		if (isMessageFromMyself) {
			cssClassForUser = 'rightMessage';
		} else {
			cssClassForUser = 'leftMessage';
		}
		// add the html message for the user!
		$chat.append('<span class="' + cssClassForUser + '"><b>' + data.nick + ': </b>' + data.msg + "</span><br/><br/>");
		//Append the new content goes here
		//Getting the element's new height now
		var sHeight = $('#chat')[0].scrollHeight;
		//Scrolling the element to the sHeight
		$('#chat').scrollTop(sHeight);

	}

	// when the user clicks the messageFrom submit button
	$messageForm.submit(function(e) {
		e.preventDefault();
		// figure out what the message is by reading from messageBox
		// send the message to the server
		socket.emit('send message', $messageBox.val(), function(data) {
			$chat.append('<span class="error">' + data + "</span><br/>");
		});
		// empty the message box
		$messageBox.val('');
	});

	

// when the server sends usernames, do some thangs
	socket.on('usernames', function(data) {
		var html = '<div class="topOlist">' + myUsername + '</div>';
				
		for (var i = 0; i < data.length; i++) {
			if (data[i] != myUsername) {
				html += '<div class="restOlist">' + data[i] + '</div>';
			}	
		}	
		
		$users.html(html);
	});


	socket.on('load old msgs', function(docs) {
		for (var i = docs.length - 1; i >= 0; i--) {
			displayMsg(docs[i]);
		}
	});

	// when a new message comes in, do this tahng
	socket.on('new message', function(data) {
		displayMsg(data);
	});

	socket.on('whisper', function(data) {
		$chat.append('<span class="whisper"><b>' + data.nick + ': </b>' + data.msg + "</span><br/>");
	});

	$(function() {
		$('.animated').autosize({
			append: "\n"
		});
	});
	

}


// uncomment this to remove the global scope and console access	
//		});	