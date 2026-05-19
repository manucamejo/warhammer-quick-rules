import SwiftUI
import UIKit

struct ArmyListView: View {
    @StateObject var viewModel: ArmyListViewModel
    private let listBackground = Color(red: 0.27, green: 0.06, blue: 0.09)

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
                            ArmyDetailView(army: army, viewModel: viewModel)
                        } label: {
                            ArmyRowView(
                                army: army,
                                isFavorite: viewModel.isFavorite(army),
                                isOwned: viewModel.isOwned(army)
                            )
                        }
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                        .swipeActions(edge: .leading, allowsFullSwipe: true) {
                            Button {
                                viewModel.toggleFavorite(for: army)
                            } label: {
                                Label(
                                    viewModel.isFavorite(army) ? "Unpin" : "Pin",
                                    systemImage: viewModel.isFavorite(army) ? "pin.slash.fill" : "pin.fill"
                                )
                            }
                            .tint(.orange)
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button {
                                viewModel.toggleOwned(for: army)
                            } label: {
                                Label(
                                    viewModel.isOwned(army) ? "Unmark Owned" : "Mark Owned",
                                    systemImage: viewModel.isOwned(army) ? "checkmark.circle.fill" : "checkmark.circle"
                                )
                            }
                            .tint(.green)
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                    .background(listBackground)
                }
            }
            .background(listBackground.ignoresSafeArea())
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
                    Button {
                        viewModel.showFavoritesOnly.toggle()
                    } label: {
                        Image(systemName: viewModel.showFavoritesOnly ? "pin.fill" : "pin")
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Text("\(viewModel.filteredArmies.count)")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}

private struct ArmyRowView: View {
    let army: Army
    let isFavorite: Bool
    let isOwned: Bool
    private let cardBackground = Color(red: 0.10, green: 0.17, blue: 0.29)

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            ArmyThumbnailView(army: army) {
                placeholder
            }
            .frame(maxWidth: .infinity)
            .frame(height: 156)

            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    Text(army.spearheadName)
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(.white)
                        .lineLimit(2)

                    Spacer(minLength: 8)

                    if isFavorite {
                        Image(systemName: "pin.fill")
                            .font(.caption)
                            .foregroundStyle(.orange)
                    }

                    if isOwned {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.caption)
                            .foregroundStyle(.green)
                    }
                }

                Text(army.faction)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.78))
                    .lineLimit(1)

                HStack(spacing: 8) {
                    TagLabel(title: army.grandAlliance)

                    if let points = army.pointsValue {
                        TagLabel(title: "\(points) pts")
                    }

                    if isOwned {
                        TagLabel(title: "Owned")
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
        .frame(maxWidth: .infinity)
        .background(cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .shadow(color: .black.opacity(0.18), radius: 16, x: 0, y: 8)
        .overlay {
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.white.opacity(0.12), lineWidth: 1)
        }
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
    @ObservedObject var viewModel: ArmyListViewModel
    @State private var quickRulesPreviewImage: UIImage?
    private let detailBackground = Color(red: 0.27, green: 0.06, blue: 0.09)
    private let sectionBackground = Color(red: 0.10, green: 0.17, blue: 0.29)

    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    ArmyHeroImageView(army: army) {
                        detailPlaceholder
                    }
                    .frame(width: geometry.size.width - 32)
                    .frame(height: 220)
                    .overlay(alignment: .bottomLeading) {
                        LinearGradient(
                            colors: [.clear, .black.opacity(0.45)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .allowsHitTesting(false)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 0, style: .continuous))

                    DetailSection(background: sectionBackground) {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack(alignment: .top) {
                                Text(army.spearheadName)
                                    .font(.largeTitle.bold())

                                Spacer(minLength: 12)

                                Button {
                                    viewModel.toggleFavorite(for: army)
                                } label: {
                                    Image(systemName: viewModel.isFavorite(army) ? "pin.fill" : "pin")
                                        .font(.title3.weight(.semibold))
                                        .foregroundStyle(viewModel.isFavorite(army) ? .orange : .white.opacity(0.8))
                                        .padding(10)
                                        .background(Color.white.opacity(0.12))
                                        .clipShape(Circle())
                                }
                                .buttonStyle(.plain)
                            }
                            .foregroundStyle(.white)

                            Button {
                                viewModel.toggleOwned(for: army)
                            } label: {
                                Label(viewModel.isOwned(army) ? "Owned" : "Mark Owned", systemImage: viewModel.isOwned(army) ? "checkmark.circle.fill" : "checkmark.circle")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(viewModel.isOwned(army) ? .green : .white.opacity(0.8))
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(Color.white.opacity(0.12))
                                    .clipShape(Capsule())
                            }
                            .buttonStyle(.plain)

                            Text(army.faction)
                                .font(.title3)
                                .foregroundStyle(.white.opacity(0.78))

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
                    }

                    DetailSection(title: "Rules", background: sectionBackground) {
                        ArmyRulesTextView(details: army.details)
                    }

                    if let officialPDFURL = army.officialPDFURL {
                        DetailSection(title: "Official PDF", background: sectionBackground) {
                            HStack(spacing: 12) {
                                Link(destination: officialPDFURL) {
                                    Label("Open PDF", systemImage: "arrow.down.doc")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(.white)
                                        .frame(maxWidth: .infinity)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 12)
                                        .background(Color.white.opacity(0.08))
                                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                }
                                .buttonStyle(.plain)

                                ShareLink(item: officialPDFURL) {
                                    Label("Share", systemImage: "square.and.arrow.up")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(.white)
                                        .frame(maxWidth: .infinity)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 12)
                                        .background(Color.white.opacity(0.08))
                                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    DetailSection(title: "Quick Rules", background: sectionBackground) {
                        if let image = loadBundledImage(from: army.bundledQuickRulesURL) {
                            Button {
                                quickRulesPreviewImage = image
                            } label: {
                                VStack(alignment: .leading, spacing: 8) {
                                    Image(uiImage: image)
                                        .resizable()
                                        .scaledToFit()
                                        .frame(maxWidth: .infinity)
                                        .background(Color.white.opacity(0.08))
                                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                                    Label("Tap para hacer zoom", systemImage: "magnifyingglass")
                                        .font(.caption.weight(.medium))
                                        .foregroundStyle(.white.opacity(0.72))
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .buttonStyle(.plain)
                        } else {
                            Text(army.quickRulesFileName ?? "No hay imagen local de Quick Rules para este ejército todavía.")
                                .font(.callout)
                                .foregroundStyle(.white.opacity(0.78))
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(16)
                                .background(Color.white.opacity(0.08))
                                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        }
                    }
                }
                .padding(.vertical, 16)
                .frame(width: geometry.size.width - 32, alignment: .leading)
                .frame(maxWidth: .infinity)
            }
            .background(detailBackground)
            .frame(maxWidth: .infinity)
            .scrollIndicators(.hidden)
        }
        .background(detailBackground.ignoresSafeArea())
        .navigationTitle(army.faction)
        .navigationBarTitleDisplayMode(.inline)
        .fullScreenCover(item: $quickRulesPreviewImage, content: QuickRulesZoomView.init)
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

private struct QuickRulesZoomView: View {
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

private struct ArmyThumbnailView<Placeholder: View>: View {
    let army: Army
    @ViewBuilder let placeholder: () -> Placeholder

    var body: some View {
        if let image = loadBundledImage(from: army.bundledThumbnailURL) {
            Image(uiImage: image)
                .resizable()
                .scaledToFit()
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        } else if let imageURL = army.imageURL {
            AsyncImage(url: imageURL) { phase in
                switch phase {
                case .empty:
                    placeholder()
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFit()
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                case .failure:
                    placeholder()
                @unknown default:
                    placeholder()
                }
            }
        } else {
            placeholder()
        }
    }
}

private struct ArmyHeroImageView<Placeholder: View>: View {
    let army: Army
    @ViewBuilder let placeholder: () -> Placeholder

    var body: some View {
        if let image = loadBundledImage(from: army.bundledThumbnailURL) {
            Image(uiImage: image)
                .resizable()
                .scaledToFit()
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        } else if let imageURL = army.imageURL {
            AsyncImage(url: imageURL) { phase in
                switch phase {
                case .empty:
                    placeholder()
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFit()
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                case .failure:
                    placeholder()
                @unknown default:
                    placeholder()
                }
            }
        } else {
            placeholder()
        }
    }
}

private struct TagLabel: View {
    let title: String

    var body: some View {
        Text(title)
            .font(.caption.weight(.semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color.white.opacity(0.14))
            .clipShape(Capsule())
    }
}

private struct DetailSection<Content: View>: View {
    let title: String?
    let background: Color
    @ViewBuilder let content: () -> Content

    init(title: String? = nil, background: Color, @ViewBuilder content: @escaping () -> Content) {
        self.title = title
        self.background = background
        self.content = content
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let title {
                Text(title)
                    .font(.title3.bold())
                    .foregroundStyle(.white)
            }

            content()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(background)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .shadow(color: .black.opacity(0.16), radius: 14, x: 0, y: 8)
    }
}

private struct ArmyRulesTextView: View {
    let details: String

    private var lines: [String] {
        details
            .components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(Array(lines.enumerated()), id: \.offset) { _, line in
                if line.uppercased() == "GENERAL" || line.uppercased() == "UNITS" {
                    Text(line.uppercased())
                        .font(.headline.weight(.bold))
                        .foregroundStyle(.white)
                        .underline()
                        .padding(.top, 4)
                } else {
                    Text(line)
                        .font(.body)
                        .foregroundStyle(.white.opacity(0.92))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .textSelection(.enabled)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private func loadBundledImage(from url: URL?) -> UIImage? {
    guard let url, let data = try? Data(contentsOf: url) else {
        return nil
    }

    return UIImage(data: data)
}

extension UIImage: @retroactive Identifiable {
    public var id: ObjectIdentifier {
        ObjectIdentifier(self)
    }
}
