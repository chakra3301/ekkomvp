import Foundation
import Network

/// Thin wrapper around `NWPathMonitor`.
///
/// `NWPathMonitor.pathUpdateHandler` is `@Sendable` and runs on the background
/// queue we hand it — it CANNOT touch main-actor state directly. We hop to the
/// main actor inside the handler before invoking `onChange`, so callers
/// (AppState) can mutate @MainActor / @Observable properties without a data race.
final class NetworkMonitor {
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "com.ekko.network-monitor")
    private var started = false

    /// Begins watching. `onChange(true)` => offline, `onChange(false)` => online.
    /// The closure is always invoked on the MAIN ACTOR.
    func start(onChange: @escaping @MainActor (Bool) -> Void) {
        guard !started else { return }
        started = true
        monitor.pathUpdateHandler = { path in            // @Sendable, BACKGROUND queue
            let offline = path.status != .satisfied
            Task { @MainActor in                          // the required hop
                onChange(offline)
            }
        }
        monitor.start(queue: queue)
    }

    func stop() { monitor.cancel() }
    deinit { monitor.cancel() }
}

// Notes:
// - `path.status == .satisfied` means a usable path exists; .unsatisfied /
//   .requiresConnection both read as offline here.
// - NWPathMonitor emits one initial update shortly after start(), so a cold
//   launch in airplane mode resolves to offline within a beat.
// - `start` is idempotent via the `started` guard.
