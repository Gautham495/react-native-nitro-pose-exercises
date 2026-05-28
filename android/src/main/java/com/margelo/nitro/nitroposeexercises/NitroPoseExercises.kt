package com.margelo.nitro.nitroposeexercises

import android.graphics.Bitmap
import android.graphics.Matrix
import android.media.Image
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseDetector
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.margelo.nitro.camera.HybridFrameSpec
import kotlin.math.acos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

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

override fun processFrame(frame: HybridFrameSpec) {
    if (_status != SessionStatus.ACTIVE && _status != SessionStatus.COUNTDOWN) return
    if (!isInitialized || poseDetector == null) return

    frameCount++
    if (frameCount % processEveryNFrames != 0) return

    try {
      val nativeBuffer = frame.getNativeBuffer()
      val bitmap = FrameHelper.hardwareBufferToBitmap(nativeBuffer.pointer) ?: return

      val inputImage = InputImage.fromBitmap(bitmap, 0)
      val imageWidth = bitmap.width.toDouble()
      val imageHeight = bitmap.height.toDouble()

      poseDetector!!.process(inputImage)
        .addOnSuccessListener { pose ->
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
                x = poseLandmark.position.x.toDouble() / imageWidth,
                y = poseLandmark.position.y.toDouble() / imageHeight,
                z = poseLandmark.position3D.z.toDouble(),
                visibility = poseLandmark.inFrameLikelihood.toDouble()
              )
            }

            synchronized(landmarkLock) {
              cachedLandmarks = landmarkArray
            }
          } else {
            if (!poseWasLost) {
              poseWasLost = true
              onPoseLost?.invoke()
            }
            synchronized(landmarkLock) {
              cachedLandmarks = emptyArray()
            }
          }

          bitmap.recycle()
        }
        .addOnFailureListener { e ->
          println("[PoseExercise] ML Kit error: ${e.message}")
          bitmap.recycle()
        }

      // Use cached landmarks from previous frame
      val currentLandmarks: Array<Landmark>
      synchronized(landmarkLock) {
        currentLandmarks = cachedLandmarks.copyOf()
      }

      _landmarks = currentLandmarks

      if (currentLandmarks.isNotEmpty() && _status == SessionStatus.ACTIVE) {
        processExerciseLogic()
      }

    } catch (e: Exception) {
      println("[PoseExercise] Frame processing error: ${e.message}")
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Exercise Logic Engine
  // ═══════════════════════════════════════════════════════════

  private fun processExerciseLogic() {
    val config = exerciseConfig ?: return
    if (_landmarks.isEmpty()) return

    val currentAngles = mutableMapOf<String, Double>()
    val angleSnapshots = mutableListOf<AngleSnapshot>()

    for (angleDef in config.angles) {
      val a = angleDef.landmarkA.toInt()
      val b = angleDef.landmarkB.toInt()
      val c = angleDef.landmarkC.toInt()

      if (a >= _landmarks.size || b >= _landmarks.size || c >= _landmarks.size) continue

      // Only calculate if all three landmarks have reasonable confidence
      if (_landmarks[a].visibility < 0.3 || _landmarks[b].visibility < 0.3 || _landmarks[c].visibility < 0.3) continue

      val angle = calculateAngle(_landmarks[a], _landmarks[b], _landmarks[c])
      currentAngles[angleDef.name] = angle
      angleSnapshots.add(AngleSnapshot(name = angleDef.name, value = angle))
    }

    repAngleSnapshots = angleSnapshots.toTypedArray()

    val detectedPhase = determinePhase(currentAngles, config)

    if (detectedPhase != _currentPhase && detectedPhase != ExercisePhase.UNKNOWN) {
      _currentPhase = detectedPhase
      onPhaseChange?.invoke(detectedPhase)
      handlePhaseTransition(detectedPhase, config)
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
    synchronized(landmarkLock) {
      cachedLandmarks = emptyArray()
    }
  }
}