## Serverless平台架构

### 一、平台整体链路

![整体架构图](/asserts/BFF-struct3-new.png)

[整体架构介绍](/2019-03-W3.md)

### 二、应用分层结构

![应用分层结构](/asserts/bff-application.png)

* 图中承载API Gateway的应用为work-platform，线上共部署了2台机器，预发部署了1台；
* 承载API Service的应用为api-service-center，线上共部署了4台机器，预发部署了4台；
* [BaaS SDK](/asserts/bff/baas_sdk_api.md)

### 三、调用链路

![调用链路时序图](/asserts/invoke-link.png)

### 四、沙箱部分

[沙箱部分](/asserts/node-sandbox.md)