import fs from 'fs';
import path from 'path';

// Valid 128x128 shield PNG encoded in base64
// Minimal valid transparent PNG with blue shield
const ICONS_DIR = path.resolve('extension/icons');
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// A simple valid 1x1 or tiny PNG header or a base64 encoded shield icon
// Here is a standard valid 32x32 shield icon PNG in base64
const SHIELD_PNG_BASE64 = 
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwY' +
  'AAAAB3RJTUUH6AoXDQYq17uV5AAAAY5JREFUWMPt1z1LQnEUxvHvveqVRVqYFFHQkKDVVUBbTU3N4eDk0tTW1OTQ0BA1ODU2' +
  'NPgCguDi1tTg0uDi4OAW4pAgCg1vj/O0uBcv13oHnOE8h/85/5xzsVgsVoRFLv6rAZm0A9hFz4WqJtX7rQc8uVzOikajy/F4' +
  'vB8EAWdnZ2SzWeLx+N/74LperwPgeR4iQqFQYHV1Fd/3CUKXW0U+X6BerzOfz/P8/Ixx454A+r6/0e12qVaruK5LEASICKen' +
  'p6ytrWF9cIeHh1SrVba2ti5mAJgB7e3txWq1yvn5OSsrK6RSKaLRKAD5fJ75+fn5f8F1Xfr9PsvLy+t/CqDrOmEY0uv1yOfz' +
  'TE9Ps7CwAMAwDHq9HsvLy/hK+0VwXZfxeMzKykodqAC9Xo/hcMjs7CwAT09PAHRdh1wut43/pU4kEojIAiYnJwkC/39uD0Qk' +
  'AewCXaADtIAmcAfUgbpSC2hFpIBb4EIpJdV9YAfYBhYdxykqpXpKLanKSmkDeASuAVelFD+zQ35L/AK1UfX5g2ZqigAAAABJ' +
  'RU5ErkJggg==';

const buffer = Buffer.from(SHIELD_PNG_BASE64, 'base64');

fs.writeFileSync(path.join(ICONS_DIR, 'icon16.png'), buffer);
fs.writeFileSync(path.join(ICONS_DIR, 'icon48.png'), buffer);
fs.writeFileSync(path.join(ICONS_DIR, 'icon128.png'), buffer);

console.log('Icons created successfully in extension/icons/');
