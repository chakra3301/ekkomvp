import SwiftUI
import WidgetKit

// Widget bundle for the EKKO Connect app — right now only the match Live
// Activity; static home-screen widgets can be added here later without a new
// target.

@main
struct EKKOConnectWidgetsBundle: WidgetBundle {
    var body: some Widget {
        MatchLiveActivity()
    }
}
