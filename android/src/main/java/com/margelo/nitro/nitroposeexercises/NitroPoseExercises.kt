package com.margelo.nitro.nitroposeexercises

import android.graphics.Bitmap
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerOptions
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.margelo.nitro.camera.HybridFrameSpec
import kotlin.math.acos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

@Keep
@DoNotStrip
class HybridPoseExercise : HybridNitroPoseExercisesSpec() {

  // ─── MediaPipe ──────────────────────────────────────────────
  private var poseLandmarker: PoseLandmarker? = null
  private var isInitialized = false

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
  private var frameCount: Int = 0
  private val processEveryNFrames: Int = 3

  // ─── Form Tracking ──────────────────────────────────────────
  private var lastFormFeedbackTime = mutableMapOf<String, Long>()
  private var sessionFormViolations = mutableListOf<FormFeedback>()
  private var repFormScore: Double = 100.0
  private var repAngleSnapshots: Array<AngleSnapshot> = emptyArray()
  private var allRepDurations = mutableListOf<Double>()
  private var allRepFormScores = mutableListOf<Double>()

  // ─── Pose Tracking ──────────────────────────────────────────
  private var poseWasLost = false

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
    return Promise.async {
      val context = NitroModules.applicationContext
        ?: throw Error("No ApplicationContext set!")

      val baseOptions = BaseOptions.builder()
        .setModelAssetPath(modelPath)
        .build()

      val options = PoseLandmarkerOptions.builder()
        .setBaseOptions(baseOptions)
        .setRunningMode(RunningMode.IMAGE)
        .setNumPoses(1)
        .setMinPoseDetectionConfidence(0.5f)
        .setMinPosePresenceConfidence(0.5f)
        .setMinTrackingConfidence(0.5f)
        .build()

      poseLandmarker = PoseLandmarker.createFromOptions(context, options)
      isInitialized = true
    }
  }

  override fun release() {
    poseLandmarker?.close()
    poseLandmarker = null
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
  // Frame Processing
  // ═══════════════════════════════════════════════════════════

override fun processFrame(frame: HybridFrameSpec) {
    if (_status != SessionStatus.ACTIVE && _status != SessionStatus.COUNTDOWN) return
    if (!isInitialized || poseLandmarker == null) return

    frameCount++
    if (frameCount % processEveryNFrames != 0) return

    try {
        val nativeBuffer = frame.getNativeBuffer()
        val width = frame.getWidth().toInt()
        val height = frame.getHeight().toInt()

        // On Android, nativeBuffer.pointer is an AHardwareBuffer*
        // Convert to Bitmap via Android's HardwareBuffer API
        val hardwareBuffer = android.hardware.HardwareBuffer.wrap(nativeBuffer.pointer)
        val bitmap = Bitmap.wrapHardwareBuffer(hardwareBuffer, null)
            ?: throw Exception("Failed to wrap HardwareBuffer to Bitmap")

        // MediaPipe needs ARGB_8888, not hardware bitmap
        val softBitmap = bitmap.copy(Bitmap.Config.ARGB_8888, false)

        val mpImage = com.google.mediapipe.framework.image.BitmapImageBuilder(softBitmap).build()
        val result = poseLandmarker!!.detect(mpImage)

        if (result.landmarks().isNotEmpty()) {
            val poseLandmarks = result.landmarks()[0]

            if (poseWasLost) {
                poseWasLost = false
                onPoseRegained?.invoke()
            }

            _landmarks = poseLandmarks.map { lm ->
                Landmark(
                    x = lm.x().toDouble(),
                    y = lm.y().toDouble(),
                    z = lm.z().toDouble(),
                    visibility = (lm.visibility().orElse(0f)).toDouble()
                )
            }.toTypedArray()

            if (_status == SessionStatus.ACTIVE) {
                processExerciseLogic()
            }
        } else {
            if (!poseWasLost) {
                poseWasLost = true
                onPoseLost?.invoke()
            }
            _landmarks = emptyArray()
        }

        softBitmap.recycle()
        bitmap.recycle()
        nativeBuffer.release()

    } catch (e: Exception) {
        // MediaPipe detection failed — skip this frame
    }
}

  // ═══════════════════════════════════════════════════════════
  // ImageProxy to Bitmap conversion
  // ═══════════════════════════════════════════════════════════

  private fun imageProxyToBitmap(imageProxy: androidx.camera.core.ImageProxy): Bitmap {
    val buffer = imageProxy.planes[0].buffer
    val bytes = ByteArray(buffer.remaining())
    buffer.get(bytes)

    val yuvImage = android.graphics.YuvImage(
      bytes,
      android.graphics.ImageFormat.NV21,
      imageProxy.width,
      imageProxy.height,
      null
    )

    val out = java.io.ByteArrayOutputStream()
    yuvImage.compressToJpeg(
      android.graphics.Rect(0, 0, imageProxy.width, imageProxy.height),
      100,
      out
    )

    val jpegBytes = out.toByteArray()
    val bitmap = android.graphics.BitmapFactory.decodeByteArray(jpegBytes, 0, jpegBytes.size)

    // Apply rotation if needed
    val rotation = imageProxy.imageInfo.rotationDegrees
    return if (rotation != 0) {
      val matrix = Matrix()
      matrix.postRotate(rotation.toFloat())
      Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    } else {
      bitmap
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Exercise Logic Engine
  // ═══════════════════════════════════════════════════════════

  private fun processExerciseLogic() {
    val config = exerciseConfig ?: return
    if (_landmarks.isEmpty()) return

    // 1. Calculate all angles
    val currentAngles = mutableMapOf<String, Double>()
    val angleSnapshots = mutableListOf<AngleSnapshot>()

    for (angleDef in config.angles) {
      val a = angleDef.landmarkA.toInt()
      val b = angleDef.landmarkB.toInt()
      val c = angleDef.landmarkC.toInt()

      if (a >= _landmarks.size || b >= _landmarks.size || c >= _landmarks.size) continue

      val angle = calculateAngle(_landmarks[a], _landmarks[b], _landmarks[c])
      currentAngles[angleDef.name] = angle
      angleSnapshots.add(AngleSnapshot(name = angleDef.name, value = angle))
    }

    repAngleSnapshots = angleSnapshots.toTypedArray()

    // 2. Determine current phase
    val detectedPhase = determinePhase(currentAngles, config)

    if (detectedPhase != _currentPhase && detectedPhase != ExercisePhase.UNKNOWN) {
      _currentPhase = detectedPhase
      onPhaseChange?.invoke(detectedPhase)
      handlePhaseTransition(detectedPhase, config)
    }

    // 3. Check form rules
    checkFormRules(currentAngles, config)

    // 4. Handle hold-based exercises
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
  }
}