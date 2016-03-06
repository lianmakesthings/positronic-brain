var nodeCouchDB = require("node-couchdb");
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var format = require('util').format;
var fs = require('fs');


var couch = new nodeCouchDB("192.168.99.100", 5984);

var linkTemplate = 'http://www.transfermarkt.de/1-bundesliga/marktwerteverein/wettbewerb/L1/plus/?stichtag=%s';

function cartesianProduct(a) { // a = array of array
    var i, j, l, m, a1, o = [];
    if (!a || a.length == 0) return a;

    a1 = a.splice(0,1);
    a = cartesianProduct(a);
    for (i = 0, l = a1[0].length; i < l; i++) {
        if (a && a.length) for (j = 0, m = a.length; j < m; j++)
            o.push([a1[0][i]].concat(a[j]));
        else
            o.push([a1[0][i]]);
    }
    return o;
}

function save(dataPoint) {
    var dbName = "positronic-brain";
    var viewUrl = "_design/team_data/_view/by_date_and_team";
    var queryOptions = {
        key: [dataPoint.date, dataPoint.team]
    };

    couch.get(dbName, viewUrl, queryOptions, function (err, resData) {
        if (err)
            return console.error(err);

        if (0 === resData.data.rows.length) {
            couch.insert(dbName, dataPoint, function (err, resData) {
                if (err)
                    return console.error(err);
            });
        } else {
            var doc = resData.data.rows[0].value;
            dataPoint._id = doc._id;
            dataPoint._rev = doc._rev;

            couch.update(dbName, dataPoint, function (err, resData) {
                if (err)
                    return console.error(err);

                console.dir(resData);
            });
        }
    });
}

var dates = [];

var years = ['2016'];
var months = ['02'];
var days = ['15'];

dates.push.apply(dates, cartesianProduct([years, months, days]));

dates = dates.map(function(el) {
    return el.join('-');
});

async.map(dates, function (date, next) {
    var url = format(linkTemplate, date);
    request(url, function (err, response, body) {
        if (err) throw err;
        var $ = cheerio.load(body);
        $('#yw1 tbody tr').each(function() {
            var el = $(this).find('td').eq(4).find('a');
            var dataPoint = {
                date: date,
                team: el.attr('title'),
                marketValue: parseFloat(el.text().replace(',', '.'), 10),
                league: 1
            };
            save(dataPoint);
        });
        next(null);
    });
}, function (err) {
    if (err) throw err;
});