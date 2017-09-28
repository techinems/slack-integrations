var express = require('express');
var app = express();
var http = require('http')
var info = require('./var.js');
var request = require('request')
var slack = require('express-slack');
var parser = require('xml2json');
const bodyParser = require('body-parser');

// var slack_channel = 'C71B0PRDW'; //#development_scratch
var slack_channel = 'G6XGMATUP'; //#responding

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

function timenow(){
    var now= new Date(),
    h= now.getHours(),
    m= now.getMinutes(),
    s= now.getSeconds();

    if(m<10) m= '0'+m;
    if(s<10) s= '0'+s;
    return h + ':' + m + ':' + s;
}

function makeDate() {
  var now = new Date();
  return [
    now.getFullYear(),
    '-',
    now.getMonth() + 1 < 10 ? "0" + (now.getMonth() + 1) : (now.getMonth() + 1),
    '-',
    now.getDate() < 10 ? "0" + (now.getDate()) : (now.getDate()),
    ' at ',
    now.getHours() < 10 ? "0" + (now.getHours()) : (now.getHours()),
    ':',
    now.getMinutes() < 10 ? "0" + (now.getMinutes()) : (now.getMinutes()),
    ':',
    now.getSeconds() < 10 ? "0" + (now.getSeconds()) : (now.getSeconds())
  ].join('');
}

app.post('/tmd_slack_notification', function(req, res) {

  if (req.body.verification == info.verification_email) {

    if(timenow() > '05:55:00' && timenow() < '18:05:00'){

    var message = {
      unfurl_links: true,
      channel: slack_channel,
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
  }

  else{

    var message = {
      unfurl_links: true,
      channel: slack_channel,
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
              "value": "Night crew call. No response in needed.",
              "short": true
            }
          ]
        }
      ]
    };

  }


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

  var maxElapsedTime = 12; //minutes to allow responses
  maxElapsedTime *= 60 * 1000

  var messageTime = new Date(strReq.message_ts * 1000);
  var actionTime = new Date(strReq.action_ts * 1000);

  if ((actionTime - messageTime) < maxElapsedTime) {
    userID = strReq.user.id;

    request.post({url:'https://slack.com/api/users.info', form: {token:info.token,user:userID}}, function(error, response, body){
      var userinfo = response.body.toString();
      var userinfo = JSON.parse(userinfo);

      abbrname = userinfo.user.profile.first_name.charAt(0).toUpperCase() + ". " + userinfo.user.profile.last_name;

      var usernameUppercase = strReq.user.name.charAt(0).toUpperCase() + strReq.user.name.slice(1);
      if (strReq.actions[0].value == "yes") {
        console.log(abbrname + " replied yes");
        var response_message = {
          unfurl_links: true,
          channel: slack_channel,
          token: info.token,
          "mrkdwn": true,
          "attachments": [
            {
              "fallback": abbrname + " is RESPONDING",
              "text": "*" + abbrname + "*" + " is *RESPONDING*",
              "color": "#7CD197",
              "mrkdwn_in": ["text"]
            }
          ]
        }
      } else {
        console.log(abbrname + " replied no");
        var response_message = {
          unfurl_links: true,
          channel: slack_channel,
          token: info.token,
          "mrkdwn": true,
          "attachments": [
            {
              "fallback": abbrname + " is not responding",
              "text": abbrname + " is NOT RESPONDING"
            }
          ]
        }
      }
      res.status(200).send();
      slack.send('chat.postMessage', response_message);
    });

  } else {
    var response_message = {
      channel: slack_channel,
      token: info.token,
      user: userID,
      as_user: true,
      text: "Sorry, your response was logged too long after the dispatch went out."
    }
    res.status(200).send();
    slack.send('chat.postEphemeral', response_message)
  }

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
