import SwiftUI
import TipKit

// First-run profile-edit coach marks. TipKit was added in iOS 17 and is
// system-styled (Liquid Glass on iOS 26), so the bubbles match the rest of
// the EKKO chrome without bespoke styling.
//
// Each tip is anchored to a specific view inside ProfileView's edit mode.
// The shared `firstEditArmed` parameter is flipped on by ProfileView when
// it enters edit mode for the first time after first-run profile creation
// (see AppState.pendingFirstProfileEdit), and flipped off when the user
// saves or cancels. TipKit persists per-tip dismissal so a user who taps
// "OK" on a bubble won't see it again next time they edit.

/// Bubble pointing at the "Editing — tap any section..." banner.
struct EditAnythingTip: Tip {
    @Parameter static var firstEditArmed: Bool = false

    var title: Text { Text("Tap any section to edit") }
    var message: Text? {
        Text("Bio, media, prompts, links — tap to change. Drag media tiles to reorder.")
    }
    var image: Image? { Image(systemName: "hand.tap.fill") }

    var rules: [Rule] {
        [#Rule(Self.$firstEditArmed) { $0 == true }]
    }
}

/// Bubble pointing at the template menu in the edit toolbar.
struct TemplateSwitchTip: Tip {
    @Parameter static var firstEditArmed: Bool = false

    var title: Text { Text("Try a different layout") }
    var message: Text? {
        Text("Switch templates from here. Your bio, media, and links stay the same.")
    }
    var image: Image? { Image(systemName: "rectangle.3.group") }

    var rules: [Rule] {
        [#Rule(Self.$firstEditArmed) { $0 == true }]
    }
}

/// Bubble pointing at the Save button in the edit toolbar.
struct SaveProfileTip: Tip {
    @Parameter static var firstEditArmed: Bool = false

    var title: Text { Text("Save when you're happy") }
    var message: Text? {
        Text("You can come back and edit any time.")
    }
    var image: Image? { Image(systemName: "checkmark.circle.fill") }

    var rules: [Rule] {
        [#Rule(Self.$firstEditArmed) { $0 == true }]
    }
}

enum OnboardingTipsState {
    private static let seenKey = "ekko-profile-edit-tips-seen"

    static var hasSeen: Bool {
        UserDefaults.standard.bool(forKey: seenKey)
    }

    /// Arm the tips so they appear once the relevant anchors are visible.
    /// Caller is responsible for setting `pendingFirstProfileEdit` first.
    static func arm() {
        EditAnythingTip.firstEditArmed = true
        TemplateSwitchTip.firstEditArmed = true
        SaveProfileTip.firstEditArmed = true
    }

    /// Disarm tips and, if at least one impression has happened (i.e. the
    /// user actually went through the editor flow), mark the sequence
    /// seen so it never re-fires.
    static func disarm(markSeen: Bool) {
        EditAnythingTip.firstEditArmed = false
        TemplateSwitchTip.firstEditArmed = false
        SaveProfileTip.firstEditArmed = false
        if markSeen {
            UserDefaults.standard.set(true, forKey: seenKey)
        }
    }
}
