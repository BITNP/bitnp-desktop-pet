import * as PIXI from "pixi.js"

export default class PixiAvatarAnimationController {

    /**
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        // 使用传入的 canvas 作为 Pixi 渲染目标（否则 Pixi 会生成一个新的 canvas，页面上看不到内容）
        this.app = new PIXI.Application({
            view: canvas,
            width: canvas.width,
            height: canvas.height,
            transparent: true,
            backgroundColor: 0x000000,
            backgroundAlpha: 0,
            forceCanvas: false
            
        });
        
        canvas.pixiApp = this.app;
        
        this.canvas = canvas;
        this.videos = new Map(); // 存储预加载的视频
        this.currentVideo = null;
        this.nextVideo = null;
        this.isSwitching = false;

        this.videoQueue = new Array();
        this._autoSwitchHandler = () => {};
    }

    // 预加载视频（支持首尾帧匹配检查）
    /**
     * 
     * @param {{name: string, url: string}[]} videoList
     */
    async preloadVideos(videoList) {
        const promises = videoList.map(({ name, url }) => 
            this.loadVideo(name, url, { autoPlay: false })
        );

        await Promise.all(promises);
    }

    // 加载单个视频
    async loadVideo(name, url, options = {}) {
        return new Promise((resolve, reject) => {
            if (this.videos.has(name)) {
                resolve(this.videos.get(name));
                return;
            }

            const videoTexture = PIXI.Texture.from(url, {
                resourceOptions: {
                    autoPlay: false,
                    muted: true,
                    preload: 'auto',
                }
            });

            const videoSprite = new PIXI.Sprite(videoTexture);
            const videoElement = videoTexture.baseTexture.resource.source;
            
            // 初始隐藏
            videoSprite.visible = false;
            videoSprite.name = name;
            this.app.stage.addChild(videoSprite);

            const videoObj = {
                name,
                sprite: videoSprite,
                texture: videoTexture,
                element: videoElement,
                duration: 0,
                isReady: false
            };

            this.videos.set(name, videoObj);

            // 等待视频完全加载
            videoElement.addEventListener('loadeddata', () => {
                videoObj.duration = videoElement.duration;
                videoObj.isReady = true;
                
                // 预加载到最后一帧，确保可立即切换
                this.seekToEndFrame(videoElement).then(() => {
                    // 跳回开始
                    videoElement.currentTime = 0;
                    videoElement.pause();
                    resolve(videoObj);
                });

                videoSprite.width = this.canvas.width;
                videoSprite.height = this.canvas.height;
            });

            videoElement.addEventListener('error', reject);
        });
    }

    // 预加载到最后一帧
    async seekToEndFrame(videoElement) {
        return new Promise((resolve) => {
            // 快进到结束前一点
            videoElement.currentTime = videoElement.duration - 0.1;
            
            const checkCanPlay = () => {
                if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                    videoElement.removeEventListener('timeupdate', checkCanPlay);
                    resolve();
                }
            };
            
            videoElement.addEventListener('timeupdate', checkCanPlay);
        });
    }

    // 直接硬切（无过渡）
    switchTo(name) {
        // if (this.currentVideo?.name === name) return;

        // 卸载当前自动切换监听
        this._detachAutoSwitchListener();
        
        const video = this.videos.get(name);
        const prevVideo = this.currentVideo;
        if (video) {

            this.currentVideo = video;
            
            // 继续监听当前视频进度，支持队列自动切换
            
            const self = this;
            video.element.addEventListener("seeked", () => {
                video.sprite.visible = true; // 显示下一段视频
                requestAnimationFrame(() => {
                    self.videos.forEach((v) => {
                        if (v.name !== video.name) { // 隐藏其他视频
                            v.sprite.visible = false;
                            v.element.pause();
                        }
                    });
                });
            }, { once: true });
            
            video.element.currentTime = 0;
            video.element.play();
            this._attachAutoSwitchListener(video.element);
            
        }
    }
    
    // 将视频加入播放队列的末尾
    setNext(videoName) {
        if (!videoName) return;

        if (!this.videos.has(videoName)) {
            console.warn(`setNext: 视频 "${videoName}" 未预加载`);
        }

        if (this.videoQueue.includes(videoName)) return;
        this.videoQueue.push(videoName);
    }

    // 从队列中取出下一个，并开始播放
    _switchToNextInQueue() {
        
        let nextName = this.videoQueue.shift();
        if (!nextName) {
            // 默认循环
            nextName = this.currentVideo.name;
        }

        console.log("switchToNextInQueue", nextName);

        const nextVideo = this.videos.get(nextName);
        if (!nextVideo || !nextVideo.isReady) {
            console.warn(`队列中的视频 "${nextName}" 未准备好，跳到下一个`);
            return this._switchToNextInQueue();
        }

        // this.playVideoSeamlessly(nextName);
        this.switchTo(nextName);
    }

    // 绑定自动切换监听
    _attachAutoSwitchListener(videoElement) {
        if (!videoElement) return;
        this._detachAutoSwitchListener();

        this._autoSwitchHandler = () => {
            if (!this.currentVideo || this.currentVideo.element !== videoElement) return;
            const remaining = videoElement.duration - videoElement.currentTime;
            if (remaining <= 0.1) {
                this._switchToNextInQueue();
            }
            // console.log("auto switch handler alive", remaining)
        };

        videoElement.addEventListener('timeupdate', this._autoSwitchHandler);
    }

    // 卸载自动切换监听
    _detachAutoSwitchListener() {
        if (!this._autoSwitchHandler || !this.currentVideo) return;
        const el = this.currentVideo.element;
        el.removeEventListener('timeupdate', this._autoSwitchHandler);
        this._autoSwitchHandler = null;
    }

    // 获取视频时长
    getVideoDuration(name) {
        const video = this.videos.get(name);
        return video?.duration || 0;
    }

    // 检查视频是否准备好无缝切换
    isVideoReadyForSeamless(name) {
        const video = this.videos.get(name);
        return video?.isReady || false;
    }
}