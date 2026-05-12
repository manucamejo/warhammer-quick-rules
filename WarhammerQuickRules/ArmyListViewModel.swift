import Foundation

@MainActor
final class ArmyListViewModel: ObservableObject {
    @Published var armies: [Army] = []
    @Published var searchText = ""
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let repository: ArmyRepositoryProtocol

    init(repository: ArmyRepositoryProtocol = ArmyRepository()) {
        self.repository = repository
    }

    var filteredArmies: [Army] {
        let query = searchText
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)

        guard !query.isEmpty else {
            return armies
        }

        return armies.filter { $0.searchText.contains(query) }
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
}
