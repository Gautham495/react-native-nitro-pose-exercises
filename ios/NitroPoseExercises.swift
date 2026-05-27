import Foundation
import NitroModules
import MediaPipeTasksVision
import VisionCamera
import AVFoundation

class NitroPoseExercises: HybridNitroPoseExercisesSpec {

  // ─── MediaPipe ──────────────────────────────────────────────
  private var poseLandmarker: PoseLandmarker?
  private var isInitialized = false

  // ─── Exercise Config ────────────────────────────────────────
  private var exerciseConfig: ExerciseConfig?

  // ─── Session State ──────────────────────────────────────────
  private var _status: SessionStatus = .idle
  var status: SessionStatus { _status }

  private var _currentPhase: ExercisePhase = .unknown
  var currentPhase: ExercisePhase { _currentPhase }

  private var _repCount: Double = 0
  var repCount: Double { _repCount }

  private var _landmarks: [Landmark] = []
  var landmarks: [Landmark] { _landmarks }

  // ─── State Machine ──────────────────────────────────────────
  private var phaseHistory: [ExercisePhase] = []
  private var repStartTime: Date = Date()
  private var sessionStartTime: Date = Date()
  private var targetReps: Double = 0
  private var countdownSeconds: Double = 0
  private var countdownTimer: Timer?

  private var frameCount: Int = 0
  private let processEveryNFrames: Int = 3  // Only process every 3rd frame

  // ─── Form Tracking ──────────────────────────────────────────
  private var lastFormFeedbackTime: [String: Date] = [:]
  private var sessionFormViolations: [FormFeedback] = []
  private var repFormScore: Double = 100.0
  private var repAngleSnapshots: [AngleSnapshot] = []
  private var allRepDurations: [Double] = []
  private var allRepFormScores: [Double] = []

  // ─── Pose Tracking ──────────────────────────────────────────
  private var poseWasLost = false

  // ─── Callbacks ──────────────────────────────────────────────
  var onRepComplete: ((_ data: RepData) -> Void)?
  var onPhaseChange: ((_ phase: ExercisePhase) -> Void)?
  var onFormFeedback: ((_ feedback: FormFeedback) -> Void)?
  var onHoldProgress: ((_ progress: HoldProgress) -> Void)?
  var onPoseLost: (() -> Void)?
  var onPoseRegained: (() -> Void)?
  var onSessionComplete: ((_ result: SessionResult) -> Void)?

  // ─── Hold Tracking ──────────────────────────────────────────
  private var holdStartTime: Date?

  // ═══════════════════════════════════════════════════════════
  // MARK: - Lifecycle
  // ═══════════════════════════════════════════════════════════

  func initialize(modelPath: String) throws -> Promise<Void> {
    print("[PoseExercise] initialize called with path: \(modelPath)")

    return Promise.async { [weak self] in
      guard let self = self else { return }

      let options = PoseLandmarkerOptions()
      options.baseOptions.modelAssetPath = modelPath
      options.runningMode = .image
      options.numPoses = 1
      options.minPoseDetectionConfidence = 0.5
      options.minPosePresenceConfidence = 0.5
      options.minTrackingConfidence = 0.5

      self.poseLandmarker = try PoseLandmarker(options: options)
      self.isInitialized = true

      print("[PoseExercise] MediaPipe initialized successfully")
    }
  }

  func release() throws {
    poseLandmarker = nil
    isInitialized = false
    _status = .idle
    resetSession()
  }

  // ═══════════════════════════════════════════════════════════
  // MARK: - Exercise Setup
  // ═══════════════════════════════════════════════════════════

  func loadExercise(config: ExerciseConfig) throws {
    self.exerciseConfig = config
    resetSession()
  }

  // ═══════════════════════════════════════════════════════════
  // MARK: - Session Control
  // ═══════════════════════════════════════════════════════════

  func startSession(targetReps: Double, countdownSeconds: Double) throws {
    print("[PoseExercise] startSession called - target: \(targetReps), countdown: \(countdownSeconds)")

    resetSession()
    self.targetReps = targetReps
    self.countdownSeconds = countdownSeconds

    if countdownSeconds > 0 {
      _status = .countdown
      startCountdown()
    } else {
      _status = .active
      sessionStartTime = Date()
      repStartTime = Date()
    }
  }

  func pauseSession() throws {
    guard _status == .active else { return }
    _status = .paused
  }

  func resumeSession() throws {
    guard _status == .paused else { return }
    _status = .active
  }

  func stopSession() throws {
    guard _status == .active || _status == .paused else { return }
    completeSession()
  }

  // ═══════════════════════════════════════════════════════════
  // MARK: - Frame Processing
  // ═══════════════════════════════════════════════════════════

func processFrame(frame: any HybridFrameSpec) throws {
  print("[PoseExercise] processFrame called, status: \(_status)")

  frameCount += 1
  if frameCount % processEveryNFrames != 0 { return }

  guard _status == .active || _status == .countdown else {
    print("[PoseExercise] Skipping - status is \(_status)")
    return
  }
  guard isInitialized, let landmarker = poseLandmarker else {
    print("[PoseExercise] Skipping - not initialized: \(isInitialized)")
    return
  }

  guard let nativeFrame = frame as? any NativeFrame else {
    print("[PoseExercise] Failed to cast to NativeFrame")
    return
  }
  guard let sampleBuffer = nativeFrame.sampleBuffer else {
    print("[PoseExercise] sampleBuffer is nil")
    return
  }

  print("[PoseExercise] Got sampleBuffer, running detection...")

  do {
    let mpImage = try MPImage(sampleBuffer: sampleBuffer)
    let result = try landmarker.detect(image: mpImage)

    print("[PoseExercise] Detection done, landmarks count: \(result.landmarks.count)")

    if let poseLandmarks = result.landmarks.first {
      if poseWasLost {
        poseWasLost = false
        onPoseRegained?()
      }

      _landmarks = poseLandmarks.map { lm in
        Landmark(
          x: Double(lm.x),
          y: Double(lm.y),
          z: Double(lm.z),
          visibility: Double(lm.visibility ?? 0)
        )
      }

      print("[PoseExercise] Landmarks detected: \(_landmarks.count)")

      if _status == .active {
        processExerciseLogic()
      }

    } else {
      print("[PoseExercise] No pose detected in frame")
      if !poseWasLost {
        poseWasLost = true
        onPoseLost?()
      }
      _landmarks = []
    }

  } catch {
    print("[PoseExercise] MediaPipe error: \(error.localizedDescription)")
  }
}

  // ═══════════════════════════════════════════════════════════
  // MARK: - Exercise Logic Engine
  // ═══════════════════════════════════════════════════════════

  private func processExerciseLogic() {
    guard let config = exerciseConfig else { return }
    guard !_landmarks.isEmpty else { return }

    // 1. Calculate all angles defined in the config
    var currentAngles: [String: Double] = [:]
    var angleSnapshots: [AngleSnapshot] = []

    for angleDef in config.angles {
      let a = Int(angleDef.landmarkA)
      let b = Int(angleDef.landmarkB)
      let c = Int(angleDef.landmarkC)

      guard a < _landmarks.count, b < _landmarks.count, c < _landmarks.count else { continue }

      let angle = calculateAngle(
        pointA: _landmarks[a],
        vertex: _landmarks[b],
        pointC: _landmarks[c]
      )

      currentAngles[angleDef.name] = angle
      angleSnapshots.append(AngleSnapshot(name: angleDef.name, value: angle))
    }

    repAngleSnapshots = angleSnapshots

    // 2. Determine current phase from angle thresholds
    let detectedPhase = determinePhase(from: currentAngles, config: config)

    if detectedPhase != _currentPhase && detectedPhase != .unknown {
      let previousPhase = _currentPhase
      _currentPhase = detectedPhase
      onPhaseChange?(detectedPhase)

      // 3. Update phase history for rep counting
      handlePhaseTransition(from: previousPhase, to: detectedPhase, config: config)
    }

    // 4. Check form rules
    checkFormRules(currentAngles: currentAngles, config: config)

    // 5. Handle hold-based exercises
    if config.type == .hold {
      handleHoldProgress(currentAngles: currentAngles, config: config)
    }

    // Temporary debug logging — remove after testing
for (name, angle) in currentAngles {
  print("[PoseExercise] Angle \(name): \(String(format: "%.1f", angle))°")
}
print("[PoseExercise] Detected phase: \(detectedPhase), Current phase: \(_currentPhase)")
  }

  // ═══════════════════════════════════════════════════════════
  // MARK: - Angle Calculation
  // ═══════════════════════════════════════════════════════════

  private func calculateAngle(pointA: Landmark, vertex: Landmark, pointC: Landmark) -> Double {
    let vaX = pointA.x - vertex.x
    let vaY = pointA.y - vertex.y
    let vcX = pointC.x - vertex.x
    let vcY = pointC.y - vertex.y

    let dot = vaX * vcX + vaY * vcY
    let magA = sqrt(vaX * vaX + vaY * vaY)
    let magC = sqrt(vcX * vcX + vcY * vcY)

    guard magA > 0, magC > 0 else { return 0 }

    let cosAngle = max(-1.0, min(1.0, dot / (magA * magC)))
    let angleRad = acos(cosAngle)
    let angleDeg = angleRad * (180.0 / .pi)

    return angleDeg
  }

  // ═══════════════════════════════════════════════════════════
  // MARK: - Phase Detection
  // ═══════════════════════════════════════════════════════════

  private func determinePhase(from angles: [String: Double], config: ExerciseConfig) -> ExercisePhase {
    for phaseThreshold in config.phases {
      guard let angle = angles[phaseThreshold.angleName] else { continue }

      if angle >= phaseThreshold.minAngle && angle <= phaseThreshold.maxAngle {
        return phaseThreshold.phase
      }
    }
    return .unknown
  }

  // ═══════════════════════════════════════════════════════════
  // MARK: - Rep Counting State Machine
  // ═══════════════════════════════════════════════════════════

private func handlePhaseTransition(from previousPhase: ExercisePhase, to newPhase: ExercisePhase, config: ExerciseConfig) {
    guard config.type == .rep else { return }

    phaseHistory.append(newPhase)

    let repSeq = config.repSequence
    if phaseHistory.count >= repSeq.count {
      let tail = Array(phaseHistory.suffix(repSeq.count))

      if tail == repSeq {
        let now = Date()
        let repDuration = now.timeIntervalSince(repStartTime) * 1000

        // Minimum 800ms per rep — prevents false counts from noise
        guard repDuration > 800 else {
          phaseHistory = [newPhase]
          return
        }

        // Don't count rep if form is terrible
        guard repFormScore > 30 else {
          onFormFeedback?(FormFeedback(
            ruleName: "poorForm",
            message: "Fix your form before continuing",
            severity: .error
          ))
          repFormScore = 100.0
          phaseHistory = [newPhase]
          return
        }

        _repCount += 1

        let repData = RepData(
          repNumber: _repCount,
          durationMs: repDuration,
          formScore: repFormScore,
          angles: repAngleSnapshots
        )

        allRepDurations.append(repDuration)
        allRepFormScores.append(repFormScore)

        onRepComplete?(repData)

        repStartTime = now
        repFormScore = 100.0
        phaseHistory = [newPhase]

        if targetReps > 0 && _repCount >= targetReps {
          completeSession()
        }
      }
    }

    let maxHistory = config.repSequence.count * 2
    if phaseHistory.count > maxHistory {
      phaseHistory = Array(phaseHistory.suffix(maxHistory))
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MARK: - Form Validation
  // ═══════════════════════════════════════════════════════════

  private func checkFormRules(currentAngles: [String: Double], config: ExerciseConfig) {
    let now = Date()
    let throttleInterval: TimeInterval = 3.0

    for rule in config.formRules {
      guard let angle = currentAngles[rule.angleName] else { continue }

      let isViolating = angle < rule.minAngle || angle > rule.maxAngle

      if isViolating {
        if let lastTime = lastFormFeedbackTime[rule.name],
           now.timeIntervalSince(lastTime) < throttleInterval {
          continue
        }

        let feedback = FormFeedback(
          ruleName: rule.name,
          message: rule.message,
          severity: rule.severity
        )

        switch rule.severity {
        case .warning:
          repFormScore = max(0, repFormScore - 5)
        case .error:
          repFormScore = max(0, repFormScore - 15)
        case .info:
          break
        }

        sessionFormViolations.append(feedback)
        lastFormFeedbackTime[rule.name] = now
        onFormFeedback?(feedback)
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MARK: - Hold Progress
  // ═══════════════════════════════════════════════════════════

  private func handleHoldProgress(currentAngles: [String: Double], config: ExerciseConfig) {
    guard config.holdDurationMs > 0 else { return }

    var inPosition = true
    for phaseThreshold in config.phases {
      guard let angle = currentAngles[phaseThreshold.angleName] else {
        inPosition = false
        break
      }
      if angle < phaseThreshold.minAngle || angle > phaseThreshold.maxAngle {
        inPosition = false
        break
      }
    }

    if inPosition {
      if holdStartTime == nil {
        holdStartTime = Date()
      }

      let elapsed = Date().timeIntervalSince(holdStartTime!) * 1000
      let stability = min(100.0, max(0.0, repFormScore))

      let progress = HoldProgress(
        elapsedMs: elapsed,
        targetMs: config.holdDurationMs,
        stability: stability
      )

      onHoldProgress?(progress)

      if elapsed >= config.holdDurationMs {
        completeSession()
      }
    } else {
      holdStartTime = nil
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MARK: - Session Completion
  // ═══════════════════════════════════════════════════════════

  private func completeSession() {
    _status = .completed

    let totalDuration = Date().timeIntervalSince(sessionStartTime) * 1000
    let avgRepDuration = allRepDurations.isEmpty ? 0 : allRepDurations.reduce(0, +) / Double(allRepDurations.count)
    let avgFormScore = allRepFormScores.isEmpty ? 100.0 : allRepFormScores.reduce(0, +) / Double(allRepFormScores.count)

    let result = SessionResult(
      totalReps: _repCount,
      totalDurationMs: totalDuration,
      averageRepDurationMs: avgRepDuration,
      averageFormScore: avgFormScore,
      formViolations: sessionFormViolations,
      angleHistory: repAngleSnapshots
    )

    onSessionComplete?(result)
  }

  // ═══════════════════════════════════════════════════════════
  // MARK: - Countdown
  // ═══════════════════════════════════════════════════════════

  private func startCountdown() {
    var remaining = countdownSeconds

    countdownTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] timer in
      guard let self = self else {
        timer.invalidate()
        return
      }

      remaining -= 1

      if remaining <= 0 {
        timer.invalidate()
        self.countdownTimer = nil
        self._status = .active
        self.sessionStartTime = Date()
        self.repStartTime = Date()
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MARK: - Reset
  // ═══════════════════════════════════════════════════════════

  private func resetSession() {
    _status = .idle
    _currentPhase = .unknown
    _repCount = 0
    _landmarks = []
    phaseHistory = []
    repFormScore = 100.0
    repAngleSnapshots = []
    allRepDurations = []
    allRepFormScores = []
    sessionFormViolations = []
    lastFormFeedbackTime = [:]
    holdStartTime = nil
    poseWasLost = false
    targetReps = 0
    countdownSeconds = 0
    countdownTimer?.invalidate()
    countdownTimer = nil
  }
}
