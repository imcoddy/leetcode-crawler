var async = require('async');
var superagent = require('superagent');
var cheerio = require('cheerio');
var url = require('url');

var baseUrl = 'https://leetcode.com/';

superagent.get(baseUrl + 'problemset/algorithms/')
.end(function (err, res) {
  if (err) {
    return console.error(err);
  }
  var problemUrls = [];
  var $ = cheerio.load(res.text);
  $('#problemList tbody a').each(function (idx, element) {
    var $element = $(element);
    var href = url.resolve(baseUrl, $element.attr('href'));
    problemUrls.push(href);
  });
});

