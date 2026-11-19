document.addEventListener("DOMContentLoaded", function () {
    const exportButton = document.getElementById("exportWordBtn");

    if (!exportButton) {
        console.error("Export Word button not found.");
        return;
    }

    const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

    // Word uses half-points: 12 = 6pt.
    const VALUE_FONT_SIZE = "16";

    function formatWordDate(dateValue) {
        if (!dateValue) return "";

        const parts = String(dateValue).split("-");

        if (parts.length !== 3) return "";

        return `${parts[1]}-${parts[2]}-${parts[0]}`;
    }

    // Set font size without creating duplicate w:sz properties.
    function setRunFontSize(run, xmlDocument) {
        let runProperties = Array.from(run.children).find(
            (child) => child.localName === "rPr",
        );

        if (!runProperties) {
            runProperties = xmlDocument.createElementNS(W_NS, "w:rPr");
            run.insertBefore(runProperties, run.firstChild);
        }

        // Remove existing font-size settings.
        Array.from(runProperties.children).forEach((child) => {
            if (child.localName === "sz" || child.localName === "szCs") {
                runProperties.removeChild(child);
            }
        });

        const fontSize = xmlDocument.createElementNS(W_NS, "w:sz");
        fontSize.setAttributeNS(W_NS, "w:val", VALUE_FONT_SIZE);
        runProperties.appendChild(fontSize);

        const fontSizeComplex = xmlDocument.createElementNS(W_NS, "w:szCs");
        fontSizeComplex.setAttributeNS(W_NS, "w:val", VALUE_FONT_SIZE);
        runProperties.appendChild(fontSizeComplex);
    }

    // Apply 6pt to every text run in a territory data row.
    function applyFontSizeToRow(row, xmlDocument) {
        const runs = row.getElementsByTagNameNS(W_NS, "r");

        Array.from(runs).forEach((run) => {
            setRunFontSize(run, xmlDocument);
        });
    }

    function setWordCellText(cell, value, xmlDocument) {
        const paragraph = cell.getElementsByTagNameNS(W_NS, "p")[0];

        if (!paragraph) {
            throw new Error("A Word table cell has no paragraph.");
        }

        // Preserve paragraph formatting.
        const paragraphProperties = Array.from(paragraph.children).find(
            (child) => child.localName === "pPr",
        );

        const savedParagraphProperties = paragraphProperties
            ? paragraphProperties.cloneNode(true)
            : null;

        // Preserve the first run's formatting.
        const firstRun = Array.from(paragraph.children).find(
            (child) => child.localName === "r",
        );

        const runProperties = firstRun
            ? firstRun.getElementsByTagNameNS(W_NS, "rPr")[0]
            : null;

        const savedRunProperties = runProperties
            ? runProperties.cloneNode(true)
            : null;

        // Clear paragraph contents.
        while (paragraph.firstChild) {
            paragraph.removeChild(paragraph.firstChild);
        }

        if (savedParagraphProperties) {
            paragraph.appendChild(savedParagraphProperties);
        }

        const run = xmlDocument.createElementNS(W_NS, "w:r");

        if (savedRunProperties) {
            run.appendChild(savedRunProperties);
        }

        // Force the replacement value to 6pt.
        setRunFontSize(run, xmlDocument);

        const textNode = xmlDocument.createElementNS(W_NS, "w:t");

        textNode.setAttributeNS(
            "http://www.w3.org/XML/1998/namespace",
            "xml:space",
            "preserve",
        );

        textNode.textContent = value || "";

        run.appendChild(textNode);
        paragraph.appendChild(run);
    }

    async function exportToWord() {
        if (!window.supabaseClient) {
            throw new Error("Supabase is not initialized.");
        }

        if (!window.JSZip) {
            throw new Error("The Word export library did not load.");
        }

        exportButton.disabled = true;
        exportButton.textContent = "Preparing Word document...";

        try {
            // 1. Retrieve all territory records.
            const { data: records, error } = await window.supabaseClient
                .from("territory_records")
                .select("territory_no, date_assigned, date_completed")
                .order("territory_no", { ascending: true });

            if (error) {
                throw error;
            }

            if (!records || records.length !== 76) {
                throw new Error(
                    `Expected 76 territory records, but found ${
                        records ? records.length : 0
                    }.`,
                );
            }

            // 2. Load the original Word template.
            const response = await fetch(
                "./templates/territory-assignment-template.docx",
            );

            if (!response.ok) {
                throw new Error(
                    "Could not load the Word template. Check the templates folder.",
                );
            }

            const templateBuffer = await response.arrayBuffer();
            const zip = await window.JSZip.loadAsync(templateBuffer);

            const documentFile = zip.file("word/document.xml");

            if (!documentFile) {
                throw new Error("The Word document XML file was not found.");
            }

            const xmlContent = await documentFile.async("string");

            const parser = new DOMParser();
            const xmlDocument = parser.parseFromString(
                xmlContent,
                "application/xml",
            );

            if (xmlDocument.getElementsByTagName("parsererror").length) {
                throw new Error("The Word template XML could not be read.");
            }

            // 3. Locate the territory tables.
            const tables = xmlDocument.getElementsByTagNameNS(W_NS, "tbl");

            if (tables.length < 5) {
                throw new Error(
                    "The template does not contain the expected five tables.",
                );
            }

            const territoryTables = Array.from(tables).slice(1, 5);

            const recordsByNumber = new Map(
                records.map((record) => [Number(record.territory_no), record]),
            );

            // 4. Update territory data and font sizes.
            territoryTables.forEach((table, tableIndex) => {
                const firstTerritoryNumber = tableIndex * 20 + 1;

                const rows = Array.from(
                    table.getElementsByTagNameNS(W_NS, "tr"),
                );

                // Keep rows 0 and 1 unchanged because they contain headers.
                // Apply 6pt only to territory data rows.
                // Apply 6pt only to assignment values.
                // Preserve Terr. No. and Last Date Completed columns.
                rows.forEach((row, rowIndex) => {
                    if (rowIndex < 2) return;

                    const cells = row.getElementsByTagNameNS(W_NS, "tc");

                    // Assignment columns start at cell index 2.
                    for (
                        let cellIndex = 2;
                        cellIndex < cells.length;
                        cellIndex++
                    ) {
                        const runs = cells[cellIndex].getElementsByTagNameNS(
                            W_NS,
                            "r",
                        );

                        Array.from(runs).forEach((run) => {
                            setRunFontSize(run, xmlDocument);
                        });
                    }
                });

                for (let index = 0; index < 20; index++) {
                    const territoryNumber = firstTerritoryNumber + index;

                    if (territoryNumber > 76) break;

                    const record = recordsByNumber.get(territoryNumber);

                    if (!record) {
                        throw new Error(
                            `Territory ${territoryNumber} is missing from Supabase.`,
                        );
                    }

                    // Each territory uses two rows.
                    // First row: territory information.
                    // Second row: assignment dates.
                    const dateRowIndex = 3 + index * 2;
                    const dateRow = rows[dateRowIndex];

                    if (!dateRow) {
                        throw new Error(
                            `Could not find the date row for Territory ${territoryNumber}.`,
                        );
                    }

                    const cells = dateRow.getElementsByTagNameNS(W_NS, "tc");

                    if (cells.length < 4) {
                        throw new Error(
                            `The date cells for Territory ${territoryNumber} are missing.`,
                        );
                    }

                    // Update the first Date Assigned and Date Completed.
                    setWordCellText(
                        cells[2],
                        formatWordDate(record.date_assigned),
                        xmlDocument,
                    );

                    setWordCellText(
                        cells[3],
                        formatWordDate(record.date_completed),
                        xmlDocument,
                    );
                }
            });

            // 5. Replace the document XML.
            const serializer = new XMLSerializer();
            const updatedXml = serializer.serializeToString(xmlDocument);

            zip.file("word/document.xml", updatedXml);

            // 6. Generate the Word document.
            const blob = await zip.generateAsync({
                type: "blob",
                mimeType:
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            // 7. Download the document.
            const downloadUrl = URL.createObjectURL(blob);
            const downloadLink = document.createElement("a");

            const today = new Date();

            const dateStamp =
                today.getFullYear() +
                String(today.getMonth() + 1).padStart(2, "0") +
                String(today.getDate()).padStart(2, "0");

            downloadLink.href = downloadUrl;
            downloadLink.download = `Territory-Assignment-Record-2027-${dateStamp}.docx`;

            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();

            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

            alert(
                "Word document exported successfully!\n\n" +
                    "76 territory records processed.\n" +
                    "Territory data values: 6pt.\n" +
                    "Table headers: unchanged.",
            );
        } catch (error) {
            console.error("Word export failed:", error);

            alert(
                "Unable to export the Word document:\n\n" +
                    (error.message || "An unexpected error occurred."),
            );
        } finally {
            exportButton.disabled = false;
            exportButton.innerHTML = "📄 Export to Word";
        }
    }

    exportButton.addEventListener("click", exportToWord);
});
