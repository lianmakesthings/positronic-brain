var marketValueParser = require('./marketValueParser');

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

var dates = [];

var years = ['2016'];
var months = ['02'];
var days = ['15'];

dates.push.apply(dates, cartesianProduct([years, months, days]));

dates = dates.map(function(el) {
    return el.join('-');
});

marketValueParser.run(dates);