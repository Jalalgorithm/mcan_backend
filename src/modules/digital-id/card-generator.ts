import { createCanvas, loadImage } from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";
import { cloudinary } from "../../config/cloudinary";

const CARD_WIDTH = 1013; // ~85.6mm @ 300dpi (CR80 card size)
const CARD_HEIGHT = 638; // ~54mm @ 300dpi

interface CardData {
  memberId: string;
  firstName: string;
  lastName: string;
  membershipType: string;
  chapter: string;
  state: string;
  expiryDate: Date;
  passportPhotoUrl: string;
}

async function renderCardPng(data: CardData): Promise<Buffer> {
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0b6e4f";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(24, 24, CARD_WIDTH - 48, CARD_HEIGHT - 48);

  ctx.fillStyle = "#0b6e4f";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText("MCAN SOUTHWEST", 60, 100);
  ctx.font = "24px sans-serif";
  ctx.fillText("Muslim Corpers' Association of Nigeria", 60, 135);

  try {
    const photo = await loadImage(data.passportPhotoUrl);
    ctx.drawImage(photo, 60, 170, 220, 260);
  } catch {
    ctx.strokeStyle = "#0b6e4f";
    ctx.strokeRect(60, 170, 220, 260);
  }

  ctx.fillStyle = "#111111";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText(`${data.firstName} ${data.lastName}`, 320, 210);

  ctx.font = "24px sans-serif";
  ctx.fillText(`Member ID: ${data.memberId}`, 320, 255);
  ctx.fillText(`Chapter: ${data.chapter}, ${data.state}`, 320, 290);
  ctx.fillText(`Membership: ${data.membershipType}`, 320, 325);
  ctx.fillText(`Valid until: ${data.expiryDate.toDateString()}`, 320, 360);

  return canvas.encode("png");
}

async function renderCardPdf(pngBuffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([CARD_WIDTH, CARD_HEIGHT]);
  const image = await pdfDoc.embedPng(pngBuffer);
  page.drawImage(image, { x: 0, y: 0, width: CARD_WIDTH, height: CARD_HEIGHT });
  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

function uploadBuffer(
  buffer: Buffer,
  folder: string,
  publicId: string,
  resourceType: "image" | "raw"
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: resourceType, overwrite: true },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function generateDigitalIdCard(data: CardData) {
  const png = await renderCardPng(data);
  const pdf = await renderCardPdf(png);

  const [imageResult, pdfResult] = await Promise.all([
    uploadBuffer(png, "mcan/digital-id/cards", data.memberId, "image"),
    uploadBuffer(pdf, "mcan/digital-id/cards", `${data.memberId}-pdf`, "raw"),
  ]);

  return {
    cardImageUrl: imageResult.secure_url,
    cardImagePublicId: imageResult.public_id,
    cardPdfUrl: pdfResult.secure_url,
    cardPdfPublicId: pdfResult.public_id,
  };
}
