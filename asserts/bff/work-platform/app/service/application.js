'use strict';
const Service = require('egg').Service;

async function fetchEnvList(app, ctx, apiUrl) {
    const result = await ctx.curl(apiUrl, {dataType: 'json'}).catch (e => {
        ctx.logger.error(e);
        return {
            status: 500,
        }
    });
    // ...
}

class AppService extends Service {
    async getEnvList(name) {
        // ...
        const [ prodEnvList, dailyEnvList ] = await Promise.all([
            fetchEnvList(this.app, this.ctx, prodApiUrl),
            fetchEnvList(this.app, this.ctx, dailyApiUrl),
        ]);
        return _.uniq([ ...prodEnvList, ...dailyEnvList ]);
    }
}

module.exports = AppService;