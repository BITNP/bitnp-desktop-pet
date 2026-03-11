<template>
  <div class="dashboard-container">
    <!-- 全息投影效果 -->
    <div class="hologram-effect"></div>
    
    
    <div 
    class="dashboard-card mouse-interactive" 
    ref="dashboardCard"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    >
    <!-- 粒子背景 -->
    <div class="particles" ref="particlesContainer"></div>
    <!-- 正面 -->
      <div class="card-front">
        <div class="header">
          <div class="title">
            <!-- FAS icons are unnecessary (?) -->
            <i class="fas fa-microchip"></i>
            <h2>系统状态</h2>
          </div>
          <button 
            class="toggle-btn" 
            :class="{ active: isFlipped }"
            @click="toggleCard"
          >
            更多信息
          </button>
        </div>
        
        <div class="content">
          <!-- CPU 指标 -->
          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-title">
                <i class="fas fa-microchip"></i> CPU 使用率
              </div>
              <div class="metric-value">{{ cpuValue }}</div>
            </div>
            <div class="progress-container">
              <div 
                class="progress-bar cpu-progress" 
                :style="{ width: cpuProgress + '%' }"
              ></div>
            </div>
          </div>
          
          <!-- 内存指标 -->
          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-title">
                <i class="fas fa-memory"></i> 内存占用
              </div>
              <div class="metric-value">{{ memoryValue }}</div>
            </div>
            <div class="progress-container">
              <div 
                class="progress-bar memory-progress" 
                :style="{ width: memoryProgress + '%' }"
              ></div>
            </div>
          </div>
          
          <!-- 磁盘指标 -->
          <!-- <div class="metric-card">
            <div class="metric-header">
              <div class="metric-title">
                <i class="fas fa-hdd"></i> 磁盘使用
              </div>
              <div class="metric-value">{{ diskValue }}</div>
            </div>
            <div class="progress-container">
              <div 
                class="progress-bar disk-progress" 
                :style="{ width: diskProgress + '%' }"
              ></div>
            </div>
          </div> -->
          
          <!-- 网络指标 -->
          <!-- <div class="metric-card">
            <div class="metric-header">
              <div class="metric-title">
                <i class="fas fa-wifi"></i> 网络活动
              </div>
              <div class="metric-value">{{ networkValue }}</div>
            </div>
            <div class="progress-container">
              <div 
                class="progress-bar network-progress" 
                :style="{ width: networkProgress + '%' }"
              ></div>
            </div>
            <div class="network-activity">
              <div class="activity-dots">
                <div class="dot" v-for="n in 4" :key="n"></div>
              </div>
              <div class="network-stats">
                <span class="upload">↑ 42Kbps</span>
                <span class="download">↓ 100Kbps</span>
              </div>
            </div>
          </div> -->
        </div>
      </div>
      
      <!-- 背面 -->
      <div class="card-back">
        <div class="header">
          <div class="title">
            <i class="fas fa-info-circle"></i>
            <h2 style="color: #fff;">系统信息</h2>
          </div>
        </div>
        
        <div class="content system-info mouse-interactive">
          <div 
            v-for="info in Object.values(systemInfo)" 
            :key="info.id"
            class="info-item"
            @mouseenter="highlightItem(info.id)"
          >
            <div class="info-label">
              <i :class="info.icon || 'fas fa-info-circle'"></i> {{ info.name }}
            </div>
            <div class="info-value" :id="info.id">{{ info.value || '--' }}{{ (!info.value || info.value === '--') ? '' : info.unit }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">
              <i class="fas fa-sync-alt"></i> 最后更新
            </div>
            <div class="info-value" id="lastUpdate">{{ lastUpdateTime }}</div>
          </div>
          <div class="info-item">
            <!-- placeholder -->
          </div>
        </div>
        
        <button class="flip-btn" @click="flipBack">
          返回仪表盘
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SystemDashboard',
  data() {
    return {
      isFlipped: false,
      mouseX: 0,
      mouseY: 0,
      cpuValue: '0%',
      cpuProgress: 100,
      memoryValue: '--',
      memoryProgress: 100,
      // diskValue: '--',
      // diskProgress: 25,
      // networkValue: '142 Kbps',
      // networkProgress: 45,
      lastUpdateTime: '--',
      systemInfo: {
        "cpu_name": { "id": "cpu_name", "name": "CPU名称", "value": "--", "unit": "" },
        "cpu_temperature": { "id": "cpu_temperature", "name": "CPU温度", "value": "--", "unit": "℃" },
        "cpu_temperature_first": { "id": "cpu_temperature_first", "name": "CPU首核温度", "value": "--", "unit": "℃" },
        "cpu_temperature_last": { "id": "cpu_temperature_last", "name": "CPU末核温度", "value": "--", "unit": "℃" },
        "cpu_tjmax_first": { "id": "cpu_tjmax_first", "name": "CPU首核最高结温", "value": "--", "unit": "℃" },
        "cpu_tjmax_last": { "id": "cpu_tjmax_last", "name": "CPU末核最高结温", "value": "--", "unit": "℃" },
        "cpu_power": { "id": "cpu_power", "name": "CPU功耗", "value": "--", "unit": "W" },
        "cpu_voltage_first": { "id": "cpu_voltage_first", "name": "CPU首核电压", "value": "--", "unit": "V" },
        "cpu_voltage_last": { "id": "cpu_voltage_last", "name": "CPU末核电压", "value": "--", "unit": "V" },
        "cpu_voltage": { "id": "cpu_voltage", "name": "CPU电压", "value": "--", "unit": "V" },
        "cpu_clock_first": { "id": "cpu_clock_first", "name": "CPU首核频率", "value": "--", "unit": "MHz" },
        "cpu_clock_last": { "id": "cpu_clock_last", "name": "CPU末核频率", "value": "--", "unit": "MHz" },
        "cpu_clock_avg": { "id": "cpu_clock_avg", "name": "CPU平均频率", "value": "--", "unit": "MHz" },
        "cpu_clock_rms": { "id": "cpu_clock_rms", "name": "CPU等价频率", "value": "--", "unit": "MHz" },
        "cpu_clock_max": { "id": "cpu_clock_max", "name": "CPU最大频率", "value": "--", "unit": "MHz" },
        "cpu_usage": { "id": "cpu_usage", "name": "CPU使用率", "value": "--", "unit": "%" },
        "cpu_usage_first": { "id": "cpu_usage_first", "name": "CPU首核使用率", "value": "--", "unit": "%" },
        "cpu_usage_last": { "id": "cpu_usage_last", "name": "CPU末核使用率", "value": "--", "unit": "%" },
        "gpu_name": { "id": "gpu_name", "name": "GPU名称", "value": "--", "unit": "" },
        "gpu_temperature": { "id": "gpu_temperature", "name": "GPU温度", "value": "--", "unit": "℃" },
        "gpu_power": { "id": "gpu_power", "name": "GPU功耗", "value": "--", "unit": "W" },
        "gpu_clock_rms": { "id": "gpu_clock_rms", "name": "GPU等价频率", "value": "--", "unit": "MHz" },
        "gpu_mem_clock_rms": { "id": "gpu_mem_clock_rms", "name": "GPU显存等价频率", "value": "--", "unit": "MHz" },
        "gpu_usage": { "id": "gpu_usage", "name": "GPU使用率", "value": "--", "unit": "%" },
        "mem_percentage": { "id": "mem_percentage", "name": "内存使用百分比", "value": "--", "unit": "%" },
        "mem_available": { "id": "mem_available", "name": "可用内存", "value": "--", "unit": "GB" },
        "mem_used": { "id": "mem_used", "name": "已用内存", "value": "--", "unit": "GB" },
        "bat_capacity_max": { "id": "bat_capacity_max", "name": "电池最大容量", "value": "--", "unit": "Wh" },
        "bat_capacity_remain": { "id": "bat_capacity_remain", "name": "电池剩余容量", "value": "--", "unit": "Wh" },
        "bat_capacity_designed": { "id": "bat_capacity_designed", "name": "电池设计容量", "value": "--", "unit": "Wh" },
        "bat_voltage": { "id": "bat_voltage", "name": "电池电压", "value": "--", "unit": "V" },
        "bat_rate": { "id": "bat_rate", "name": "电池充放电速率", "value": "--", "unit": "W" },
        "bat_state": { "id": "bat_state", "name": "电池充电状态", "value": "--", "unit": "" },
        "os_activated": { "id": "os_activated", "name": "操作系统激活状态", "value": "--", "unit": "" },
        "disk_temperature_first": { "id": "disk_temperature_first", "name": "首块硬盘温度", "value": "--", "unit": "℃" },
        "disk_temperature_last": { "id": "disk_temperature_last", "name": "末块硬盘温度", "value": "--", "unit": "℃" },
        "disk_disk_size": { "id": "disk_disk_size", "name": "硬盘容量", "value": "--", "unit": "" }
      },
      particles: []
    };
  },
  mounted() {
    this.createParticles();
    // 初始化数据更新
    // this.startDataUpdate();

    const dataUpdateLoop = async () => {
        const data = await window.ipcRenderer.invoke('get-system-monitor-data');
        
        if (data['cpu_usage']) {
          this.cpuValue = `${data['cpu_usage'].toFixed(0)}%`;
          this.cpuProgress = data['cpu_usage'];
        }
        
        if (data['mem_percentage']) {
          this.memoryValue = `${data['mem_percentage'].toFixed(0)}%`;
          this.memoryProgress = data['mem_percentage'];
        }
        
        for (const metric in data) {
          if (metric in this.systemInfo) {
            let value = data[metric];
            if (Number.isFinite(value)) {
              value = value.toFixed(1);
            }
            this.systemInfo[metric].value = value;
          }
        }

        this.lastUpdateTime = new Date().toLocaleString();

        setTimeout(dataUpdateLoop, 1000)
    }

    dataUpdateLoop();

  },
  beforeUnmount() {
    // 清理定时器
    // if (this.updateTimer) {
    //   clearInterval(this.updateTimer);
    // }
  },
  methods: {
    toggleCard() {
      this.isFlipped = !this.isFlipped;
      this.updateCardTransform();
    },
    
    flipBack() {
      this.isFlipped = false;
      this.updateCardTransform();
    },
    
    updateCardTransform() {
      const card = this.$refs.dashboardCard;
      if (!card) return;
      
      if (this.isFlipped) {
        card.style.transform = 'rotateY(180deg)';
      } else {
        card.style.transform = 'rotateY(0deg)';
      }
    },
    
    handleMouseMove(event) {
      if (!this.$refs.dashboardCard) return;
      
      const card = this.$refs.dashboardCard;
      const cardRect = card.getBoundingClientRect();
      const centerX = cardRect.left + cardRect.width / 2;
      const centerY = cardRect.top + cardRect.height / 2;
      
      const REACTION_RATIO = 0.04;
      
      let rotateY = (event.clientX - centerX) * REACTION_RATIO;
      let rotateX = (centerY - event.clientY) * REACTION_RATIO;
      
      if (this.isFlipped) {
        rotateY += 180;
        rotateX *= -1;
      }
      
      card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(20px)`;
    },
    
    handleMouseLeave() {
      if (!this.$refs.dashboardCard) return;
      
      if (this.isFlipped) {
        this.$refs.dashboardCard.style.transform = 'rotateY(180deg) rotateX(0deg) translateZ(0)';
      } else {
        this.$refs.dashboardCard.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0)';
      }
    },
    
    createParticles() {
      const container = this.$refs.particlesContainer;
      if (!container) return;
      
      const particleCount = 20;
      this.particles = [];
      
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
        
        container.appendChild(particle);
        this.particles.push(particle);
      }
    },
    
    highlightItem(id) {
      // 高亮效果逻辑
      console.log(`Highlight item: ${id}`);
    },
    
    // 数据更新方法（待实现）
    async updateMetrics() {
      // 这里可以连接后端API获取实时数据
      // const metrics = await this.systemMonitorClient.getAllMetrics();
      // 更新对应的响应式数据
    },
    
    // 定时更新数据
    startDataUpdate() {
      // this.updateTimer = setInterval(() => {
      //   this.updateMetrics();
      // }, 10000);
    }
  }
};
</script>

<style>
/* 样式保持不变，同原代码 */
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

.dashboard-container {
  width: 320px;
  height: 420px;
  perspective: 1200px;
  position: relative;
  filter: drop-shadow(0 0 20px rgba(0, 150, 255, 0.3));
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: -1;
  /* pointer-events: none; */
}

.particle {
  position: absolute;
  background: rgba(0, 200, 255, 0.3);
  border-radius: 50%;
  filter: blur(1px);
}

.dashboard-card {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 20px;
  cursor: default;
}

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

.toggle-btn {
  position: relative;
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

.content {
  padding: 20px;
  height: calc(100% - 70px);
  overflow-y: auto;
  /* 修复鼠标滚轮问题 */
  -webkit-overflow-scrolling: auto;
  transform: translateZ(0);
  will-change: transform;
  transform-style: flat;
  -webkit-transform-style: flat; /* 关键：强制使用 2D 变换 */
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
  transition: width 1.5s linear;
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
  cursor: pointer;
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

@media (max-width: 400px) {
  .dashboard-container {
    width: 300px;
    height: 400px;
  }
  
  .content {
    padding: 15px;
  }
}
</style>