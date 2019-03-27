## 沙箱常见攻击行为防范

### 概述

> 对于安全本身来说，就是道高一尺魔高一丈的博弈，没有百分百的安全，所以我们要做的就是把风险降低到可控范围内。[vm2](https://github.com/patriksimek/vm2)是个很好的库，已经帮我们做了很多工作，比如隔离对原生进程对象的访问/while死循环免疫等。

所以以下内容是来自实际业务实践中，针对vm2未能解决的问题，我们做的防范。 

其实所有的攻击手段最终产生的结果，大概分成几类：

* 耗CPU;
* 内存泄露；
* 服务器目录攻击。

### 一、耗CPU类的防范思路

#### 死循环或计算耗时类函数

在不可信的代码中，死循环是我们必然要面对的，也是产生耗CPU的首大恶人，所以需要尽量去避免死循环对系统稳定性的影响。

除了死循环，还有一些需要大量耗时计算的函数操作，也会给CPU带来比较大的负担，。

在死循环的case里其实又分为：同步死循环和异步死循环；

* 同步死循环函数

```js
console.log('start loop =====>');
while(true) {}
return 111;
```

因为底层使用的是[VM2](https://github.com/patriksimek/vm2)，VM2本身就带了while免疫的特性，针对这种同步执行的代码片段，只需要给VM2设置超时时间，即可在超时后自动抛错。带来的影响不大。

* 异步死循环函数

```js
const { VM } = require('vm2');
const vm = new VM({
    sandbox: {
        console,
    },
    timeout: 2000,
});
setTimeout(() => {
    console.log('setTimeout'); // 永远执行不到
}, 1000);
(async () => {
    const asyncLoopFunc = `
      (async () => {
          Promise.resolve().then(() => {
              console.log('start loop ====>');
              while(true) {

              }
          });
          return 111;
      })();
    `;
    let ret;
    try {
        ret = await vm.run(asyncLoopFunc);
    } catch (e) {
        console.log('e========>', e);
    }
    console.log('ret======>', ret);
});
```

相比来说，异步死循环是我们需要重点去做防范的，因为VM2无免疫。如上case、会发生的结果是啥呢？最后一行的console永远不会打出来，且一直在死循环当中。

```js
start loop======>
```

这时可能很容易想到说，加一个setTimeout来处理超时的执行，但是你会发现实际情况是无效的（这个问题在safeify中也存在）。原因是啥呢？

因为在Event Loop的任务队列中，又分为macro-task(宏任务)和micro-task(微任务)。

* macro-task(宏任务)：setTimeout、setInterval、setImmediate、I/O等；
* micro-task(微任务)：process.nextTick，原生Promise, MutationObserver等；

结论是：微任务会先被执行，所以setTimeout永远是在Promise回调完成后才能执行的。所以如果你在子线程去加setTimeout其实是没有意义的。

所以正确的方式应该在主进程来设置子进程的超时

#### 内存泄露类的防范思路

> 一开始跟safeify一样考虑，觉得得对worker进程做限制，linux下常见用于内存CPU限制的方式是用cgroup，但是实际中发现，其实很难去界定说，限制多少比例数值才是合理的？其实限制多少都不合适！都会对机器资源造成闲置浪费。

所以综上考虑，在1.0.0正式版本中，在我们的沙箱中，删除了默认带上的cgroup模块，如果开发者确实需要可自己扩展进去。

既然不做程序上的限制，做一些措施让风险可控那么是不是就可以了？

所以针对这类case，我们的做法大致是：

* 日志监控；
* 限制require三方库；
  允许的三方库越多，那么带来的风险就越大；
* 对于可能会造成内存泄露的函数需求提供官方微服务，如：文件上传/下载/解压压缩/等

#### 服务器目录攻击

> 这类case主要在于如果对function开放node内部原生模块，比如fs操作等可以对文件及目录做增删危险操作都需要限制。

所以沙箱的限制虽然会很多，但是我们会提供一套官方Baas SDK，把常用操作及微服务通过官方SDK提供，以最大限制提升安全性。