import Foundation

struct Army: Identifiable, Hashable {
    let id = UUID()
    let faction: String
    let spearheadName: String
    let grandAlliance: String
    let modelCount: Int?
    let pointsValue: Int?
    let released: Bool
    let inPrint: Bool
    let owned: Bool
    let details: String
    let quickRulesFileName: String?
    let imageURL: URL?

    var title: String {
        spearheadName
    }

    var subtitle: String {
        faction
    }

    var searchText: String {
        [
            faction,
            spearheadName,
            grandAlliance,
            details,
            quickRulesFileName ?? ""
        ]
        .joined(separator: " ")
        .folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
    }
}
