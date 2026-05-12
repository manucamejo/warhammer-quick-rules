import SwiftUI

struct ArmyListView: View {
    @StateObject var viewModel: ArmyListViewModel

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.armies.isEmpty {
                    ProgressView("Cargando ejércitos...")
                } else if let errorMessage = viewModel.errorMessage, viewModel.armies.isEmpty {
                    ContentUnavailableView("No se pudieron cargar los ejércitos", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
                } else {
                    List(viewModel.filteredArmies) { army in
                        NavigationLink {
                            ArmyDetailView(army: army)
                        } label: {
                            ArmyRowView(army: army)
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Warhammer")
            .searchable(text: $viewModel.searchText, prompt: "Buscar facción o spearhead")
            .task {
                await viewModel.loadIfNeeded()
            }
            .refreshable {
                await viewModel.reload()
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    if !viewModel.armies.isEmpty {
                        Text("\(viewModel.filteredArmies.count)")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}

private struct ArmyRowView: View {
    let army: Army

    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: army.imageURL) { phase in
                switch phase {
                case .empty:
                    placeholder
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFill()
                case .failure:
                    placeholder
                @unknown default:
                    placeholder
                }
            }
            .frame(width: 72, height: 72)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

            VStack(alignment: .leading, spacing: 6) {
                Text(army.spearheadName)
                    .font(.headline)
                    .foregroundStyle(.primary)

                Text(army.faction)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                HStack(spacing: 8) {
                    TagLabel(title: army.grandAlliance)

                    if let points = army.pointsValue {
                        TagLabel(title: "\(points) pts")
                    }
                }
            }
        }
        .padding(.vertical, 6)
    }

    private var placeholder: some View {
        ZStack {
            LinearGradient(colors: [.red.opacity(0.6), .orange.opacity(0.5)], startPoint: .topLeading, endPoint: .bottomTrailing)
            Image(systemName: "shield.lefthalf.filled")
                .font(.title2)
                .foregroundStyle(.white.opacity(0.9))
        }
    }
}

private struct ArmyDetailView: View {
    let army: Army

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                AsyncImage(url: army.imageURL) { phase in
                    switch phase {
                    case .empty:
                        detailPlaceholder
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFit()
                    case .failure:
                        detailPlaceholder
                    @unknown default:
                        detailPlaceholder
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 220)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                VStack(alignment: .leading, spacing: 10) {
                    Text(army.spearheadName)
                        .font(.largeTitle.bold())

                    Text(army.faction)
                        .font(.title3)
                        .foregroundStyle(.secondary)

                    HStack(spacing: 8) {
                        TagLabel(title: army.grandAlliance)

                        if let points = army.pointsValue {
                            TagLabel(title: "\(points) pts")
                        }

                        if let modelCount = army.modelCount {
                            TagLabel(title: "\(modelCount) models")
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Rules")
                        .font(.title3.bold())

                    Text(army.details)
                        .font(.body)
                        .textSelection(.enabled)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(16)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Quick Rules")
                        .font(.title3.bold())

                    Text(army.quickRulesFileName ?? "La hoja pública expone el nombre del archivo, pero no una URL pública directa de la imagen.")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(16)
                        .background(Color(.tertiarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Estado")
                        .font(.title3.bold())

                    HStack(spacing: 8) {
                        StatusLabel(title: "Released", isOn: army.released)
                        StatusLabel(title: "In Print", isOn: army.inPrint)
                        StatusLabel(title: "Owned", isOn: army.owned)
                    }
                }
            }
            .padding(20)
        }
        .navigationTitle(army.faction)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var detailPlaceholder: some View {
        ZStack {
            LinearGradient(colors: [.red.opacity(0.7), .black.opacity(0.8)], startPoint: .topLeading, endPoint: .bottomTrailing)
            Image(systemName: "photo")
                .font(.system(size: 36, weight: .medium))
                .foregroundStyle(.white.opacity(0.85))
        }
    }
}

private struct TagLabel: View {
    let title: String

    var body: some View {
        Text(title)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color(.tertiarySystemBackground))
            .clipShape(Capsule())
    }
}

private struct StatusLabel: View {
    let title: String
    let isOn: Bool

    var body: some View {
        Label(title, systemImage: isOn ? "checkmark.circle.fill" : "xmark.circle")
            .font(.subheadline.weight(.medium))
            .foregroundStyle(isOn ? .green : .secondary)
    }
}

#Preview {
    ArmyListView(viewModel: ArmyListViewModel(repository: PreviewArmyRepository()))
}

private struct PreviewArmyRepository: ArmyRepositoryProtocol {
    func fetchArmies() async throws -> [Army] {
        [
            Army(
                faction: "Stormcast Eternals",
                spearheadName: "Vigilant Brotherhood",
                grandAlliance: "Order",
                modelCount: 11,
                pointsValue: 490,
                released: true,
                inPrint: true,
                owned: true,
                details: "GENERAL\n1x Lord-Vigilant on Gryph-stalker\n\nUNITS\n1x Lord-Veritant\n3x Prosecutors\n5x Liberators",
                quickRulesFileName: "Stormcast - Vigilant Brotherhood.png",
                imageURL: nil
            )
        ]
    }
}
