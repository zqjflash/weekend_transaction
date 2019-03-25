### 一、背景介绍

#### 1.1 什么是BaaS

BaaS-Backend as s Service，将云端的能力进行服务化的封装，屏蔽服务的复杂细节，开发者通过SDK即可快速集成服务能力。

#### 1.2 BaaS能够集成哪些服务？

存储、消息、用户体系、鉴权、云函数、RPC服务、定时任务...

#### 1.3 为什么需要BaaS

* Serverless 约等于 (FaaS + BaaS)

目前基本实现了一套类FaaS（Function as a Service）的服务，开发者不再需要关心服务器相关的运维工作，只关注业务开发。为了进一步推进Serverless研发理念的落地，我们还需要配套的BaaS服务来扩展BFF层函数的能力。

* 前端直接集成中间件服务能力

通过前后端统一的SDK，开发者还能在前端代码中直接集成这些中间件服务能力，无需为此开发额外的BFF接口，进一步提升开发效率。


### 二、BaaS SDK API

### 概要

* SDK提供以下服务组件
  * rpc
  * cf云函数
  * top
  * oss
  * tair
  * messaging

### 2.1 SDK初始化

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

* 框架代码的基本实现

```js
const DEFAULT_APP_NAME = '[baas_app]';
class BaaS {
    constructor(opts) {
        assert(opts.appId, 'options.appId required');
        assert(opts.appKey, 'options.appKey required');
    }

    // 代码省略
    // ...

    this._apps = { // 缓存所有init过的App实例，以appName为Key
        [DEFAULT_APP_NAME]: new App({ ... opt }), // 初始化BaaS时，默认先创建一个实例
    }

    get app() {
        return this._apps[DEFAULT_APP_NAME];
    }
}
```

#### 2.1.1 创建多个App实例

* baas.initApp
可以通过调用sdk实例的initApp方法，生成多个独立的App实例。（比如，生成另一个App实例来调用其他应用的云函数）

| 参数 | 类型 | 必填 | 说明 |
| ----- | ----- | ----- | ----- |
| name | String | N | 实例名称，若不传则会自动生成一个名称，可以通过baas.getApp方法取到指定name的App实例 |
| config | Object | N | 全局配置，默认会extends baas实例的config |

* 返回值
  * Object: baas.App实例

* 示例

```js
// 初始化App实例
const otherBaasApp = baas.initApp('otherApp', otherConfig);

// 通过App实例可以取到默认的服务组件实例，也可以调用createService来进行实例化
// 可以传入不同的配置来生成多个实例，同样的配置只会生成一个实例
// 实例化服务组件时，使用的配置为：App配置+初始化传入的配置
const { oss } = otherBaasApp;
const customOss = otherBaasApp.createService('oss', serviceCfg);

```

* 框架代码实现

```js
// oss.js
class OSSService extends Service {
    async uploadFile(file, option = {}) {
        // ...
        return new Promise(() => {
            this._request({
                // ...
            });
        })
        // ...
    }
}

// app.js
const OSSService = require('./oss.js');
class App {
  constructor(opts) {
    this.opts = opts;
    this._services = {};
  }
  createService(type, name, opts = {}) {
    const supportedServices = {
      // ...
      oss: OSSService,
      // ...
    };
    const TargetService = supportedServices[type];
    // ...
    const service = new TargetService(serviceOpts);
    // ...
    return service;
  }
}

// baas.js
class BaaSSDK {
  // ...
  initApp(name, opts = {}) {
      // ...
      const app = new App({ ...this.opts, ...opts });
      this._apps[name] = app;
      return app;
      // ...
  }
  // ...
}
```

### 2.1.2 获取已经init过的App实例

* baas.getApp
* 参数

| 参数 | 类型 | 必填 | 说明 |
| ----- | ----- | ----- | ----- |
| name | String | N | 若不指定或为空，则返回默认实例(name = '[BAAS_APP]')

* 返回值
  * Object: baas.App实例

* 示例

```js
// 通常，在应用启动阶段初始化App实例
baas.initApp(config);
baas.initApp('otherApp', config);

// 在运行阶段的某个地方，获取已经初始化的App实例
const defaultApp = baas.getApp();
const otherApp = baas.getApp('otherApp');
```

* 框架代码实现

```js
// baas.js
const DEFAULT_APP_NAME = '[BAAS_APP]';
class BaaS {
    // ...
    getApp(name) {
        name = this._ensureAppName(name);
        return this._apps[name];
    }
    // ...
    _ensureAppName(name) {
        if (name === undefined) {
            name = DEFAULT_APP_NAME;
        }
        return name;
    }
}
```

### 2.2 App

#### 2.2.1 创建Service实例

> App默认会挂载一份所有服务组件的实例，一般不需要手动创建

* app.createService(name, config)
* 示例

```js
const anotherTair = app.createService('anotherTairService', config);
const res = await anotherTair.get(key);
```

* 框架代码实现

```js
// service.js
class Service {
    // ...
    async _request(params) {
        // ...
        const res = await axios.request({
            // ...
        });
        // ...
        return res.data;
    }
    // ...
}

// tair.js
const Service = require('./service');
class TairService extends Service {
    async get(key, options = {}) {
        return await this._request({
            url: 'tair/invoke',
        });
    }
}

// app.js
const TairService = require('./tair.js');
class App {
    createService(type, name, opts = {}) {
        name = this._ensureServiceName(name);
        // ...
        const supportedServices = {
            tair: TairService,
        };
        const TargetService = supportedServices[type];
        // ...
        const service = new TargetService(serviceOpts);
        return service;
    }
}
```