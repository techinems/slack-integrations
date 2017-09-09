var express = require('express');
var app = express();
var http = require('http')
var info = require('./var.js');
var request = require('request')
var slack = require('express-slack');

// the path for OAuth, slash commands, and event callbacks
app.use('/slack', slack({
  scope: info.scope,
  token: info.token,
  store: 'data.json',
  client_id: info.client_id,
  client_secret: info.client_secret
}));

// handle the "/test" slash commands
slack.on('/test', (payload, bot) => {
  bot.reply('works!');
});

app.post('/slack_responding', function (req, res) {
  var token = info.token;
});

app.post('/not_responding', function (req, res) {
  res.send("NOT");
});

app.listen(80, function () {
    console.log('Server up');
});

app.use(express.static('.'));
