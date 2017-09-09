var express = require('express');
var app = express();
var http = require('http')



app.post('/slack_responding', function (req, res) {
    res.send("RESP");
});

app.post('/not_responding', function (req, res) {
  res.send("NOT");
});

app.listen(80, function () {
    console.log('Server up');
});

app.use(express.static('.'));
