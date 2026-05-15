import SwiftUI

/// First-run profile theme picker. Shown after CompleteProfileView once the
/// user has their name/role on file but before any ConnectProfile exists.
/// Stashes the chosen template into `appState.pendingTemplate` for
/// ProfileSetupView to forward to `connectProfile.create`. Force-tap: the
/// Continue button stays disabled until the user picks something
/// deliberately (no implicit Default fallback).
struct ThemePickerView: View {
    @Environment(AppState.self) private var appState
    @State private var selected: ConnectProfileTemplate?

    private var templates: [ConnectProfileTemplate] {
        ConnectProfileTemplate.selectableForSignup(role: appState.currentUser?.role)
    }

    var body: some View {
        VStack(spacing: 0) {
            header

            ScrollView {
                VStack(spacing: 14) {
                    ForEach(templates) { template in
                        TemplatePreviewCard(
                            template: template,
                            isSelected: selected == template,
                            onSelect: { selected = template }
                        )
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 24)
            }

            footer
        }
        .background(AuthDottedBackground())
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Pick a layout")
                .font(.title2.bold())
            Text("Choose how your profile reads. You can change it any time from the editor.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.top, 24)
        .padding(.bottom, 12)
    }

    private var footer: some View {
        Button {
            guard let pick = selected else { return }
            appState.pendingTemplate = pick
            appState.needsThemePick = false
        } label: {
            Text("Continue")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.primary)
                .frame(maxWidth: .infinity)
                .frame(height: 52)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .glassBubble(cornerRadius: 14)
        .disabled(selected == nil)
        .opacity(selected == nil ? 0.6 : 1)
        .padding(.horizontal, 16)
        .padding(.bottom, 16)
    }
}
