import Foundation
import AVFoundation

/// Records audio to a temporary .m4a file using AVAudioRecorder.
@Observable
final class AudioRecorder: NSObject, AVAudioRecorderDelegate {
    var isRecording = false
    var recordingURL: URL?
    var elapsed: TimeInterval = 0

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
        newRecorder.record()

        recorder = newRecorder
        recordingURL = url
        isRecording = true
        elapsed = 0

        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.elapsed = self?.recorder?.currentTime ?? 0
        }
    }

    func stopRecording() -> URL? {
        recorder?.stop()
        timer?.invalidate()
        timer = nil
        isRecording = false
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        return recordingURL
    }

    func cancelRecording() {
        recorder?.stop()
        timer?.invalidate()
        timer = nil
        isRecording = false
        if let url = recordingURL {
            try? FileManager.default.removeItem(at: url)
        }
        recordingURL = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}
