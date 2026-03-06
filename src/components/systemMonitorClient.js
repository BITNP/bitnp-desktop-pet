export default class SystemMonitorClient {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
    }

    // 通用请求方法
    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`请求失败 ${endpoint}:`, error.message);
            throw error;
        }
    }

    // 获取所有格式化指标
    async getAllMetrics() {
        return await this.fetchData('/metrics/all');
    }

    // 获取CPU指标
    async getCPUMetrics() {
        return await this.fetchData('/metrics/cpu');
    }

    // 获取GPU指标
    async getGPUMetrics() {
        return await this.fetchData('/metrics/gpu');
    }

    // 获取内存指标
    async getMemoryMetrics() {
        return await this.fetchData('/metrics/memory');
    }

    // 获取电池指标
    async getBatteryMetrics() {
        return await this.fetchData('/metrics/battery');
    }

    // 获取硬盘指标
    async getDiskMetrics() {
        return await this.fetchData('/metrics/disk');
    }

    // 获取原始数据
    async getRawData() {
        return await this.fetchData('/metrics/all');
    }

    // 健康检查
    async healthCheck() {
        return await this.fetchData('/health');
    }
}

// // 使用示例
// async function main() {
//     const client = new SystemMonitorClient('http://localhost:3000');
    
//     try {
//         // 健康检查
//         const health = await client.healthCheck();
//         console.log('服务状态:', health.status);
        
//         // 获取CPU信息
//         const cpuInfo = await client.getCPUMetrics();
//         console.log('CPU信息:');
//         console.log(`  名称: ${cpuInfo.cpu_name}`);
//         console.log(`  温度: ${cpuInfo.cpu_temperature}°C`);
//         console.log(`  使用率: ${cpuInfo.cpu_usage}%`);
//         console.log(`  主频: ${cpuInfo.cpu_clock_avg}MHz`);
        
//         // 获取内存信息
//         const memInfo = await client.getMemoryMetrics();
//         console.log('内存信息:');
//         console.log(`  使用率: ${memInfo.mem_percentage}%`);
//         console.log(`  已用: ${memInfo.mem_used}GB`);
//         console.log(`  可用: ${memInfo.mem_available}GB`);
        
//         // 获取所有指标
//         const allMetrics = await client.getAllMetrics();
//         console.log('时间戳:', allMetrics.timestamp);
        
//     } catch (error) {
//         console.error('监控服务连接失败，请确保服务器正在运行');
//     }
// }
