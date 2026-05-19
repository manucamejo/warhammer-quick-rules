import SwiftUI

@main
struct WarhammerQuickRulesApp: App {
    @StateObject private var armyViewModel = ArmyListViewModel()
    @StateObject private var matchViewModel = MatchCenterViewModel()

    var body: some Scene {
        WindowGroup {
            TabView {
                ArmyListView(viewModel: armyViewModel)
                    .tabItem {
                        Label("Armies", systemImage: "shield")
                    }

                MatchCenterView(
                    armyViewModel: armyViewModel,
                    matchViewModel: matchViewModel
                )
                .tabItem {
                    Label("Matches", systemImage: "cross.case")
                }
            }
        }
    }
}
