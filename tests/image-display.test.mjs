import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { prepareDisplayImage } from '../lib/catalogue/image-display.ts';

test('display removes uniform margins without modifying the source or cropping the poster', async () => {
  const poster = await sharp({ create: { width: 384, height: 563, channels: 3, background: '#e02030' } }).png().toBuffer();
  const source = await sharp({ create: { width: 1080, height: 1350, channels: 3, background: '#0b0a13' } }).composite([{ input: poster, left: 348, top: 393 }]).webp().toBuffer();
  const original = Buffer.from(source);
  const result = await prepareDisplayImage(source);
  const metadata = await sharp(result).metadata();
  assert.ok(metadata.width >= 384 && metadata.width < 400);
  assert.ok(metadata.height >= 563 && metadata.height < 580);
  assert.deepEqual(source, original);
  assert.equal(metadata.format, 'webp');
});
