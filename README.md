# alimns_influx
integrate influx to alimns

## 流程

1. 开启数据库
1. 连接ali-mns消息队列
1. 本地主机获取消息队列数据，写入influx
1. 读数据库

## AliMNS

- 相关API：MQ、MNS范围需要正确

## influx

- async/await的嵌套
- points、series、measurement层级的理解