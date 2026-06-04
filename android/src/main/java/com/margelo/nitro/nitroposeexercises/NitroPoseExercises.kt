package com.margelo.nitro.nitroposeexercises

import com.margelo.nitro.camera.HybridFrameSpec
import com.margelo.nitro.camera.public.NativeFrame
import com.google.android.gms.tasks.Tasks
import java.util.concurrent.TimeUnit

// import android.graphics.Matrix
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseDetector
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import kotlin.math.acos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

// import android.media.Image
// import android.graphics.Bitmap
import com.google.mlkit.vision.common.InputImage
// import com.margelo.nitro.core.ArrayBuffer
// import java.nio.ByteBuffer

// import java.nio.ByteOrder

@Keep
@DoNotStrip
class NitroPoseExercises : HybridNitroPoseExercisesSpec() {

  // ─── ML Kit ─────────────────────────────────────────────────
  private var poseDetector: PoseDetector? = null
  private var isInitialized = false


  // ─── Cached Landmarks (ML Kit is async, we cache last result) ──
  private var cachedLandmarks: Array<Landmark> = emptyArray()
  private val landmarkLock = Any()

  // ─── Landmark Index Mapping ─────────────────────────────────
  // ML Kit PoseLandmark type → MediaPipe index that JS configs expect
  private val mlKitToMediaPipeMap = mapOf(
    PoseLandmark.NOSE to 0,
    PoseLandmark.LEFT_EYE_INNER to 1,
    PoseLandmark.LEFT_EYE to 2,
    PoseLandmark.LEFT_EYE_OUTER to 3,
    PoseLandmark.RIGHT_EYE_INNER to 4,
    PoseLandmark.RIGHT_EYE to 5,
    PoseLandmark.RIGHT_EYE_OUTER to 6,
    PoseLandmark.LEFT_EAR to 7,
    PoseLandmark.RIGHT_EAR to 8,
    PoseLandmark.LEFT_MOUTH to 9,
    PoseLandmark.RIGHT_MOUTH to 10,
    PoseLandmark.LEFT_SHOULDER to 11,
    PoseLandmark.RIGHT_SHOULDER to 12,
    PoseLandmark.LEFT_ELBOW to 13,
    PoseLandmark.RIGHT_ELBOW to 14,
    PoseLandmark.LEFT_WRIST to 15,
    PoseLandmark.RIGHT_WRIST to 16,
    PoseLandmark.LEFT_PINKY to 17,
    PoseLandmark.RIGHT_PINKY to 18,
    PoseLandmark.LEFT_INDEX to 19,
    PoseLandmark.RIGHT_INDEX to 20,
    PoseLandmark.LEFT_THUMB to 21,
    PoseLandmark.RIGHT_THUMB to 22,
    PoseLandmark.LEFT_HIP to 23,
    PoseLandmark.RIGHT_HIP to 24,
    PoseLandmark.LEFT_KNEE to 25,
    PoseLandmark.RIGHT_KNEE to 26,
    PoseLandmark.LEFT_ANKLE to 27,
    PoseLandmark.RIGHT_ANKLE to 28,
    PoseLandmark.LEFT_HEEL to 29,
    PoseLandmark.RIGHT_HEEL to 30,
    PoseLandmark.LEFT_FOOT_INDEX to 31,
    PoseLandmark.RIGHT_FOOT_INDEX to 32,
  )

  // ─── Exercise Config ────────────────────────────────────────
  private var exerciseConfig: ExerciseConfig? = null

  // ─── Session State ──────────────────────────────────────────
  private var _status: SessionStatus = SessionStatus.IDLE
  override val status: SessionStatus get() = _status

  private var _currentPhase: ExercisePhase = ExercisePhase.UNKNOWN
  override val currentPhase: ExercisePhase get() = _currentPhase

  private var _repCount: Double = 0.0
  override val repCount: Double get() = _repCount

  private var _landmarks: Array<Landmark> = emptyArray()
  override val landmarks: Array<Landmark> get() = _landmarks

  // ─── State Machine ──────────────────────────────────────────
  private var phaseHistory = mutableListOf<ExercisePhase>()
  private var repStartTime: Long = System.currentTimeMillis()
  private var sessionStartTime: Long = System.currentTimeMillis()
  private var targetReps: Double = 0.0
  private var countdownSeconds: Double = 0.0

  // ─── Form Tracking ──────────────────────────────────────────
  private var lastFormFeedbackTime = mutableMapOf<String, Long>()
  private var sessionFormViolations = mutableListOf<FormFeedback>()
  private var repFormScore: Double = 100.0
  private var repAngleSnapshots: Array<AngleSnapshot> = emptyArray()
  private var allRepDurations = mutableListOf<Double>()
  private var allRepFormScores = mutableListOf<Double>()

  // ─── Pose Tracking ──────────────────────────────────────────
  private var poseWasLost = false

  // ─── Frame Throttle ─────────────────────────────────────────
  private var frameCount: Int = 0
  private val processEveryNFrames: Int = 3

  // ─── Callbacks ──────────────────────────────────────────────
  override var onRepComplete: ((data: RepData) -> Unit)? = null
  override var onPhaseChange: ((phase: ExercisePhase) -> Unit)? = null
  override var onFormFeedback: ((feedback: FormFeedback) -> Unit)? = null
  override var onHoldProgress: ((progress: HoldProgress) -> Unit)? = null
  override var onPoseLost: (() -> Unit)? = null
  override var onPoseRegained: (() -> Unit)? = null
  override var onSessionComplete: ((result: SessionResult) -> Unit)? = null

  override var onPostureLost: (() -> Unit)? = null
override var onPostureRegained: (() -> Unit)? = null

  // ─── Posture Gate ──────────────────────────────────────────
private var consecutivePostureFailures: Int = 0
private val postureFailureThreshold: Int = 30  // ~3s — tolerant of pushup occlusion
private var postureWasLost = false

  // ─── Hold Tracking ──────────────────────────────────────────
  private var holdStartTime: Long? = null

  // ═══════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════

  override fun initialize(modelPath: String): Promise<Unit> {
    // No model file needed — ML Kit downloads/bundles its own model
    return Promise.async {
      val options = PoseDetectorOptions.Builder()
        .setDetectorMode(PoseDetectorOptions.STREAM_MODE)
        .build()

      poseDetector = PoseDetection.getClient(options)
      isInitialized = true
      println("[PoseExercise] Initialized with ML Kit Pose Detection (no model file needed)")
    }
  }

  override fun release() {
    poseDetector?.close()
    poseDetector = null
    isInitialized = false
    _status = SessionStatus.IDLE
    resetSession()
  }

override fun isReady(): Boolean {
  val config = exerciseConfig ?: return false
  if (_landmarks.isEmpty()) return false
  return isPostureValid(config.postureFamily, config.visibilityThreshold)
}

  // ═══════════════════════════════════════════════════════════
  // Exercise Setup
  // ═══════════════════════════════════════════════════════════

  override fun loadExercise(config: ExerciseConfig) {
    this.exerciseConfig = config
    resetSession()
  }

  // ═══════════════════════════════════════════════════════════
  // Session Control
  // ═══════════════════════════════════════════════════════════

  override fun startSession(targetReps: Double, countdownSeconds: Double) {
    resetSession()
    this.targetReps = targetReps
    this.countdownSeconds = countdownSeconds

    if (countdownSeconds > 0) {
      _status = SessionStatus.COUNTDOWN
      startCountdown()
    } else {
      _status = SessionStatus.ACTIVE
      sessionStartTime = System.currentTimeMillis()
      repStartTime = System.currentTimeMillis()
    }
  }

  override fun pauseSession() {
    if (_status != SessionStatus.ACTIVE) return
    _status = SessionStatus.PAUSED
  }

  override fun resumeSession() {
    if (_status != SessionStatus.PAUSED) return
    _status = SessionStatus.ACTIVE
  }

  override fun stopSession() {
    if (_status != SessionStatus.ACTIVE && _status != SessionStatus.PAUSED) return
    completeSession()
  }

  // ═══════════════════════════════════════════════════════════
  // Frame Processing (ML Kit — async with cached results)
  // ═══════════════════════════════════════════════════════════

// Reusable scratch — allocated once, never GC'd per frame
@Volatile private var lastProcessTime: Long = 0L
private val minIntervalMs: Long = 66L  // ~15fps cap; bump down to 33 for ~30fps

// Time-based throttle — more reliable than frame-count under variable FPS
@Volatile private var lastProcessTime: Long = 0L
private val minIntervalMs: Long = 66L  // ~15fps; lower to 33 for ~30fps once release build is fast enough

override fun processFrameAndroid(frame: HybridFrameSpec) {
  if (_status != SessionStatus.ACTIVE && _status != SessionStatus.COUNTDOWN) return
  if (!isInitialized || poseDetector == null) return

  val now = System.currentTimeMillis()
  if (now - lastProcessTime < minIntervalMs) return
  lastProcessTime = now

  val nativeFrame = frame as? NativeFrame ?: return
  val imageProxy = nativeFrame.image ?: return
  val mediaImage = imageProxy.image ?: return

  try {
    val rotation = imageProxy.imageInfo.rotationDegrees
    val inputImage = InputImage.fromMediaImage(mediaImage, rotation)

    val rotated = rotation == 90 || rotation == 270
    val imageWidth = (if (rotated) mediaImage.height else mediaImage.width).toDouble()
    val imageHeight = (if (rotated) mediaImage.width else mediaImage.height).toDouble()

    // SYNC inference — the frame's underlying ImageProxy is only valid until
    // VisionCamera disposes the frame after this method returns. Tasks.await
    // blocks the worklet thread which is exactly what we want here.
    val pose = try {
      Tasks.await(poseDetector!!.process(inputImage), 200, TimeUnit.MILLISECONDS)
    } catch (e: Exception) {
      // Timeout or failure — skip this frame quietly
      null
    }

    if (pose == null) return

    val poseLandmarks = pose.allPoseLandmarks

    if (poseLandmarks.isNotEmpty()) {
      if (poseWasLost) {
        poseWasLost = false
        onPoseRegained?.invoke()
      }

      val landmarkArray = Array(34) { Landmark(x = 0.0, y = 0.0, z = 0.0, visibility = 0.0) }

      for (poseLandmark in poseLandmarks) {
        val mediaPipeIndex = mlKitToMediaPipeMap[poseLandmark.landmarkType] ?: continue
        if (mediaPipeIndex >= 34) continue

        landmarkArray[mediaPipeIndex] = Landmark(
          x = (poseLandmark.position3D.x / imageWidth).coerceIn(0.0, 1.0),
          y = (poseLandmark.position3D.y / imageHeight).coerceIn(0.0, 1.0),
          z = poseLandmark.position3D.z.toDouble(),
          visibility = poseLandmark.inFrameLikelihood.toDouble()
        )
      }

      synchronized(landmarkLock) {
        cachedLandmarks = landmarkArray
        _landmarks = landmarkArray
      }

      processExerciseLogic()
    } else {
      if (!poseWasLost) {
        poseWasLost = true
        onPoseLost?.invoke()
      }
    }
  } catch (e: Exception) {
    println("[PoseExercise] processFrameAndroid error: ${e.message}")
  }
  // NOTE: we do NOT close the ImageProxy ourselves.
  // VisionCamera owns the frame lifecycle and will release it when
  // frame.dispose() runs in the JS worklet after we return.
}

override fun processFrameIOS(frame: HybridFrameSpec) {
  // no-op on Android
}

private fun processExerciseLogic() {
  val config = exerciseConfig ?: return
  if (_landmarks.isEmpty()) return

  // Hold exercises get 3x more tolerance — stationary poses suffer from
  // visibility flicker more than active reps.
  val failureThreshold = if (config.type == ExerciseType.HOLD) {
    postureFailureThreshold * 3
  } else {
    postureFailureThreshold
  }

  // Posture gate with hysteresis
  if (!isPostureValid(config.postureFamily, config.visibilityThreshold)) {
    consecutivePostureFailures += 1
    if (consecutivePostureFailures >= failureThreshold) {
      if (!postureWasLost) {
        postureWasLost = true
        onPostureLost?.invoke()
      }
      // Only nuke phase history after EXTENDED loss (3x threshold).
      // Brief occlusions during a pushup shouldn't wipe an in-progress rep.
      if (consecutivePostureFailures >= failureThreshold * 3) {
        _currentPhase = ExercisePhase.UNKNOWN
        phaseHistory = mutableListOf()
      }
    }
    return
  }

  consecutivePostureFailures = 0
  if (postureWasLost) {
    postureWasLost = false
    onPostureRegained?.invoke()
  }

  // Angle calculation
  val visThreshold = config.visibilityThreshold
  val currentAngles = mutableMapOf<String, Double>()
  val angleSnapshots = mutableListOf<AngleSnapshot>()

  for (angleDef in config.angles) {
    val a = angleDef.landmarkA.toInt()
    val b = angleDef.landmarkB.toInt()
    val c = angleDef.landmarkC.toInt()

    if (a >= _landmarks.size || b >= _landmarks.size || c >= _landmarks.size) continue

    if (_landmarks[a].visibility <= visThreshold ||
        _landmarks[b].visibility <= visThreshold ||
        _landmarks[c].visibility <= visThreshold) continue

    val angle = calculateAngle(
      pointA = _landmarks[a],
      vertex = _landmarks[b],
      pointC = _landmarks[c]
    )

    currentAngles[angleDef.name] = angle
    angleSnapshots.add(AngleSnapshot(name = angleDef.name, value = angle))
  }

  repAngleSnapshots = angleSnapshots

  val detectedPhase = determinePhase(currentAngles, config)

  // Debug log — remove once reps count reliably
  println("[Pose] angles=$currentAngles current=$_currentPhase detected=$detectedPhase history=$phaseHistory reps=$_repCount")

  if (detectedPhase != _currentPhase && detectedPhase != ExercisePhase.UNKNOWN) {
    val previousPhase = _currentPhase
    _currentPhase = detectedPhase
    onPhaseChange?.invoke(detectedPhase)
    handlePhaseTransition(previousPhase, detectedPhase, config)
  }

  checkFormRules(currentAngles, config)

  if (config.type == ExerciseType.HOLD) {
    handleHoldProgress(currentAngles, config)
  }
}

  // ═══════════════════════════════════════════════════════════
  // Angle Calculation
  // ═══════════════════════════════════════════════════════════

  private fun calculateAngle(pointA: Landmark, vertex: Landmark, pointC: Landmark): Double {
    val vaX = pointA.x - vertex.x
    val vaY = pointA.y - vertex.y
    val vcX = pointC.x - vertex.x
    val vcY = pointC.y - vertex.y

    val dot = vaX * vcX + vaY * vcY
    val magA = sqrt(vaX * vaX + vaY * vaY)
    val magC = sqrt(vcX * vcX + vcY * vcY)

    if (magA == 0.0 || magC == 0.0) return 0.0

    val cosAngle = max(-1.0, min(1.0, dot / (magA * magC)))
    val angleRad = acos(cosAngle)
    return angleRad * (180.0 / Math.PI)
  }

  // ═══════════════════════════════════════════════════════════
  // Phase Detection
  // ═══════════════════════════════════════════════════════════

  private fun determinePhase(angles: Map<String, Double>, config: ExerciseConfig): ExercisePhase {
    for (phaseThreshold in config.phases) {
      val angle = angles[phaseThreshold.angleName] ?: continue
      if (angle >= phaseThreshold.minAngle && angle <= phaseThreshold.maxAngle) {
        return phaseThreshold.phase
      }
    }
    return ExercisePhase.UNKNOWN
  }

  // ═══════════════════════════════════════════════════════════
  // Rep Counting State Machine
  // ═══════════════════════════════════════════════════════════

  private fun handlePhaseTransition(newPhase: ExercisePhase, config: ExerciseConfig) {
    if (config.type != ExerciseType.REP) return

    phaseHistory.add(newPhase)

    val repSeq = config.repSequence
    if (phaseHistory.size >= repSeq.size) {
      val tail = phaseHistory.takeLast(repSeq.size)

      if (tail == repSeq.toList()) {
        val now = System.currentTimeMillis()
        val repDuration = (now - repStartTime).toDouble()

        // Minimum 800ms per rep
        if (repDuration < 800) {
          phaseHistory.clear()
          phaseHistory.add(newPhase)
          return
        }

        // Don't count rep if form is terrible
        if (repFormScore <= 30) {
          onFormFeedback?.invoke(FormFeedback(
            ruleName = "poorForm",
            message = "Fix your form before continuing",
            severity = FormSeverity.ERROR
          ))
          repFormScore = 100.0
          phaseHistory.clear()
          phaseHistory.add(newPhase)
          return
        }

        _repCount += 1.0

        val repData = RepData(
          repNumber = _repCount,
          durationMs = repDuration,
          formScore = repFormScore,
          angles = repAngleSnapshots
        )

        allRepDurations.add(repDuration)
        allRepFormScores.add(repFormScore)

        onRepComplete?.invoke(repData)

        repStartTime = now
        repFormScore = 100.0
        phaseHistory.clear()
        phaseHistory.add(newPhase)

        if (targetReps > 0 && _repCount >= targetReps) {
          completeSession()
        }
      }
    }

    val maxHistory = repSeq.size * 2
    if (phaseHistory.size > maxHistory) {
      phaseHistory = phaseHistory.takeLast(maxHistory).toMutableList()
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Form Validation
  // ═══════════════════════════════════════════════════════════

  private fun checkFormRules(currentAngles: Map<String, Double>, config: ExerciseConfig) {
    val now = System.currentTimeMillis()
    val throttleMs = 3000L

    for (rule in config.formRules) {
      val angle = currentAngles[rule.angleName] ?: continue

      val isViolating = angle < rule.minAngle || angle > rule.maxAngle

      if (isViolating) {
        val lastTime = lastFormFeedbackTime[rule.name]
        if (lastTime != null && (now - lastTime) < throttleMs) continue

        val feedback = FormFeedback(
          ruleName = rule.name,
          message = rule.message,
          severity = rule.severity
        )

        when (rule.severity) {
          FormSeverity.WARNING -> repFormScore = max(0.0, repFormScore - 5)
          FormSeverity.ERROR -> repFormScore = max(0.0, repFormScore - 15)
          FormSeverity.INFO -> {}
        }

        sessionFormViolations.add(feedback)
        lastFormFeedbackTime[rule.name] = now
        onFormFeedback?.invoke(feedback)
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Hold Progress
  // ═══════════════════════════════════════════════════════════

  private fun handleHoldProgress(currentAngles: Map<String, Double>, config: ExerciseConfig) {
    if (config.holdDurationMs <= 0) return

    var inPosition = true
    for (phaseThreshold in config.phases) {
      val angle = currentAngles[phaseThreshold.angleName]
      if (angle == null || angle < phaseThreshold.minAngle || angle > phaseThreshold.maxAngle) {
        inPosition = false
        break
      }
    }

    if (inPosition) {
      if (holdStartTime == null) {
        holdStartTime = System.currentTimeMillis()
      }

      val elapsed = (System.currentTimeMillis() - holdStartTime!!).toDouble()
      val stability = min(100.0, max(0.0, repFormScore))

      val progress = HoldProgress(
        elapsedMs = elapsed,
        targetMs = config.holdDurationMs,
        stability = stability
      )

      onHoldProgress?.invoke(progress)

      if (elapsed >= config.holdDurationMs) {
        completeSession()
      }
    } else {
      holdStartTime = null
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Session Completion
  // ═══════════════════════════════════════════════════════════

  private fun completeSession() {
    _status = SessionStatus.COMPLETED

    val totalDuration = (System.currentTimeMillis() - sessionStartTime).toDouble()
    val avgRepDuration = if (allRepDurations.isEmpty()) 0.0 else allRepDurations.average()
    val avgFormScore = if (allRepFormScores.isEmpty()) 100.0 else allRepFormScores.average()

    val result = SessionResult(
      totalReps = _repCount,
      totalDurationMs = totalDuration,
      averageRepDurationMs = avgRepDuration,
      averageFormScore = avgFormScore,
      formViolations = sessionFormViolations.toTypedArray(),
      angleHistory = repAngleSnapshots
    )

    onSessionComplete?.invoke(result)
  }

  // ═══════════════════════════════════════════════════════════
  // Countdown
  // ═══════════════════════════════════════════════════════════

  private fun startCountdown() {
    Thread {
      var remaining = countdownSeconds.toInt()
      while (remaining > 0) {
        Thread.sleep(1000)
        remaining--
      }
      _status = SessionStatus.ACTIVE
      sessionStartTime = System.currentTimeMillis()
      repStartTime = System.currentTimeMillis()
    }.start()
  }

  // ═══════════════════════════════════════════════════════════
  // Reset
  // ═══════════════════════════════════════════════════════════

  private fun resetSession() {
    _status = SessionStatus.IDLE
    _currentPhase = ExercisePhase.UNKNOWN
    _repCount = 0.0
    _landmarks = emptyArray()
    phaseHistory.clear()
    repFormScore = 100.0
    repAngleSnapshots = emptyArray()
    allRepDurations.clear()
    allRepFormScores.clear()
    sessionFormViolations.clear()
    lastFormFeedbackTime.clear()
    holdStartTime = null
    poseWasLost = false
    targetReps = 0.0
    countdownSeconds = 0.0
    frameCount = 0
    consecutivePostureFailures = 0
    postureWasLost = false
    synchronized(landmarkLock) {
      cachedLandmarks = emptyArray()
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Orientation Helpers
  // ═══════════════════════════════════════════════════════════

  private fun rotationDegreesFromFrame(frame: HybridFrameSpec): Int {
    return when (frame.orientation.name.lowercase()) {
      "up" -> 0
      "right" -> 90
      "down" -> 180
      "left" -> 270
      else -> 0
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Posture Gates
  // ═══════════════════════════════════════════════════════════

private fun isPostureValid(family: PostureFamily, threshold: Double): Boolean {
  if (_landmarks.size < 33) return false

  val ls = _landmarks[11]; val rs = _landmarks[12]
  val lh = _landmarks[23]; val rh = _landmarks[24]
  val lk = _landmarks[25]; val rk = _landmarks[26]
  val la = _landmarks[27]; val ra = _landmarks[28]
  val lw = _landmarks[15]; val rw = _landmarks[16]

  // Shoulders mandatory; everything below is optional for close-range framing
  val shouldersVisible = ls.visibility > threshold && rs.visibility > threshold
  if (!shouldersVisible) return false

  val hipsVisible = lh.visibility > threshold && rh.visibility > threshold
  val kneesVisible = lk.visibility > threshold && rk.visibility > threshold
  val anklesVisible = la.visibility > threshold && ra.visibility > threshold
  val wristsVisible = lw.visibility > threshold && rw.visibility > threshold
  val oneWristVisible = lw.visibility > threshold || rw.visibility > threshold

  val shoulderY = (ls.y + rs.y) / 2
  val shoulderX = (ls.x + rs.x) / 2
  val hipY = if (hipsVisible) (lh.y + rh.y) / 2 else shoulderY
  val hipX = if (hipsVisible) (lh.x + rh.x) / 2 else shoulderX
  val kneeY = if (kneesVisible) (lk.y + rk.y) / 2 else hipY
  val ankleY = if (anklesVisible) (la.y + ra.y) / 2 else kneeY

  // Mirror-invariant — works for front and back camera identically
  val shoulderWidth = kotlin.math.abs(ls.x - rs.x)

  return when (family) {
    PostureFamily.HORIZONTALPRONE, PostureFamily.SUPINE -> {
      // Case A: side view — full body in horizontal band
      if (hipsVisible) {
        val ys = if (anklesVisible)
          listOf(shoulderY, hipY, ankleY)
        else
          listOf(shoulderY, hipY)
        if ((ys.max() - ys.min()) < 0.25) return true
      }

      // Case B: front-facing prone — minimum signature is shoulders + at least
      // one wrist. Hips often occluded by the body in pushup framings.
      if (!oneWristVisible) return false

      val wristY = if (wristsVisible)
        (lw.y + rw.y) / 2
      else
        kotlin.math.max(lw.y, rw.y)

      // Geometry: wrists at or below shoulder line, torso reasonably wide.
      // Tolerance loosened for deep DOWN phase where shoulders drop close
      // to wrist level.
      val handsLowerOrLevel = wristY > shoulderY - 0.08
      val torsoFacing = shoulderWidth > 0.06

      handsLowerOrLevel && torsoFacing
    }

    PostureFamily.STANDINGUPRIGHT -> {
      if (hipsVisible) {
        if (kneesVisible) {
          shoulderY < hipY - 0.05 &&
          hipY < kneeY + 0.05 &&
          (if (anklesVisible) kneeY < ankleY else true)
        } else {
          shoulderY < hipY - 0.05
        }
      } else {
        // Hips cropped (close-range front-facing) — accept based on shoulder span
        shoulderWidth > 0.08
      }
    }

    PostureFamily.SEATED -> {
      when {
        hipsVisible && kneesVisible -> shoulderY < hipY - 0.05 && kotlin.math.abs(hipY - kneeY) < 0.20
        hipsVisible -> shoulderY < hipY - 0.05
        else -> shoulderWidth > 0.08
      }
    }

    PostureFamily.SIDEPLANK -> {
      if (!hipsVisible) false
      else {
        val ySpread = kotlin.math.abs(shoulderY - hipY)
        val shoulderHipDx = kotlin.math.abs(shoulderX - hipX)
        ySpread < 0.20 && shoulderHipDx < 0.15
      }
    }

    PostureFamily.INVERTED -> {
      if (!hipsVisible || !anklesVisible) false
      else hipY < shoulderY && hipY < ankleY
    }

    PostureFamily.NONE -> true
  }
}


}