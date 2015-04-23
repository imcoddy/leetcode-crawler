var async = require('async');
var superagent = require('superagent');
var cheerio = require('cheerio');
var url = require('url');
var fs = require('fs');

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
                    if ($('#tags')) {
                        $('#tags').next().find('a').each(function(i, e) {
                            result.tags.push($(e).text());
                        });
                        // remove tags from problem content. dirty trick but works
                        $('#tags').next().remove();
                        $('#tags').remove();
                    }
                    result.content = $(".question-content").text();
                    var code = $('#ajaxform .row .col-md-12').attr('ng-init');
                    code = code.substring(5, code.length - 9);
                    result.code = eval(code);
                    saveProblem(result);
                    callback(null, result);
                });
        };

        problemUrls = problemUrls.slice(0, 3); // TODO use for test. comment out this line
        async.mapLimit(problemUrls, 3, function(url, callback) {
            fetchUrl(url, callback);
        }, function(err, result) {
            console.log('Crawling finished.');
        });
    });


function saveProblem(result) {
    var url = result.href.split('/');
    var filename = url[4];
    var wstream = fs.createWriteStream('/tmp/test/' + filename + '.js');
    result.content = result.content.trim().replace(/(?:\r\n|\r|\n)/g, '\n * ').trim();
    var code = result.code[5].defaultCode.replace(/(?:\r\n|\r|\n)/g, '\n').trim();
    wstream.write('/**\n');
    wstream.write(' * Source:  ' + result.href + '\n');
    wstream.write(' * Updated: ' +new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + '\n');
    wstream.write(' * Title:   ' + result.title + '\n');
    wstream.write(' * Auther:  @imcoddy\n');
    wstream.write(' * Tags:    [' + result.tags + ']\n');
    wstream.write(' * Content: ' + result.content + '\n');
    wstream.write(' */\n');
    wstream.write('\n');
    wstream.write('' + code + '\n');
    wstream.end();
}
