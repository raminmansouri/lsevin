type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface QRCode {
  addData(data: string, mode?: "Numeric" | "Alphanumeric" | "Byte" | "Kanji"): void;
  make(): void;
  getModuleCount(): number;
  isDark(row: number, col: number): boolean;
}

declare const qrcode: {
  (typeNumber: number, errorCorrectionLevel: ErrorCorrectionLevel): QRCode;
  stringToBytes(s: string): number[];
  stringToBytesFuncs: Record<string, (s: string) => number[]>;
};

export default qrcode;
