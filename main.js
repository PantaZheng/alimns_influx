const Influx = require('influx');
const AliMNS = require("ali-mns");

const client = new Influx.InfluxDB();
const db= "mns_db";

const account = new AliMNS.Account("1930364335263624","LTAIwmspfNydekF4","JwURFPBLqqTDwDJljupwqc5wGU6Gfo");//设置account信息
const mq= new AliMNS.MQ("test",account,"hangzhou");//设置单个消息队列信息

// 创建数据库，非覆盖
let buildDB;
buildDB = async ()=>{
    await client.createDatabase(db);
};

//发送信息到mns
let sendM;
sendM = async (num) => {
    const nowDate = new Date();
    const msg = num.toString()+" hello alimns "+ nowDate.toLocaleString();
    await mq.sendP(msg);
};

// 接收信息并存储消息队列中消息到数据库
let getM;
getM = async() => {
    //notify接收数据
    mq.notifyRecv(async(err,msg)=>{
        console.log(msg.Message.MessageBody[0]);
        await client.writePoints([{
            measurement: "ali_mns",
            tag:{num:msg.Message.MessageBody[0]},
            fields: {data: msg.Message.MessageBody}
        }],{database: db});
        return 1;
    },1);

};

let finishAll;
finishAll = async() =>{
    const data = await client.queryRaw( "select * from ali_mns",{database:db});
    //输出表单数
    console.log(data.results[0].series[0].values);
    await mq.notifyStopP();
};

buildDB();
for( i=0;i<5 ;i++) {
    sendM(i);
    getM();
}
finishAll();