import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // DIAGNÓSTICO TEMPORAL — bundle web / pantalla blanca
        if let configUrl = Bundle.main.url(forResource: "capacitor.config", withExtension: "json"),
           let configData = try? Data(contentsOf: configUrl),
           let config = try? JSONSerialization.jsonObject(with: configData) as? [String: Any] {
            let webDir = config["webDir"] as? String ?? "—"
            let serverUrl = (config["server"] as? [String: Any])?["url"] as? String
            print("[WaitMe DIAG] webDir: \(webDir)")
            print("[WaitMe DIAG] server.url: \(serverUrl ?? "nil (OK)")")
            if serverUrl != nil {
                print("[WaitMe DIAG] ⚠️ server.url presente → app intenta cargar de servidor externo. Si no responde → pantalla blanca.")
            }
        }
        if let indexUrl = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "public") {
            print("[WaitMe DIAG] index.html existe en bundle: \(indexUrl.path)")
        } else {
            print("[WaitMe DIAG] ❌ index.html NO encontrado en bundle")
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
