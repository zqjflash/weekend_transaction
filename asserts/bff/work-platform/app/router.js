'use strict';

module.exports = app => {
  app.get('/', 'appRouter.getHomePage');
  app.get('/:env', 'appRouter.getHomePage');

  // api route
  app.get(/^\/api\/(.+)$/, 'apiProxy.forward');
  app.put(/^\/api\/(.+)$/, 'apiProxy.forward');
  app.post(/^\/api\/(.+)$/, 'apiProxy.forward');
  app.delete(/^\/api\/(.+)$/, 'apiProxy.forward');

  app.get(/^\/(\w+)\/api\/(.+)$/, 'apiProxy.forward');
  app.put(/^\/(\w+)\/api\/(.+)$/, 'apiProxy.forward');
  app.post(/^\/(\w+)\/api\/(.+)$/, 'apiProxy.forward');
  app.delete(/^\/(\w+)\/api\/(.+)$/, 'apiProxy.forward');

  // app route
  app.get('/app/:appName', 'appRouter.getApp');
  app.get('/app/:appName/*', 'appRouter.getApp');
  app.get('/:env/app/:appName', 'appRouter.getApp');
  app.get('/:env/app/:appName/*', 'appRouter.getApp');
};