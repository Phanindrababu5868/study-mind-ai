import { PDFParse } from "pdf-parse";

/**
 * Extract text from a PDF held in memory (e.g. multer's req.file.buffer,
 * or a buffer downloaded from R2) — no filesystem access required.
 * @param {Buffer} buffer - Raw PDF bytes
 * @returns {Promise<{text: string, numPages: number, info: object}>}
 */
export const extractTextFromPDF = async (buffer) => {
  try {
    // pdf-parse expects a Uint8Array, not a Buffer
    const parser = new PDFParse(new Uint8Array(buffer));

    const data = await parser.getText();

    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to extract text from PDF");
  }
};
