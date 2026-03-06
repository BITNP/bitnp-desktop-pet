// DEPRECATED: this implementation is buggy and laggy on Windows!

const http = require('http');
const os = require('os');
const si = require('systeminformation');
const pidusage = require('pidusage');

export default class SystemMonitorServer {
    constructor(port = 3000) {
        this.port = port;
        this.server = null;
        this.metrics = {};
    }

    // 初始化并启动服务器
    async start() {
        console.log(`系统监控服务器启动中...`);
        
        // 首先获取一次系统信息
        await this.updateMetrics();
        
        // 设置定时更新指标（每10秒更新一次）
        setInterval(() => this.updateMetrics(), 10000);
        
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
        
        this.server.listen(this.port, () => {
            console.log(`HTTP服务器运行在 http://localhost:${this.port}`);
            console.log(`可用接口:`);
            console.log(`  GET /metrics - 获取所有指标`);
            console.log(`  GET /metrics/cpu - 获取CPU指标`);
            console.log(`  GET /metrics/gpu - 获取GPU指标`);
            console.log(`  GET /metrics/memory - 获取内存指标`);
            console.log(`  GET /metrics/battery - 获取电池指标`);
            console.log(`  GET /metrics/disk - 获取硬盘指标`);
            console.log(`  GET /metrics/all - 获取所有原始数据`);
        });
    }

    // 处理HTTP请求
    handleRequest(req, res) {
        const url = req.url;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        if (req.method === 'GET') {
            if (url === '/metrics') {
                res.writeHead(200);
                res.end(JSON.stringify(this.getFormattedMetrics(), null, 2));
            } else if (url === '/metrics/cpu') {
                res.writeHead(200);
                res.end(JSON.stringify(this.getCPUOnlyMetrics(), null, 2));
            } else if (url === '/metrics/gpu') {
                res.writeHead(200);
                res.end(JSON.stringify(this.getGPUOnlyMetrics(), null, 2));
            } else if (url === '/metrics/memory') {
                res.writeHead(200);
                res.end(JSON.stringify(this.getMemoryOnlyMetrics(), null, 2));
            } else if (url === '/metrics/battery') {
                res.writeHead(200);
                res.end(JSON.stringify(this.getBatteryOnlyMetrics(), null, 2));
            } else if (url === '/metrics/disk') {
                res.writeHead(200);
                res.end(JSON.stringify(this.getDiskOnlyMetrics(), null, 2));
            } else if (url === '/metrics/all') {
                res.writeHead(200);
                res.end(JSON.stringify(this.metrics, null, 2));
            } else if (url === '/health') {
                res.writeHead(200);
                res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: '接口不存在' }));
            }
        } else {
            res.writeHead(405);
            res.end(JSON.stringify({ error: '方法不允许' }));
        }
    }

    // 更新所有指标
    async updateMetrics() {
        try {
            const [
                cpuInfo,
                cpuTemperature,
                cpuCurrentSpeed,
                memInfo,
                graphicsInfo,
                batteryInfo,
                diskLayout,
                fsSizeInfo,
                blockDevices
            ] = await Promise.all([
                si.cpu(),
                si.cpuTemperature(),
                si.cpuCurrentSpeed(),
                si.mem(),
                si.graphics(),
                si.battery(),
                si.diskLayout(),
                si.fsSize(),
                si.blockDevices()
            ]);

            // CPU信息
            this.metrics.cpu = {
                name: cpuInfo.manufacturer + ' ' + cpuInfo.brand,
                temperature: cpuTemperature.main || 0,
                temperature_first: cpuTemperature.cores?.[0] || 0,
                temperature_last: cpuTemperature.cores?.[cpuTemperature.cores?.length - 1] || 0,
                tjmax_first: 100, // 通常为固定值，实际可能需要从硬件获取
                tjmax_last: 100,
                power: 0, // 需要通过额外工具获取
                voltage_first: 0, // 需要通过额外工具获取
                voltage_last: 0,
                voltage: 0,
                clock_first: cpuCurrentSpeed.cores?.[0] || 0,
                clock_last: cpuCurrentSpeed.cores?.[cpuCurrentSpeed.cores?.length - 1] || 0,
                clock_avg: this.calculateAverage(cpuCurrentSpeed.cores || []),
                clock_rms: this.calculateRMS(cpuCurrentSpeed.cores || []),
                clock_max: Math.max(...(cpuCurrentSpeed.cores || [0])),
                usage: 0, // 将使用实时计算
                usage_first: 0,
                usage_last: 0
            };

            // 实时计算CPU使用率
            await this.updateCPUUsage();

            // 内存信息
            const memTotalGB = memInfo.total / 1024 / 1024 / 1024;
            const memUsedGB = memInfo.used / 1024 / 1024 / 1024;
            const memAvailableGB = memInfo.available / 1024 / 1024 / 1024;
            
            this.metrics.memory = {
                percentage: parseFloat(((memInfo.used / memInfo.total) * 100).toFixed(2)),
                available: parseFloat(memAvailableGB.toFixed(2)),
                used: parseFloat(memUsedGB.toFixed(2)),
                total: parseFloat(memTotalGB.toFixed(2))
            };

            // GPU信息
            if (graphicsInfo.controllers && graphicsInfo.controllers.length > 0) {
                const gpu = graphicsInfo.controllers[0];
                this.metrics.gpu = {
                    name: gpu.model || '未知',
                    temperature: 0, // 需要额外库获取
                    power: 0,
                    clock_rms: 0,
                    mem_clock_rms: 0,
                    usage: 0
                };
            } else {
                this.metrics.gpu = null;
            }

            // 电池信息
            if (batteryInfo.hasBattery) {
                this.metrics.battery = {
                    capacity_max: parseFloat((batteryInfo.maxCapacity || 0).toFixed(2)),
                    capacity_remain: parseFloat((batteryInfo.currentCapacity || 0).toFixed(2)),
                    capacity_designed: parseFloat((batteryInfo.designedCapacity || batteryInfo.maxCapacity || 0).toFixed(2)),
                    voltage: parseFloat((batteryInfo.voltage || 0).toFixed(2)),
                    rate: parseFloat((batteryInfo.currentConsumption || 0).toFixed(2)),
                    state: batteryInfo.isCharging || false
                };
            } else {
                this.metrics.battery = null;
            }
            
            // 硬盘信息
            // TODO: 当前实现可能不准确
            const physicalDisks = blockDevices.filter(device => 
                device.type === 'disk' && device.name
            );
            
            let totalDisk = 0;
            physicalDisks.forEach((disk) => {totalDisk += disk.size});
            const totalGB = totalDisk / 1024 / 1024 / 1024;

            // this.metrics.physicalDisks = physicalDisks; // DEBUG
            // this.metrics.fsSizeInfo = fsSizeInfo; // DEBUG
            
            // 通过 fsSizeInfo 获取文件系统使用情况
            let used = 0;
            fsSizeInfo.forEach(fs => {
                if (fs.fs && fs.type) {
                    used += fs.used;
                }
            });

            const usedGB = used / 1024 / 1024 / 1024;
            
            this.metrics.disk = {
                total: totalGB,
                used: usedGB
            };

            // 操作系统激活状态
            this.metrics.os = {
                activated: true // 简化处理，实际需要更复杂的检测
            };

            this.metrics.timestamp = new Date().toISOString();

        } catch (error) {
            console.error('更新指标时出错:', error);
        }
    }

    // 实时更新CPU使用率
    async updateCPUUsage() {
        try {
            const cpuTimes = await si.currentLoad();
            
            if (cpuTimes.cpus && cpuTimes.cpus.length > 0) {
                this.metrics.cpu.usage = parseFloat(cpuTimes.currentLoad.toFixed(2));
                this.metrics.cpu.usage_first = parseFloat(cpuTimes.cpus[0].load.toFixed(2));
                this.metrics.cpu.usage_last = parseFloat(cpuTimes.cpus[cpuTimes.cpus.length - 1].load.toFixed(2));
            }
        } catch (error) {
            console.error('获取CPU使用率时出错:', error);
        }
    }

    // 计算平均值
    calculateAverage(arr) {
        if (arr.length === 0) return 0;
        const sum = arr.reduce((a, b) => a + b, 0);
        return parseFloat((sum / arr.length).toFixed(2));
    }

    // 计算均方根
    calculateRMS(arr) {
        if (arr.length === 0) return 0;
        const sumOfSquares = arr.reduce((sum, val) => sum + val * val, 0);
        return parseFloat(Math.sqrt(sumOfSquares / arr.length).toFixed(2));
    }

    // 获取格式化的指标（按您要求的格式）
    getFormattedMetrics() {
        return {
            cpu_name: this.metrics.cpu?.name || "未知",
            cpu_temperature: this.metrics.cpu?.temperature || 0,
            cpu_temperature_first: this.metrics.cpu?.temperature_first || 0,
            cpu_temperature_last: this.metrics.cpu?.temperature_last || 0,
            cpu_tjmax_first: this.metrics.cpu?.tjmax_first || 0,
            cpu_tjmax_last: this.metrics.cpu?.tjmax_last || 0,
            cpu_power: this.metrics.cpu?.power || 0,
            cpu_voltage_first: this.metrics.cpu?.voltage_first || 0,
            cpu_voltage_last: this.metrics.cpu?.voltage_last || 0,
            cpu_voltage: this.metrics.cpu?.voltage || 0,
            cpu_clock_first: this.metrics.cpu?.clock_first || 0,
            cpu_clock_last: this.metrics.cpu?.clock_last || 0,
            cpu_clock_avg: this.metrics.cpu?.clock_avg || 0,
            cpu_clock_rms: this.metrics.cpu?.clock_rms || 0,
            cpu_clock_max: this.metrics.cpu?.clock_max || 0,
            cpu_usage: this.metrics.cpu?.usage || 0,
            cpu_usage_first: this.metrics.cpu?.usage_first || 0,
            cpu_usage_last: this.metrics.cpu?.usage_last || 0,
            gpu_name: this.metrics.gpu?.name || "未知",
            gpu_temperature: this.metrics.gpu?.temperature || 0,
            gpu_power: this.metrics.gpu?.power || 0,
            gpu_clock_rms: this.metrics.gpu?.clock_rms || 0,
            gpu_mem_clock_rms: this.metrics.gpu?.mem_clock_rms || 0,
            gpu_usage: this.metrics.gpu?.usage || 0,
            mem_percentage: this.metrics.memory?.percentage || 0,
            mem_available: this.metrics.memory?.available || 0,
            mem_used: this.metrics.memory?.used || 0,
            mem_total: this.metrics.memory?.total || 0,
            bat_capacity_max: this.metrics.battery?.capacity_max || 0,
            bat_capacity_remain: this.metrics.battery?.capacity_remain || 0,
            bat_capacity_designed: this.metrics.battery?.capacity_designed || 0,
            bat_voltage: this.metrics.battery?.voltage || 0,
            bat_rate: this.metrics.battery?.rate || 0,
            bat_state: this.metrics.battery?.state || false,
            os_activated: this.metrics.os?.activated || false,
            disk_temperature_first: this.metrics.disk?.temperature_first || 0,
            disk_temperature_last: this.metrics.disk?.temperature_last || 0,
            disk_size: this.metrics.disk?.total || [],
            disk_used: this.metrics.disk?.used || [],
            timestamp: this.metrics.timestamp
        };
    }

    // 获取CPU指标
    getCPUOnlyMetrics() {
        const metrics = this.getFormattedMetrics();
        return {
            cpu_name: metrics.cpu_name,
            cpu_temperature: metrics.cpu_temperature,
            cpu_temperature_first: metrics.cpu_temperature_first,
            cpu_temperature_last: metrics.cpu_temperature_last,
            cpu_tjmax_first: metrics.cpu_tjmax_first,
            cpu_tjmax_last: metrics.cpu_tjmax_last,
            cpu_power: metrics.cpu_power,
            cpu_voltage_first: metrics.cpu_voltage_first,
            cpu_voltage_last: metrics.cpu_voltage_last,
            cpu_voltage: metrics.cpu_voltage,
            cpu_clock_first: metrics.cpu_clock_first,
            cpu_clock_last: metrics.cpu_clock_last,
            cpu_clock_avg: metrics.cpu_clock_avg,
            cpu_clock_rms: metrics.cpu_clock_rms,
            cpu_clock_max: metrics.cpu_clock_max,
            cpu_usage: metrics.cpu_usage,
            cpu_usage_first: metrics.cpu_usage_first,
            cpu_usage_last: metrics.cpu_usage_last
        };
    }

    // 获取GPU指标
    getGPUOnlyMetrics() {
        const metrics = this.getFormattedMetrics();
        return {
            gpu_name: metrics.gpu_name,
            gpu_temperature: metrics.gpu_temperature,
            gpu_power: metrics.gpu_power,
            gpu_clock_rms: metrics.gpu_clock_rms,
            gpu_mem_clock_rms: metrics.gpu_mem_clock_rms,
            gpu_usage: metrics.gpu_usage
        };
    }

    // 获取内存指标
    getMemoryOnlyMetrics() {
        const metrics = this.getFormattedMetrics();
        return {
            mem_percentage: metrics.mem_percentage,
            mem_available: metrics.mem_available,
            mem_used: metrics.mem_used,
            total: metrics.mem_total
        };
    }

    // 获取电池指标
    getBatteryOnlyMetrics() {
        const metrics = this.getFormattedMetrics();
        return {
            bat_capacity_max: metrics.bat_capacity_max,
            bat_capacity_remain: metrics.bat_capacity_remain,
            bat_capacity_designed: metrics.bat_capacity_designed,
            bat_voltage: metrics.bat_voltage,
            bat_rate: metrics.bat_rate,
            bat_state: metrics.bat_state
        };
    }

    // 获取硬盘指标
    getDiskOnlyMetrics() {
        const metrics = this.getFormattedMetrics();
        return {
            disk_temperature_first: metrics.disk_temperature_first,
            disk_temperature_last: metrics.disk_temperature_last,
            disk_disk_size: metrics.disk_disk_size
        };
    }

    // 停止服务器
    stop() {
        if (this.server) {
            this.server.close();
            console.log('服务器已停止');
        }
    }
}

// 使用示例
async function main() {
    const server = new SystemMonitorServer(3000);
    await server.start();
}

// 如果直接运行此文件
if (require.main === module) {
    main().catch(console.error);
}