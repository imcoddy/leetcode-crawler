var async = require('async');
var superagent = require('superagent');
var cheerio = require('cheerio');
var url = require('url');
var fs = require('fs');

var baseUrl = 'https://leetcode.com';

var quizList = [];
superagent.get(baseUrl + '/problemset/algorithms/')
    .end(function(err, res) {
        if (err) {
            return console.error(err);
        }
        var $ = cheerio.load(res.text);
        $('#problemList tbody tr').each(function(idx, element) {
            var $url = $(element).find('a');
            var href = url.resolve(baseUrl, $url.attr('href'));
            var level = $(element).children('td').last().text();
            quizList.push({'href': href, 'level': level});
        });

        var processQuiz = function(quiz, callback) {
            superagent.get(quiz.href)
                .end(function(err, res) {
                    if (err) {
                        return console.error(err);
                    }

                    $ = cheerio.load(res.text);
                    var result = {};
                    result.href = quiz.href;
                    result.level = quiz.level || 'Medium';
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

        quizList = quizList.slice(0, 3); // TODO use for test. comment out this line
        async.mapLimit(quizList, 3, function(quiz, callback) {
            processQuiz(quiz, callback);
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
    wstream.write(' * Level:   ' + result.level + '\n');
    wstream.write(' * Content: ' + result.content + '\n');
    wstream.write(' */\n');
    wstream.write('\n');
    wstream.write('' + code + '\n');
    wstream.end();
}
