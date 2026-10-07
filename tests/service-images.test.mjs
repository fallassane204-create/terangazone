import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {prepareServiceImage} from '../lib/catalogue/image-upload.ts';
import {temporaryServiceImages,temporaryImageFor} from '../lib/catalogue/images.ts';
test('all nine original service images and fallback are valid uniform WebP assets',async()=>{
  for(const path of [...Object.values(temporaryServiceImages),'/services/fallback.webp']){
    const data=await readFile(`public${path}`); const metadata=await sharp(data).metadata();
    assert.equal(metadata.format,'webp'); assert.equal(metadata.width,1200);assert.equal(metadata.height,750);
    assert.ok(data.length<200000);
  }
  assert.equal(temporaryImageFor('Disney+'),'/services/disney-plus.webp');
  assert.equal(temporaryImageFor('Nouvelle offre'),'/services/fallback.webp');
});
test('uploaded photo is decoded, resized and reencoded as WebP without metadata',async()=>{
  const input=await sharp({create:{width:2200,height:1800,channels:3,background:'#643cff'}}).jpeg().toBuffer();
  const output=await prepareServiceImage(new File([input],'photo.jpg',{type:'image/jpeg'}));
  const metadata=await sharp(output).metadata();
  assert.equal(metadata.format,'webp');assert.equal(metadata.width,1600); assert.equal(metadata.exif,undefined);
});
for (const [extension, format, mime] of [['jpg','jpeg','image/jpeg'],['jpeg','jpeg','image/jpeg'],['png','png','image/png'],['webp','webp','image/webp']]) {
  test(`${extension.toUpperCase()} upload is actually encoded as WebP`,async()=>{
    const input=await sharp({create:{width:96,height:60,channels:3,background:'#643cff'}}).toFormat(format).toBuffer();
    assert.equal((await sharp(input).metadata()).format,format);
    const output=await prepareServiceImage(new File([input],`photo.${extension}`,{type:mime}));
    assert.equal(output.subarray(0,4).toString(),'RIFF');
    assert.equal(output.subarray(8,12).toString(),'WEBP');
    assert.equal((await sharp(output).metadata()).format,'webp');
  });
}
test('upload rejects spoofed files, SVG and oversized images',async()=>{
  await assert.rejects(()=>prepareServiceImage(new File(['not an image'],'fake.jpg',{type:'image/jpeg'})),/invalide/);
  await assert.rejects(()=>prepareServiceImage(new File(['<svg/>'],'vector.svg',{type:'image/svg+xml'})),/JPG/);
  await assert.rejects(()=>prepareServiceImage(new File([new Uint8Array(5242881)],'big.png',{type:'image/png'})),/5 Mo/);
});
