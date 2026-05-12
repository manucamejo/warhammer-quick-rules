import SwiftUI

@main
struct WarhammerQuickRulesApp: App {
    var body: some Scene {
        WindowGroup {
            ArmyListView(viewModel: ArmyListViewModel())
        }
    }
}
