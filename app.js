var express = require('express');

var server = express();

server.use('/app', express.static(__dirname + '/app'));
server.use(express.static(__dirname + '/app'));

server.use('/assets', express.static(__dirname + '/assets'));
server.use(express.static(__dirname + '/assets'));

server.listen(3000);