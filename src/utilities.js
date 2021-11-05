// Drawing Mesh
export const drawMesh = (predictions, ctx) => {
  if (predictions && predictions.length > 0) {
    predictions.forEach((prediction) => {
      const keypoints = prediction.scaledMesh;

      // Draw Dots
      for (let i = 0; i < keypoints.length; i++) {
        const x = keypoints[i][0]
        const y = keypoints[i][1]

        ctx.beginPath()
        ctx.arc(x, y, 1 /* radius */, 0, 3 * Math.PI)
        ctx.fillStyle = "aqua"
        ctx.fill()
      }
    })
  }
}

const COCO = new Map()
COCO.set(0, [1])
COCO.set(2, [0])
COCO.set(3, [1])
COCO.set(4, [2])
COCO.set(5, [6,7,11])
COCO.set(8, [6])
COCO.set(9, [7])
COCO.set(10, [8])
COCO.set(12, [6,11])
COCO.set(13, [11])
COCO.set(14, [12])
COCO.set(15, [13])
COCO.set(16, [14])

export const drawPose = (pose, ctx) => {
  if (pose && pose.length > 0) {
    pose.forEach((pose) => {
      const keypoints = pose.keypoints;
      // Draw Dots
      for (let i = 0; i < keypoints.length; i++) {
        if (keypoints[i].score > 0.39) {
          const x = keypoints[i].x
          const y = keypoints[i].y
  
          if (COCO.has(i)) {
            COCO.get(i).forEach((conpoint) => {
              const conx = keypoints[conpoint].x
              const cony = keypoints[conpoint].y
              ctx.beginPath()
              ctx.lineWidth = 3;
              ctx.strokeStyle = '#FF22C4'
              ctx.moveTo(conx, cony)
              ctx.lineTo(x, y)
              ctx.stroke()
            })
          }
  
          ctx.beginPath()
          ctx.arc(x, y, 7 /* radius */, 0, 3 * Math.PI)
          ctx.fillStyle = "#22FF47"
          ctx.fill()
        }
      }
    })
  }
}

export const calcExpression = (detection) => {
  let max = 0
  let maxExpression = ""
  for (const expression in detection) {
    if (detection[expression] > max) {
      maxExpression = expression
      max = detection[expression]
    }
  }
  return maxExpression
}

export const drawSubjectInfo = (subjects, ctx) => {
  let count = 0
  if (subjects)
    subjects.forEach((subject) => {
      const multiplier = (60 * count)

      ctx.fillStyle = "red"
      ctx.font = '16px mono'
      ctx.fillText(`gender: ${subject.gender}`, 20, 30 + multiplier)
      ctx.fillText(`age: ${Math.round(subject.age)}`, 20, 44 + multiplier)
      ctx.fillText(`expression: ${subject.expression}`, 20, 58 + multiplier)

      count++
    })
}