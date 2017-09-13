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
  now.getHours() + 1 < 10 ? "0" + (now.getHours() + 1) : (now.getHours() + 1),
  ':',
  now.getMinutes() + 1 < 10 ? "0" + (now.getMinutes() + 1) : (now.getMinutes() + 1),
  ':',
  now.getSeconds() + 1 < 10 ? "0" + (now.getSeconds() + 1) : (now.getSeconds() + 1)
].join('');



app.post('/tmd_slack_notification', function(req, res){
  if (req.body.verification == info.verification_email) {

    var message = {
      unfurl_links: true,
      channel: 'G6XGMATUP',
      token: info.token,
      "attachments": [
        {
            "text": "RPI Ambulance dispatched at " + pretty,
            "fallback": req.body.dispatch,
            "callback_id": "responding",
            "color": "#F35A00",
            "attachment_type": "default",
			"fields": [
                {
                    "title": req.body.dispatch,
                    "value": "Are you responding?",
                    "short": true
                }
            ],
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



    slack.send('chat.postMessage', message);
    res.status(200).send(req.body.dispatch);
  }
  else{
    res.status(401).send();
  }
});

app.post("/slack_response", function(req, res) {
  var strReq = req.body.payload.toString();
  var strReq = JSON.parse(strReq);

  usernameUppercase = strReq.user.name.charAt(0).toUpperCase() + strReq.user.name.slice(1);
  if (strReq.actions[0].value == "yes") {
    console.log("Was yes");
    var response_message = {
      unfurl_links: true,
      channel: 'G6XGMATUP',
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
      channel: 'G6XGMATUP',
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
