<template>
    <div>
        <div class="danmuku-area" ref="danmukuArea"></div>
        <div id="DEBUG" style="position: fixed; left: 0; top: 0;"></div>
        <audio ref="audioPlayer" src="" hidden></audio>

        <!-- <div class="drag-box draggable"
            @mouseenter="enableClickThrough"
            @mouseleave="disableClickThrough"
        ></div> -->

        <div class="canvas-container">
            <canvas ref="mainCanvas" id="mainCanvas" class="main_canvas"></canvas>
        </div>
    </div>
</template>

<script>
import Live2dController from '@/live2d-controller/Live2dController';
import LIVE2D_CONFIG from '@/agent-presets/shumeiniang/live2dConfig.js'
// import FrontendAgent from '@/ws-client/FrontendAgent';
// import Subtitle from '@/components/Subtitle.vue';
// import StreamAudioPlayer from '@/components/StreamAudioPlayer.js';

let pixiApp = null;

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

        /* PLEASE COMPLETE THIS CODE BLOCK */
        if (element.tagName.toLowerCase() === 'button') {
            shouldIgnoreMouse = false;
            break;
        }

        if (element.tagName.toLowerCase() === 'canvas') {
            const canvas = element;
            const rect = canvas.getBoundingClientRect();
            
            // 将视口坐标转换为canvas局部坐标
            const canvasX = x - rect.left;
            const canvasY = y - rect.y;
            
            // 检查坐标是否在canvas范围内
            if (canvasX >= 0 && canvasX < canvas.width && canvasY >= 0 && canvasY < canvas.height) {
                window.canvas = canvas // DEBUG

                const ctx = canvas.getContext('webgl2');
                const glY = canvas.height - canvasY - 1;
                const pixel = new Uint8Array(4);
                
                function waitForRender() {
                    return new Promise(resolve => {
                        pixiApp.render(); // 强制渲染
                        resolve();
                    });
                }
                await waitForRender()

                ctx.readPixels(
                    Math.floor(canvasX),
                    Math.floor(glY),
                    1, 1,
                    ctx.RGBA,
                    ctx.UNSIGNED_BYTE,
                    pixel
                );
                
                const alpha = pixel[3];
                debugAlpha = pixel;
                
                // 设置透明度阈值（例如：10，对应约4%的透明度）
                const ALPHA_THRESHOLD = 10;
                
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
        // Subtitle
    },
    data() {
        return {
            // microphoneOn: false,
            debug: false,
            audioEnabled: false, // The user needs to interact with the page (by clicking the button) to enable audio

            imageSrc: "",
            // inputText: "",
            subtitleHidden: true, // 是否隐藏字幕

            mouseDown: false,
            dragging: false

            // app vars
            // showConfigUI: false,
            // enableDictation: false,
            // enableFullScreen: false,
        };
    },

    methods: {
        clickPet() {
            const animNames = ["点头", "摇头", "wink"];
            // play random animation
            const animName = animNames[Math.floor(Math.random() * animNames.length)];
            this.live2dController.launchFaceParamExpression(animName);
        },

        handleMouseDown(event){
            this.mouseDown = true;
            this.dragging = false;
            window.ipcRenderer?.send('drag-start', event.screenX, event.screenY);
        },

        handleMouseUp(event){
            this.mouseDown = false;
            if (!this.dragging) {
                this.clickPet()
            }
            window.ipcRenderer?.send('drag-end');
        },

        handleMouseMove(event){
            if (this.mouseDown) {
                this.dragging = true;
                window.ipcRenderer?.send('drag-move', event.screenX, event.screenY);
            }
        },

        updateFocus(data) {
            const {windowX, windowY, cursorX, cursorY} = data;
            const relX = cursorX - (windowX + (window.innerWidth * 0.5));
            const relY = -(cursorY - (windowY + (window.innerHeight * 0.4)));

            const clip = (val, min, max) => (val < min) ? min : (val > max) ? max : val

            const x = clip(relX / 200, -1, 1);
            const y = clip(relY / 200, -1, 1);


            this.live2dController.focus(x, y);
            console.log("updataFocus", x, y);
        }

    },

    mounted() {
        const self = this;

        // for ipc
        window.ipcRenderer?.on('check-mouse-position', checkMousePosition)
        window.ipcRenderer?.on('update-focus', (data) => self.updateFocus(data))

        // shumeiniang Live2d controller
        const config = LIVE2D_CONFIG;
        config.canvas = this.$refs.mainCanvas;
        config.enableFocus = true;
        console.log(config)
        const live2dController = new Live2dController(config);
        live2dController.setup();
        pixiApp = live2dController.app;
        this.live2dController = live2dController;

        document.addEventListener("mousedown", (e => self.handleMouseDown(e)))
        document.addEventListener("mouseup", (e => self.handleMouseUp(e)))
        document.addEventListener("mousemove", (e => self.handleMouseMove(e)))

        // const serverUrl = "localhost:8000"
        // const agentName = "shumeiniang"
        // const client = new FrontendAgent(serverUrl, agentName);
        // client.connect();

        // this.wsClient = client;

        // const audioBank = new AudioBank();
        // this.audioBank = audioBank;

        // const streamAudioPlayer = new StreamAudioPlayer();
        // this.streamAudioPlayer = streamAudioPlayer;

        // live2dController.setLipSyncFunc(() => {
        //     return streamAudioPlayer.volume;
        // });

        // const eventQueue = [];
        // client.on("message", (message) => {
        //     console.log("on message", message);
        //     if (message.detail && message.detail.data && message.detail.data.type) {
        //         const event = message.detail.data
        //         const type = event.type;
        //         if (type === "say_aloud") {
        //             if (!streamAudioPlayer.isStreaming) {
        //                 streamAudioPlayer.startStream()
        //             }
        //             const mediaData = event["media_data"];
        //             streamAudioPlayer.addWavData(mediaData)
        //             .then(id => {
        //                 event["media_id"] = id;
        //             });
        //         }
        //     }

        //     eventQueue.push(message);
        // });

        // const subtitle = this.$refs.subtitle;

        // async function handleSayAloud(message) {

        //     // subtitle text udpate
        //     subtitle.addDelta(message.content);

        //     // play audio
        //     const mediaId = message["media_id"];
        //     await streamAudioPlayer.waitUntilFinish(mediaId);
        // }

        // async function handleBracketTag(message) {
        //     // TOOD
        //     live2dController.setExpression(message.content);
        // }

        // let in_response = false;

        // async function processEventQueue() {
        //     try {
        //         if (eventQueue.length === 0) {
        //             requestAnimationFrame(processEventQueue);
        //             return
        //         }

        //         const event = eventQueue.shift();
        //         const message = event.detail.data;

        //         console.log("processing message from server:", message); // DEBUG

        //         if (!message.type) {
        //             return;
        //         }

        //         if (message.type === "say_aloud") {
        //             await handleSayAloud(message);
        //         } else if (message.type === "bracket_tag") {
        //             await handleBracketTag(message);
        //         } else if (message.type === "start_of_response") {
        //             // start of response
        //             self.showSubtitle();
        //             in_response = true;
        //         } else if (message.type === "end_of_response") {
        //             // end of response
        //             in_response = false;
        //             console.log("end of response", message.response);
        //             setInterval(() => {
        //                 if (!in_response) {
        //                     self.hideSubtitle();
        //                 }
        //             }, 1000);
        //         }
        //     } catch (error) {
        //         console.error("Error processing event:", error);
        //     }
        //     requestAnimationFrame(processEventQueue);
        // }
        // processEventQueue();

        // this.$refs.inputArea?.addEventListener("keydown", (e) => {
        //     if (e.key === "Enter") {
        //         // 清空事件队列
        //         while (eventQueue.length > 0) {
        //             eventQueue.shift();
        //         }
        //         // audioBank.clear();
        //         this.recordChat(this.inputText);
        //         this.inputText = "";
        //     }
        // });


        // // subtitle scroll
        // const subtitleInnerContainer = this.$refs.subtitleInnerContainer;

        // const scrollToBottomLoop = () => {
        //     // loop scroll subtitleInnerContainer to bottom (in smooth behavior)
        //     const currentScrollTop = subtitleInnerContainer.scrollTop + subtitleInnerContainer.clientHeight;
        //     const targetScrollTop = subtitleInnerContainer.scrollHeight;
        //     if (currentScrollTop < targetScrollTop) {
        //         subtitleInnerContainer.scrollTo({
        //             top: targetScrollTop,
        //             behavior: "smooth",
        //         });
        //     }
        //     requestAnimationFrame(scrollToBottomLoop);
        // }
        // scrollToBottomLoop();
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
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}
.drag-box {
    background: yellow;
    position: fixed;
    left: 25vw;
    bottom: 0;
    width: 50vw;
    height: 75vh;
}

.draggable {
  -webkit-app-region: drag;  /* 启用窗口拖拽 */
  user-select: none;         /* 可选：防止文本被选中 */
}

.danmuku-area {
    position: fixed;
    width: 30vw;
    height: 100vh;
    /* border: 1px solid black; */
    overflow-y: scroll;
}
.danmuku-area::-webkit-scrollbar {
    display: none;
}

.canvas-container {
    box-sizing: content-box;
    position: fixed;
    margin: 0;
    padding: 0;
    /* display: flex; */
    /* 使用flex布局 */
    width: 100%;
    /* 充满屏幕宽度 */
    height: 100vh;
    /* 充满屏幕高度 */
}

.left-section,
.right-section {
    flex: 1;
    /* 均等分配空间 */
    height: 100%;
    /* 继承容器高度 */
    position: relative;
}

.main_canvas {
    position: fixed;
    margin: 0;
    padding: 0;
    width: 100vw; /* modified */
    height: 100vh;
    left: 0;
    top: 0;
}

.canvas {
    position: absolute;
    margin: 0;
    padding: 0;
    display: block;
    /* 避免canvas默认inline带来的空白间隙 */
    width: 100%;
    /* 充满父容器 */
    height: 100%;
    /* 充满父容器 */

    opacity: 1;
    transform: translateX(0);
    transition: opacity 0.5s ease, transform 0.5s ease;
}

.canvas_hidden {
    transform: translateX(-50px);
    opacity: 0;
}



.user-interface {
    z-index: 999999;
    position: fixed;
    width: 90vw;
    /* 1vw = 视口宽的的1% */
    max-width: 600px;
    left: 50vw;
    top: 100vh;
    transform: translate(-50%, -150%);
    /* border: 1px solid black; */
    /* background-color: yellow; */
    /* -webkit-app-region: drag; */
}

.user-interface>* {
    border-radius: 10px;
    margin: 10px;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    font-size: 2em;
}

.user-interface>input {
    width: 80%;
    max-width: 800px;
}


.subtitle-container {
    position: fixed;
    z-index: 100;
    margin: 0;
    left: 15vw;
    right: 10vw;
    width: 70vw;
    aspect-ratio: 1402 / 333;
    bottom: 5vh;

    display: grid;
    grid-template-rows: 30% 70%;
    /* margin-right: 10%; */

    /* padding-bottom: 100px; */
    padding-top: 1px;
    padding-left: 20px;
    padding-right: 20px;

    text-align: left;

    
    background-image: url("@/assets/tooltip-galgame.png");
    background-size: 100% 100%;
    background-repeat: no-repeat;

    opacity: 1;
    z-index: 1000;
    transform-style: preserve-3d;
    /* transform: rotateY(20deg) rotateX(-20deg) translate(100px, -300px); */
    transition: opacity 0.5s ease, transform 0.5s ease;
}

.subtitle-container-hidden {
    opacity: 0;
    transform: rotateY(20deg) rotateX(90deg) translate(0, 0);
    transition: opacity 0.5s ease, transform 0.5s ease;
    animation: subtitle-hide 0.5s ease-out;
}

.subtitle-inner-container {
    /* position: relative; */
    /* margin-left: 10%; */
    /* margin-top: 10%; */
    width: 100%;
    height: 100%;
    overflow-y: scroll;
}
.subtitle-inner-container::-webkit-scrollbar {
  display: none; /* 完全隐藏滚动条 */
}

.subtitle-text {
    font-size: 2em;
    font-weight: 500;
    user-select: none;
    color: rgb(0, 0, 0);
}


</style>