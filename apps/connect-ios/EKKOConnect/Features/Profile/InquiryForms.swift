import SwiftUI

// MARK: - Booking request form (Hire template "Book a call")
//
// Visitor fills out: project type, budget, timeline, link, and a
// required message. On send, the host submits to connectInquiry.send
// and dismisses with a success toast.

struct BookCallSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    let toUserId: String
    /// Optional display name used in the title and the placeholder
    /// message ("Hey {name}, …").
    let recipientName: String?
    /// Called when the inquiry sent successfully so the host can show
    /// a confirmation overlay.
    var onSent: (() -> Void)? = nil

    @State private var projectType = ""
    @State private var budget = ""
    @State private var timeline = ""
    @State private var link = ""
    @State private var message = ""
    @State private var isSending = false
    @State private var error: String?

    private var canSend: Bool {
        !message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        && message.count <= 800
        && !isSending
    }

    private var headerTitle: String {
        if let name = recipientName, !name.isEmpty {
            return "Book a call with \(name)"
        }
        return "Book a call"
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("e.g. Brand identity, art direction…", text: $projectType)
                        .textInputAutocapitalization(.sentences)
                } header: {
                    Text("Project type")
                } footer: {
                    Text("What you'd be hiring them for. Optional.")
                        .font(.caption)
                }

                Section {
                    TextField("e.g. $5k–$10k", text: $budget)
                        .textInputAutocapitalization(.never)
                    TextField("e.g. 4 weeks, ASAP, ongoing", text: $timeline)
                } header: {
                    Text("Budget & timeline")
                } footer: {
                    Text("Both optional but specific numbers move things faster.")
                        .font(.caption)
                }

                Section {
                    TextEditor(text: $message)
                        .frame(minHeight: 140)
                    HStack {
                        Spacer()
                        Text("\(message.count) / 800")
                            .font(.caption)
                            .foregroundStyle(message.count > 800 ? .red : .secondary)
                    }
                } header: {
                    Text("Your message")
                } footer: {
                    Text("Required. Tell them what you're working on and why you're reaching out.")
                        .font(.caption)
                }

                Section {
                    TextField("https://…", text: $link)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                } header: {
                    Text("Brief or reference link")
                } footer: {
                    Text("Notion, PDF, deck, or moodboard. Optional.")
                        .font(.caption)
                }
            }
            .navigationTitle(headerTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task { await send() }
                    } label: {
                        if isSending {
                            ProgressView().controlSize(.small)
                        } else {
                            Text("Send").bold()
                        }
                    }
                    .disabled(!canSend)
                }
            }
            .alert("Couldn't send", isPresented: .init(
                get: { error != nil },
                set: { if !$0 { error = nil } }
            )) {
                Button("OK") { error = nil }
            } message: {
                if let error { Text(error) }
            }
        }
    }

    private func send() async {
        isSending = true
        defer { isSending = false }

        var fields: [String: JSONValue] = [
            "message": .string(trimmed(message)),
        ]
        if !projectType.isEmpty { fields["projectType"] = .string(trimmed(projectType)) }
        if !budget.isEmpty      { fields["budget"]      = .string(trimmed(budget)) }
        if !timeline.isEmpty    { fields["timeline"]    = .string(trimmed(timeline)) }
        if !link.isEmpty        { fields["link"]        = .string(trimmed(link)) }
        let payload = JSONValue.object(fields)

        do {
            let _: ConnectInquiry = try await appState.trpc.mutate(
                "connectInquiry.send",
                input: SendInquiryInput(
                    toUserId: toUserId,
                    type: .BOOKING_REQUEST,
                    payload: payload
                )
            )
            onSent?()
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func trimmed(_ s: String) -> String {
        s.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

// MARK: - Application form (Client template "Apply now")
//
// Visitor picks which open brief they're applying to (or "general"),
// writes a pitch, and optionally drops a portfolio link.

struct ApplyNowSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    let toUserId: String
    /// Recipient's brand name for the title ("Apply to {name}").
    let recipientBrand: String?
    /// The recipient's open briefs (read from `clientData`). Used to
    /// surface a picker; the first option is always "General application".
    let briefs: [ClientBrief]

    var onSent: (() -> Void)? = nil

    @State private var briefIndex: Int? = nil   // nil = general
    @State private var message = ""
    @State private var link = ""
    @State private var isSending = false
    @State private var error: String?

    private var canSend: Bool {
        !message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        && message.count <= 800
        && !isSending
    }

    private var headerTitle: String {
        if let brand = recipientBrand, !brand.isEmpty {
            return "Apply to \(brand)"
        }
        return "Apply now"
    }

    var body: some View {
        NavigationStack {
            Form {
                if !briefs.isEmpty {
                    Section {
                        Picker("Brief", selection: Binding(
                            get: { briefIndex ?? -1 },
                            set: { briefIndex = $0 < 0 ? nil : $0 }
                        )) {
                            Text("General application").tag(-1)
                            ForEach(Array(briefs.enumerated()), id: \.offset) { idx, b in
                                Text(b.title).tag(idx)
                            }
                        }
                    } header: {
                        Text("Which brief?")
                    } footer: {
                        Text("Pick a specific open role, or send a general application.")
                            .font(.caption)
                    }
                }

                Section {
                    TextEditor(text: $message)
                        .frame(minHeight: 160)
                    HStack {
                        Spacer()
                        Text("\(message.count) / 800")
                            .font(.caption)
                            .foregroundStyle(message.count > 800 ? .red : .secondary)
                    }
                } header: {
                    Text("Your pitch")
                } footer: {
                    Text("Required. Why you, what you'd bring, and one thing you've shipped that's relevant.")
                        .font(.caption)
                }

                Section {
                    TextField("Portfolio, reel, or relevant work", text: $link)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                } header: {
                    Text("Link")
                } footer: {
                    Text("Optional but strongly encouraged.")
                        .font(.caption)
                }
            }
            .navigationTitle(headerTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task { await send() }
                    } label: {
                        if isSending {
                            ProgressView().controlSize(.small)
                        } else {
                            Text("Send").bold()
                        }
                    }
                    .disabled(!canSend)
                }
            }
            .alert("Couldn't send", isPresented: .init(
                get: { error != nil },
                set: { if !$0 { error = nil } }
            )) {
                Button("OK") { error = nil }
            } message: {
                if let error { Text(error) }
            }
        }
    }

    private func send() async {
        isSending = true
        defer { isSending = false }

        var fields: [String: JSONValue] = [
            "message": .string(message.trimmingCharacters(in: .whitespacesAndNewlines)),
        ]
        if !link.isEmpty {
            fields["link"] = .string(link.trimmingCharacters(in: .whitespacesAndNewlines))
        }
        if let idx = briefIndex, briefs.indices.contains(idx) {
            fields["briefIndex"] = .int(idx)
            fields["briefTitle"] = .string(briefs[idx].title)
        }

        do {
            let _: ConnectInquiry = try await appState.trpc.mutate(
                "connectInquiry.send",
                input: SendInquiryInput(
                    toUserId: toUserId,
                    type: .APPLICATION,
                    payload: .object(fields)
                )
            )
            onSent?()
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
