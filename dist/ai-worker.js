import {choose} from './engine.js';
self.onmessage=({data})=>{try{self.postMessage({token:data.token,path:choose(data.state,data.level)});}catch{self.postMessage({token:data.token,path:null});}};
