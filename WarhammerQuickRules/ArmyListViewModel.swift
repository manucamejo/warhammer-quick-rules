import Foundation

@MainActor
final class ArmyListViewModel: ObservableObject {
    @Published var armies: [Army] = []
    @Published var searchText = ""
    @Published var showFavoritesOnly = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published private(set) var favoriteIDs: Set<String> = []
    @Published private(set) var ownedIDs: Set<String> = []

    private let repository: ArmyRepositoryProtocol
    private let favoritesKey = "favorite_army_ids"
    private let ownedKey = "owned_army_ids"

    init(repository: ArmyRepositoryProtocol = ArmyRepository()) {
        self.repository = repository
        self.favoriteIDs = loadFavorites()
        self.ownedIDs = loadOwned()
    }

    var filteredArmies: [Army] {
        let query = searchText
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)

        let visibleArmies = armies.filter { army in
            !showFavoritesOnly || isFavorite(army)
        }

        let matchingArmies: [Army]
        if query.isEmpty {
            matchingArmies = visibleArmies
        } else {
            matchingArmies = visibleArmies.filter { $0.searchText.contains(query) }
        }

        return matchingArmies.sorted(by: sortArmies)
    }

    var favoriteArmiesCount: Int {
        armies.filter(isFavorite).count
    }

    func isFavorite(_ army: Army) -> Bool {
        favoriteIDs.contains(army.id)
    }

    func toggleFavorite(for army: Army) {
        if favoriteIDs.contains(army.id) {
            favoriteIDs.remove(army.id)
        } else {
            favoriteIDs.insert(army.id)
        }

        saveFavorites()
    }

    func isOwned(_ army: Army) -> Bool {
        ownedIDs.contains(army.id)
    }

    func toggleOwned(for army: Army) {
        if ownedIDs.contains(army.id) {
            ownedIDs.remove(army.id)
        } else {
            ownedIDs.insert(army.id)
        }

        saveOwned()
    }

    func loadIfNeeded() async {
        guard armies.isEmpty, !isLoading else { return }
        await reload()
    }

    func reload() async {
        isLoading = true
        errorMessage = nil

        do {
            armies = try await repository.fetchArmies()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func sortArmies(lhs: Army, rhs: Army) -> Bool {
        let lhsFavorite = isFavorite(lhs)
        let rhsFavorite = isFavorite(rhs)

        if lhsFavorite != rhsFavorite {
            return lhsFavorite && !rhsFavorite
        }

        let lhsOwned = isOwned(lhs)
        let rhsOwned = isOwned(rhs)

        if lhsOwned != rhsOwned {
            return lhsOwned && !rhsOwned
        }

        if lhs.faction != rhs.faction {
            return lhs.faction.localizedCaseInsensitiveCompare(rhs.faction) == .orderedAscending
        }

        return lhs.spearheadName.localizedCaseInsensitiveCompare(rhs.spearheadName) == .orderedAscending
    }

    private func loadFavorites() -> Set<String> {
        let storedIDs = UserDefaults.standard.stringArray(forKey: favoritesKey) ?? []
        return Set(storedIDs)
    }

    private func saveFavorites() {
        let ids = favoriteIDs.sorted()
        UserDefaults.standard.set(ids, forKey: favoritesKey)
    }

    private func loadOwned() -> Set<String> {
        let storedIDs = UserDefaults.standard.stringArray(forKey: ownedKey) ?? []
        return Set(storedIDs)
    }

    private func saveOwned() {
        let ids = ownedIDs.sorted()
        UserDefaults.standard.set(ids, forKey: ownedKey)
    }
}
