'use strict';

const moment = require('moment');
moment.locale('zh-cn');

module.exports = app => {
    class AppRouterController extends app.Controller {
        async getHomePage() {
            const { ctx } = this;
            const env = ctx.params.env || 'prod';
            const { domain, app } = ctx;
            const domainConfig = app.serverConfig.domainConfig.data[domain];
            const { headers } = ctx.request;
            const targetHeader = ctx.helper.getTargetHeader(env);
            const targetUrl = `http://${targetHeader.host}/api/home-page`;
            const result = await ctx.curl(targetUrl, {
                headers: {
                    ...headers,
                    ...targetHeader,
                },
                dataType: 'json',
            });
            const { data } = result;
            const { user = {} } = this.ctx;
            const cdn = this.config.cdn;
        }
    }
    return AppRouterController;
}