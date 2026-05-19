import Foundation

protocol ArmyRepositoryProtocol {
    func fetchArmies() async throws -> [Army]
}

struct ArmyRepository: ArmyRepositoryProtocol {
    private let url = URL(string: "https://docs.google.com/spreadsheets/d/12yiSFPhptA95R7Gihxq3g5HMJvjdwm9AsSHO2RxXKBo/edit?gid=0#gid=0")!

    func fetchArmies() async throws -> [Army] {
        if let bundledArmies = try loadBundledArmies() {
            return bundledArmies
        }

        let (data, _) = try await URLSession.shared.data(from: url)
        let html = try decodeHTML(data: data)
        return try parseArmies(from: html)
    }

    private func loadBundledArmies() throws -> [Army]? {
        guard let snapshotURL = Bundle.main.url(forResource: "armies", withExtension: "json", subdirectory: "OfflineData") else {
            return nil
        }

        let data = try Data(contentsOf: snapshotURL)
        let decoder = JSONDecoder()
        let rows = try decoder.decode([BundledArmyRow].self, from: data)

        return rows.map {
            Army(
                faction: $0.faction,
                spearheadName: $0.spearheadName,
                grandAlliance: $0.grandAlliance,
                modelCount: $0.modelCount,
                pointsValue: $0.pointsValue,
                released: $0.released,
                inPrint: $0.inPrint,
                owned: $0.owned,
                details: $0.details,
                quickRulesFileName: $0.quickRulesFileName,
                thumbnailImageName: $0.thumbnailImageName,
                quickRulesImageName: $0.quickRulesImageName,
                officialPDFURL: $0.officialPDFURL,
                imageURL: $0.imageURL
            )
        }
    }

    private func decodeHTML(data: Data) throws -> String {
        if let html = String(data: data, encoding: .utf8) {
            return html
        }

        if let html = String(data: data, encoding: .isoLatin1) {
            return html
        }

        throw ArmyRepositoryError.invalidEncoding
    }

    private func parseArmies(from html: String) throws -> [Army] {
        guard let tableRange = html.range(of: "<table class=\"waffle", options: [.caseInsensitive]),
              let tableEndRange = html.range(of: "</table>", options: [.caseInsensitive], range: tableRange.lowerBound..<html.endIndex) else {
            throw ArmyRepositoryError.tableNotFound
        }

        let tableHTML = String(html[tableRange.lowerBound..<tableEndRange.upperBound])
        let rowPattern = #"<tr[^>]*>(.*?)</tr>"#
        let cellPattern = #"<t[dh][^>]*>(.*?)</t[dh]>"#

        let rowRegex = try NSRegularExpression(pattern: rowPattern, options: [.dotMatchesLineSeparators, .caseInsensitive])
        let cellRegex = try NSRegularExpression(pattern: cellPattern, options: [.dotMatchesLineSeparators, .caseInsensitive])

        let nsTableHTML = tableHTML as NSString
        let rowMatches = rowRegex.matches(in: tableHTML, range: NSRange(location: 0, length: nsTableHTML.length))
        let pdfURLsBySpearhead = extractPDFURLs(from: html)

        var armies: [Army] = []

        for (index, rowMatch) in rowMatches.enumerated() where index > 0 {
            let rowHTML = nsTableHTML.substring(with: rowMatch.range(at: 1))
            let nsRowHTML = rowHTML as NSString
            let cellMatches = cellRegex.matches(in: rowHTML, range: NSRange(location: 0, length: nsRowHTML.length))
            guard cellMatches.count >= 10 else { continue }

            let cells = cellMatches.map { cleanHTML(nsRowHTML.substring(with: $0.range(at: 1))) }
            let imageURL = extractImageURL(from: nsRowHTML.substring(with: cellMatches[0].range(at: 1)))
            let spearheadName = cells[safe: 2] ?? ""
            let officialPDFURL = pdfURLsBySpearhead[spearheadName]

            let army = Army(
                faction: cells[safe: 1] ?? "",
                spearheadName: spearheadName,
                grandAlliance: cells[safe: 3] ?? "",
                modelCount: Int(cells[safe: 4] ?? ""),
                pointsValue: Int(cells[safe: 5] ?? ""),
                released: parseBool(cells[safe: 6]),
                inPrint: parseBool(cells[safe: 7]),
                owned: parseBool(cells[safe: 8]),
                details: cells[safe: 9] ?? "",
                quickRulesFileName: cells[safe: 10].flatMap { $0.isEmpty ? nil : $0 },
                officialPDFURL: officialPDFURL,
                imageURL: imageURL
            )

            if !army.faction.isEmpty, !army.spearheadName.isEmpty {
                armies.append(army)
            }
        }

        return armies
    }

    private func cleanHTML(_ raw: String) -> String {
        var text = raw
            .replacingOccurrences(of: "<br ?/?>", with: "\n", options: .regularExpression)
            .replacingOccurrences(of: "</div>", with: "\n", options: .caseInsensitive)

        text = text.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
        text = text.replacingOccurrences(of: "&nbsp;", with: " ")
        text = text.replacingOccurrences(of: "&amp;", with: "&")
        text = text.replacingOccurrences(of: "&quot;", with: "\"")
        text = text.replacingOccurrences(of: "&#39;", with: "'")
        text = text.replacingOccurrences(of: "&#x27;", with: "'")
        text = text.replacingOccurrences(of: "&lt;", with: "<")
        text = text.replacingOccurrences(of: "&gt;", with: ">")

        let lines = text
            .components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        return lines.joined(separator: "\n")
    }

    private func extractImageURL(from cellHTML: String) -> URL? {
        guard let range = cellHTML.range(of: #"src="([^"]+)""#, options: .regularExpression) else {
            return nil
        }

        let match = String(cellHTML[range])
        let urlString = match
            .replacingOccurrences(of: #"src=""#, with: "", options: .regularExpression)
            .dropLast()

        return URL(string: String(urlString))
    }

    private func extractPDFURLs(from html: String) -> [String: URL] {
        let pattern = #"\\\"2\\\":131075,\\\"3\\\":\[2,\\\"([^\\\"]+)\\\"\],\\\"6\\\":6,\\\"24\\\":\\\"(https://[^\\\"]+\.pdf[^\\\"]*)\\\""#
        guard let regex = try? NSRegularExpression(pattern: pattern) else {
            return [:]
        }

        let nsHTML = html as NSString
        let matches = regex.matches(in: html, range: NSRange(location: 0, length: nsHTML.length))

        var mapping: [String: URL] = [:]
        for match in matches where match.numberOfRanges == 3 {
            let spearheadName = nsHTML.substring(with: match.range(at: 1))
                .replacingOccurrences(of: "&#39;", with: "'")
                .replacingOccurrences(of: "’", with: "'")
            let urlString = nsHTML.substring(with: match.range(at: 2))
                .replacingOccurrences(of: "&amp;", with: "&")

            if let url = URL(string: urlString) {
                mapping[spearheadName] = url
            }
        }

        return mapping
    }

    private func parseBool(_ value: String?) -> Bool {
        guard let value else { return false }
        return value.contains("✔") || value.caseInsensitiveCompare("TRUE") == .orderedSame
    }
}

enum ArmyRepositoryError: LocalizedError {
    case invalidEncoding
    case tableNotFound

    var errorDescription: String? {
        switch self {
        case .invalidEncoding:
            return "No se pudo decodificar la respuesta del spreadsheet."
        case .tableNotFound:
            return "No se encontró la tabla esperada en el spreadsheet."
        }
    }
}

private struct BundledArmyRow: Decodable {
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
}

private extension Collection {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
