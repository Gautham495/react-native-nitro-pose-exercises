import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
// import { SwitchCamera } from 'lucide-react-native';
import {
  nitroPoseExercises,
  PUSHUP_CONFIG,
  type RepData,
  type FormFeedback,
  type SessionResult,
  type ExercisePhase,
  // BICEP_CURL_CONFIG,
} from 'react-native-nitro-pose-exercises';
// import { NormalCameraView } from './normal';
import { NormalCameraView } from './skia';
import { styles } from './camera-styles';
import { getFramingStatus } from './framing';

type AppPhase = 'setup' | 'positioning' | 'countdown' | 'active' | 'results';

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
  const [countdownValue, setCountdownValue] = useState(5);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(
    null
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInPosition, setIsInPosition] = useState(false);

  const [framingMessage, setFramingMessage] = useState('');

  // ─── Posture Readiness Polling ──────────────────────────────
  useEffect(() => {
    if (appPhase !== 'positioning') return;

    const interval = setInterval(() => {
      try {
        const lms = nitroPoseExercises.landmarks;
        const framing = getFramingStatus(lms, PUSHUP_CONFIG.cameraAngle);
        // const framing = getFramingStatus(lms, BICEP_CURL_CONFIG.cameraAngle);

        if (!framing.ready) {
          setFramingMessage(framing.message);
          setIsInPosition(false);
          return;
        }

        const ready = nitroPoseExercises.isReady();
        if (ready) {
          setFramingMessage('Hold still');
          setIsInPosition(true);
        } else {
          setFramingMessage('Get into push-up position');
          setIsInPosition(false);
        }
      } catch {
        setIsInPosition(false);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [appPhase]);
  useEffect(() => {
    if (appPhase !== 'positioning' || !isInPosition) return;

    // Stay in position for 1s before starting countdown — avoids false triggers
    const timer = setTimeout(() => {
      setAppPhase('countdown');
      setCountdownValue(3);

      let count = 3;
      const tick = setInterval(() => {
        count -= 1;
        setCountdownValue(count);
        if (count <= 0) {
          clearInterval(tick);
          setAppPhase('active');
        }
      }, 1000);
    }, 500);

    return () => clearTimeout(timer);
  }, [appPhase, isInPosition]);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // ─── Initialize Pose Engine ─────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        await nitroPoseExercises.initialize('');

        nitroPoseExercises.loadExercise(PUSHUP_CONFIG);
        // nitroPoseExercises.loadExercise(BICEP_CURL_CONFIG);

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

    nitroPoseExercises.onPostureLost = () => {
      setFormMessage('Get back into position');
    };

    nitroPoseExercises.onPostureRegained = () => {
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
    setIsInPosition(false);
    setAppPhase('positioning');

    nitroPoseExercises.startSession(10, 0); // countdown handled in JS now
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

      {/* Overlay UI */}
      <View style={styles.overlay}>
        {/* Top Buttons — Camera Switch */}
        {appPhase !== 'results' && (
          <View style={styles.topButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleCamera}>
              {/* <SwitchCamera color="#fff" size={28} /> */}
            </TouchableOpacity>
          </View>
        )}

        {appPhase === 'positioning' && (
          <View style={styles.positioningContainer}>
            <Text style={styles.positioningTitle}>
              {isInPosition ? 'Hold still...' : 'Get ready'}
            </Text>
            <Text style={styles.subtitleText}>{framingMessage}</Text>
            <View
              style={[
                styles.readinessIndicator,
                isInPosition && styles.readinessIndicatorReady,
              ]}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={resetSession}
            >
              <Text style={styles.stopButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Setup Phase */}
        {appPhase === 'setup' && (
          <View style={styles.setupContainer}>
            <Text style={styles.titleText}>
              {/* Push-Up  */}
              Bicep Curl Counter
            </Text>
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
