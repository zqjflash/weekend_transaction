## BaaS SDK API

### 一、概要

* SDK提供以下服务组件
  * rpc
  * cf云函数
  * top
  * oss
  * tair
  * messaging

### 二、SDK初始化

* baas为sdk入口类，需要先通过`new baas`来进行实例化
* 参数：
| 参数 | 类型 | 必填 | 说明 |
| ----- | ----- | ----- | ----- |
| config | Object | N | 全局配置，定义见下方 |

config配置：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
| ----- | ----- | ----- | ----- | ----- |
| appId | String | Y | '' | 应用的唯一ID |
| appKey | String | Y | '' | 应用的授权Key |
| env | String | N | prod | 指定调用服务的环境，可选值有：prod、pre1-8、daily |
| endpoint | String | N | https://xxx.xxx.com | 指定提供服务的host |
| domain | String | N | '' | 指定调用服务的租户标识，当endpoint指定为api server时，必传，否则在调用cf组件时，会找不到应用 |

* 示例：

```js
// 引入sdk
// browser
import baas from 'baas-sdk';
// node
const baas = require('baas-sdk');

// 非云函数环境，如前端应用、平台外的Node应用
// 初始化sdk实例
const sdk = new baas(config);
// 通过sdk实例可以取到默认已经创建好的App实例
const { app } = sdk;
// App实例默认会挂载一份所有服务组件的实例
const { rpc } = app;
const res = await hsf.invoke('interfaceName', 'methodName', params);

// 云函数
// 对于运行在平台上的云函数来说，不需要手动引入SDK和初始化
// 在函数运行上下文已经注入了一个默认的baas实例，可以直接使用
const { app: { rpc } } = this.baas;
const params = [ ... ];
// 云函数暂时不支持async function, 只支持yield
const res = await rpc.invoke('interfaceName', 'methodName', params);

```