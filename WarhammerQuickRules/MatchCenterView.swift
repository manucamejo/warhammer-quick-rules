import SwiftUI
import UIKit

private let appBurgundy = Color(red: 0.27, green: 0.06, blue: 0.09)
private let appNavyCard = Color(red: 0.10, green: 0.17, blue: 0.29)

struct MatchCenterView: View {
    @ObservedObject var armyViewModel: ArmyListViewModel
    @ObservedObject var matchViewModel: MatchCenterViewModel
    @State private var showingNewMatchSheet = false
    @State private var showingNewPlayerSheet = false

    var body: some View {
        NavigationStack {
            List {
                Section("Players") {
                    ForEach(matchViewModel.sortedPlayers) { player in
                        HStack {
                            Text(player.name)
                            Spacer()
                            if player.isPrimaryUser {
                                Text("You")
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .background(Color.white.opacity(0.14))
                                    .clipShape(Capsule())
                            }
                        }
                        .foregroundStyle(.white)
                    }

                    Button {
                        showingNewPlayerSheet = true
                    } label: {
                        Label("Add Player", systemImage: "person.badge.plus")
                            .foregroundStyle(.white)
                    }
                }
                .listRowBackground(appNavyCard)

                Section("Battles") {
                    Button {
                        showingNewMatchSheet = true
                    } label: {
                        Label("New Battle", systemImage: "cross.case")
                            .foregroundStyle(.white)
                    }

                    if matchViewModel.sortedMatches.isEmpty {
                        Text("No hay peleas guardadas todavía.")
                            .foregroundStyle(.white.opacity(0.78))
                    } else {
                        ForEach(matchViewModel.sortedMatches) { match in
                            NavigationLink {
                                MatchDetailView(
                                    matchID: match.id,
                                    armyViewModel: armyViewModel,
                                    matchViewModel: matchViewModel
                                )
                            } label: {
                                MatchHistoryRow(
                                    match: match,
                                    playerOneName: matchViewModel.player(for: match.playerOneID)?.name ?? "Player 1",
                                    playerTwoName: matchViewModel.player(for: match.playerTwoID)?.name ?? "Player 2",
                                    playerOneArmyName: armyViewModel.armies.first(where: { $0.id == match.playerOneArmyID })?.spearheadName ?? "Army 1",
                                    playerTwoArmyName: armyViewModel.armies.first(where: { $0.id == match.playerTwoArmyID })?.spearheadName ?? "Army 2"
                                )
                            }
                            .swipeActions {
                                Button(role: .destructive) {
                                    matchViewModel.deleteMatch(id: match.id)
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                        }
                    }
                }
                .listRowBackground(appNavyCard)
            }
            .navigationTitle("Matches")
            .scrollContentBackground(.hidden)
            .background(appBurgundy)
            .listStyle(.insetGrouped)
            .task {
                await armyViewModel.loadIfNeeded()
            }
            .sheet(isPresented: $showingNewPlayerSheet) {
                NewPlayerSheet(matchViewModel: matchViewModel)
            }
            .sheet(isPresented: $showingNewMatchSheet) {
                NewMatchSheet(
                    armyViewModel: armyViewModel,
                    matchViewModel: matchViewModel
                )
            }
        }
        .background(appBurgundy.ignoresSafeArea())
    }
}

private struct MatchHistoryRow: View {
    let match: MatchRecord
    let playerOneName: String
    let playerTwoName: String
    let playerOneArmyName: String
    let playerTwoArmyName: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("\(playerOneName) vs \(playerTwoName)")
                    .font(.headline)
                    .foregroundStyle(.white)
                Spacer()
                Text("\(match.playerOneTotal) - \(match.playerTwoTotal)")
                    .font(.headline.monospacedDigit())
                    .foregroundStyle(.white)
            }

            Text("\(playerOneArmyName) vs \(playerTwoArmyName)")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.78))

            Text(match.updatedAt.formatted(date: .abbreviated, time: .shortened))
                .font(.caption)
                .foregroundStyle(.white.opacity(0.65))
        }
        .padding(.vertical, 4)
    }
}

private struct NewPlayerSheet: View {
    @ObservedObject var matchViewModel: MatchCenterViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""

    var body: some View {
        NavigationStack {
            Form {
                TextField("Player name", text: $name)
                    .foregroundStyle(.white)
            }
            .navigationTitle("New Player")
            .scrollContentBackground(.hidden)
            .background(appBurgundy)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        matchViewModel.addPlayer(named: name)
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
        .presentationBackground(appBurgundy)
    }
}

private struct NewMatchSheet: View {
    @ObservedObject var armyViewModel: ArmyListViewModel
    @ObservedObject var matchViewModel: MatchCenterViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var playerOneID: UUID?
    @State private var playerTwoID: UUID?
    @State private var playerOneArmyID: String?
    @State private var playerTwoArmyID: String?
    @State private var selectingArmySlot: ArmySlot?

    private var availablePlayers: [PlayerProfile] {
        matchViewModel.sortedPlayers
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Battle Setup") {
                    Picker("Player 1", selection: $playerOneID) {
                        ForEach(availablePlayers) { player in
                            Text(player.name).tag(Optional(player.id))
                        }
                    }

                    Button {
                        selectingArmySlot = .playerOne
                    } label: {
                        ArmySelectionRow(
                            title: "Army 1",
                            army: selectedArmy(for: playerOneArmyID)
                        )
                    }
                    .buttonStyle(.plain)

                    Picker("Player 2", selection: $playerTwoID) {
                        ForEach(availablePlayers.filter { $0.id != playerOneID }) { player in
                            Text(player.name).tag(Optional(player.id))
                        }
                    }

                    Button {
                        selectingArmySlot = .playerTwo
                    } label: {
                        ArmySelectionRow(
                            title: "Army 2",
                            army: selectedArmy(for: playerTwoArmyID)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .navigationTitle("New Battle")
            .scrollContentBackground(.hidden)
            .background(appBurgundy)
            .onAppear {
                if playerOneID == nil { playerOneID = defaultPlayerOneID }
                if playerTwoID == nil { playerTwoID = defaultPlayerTwoID }
                if playerOneArmyID == nil { playerOneArmyID = prioritizedArmies.first?.id }
                if playerTwoArmyID == nil { playerTwoArmyID = prioritizedArmies.dropFirst().first?.id ?? prioritizedArmies.first?.id }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        guard
                            let playerOneID,
                            let playerTwoID,
                            let playerOneArmyID,
                            let playerTwoArmyID
                        else { return }

                        _ = matchViewModel.createMatch(
                            playerOneID: playerOneID,
                            playerTwoID: playerTwoID,
                            playerOneArmyID: playerOneArmyID,
                            playerTwoArmyID: playerTwoArmyID
                        )
                        dismiss()
                    }
                    .disabled(!canCreateMatch)
                }
            }
            .sheet(item: $selectingArmySlot) { slot in
                ArmyPickerSheet(
                    armies: prioritizedArmies,
                    armyViewModel: armyViewModel,
                    selectedArmyID: slot == .playerOne ? playerOneArmyID : playerTwoArmyID
                ) { selectedID in
                    if slot == .playerOne {
                        playerOneArmyID = selectedID
                    } else {
                        playerTwoArmyID = selectedID
                    }
                }
            }
        }
        .presentationBackground(appBurgundy)
    }

    private var defaultPlayerOneID: UUID? {
        matchViewModel.primaryUser?.id ?? availablePlayers.first?.id
    }

    private var defaultPlayerTwoID: UUID? {
        availablePlayers.first(where: { $0.id != defaultPlayerOneID })?.id
    }

    private var prioritizedArmies: [Army] {
        armyViewModel.armies.sorted { lhs, rhs in
            let lhsFavorite = armyViewModel.isFavorite(lhs)
            let rhsFavorite = armyViewModel.isFavorite(rhs)
            if lhsFavorite != rhsFavorite {
                return lhsFavorite && !rhsFavorite
            }

            let lhsOwned = armyViewModel.isOwned(lhs)
            let rhsOwned = armyViewModel.isOwned(rhs)
            if lhsOwned != rhsOwned {
                return lhsOwned && !rhsOwned
            }

            if lhs.faction != rhs.faction {
                return lhs.faction.localizedCaseInsensitiveCompare(rhs.faction) == .orderedAscending
            }

            return lhs.spearheadName.localizedCaseInsensitiveCompare(rhs.spearheadName) == .orderedAscending
        }
    }

    private var canCreateMatch: Bool {
        guard let playerOneID, let playerTwoID, let playerOneArmyID, let playerTwoArmyID else {
            return false
        }
        return playerOneID != playerTwoID && !playerOneArmyID.isEmpty && !playerTwoArmyID.isEmpty
    }

    private func selectedArmy(for id: String?) -> Army? {
        guard let id else { return nil }
        return armyViewModel.armies.first(where: { $0.id == id })
    }
}

private enum ArmySlot: Identifiable {
    case playerOne
    case playerTwo

    var id: String {
        switch self {
        case .playerOne: return "playerOne"
        case .playerTwo: return "playerTwo"
        }
    }
}

private struct ArmySelectionRow: View {
    let title: String
    let army: Army?

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.72))

                if let army {
                    Text(army.spearheadName)
                        .foregroundStyle(.white)
                    Text(army.faction)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.72))
                } else {
                    Text("Select army")
                        .foregroundStyle(.white)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.white.opacity(0.5))
        }
    }
}

private struct ArmyPickerSheet: View {
    let armies: [Army]
    @ObservedObject var armyViewModel: ArmyListViewModel
    let selectedArmyID: String?
    let onSelect: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            List(filteredArmies) { army in
                Button {
                    onSelect(army.id)
                    dismiss()
                } label: {
                    HStack(spacing: 10) {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 6) {
                                Text(army.spearheadName)
                                    .foregroundStyle(.white)

                                if armyViewModel.isFavorite(army) {
                                    Image(systemName: "pin.fill")
                                        .font(.caption)
                                        .foregroundStyle(.orange)
                                }

                                if armyViewModel.isOwned(army) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.caption)
                                        .foregroundStyle(.green)
                                }
                            }

                            Text(army.faction)
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.72))
                        }

                        Spacer()

                        if selectedArmyID == army.id {
                            Image(systemName: "checkmark")
                                .foregroundStyle(.white)
                        }
                    }
                }
                .buttonStyle(.plain)
                .listRowBackground(appNavyCard)
            }
            .navigationTitle("Choose Army")
            .searchable(text: $searchText, prompt: "Buscar ejército")
            .scrollContentBackground(.hidden)
            .background(appBurgundy)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
        }
        .presentationBackground(appBurgundy)
    }

    private var filteredArmies: [Army] {
        let query = searchText
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)

        if query.isEmpty {
            return armies
        }

        return armies.filter { $0.searchText.contains(query) }
    }
}

private struct MatchDetailView: View {
    let matchID: UUID
    @ObservedObject var armyViewModel: ArmyListViewModel
    @ObservedObject var matchViewModel: MatchCenterViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var zoomedImage: UIImage?

    var body: some View {
        Group {
            if let match = matchViewModel.match(for: matchID),
               let playerOne = matchViewModel.player(for: match.playerOneID),
               let playerTwo = matchViewModel.player(for: match.playerTwoID),
               let armyOne = armyViewModel.armies.first(where: { $0.id == match.playerOneArmyID }),
               let armyTwo = armyViewModel.armies.first(where: { $0.id == match.playerTwoArmyID }) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        MatchScoreHeader(
                            playerOneName: playerOne.name,
                            playerTwoName: playerTwo.name,
                            playerOneArmy: armyOne,
                            playerTwoArmy: armyTwo,
                            playerOneTotal: match.playerOneTotal,
                            playerTwoTotal: match.playerTwoTotal
                        )

                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("Rounds")
                                    .font(.title3.bold())
                                Spacer()
                                Button {
                                    matchViewModel.addRound(to: match.id)
                                } label: {
                                    Label("Add Round", systemImage: "plus.circle")
                                }
                                .buttonStyle(.plain)
                            }

                            ForEach(match.rounds) { round in
                                RoundScoreEditor(
                                    round: round,
                                    playerOneName: playerOne.name,
                                    playerTwoName: playerTwo.name
                                ) { playerOnePoints, playerTwoPoints in
                                    matchViewModel.updateRoundScore(
                                        matchID: match.id,
                                        roundID: round.id,
                                        playerOnePoints: playerOnePoints,
                                        playerTwoPoints: playerTwoPoints
                                    )
                                }
                            }
                        }

                        VStack(alignment: .leading, spacing: 12) {
                            Text("Quick Rules")
                                .font(.title3.bold())

                            VStack(alignment: .leading, spacing: 16) {
                                MatchQuickRulesCard(
                                    playerName: playerOne.name,
                                    army: armyOne
                                ) { image in
                                    zoomedImage = image
                                }

                                MatchQuickRulesCard(
                                    playerName: playerTwo.name,
                                    army: armyTwo
                                ) { image in
                                    zoomedImage = image
                                }
                            }
                        }
                    }
                    .padding(20)
                }
                .background(appBurgundy)
                .navigationTitle("Battle")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button(role: .destructive) {
                            matchViewModel.deleteMatch(id: match.id)
                            dismiss()
                        } label: {
                            Image(systemName: "trash")
                        }
                    }
                }
                .fullScreenCover(item: $zoomedImage, content: MatchZoomView.init)
            } else {
                ContentUnavailableView("Battle not found", systemImage: "exclamationmark.triangle")
            }
        }
        .background(appBurgundy.ignoresSafeArea())
    }
}

private struct MatchScoreHeader: View {
    let playerOneName: String
    let playerTwoName: String
    let playerOneArmy: Army
    let playerTwoArmy: Army
    let playerOneTotal: Int
    let playerTwoTotal: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(playerOneName)
                        .font(.headline)
                    Text(playerOneArmy.spearheadName)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text("\(playerOneTotal)")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .monospacedDigit()
            }

            Divider()

            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(playerTwoName)
                        .font(.headline)
                    Text(playerTwoArmy.spearheadName)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text("\(playerTwoTotal)")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .monospacedDigit()
            }
        }
        .padding(16)
        .background(appNavyCard)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct RoundScoreEditor: View {
    let round: MatchRoundScore
    let playerOneName: String
    let playerTwoName: String
    let onChange: (Int, Int) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Round \(round.roundNumber)")
                .font(.headline)
                .foregroundStyle(.white)

            HStack(spacing: 12) {
                ScoreStepper(
                    title: playerOneName,
                    points: round.playerOnePoints
                ) { newValue in
                    onChange(newValue, round.playerTwoPoints)
                }

                ScoreStepper(
                    title: playerTwoName,
                    points: round.playerTwoPoints
                ) { newValue in
                    onChange(round.playerOnePoints, newValue)
                }
            }
        }
        .padding(16)
        .background(appNavyCard)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct ScoreStepper: View {
    let title: String
    let points: Int
    let onChange: (Int) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
                .lineLimit(1)

            HStack {
                Button {
                    onChange(max(0, points - 1))
                } label: {
                    Image(systemName: "minus.circle.fill")
                }
                .buttonStyle(.plain)

                Spacer()

                Text("\(points)")
                    .font(.title2.monospacedDigit())
                    .foregroundStyle(.white)

                Spacer()

                Button {
                    onChange(points + 1)
                } label: {
                    Image(systemName: "plus.circle.fill")
                }
                .buttonStyle(.plain)
            }
            .font(.title3)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color.white.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct MatchQuickRulesCard: View {
    let playerName: String
    let army: Army
    let onTapImage: (UIImage) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(playerName)
                .font(.headline)
                .foregroundStyle(.white)

            Text(army.spearheadName)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.78))

            if let image = loadBundledQuickRulesImage(from: army.bundledQuickRulesURL) {
                Button {
                    onTapImage(image)
                } label: {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(maxWidth: .infinity)
                        .background(Color.white.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(.plain)
            } else {
                Text("No local Quick Rules image yet.")
                    .font(.callout)
                    .foregroundStyle(.white.opacity(0.78))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .background(Color.white.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(appNavyCard)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct MatchZoomView: View {
    let image: UIImage
    @Environment(\.dismiss) private var dismiss
    @State private var scale: CGFloat = 1
    @State private var lastScale: CGFloat = 1
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero

    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .scaleEffect(scale)
                    .offset(offset)
                    .frame(width: geometry.size.width, height: geometry.size.height)
                    .background(Color.black)
                    .gesture(
                        SimultaneousGesture(
                            MagnificationGesture()
                                .onChanged { value in
                                    scale = min(max(lastScale * value, 1), 6)
                                }
                                .onEnded { _ in
                                    lastScale = scale
                                    if scale == 1 {
                                        offset = .zero
                                        lastOffset = .zero
                                    }
                                },
                            DragGesture()
                                .onChanged { value in
                                    guard scale > 1 else { return }
                                    offset = CGSize(
                                        width: lastOffset.width + value.translation.width,
                                        height: lastOffset.height + value.translation.height
                                    )
                                }
                                .onEnded { _ in
                                    lastOffset = offset
                                }
                        )
                    )
                    .onTapGesture(count: 2) {
                        if scale > 1 {
                            scale = 1
                            lastScale = 1
                            offset = .zero
                            lastOffset = .zero
                        } else {
                            scale = 2
                            lastScale = 2
                        }
                    }
            }
            .ignoresSafeArea()
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
            .toolbarBackground(.black, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .background(Color.black)
        }
    }
}

private func loadBundledQuickRulesImage(from url: URL?) -> UIImage? {
    guard let url, let data = try? Data(contentsOf: url) else {
        return nil
    }
    return UIImage(data: data)
}
