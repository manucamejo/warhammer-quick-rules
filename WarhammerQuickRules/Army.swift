import Foundation

struct Army: Identifiable, Hashable {
    let id: String
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
    let thumbnailImageName: String?
    let quickRulesImageName: String?
    let officialPDFURL: URL?
    let imageURL: URL?

    init(
        faction: String,
        spearheadName: String,
        grandAlliance: String,
        modelCount: Int?,
        pointsValue: Int?,
        released: Bool,
        inPrint: Bool,
        owned: Bool,
        details: String,
        quickRulesFileName: String?,
        thumbnailImageName: String? = nil,
        quickRulesImageName: String? = nil,
        officialPDFURL: URL? = nil,
        imageURL: URL?
    ) {
        self.id = Self.makeID(faction: faction, spearheadName: spearheadName)
        self.faction = faction
        self.spearheadName = spearheadName
        self.grandAlliance = grandAlliance
        self.modelCount = modelCount
        self.pointsValue = pointsValue
        self.released = released
        self.inPrint = inPrint
        self.owned = owned
        self.details = details
        self.quickRulesFileName = quickRulesFileName
        self.thumbnailImageName = thumbnailImageName
        self.quickRulesImageName = quickRulesImageName
        self.officialPDFURL = officialPDFURL
        self.imageURL = imageURL
    }

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

    var bundledThumbnailURL: URL? {
        let fileName = thumbnailImageName ?? "\(Self.slugify(id)).png"
        return Bundle.main.url(forResource: fileName, withExtension: nil, subdirectory: "OfflineData/ArmyThumbnails")
    }

    var bundledQuickRulesURL: URL? {
        Bundle.main.url(forResource: quickRulesImageName, withExtension: nil, subdirectory: "OfflineData/QuickRules")
    }

    private static func makeID(faction: String, spearheadName: String) -> String {
        "\(faction)::\(spearheadName)"
            .folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
    }

    private static func slugify(_ value: String) -> String {
        value
            .lowercased()
            .replacingOccurrences(of: "[^a-z0-9]+", with: "-", options: .regularExpression)
            .trimmingCharacters(in: CharacterSet(charactersIn: "-"))
    }
}
