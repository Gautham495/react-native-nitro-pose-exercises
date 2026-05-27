import { type HybridObject, NitroModules } from 'react-native-nitro-modules';

import { type Frame } from 'react-native-vision-camera';

// ─── Enums & Types ───────────────────────────────────────────

type ExerciseType = 'rep' | 'hold' | 'flow';

type ExercisePhase = 'up' | 'down' | 'hold' | 'transition' | 'unknown';

type FormSeverity = 'info' | 'warning' | 'error';

type SessionStatus = 'idle' | 'countdown' | 'active' | 'paused' | 'completed';

// ─── Landmark ────────────────────────────────────────────────

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

// ─── Exercise Config (passed from JS) ────────────────────────

interface AngleDefinition {
  name: string;
  landmarkA: number; // landmark index (0-32)
  landmarkB: number; // vertex of the angle
  landmarkC: number;
}

interface PhaseThreshold {
  phase: ExercisePhase;
  angleName: string;
  minAngle: number;
  maxAngle: number;
}

interface FormRule {
  name: string;
  message: string;
  severity: FormSeverity;
  angleName: string;
  minAngle: number;
  maxAngle: number;
}

interface ExerciseConfig {
  name: string;
  type: ExerciseType;
  angles: AngleDefinition[];
  phases: PhaseThreshold[];
  repSequence: ExercisePhase[]; // e.g. ['up', 'down', 'up'] for a push-up rep
  formRules: FormRule[];
  holdDurationMs: number; // for hold-based exercises
}

// ─── Callback Payloads ───────────────────────────────────────

interface RepData {
  repNumber: number;
  durationMs: number;
  formScore: number; // 0-100
  angles: AngleSnapshot[];
}

interface AngleSnapshot {
  name: string;
  value: number;
}

interface FormFeedback {
  ruleName: string;
  message: string;
  severity: FormSeverity;
}

interface HoldProgress {
  elapsedMs: number;
  targetMs: number;
  stability: number; // 0-100, how steady they are
}

interface SessionResult {
  totalReps: number;
  totalDurationMs: number;
  averageRepDurationMs: number;
  averageFormScore: number;
  formViolations: FormFeedback[];
  angleHistory: AngleSnapshot[]; // min/max per angle
}

// ─── The HybridObject ────────────────────────────────────────

interface NitroPoseExercises extends HybridObject<{
  ios: 'swift';
  android: 'kotlin';
}> {
  // Lifecycle
  initialize(modelPath: string): Promise<void>;
  release(): void;

  // Exercise setup
  loadExercise(config: ExerciseConfig): void;

  // Session control
  readonly status: SessionStatus;

  // Process a VisionCamera frame — called from frame processor worklet
  processFrame(frame: Frame): void;

  // Callbacks (set from JS side)
  onRepComplete: ((data: RepData) => void) | undefined;
  onPhaseChange: ((phase: ExercisePhase) => void) | undefined;
  onFormFeedback: ((feedback: FormFeedback) => void) | undefined;
  onHoldProgress: ((progress: HoldProgress) => void) | undefined;
  onPoseLost: (() => void) | undefined;
  onPoseRegained: (() => void) | undefined;
  onSessionComplete: ((result: SessionResult) => void) | undefined;

  // State (readable from JS for UI)
  readonly currentPhase: ExercisePhase;
  readonly repCount: number;
  readonly landmarks: Landmark[];

  // Session control
  startSession(targetReps: number, countdownSeconds: number): void;
  pauseSession(): void;
  resumeSession(): void;
  stopSession(): void;
}

const nitroPoseExercises =
  NitroModules.createHybridObject<NitroPoseExercises>('PoseExercise');

export { nitroPoseExercises };

export type {
  NitroPoseExercises,
  ExerciseConfig,
  ExerciseType,
  ExercisePhase,
  FormSeverity,
  SessionStatus,
  Landmark,
  AngleDefinition,
  PhaseThreshold,
  FormRule,
  RepData,
  AngleSnapshot,
  FormFeedback,
  HoldProgress,
  SessionResult,
};
