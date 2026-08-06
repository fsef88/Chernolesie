import {createHash} from 'crypto';import {readFileSync,writeFileSync} from 'fs';
const s=readFileSync('src/game/systems/spawner.js');
const out=createHash('sha256').update(s).digest('hex').slice(0,20)+' '+s.toString().split('\n').length;
writeFileSync('docs/analysis/probe.txt',out);
console.log(out);