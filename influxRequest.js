const Influx = require('influx');
const escape = Influx.escape;

//const client = new Influx.InfluxDB();

function makeSelect(queries) {
    let select = "";
    let count = 0;
    queries.forEach(function (item) {
        count++;
        if (count > 1) {
            select += ", ";
        }
        fd = escape.quoted(item.field);
        dp = item.dpvalue;
        fc = item.function;

        let d = "";

        //dpvalue正则替换
        if (dp) {
            d = dp.replace(/&/g, ` and ${fd}`).replace(/\|/, ` or ${fd}`);
        }
        //function切割
        if (fc) {
            select += `${fc} (${fd} ${d})`;
        }
        else {
            select += `${fd} ${d}`;
        }
    });
    return `SELECT ${select}`;
}

function makeWhere(start, end, tags) {
    //默认存在start，end
    //tags逐个处理
    let count = 0;
    let tags_args = "";
    for (let t in tags) {
        count++;
        if (count > 1) {
            tags_args += " and ";
        }
        tags_args += escape.quoted(t) + " = " + escape.stringLit(tags[t]);
    }
    if (count > 1) {
        tags_args += " and ";
    }
    return ` WHERE ${tags_args} time >= ${escape.stringLit(start)} and time <= ${escape.stringLit(end)}`;
}

function makeGroupByTime(downsample) {
    const tf = downsample.split(`-`);
    time_interval = tf[0];
    fill_policy = tf[1];

    return ` GROUP BY time(${time_interval}) fill(${fill_policy})`
}

function makeLimitOffset(limit, offset) {
    let lo = "";
    if (isFinite(limit)) {
        lo += ` LIMIT ${limit} `;
    }
    if (isFinite(offset)) {
        lo += ` OFFSET ${offset} `;
    }
    return lo;
}

function toInflux(data) {
    iql_select = makeSelect(data.queries);
    iql_where = makeWhere(data.start, data.end, data.tags);
    iql_gbt = makeGroupByTime(data.downsample);
    iql_lo = makeLimitOffset(data.limit, data.offset);
    return iql_select + iql_where + iql_gbt + iql_lo;
}


main = function () {
    const testData = {
        "start": "2013-08-12 23:32:01.232",
        "end": "2015-07-15 08:20:20.100",
        "tags": {
            "room": "201",
            "truck": "浙A12345"
        },
        "limit": 1000,
        "offset": 0,
        "queries": [{
            "field": "level",
            "dpvalue": ">1000&<=1200",
            "function": "MEAN"
        }, {
            "field": "temperature",
            "dpvalue": "<=20"
        }, {
            "field": "velocity",
            "function": "DERIVATIVE"
        }
        ],
        "downsample": "1w-linear"
    };
    console.log(toInflux(testData));
};

main();
