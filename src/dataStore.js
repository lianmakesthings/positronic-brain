var nodeCouchDB = require("node-couchdb");
var couch = new nodeCouchDB("192.168.99.100", 5984);

module.exports = {
    save: function (dataPoint) {
        var dbName = "positronic-couch";
        var viewUrl = "_design/list/_view/team_data_by_date";
        var queryOptions = {
            key: [dataPoint.date, dataPoint.team]
        };

        couch.get(dbName, viewUrl, queryOptions, function (err, resData) {
            if (err) { return console.error(err); }

            if (0 === resData.data.rows.length) {
                couch.insert(dbName, dataPoint, function (err, resData) {
                    if (err) { return console.error(err); }
                });
            } else {
                var doc = resData.data.rows[0].value;
                dataPoint._id = doc._id;
                dataPoint._rev = doc._rev;

                couch.update(dbName, dataPoint, function (err, resData) {
                    if (err)
                        return console.error(err);
                });
            }
        });
    },
    saveMatch: function (match) {
        var dbName = "positronic-couch";
        var viewUrl = "_design/list/_view/team_data_by_date";

        couch.insert(dbName, match, function (err, resData) {
            if (err) { return console.error(err); }
        });
    }
};
