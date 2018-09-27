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
    "dwonsamlpe": "1w-linear"
};

// const  test
// let tags_arg="";
// let schema= testData;
// for(let key in schema.tags) {
//     tags_arg+="\""+key+"\"="+schema.tags[key];g
// }

temp = testData.queries[0].dpvalue.replace(/&/g, " and ").replace(/\|/, " or ");

console.log(temp);
