var express = require('express');
var app = express();
var http = require('http')
var info = require('./var.js');
var request = require('request')
var slack = require('express-slack');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
  ' at ',
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
  "text": "RPI Ambulance - call on " + pretty + "!",
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

app.post('/tmd_slack_notification', function(req, res){
  if (req.body.payload.verification == info.verification_email) {
    slack.send('chat.postMessage', message);
    res.status(200).send();
  }
  else{
    res.status(401).send();
  }
});

slack.send('chat.postMessage', message);

app.post("/slack_response", function(req, res) {
  var strReq= req.body.payload.toString();
  var strReq = JSON.parse(strReq);

  usernameUppercase = strReq.user.name.charAt(0).toUpperCase() + strReq.user.name.slice(1);
  if (strReq.actions[0].value == "yes") {
    console.log("Was yes");
    var response_message = {
      unfurl_links: true,
      channel: 'C71B0PRDW',
      token: info.token,
      "mrkdwn": true,
      "attachments": [
       {
           "fallback": "That didn't work.",
            "text": "*" + usernameUppercase + "*" + " is *RESPONDING*",
            "color": "#7CD197",
            "mrkdwn_in": ["text"]
       }
     ]
    }
  } else {
    console.log("Was no");
    var response_message = {
      unfurl_links: true,
      channel: 'C71B0PRDW',
      token: info.token,
      "mrkdwn": true,
      "attachments": [
       {
           "fallback": "That didn't work.",
            "text": usernameUppercase + " is NOT RESPONDING"
        }
     ]
    }
  }

  res.status(200).send();

  slack.send('chat.postMessage', response_message);
});

app.listen(5939, function () {
  console.log('Server up');
});

app.use(express.static('.'));
