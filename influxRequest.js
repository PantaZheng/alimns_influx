const Influx = require('influx');
const escape = Influx.escape;

//const client = new Influx.InfluxDB();

/*
    queries默认`select *`
 */
function makeSelect(queries) {
    let select = ``;
    queries.forEach(function (item, index) {
        const fd = escape.quoted(item.field);
        const dp = item.dpvalue;
        const fc = item.function;

        select += index > 0 ? `, ` : ``;//添加",";
        let d = dp === void 0 ? `` : dp.replace(/&/g, ` and ${fd} `).replace(/\|/, ` or ${fd} `);//dp判存、正则替换
        select += fc === void 0 ? `${fd} ${d}` : `${fc}(${fd}${d})`;
    });//function判存

    if (queries.length) {
        return `SELECT ${select}`;
    } else {
        return `SELECT *`;
    }
}

/*
start必须存在,如不存在自动设置now()-1d
end自动补足now();

 */
function makeWhere(start, end, tags) {
    //时间处理
    const start_time = start === void 0 ? `now() - 1d` : `${escape.stringLit(start)}`;
    const end_time = end === void 0 ? `now()` : `${escape.stringLit(end)}`;

    //tags逐个处理
    let count = 0;
    let tags_args = "";
    for (let t in tags) {
        tags_args += count > 0 ? " and " : "";
        tags_args += escape.quoted(t) + " = " + escape.stringLit(tags[t]);
        count++;
    }

    tags_args += count > 0 ? " and " : "";//是否存在tags
    return ` WHERE ${tags_args} time >= ${start_time} and time <= ${end_time}`;
}

/*
downsample缺省为`1w-linear`
- fill policy可缺省
*/
function makeGroupByTime(downsample) {
    const time_fill = downsample === void 0 ? `1w-linear` : downsample;
    const tf = time_fill.split(`-`);
    if (tf.length > 1) {
        return ` GROUP BY time(${tf[0]}) fill(${tf[1]})`;
    }
    else {
        return ` GROUP BY time(${tf[0]})`;
    }
}

/*
limit缺省为100
offset缺省为0
 */
function makeLimitOffset(limit, offset) {
    const li = isFinite(limit) ? limit : 100;
    const of = isFinite(offset) ? offset : 0;
    return ` LIMIT ${li} OFFSET ${of}`;
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
