import SwiftUI

struct RegisterView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var fullName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var password = ""
    @State private var dobMonth = 0
    @State private var dobDay = 0
    @State private var dobYear = 0
    @State private var agreedToTerms = false
    @State private var isLoading = false
    @State private var errors: [String: String] = [:]

    private let months = Calendar.current.monthSymbols
    private let currentYear = Calendar.current.component(.year, from: Date())
    private var years: [Int] { Array((currentYear - 100)...currentYear).reversed() }
    private var daysInMonth: Int {
        guard dobMonth > 0 else { return 31 }
        let year = dobYear > 0 ? dobYear : currentYear
        let components = DateComponents(year: year, month: dobMonth)
        return Calendar.current.range(of: .day, in: .month, for: Calendar.current.date(from: components)!)?.count ?? 31
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 4) {
                    Text("EKKO")
                        .font(.title.bold())
                        .foregroundStyle(EKKOTheme.primary)
                    + Text(" Connect")
                        .font(.title.bold())
                    Text("Create your account")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 20)

                VStack(spacing: 16) {
                    // Name
                    FormField(label: "Name", error: errors["fullName"]) {
                        TextField("Your name", text: $fullName)
                            .textContentType(.name)
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    // Email
                    FormField(label: "Email", error: errors["email"]) {
                        TextField("you@example.com", text: $email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    // Phone
                    FormField(label: "Phone (optional)") {
                        TextField("+1 (555) 000-0000", text: $phone)
                            .textContentType(.telephoneNumber)
                            .keyboardType(.phonePad)
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    // Date of Birth
                    FormField(label: "Date of Birth", error: errors["dob"]) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("This will not be shown publicly.")
                                .font(.caption)
                                .foregroundStyle(.secondary)

                            HStack(spacing: 8) {
                                Picker("Month", selection: $dobMonth) {
                                    Text("Month").tag(0)
                                    ForEach(1...12, id: \.self) { i in
                                        Text(months[i - 1]).tag(i)
                                    }
                                }
                                .pickerStyle(.menu)

                                Picker("Day", selection: $dobDay) {
                                    Text("Day").tag(0)
                                    ForEach(1...daysInMonth, id: \.self) { d in
                                        Text("\(d)").tag(d)
                                    }
                                }
                                .pickerStyle(.menu)

                                Picker("Year", selection: $dobYear) {
                                    Text("Year").tag(0)
                                    ForEach(years, id: \.self) { y in
                                        Text("\(y)").tag(y)
                                    }
                                }
                                .pickerStyle(.menu)
                            }
                        }
                    }

                    // Password
                    FormField(label: "Password", error: errors["password"]) {
                        SecureField("At least 8 characters", text: $password)
                            .textContentType(.newPassword)
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    // Terms + Privacy agreement
                    HStack(alignment: .top, spacing: 12) {
                        Toggle("", isOn: $agreedToTerms)
                            .toggleStyle(.switch)
                            .tint(EKKOTheme.primary)
                            .labelsHidden()

                        VStack(alignment: .leading, spacing: 4) {
                            Text("I agree to the app's policies.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            HStack(spacing: 10) {
                                Button("Terms of Service") {
                                    if let url = LegalURLs.terms { UIApplication.shared.open(url) }
                                }
                                .font(.caption.weight(.medium))
                                .foregroundStyle(EKKOTheme.primary)

                                Button("Privacy Policy") {
                                    if let url = LegalURLs.privacy { UIApplication.shared.open(url) }
                                }
                                .font(.caption.weight(.medium))
                                .foregroundStyle(EKKOTheme.primary)
                            }
                        }
                        Spacer()
                    }

                    // Submit
                    Button {
                        Task { await handleRegister() }
                    } label: {
                        if isLoading {
                            ProgressView().tint(.white)
                        } else {
                            Text("Next")
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle(isDisabled: !agreedToTerms))
                    .disabled(!agreedToTerms || isLoading)
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .scrollContentBackground(.hidden)
        .background {
            Image("SignInBackground")
                .resizable()
                .scaledToFill()
                .ignoresSafeArea()
        }
        .toolbarBackground(.hidden, for: .navigationBar)
        .navigationBarBackButtonHidden(false)
        .navigationTitle("")
    }

    private func handleRegister() async {
        errors = [:]
        guard validate() else { return }

        isLoading = true
        let dateOfBirth = String(format: "%04d-%02d-%02d", dobYear, dobMonth, dobDay)

        do {
            try await appState.supabase.auth.signUp(
                email: email.trimmingCharacters(in: .whitespaces),
                password: password,
                data: [
                    "full_name": .string(fullName.trimmingCharacters(in: .whitespaces)),
                    "phone": .string(phone.trimmingCharacters(in: .whitespaces)),
                    "date_of_birth": .string(dateOfBirth),
                ]
            )
            dismiss()
        } catch {
            errors["email"] = error.localizedDescription
        }
        isLoading = false
    }

    private func validate() -> Bool {
        var errs: [String: String] = [:]
        if fullName.trimmingCharacters(in: .whitespaces).count < 2 {
            errs["fullName"] = "Name is required"
        }
        if email.trimmingCharacters(in: .whitespaces).isEmpty {
            errs["email"] = "Email is required"
        }
        if dobMonth == 0 || dobDay == 0 || dobYear == 0 {
            errs["dob"] = "Date of birth is required"
        } else {
            let components = DateComponents(year: dobYear, month: dobMonth, day: dobDay)
            if let dob = Calendar.current.date(from: components) {
                let age = Calendar.current.dateComponents([.year], from: dob, to: Date()).year ?? 0
                if age < 13 { errs["dob"] = "You must be at least 13 years old" }
            }
        }
        if password.count < 8 {
            errs["password"] = "Password must be at least 8 characters"
        }
        errors = errs
        return errs.isEmpty
    }
}

// MARK: - Form Field Helper

struct FormField<Content: View>: View {
    let label: String
    var error: String? = nil
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.subheadline.weight(.medium))
            content
            if let error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(EKKOTheme.destructive)
            }
        }
    }
}
