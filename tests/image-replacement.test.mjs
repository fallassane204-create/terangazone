import {test} from 'node:test';
import assert from 'node:assert/strict';
import {managedServiceImagePath,replaceServiceImage} from '../lib/catalogue/image-replacement.ts';
const bucket='https://example.supabase.co/storage/v1/object/public/service-images/';
const oldPath='services/30000000-0000-4000-8000-000000000001.webp';
const newPath='services/30000000-0000-4000-8000-000000000002.webp';
function fixture(overrides={}) {
  const events=[];
  const operation={previousImage:bucket+oldPath,newImage:bucket+newPath,newPath,
    resolveOldPath:url=>managedServiceImagePath(url,bucket),
    upload:async()=>{events.push('upload');},
    save:async(url)=>{events.push(['products.image',url]);return {ok:true,message:'saved'};},
    isReferenced:async()=>{events.push('references');return false;},
    remove:async(path)=>{events.push(['delete',path]);},...overrides};
  return {operation,events};
}
test('replacement saves products.image before deleting the previous managed image',async()=>{
  const {operation,events}=fixture();
  assert.equal((await replaceServiceImage(operation)).ok,true);
  assert.deepEqual(events,['upload',['products.image',bucket+newPath],'references',['delete',oldPath]]);
});
test('a failed save deletes only the new upload and preserves the previous image',async()=>{
  const {operation,events}=fixture({save:async()=>({ok:false,message:'conflict'})});
  assert.equal((await replaceServiceImage(operation)).ok,false);
  assert.deepEqual(events,['upload',['delete',newPath]]);
});
test('a failed upload leaves products.image and the old file untouched',async()=>{
  const {operation,events}=fixture({upload:async()=>{throw new Error('upload failed');}});
  assert.equal((await replaceServiceImage(operation)).ok,false);assert.deepEqual(events,[]);
});
test('shared images, local assets and external images are preserved',async()=>{
  for(const overrides of [{isReferenced:async()=>true},{previousImage:'/services/netflix.webp'},{previousImage:'https://another.example/'+oldPath}]){
    const {operation,events}=fixture(overrides);
    assert.equal((await replaceServiceImage(operation)).ok,true);
    assert.equal(events.some(event=>Array.isArray(event)&&event[0]==='delete'),false);
  }
});
test('cleanup failure keeps the new image saved and returns an explicit warning',async()=>{
  const {operation,events}=fixture({remove:async()=>{throw new Error('cleanup failed');}});
  const result=await replaceServiceImage(operation);assert.equal(result.ok,true);
  assert.match(result.message,/nettoyage/);assert.ok(events.some(event=>Array.isArray(event)&&event[0]==='products.image'));
});
test('managed paths must belong to this public bucket with a canonical UUID.webp',()=>{
  assert.equal(managedServiceImagePath(bucket+oldPath,bucket),oldPath);
  for(const url of [bucket+'services/evil.webp',bucket+oldPath+'?download=1',bucket.replace('service-images','other')+oldPath,'/services/netflix.webp',bucket+oldPath.replace('.webp','.png')]){
    assert.equal(managedServiceImagePath(url,bucket),null);
  }
  assert.equal(managedServiceImagePath('/api/test-image/'+oldPath.split('/')[1],bucket),null);
  assert.equal(managedServiceImagePath('/api/test-image/'+oldPath.split('/')[1],bucket,true),oldPath);
});
