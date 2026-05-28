<a href="https://gauthamvijay.com">
  <picture>
    <img alt="react-native-nitro-pose-exercises-banner" src="./docs/img/banner.png" />
  </picture>
</a>

# react-native-nitro-pose-exercises

A **React Native Nitro Module** for real-time, on-device exercise tracking using pose estimation. Uses **OS-native pose detection** — Apple Vision on iOS and Google ML Kit on Android — with **VisionCamera v5**.

* 🏋️ **Rep Counting** — Automatic rep detection with configurable state machines
* 🧘 **Hold Tracking** — Duration and stability tracking for planks, yoga poses, and isometric holds
* 📐 **Form Validation** — Real-time form feedback with configurable angle-based rules
* 💀 **Skeleton Overlay** — Optional Skia-powered skeleton rendering over the camera feed
* ⚡ **Fully Native** — OS-level pose detection via Nitro Modules, zero JS bridge overhead
* 📦 **Zero Model Bundling** — No ML model files to download or ship with your app

---

> [!IMPORTANT]
>
> * Requires React Native **0.76+** with Nitro Modules and VisionCamera **v5**.
> * Must be tested on a **physical device** — camera + ML inference don't work on simulators.
> * iOS requires **iOS 14+** (Vision body pose API). Android requires **API 23+** (ML Kit).

---

## 📦 Installation

```bash
npm install react-native-nitro-pose-exercises react-native-nitro-modules
npm install react-native-vision-camera react-native-nitro-image
npm install react-native-vision-camera-worklets react-native-worklets
npm install react-native-reanimated
```

**For Skia skeleton overlay (optional):**

```bash
npm install @shopify/react-native-skia react-native-vision-camera-skia
```

```bash
cd ios && pod install
```

> [!NOTE]
> This package uses **OS-native pose detection** on both platforms.
> iOS uses Apple's **Vision framework** (`VNDetectHumanBodyPoseRequest`) — built into iOS, no extra dependencies.
> Android uses **Google ML Kit Pose Detection** (`com.google.mlkit:pose-detection:18.0.0-beta5`) — model auto-managed via Play Services.
> **No model files to bundle, no extra downloads, no color format conversions.**

---

## Demo

<table>
  <tr>
    <th align="center">🍏 iOS Normal Mode</th>
    <th align="center">🍏 iOS Skia Mode</th>
  </tr>
  <tr>
    <td align="center">
    <img alt="android" src="./docs/img/normal-iOS.png"  height="650" width="300"/>
    </td>
    <td align="center">
    <img alt="android" src="./docs/img/skia-iOS.png"  height="650" width="300"/>
    </td>
  </tr>
</table>

---

## 🧠 Overview

| Feature | Description |
| --- | --- |
| **Rep-Based Exercises** | Cyclic state machine (UP → DOWN → UP = 1 rep). Push-ups, squats, curls. |
| **Hold-Based Exercises** | Single target pose with duration tracking. Planks, wall sits, yoga poses. |
| **Flow-Based Exercises** | Ordered sequence of poses. Sun salutation, yoga flows. *(coming soon)* |
| **Form Feedback** | Angle-based rules with throttled real-time callbacks. |
| **Skeleton Overlay** | Body skeleton drawn over camera via Skia (19 joints iOS, 33 joints Android). |
| **Bilateral Tracking** | Left and right side angles tracked independently. |

---

## 🔧 Setup

### No Model File Needed

Unlike MediaPipe-based solutions, this library uses OS-native APIs. There is **no model file to download or bundle**.

* **iOS:** Apple Vision is a system framework — it's already on every iPhone running iOS 14+.
* **Android:** ML Kit manages its own model via Google Play Services — it downloads and updates automatically.

### Permissions

**iOS — `Info.plist`:**

```xml
<key>NSCameraUsageDescription</key>
<string>Camera is needed for pose detection during exercises</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access for audio during exercise sessions</string>
```

**Android — `AndroidManifest.xml`:**

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

### Babel Config

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-worklets/plugin',
    'react-native-reanimated/plugin', // must be last
  ],
};
```

### Podspec (for library authors)

The iOS podspec needs the Vision and AVFoundation system frameworks:

```ruby
 s.frameworks = ["AVFoundation", "Vision"]
```

No CocoaPods dependencies required — Vision is built into iOS.

### Android Gradle (for library authors)

Add ML Kit Pose Detection to `android/build.gradle`:

```groovy
dependencies {
    implementation 'com.google.mlkit:pose-detection:18.0.0-beta5'
}
```

---

## ⚙️ Usage

### Basic — Normal Camera (No Skeleton)

```tsx
import { useEffect, useCallback, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
  useAsyncRunner,
} from 'react-native-vision-camera';
import {
  nitroPoseExercises,
  PUSHUP_CONFIG,
  type RepData,
  type FormFeedback,
  type SessionResult,
} from 'react-native-nitro-pose-exercises';

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const asyncRunner = useAsyncRunner();
  const [repCount, setRepCount] = useState(0);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  // Initialize pose engine — modelPath is ignored (OS-native, no model file)
  useEffect(() => {
    async function init() {
      await nitroPoseExercises.initialize('');
      nitroPoseExercises.loadExercise(PUSHUP_CONFIG);

      nitroPoseExercises.onRepComplete = (data: RepData) => {
        setRepCount(data.repNumber);
        console.log(`Rep ${data.repNumber} — form: ${data.formScore}`);
      };

      nitroPoseExercises.onFormFeedback = (feedback: FormFeedback) => {
        console.log(`Form: ${feedback.message}`);
      };

      nitroPoseExercises.onSessionComplete = (result: SessionResult) => {
        console.log(
          `Done! ${result.totalReps} reps, avg form: ${result.averageFormScore}`
        );
      };

      // Start: 10 target reps, 3 second countdown
      nitroPoseExercises.startSession(10, 3);
    }

    init();
    return () => {
      nitroPoseExercises.release();
    };
  }, []);

  // Frame processor
  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    onFrame(frame) {
      'worklet';
      const accepted = asyncRunner.runAsync(() => {
        'worklet';
        try {
          nitroPoseExercises.processFrame(frame);
        } finally {
          frame.dispose();
        }
      });
      if (!accepted) frame.dispose();
    },
  });

  if (!hasPermission || !device) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        outputs={[frameOutput]}
      />
      <Text style={styles.repText}>{repCount} REPS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  repText: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    fontSize: 48,
    fontFamily: 'System',
    color: '#4CAF50',
  },
});
```

### Skeleton Overlay — SkiaCamera

```tsx
import { SkiaCamera } from 'react-native-vision-camera-skia'
import { Skia } from '@shopify/react-native-skia'
import { nitroPoseExercises } from 'react-native-nitro-pose-exercises'

const SKELETON_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 23], [12, 24], [23, 24],  // Torso
  [11, 13], [13, 15],                        // Left arm
  [12, 14], [14, 16],                        // Right arm
  [23, 25], [25, 27],                        // Left leg
  [24, 26], [26, 28],                        // Right leg
]

<SkiaCamera
  style={StyleSheet.absoluteFill}
  isActive={true}
  device="back"
  pixelFormat="rgb"
  onFrame={(frame, render) => {
    'worklet'
    try {
      nitroPoseExercises.processFrame(frame)
      const landmarks = nitroPoseExercises.landmarks

      render(({ frameTexture, canvas }) => {
        canvas.drawImage(frameTexture, 0, 0)

        if (landmarks && landmarks.length > 0) {
          const w = frame.width
          const h = frame.height

          // Draw bones
          const linePaint = Skia.Paint()
          linePaint.setColor(Skia.Color('#00FF00'))
          linePaint.setStrokeWidth(4)
          linePaint.setStyle(1)

          for (const [i, j] of SKELETON_CONNECTIONS) {
            if (i < landmarks.length && j < landmarks.length) {
              const a = landmarks[i]
              const b = landmarks[j]
              if (a.visibility > 0.5 && b.visibility > 0.5) {
                canvas.drawLine(a.x * w, a.y * h, b.x * w, b.y * h, linePaint)
              }
            }
          }

          // Draw joints
          const jointPaint = Skia.Paint()
          jointPaint.setColor(Skia.Color('#00FFFF'))
          jointPaint.setStyle(0)

          for (let idx = 0; idx < landmarks.length; idx++) {
            const lm = landmarks[idx]
            if (lm.visibility > 0.5) {
              canvas.drawCircle(lm.x * w, lm.y * h, 6, jointPaint)
            }
          }
        }
      })
    } finally {
      frame.dispose()
    }
  }}
/>
```

---

## 🧩 API Reference

### Lifecycle

```ts
// Initialize the pose engine (modelPath is ignored — OS-native, no model file needed)
initialize(modelPath: string): Promise<void>

// Clean up resources
release(): void
```

### Exercise Setup

```ts
// Load an exercise config (built-in or custom)
loadExercise(config: ExerciseConfig): void
```

### Session Control

```ts
startSession(targetReps: number, countdownSeconds: number): void
pauseSession(): void
resumeSession(): void
stopSession(): void
```

### Frame Processing

```ts
// Pass VisionCamera frame for pose detection — call from frame processor
processFrame(frame: Frame): void
```

### State (Readable)

```ts
readonly status: SessionStatus        // 'idle' | 'countdown' | 'active' | 'paused' | 'completed'
readonly currentPhase: ExercisePhase   // 'up' | 'down' | 'hold' | 'transition' | 'unknown'
readonly repCount: number
readonly landmarks: Landmark[]         // Body landmarks (mapped to MediaPipe indices)
```

### Callbacks

```ts
onRepComplete: ((data: RepData) => void) | undefined
onPhaseChange: ((phase: ExercisePhase) => void) | undefined
onFormFeedback: ((feedback: FormFeedback) => void) | undefined
onHoldProgress: ((progress: HoldProgress) => void) | undefined
onPoseLost: (() => void) | undefined
onPoseRegained: (() => void) | undefined
onSessionComplete: ((result: SessionResult) => void) | undefined
```

---

### Callback Payloads

#### RepData

```ts
{
  repNumber: number       // Current rep count
  durationMs: number      // Time taken for this rep
  formScore: number       // 0-100 form quality score
  angles: AngleSnapshot[] // Joint angles at rep completion
}
```

#### FormFeedback

```ts
{
  ruleName: string        // e.g. 'hipSag'
  message: string         // e.g. 'Keep your hips up'
  severity: FormSeverity  // 'info' | 'warning' | 'error'
}
```

#### SessionResult

```ts
{
  totalReps: number
  totalDurationMs: number
  averageRepDurationMs: number
  averageFormScore: number
  formViolations: FormFeedback[]
  angleHistory: AngleSnapshot[]
}
```

---

## 🏋️ Built-In Exercise Configs

### Rep-Based

| Config | Exercise | Primary Angle | Form Rules |
| --- | --- | --- | --- |
| `PUSHUP_CONFIG` | Push-Up | Elbow (140°–180° up, 30°–110° down) | Hip sag, hip pike |
| `SQUAT_CONFIG` | Squat | Knee (155°–180° up, 50°–105° down) | Knees caving, leaning forward |
| `BICEP_CURL_CONFIG` | Bicep Curl | Elbow (150°–180° down, 25°–70° up) | Elbow flare, swinging |
| `SHOULDER_PRESS_CONFIG` | Shoulder Press | Elbow (155°–180° up, 60°–100° down) | Back arch |
| `LUNGE_CONFIG` | Lunge | Front knee (155°–180° up, 70°–110° down) | Knee over toe, torso lean |
| `SITUP_CONFIG` | Sit-Up | Hip (130°–180° down, 40°–90° up) | Neck strain |
| `TRICEP_DIP_CONFIG` | Tricep Dip | Elbow (150°–180° up, 60°–100° down) | Going too deep |

### Hold-Based

| Config | Exercise | Hold Angle | Duration | Form Rules |
| --- | --- | --- | --- | --- |
| `PLANK_CONFIG` | Plank | Hip 155°–180° | 60s | Hip sag, hip pike |
| `WALL_SIT_CONFIG` | Wall Sit | Knee 80°–110° | 45s | Too high, leaning forward |

### Yoga Poses

| Config | Exercise | Hold Angle | Duration | Form Rules |
| --- | --- | --- | --- | --- |
| `TREE_POSE_CONFIG` | Tree Pose (Vrksasana) | Standing leg 165°–180° | 30s | Standing leg bent, leaning torso |
| `WARRIOR_I_CONFIG` | Warrior I (Virabhadrasana I) | Front knee 80°–110° | 30s | Knee too straight, back leg bent, arms not extended, torso leaning |
| `WARRIOR_II_CONFIG` | Warrior II (Virabhadrasana II) | Front knee 80°–110° | 30s | Knee too straight, back leg bent, arms drooping |
| `DOWNWARD_DOG_CONFIG` | Downward Dog (Adho Mukha Svanasana) | Hip 55°–100° | 30s | Arms bent, legs bent, hips too low |
| `CHAIR_POSE_CONFIG` | Chair Pose (Utkatasana) | Knee 90°–130° | 30s | Knees too straight, leaning forward, arms not up |
| `COBRA_POSE_CONFIG` | Cobra Pose (Bhujangasana) | Hip extension 120°–170° | 30s | Shoulders tensed, legs bending |

### Custom Exercise Config

```ts
import type { ExerciseConfig } from 'react-native-nitro-pose-exercises';

const MY_EXERCISE: ExerciseConfig = {
  name: 'Custom Exercise',
  type: 'rep',  // 'rep' | 'hold'
  angles: [
    { name: 'myAngle', landmarkA: 11, landmarkB: 13, landmarkC: 15 },
  ],
  phases: [
    { phase: 'up', angleName: 'myAngle', minAngle: 150, maxAngle: 180 },
    { phase: 'down', angleName: 'myAngle', minAngle: 30, maxAngle: 100 },
  ],
  repSequence: ['up', 'down', 'up'],
  formRules: [],
  holdDurationMs: 0,
};
```

---

## 📐 Landmark Index Reference

Landmarks are mapped to MediaPipe-compatible indices on both platforms. iOS Vision provides 19 joints (all exercise-critical joints covered), Android ML Kit provides the full 33.

| Index | Landmark | Index | Landmark |
| --- | --- | --- | --- |
| 0 | Nose | 16 | Right wrist |
| 11 | Left shoulder | 23 | Left hip |
| 12 | Right shoulder | 24 | Right hip |
| 13 | Left elbow | 25 | Left knee |
| 14 | Right elbow | 26 | Right knee |
| 15 | Left wrist | 27 | Left ankle |

**iOS note:** Vision provides 19 joints. Indices not available from Vision (face details 1-10, hands 17-22, feet 29-32) are filled with `visibility: 0` and skipped by the skeleton overlay.

**Android note:** ML Kit provides all 33 landmarks matching MediaPipe indices exactly.

---

## 🏗️ Architecture — OS-Native vs MediaPipe

| | OS-Native (current) | MediaPipe (previous) |
| --- | --- | --- |
| **iOS** | Apple Vision framework (built-in) | MediaPipeTasksVision (CocoaPod) |
| **Android** | Google ML Kit (Play Services) | com.google.mediapipe:tasks-vision |
| **Model file** | None needed | ~3 MB bundled `.task` file |
| **Color conversion** | None — takes CVPixelBuffer/ImageProxy directly | BGRA required (iOS), NV21→RGB (Android) |
| **App size impact** | ~200 KB (Nitro module code only) | ~11-15 MB (SDK + model) |
| **Updates** | OS/Play Services updates | Manual model file replacement |

---

## 📏 Camera Angle Guide

For best results, the camera should see the exerciser from a **side profile**:

| ✅ Good | ❌ Bad |
| --- | --- |
| Side view, full body visible | Front-facing view |
| Phone at waist height, 6-8 ft away | Ground-level angle |
| Well-lit environment | Heavy glare or backlight |

---

## 🧩 Supported Platforms

| Platform | Status | Notes |
| --- | --- | --- |
| **iOS** | ✅ Supported | Requires physical device, iOS 14+ (Vision body pose) |
| **Android** | ✅ Supported | API 23+ (ML Kit), Google Play Services required |
| **iOS Simulator** | ❌ Not supported | No camera access |
| **Android Emulator** | ❌ Not supported | No real camera feed |

---

## 📊 App Size Impact

| Component | Size |
| --- | --- |
| Nitro module code (Swift + Kotlin) | ~200 KB |
| ML Kit (Android, via Play Services) | ~0 KB (managed externally) |
| Vision framework (iOS, built-in) | ~0 KB (system framework) |
| **Total new addition** | **~200 KB** |

Compared to the MediaPipe approach (~11-15 MB), the OS-native approach adds virtually zero app size.

---

## 🤝 Contributing

PRs welcome!

* [Development Workflow](CONTRIBUTING.md#development-workflow)
* [Sending a PR](CONTRIBUTING.md#sending-a-pull-request)
* [Code of Conduct](CODE_OF_CONDUCT.md)

---

## 🪪 License

MIT © [**Gautham Vijayan**](https://gauthamvijay.com)

---

Made with ❤️ and [**Nitro Modules**](https://nitro.margelo.com) + [**VisionCamera**](https://visioncamera.margelo.com) + [**Apple Vision**](https://developer.apple.com/documentation/vision) + [**ML Kit**](https://developers.google.com/ml-kit/vision/pose-detection)