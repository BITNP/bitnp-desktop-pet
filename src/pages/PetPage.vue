<template>
    <div class="main-container">
        <div class="danmuku-area" ref="danmukuArea"></div>
        <div id="DEBUG" style="position: fixed; left: 0; top: 0;"></div>
        <audio ref="audioPlayer" src="" hidden></audio>

        <div class="data-outer-container">
            <div ref="dataInnerContainer" class="animated-container data-inner-container hidden">
                <!-- <div class="data-pad" style="padding: 20px; color: white;">
                    <h1>测试数据</h1>
                    <h2>123%</h2>
                </div> -->
                <Dashboard/>
            </div>
        </div>

        <div ref="videoContainer" class="animated-container video-container">
            <video id="main-video-player" autoplay="true" class="main-video-player"></video>
        </div>

    </div>
</template>

<script>
import VideoStreamManager from '@/avatar-animation/VideoStreamManager.js'
import Dashboard from '@/components/dashboard.vue'
// let pixiApp = null;

let animationState = "standing";
let prevAnimationState = "standing";

async function fetchVideoData(segmentUrl) {
    const response = await fetch(segmentUrl);
    const videoData = await response.arrayBuffer();
    return videoData;
}

function setAnimationState(state) {
    console.log("setAnimationState", state);
    animationState = state;
}


// TODO
function getPixelColorAtMouse(video, mouseX, mouseY) {
    // 创建canvas和上下文
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // 设置canvas尺寸与video相同
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 将当前视频帧绘制到canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 计算鼠标位置相对于video元素的坐标
    const videoRect = video.getBoundingClientRect();
    const scaleX = canvas.width / videoRect.width;
    const scaleY = canvas.height / videoRect.height;
    
    const canvasX = Math.floor((mouseX - videoRect.left) * scaleX);
    const canvasY = Math.floor((mouseY - videoRect.top) * scaleY);
    
    // 边界检查
    if (canvasX < 0 || canvasX >= canvas.width || 
        canvasY < 0 || canvasY >= canvas.height) {
        return null;
    }
    
    // 获取像素数据
    const pixelData = ctx.getImageData(canvasX, canvasY, 1, 1).data;
    
    // 返回RGBA格式
    return {
        r: pixelData[0],
        g: pixelData[1],
        b: pixelData[2],
        a: pixelData[3], // 0~255
        // rgba: `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`,
        // hex: `#${((1 << 24) + (pixelData[0] << 16) + (pixelData[1] << 8) + pixelData[2]).toString(16).slice(1)}`
    };
}


// for mouse penetration
let prevShouldIgnoreMouse = false;
const checkMousePosition = async (data) => {
    const { x, y } = data
    
    // 更新鼠标位置
    // mouseX.value = x
    // mouseY.value = y
    
    // 检查元素
    const elements = document.elementsFromPoint(x, y)

    const ignoredTagNames = ["html", "body"]

    let shouldIgnoreMouse = true;
    let debugAlpha = undefined;

    for (const element of elements) {
        if (ignoredTagNames.includes(element.tagName.toLowerCase())) {
            continue
        }

        if (element.classList.contains('mouse-interactive')) {
            shouldIgnoreMouse = false;
            break;
        }

        if (element.tagName.toLowerCase() === 'button') {
            shouldIgnoreMouse = false;
            break;
        } else if (element.tagName.toLowerCase() === 'video') {
            const ALPHA_THRESHOLD = 10;

            const pixel = getPixelColorAtMouse(element, x, y);
            const alpha = pixel.a;
            if (alpha > ALPHA_THRESHOLD) {
                shouldIgnoreMouse = false;
                break;
            } else {
                shouldIgnoreMouse = true;
            }

        } else if (element.tagName.toLowerCase() === 'canvas') {
            const canvas = element;
            const rect = canvas.getBoundingClientRect();
            
            // 将视口坐标转换为canvas局部坐标
            const canvasX = x - rect.left;
            const canvasY = y - rect.y;
            
            // 检查坐标是否在canvas范围内
            if (canvasX >= 0 && canvasX < canvas.width && canvasY >= 0 && canvasY < canvas.height) {
                window.canvas = canvas // DEBUG

                // const ctx = canvas.getContext('webgl2');
                // const glY = canvas.height - canvasY - 1;
                // const pixel = new Uint8Array(4);
                
                // // function waitForRender() {
                // //     return new Promise(resolve => {
                // //         pixiApp.render(); // 强制渲染
                // //         resolve();
                // //     });
                // // }
                // // await waitForRender()

                // ctx.readPixels(
                //     Math.floor(canvasX),
                //     Math.floor(glY),
                //     1, 1,
                //     ctx.RGBA,
                //     ctx.UNSIGNED_BYTE,
                //     pixel
                // );

                // TODO: get alpha with 2d canvas context
                
                const ctx = canvas.getContext('2d');
                const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;

                const alpha = pixel[3];
                debugAlpha = alpha;
                
                // 设置透明度阈值（例如：10，对应约4%的透明度）
                const ALPHA_THRESHOLD = 10;

                // document.getElementById("DEBUG").innerHTML = `${canvasX}, ${canvasY}; ${debugAlpha}`;
                
                if (alpha > ALPHA_THRESHOLD) {
                    shouldIgnoreMouse = false;
                    break;
                }

                const canvasId = canvas.getAttribute("id")
                
            }
            // 如果坐标不在canvas范围内或透明度低于阈值，继续检查下一个元素
        }
    }
    
    let debugMessage = `checkMousePosition (${x}, ${y}) ${shouldIgnoreMouse} ${debugAlpha}`
    
    // 通知主进程
    if (shouldIgnoreMouse != prevShouldIgnoreMouse) {
        prevShouldIgnoreMouse = shouldIgnoreMouse
        window.ipcRenderer?.send('set-ignore-mouse-events', shouldIgnoreMouse)
        debugMessage += " set-ignore-mouse-events sent"
    }
    
    // document.getElementById("DEBUG").innerHTML = debugMessage // DEBUG
    
}

export default {
    components: {
        Dashboard
    },
    data() {
        return {
            debug: false,

            mouseDown: false,
            dragging: false

        };
    },

    methods: {
        clickPet() {
            // TODO: 设置 div 元素的 transform 动画
            console.log("click pet")
            if (animationState === "standing") {
                this.$refs.dataInnerContainer.classList.remove("hidden");
                this.$refs.videoContainer.classList.add("to-right");
                setAnimationState("ipad");
            } else {
                this.$refs.dataInnerContainer.classList.add("hidden");
                this.$refs.videoContainer.classList.remove("to-right");
                setAnimationState("standing");
            }
        },

        handleMouseDown(event){
            this.mouseDown = true;
            this.dragging = false;
            window.ipcRenderer?.send('drag-start', event.screenX, event.screenY);
        },

        handleMouseUp(event){
            this.mouseDown = false;
            // if (!this.dragging) {
            //     this.clickPet()
            // }
            window.ipcRenderer?.send('drag-end');
        },

        handleMouseMove(event){
            if (this.mouseDown) {
                this.dragging = true;
                window.ipcRenderer?.send('drag-move', event.screenX, event.screenY);
            }
        },

        updateFocus(data) {
            // ...
        }

    },

    mounted() {
        const self = this;

        // for ipc
        window.ipcRenderer?.on('check-mouse-position', checkMousePosition)
        // window.ipcRenderer?.on('update-focus', (data) => self.updateFocus(data))


        // const avatarAnimationConfig = {
        //     "standing": {
        //         // "dir": "anim1",
        //         "video": "/Resources/animation/anim1.webm",
        //         "fps": 30,
        //         "totalFrames": 94
        //     },
        //     "transfer:standing->ipad": {
        //         "video": "/Resources/animation/anim2.webm",
        //         "fps": 30,
        //         "totalFrames": 103
        //     },
        //     "ipad": {
        //         "video": "/Resources/animation/anim3.webm",
        //         "fps": 30,
        //         "totalFrames": 112
        //     }
        // }

        const mainVideoPlayer = document.getElementById("main-video-player");
        const videoStreamManager = new VideoStreamManager(mainVideoPlayer);


        document.addEventListener("mousedown", (e => self.handleMouseDown(e)));
        document.addEventListener("mouseup", (e => self.handleMouseUp(e)));
        document.addEventListener("mousemove", (e => self.handleMouseMove(e)));

        const videoDataBank = {};
        // fetch videos
        const promises = [
            fetchVideoData("/Resources/animation/standing.webm").then((data) => { videoDataBank["standing"] = data }),
            fetchVideoData("/Resources/animation/transfer-pos.webm").then((data) => { videoDataBank["transfer-pos"] = data }),
            fetchVideoData("/Resources/animation/transfer-neg.webm").then((data) => { videoDataBank["transfer-neg"] = data }),
            fetchVideoData("/Resources/animation/ipad.webm").then((data) => { videoDataBank["ipad"] = data })
        ]

        Promise.all(promises).then(async () => {   
            // 初始化为站立待机动画
            videoStreamManager.appendVideoData(videoDataBank["standing"]);

            // 当buffer中视频较少时，检查动画状态并向buffer中缓冲下一段动画视频数据
            videoStreamManager.addEventListener("bufferlow", () => {
                let videoName;
                if (animationState === "standing") {
                    if (prevAnimationState !== animationState) {
                        videoName = "transfer-neg";
                    } else {
                        videoName = "standing";
                    }
                } else if (animationState === "ipad") {
                    if (prevAnimationState !== animationState) {
                        videoName = "transfer-pos";
                    } else {
                        videoName = "ipad";
                    }
                }
                prevAnimationState = animationState;
                videoStreamManager.appendVideoData(videoDataBank[videoName]);
            });
        });

        this.$refs.videoContainer.addEventListener('mouseup', () => {
            // 桌宠部分点击交互
            if (!this.dragging) {
                self.clickPet();
            }
        });

    },
};
</script>

<style>
#app {
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    text-align: center;
    color: #2c3e50;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

.video-container {
    position: fixed;
    width: 60vw;
    right: 5vw;
    aspect-ratio: 9/16;
}


.video-container.to-right {
    width: 50vw;
    right: 0;
}

.main-video-player {
    width: 100%;
    aspect-ratio: 9/16;
}

.animated-container {
    transition: all 1s ease;
}

.data-outer-container {
    position: fixed;
    width: 50vw;
    height: 100vh;
    left: 0;
    perspective: 1000px;
    transform-style: preserve-3d;
    /* border: 1px solid black; */
}

.data-inner-container {
    /* position: relative; */
    height: 50%;
    width: 100%;
    /* border: 1px solid blue; */
    /* transform: rotateY(-15deg) rotateX(-10deg); */
    transform: rotateY(0deg) rotateX(0deg);
    opacity: 1;
    padding-left: 10%;
    padding-right: 10%;
    padding-top: 20%;
}


.data-inner-container.hidden {
    transform: rotateY(180deg) rotateX(90deg) scale(0.1);
    opacity: 0;
}

.data-pad {
    position: relative;
    margin-left: 10%;
    margin-top: 25%;
    height: 50%;
    width: 80%;
    background: rgb(118, 209, 255);
    border-radius: 30px;
    border: 1px solid rgb(0, 12, 54);
}

</style>