export default class VideoStreamManager extends EventTarget {
    constructor(videoElement) {
        super();
        this.video = videoElement;
        this.mediaSource = new MediaSource();
        this.video.src = URL.createObjectURL(this.mediaSource);
        
        this.pendingQueue = [];
        this.isUpdating = false;
        this.bufferLow = false;
        
        this.mediaSource.addEventListener('sourceopen', () => {
            this.sourceBuffer = this.mediaSource.addSourceBuffer('video/webm; codecs="vp9"');
            this.sourceBuffer.mode = 'sequence';
            
            // 移除原来的updateend监听器，避免重复触发
            // 现在只在executeAppend中添加一次性监听器
        }, { once: true });

        const self = this;
        function loop() {
            self.processQueue();
            self.checkBuffer();
            requestAnimationFrame(loop);
        }
        loop();
    }

    async appendVideoData(data) {
        return new Promise((resolve, reject) => {
            const task = { data, resolve, reject };
            
            if (!this.sourceBuffer) {
                this.pendingQueue.push(task);
                return;
            }
            
            if (this.isUpdating) {
                this.pendingQueue.push(task);
                return;
            }
            
            this.executeAppend(task);
        });
    }

    executeAppend(task) {
        this.isUpdating = true;
        
        try {
            this.sourceBuffer.appendBuffer(task.data);
            
            const onUpdateEnd = () => {
                this.isUpdating = false;
                this.checkBuffer();
                task.resolve();
                this.processQueue();
            };
            
            const onError = () => {
                this.isUpdating = false;
                this.checkBuffer();
                task.reject(new Error('appendBuffer failed'));
                this.processQueue();
            };
            
            // 使用一次性监听器
            this.sourceBuffer.addEventListener('updateend', onUpdateEnd, { once: true });
            this.sourceBuffer.addEventListener('error', onError, { once: true });
            
        } catch (error) {
            this.isUpdating = false;
            task.reject(error);
            this.processQueue();
        }
    }

    processQueue() {
        if (this.pendingQueue.length > 0 && !this.isUpdating) {
            const task = this.pendingQueue.shift();
            this.executeAppend(task);
        }
    }

    checkBuffer() {
        if (!this.video.buffered.length) return;
        
        const currentTime = this.video.currentTime;
        const bufferedEnd = this.video.buffered.end(0);
        
        const bufferLow = (bufferedEnd - currentTime < 0.1); // bool

        if (bufferLow && !this.bufferLow) {
            // 避免重复触发
            this.dispatchEvent(new CustomEvent('bufferlow'));
        }

        this.bufferLow = bufferLow;
    }
}