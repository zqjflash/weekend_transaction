'use strict';

module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  app.get('/module/:moduleName', controller.home.index);
  app.get('/module/:moduleName/*', controller.home.index);

  app.get('/api/home-page', controller.page.getHomePage);
  app.get('/api/app-page/:appName/*', controller.page.getAppPage);
  app.get('/api/app-page/:appName', controller.page.getAppPage);
  app.get('/api/app-page/:appName/*', controller.page.getAppPage);

  app.get(/^\/api\/app\/([^\/]+)\/(.+)$/, app.middleware.appPermissionChecker(), controller.functionApi.handle);
  app.post(/^\/api\/app\/([^\/]+)\/(.+)$/, app.middleware.appPermissionChecker(), controller.functionApi.handle);
  app.put(/^\/api\/app\/([^\/]+)\/(.+)$/, app.middleware.appPermissionChecker(), controller.functionApi.handle);
  app.delete(/^\/api\/app\/([^\/]+)\/(.+)$/, app.middleware.appPermissionChecker(), controller.functionApi.handle);

  app.post('/api/sandbox/run', controller.sandbox.run);
  app.post('/api/app-oss/auth', controller.oss.getAppOssKey);

  app.get('/api/function-api/list', controller.functionApi.getList);
  app.get('/api/function-api/item/:id', controller.functionApi.getItem);
  app.delete('/api/function-api/item/:id', controller.functionApi.del);
  app.post('/api/function-api/item', controller.functionApi.edit);

  // 云函数
  app.post('/api/cf/invoke', controller.cf.invoke);

  // 鉴权
  app.get('/api/permission/check', controller.permission.check);

  // simple bass service
  app.post('/api/redis/invoke', controller.baas.redis);

  // 实时日志控制台
  app.get('/logconsole/index.html', controller.logConsole.index);
  app.get('/logconsole/iframe.html', controller.logConsole.iframe);

  // 实时请求记录
  app.get('/api/logs/queryHttpRequestLogs', controller.slslog.queryHttpRequestLogs);
  app.get('/api/logs/queryTraceLogs', controller.slslog.queryTraceLogs);

  // 日志统计分析
  app.get('/api/logs/analysis/commonQuery', controller.slslogAnalysis.analysis); // 通用查询接口
  app.get('/api/logs/analysis/pvDeail', controller.slslogAnalysis.pvDetail); // http接口调用
  app.get('/api/logs/analysis/trend', controller.slslogAnalysis.trend); // pv/rt/error 趋势图
  app.get('/api/logs/analysis/kpis', controller.slslogAnalysis.kpis); // 某区间内的pv/rt/error 数据及同比数据

  // 发布记录查询及回滚
  app.get('/api/publish/list', controller.publish.queryPublishRecords);
  app.post('/api/publish/rollback', controller.publish.rollback);
};