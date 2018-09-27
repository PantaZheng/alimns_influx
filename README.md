# alimns_influx

integrate influx to alimns

## Todo

- [x] prototypeTest
- [ ] custom iql api
    - [ ] [still have some issues](#issues)

## custom iql api

### Request body schema: application/json

- `start`
    - `string`
    - 起始查询时间
- `end`
    - `string`
        - Nullable
    - 结束查询时间
- `tags`
    - `object`
        - Nullable
    - tags的条件(目前仅支持`=`, 后期可用room:`<>201`)
- `limit`
    - `integer`
        - Nullable
    - 数据分页
- `offset`
    - `integer`
        - Nullable
- `queries`
    - 查询的Select子句
    - `Array of object`
    - Array数据集
        - `field`
            - `string`
            - 返回的field或tag名
        - `dpValue`
            - `string`
            - 根据提供条件过滤返回数据点，支持`>,<,=,<=,=>,!=`,可使用`&`表示与,`|`表示或
            - 例：`>1000&<=1200`,`<10|>20`
        - `function`
            - `string`
            - 作用于该field的InfluxDB函数，包括聚合函数，选择函数，转换函数，预测函数等
- `downsample`
    - `string`
    - 降采样
        - influxDB中的`GROUP BY time()`格式：
            - `<time interval>-<fill policy>`
            - fill policy: null, linear, none, previous, fixed
            - 例: `1w-linear`, `2d-fixed`

> Note:<br> 2018/9/13 15:33:51<br>我看了influxdb node包，只支持raw query，所以你要把上面的条件转换成select语句，再发给node包的raw query

### testData

```js
const testData = {
    "start": "2013-08-12 23:32:01.232",
    "end": "2015-07-15 08:20:20.100",
    "tags": {
        "room": "201",
        "truck":"浙A12345"
    },
    "limit": 1000,
    "offset": 0,
    "queries":[{
        "field": "level",
        "dpvalue": ">1000&<=1200",
        "function": "MEAN"
    }, {
        "field": "temperature",
        "dpvalue": "<=20"
    }, {
        "field":"velocity",
        "function":"DERIVATIVE"
    }
    ],
    "downsample": "1w-linear"
};
```

### iql参考链接：

<https://docs.influxdata.com/influxdb/v1.6/query_language/data_exploration/>

### 流程思路

1. 获取数据中字段
1. 字段传入对应字段处理函数
1. 相关函数对按照约定进行切分

### functions

#### `makeSelect(data.queries)`

1. 对每个`query`进行处理
    1. `field`加引号
    1. 多query加`,`
    1. `dpvalue`判存，替换字符
    1. `function`判存
1. 缺省处理

#### makeWhere(start,end,tags)

1. 时间处理
    1. 缺省处理
    1. 查询语句单引号处理
1. `tags`处理
    1. `and`添加
    1. 引号处理
1. `where` 语句构造
    1. `and`添加
    1. `time`加入

#### makeGroupByTime(downsample)

1. 缺省处理
1. 字符切分
1. 转化语句

#### makeLimitOffset(limit,offset)

1. 缺省处理
1. 转化语句

### issues

- [x] 单双引号处理
    - Influx.escape函数
- [x] `&` `|`字符替换
    - Reg+replace
- [x] 数字存在与否的判定
     - `isFinite()`
- [x] 参数是否存在的处理
    1. 传入数据的是否存在逻辑未完善
    1. <mark>offset、limit依存问题是否需要处理
- [ ] sql语句注入问题
- [x] 代码压缩

### result for testData

```shell
SELECT MEAN ("level" >1000 and "level"<=1200), "temperature" <=20, DERIVATIVE ("velocity" ) WHERE "room" = '201' and "truck" = '浙A12345' and  time >= '2013-08-12 23:32:01.232' and time <= '2015-07-15 08:20:20.100' GROUP BY time(1w) fill(linear) LIMIT 1000  OFFSET 0
```

---

## prototypeTest

alimns、influx 原型测试

### 流程

1. 开启数据库
1. 连接ali-mns消息队列
1. 本地主机获取消息队列数据，写入influx
1. 读数据库

### AliMNS

- 相关API：MQ、MNS范围需要正确

### influx

- async/await的嵌套
- points、series、measurement层级的理解