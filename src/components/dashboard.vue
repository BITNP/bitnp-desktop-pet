<script>
window.addEventListener('load', () => {
    // 获取DOM元素
    const dashboardCard = document.getElementById('dashboardCard');
    const toggleBtn = document.getElementById('toggleBtn');
    const flipBackBtn = document.getElementById('flipBackBtn');
    const cpuProgress = document.getElementById('cpuProgress');
    const cpuValue = document.getElementById('cpuValue');
    const memoryProgress = document.getElementById('memoryProgress');
    const memoryValue = document.getElementById('memoryValue');
    const diskProgress = document.getElementById('diskProgress');
    const diskValue = document.getElementById('diskValue');
    const networkProgress = document.getElementById('networkProgress');
    const networkValue = document.getElementById('networkValue');
    
    // 创建粒子背景
    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // 随机大小
            const size = Math.random() * 4 + 1;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // 随机位置
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            // 随机颜色
            const colors = [
                'rgba(0, 200, 255, 0.5)',
                'rgba(157, 78, 221, 0.5)',
                'rgba(0, 255, 150, 0.5)',
                'rgba(255, 107, 107, 0.5)'
            ];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            // 随机动画
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 5;
            particle.style.animation = `float ${duration}s infinite ease-in-out ${delay}s`;
            
            particlesContainer.appendChild(particle);
        }
    }
    
    // 初始化粒子
    createParticles();
    
    // 切换按钮功能
    toggleBtn.addEventListener('click', function() {
        this.classList.toggle('active');
    });
    
    // 卡片翻转功能
    let isFlipped = false;
    
    toggleBtn.addEventListener('click', function() {
        isFlipped = !isFlipped;
        if(isFlipped) {
            dashboardCard.style.transform = 'rotateY(180deg)';
        } else {
            dashboardCard.style.transform = 'rotateY(0deg)';
        }
    });
    
    flipBackBtn.addEventListener('click', function() {
        isFlipped = false;
        dashboardCard.style.transform = 'rotateY(0deg)';
    });
    
    // 模拟实时数据更新
    function updateMetrics() {
        // 模拟CPU使用率变化 (20% - 60%)
        const cpuUsage = 20 + Math.random() * 40;
        cpuProgress.style.width = `${cpuUsage}%`;
        cpuValue.textContent = `${Math.round(cpuUsage)}%`;
        
        // 模拟内存使用变化 (2.5 - 4.0 GB，总共8GB)
        const memoryUsed = 2.5 + Math.random() * 1.5;
        const memoryPercent = (memoryUsed / 8) * 100;
        memoryProgress.style.width = `${memoryPercent}%`;
        memoryValue.textContent = `${memoryUsed.toFixed(1)}/8.0 GB`;
        
        // 模拟磁盘使用 (120-135 GB，总共512GB)
        const diskUsed = 120 + Math.random() * 15;
        const diskPercent = (diskUsed / 512) * 100;
        diskProgress.style.width = `${diskPercent}%`;
        diskValue.textContent = `${Math.round(diskUsed)}/512 GB`;
        
        // 模拟网络速度变化
        const uploadSpeed = Math.round(20 + Math.random() * 40);
        const downloadSpeed = Math.round(60 + Math.random() * 80);
        const networkUsage = (uploadSpeed + downloadSpeed) / 200; // 假设最大200Kbps
        networkProgress.style.width = `${networkUsage * 100}%`;
        networkValue.textContent = `${downloadSpeed + uploadSpeed} Kbps`;
        
        // 更新系统信息中的最后更新时间
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('lastUpdate').textContent = timeStr;
    }
    
    // 初始数据
    updateMetrics();
    
    // 每3秒更新一次数据
    setInterval(updateMetrics, 3000);
    
    // 鼠标移动时的3D效果增强
    dashboardCard.addEventListener('mousemove', function(e) {
        
        
        const card = this;
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        
        const REACTION_RATIO = 0.050;


        let rotateY = (e.clientX - centerX) * REACTION_RATIO;
        let rotateX = (centerY - e.clientY) * REACTION_RATIO;

        if(isFlipped) {
            rotateY += 180;
            rotateX *= -1;
        }
        
        card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(20px)`;
    });
    
    // 鼠标离开时恢复
    dashboardCard.addEventListener('mouseleave', function() {
        if(isFlipped) {
            this.style.transform = 'rotateY(180deg) rotateX(0deg) translateZ(0)';
        } else {
            this.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0)';
        }
    });
    
    // 系统信息随机更新
    const systemInfo = [
        { id: 'systemVersion', value: 'Windows 11 Pro', icon: 'fa-desktop' },
        { id: 'processor', value: 'Intel i7-12700H', icon: 'fa-microchip' },
        { id: 'gpu', value: 'NVIDIA RTX 4060', icon: 'fa-gamepad' },
        { id: 'uptime', value: '2天 4小时', icon: 'fa-clock' },
        { id: 'battery', value: '87% (充电中)', icon: 'fa-battery-three-quarters' }
    ];
    
    // 每隔一段时间随机更新一条系统信息
    setInterval(() => {
        const randomIndex = Math.floor(Math.random() * systemInfo.length);
        const info = systemInfo[randomIndex];
        const element = document.getElementById(info.id);
        
        // 保存原始值
        const originalValue = element.textContent;
        
        // 添加更新动画
        element.style.opacity = '0.5';
        element.style.transform = 'translateY(-5px)';
        
        setTimeout(() => {
            // 短暂改变
            if(info.id === 'battery') {
                const newBattery = 80 + Math.floor(Math.random() * 20);
                const isCharging = Math.random() > 0.5;
                element.textContent = `${newBattery}% ${isCharging ? '(充电中)' : '(使用中)'}`;
            } else if(info.id === 'uptime') {
                const days = Math.floor(Math.random() * 5);
                const hours = Math.floor(Math.random() * 24);
                element.textContent = `${days}天 ${hours}小时`;
            } else if(info.id === 'gpu') {
                const gpus = ['NVIDIA RTX 4060', 'NVIDIA RTX 4070', 'AMD RX 7700 XT'];
                element.textContent = gpus[Math.floor(Math.random() * gpus.length)];
            }
            
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            
            // 2秒后恢复
            setTimeout(() => {
                element.style.opacity = '0.5';
                element.style.transform = 'translateY(-5px)';
                
                setTimeout(() => {
                    element.textContent = info.value;
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, 200);
            }, 2000);
        }, 200);
    }, 8000);
    
    // 添加鼠标悬停时的粒子互动效果
    dashboardCard.addEventListener('mouseenter', () => {
        const particles = document.querySelectorAll('.particle');
        particles.forEach(particle => {
            particle.style.animationPlayState = 'running';
        });
    });
    
    dashboardCard.addEventListener('mouseleave', () => {
        const particles = document.querySelectorAll('.particle');
        particles.forEach(particle => {
            particle.style.animationPlayState = 'paused';
        });
    });
});
</script>


<template>
    <!-- 全息投影效果 -->
    <div class="hologram-effect"></div>
    
    <div class="dashboard-container mouse-interactive">
        <!-- 粒子背景 -->
        <div class="particles" id="particles"></div>
        
        <div class="dashboard-card" id="dashboardCard">
            <!-- 正面 -->
            <div class="card-front">
                <div class="header">
                    <div class="title">
                        <i class="fas fa-microchip"></i>
                        <h2>系统状态</h2>
                    </div>
                    <button class="toggle-btn" id="toggleBtn">更多信息</button>
                </div>
                
                <div class="content">
                    <!-- CPU 指标 -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">
                                <i class="fas fa-microchip"></i> CPU 使用率
                            </div>
                            <div class="metric-value" id="cpuValue">24%</div>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar cpu-progress" id="cpuProgress" style="width: 24%"></div>
                        </div>
                    </div>
                    
                    <!-- 内存指标 -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">
                                <i class="fas fa-memory"></i> 内存占用
                            </div>
                            <div class="metric-value" id="memoryValue">3.2/8.0 GB</div>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar memory-progress" id="memoryProgress" style="width: 40%"></div>
                        </div>
                    </div>
                    
                    <!-- 磁盘指标 -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">
                                <i class="fas fa-hdd"></i> 磁盘使用
                            </div>
                            <div class="metric-value" id="diskValue">128/512 GB</div>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar disk-progress" id="diskProgress" style="width: 25%"></div>
                        </div>
                    </div>
                    
                    <!-- 网络指标 -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">
                                <i class="fas fa-wifi"></i> 网络活动
                            </div>
                            <div class="metric-value" id="networkValue">142 Kbps</div>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar network-progress" id="networkProgress" style="width: 45%"></div>
                        </div>
                        <div class="network-activity">
                            <div class="activity-dots">
                                <div class="dot"></div>
                                <div class="dot"></div>
                                <div class="dot"></div>
                                <div class="dot"></div>
                            </div>
                            <div class="network-stats">
                                <span class="upload">↑ 42Kbps</span>
                                <span class="download">↓ 100Kbps</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- <div class="hint">点击切换按钮查看详细信息 | 悬停卡片有3D效果</div> -->
            </div>
            
            <!-- 背面 -->
            <div class="card-back">
                <div class="header">
                    <div class="title">
                        <i class="fas fa-info-circle"></i>
                        <h2 style="color: #fff;">系统信息</h2>
                    </div>
                </div>
                
                <div class="content system-info">
                    <div class="info-item">
                        <div class="info-label">
                            <i class="fas fa-desktop"></i> 系统版本
                        </div>
                        <div class="info-value" id="systemVersion">Windows 11 Pro</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">
                            <i class="fas fa-microchip"></i> 处理器
                        </div>
                        <div class="info-value" id="processor">Intel i7-12700H</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">
                            <i class="fas fa-gamepad"></i> 显卡
                        </div>
                        <div class="info-value" id="gpu">NVIDIA RTX 4060</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">
                            <i class="fas fa-clock"></i> 运行时间
                        </div>
                        <div class="info-value" id="uptime">2天 4小时</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">
                            <i class="fas fa-battery-three-quarters"></i> 电池状态
                        </div>
                        <div class="info-value" id="battery">87% (充电中)</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">
                            <i class="fas fa-sync-alt"></i> 最后更新
                        </div>
                        <div class="info-value" id="lastUpdate">刚刚</div>
                    </div>
                </div>
                
                <button class="flip-btn" id="flipBackBtn">
                    <i class="fas fa-undo"></i> 返回仪表盘
                </button>
            </div>
        </div>
    </div>

</template>

<style>
    
    /* 3D全息投影效果 */
    .hologram-effect {
        position: absolute;
        width: 400px;
        height: 500px;
        background: conic-gradient(
            from 0deg at 50% 50%,
            rgba(0, 200, 255, 0.2) 0deg,
            rgba(100, 220, 255, 0.1) 60deg,
            rgba(150, 240, 255, 0.05) 120deg,
            rgba(200, 255, 255, 0) 180deg,
            rgba(0, 200, 255, 0.2) 240deg,
            rgba(100, 220, 255, 0.1) 300deg,
            rgba(0, 200, 255, 0.2) 360deg
        );
        filter: blur(60px);
        opacity: 0.6;
        z-index: -2;
        animation: rotateHologram 20s linear infinite;
    }
    
    @keyframes rotateHologram {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.1); }
        100% { transform: rotate(360deg) scale(1); }
    }
    
    /* 仪表盘容器 */
    .dashboard-container {
        width: 320px;
        height: 420px;
        perspective: 1200px;
        position: relative;
        filter: drop-shadow(0 0 20px rgba(0, 150, 255, 0.3));
    }
    
    /* 粒子背景 */
    .particles {
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: -1;
    }
    
    .particle {
        position: absolute;
        background: rgba(0, 200, 255, 0.3);
        border-radius: 50%;
        filter: blur(1px);
    }
    
    /* 3D卡片 */
    .dashboard-card {
        width: 100%;
        height: 100%;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border-radius: 20px;
        cursor: default;
    }
    
    .dashboard-card:hover {
        transform: rotateY(5deg) rotateX(5deg) translateZ(20px);
    }
    
    /* 霓虹边框 */
    .dashboard-card::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, 
            #00a2ff, #00f7ff, #0066ff, 
            #9d4edd, #c77dff, #00a2ff);
        border-radius: 22px;
        z-index: -1;
        animation: neonBorder 3s linear infinite;
        filter: blur(8px);
        opacity: 0.7;
    }
    
    .dashboard-card::after {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, 
            #00a2ff, #00f7ff, #0066ff, 
            #9d4edd, #c77dff, #00a2ff);
        border-radius: 22px;
        z-index: -1;
        animation: neonBorder 3s linear infinite reverse;
        filter: blur(12px);
        opacity: 0.4;
    }
    
    @keyframes neonBorder {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    
    /* 卡片正面 */
    .card-front, .card-back {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        border-radius: 20px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    
    .card-front {
        background: linear-gradient(
            135deg,
            rgba(10, 20, 40, 0.85) 0%,
            rgba(20, 30, 60, 0.85) 100%
        );
    }
    
    .card-back {
        background: linear-gradient(
            135deg,
            rgba(40, 10, 60, 0.9) 0%,
            rgba(20, 10, 40, 0.9) 100%
        );
        transform: rotateY(180deg);
    }
    
    /* 标题栏 */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        position: relative;
        overflow: hidden;
    }
    
    .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, 
            transparent, 
            rgba(0, 200, 255, 0.8), 
            transparent);
    }
    
    .title {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .title h2 {
        font-size: 20px;
        font-weight: 700;
        background: linear-gradient(45deg, #00a2ff, #9d4edd);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 2px;
        text-shadow: 0 0 20px rgba(0, 162, 255, 0.3);
    }
    
    .title i {
        color: #00a2ff;
        filter: drop-shadow(0 0 8px rgba(0, 162, 255, 0.5));
        animation: iconGlow 2s ease-in-out infinite alternate;
    }
    
    @keyframes iconGlow {
        0% { 
            filter: drop-shadow(0 0 5px rgba(0, 162, 255, 0.5));
            transform: scale(1);
        }
        100% { 
            filter: drop-shadow(0 0 12px rgba(0, 162, 255, 0.8));
            transform: scale(1.1);
        }
    }
    
    /* 切换按钮 */
    .toggle-btn {
        width: 75px;
        height: 26px;
        background: rgba(0, 0, 0, 0.4);
        color: white;
        border-radius: 13px;
        position: relative;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        border: 1px solid rgba(0, 200, 255, 0.3);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
    }
    
    /* 内容区域 */
    .content {
        padding: 20px;
        height: calc(100% - 70px);
        overflow-y: auto;
    }
    
    .content::-webkit-scrollbar {
        width: 4px;
    }
    
    .content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 2px;
    }
    
    .content::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #00a2ff, #9d4edd);
        border-radius: 2px;
    }
    
    /* 指标卡片 */
    .metric-card {
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.03) 100%
        );
        border-radius: 15px;
        padding: 18px;
        margin-bottom: 18px;
        position: relative;
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
    
    .metric-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, 
            transparent, 
            rgba(0, 200, 255, 0.5), 
            transparent);
    }
    
    .metric-card:hover {
        transform: translateY(-5px) translateZ(10px);
        border-color: rgba(0, 200, 255, 0.3);
        box-shadow: 
            0 12px 24px rgba(0, 0, 0, 0.3),
            0 0 20px rgba(0, 150, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    
    .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    
    .metric-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
    }
    
    .metric-title i {
        color: #00a2ff;
        filter: drop-shadow(0 0 6px rgba(0, 162, 255, 0.5));
    }
    
    .metric-value {
        font-size: 24px;
        font-weight: 700;
        background: linear-gradient(45deg, #ffffff, #a0e0ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 0 10px rgba(0, 200, 255, 0.3);
    }
    
    /* 进度条 */
    .progress-container {
        height: 8px;
        background: rgba(0, 0, 0, 0.4);
        border-radius: 4px;
        overflow: hidden;
        margin-top: 12px;
        position: relative;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
    }
    
    .progress-container::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, 
            transparent, 
            rgba(255, 255, 255, 0.1), 
            transparent);
        animation: shimmer 2s infinite;
    }
    
    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
    
    .progress-bar {
        height: 100%;
        border-radius: 4px;
        transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        overflow: hidden;
    }
    
    .progress-bar::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, 
            transparent, 
            rgba(255, 255, 255, 0.3), 
            transparent);
        animation: progressShine 2s infinite;
    }
    
    @keyframes progressShine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
    
    .cpu-progress {
        background: linear-gradient(90deg, 
            #0066cc, 
            #00a2ff, 
            #00f7ff);
        box-shadow: 0 0 10px rgba(0, 102, 204, 0.5);
    }
    
    .memory-progress {
        background: linear-gradient(90deg, 
            #9d4edd, 
            #c77dff, 
            #e0b0ff);
        box-shadow: 0 0 10px rgba(157, 78, 221, 0.5);
    }
    
    .disk-progress {
        background: linear-gradient(90deg, 
            #00cc66, 
            #00e676, 
            #00ff88);
        box-shadow: 0 0 10px rgba(0, 204, 102, 0.5);
    }
    
    .network-progress {
        background: linear-gradient(90deg, 
            #ff6b6b, 
            #ff9e6d, 
            #ffcc00);
        box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
    }
    
    /* 网络活动指示器 */
    .network-activity {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
    }
    
    .activity-dots {
        display: flex;
        gap: 6px;
    }
    
    .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #333;
        animation: pulse 1.5s infinite ease-in-out;
        box-shadow: 0 0 5px currentColor;
    }
    
    .dot:nth-child(1) {
        animation-delay: 0s;
        color: #ff5555;
    }
    
    .dot:nth-child(2) {
        animation-delay: 0.2s;
        color: #ffaa00;
    }
    
    .dot:nth-child(3) {
        animation-delay: 0.4s;
        color: #55ff55;
    }
    
    .dot:nth-child(4) {
        animation-delay: 0.6s;
        color: #5555ff;
    }
    
    @keyframes pulse {
        0%, 100% {
            background: #333;
            transform: scale(1);
            box-shadow: 0 0 5px currentColor;
        }
        50% {
            background: currentColor;
            transform: scale(1.3);
            box-shadow: 0 0 12px currentColor;
        }
    }
    
    .network-stats {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        display: flex;
        gap: 8px;
    }
    
    .upload { color: #ff5555; }
    .download { color: #55ff55; }
    
    /* 背面样式 */
    .system-info {
        color: rgba(255, 255, 255, 0.9);
    }
    
    .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        position: relative;
        transition: all 0.3s ease;
    }
    
    .info-item:hover {
        background: rgba(255, 255, 255, 0.05);
        padding-left: 10px;
        padding-right: 10px;
        margin-left: -10px;
        margin-right: -10px;
        border-radius: 8px;
    }
    
    .info-item:hover::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(to bottom, #00a2ff, #9d4edd);
        border-radius: 0 3px 3px 0;
    }
    
    .info-label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .info-value {
        font-size: 14px;
        color: #fff;
        font-weight: 500;
        text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
    }
    
    .flip-btn {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(0, 162, 255, 0.2), rgba(157, 78, 221, 0.2));
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(10px);
    }
    
    .flip-btn:hover {
        background: linear-gradient(135deg, rgba(0, 162, 255, 0.4), rgba(157, 78, 221, 0.4));
        transform: translateX(-50%) translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .flip-btn:active {
        transform: translateX(-50%) translateY(0);
    }
    
    /* 响应式设计 */
    @media (max-width: 400px) {
        .dashboard-container {
            width: 300px;
            height: 400px;
        }
        
        .content {
            padding: 15px;
        }
    }
    
    /* 提示文字 */
    .hint {
        position: absolute;
        bottom: 10px;
        left: 0;
        width: 100%;
        text-align: center;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    }
</style>