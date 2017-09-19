var express = require('express');
var app = express();
var http = require('http')
var info = require('./var.js');
var request = require('request')
var slack = require('express-slack');
var parser = require('xml2json');
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

app.post('/whoson', function(req, res) {
  request("https://rpiambulance.com/slack-whoson.php?token=" + info.slash_command_token, function(error, response, body) {
    res.status(200).send(body);
  });
});

app.post('/tmd_slack_notification', function(req, res) {

  var now = new Date();
  var pretty = [
    now.getFullYear(),
    '-',
    now.getMonth() + 1 < 10 ? "0" + (now.getMonth() + 1) : (now.getMonth() + 1),
    '-',
    now.getDate(),
    ' at ',
    now.getHours() < 10 ? "0" + (now.getHours()) : (now.getHours()),
    ':',
    now.getMinutes() < 10 ? "0" + (now.getMinutes()) : (now.getMinutes()),
    ':',
    now.getSeconds() < 10 ? "0" + (now.getSeconds()) : (now.getSeconds())
  ].join('');

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
    console.log(usernameUppercase + " replied yes");
    var response_message = {
      unfurl_links: true,
      channel: 'G6XGMATUP',
      token: info.token,
      "mrkdwn": true,
      "attachments": [
        {
          "fallback": usernameUppercase + " is RESPONDING",
          "text": "*" + usernameUppercase + "*" + " is *RESPONDING*",
          "color": "#7CD197",
          "mrkdwn_in": ["text"]
        }
      ]
    }
  } else {
    console.log(usernameUppercase + " replied no");
    var response_message = {
      unfurl_links: true,
      channel: 'G6XGMATUP',
      token: info.token,
      "mrkdwn": true,
      "attachments": [
        {
          "fallback": usernameUppercase + " is not responding",
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

function rpialert() {
  request("https://ddbruce.com/test/alert.xml", function(error, response, body) {
    console.log(body);
  });
}

rpialert();
