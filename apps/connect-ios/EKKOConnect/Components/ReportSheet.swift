import SwiftUI

/// Reusable report dialog that posts to `report.create`.
/// Supports reporting users, posts, comments, or collectives.
struct ReportSheet: View {
    let targetType: ReportTargetType
    let targetId: String
    var onSubmitted: (() -> Void)? = nil

    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var reason: ReportReason = .SPAM
    @State private var description = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?
    @State private var didSubmit = false

    enum ReportTargetType: String, Codable {
        case POST, USER, COLLECTIVE, COMMENT
    }

    enum ReportReason: String, Codable, CaseIterable, Identifiable {
        case SPAM, HARASSMENT, HATE_SPEECH, VIOLENCE, NSFW, IMPERSONATION, OTHER
        var id: String { rawValue }

        var label: String {
            switch self {
            case .SPAM: return "Spam or scam"
            case .HARASSMENT: return "Harassment or bullying"
            case .HATE_SPEECH: return "Hate speech"
            case .VIOLENCE: return "Violence or threats"
            case .NSFW: return "Nudity or sexual content"
            case .IMPERSONATION: return "Impersonation"
            case .OTHER: return "Something else"
            }
        }

        var icon: String {
            switch self {
            case .SPAM: return "envelope.badge"
            case .HARASSMENT: return "exclamationmark.bubble"
            case .HATE_SPEECH: return "megaphone"
            case .VIOLENCE: return "exclamationmark.triangle"
            case .NSFW: return "eye.slash"
            case .IMPERSONATION: return "person.fill.questionmark"
            case .OTHER: return "ellipsis.circle"
            }
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if didSubmit {
                    successView
                } else {
                    formView
                }
            }
            .navigationTitle(didSubmit ? "Report sent" : "Report")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Form

    private var formView: some View {
        List {
            Section {
                Text("What's happening? Your report is anonymous. Our team reviews reports within 24 hours.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Reason") {
                ForEach(ReportReason.allCases) { option in
                    Button {
                        reason = option
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: option.icon)
                                .font(.subheadline)
                                .foregroundStyle(reason == option ? Color.accentColor : .secondary)
                                .frame(width: 24)
                            Text(option.label)
                                .foregroundStyle(.primary)
                            Spacer()
                            if reason == option {
                                Image(systemName: "checkmark")
                                    .font(.caption.bold())
                                    .foregroundStyle(Color.accentColor)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }

            Section("Details (optional)") {
                TextField(
                    "Anything you'd like our team to know?",
                    text: $description,
                    axis: .vertical
                )
                .lineLimit(3...6)
                .font(.subheadline)
            }

            if let errorMessage {
                Section {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(EKKOTheme.destructive)
                }
            }

            Section {
                Button {
                    Task { await submit() }
                } label: {
                    HStack {
                        Spacer()
                        if isSubmitting {
                            ProgressView().tint(.white)
                        } else {
                            Text("Submit Report")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.white)
                        }
                        Spacer()
                    }
                    .padding(.vertical, 6)
                }
                .listRowBackground(EKKOTheme.destructive)
                .disabled(isSubmitting)
            }
        }
    }

    // MARK: - Success

    private var successView: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 56))
                .foregroundStyle(Color.accentColor)
            Text("Thanks — we'll take it from here")
                .font(.headline)
            Text("Our moderation team reviews reports within 24 hours. If we take action, you'll see fewer profiles like this.")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
            Spacer()
            Button {
                dismiss()
            } label: {
                Text("Done")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.accentColor)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
    }

    // MARK: - Submit

    private func submit() async {
        isSubmitting = true
        errorMessage = nil
        do {
            struct Input: Codable {
                let targetType: String
                let targetId: String
                let reason: String
                let description: String?
            }
            struct ReportResponse: Codable { let id: String }

            let _: ReportResponse = try await appState.trpc.mutate(
                "report.create",
                input: Input(
                    targetType: targetType.rawValue,
                    targetId: targetId,
                    reason: reason.rawValue,
                    description: description.trimmingCharacters(in: .whitespaces).isEmpty ? nil : description
                )
            )
            didSubmit = true
            onSubmitted?()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSubmitting = false
    }
}
