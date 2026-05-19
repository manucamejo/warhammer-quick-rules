import Foundation

@MainActor
final class MatchCenterViewModel: ObservableObject {
    @Published private(set) var players: [PlayerProfile] = []
    @Published private(set) var matches: [MatchRecord] = []

    private let playersKey = "match_player_profiles"
    private let matchesKey = "match_records"
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init() {
        decoder.dateDecodingStrategy = .iso8601
        encoder.dateEncodingStrategy = .iso8601
        players = loadPlayers()
        matches = loadMatches()
        ensureDefaultPrimaryUser()
    }

    var sortedPlayers: [PlayerProfile] {
        players.sorted { lhs, rhs in
            if lhs.isPrimaryUser != rhs.isPrimaryUser {
                return lhs.isPrimaryUser && !rhs.isPrimaryUser
            }
            return lhs.name.localizedCaseInsensitiveCompare(rhs.name) == .orderedAscending
        }
    }

    var sortedMatches: [MatchRecord] {
        matches.sorted { $0.updatedAt > $1.updatedAt }
    }

    var primaryUser: PlayerProfile? {
        players.first(where: \.isPrimaryUser)
    }

    func addPlayer(named rawName: String, makePrimaryUser: Bool = false) {
        let name = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return }

        if let index = players.firstIndex(where: { $0.name.localizedCaseInsensitiveCompare(name) == .orderedSame }) {
            if makePrimaryUser {
                setPrimaryUser(id: players[index].id)
            }
            return
        }

        if makePrimaryUser {
            for index in players.indices {
                players[index].isPrimaryUser = false
            }
        }

        players.append(PlayerProfile(name: name, isPrimaryUser: makePrimaryUser))
        savePlayers()
    }

    func setPrimaryUser(id: UUID) {
        for index in players.indices {
            players[index].isPrimaryUser = players[index].id == id
        }
        savePlayers()
    }

    func createMatch(
        playerOneID: UUID,
        playerTwoID: UUID,
        playerOneArmyID: String,
        playerTwoArmyID: String
    ) -> MatchRecord {
        let match = MatchRecord(
            playerOneID: playerOneID,
            playerTwoID: playerTwoID,
            playerOneArmyID: playerOneArmyID,
            playerTwoArmyID: playerTwoArmyID
        )
        matches.insert(match, at: 0)
        saveMatches()
        return match
    }

    func addRound(to matchID: UUID) {
        updateMatch(matchID) { match in
            let nextRound = (match.rounds.map(\.roundNumber).max() ?? 0) + 1
            match.rounds.append(MatchRoundScore(roundNumber: nextRound))
        }
    }

    func updateRoundScore(
        matchID: UUID,
        roundID: UUID,
        playerOnePoints: Int,
        playerTwoPoints: Int
    ) {
        updateMatch(matchID) { match in
            guard let roundIndex = match.rounds.firstIndex(where: { $0.id == roundID }) else { return }
            match.rounds[roundIndex].playerOnePoints = playerOnePoints
            match.rounds[roundIndex].playerTwoPoints = playerTwoPoints
        }
    }

    func deleteMatch(id: UUID) {
        matches.removeAll { $0.id == id }
        saveMatches()
    }

    func player(for id: UUID) -> PlayerProfile? {
        players.first(where: { $0.id == id })
    }

    func match(for id: UUID) -> MatchRecord? {
        matches.first(where: { $0.id == id })
    }

    private func updateMatch(_ id: UUID, mutation: (inout MatchRecord) -> Void) {
        guard let index = matches.firstIndex(where: { $0.id == id }) else { return }
        mutation(&matches[index])
        matches[index].updatedAt = .now
        saveMatches()
    }

    private func ensureDefaultPrimaryUser() {
        if players.isEmpty {
            players = [PlayerProfile(name: "Manu", isPrimaryUser: true)]
            savePlayers()
            return
        }

        if players.contains(where: \.isPrimaryUser) {
            return
        }

        if let manuIndex = players.firstIndex(where: { $0.name.localizedCaseInsensitiveCompare("Manu") == .orderedSame }) {
            players[manuIndex].isPrimaryUser = true
        } else {
            players.insert(PlayerProfile(name: "Manu", isPrimaryUser: true), at: 0)
        }
        savePlayers()
    }

    private func loadPlayers() -> [PlayerProfile] {
        guard let data = UserDefaults.standard.data(forKey: playersKey),
              let decoded = try? decoder.decode([PlayerProfile].self, from: data) else {
            return []
        }
        return decoded
    }

    private func savePlayers() {
        if let data = try? encoder.encode(players) {
            UserDefaults.standard.set(data, forKey: playersKey)
        }
    }

    private func loadMatches() -> [MatchRecord] {
        guard let data = UserDefaults.standard.data(forKey: matchesKey),
              let decoded = try? decoder.decode([MatchRecord].self, from: data) else {
            return []
        }
        return decoded
    }

    private func saveMatches() {
        if let data = try? encoder.encode(matches) {
            UserDefaults.standard.set(data, forKey: matchesKey)
        }
    }
}
