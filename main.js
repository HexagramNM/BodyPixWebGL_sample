var backgroundColor = {r: 50, g: 0, b: 0};
var backgroundColorCode = "#" + backgroundColor.r.toString(16).padStart(2, "0")
    + backgroundColor.g.toString(16).padStart(2, "0") + backgroundColor.b.toString(16).padStart(2, "0");

async function BodyPixWebGL_startProcess() {
    removeEventListener("click", BodyPixWebGL_startProcess);
    var easyInst = document.getElementById("easyInst");
    easyInst.style.display = "none";
    var elapsedTime = document.getElementById("elapsedTime");
    elapsedTime.style.display = "";
    var mediaStream;
    var videoStream;
    var audioStream;
    try {
        //Webカメラとvideoタグとの関連づけ
        //https://qiita.com/chelcat3/items/02c77b55d080d770530a
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                //virtualBackCanvasSizeはbodyPixPart.jsからの変数
                width: {ideal: virtualBackCanvasSize[0]},
                height: {ideal: virtualBackCanvasSize[1]}
            }
        });
    }
    catch (err) {
        //ユーザに拒否されたなど、カメラ、マイクを取得できなかった場合
        return;
    }

    await webGLPart_init();
    await BodyPixPart_init(mediaStream);
    webGLPart_main();
    BodyPixPart_main();
}

function BodyPixWebGL_main() {
    document.bgColor=backgroundColorCode;
    addEventListener("click", BodyPixWebGL_startProcess);
}
