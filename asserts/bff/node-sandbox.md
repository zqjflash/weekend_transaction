## node-sandbox沙箱

> 一个进程隔离的NodeJS沙箱

当我们说沙箱的时候，其实我们要防护些什么？

[沙箱常见攻击行为防范](/asserts/bff/sandbox-attack.md)

### 1. 为什么没直接用safeify？

首先safeify给进程隔离的方案，提供一个很好的示例。

但是我们期望的进程隔离沙箱是能完全独立执行的，且能具备独立的通用服务能力（可在下方整体结构图中看到）。safeify版本的设计，沙箱的服务能力必须要通过IPC通信访问到master进程去调master上注入的API能力。那么实际上这个与我们的初衷是背离的，沙箱函数调用的执行发生在了master进程上了，这样子的沙箱不够独立。

举几个例子，比如：

* 不能自定义wrapCode；
* 无法直接在worker进程初始化一些通用服务，也包括无法自定义worker;
* 进程管理不健壮；
* 缺少单测。

所以node-sandbox期望做的事就是能补充这些我们比较care的点。

### 2. 安装

```js
$ npm i node-vm2-sandbox --save
```

### 3. 接入Egg应用后的完整结构

![接入egg应用后的完整结构图](/asserts/node-vm2-sandbox.png)

### 4. 用法

> 初始化参数说明

```js
logger: console, // logger组件
scriptClass: Script, // 可传递自定义Script
timeout: 2000, // 默认超时2s
workers: 2, //默认2个
workerArgs: [{ workerFile: '/worker' }], // 子进程初始化参数，可指定自定义worker文件，以及传递额外初始化参数给worker
```

#### 4.1 普通用法

```js
const { Sandbox, Script } = require('node-vm2-sandbox');
const sandbox = new Sandbox({
    workers: 2
});

const context = { a: 1, b: 2, c: { d: 3} };
const ret = await sandbox.run('return a + b + c.d', context);

// or
const script = new Script({
  requireEnable: true, // 开启require，默认是不支持require的
  libs: [ 'co' ], // 开启require后，必须要指定可以require到哪些模块
  snippet: `
  const plus = (a, b) => {
      return new Promise(resolve => {
        resolve(a + b);
      });
  }
  x.y = await plus(a, b);
  `,
  wrapCode(presets, snippet) {
      snippet = [ ...presets, snippet ].join(';');
      return `
        (async () => {
            const x = {};
            ${snippet}
            return x;
        })();
      `;
  },
  context,
});
const ret2 = await sandbox.run(script);
```

#### 4.2 扩展worker

> 沙箱允许三方去扩展worker，并在worker上往vm的context里注入一些自定义服务，可结合egg plugin来实现一些自定义的功能。

```js
// lib/worker.js
const { Worker, Sandbox } = require('sandbox');
class CustomWorker extends Worker {
    async init() {
        const baseDir = this.options.baseDir;
        // ...
        this.ready(true);
    }
    injectVmContext(vmContext, script) {
        super.injectVmContext(vmContext, script);
        // 往vmContext插入自定义内容，供代码片段调用使用
        return vmContext;
    }
}
// 创建沙箱实例时候指定自定义的Worker Class
const sandbox = new Sandbox({
    workerArgs: [{
        baseDir: app.baseDir,
        workerFile: path.join(__dirname, './lib/worker');
    }],
});
```

#### 4.3 如何给worker传递一些初始化参数

workerArgs用于指定子进程初始化参数，可指定自定义worker文件，以及传递额外初始化参数给worker。

```js
// 指定初始化参数
{
    workerArgs: [{
      baseDir: app.baseDir,
      workerFile: path.join(__dirname, './lib/worker'),
    }],
}

// worker里如何获取
// 通过this.options获取
class CustomWorker extends Worker {
    async init() {
        const baseDir = this.options.baseDir;
        // ...
        this.ready(true);
    }
}
```

#### 4.4 扩展script

> 沙箱允许三方去扩展script，并在script上添加一些额外参数，传递给worker。

```js
const {Script, Sandbox } = require('sandbox');
class CustomScript extends Script {
    constructor(opts) {
        super(opts);
        assert(opts.request, 'options.request is required');
    }
    toJSON() {
        const json = super.toJSON();
        const request = utils.toJsonRequest(thisoptions.request);
        return {
            ...json,
            request,
        };
    }
}
const sandbox = new Sandbox({
  scriptClass: CustomScript, // 设置自定义Script Class
  ...
});
```

### 5. 如何结合egg plugin来完成三方定制需求

#### 5.1 Benchmark Test

> 我们也比较关心对于沙箱进程隔离后的性能损耗到底如何，所以做了几个benchmark test

```js
// 简单四则运算
四则运算#原生 x 115,176 ops/sec ±109.39% (22 runs sampled)
四则运算#vm#无隔离 x 6,111 ops/sec ±5.71% (69 runs sampled)
四则运算#vm#进程隔离 x 775 ops/sec ±1.03% (80 runs sampled)

// 简单函数调用
函数调用#原生 x 237,114 ops/sec ±37.30% (15 runs sampled)
函数调用#vm#无隔离 x 6,811 ops/sec ±2.80% (75 runs sampled)
函数调用#vm#进程隔离 x 721 ops/sec ±1.11% (75 runs sampled)

// 耗时函数调用
耗时函数#5ms#原生 x 164 ops/sec ±0.91% (79 runs sampled)
耗时函数#5ms#vm#无隔离 x 158 ops/sec ±1.35% (74 runs sampled)
耗时函数#5ms#vm#进程隔离 x 123 ops/sec ±1.32% (74 runs sampled)

耗时函数#10ms#原生 x 84.43 ops/sec ±1.07% (76 runs sampled)
耗时函数#10ms#vm#无隔离 x 83.47 ops/sec ±0.91% (76 runs sampled)
耗时函数#10ms#vm#进程隔离 x 70.03 ops/sec ±1.24% (70 runs sampled)

耗时函数#20ms#原生 x 44.50 ops/sec ±0.96% (69 runs sampled)
耗时函数#20ms#vm#无隔离 x 43.59 ops/sec ±1.15% (67 runs sampled)
耗时函数#20ms#vm#进程隔离 x 38.50 ops/sec ±1.22% (61 runs sampled)

耗时函数#30ms#原生 x 30.34 ops/sec ±0.87% (69 runs sampled)
耗时函数#30ms#vm#无隔离 x 30.31 ops/sec ±0.89% (70 runs sampled)
耗时函数#30ms#vm#进程隔离 x 28.15 ops/sec ±1.16% (66 runs sampled)

耗时函数#40ms#原生 x 23.24 ops/sec ±0.82% (56 runs sampled)
耗时函数#40ms#vm#无隔离 x 23.03 ops/sec ±0.86% (56 runs sampled)
耗时函数#40ms#vm#进程隔离 x 22.06 ops/sec ±0.76% (54 runs sampled)

耗时函数#50ms#原生 x 18.87 ops/sec ±0.78% (79 runs sampled)
耗时函数#50ms#vm#无隔离 x 18.76 ops/sec ±0.71% (55 runs sampled)
耗时函数#50ms#vm#进程隔离 x 17.91 ops/sec ±0.70% (80 runs sampled)

耗时函数#70ms#原生 x 13.80 ops/sec ±0.62% (65 runs sampled)
耗时函数#70ms#vm#无隔离 x 13.78 ops/sec ±0.60% (65 runs sampled)
耗时函数#70ms#vm#进程隔离 x 13.10 ops/sec ±0.72% (62 runs sampled)

耗时函数#100ms#原生 x 9.66 ops/sec ±0.52% (48 runs sampled)
耗时函数#100ms#vm#无隔离 x 9.66 ops/sec ±0.49% (48 runs sampled)
耗时函数#100ms#vm#进程隔离 x 9.44 ops/sec ±0.54% (47 runs sampled)

耗时函数#200ms#原生 x 4.92 ops/sec ±0.36% (28 runs sampled)
耗时函数#200ms#vm#无隔离 x 4.91 ops/sec ±0.39% (28 runs sampled)
耗时函数#200ms#vm#进程隔离 x 4.86 ops/sec ±0.38% (28 runs sampled)

耗时函数#500ms#原生 x 1.99 ops/sec ±0.22% (14 runs sampled)
耗时函数#500ms#vm#无隔离 x 1.99 ops/sec ±0.22% (14 runs sampled)
耗时函数#500ms#vm#进程隔离 x 1.98 ops/sec ±0.22% (14 runs sampled)
```

从上可看出来，进程隔离后，对于简单不算耗时的运算，对于简单不算耗时的运算，在沙箱中运行始终比原生环境慢很多。

但是对于存在耗时调用的场景，性能上其实差别不大（瓶颈主要在于被调用函数耗时），对于沙箱库自身带来的消耗几乎可以忽略。

实际也做了统计，一次通信消耗可能在1～2ms左右。如果特别介意通信消耗，可通过扩展worker的方式，直接在worker上向vmContext注入接口，这样可避免依赖IPC通信调用API。