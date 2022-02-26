//設定変数
var virtualBackCanvasSize = {width: 480, height: 360};
var virtualBackTextureSize = 512;
var mapTextureXToCanvas = new Array(virtualBackTextureSize);
var mapTextureYToCanvas = new Array(virtualBackTextureSize);

var bodyPixNet = null;
var videoComponent = null;
var intermediateCanvas = null;
var intermediateCanvasCtx = null;
var virtualBackTextureCanvas = null;
var virtualBackTextureCanvasCtx = null;
var processedSegmentResult = null;
var bodyPixTimeSum = 0.0;
var bodyPixTimeCount = 0;
var bodyPixTimeSamples = 30;

function BodyPixPart_drawTextureCanvas(i_ctxInputImage, i_processedSegmentResult) {
    var inputBytes = i_ctxInputImage.data;
    var outputImageData = new ImageData(virtualBackTextureSize, virtualBackTextureSize);
    var outputBytes = outputImageData.data;
    var outputPixIdx = 0;
    for (var y = 0; y < virtualBackTextureSize; y++) {
        var yInputIdx = mapTextureYToCanvas[y] * virtualBackCanvasSize.width;
        for (var x = 0; x < virtualBackTextureSize; x++) {
            var inputPixIdx = yInputIdx + mapTextureXToCanvas[x];
            var byteBaseInputIdx = 4 * inputPixIdx;
            var byteBaseOutputIdx = 4 * outputPixIdx;

            for (var colorIdx = 0; colorIdx < 3; colorIdx++) {
                outputBytes[byteBaseOutputIdx + colorIdx] = inputBytes[byteBaseInputIdx + colorIdx]
            }
            if (i_processedSegmentResult.data[inputPixIdx] == 1) {
                outputBytes[byteBaseOutputIdx + 3] = 255;
            }
            else {
                outputBytes[byteBaseOutputIdx + 3] = 0;
            }
            outputPixIdx++;
        }
    }
    outputImageData.data = outputBytes;
    virtualBackTextureCanvasCtx.putImageData(outputImageData, 0, 0);
}

async function BodyPixPart_init(videoStream) {
    for (var idx = 0; idx < virtualBackTextureSize; idx++) {
        mapTextureXToCanvas[idx] = parseInt(idx * virtualBackCanvasSize.width / virtualBackTextureSize + 0.5);
        mapTextureYToCanvas[idx] = parseInt(idx * virtualBackCanvasSize.height / virtualBackTextureSize + 0.5);
    }

    virtualBackTextureCanvas = document.getElementById("virtualBackTexture");
    virtualBackTextureCanvas.width = virtualBackTextureSize;
    virtualBackTextureCanvas.height = virtualBackTextureSize;
    virtualBackTextureCanvasCtx = virtualBackTextureCanvas.getContext("2d");

    intermediateCanvas = document.getElementById("intermediate");
    intermediateCanvas.width = virtualBackCanvasSize.width;
    intermediateCanvas.height = virtualBackCanvasSize.height;
    intermediateCanvasCtx = intermediateCanvas.getContext("2d");

    bodyPixNet = await bodyPix.load( {
        architecture: "MobileNetV1",
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 4
    });
    videoComponent = document.getElementById("video");
    videoComponent.width = virtualBackCanvasSize.width;
    videoComponent.height = virtualBackCanvasSize.height;
    videoComponent.autoplay = true;
    videoComponent.srcObject = videoStream;

    bodyPixTimeSum = 0.0;
    bodyPixTimeCount = 0;
}

async function BodyPixPart_main() {
    var startTime = performance.now();
    var ctxIntermediateImage = intermediateCanvasCtx.getImageData(0, 0, virtualBackCanvasSize.width, virtualBackCanvasSize.height);
    intermediateCanvasCtx.drawImage(videoComponent, 0, 0, virtualBackCanvasSize.width, virtualBackCanvasSize.height);

    var bodyPixPromise = bodyPixNet.segmentPerson(intermediateCanvas, {
        flipHorizontal: false
    });
    if (processedSegmentResult) {
        BodyPixPart_drawTextureCanvas(ctxIntermediateImage, processedSegmentResult);
    }
    processedSegmentResult = await bodyPixPromise;
    var endTime = performance.now();
    bodyPixTimeSum += (endTime - startTime);
    bodyPixTimeCount++;

    if (bodyPixTimeCount >= bodyPixTimeSamples) {
        document.getElementById("elapsedTimeBodyPix").innerHTML = (bodyPixTimeSum / bodyPixTimeSamples).toFixed(2);
        bodyPixTimeSum = 0.0;
        bodyPixTimeCount = 0;
    }

    setTimeout(arguments.callee, 1000/60);
}
