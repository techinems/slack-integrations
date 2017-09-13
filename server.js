var express = require('express');
var app = express();
var http = require('http')
var info = require('./var.js');
var request = require('request')
var slack = require('express-slack');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// the path for OAuth, slash commands, and event callbacks
app.use('/slack', slack({
  scope: info.scope,
  token: info.token,
  store: 'data.json',
  client_id: info.client_id,
  client_secret: info.client_secret
}));

var now = new Date();
var pretty = [
  now.getFullYear(),
  '-',
  now.getMonth() + 1 < 10 ? "0" + (now.getMonth() + 1) : (now.getMonth() + 1),
  '-',
  now.getDate(),
  ' ',
  now.getHours(),
  ':',
  now.getMinutes(),
  ':',
  now.getSeconds()
].join('');

let message = {
  unfurl_links: true,
  channel: 'C71B0PRDW',
  token: info.token,
  "text": "RPI Ambulance - call at " + pretty + "!",
  "attachments": [
    {
      "text": "Are you responding?",
      "fallback": "No",
      "callback_id": "responding",
      "color": "#3AA3E3",
      "attachment_type": "default",
      "actions": [
        {
          "name": "status",
          "text": "Yes",
          "style": "danger",
          "type": "button",
          "value": "yes"
        },
        {
          "name": "status",
          "text": "No",
          "type": "button",
          "value": "no"
        }
      ]
    }
  ]
};

// send message to any Slack endpoint
slack.send('chat.postMessage', message);

app.post("/slack_response", function(req, res) {
  // console.log(req.body.payload);
  var strReq= req.body.payload.toString();
  // console.log(strReq);
  var strReq = JSON.parse(strReq);
  // console.log(strReq.user);
  // console.log(strReq.actions[0].value);
  if (strReq.actions[0].value == "yes") {
    var postThis = strReq.user.name + " is RESPONDING."
  } else{
    var postThis = strReq.user.name + " is NOT RESPONDING."
  }
  res.status(200).send();
});

app.listen(5939, function () {
  console.log('Server up');
});

app.use(express.static('.'));
