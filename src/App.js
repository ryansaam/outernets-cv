import { useRef, useEffect, useState, useCallback } from 'react'
import './App.css'
import '@tensorflow/tfjs'
import * as faceapi from '@vladmandic/face-api/dist/face-api.esm-nobundle.js'
import * as facemesh from '@tensorflow-models/face-landmarks-detection'
import * as poseDetection from '@tensorflow-models/pose-detection'
import Webcam from 'react-webcam'

import { drawMesh, drawPose, drawSubjectInfo, calcExpression } from "./utilities.js"

function App() {
  const [updateCanvas, setUpdateCanvas] = useState(0)
  const faceMeshToggle = useRef(true)
  const posenetToggle = useRef(true)
  const faceAPIToggle = useRef(true)
  const dataLogToggle = useRef(true)

  const camera = useRef(null)
  const canvas = useRef(null)
  const times = useRef([])
  const fpsDisplay = useRef(null)

  const detectCallBack = useCallback(() => {
    runMLModels()
  }, [])

  useEffect(() => {
    let timeoutId;
    if (
      typeof camera.current !== undefined
      && camera.current !== null
    ) {
      const width = camera.current.video.clientWidth
      const height = camera.current.video.clientHeight

      canvas.current.width = width
      canvas.current.height = height

      if (updateCanvas < 2) {
        timeoutId = setTimeout(() => {setUpdateCanvas(updateCanvas + 1)}, 1000)
      } else {
        clearInterval(timeoutId)
      }

      if (updateCanvas === 1) {
        detectCallBack()
      }
    }
    return () => { clearTimeout(timeoutId) }
  }, [updateCanvas, detectCallBack])

  async function runMLModels() {
    // load face mesh
    const model = await facemesh.load(
      facemesh.SupportedPackages.mediapipeFacemesh,
      { maxFaces: 3}
    )

    // load pose detection
    const detectorConfig = { modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING }
    const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig)

    // load age / gender & emotion detection
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models")
    await faceapi.nets.ageGenderNet.loadFromUri("/models")
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models")
    await faceapi.nets.faceExpressionNet.loadFromUri("/models")

    async function detect() {
      // estimate faces
      let predictions;
      if (faceMeshToggle.current) {
        predictions = await model.estimateFaces({
          input: camera.current.video,
          //flipHorizontal: true,
          predictIrises: false
        })
      }

      // get poses
      let poses;
      if (posenetToggle.current) {
        poses = await detector.estimatePoses(camera.current.video)
      }

      // get age / gender & emotion detection
      let subjects;
      let detections;
      if (faceAPIToggle.current) {
        detections = await faceapi.detectAllFaces(camera.current.video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions().withAgeAndGender()
        subjects = []
        if (detections.length > 0) {
          detections.forEach((detection) => {
            const expression = calcExpression(detection.expressions)
            const subject = { age: detection.age, gender: detection.gender, expression }
            subjects.push(subject)
          })
        }
      }
  
      // set canvas
      const ctx = canvas.current.getContext("2d")
      ctx.clearRect(0, 0, canvas.current.clientWidth, canvas.current.clientHeight)

      // draw
      if (faceMeshToggle.current) {
        drawMesh(predictions, ctx)
      }
      if (posenetToggle.current) {
        drawPose(poses, ctx)
      }
      if (faceAPIToggle.current) {
        drawSubjectInfo(subjects, ctx)
      }

      // FPS Calculation
      const now = performance.now()
      while (times.current.length > 0 && times.current[0] <= now - 1000) {
        times.current.shift()
      }
      times.current.push(now)

      fpsDisplay.current.textContent = `FPS: ${times.current.length}`

      // Date Log to send to backend
      const MLData = {
        facemesh: predictions ? predictions : null,
        posenet: poses ? poses : null,
        faceapi: detections ? detections : null
      }

      if (dataLogToggle.current) {
        console.log(MLData)
      }
  
      window.requestAnimationFrame(detect)
    }
    
    window.requestAnimationFrame(detect)
  }

  console.log(faceAPIToggle)

  return (
    <div className="App">
      <div style={{position: "relative"}}>
        <Webcam ref={camera} id="camera" videoConstraints={{ facingMode: "user" }}/>
        <canvas style={{position: "absolute", top: 0, left: 0}} ref={canvas} />
        <span
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            fontSize: "23px",
            color: "red",
            margin: "10px",
            fontWeight: 700
          }}
          ref={fpsDisplay}
        >FPS: 0</span>
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            margin: "10px",
            width: "200px",
            height: "100px"
          }}
        >
          <button className="breakout-button" type="button" onClick={() => faceMeshToggle.current = !faceMeshToggle.current}>Toggle Facemesh</button>
          <button className="breakout-button" type="button" onClick={() => posenetToggle.current = !posenetToggle.current}>Toggle Posenet</button>
          <button className="breakout-button" type="button" onClick={() => faceAPIToggle.current = !faceAPIToggle.current}>Toggle Faceapi</button>
          <button className="breakout-button" type="button" onClick={() => dataLogToggle.current = !dataLogToggle.current}>Toggle Data Log</button>
        </div>
      </div>
    </div>
  );
}

export default App;
