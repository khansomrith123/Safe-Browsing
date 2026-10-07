import JSZip from "jszip";
import { EXTENSION_FILES, getCustomizedExtensionFiles } from "../extensionCode";

const SHIELD_PNG_BASE64 = 
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwY" +
  "AAAAB3RJTUUH6AoXDQYq17uV5AAAAY5JREFUWMPt1z1LQnEUxvHvveqVRVqYFFHQkKDVVUBbTU3N4eDk0tTW1OTQ0BA1ODU2" +
  "NPgCguDi1tTg0uDi4OAW4pAgCg1vj/O0uBcv13oHnOE8h/85/5xzsVgsVoRFLv6rAZm0A9hFz4WqJtX7rQc8uVzOikajy/F4" +
  "vB8EAWdnZ2SzWeLx+N/74LperwPgeR4iQqFQYHV1Fd/3CUKXW0U+X6BerzOfz/P8/Ixx454A+r6/0e12qVaruK5LEASICKen" +
  "p6ytrWF9cIeHh1SrVba2ti5mAJgB7e3txWq1yvn5OSsrK6RSKaLRKAD5fJ75+fn5f8F1Xfr9PsvLy+t/CqDrOmEY0uv1yOfz" +
  "TE9Ps7CwAMAwDHq9HsvLy/hK+0VwXZfxeMzKykodqAC9Xo/hcMjs7CwAT09PAHRdh1wut43/pU4kEojIAiYnJwkC/39uD0Qk" +
  "AewCXaADtIAmcAfUgbpSC2hFpIBb4EIpJdV9YAfYBhYdxykqpXpKLanKSmkDeASuAVelFD+zQ35L/AK1UfX5g2ZqigAAAABJ" +
  "RU5ErkJggg==";

export async function generateExtensionZip(userApiKey?: string): Promise<Blob> {
  const zip = new JSZip();
  const filesToZip = getCustomizedExtensionFiles(userApiKey);

  // Add source files
  for (const [filename, file] of Object.entries(filesToZip)) {
    zip.file(filename, file.content);
  }

  // Add icons directory
  const iconsFolder = zip.folder("icons");
  if (iconsFolder) {
    iconsFolder.file("icon16.png", SHIELD_PNG_BASE64, { base64: true });
    iconsFolder.file("icon48.png", SHIELD_PNG_BASE64, { base64: true });
    iconsFolder.file("icon128.png", SHIELD_PNG_BASE64, { base64: true });
  }

  // Generate binary zip
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });

  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
