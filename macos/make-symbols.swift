// Renders the SF Symbols that Cut's interface uses (every sf('name') in src/renderer/src/icons.ts)
// from this Mac's system into src/renderer/public/symbols/<name>.png: a black glyph on transparent,
// centred in a square, used by the renderer as a CSS mask so it takes the text colour.
// The images come from the system at build time and are not kept in the repository (git-ignored):
// SF Symbols may be used in apps for Apple platforms, which Cut is, but not redistributed on their own.
//   swift macos/make-symbols.swift
import AppKit

let root = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : FileManager.default.currentDirectoryPath)
let source = try String(contentsOf: root.appendingPathComponent("src/renderer/src/icons.ts"), encoding: .utf8)
let regex = try NSRegularExpression(pattern: #"sf\('([a-z0-9.]+)'"#)
let names = Set(regex.matches(in: source, range: NSRange(source.startIndex..., in: source)).compactMap { m in
    Range(m.range(at: 1), in: source).map { String(source[$0]) }
}).sorted()

let outDir = root.appendingPathComponent("src/renderer/public/symbols")
try? FileManager.default.removeItem(at: outDir)
try FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

let pointSize: CGFloat = 52   // the glyph's point size
let box: CGFloat = 64         // the square it is centred in (so the glyph sits like a letter of 1em)
let scale: CGFloat = 2        // pixels per point
var missing: [String] = []

for name in names {
    guard let base = NSImage(systemSymbolName: name, accessibilityDescription: nil),
          let image = base.withSymbolConfiguration(.init(pointSize: pointSize, weight: .regular)) else {
        missing.append(name); continue
    }
    let px = Int(box * scale)
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px, bitsPerSample: 8, samplesPerPixel: 4,
                               hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = NSSize(width: box, height: box)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    var size = image.size
    let fit = min(1, (box - 2) / max(size.width, size.height)) // very wide symbols are shrunk to fit
    size = NSSize(width: size.width * fit, height: size.height * fit)
    let rect = NSRect(x: (box - size.width) / 2, y: (box - size.height) / 2, width: size.width, height: size.height)
    image.draw(in: rect)
    NSColor.black.set()
    rect.fill(using: .sourceAtop) // template: black, alpha from the glyph
    NSGraphicsContext.restoreGraphicsState()
    try rep.representation(using: .png, properties: [:])!.write(to: outDir.appendingPathComponent("\(name).png"))
}

if !missing.isEmpty {
    FileHandle.standardError.write("error: SF Symbols not found on this Mac: \(missing.joined(separator: ", "))\n".data(using: .utf8)!)
    exit(1)
}
print("\(names.count) symbols in \(outDir.path)")
