'use strict';

module.exports = app => {
    // 监听配置
    app.serverConfig.subscribe({
        // ...
    }, data => {
        try {
            // ...
            app.serverConfig.domainConfig = JSON.parse(data);
        } catch (error) {
            // 保底配置
            app.serverConfig.domainConfig = app.config.domainConfig;
        }
    })
};