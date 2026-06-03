// ios/NitroPoseExercises.swift

import Foundation
import NitroModules
import VisionCamera
import AVFoundation
import Vision

class NitroPoseExercises: HybridNitroPoseExercisesSpec {

  // ─── Vision Framework ───────────────────────────────────────
  private var isInitialized = false

  // ─── Landmark Index Mapping ─────────────────────────────────
  // Maps Apple Vision joint names to MediaPipe landmark indices
  // that our JS configs expect
  private static let visionToMediaPipeMap: [(VNHumanBodyPoseObservation.JointName, Int)] = [
    (.nose, 0),
    (.leftShoulder, 11),
    (.rightShoulder, 12),
    (.leftElbow, 13),
    (.rightElbow, 14),
    (.leftWrist, 15),
    (.rightWrist, 16),
    (.leftHip, 23),
    (.rightHip, 24),
    (.leftKnee, 25),
    (.rightKnee, 26),
    (.leftAnkle, 27),
    (.rightAnkle, 28),
    // Vision also provides these but they map to non-standard indices
    // We include them for skeleton drawing
    (.neck, 10),         // approximate — MediaPipe doesn't have neck
    (.root, 33),         // hip center — not in MediaPipe, we skip
    (.leftEar, 7),
    (.rightEar, 8),
    (.leftEye, 2),
    (.rightEye, 5),
  ]

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

  // ─── Form Tracking ──────────────────────────────────────────
  private var lastFormFeedbackTime: [String: Date] = [:]
  private var sessionFormViolations: [FormFeedback] = []
  private var repFormScore: Double = 100.0
  private var repAngleSnapshots: [AngleSnapshot] = []
  private var allRepDurations: [Double] = []
  private var allRepFormScores: [Double] = []

  // ─── Posture Gate ──────────────────────────────────────────
private var consecutivePostureFailures: Int = 0
private let postureFailureThreshold: Int = 10  // ~1s at 30fps with throttle=3
private var postureWasLost = false

  // ─── Pose Tracking ──────────────────────────────────────────
  private var poseWasLost = false

  // ─── Frame Throttle ─────────────────────────────────────────
  private var frameCount: Int = 0
  private let processEveryNFrames: Int = 3

  // ─── Callbacks ──────────────────────────────────────────────
  var onRepComplete: ((_ data: RepData) -> Void)?
  var onPhaseChange: ((_ phase: ExercisePhase) -> Void)?
  var onFormFeedback: ((_ feedback: FormFeedback) -> Void)?
  var onHoldProgress: ((_ progress: HoldProgress) -> Void)?
  var onPoseLost: (() -> Void)?
  var onPoseRegained: (() -> Void)?
  var onSessionComplete: ((_ result: SessionResult) -> Void)?
  var onPostureLost: (() -> Void)?
  var onPostureRegained: (() -> Void)?

  // ─── Hold Tracking ──────────────────────────────────────────
  private var holdStartTime: Date?

  // ═══════════════════════════════════════════════════════════
  // MARK: - Lifecycle
  // ═══════════════════════════════════════════════════════════

  func initialize(modelPath: String) throws -> Promise<Void> {
    // No model loading needed — Vision framework is built into iOS
    return Promise.async { [weak self] in
      guard let self = self else { return }
      self.isInitialized = true
      print("[PoseExercise] Initialized with Apple Vision (no model file needed)")
    }
  }

  func release() throws {
    isInitialized = false
    _status = .idle
    resetSession()
  }

  func isReady() throws -> Bool {
  guard let config = exerciseConfig else { return false }
  guard !_landmarks.isEmpty else { return false }
return isPostureValid(family: config.postureFamily, threshold: config.visibilityThreshold)
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

private static func cgOrientation(orientation: CameraOrientation, isMirrored: Bool) -> CGImagePropertyOrientation {
  switch orientation {
  case .up:    return isMirrored ? .upMirrored    : .up
  case .down:  return isMirrored ? .downMirrored  : .down
  case .left:  return isMirrored ? .leftMirrored  : .left
  case .right: return isMirrored ? .rightMirrored : .right
  @unknown default: return .up
  }
}

  // ═══════════════════════════════════════════════════════════
  // MARK: - Frame Processing (Apple Vision)
  // ═══════════════════════════════════════════════════════════

  func processFrame(frame: any HybridFrameSpec) throws {
    guard _status == .active || _status == .countdown else { return }

    guard isInitialized else { return }

    // Frame throttle
    frameCount += 1
    if frameCount % processEveryNFrames != 0 { return }

    // Get CMSampleBuffer from VisionCamera frame
    guard let nativeFrame = frame as? any NativeFrame,
          let sampleBuffer = nativeFrame.sampleBuffer else { return }

    // Get pixel buffer — Vision takes CVPixelBuffer directly, no color conversion needed
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

    // Create Vision request
    let request = VNDetectHumanBodyPoseRequest()

      print("[PoseExercise] orientation=\(frame.orientation) isMirrored=\(frame.isMirrored) type=\(type(of: frame.orientation))")

      let cgOrient = Self.cgOrientation(orientation: frame.orientation, isMirrored: frame.isMirrored)
      let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: cgOrient, options: [:])
      
    do {
      try handler.perform([request])

      guard let observation = request.results?.first else {
        // No pose detected
        if !poseWasLost {
          poseWasLost = true
          onPoseLost?()
        }
        _landmarks = []
        return
      }

      // Pose detected
      if poseWasLost {
        poseWasLost = false
        onPoseRegained?()
      }

      // Map Vision joints to MediaPipe landmark array (34 slots, indices 0-33)
      // Fill all slots with zero-visibility first
      var landmarkArray = [Landmark](repeating: Landmark(x: 0, y: 0, z: 0, visibility: 0), count: 34)

      for (jointName, mediaPipeIndex) in NitroPoseExercises.visionToMediaPipeMap {
        guard mediaPipeIndex < 34 else { continue }

        do {
          let point = try observation.recognizedPoint(jointName)

          // Vision uses bottom-left origin (0,0 = bottom-left)
          // MediaPipe uses top-left origin (0,0 = top-left)
          // Flip Y axis
          let confidence = Double(point.confidence)

          landmarkArray[mediaPipeIndex] = Landmark(
            x: Double(point.location.x),
            y: 1.0 - Double(point.location.y),  // flip Y
            z: 0,  // Vision doesn't provide Z depth
            visibility: confidence
          )

          // Debug logging — uncomment to verify mapping
          // print("[PoseExercise] \(jointName.rawValue.rawValue) → index \(mediaPipeIndex): x=\(String(format: "%.3f", point.location.x)) y=\(String(format: "%.3f", 1.0 - Double(point.location.y))) conf=\(String(format: "%.2f", confidence))")

        } catch {
          // Joint not detected — leave as zero visibility
          continue
        }
      }

      _landmarks = landmarkArray

      if _status == .active {
        processExerciseLogic()
      }

    } catch {
      print("[PoseExercise] Vision error: \(error.localizedDescription)")
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MARK: - Exercise Logic Engine
  // ═══════════════════════════════════════════════════════════

private func processExerciseLogic() {
  guard let config = exerciseConfig else { return }
  guard !_landmarks.isEmpty else { return }

  // Hold exercises get 3x more tolerance — stationary poses suffer from
  // visibility flicker more than active reps.
  let failureThreshold = config.type == .hold
    ? postureFailureThreshold * 3
    : postureFailureThreshold

  // Posture gate with hysteresis
  if !isPostureValid(family: config.postureFamily, threshold: config.visibilityThreshold) {
    consecutivePostureFailures += 1
    if consecutivePostureFailures >= failureThreshold {
      if !postureWasLost {
        postureWasLost = true
        onPostureLost?()
      }
      _currentPhase = .unknown
      phaseHistory = []
    }
    return
  }

  consecutivePostureFailures = 0
  if postureWasLost {
    postureWasLost = false
    onPostureRegained?()
  }

  // Angle calculation
  let visThreshold = config.visibilityThreshold
  var currentAngles: [String: Double] = [:]
  var angleSnapshots: [AngleSnapshot] = []

  for angleDef in config.angles {
    let a = Int(angleDef.landmarkA)
    let b = Int(angleDef.landmarkB)
    let c = Int(angleDef.landmarkC)

    guard a < _landmarks.count, b < _landmarks.count, c < _landmarks.count else { continue }

    guard _landmarks[a].visibility > visThreshold,
          _landmarks[b].visibility > visThreshold,
          _landmarks[c].visibility > visThreshold else { continue }

    let angle = calculateAngle(
      pointA: _landmarks[a],
      vertex: _landmarks[b],
      pointC: _landmarks[c]
    )

    currentAngles[angleDef.name] = angle
    angleSnapshots.append(AngleSnapshot(name: angleDef.name, value: angle))
  }

  repAngleSnapshots = angleSnapshots

  let detectedPhase = determinePhase(from: currentAngles, config: config)

  if detectedPhase != _currentPhase && detectedPhase != .unknown {
    let previousPhase = _currentPhase
    _currentPhase = detectedPhase
    onPhaseChange?(detectedPhase)
    handlePhaseTransition(from: previousPhase, to: detectedPhase, config: config)
  }

  checkFormRules(currentAngles: currentAngles, config: config)

  if config.type == .hold {
    handleHoldProgress(currentAngles: currentAngles, config: config)
  }
}

  // ═══════════════════════════════════════════════════════════
// MARK: - Posture Gates
// ═══════════════════════════════════════════════════════════

private func isPostureValid(family: PostureFamily, threshold: Double) -> Bool {
  guard _landmarks.count >= 33 else { return false }

  let ls = _landmarks[11], rs = _landmarks[12]
  let lh = _landmarks[23], rh = _landmarks[24]
  let lk = _landmarks[25], rk = _landmarks[26]
  let la = _landmarks[27], ra = _landmarks[28]

  // Only require torso visible — knees and ankles are optional
  let torsoVisible = ls.visibility > threshold && rs.visibility > threshold
                  && lh.visibility > threshold && rh.visibility > threshold
  guard torsoVisible else { return false }

  let shoulderY = (ls.y + rs.y) / 2
  let hipY = (lh.y + rh.y) / 2
  let shoulderX = (ls.x + rs.x) / 2
  let hipX = (lh.x + rh.x) / 2

  let kneesVisible = lk.visibility > threshold && rk.visibility > threshold
  let anklesVisible = la.visibility > threshold && ra.visibility > threshold
  let kneeY = kneesVisible ? (lk.y + rk.y) / 2 : hipY
  let ankleY = anklesVisible ? (la.y + ra.y) / 2 : kneeY

  switch family {
  case .horizontalprone, .supine:
    // Horizontal body — torso, plus ankles if visible
    let ys: [Double] = anklesVisible
      ? [shoulderY, hipY, ankleY]
      : [shoulderY, hipY]
    return ((ys.max() ?? 0) - (ys.min() ?? 0)) < 0.25

  case .standingupright:
    // Torso vertical (shoulders above hips). If knees visible, check chain.
    if kneesVisible {
      return shoulderY < hipY - 0.08
          && hipY < kneeY + 0.05
          && (anklesVisible ? kneeY < ankleY : true)
    } else {
      return shoulderY < hipY - 0.08
    }

  case .seated:
    // Forward-leaning torso. If knees visible, also check hip-knee distance.
    if kneesVisible {
      return shoulderY < hipY - 0.05 && Swift.abs(hipY - kneeY) < 0.20
    } else {
      return shoulderY < hipY - 0.05
    }

  case .sideplank:
    // Body horizontal, shoulders and hips stacked in x
    let ySpread = Swift.abs(shoulderY - hipY)
    let shoulderHipDx = Swift.abs(shoulderX - hipX)
    return ySpread < 0.20 && shoulderHipDx < 0.15

  case .inverted:
    // Genuinely needs ankles — hips highest of all three
    guard anklesVisible else { return false }
    return hipY < shoulderY && hipY < ankleY

  case .none:
    return true
  }
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
    return angleRad * (180.0 / .pi)
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
    frameCount = 0
    consecutivePostureFailures = 0
    postureWasLost = false
  }
}
