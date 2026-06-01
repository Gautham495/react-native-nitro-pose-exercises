import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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

  cancelButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
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

  positioningContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 32,
    borderRadius: 20,
  },
  positioningTitle: {
    fontSize: 24,
    fontFamily: 'System',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  readinessIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF9800',
    marginVertical: 24,
  },
  readinessIndicatorReady: {
    backgroundColor: '#4CAF50',
  },
});
