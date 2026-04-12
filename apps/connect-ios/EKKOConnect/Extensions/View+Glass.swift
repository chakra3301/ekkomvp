import SwiftUI

extension View {
    /// Applies the EKKO primary button style
    func primaryButton(disabled: Bool = false) -> some View {
        self.buttonStyle(PrimaryButtonStyle(isDisabled: disabled))
    }
}
