import Foundation

struct PlayerProfile: Identifiable, Codable, Hashable {
    let id: UUID
    var name: String
    var isPrimaryUser: Bool

    init(id: UUID = UUID(), name: String, isPrimaryUser: Bool = false) {
        self.id = id
        self.name = name
        self.isPrimaryUser = isPrimaryUser
    }
}

struct MatchRoundScore: Identifiable, Codable, Hashable {
    let id: UUID
    var roundNumber: Int
    var playerOnePoints: Int
    var playerTwoPoints: Int

    init(
        id: UUID = UUID(),
        roundNumber: Int,
        playerOnePoints: Int = 0,
        playerTwoPoints: Int = 0
    ) {
        self.id = id
        self.roundNumber = roundNumber
        self.playerOnePoints = playerOnePoints
        self.playerTwoPoints = playerTwoPoints
    }
}

struct MatchRecord: Identifiable, Codable, Hashable {
    let id: UUID
    var playerOneID: UUID
    var playerTwoID: UUID
    var playerOneArmyID: String
    var playerTwoArmyID: String
    var rounds: [MatchRoundScore]
    var createdAt: Date
    var updatedAt: Date

    init(
        id: UUID = UUID(),
        playerOneID: UUID,
        playerTwoID: UUID,
        playerOneArmyID: String,
        playerTwoArmyID: String,
        rounds: [MatchRoundScore] = MatchRecord.defaultRounds(),
        createdAt: Date = .now,
        updatedAt: Date = .now
    ) {
        self.id = id
        self.playerOneID = playerOneID
        self.playerTwoID = playerTwoID
        self.playerOneArmyID = playerOneArmyID
        self.playerTwoArmyID = playerTwoArmyID
        self.rounds = rounds
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    var playerOneTotal: Int {
        rounds.reduce(0) { $0 + $1.playerOnePoints }
    }

    var playerTwoTotal: Int {
        rounds.reduce(0) { $0 + $1.playerTwoPoints }
    }

    static func defaultRounds() -> [MatchRoundScore] {
        (1...4).map { MatchRoundScore(roundNumber: $0) }
    }
}
