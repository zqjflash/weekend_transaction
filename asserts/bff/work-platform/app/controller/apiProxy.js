'use strict';
const querystring = require('querystring');

module.exports = app => {
    class HomeController extends app.Controller {
        // ...
        async forward() {
            const result = await ctx.curl(targetUrl, {
                method,
                data: {
                    ...body,
                },
                contentType: type || 'json',
                // 从request header头里获取，用于指定自定义response的类型
                // 具体取值参考：https://github.com/node-modules/urllib
                dataType: ctx.get('response-data-type') || 'json',
                headers: {
                    ...headers,
                    ...targetHeader,
                },
                timeout: 60000,
            });
            const { status, data } = result;
            ctx.response.status = status;
            ctx.response.body = data;
            ctx.helper.handleApiResHeader(result);
        }
    }
    return HomeController;
}