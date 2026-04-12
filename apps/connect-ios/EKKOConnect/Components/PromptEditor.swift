import SwiftUI

/// Prompt editor matching the React PromptEditor component.
/// Supports selecting from predefined prompts, writing custom ones, and answering.
struct PromptEditor: View {
    @Binding var prompts: [PromptEntry]

    @State private var selectingIndex: Int? = nil // nil = none, -1 = add new
    @State private var editingQuestionIndex: Int? = nil
    @State private var customDraft = ""

    private var usedQuestions: Set<String> {
        Set(prompts.map(\.question))
    }

    private var availablePrompts: [String] {
        connectPrompts.filter { !usedQuestions.contains($0) }
    }

    private func isCustomQuestion(_ question: String) -> Bool {
        !connectPrompts.contains(question)
    }

    var body: some View {
        VStack(spacing: 16) {
            // Existing prompts
            ForEach(prompts.indices, id: \.self) { i in
                promptCard(at: i)
            }

            // Add prompt button
            if prompts.count < ConnectLimits.maxPrompts {
                if selectingIndex == -1 {
                    promptPicker { question in
                        addPrompt(question: question)
                    }
                } else {
                    Button {
                        selectingIndex = -1
                    } label: {
                        HStack {
                            Image(systemName: "plus")
                            Text("Add Prompt (\(prompts.count)/\(ConnectLimits.maxPrompts))")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.glass)
                }
            }
        }
    }

    // MARK: - Prompt Card

    @ViewBuilder
    private func promptCard(at index: Int) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            // Question header
            HStack {
                if editingQuestionIndex == index {
                    // Custom question editing mode
                    VStack(alignment: .leading, spacing: 8) {
                        TextField("Write your own question...", text: $customDraft)
                            .font(.subheadline)
                            .padding(10)
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .onSubmit { confirmCustomQuestion(at: index) }

                        HStack {
                            Text("\(customDraft.count)/\(ConnectLimits.customPromptQuestionMax)")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            Spacer()
                            Button("Cancel") {
                                cancelCustomQuestion(at: index)
                            }
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            Button("Done") {
                                confirmCustomQuestion(at: index)
                            }
                            .font(.caption.weight(.medium))
                            .foregroundStyle(EKKOTheme.primary)
                        }
                    }
                } else {
                    // Question display + dropdown toggle
                    Button {
                        withAnimation(.spring(response: 0.3)) {
                            selectingIndex = selectingIndex == index ? nil : index
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Text(prompts[index].question.isEmpty ? "Select a prompt..." : prompts[index].question)
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(EKKOTheme.primary)
                                .lineLimit(2)
                                .multilineTextAlignment(.leading)

                            if isCustomQuestion(prompts[index].question) {
                                Image(systemName: "pencil")
                                    .font(.caption2)
                                    .foregroundStyle(EKKOTheme.primary)
                            }

                            Image(systemName: "chevron.down")
                                .font(.caption2)
                                .foregroundStyle(EKKOTheme.primary)
                        }
                    }
                }

                Spacer()

                // Remove button
                Button {
                    removePrompt(at: index)
                } label: {
                    Image(systemName: "xmark")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .padding(6)
                        .background(Color.gray.opacity(0.1))
                        .clipShape(Circle())
                }
            }

            // Prompt picker (when selecting for this card)
            if selectingIndex == index {
                promptPicker { question in
                    changeQuestion(at: index, to: question)
                }
            }

            // Answer editor (when not editing question)
            if editingQuestionIndex != index {
                VStack(alignment: .trailing, spacing: 4) {
                    TextEditor(text: binding(for: index))
                        .frame(minHeight: 80)
                        .padding(8)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.secondary.opacity(0.2), lineWidth: 0.5)
                        )

                    Text("\(prompts[index].answer.count)/\(ConnectLimits.promptAnswerMax)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(16)
        .glassCard()
    }

    // MARK: - Prompt Picker

    @ViewBuilder
    private func promptPicker(onSelect: @escaping (String) -> Void) -> some View {
        ScrollView {
            VStack(spacing: 2) {
                ForEach(availablePrompts, id: \.self) { question in
                    Button {
                        onSelect(question)
                    } label: {
                        Text(question)
                            .font(.subheadline)
                            .foregroundStyle(.primary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(Color.gray.opacity(0.001)) // hit area
                    }
                    .buttonStyle(.plain)
                }

                // Custom prompt option
                Button {
                    startCustomPrompt()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "pencil")
                            .font(.caption)
                        Text("Write your own...")
                            .font(.subheadline.weight(.medium))
                    }
                    .foregroundStyle(EKKOTheme.primary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                }
                .buttonStyle(.plain)
            }
        }
        .frame(maxHeight: 200)
        .background(Color.gray.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Actions

    private func addPrompt(question: String) {
        guard prompts.count < ConnectLimits.maxPrompts else { return }
        prompts.append(PromptEntry(question: question, answer: ""))
        selectingIndex = nil
    }

    private func removePrompt(at index: Int) {
        prompts.remove(at: index)
        if editingQuestionIndex == index {
            editingQuestionIndex = nil
            customDraft = ""
        }
    }

    private func changeQuestion(at index: Int, to question: String) {
        prompts[index].question = question
        selectingIndex = nil
    }

    private func startCustomPrompt() {
        customDraft = ""
        if selectingIndex == -1 {
            // Adding new custom prompt
            guard prompts.count < ConnectLimits.maxPrompts else { return }
            prompts.append(PromptEntry(question: "", answer: ""))
            editingQuestionIndex = prompts.count - 1
        } else if let idx = selectingIndex, idx >= 0 {
            // Changing existing to custom
            editingQuestionIndex = idx
        }
        selectingIndex = nil
    }

    private func confirmCustomQuestion(at index: Int) {
        let trimmed = customDraft.trimmingCharacters(in: .whitespaces)
        if trimmed.isEmpty {
            if prompts[index].question.isEmpty {
                prompts.remove(at: index)
            }
        } else {
            prompts[index].question = trimmed
        }
        editingQuestionIndex = nil
        customDraft = ""
    }

    private func cancelCustomQuestion(at index: Int) {
        if prompts[index].question.isEmpty {
            prompts.remove(at: index)
        }
        editingQuestionIndex = nil
        customDraft = ""
    }

    private func binding(for index: Int) -> Binding<String> {
        Binding(
            get: { prompts[index].answer },
            set: { newValue in
                let limited = String(newValue.prefix(ConnectLimits.promptAnswerMax))
                prompts[index].answer = limited
            }
        )
    }
}
