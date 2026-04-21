import Foundation
import AVFoundation

/// Records audio to a temporary .m4a file using AVAudioRecorder.
@Observable
final class AudioRecorder: NSObject, AVAudioRecorderDelegate {
    var isRecording = false
    var recordingURL: URL?
    var elapsed: TimeInterval = 0
    /// Rolling amplitude samples in 0…1, newest at the end. Drives the live
    /// waveform in the chat recording bar. Trimmed to `maxLevelSamples`.
    var levels: [Float] = []
    /// Fires when the max-duration cap is reached — the caller should stop
    /// and send. Consumer wires this to `toggleRecording()` or similar.
    var onMaxDurationReached: (() -> Void)?

    /// Ceiling for a single voice message. Keeps clips snackable and bounds
    /// Supabase Storage cost. Shared with the UI countdown.
    static let maxDuration: TimeInterval = 90
    private static let maxLevelSamples = 40

    private var recorder: AVAudioRecorder?
    private var timer: Timer?

    override init() {
        super.init()
    }

    func requestPermission() async -> Bool {
        if #available(iOS 17.0, *) {
            return await AVAudioApplication.requestRecordPermission()
        } else {
            return await withCheckedContinuation { continuation in
                AVAudioSession.sharedInstance().requestRecordPermission { granted in
                    continuation.resume(returning: granted)
                }
            }
        }
    }

    func startRecording() throws {
        let session = AVAudioSession.sharedInstance()
        if #available(iOS 26.0, *) {
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetoothHFP])
        } else {
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
        }
        try session.setActive(true, options: .notifyOthersOnDeactivation)

        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("voice-\(UUID().uuidString).m4a")

        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        let newRecorder = try AVAudioRecorder(url: url, settings: settings)
        newRecorder.delegate = self
        newRecorder.isMeteringEnabled = true
        newRecorder.record()

        recorder = newRecorder
        recordingURL = url
        isRecording = true
        elapsed = 0
        levels = []

        timer = Timer.scheduledTimer(withTimeInterval: 0.08, repeats: true) { [weak self] _ in
            guard let self, let recorder = self.recorder else { return }
            recorder.updateMeters()
            self.elapsed = recorder.currentTime

            // Map -60dB…0dB to 0…1 so the waveform has a useful dynamic range.
            // Below -60dB is effectively silent; above 0 clips.
            let db = recorder.averagePower(forChannel: 0)
            let clamped = max(-60, min(0, db))
            let normalized = Float((clamped + 60) / 60)
            self.levels.append(normalized)
            if self.levels.count > Self.maxLevelSamples {
                self.levels.removeFirst(self.levels.count - Self.maxLevelSamples)
            }

            // Auto-stop at the cap — fires once, caller sends + cleans up.
            if self.elapsed >= Self.maxDuration {
                self.onMaxDurationReached?()
            }
        }
    }

    func stopRecording() -> URL? {
        recorder?.stop()
        timer?.invalidate()
        timer = nil
        isRecording = false
        levels = []
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        return recordingURL
    }

    func cancelRecording() {
        recorder?.stop()
        timer?.invalidate()
        timer = nil
        isRecording = false
        levels = []
        if let url = recordingURL {
            try? FileManager.default.removeItem(at: url)
        }
        recordingURL = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}
