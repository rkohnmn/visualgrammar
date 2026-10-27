# Supported Data Formats & Shared Interchange Schemas (`DATA_FORMATS.md`)

VisualGrammar conforms to `DATA_CONVENTIONS.md` v1.0.0 across all import and export workflows.

## 1. Supported Import Formats

1. **RFC 4180 CSV (`.csv`)**: Comma-delimited UTF-8 text with header row, supporting quoted fields containing commas or newlines and escaped double quotes (`""`). Leading-zero identifiers (such as postal code `02139`) are preserved as strings rather than stripped into integers.
2. **TSV & Semicolon Delimited Text (`.tsv`, `.txt`)**: Auto-detected tab (`\t`) and semicolon (`;`) delimited tables.
3. **Manual Table Entry / Clipboard Paste**: Direct interactive text paste in the Import Modal.
4. **`DataSenseDataset` v1.0.0 JSON (`.json`)**: Canonical DataSense Studio interchange format preserving dataset metadata, variable roles, measurement units, semantic variable types, and observation records.
5. **Reproducible VisualGrammar Configuration JSON (`.json`)**: Restores dataset observations, variable overrides, non-destructive transformation steps, and complete Chart Studio settings.

## 2. Supported Export Formats & Security Guarantees

1. **Vector SVG (`.svg`)**: Standalone XML vector graphic with embedded high-DPI plot layer, title, description, sample size $n$, and provenance footer.
2. **High-DPI PNG (`.png`)**: Retina-scaled raster export matching the visible Chart Studio configuration.
3. **Sanitized RFC 4180 CSV (`.csv`)**: Includes active transformed columns while escaping any string cell beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` with a leading apostrophe (`'`) to prevent spreadsheet formula injection in Excel, Google Sheets, and Calc.
4. **Reproducible Configuration JSON (`.json`)**: Complete workspace state and schema version (`1.0.0`).
5. **`DataSenseDataset` v1.0.0 Interchange JSON (`.json`)**: Ready for direct import into QuartetLab, ResampleLab, or ForecastLab.
6. **Reproducible R (`ggplot2`), Python (`pandas`/`scipy`), and LaTeX (`booktabs`) Scripts**.
7. **Privacy-Safe Shareable URL Hash (`#state=...`)**: Base64-encoded configuration and preset pointer that never leaks uploaded personal rows into URLs or server logs.
