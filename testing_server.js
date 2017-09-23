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

function makeDate(var clean = false) {
  var now = new Date();

  if (clean) {
    return [
      now.getFullYear(),
      now.getMonth() + 1 < 10 ? "0" + (now.getMonth() + 1) : (now.getMonth() + 1),
      now.getDate() + 1 < 10 ? "0" + (now.getDate() + 1) : (now.getDate() + 1),
      now.getHours() < 10 ? "0" + (now.getHours()) : (now.getHours()),
      now.getMinutes() < 10 ? "0" + (now.getMinutes()) : (now.getMinutes()),
      now.getSeconds() < 10 ? "0" + (now.getSeconds()) : (now.getSeconds())
    }.join('');
  } else {
    return [
      now.getFullYear(),
      '-',
      now.getMonth() + 1 < 10 ? "0" + (now.getMonth() + 1) : (now.getMonth() + 1),
      '-',
      now.getDate() + 1 < 10 ? "0" + (now.getDate() + 1) : (now.getDate() + 1),
      ' at ',
      now.getHours() < 10 ? "0" + (now.getHours()) : (now.getHours()),
      ':',
      now.getMinutes() < 10 ? "0" + (now.getMinutes()) : (now.getMinutes()),
      ':',
      now.getSeconds() < 10 ? "0" + (now.getSeconds()) : (now.getSeconds())
    ].join('');
  }
}

app.post('/tmd_slack_notification', function(req, res) {

  if (req.body.verification == info.verification_email) {

    var message = {
      unfurl_links: true,
      channel: 'C71B0PRDW',
      token: info.token,
      "attachments": [
        {
          "text": "RPI Ambulance dispatched at " + makeDate(),
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
              "value": "yes_" + makeDate(true)
            },
            {
              "name": "status",
              "text": "No",
              "type": "button",
              "value": "no_" + makeDate(true)
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
  var strReqarr = strReq.actions[0].value.split("_");

  console.log(strReq);

  var responding = strReqarr[0];
  var ts = strReqarr[1];

  usernameUppercase = strReq.user.name.charAt(0).toUpperCase() + strReq.user.name.slice(1);
  if (responding == "yes") {
    console.log(usernameUppercase + " replied yes");
    var response_message = {
      unfurl_links: true,
      channel: 'C71B0PRDW',
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
      channel: 'C71B0PRDW',
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

text = "";
oldtext = "";

function rpialert() {
  request("http://alert.rpi.edu/data/alert/alerts.xml", function(error, response, body) {
    var json = JSON.parse(parser.toJson(body));

    if (json.rss.channel.item) {
      var item = json.rss.channel.item;
      var title = item.title;
      text = item.description
      var link = item.link

      if (oldtext != text) {
        var message =  {
          unfurl_links: false,
          channel: 'C6WT63HM3',
          token: info.token,
          "text": "RPI ALERT - <!channel>",
          "fallback": "RPI ALERT: " + text,
          "attachments": [
            {
              "fallback": "RPI ALERT: " + text,
              "title": title,
              "text": text + "\nGet more info at " + link,
              "color": "#f00"
            }
          ]
        }
        oldtext = text;
      }

      slack.send('chat.postMessage', message);
    }
  });
}

setInterval(function() {rpialert()}, 10000);
