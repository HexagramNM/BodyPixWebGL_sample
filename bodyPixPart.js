//設定変数
var intermediateCanvasSize = {width: 480, height: 360};
var virtualBackTextureSize = 512;
var mapTextureXToCanvas = new Array(virtualBackTextureSize);
var mapTextureYToCanvas = new Array(virtualBackTextureSize);

var bodyPixNet = null;
var videoComponent = null;
var intermediateCanvas = null;
var intermediateCanvasCtx = null;
var virtualBackTextureCanvas = null;
var virtualBackTextureCanvasCtx = null;
var virtualBackOutputImageBuf = new ArrayBuffer(virtualBackTextureSize * virtualBackTextureSize * 4);
var virtualBackOutputImageBuf8 = new Uint8ClampedArray(virtualBackOutputImageBuf);
var virtualBackOutputImageData = new Uint32Array(virtualBackOutputImageBuf);
var virtualBackOutputImage = new ImageData(virtualBackTextureSize, virtualBackTextureSize);
var processedSegmentResult = null;
var bodyPixTimeSum = 0.0;
var bodyPixTimeCount = 0;
var bodyPixTimeSamples = 30;

function BodyPixPart_drawTextureCanvas(i_ctxInputImage, i_processedSegmentResult) {
    var inputBytes = i_ctxInputImage.data;

    var outputPixIdx = 0;
    var resultColor = [0.0, 0.0, 0.0, 0.0]
    var resultColorUint32 = 0;
    for (var y = 0; y < virtualBackTextureSize; y++) {
        var yInputIdx = mapTextureYToCanvas[y] * intermediateCanvasSize.width;
        for (var x = 0; x < virtualBackTextureSize; x++) {
            var inputPixIdx = yInputIdx + mapTextureXToCanvas[x];
            var byteBaseInputIdx = 4 * inputPixIdx;
            var byteBaseOutputIdx = 4 * outputPixIdx;

            if (i_processedSegmentResult.data[inputPixIdx] == 1) {
                for (var colorIdx = 0; colorIdx < 3; colorIdx++) {
                    resultColor[colorIdx] = inputBytes[byteBaseInputIdx + colorIdx]
                }
                resultColor[3] = 255;
                resultColorUint32 = (resultColor[0] | (resultColor[1] << 8) | (resultColor[2] << 16) | (resultColor[3] << 24));
            }
            else {
                resultColorUint32 = 0x00;
            }
            virtualBackOutputImageData[outputPixIdx] = resultColorUint32;
            outputPixIdx++;
        }
    }
    virtualBackOutputImage.data.set(virtualBackOutputImageBuf8);
    virtualBackTextureCanvasCtx.putImageData(virtualBackOutputImage, 0, 0);
}

async function BodyPixPart_init(videoStream) {
    for (var idx = 0; idx < virtualBackTextureSize; idx++) {
        mapTextureXToCanvas[idx] = parseInt(idx * intermediateCanvasSize.width / virtualBackTextureSize + 0.5);
        mapTextureYToCanvas[idx] = parseInt(idx * intermediateCanvasSize.height / virtualBackTextureSize + 0.5);
    }

    virtualBackTextureCanvas = document.getElementById("virtualBackTexture");
    virtualBackTextureCanvas.width = virtualBackTextureSize;
    virtualBackTextureCanvas.height = virtualBackTextureSize;
    virtualBackTextureCanvasCtx = virtualBackTextureCanvas.getContext("2d");

    intermediateCanvas = document.getElementById("intermediate");
    intermediateCanvas.width = intermediateCanvasSize.width;
    intermediateCanvas.height = intermediateCanvasSize.height;
    intermediateCanvasCtx = intermediateCanvas.getContext("2d");

    bodyPixNet = await bodyPix.load( {
        architecture: "MobileNetV1",
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 4
    });
    videoComponent = document.getElementById("video");
    videoComponent.width = intermediateCanvasSize.width;
    videoComponent.height = intermediateCanvasSize.height;
    videoComponent.autoplay = true;
    videoComponent.srcObject = videoStream;

    bodyPixTimeSum = 0.0;
    bodyPixTimeCount = 0;
}

async function BodyPixPart_main() {
    var startTime = performance.now();
    var ctxIntermediateImage = intermediateCanvasCtx.getImageData(0, 0, intermediateCanvasSize.width, intermediateCanvasSize.height);
    intermediateCanvasCtx.drawImage(videoComponent, 0, 0, intermediateCanvasSize.width, intermediateCanvasSize.height);

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
