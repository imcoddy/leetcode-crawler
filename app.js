var async = require('async');
var superagent = require('superagent');
var cheerio = require('cheerio');
var url = require('url');

var baseUrl = 'https://leetcode.com';

var problemUrls = [];
superagent.get(baseUrl + '/problemset/algorithms/')
    .end(function(err, res) {
        if (err) {
            return console.error(err);
        }
        var $ = cheerio.load(res.text);
        $('#problemList tbody a').each(function(idx, element) {
            var $element = $(element);
            var href = url.resolve(baseUrl, $element.attr('href'));
            problemUrls.push(href);
        });

        var fetchUrl = function(url, callback) {
            superagent.get(url)
                .end(function(err, res) {
                    if (err) {
                        return console.error(err);
                    }

                    $ = cheerio.load(res.text);
                    var result = {};
                    result.href = url;
                    result.tags = [];
                    result.title = $(".question-title h3").text();
                    result.content = $(".question-content").text();
                    $('#tags').next().find('a').each(function(i, e) {
                        result.tags.push($(e).text());
                    });
                    var code = $('#ajaxform .row .col-md-12').attr('ng-init');
                    code = code.substring(5,code.length -9);
                    result.code = eval(code);
                    callback(null, result);
                });
        };

        problemUrls = problemUrls.slice(0, 3); // TODO use for test. comment out this line
        async.mapLimit(problemUrls, 3, function(url, callback) {
            fetchUrl(url, callback);
        }, function(err, result) {
            console.log('final:');
            console.log(result);
        });
    });
