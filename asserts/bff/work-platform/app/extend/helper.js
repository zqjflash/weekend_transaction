'use strict';
 
const base64url = require('base64url');

module.exports = {
    // ...
    handleApiResHeader(res) {
        const { headers } = res;
        const { ctx } = this;

        // 处理需要透传的header信息
        const transHeader = [
            'x-response-time', // apiService接口返回耗时
            'x-sandbox-timeused', // 沙箱运行耗时
            'x-sandbox-memoryused', // 沙箱运行内存消耗
            ['x-server-id', 'x-api-server-id'], // 双key值，使用第二个key值作为新的key值
        ];

        transHeader.forEach(item => {
            let key;
            let nickKey;
            if (Array.isArray(item)) {
                key = item[0];
                nickKey = item[1];
            } else {
                key = nickKey = item;
            }
            if (headers[key]) {
                ctx.set(nickKey, headers[key]);
            }
        });
    }
};