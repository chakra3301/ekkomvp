import UIKit
import Capacitor

class MyBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleSignInPlugin())
    }
}
