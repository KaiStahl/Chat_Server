const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
var formidable = require('formidable');
var list_user = {};
let port = process.env.PORT || 3000;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/views/index.html');
});

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/image'));
app.use(express.static(__dirname + '/public/music'));
app.use(express.static(__dirname + '/public/video'));

io.sockets.on('connection', function(socket){
    socket.on('username', function(username, callback){
        if(username in list_user)
        {
            callback(false);
        }
        else{
            socket.username = username;
            io.emit('online', ' <i><strong> ' + socket.username + '</strong> joined the chat group </i>');
            list_user[socket.username] = socket;
            updateList();
			console.log(username + ' joined the chat')
        }
    });
    function updateList()
    {
        io.sockets.emit('list_user',Object.keys(list_user));
    }
    socket.on('disconnect', function(username){
        io.emit('online', '<i><strong> ' + socket.username + '</strong> left the chat group </i>');
        if(!socket.username) return;
        delete list_user[socket.username];
        updateList();
    })
    socket.on('chat_message', function(message, callback){
        var msg = message.trim();
        if(msg.substr(0,3) === '*p '){
            msg = msg.substr(3);
            var ind = msg.indexOf(' ');
            var index_s = msg.indexOf('(');
            var index_e = msg.indexOf(')');
            if(ind !== -1)
            {
                if(index_s !== 0)
                {
                    var name = msg.substr(0, ind);
                    var msg = msg.substr(ind+1);
                    if(name in list_user){
                        list_user[name].emit('private', '<strong>' + socket.username + '</strong>: '+msg);
                    }
                    else{
                        callback('User is not existed');
                    }
                }
                else{
                    var list_name = msg.substr(1, index_e - 1);
                    var msg = msg.substr(index_e + 1);
                    var user = [];
                    user = list_name.split(' ');
                    for(i = 0;i<user.length;i++)
                    {
                        if(user[i] in list_user){
                            list_user[user[i]].emit('private', '<strong>' + socket.username + ' sends to: ' +'{ '+user+' }' + '</strong>: '+msg);
                        }
                        else{
                            callback('User is not existed');
                        }
                    }
                }
            }
            else{
                callback('Error: Enter message for private sms');
            }
        }
        else{
            io.emit('chat_message', '<strong>' + socket.username + '</strong>: '+message);
        }
    });
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', {username: socket.username});
    });
});

const server = http.listen(port, function(){
    console.log('port: 3000, Ready!');
});