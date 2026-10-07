import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
function git(...args) {
  const result=spawnSync('git',args,{encoding:'utf8'});
  if(result.status!==0) throw new Error('Lecture Git impossible.');
  return result.stdout.split('\n').filter(Boolean);
}
const tracked=git('ls-files');
const forbidden=tracked.filter(path=>/(^|\/)\.env[^/]*$|\.(pem|key|p12|pfx)$|(^|\/)\.vercel\//i.test(path));
const values=[];
try {
  for(const line of (await readFile('.env.local','utf8')).split(/\r?\n/)) {
    const match=line.match(/^\s*([^#=]+)=(.+)$/);
    if(match && /KEY|TOKEN|SECRET|PASSWORD/i.test(match[1])) {
      const value=match[2].trim().replace(/^['"]|['"]$/g,'');
      if(value.length>=16) values.push(value);
    }
  }
} catch(error) { if(error.code!=='ENOENT') throw error; }
const files=[...new Set(git('ls-files','-co','--exclude-standard'))];
const matches=[];
for(const path of files) {
  if(/\.(webp|jpg|png|ico|woff2?|pdf)$/i.test(path)) continue;
  const content=await readFile(path,'utf8');
  if(values.some(value=>content.includes(value)) || /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sb_secret_|ghp_|github_pat_)[A-Za-z0-9_]{20,}/.test(content)) matches.push(path);
}
console.log(JSON.stringify({filesScanned:files.length,forbiddenTrackedFiles:forbidden,secretMatches:matches},null,2));
if(forbidden.length||matches.length) process.exitCode=1;
