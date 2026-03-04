import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        let bridgeViewController = CAPBridgeViewController()

        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = bridgeViewController
        window.makeKeyAndVisible()

        self.window = window

        return true
    }
}
