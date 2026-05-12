import Foundation

protocol ArmyRepositoryProtocol {
    func fetchArmies() async throws -> [Army]
}

struct ArmyRepository: ArmyRepositoryProtocol {
    private let url = URL(string: "https://docs.google.com/spreadsheets/d/12yiSFPhptA95R7Gihxq3g5HMJvjdwm9AsSHO2RxXKBo/edit?gid=0#gid=0")!

    func fetchArmies() async throws -> [Army] {
        let (data, _) = try await URLSession.shared.data(from: url)
        let html = try decodeHTML(data: data)
        return try parseArmies(from: html)
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

        var armies: [Army] = []

        for (index, rowMatch) in rowMatches.enumerated() where index > 0 {
            let rowHTML = nsTableHTML.substring(with: rowMatch.range(at: 1))
            let nsRowHTML = rowHTML as NSString
            let cellMatches = cellRegex.matches(in: rowHTML, range: NSRange(location: 0, length: nsRowHTML.length))
            guard cellMatches.count >= 10 else { continue }

            let cells = cellMatches.map { cleanHTML(nsRowHTML.substring(with: $0.range(at: 1))) }
            let imageURL = extractImageURL(from: nsRowHTML.substring(with: cellMatches[0].range(at: 1)))

            let army = Army(
                faction: cells[safe: 1] ?? "",
                spearheadName: cells[safe: 2] ?? "",
                grandAlliance: cells[safe: 3] ?? "",
                modelCount: Int(cells[safe: 4] ?? ""),
                pointsValue: Int(cells[safe: 5] ?? ""),
                released: parseBool(cells[safe: 6]),
                inPrint: parseBool(cells[safe: 7]),
                owned: parseBool(cells[safe: 8]),
                details: cells[safe: 9] ?? "",
                quickRulesFileName: cells[safe: 10].flatMap { $0.isEmpty ? nil : $0 },
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

private extension Collection {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
