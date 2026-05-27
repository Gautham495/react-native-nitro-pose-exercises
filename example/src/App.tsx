import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import {
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { SwitchCamera } from 'lucide-react-native';
import {
  nitroPoseExercises,
  PUSHUP_CONFIG,
  type RepData,
  type FormFeedback,
  type SessionResult,
  type ExercisePhase,
} from 'react-native-nitro-pose-exercises';
import { NormalCameraView } from './normal';

// ─── Skia Camera (commented out — uncomment to enable skeleton overlay) ───
// import { SkiaCameraView } from './skia';

type AppPhase = 'setup' | 'countdown' | 'active' | 'results';

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();

  // ─── Camera State ───────────────────────────────────────────
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>(
    'front'
  );
  const device = useCameraDevice(cameraPosition);

  // ─── App State ──────────────────────────────────────────────
  const [appPhase, setAppPhase] = useState<AppPhase>('setup');
  const [repCount, setRepCount] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<ExercisePhase>('unknown');
  const [formMessage, setFormMessage] = useState('');
  const [countdownValue, setCountdownValue] = useState(3);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(
    null
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // ─── Permissions ────────────────────────────────────────────
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // ─── Initialize Pose Engine ─────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        await nitroPoseExercises.initialize('pose_landmarker_lite.task');
        nitroPoseExercises.loadExercise(PUSHUP_CONFIG);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize pose engine:', error);
      }
    }

    init();

    return () => {
      try {
        nitroPoseExercises.release();
      } catch {}
    };
  }, []);

  // ─── Callbacks ──────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return;

    nitroPoseExercises.onRepComplete = (data: RepData) => {
      setRepCount(data.repNumber);
      console.log(
        `Rep ${data.repNumber} — ${data.durationMs.toFixed(0)}ms — form: ${data.formScore}`
      );
    };

    nitroPoseExercises.onPhaseChange = (phase: ExercisePhase) => {
      setCurrentPhase(phase);
    };

    nitroPoseExercises.onFormFeedback = (feedback: FormFeedback) => {
      setFormMessage(feedback.message);
      setTimeout(() => setFormMessage(''), 3000);
    };

    nitroPoseExercises.onPoseLost = () => {
      setFormMessage('Get back in frame!');
    };

    nitroPoseExercises.onPoseRegained = () => {
      setFormMessage('');
    };

    nitroPoseExercises.onSessionComplete = (result: SessionResult) => {
      setSessionResult(result);
      setAppPhase('results');
    };
  }, [isInitialized]);

  // ─── Toggle Helpers ─────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    setCameraPosition((prev) => (prev === 'front' ? 'back' : 'front'));
  }, []);

  // ─── Start Session ──────────────────────────────────────────
  const startSession = useCallback(() => {
    if (!isInitialized) return;

    setRepCount(0);
    setCurrentPhase('unknown');
    setFormMessage('');
    setSessionResult(null);
    setCountdownValue(3);
    setAppPhase('countdown');

    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      setCountdownValue(count);
      if (count <= 0) {
        clearInterval(timer);
        setAppPhase('active');
      }
    }, 1000);

    nitroPoseExercises.startSession(10, 3);
  }, [isInitialized]);

  // ─── Stop Session ───────────────────────────────────────────
  const stopSession = useCallback(() => {
    nitroPoseExercises.stopSession();
  }, []);

  // ─── Reset ──────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    setRepCount(0);
    setCurrentPhase('unknown');
    setFormMessage('');
    setSessionResult(null);
    setAppPhase('setup');
  }, []);

  // ─── Render Guards ──────────────────────────────────────────
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>No camera device found</Text>
      </View>
    );
  }

  // ─── Render ─────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Camera */}
      <NormalCameraView device={device} isActive={appPhase !== 'results'} />

      {/* To enable Skia skeleton overlay, replace NormalCameraView above with: */}
      {/* <SkiaCameraView
        cameraPosition={cameraPosition}
        isActive={appPhase !== 'results'}
      /> */}

      {/* Overlay UI */}
      <View style={styles.overlay}>
        {/* Top Buttons — Camera Switch */}
        {appPhase !== 'results' && (
          <View style={styles.topButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleCamera}>
              <SwitchCamera color="#fff" size={28} />
            </TouchableOpacity>
          </View>
        )}

        {/* Setup Phase */}
        {appPhase === 'setup' && (
          <View style={styles.setupContainer}>
            <Text style={styles.titleText}>Push-Up Counter</Text>
            <Text style={styles.subtitleText}>
              {isInitialized
                ? 'Position your phone and get ready'
                : 'Loading pose engine...'}
            </Text>
            <TouchableOpacity
              style={[styles.button, !isInitialized && styles.buttonDisabled]}
              onPress={startSession}
              disabled={!isInitialized}
            >
              <Text style={styles.buttonText}>
                {isInitialized ? 'Start (10 reps)' : 'Loading...'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Countdown Phase */}
        {appPhase === 'countdown' && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{countdownValue}</Text>
            <Text style={styles.subtitleText}>Get in position!</Text>
          </View>
        )}

        {/* Active Phase */}
        {appPhase === 'active' && (
          <>
            {/* Rep Counter */}
            <View style={styles.repContainer}>
              <Text style={styles.repCount}>{repCount}</Text>
              <Text style={styles.repLabel}>REPS</Text>
            </View>

            {/* Phase Indicator */}
            <View style={styles.phaseContainer}>
              <View
                style={[
                  styles.phaseIndicator,
                  currentPhase === 'down' ? styles.phaseDown : styles.phaseUp,
                ]}
              />
              <Text style={styles.phaseText}>
                {currentPhase === 'down' ? '↓ DOWN' : '↑ UP'}
              </Text>
            </View>

            {/* Form Feedback */}
            {formMessage !== '' && (
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackText}>{formMessage}</Text>
              </View>
            )}

            {/* Stop Button */}
            <TouchableOpacity style={styles.stopButton} onPress={stopSession}>
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Results Phase */}
        {appPhase === 'results' && sessionResult && (
          <View style={styles.resultsContainer}>
            <Text style={styles.titleText}>Session Complete</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total Reps</Text>
              <Text style={styles.resultValue}>{sessionResult.totalReps}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Duration</Text>
              <Text style={styles.resultValue}>
                {(sessionResult.totalDurationMs / 1000).toFixed(1)}s
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Avg Rep Speed</Text>
              <Text style={styles.resultValue}>
                {(sessionResult.averageRepDurationMs / 1000).toFixed(1)}s
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Form Score</Text>
              <Text style={styles.resultValue}>
                {sessionResult.averageFormScore.toFixed(0)}/100
              </Text>
            </View>

            {sessionResult.formViolations.length > 0 && (
              <View style={styles.violationsContainer}>
                <Text style={styles.violationsTitle}>Form Issues:</Text>
                {sessionResult.formViolations
                  .filter(
                    (v, i, arr) =>
                      arr.findIndex((x) => x.ruleName === v.ruleName) === i
                  )
                  .map((violation, index) => (
                    <Text key={index} style={styles.violationText}>
                      • {violation.message}
                    </Text>
                  ))}
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={resetSession}>
              <Text style={styles.buttonText}>Do Another Set</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Top Buttons
  topButtons: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'column',
    gap: 12,
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 24,
  },

  // Setup
  setupContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 32,
    borderRadius: 20,
  },
  titleText: {
    fontSize: 28,
    fontFamily: 'System',
    color: '#fff',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: 'System',
    color: '#aaa',
    marginBottom: 24,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 18,
    fontFamily: 'System',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Button
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'System',
    color: '#fff',
  },

  // Countdown
  countdownContainer: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 120,
    fontFamily: 'System',
    color: '#fff',
  },

  // Active - Rep Counter
  repContainer: {
    position: 'absolute',
    top: 80,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  repCount: {
    fontSize: 72,
    fontFamily: 'System',
    color: '#4CAF50',
  },
  repLabel: {
    fontSize: 16,
    fontFamily: 'System',
    color: '#aaa',
    letterSpacing: 4,
  },

  // Phase Indicator
  phaseContainer: {
    position: 'absolute',
    top: 220,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  phaseIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  phaseUp: {
    backgroundColor: '#4CAF50',
  },
  phaseDown: {
    backgroundColor: '#FF9800',
  },
  phaseText: {
    fontSize: 18,
    fontFamily: 'System',
    color: '#fff',
  },

  // Form Feedback
  feedbackContainer: {
    position: 'absolute',
    bottom: 160,
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  feedbackText: {
    fontSize: 16,
    fontFamily: 'System',
    color: '#fff',
    textAlign: 'center',
  },

  // Stop Button
  stopButton: {
    position: 'absolute',
    bottom: 80,
    backgroundColor: '#f44336',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  stopButtonText: {
    fontSize: 18,
    fontFamily: 'System',
    color: '#fff',
  },

  // Results
  resultsContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 32,
    borderRadius: 20,
    width: '85%',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  resultLabel: {
    fontSize: 16,
    fontFamily: 'System',
    color: '#aaa',
  },
  resultValue: {
    fontSize: 16,
    fontFamily: 'System',
    color: '#fff',
  },
  violationsContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
  },
  violationsTitle: {
    fontSize: 14,
    fontFamily: 'System',
    color: '#FF9800',
    marginBottom: 8,
  },
  violationText: {
    fontSize: 14,
    fontFamily: 'System',
    color: '#ccc',
    marginBottom: 4,
  },
});
