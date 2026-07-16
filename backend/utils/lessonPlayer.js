/** Protected lesson media player — hides YouTube/source URL from the student page. */

const isDirectMedia = (url) => !!url && /\.(mp4|webm|mov|mp3|wav|m4a|ogg|oga|opus)(\?|$)/i.test(url);
const isAudioMedia = (url) => !!url && /\.(mp3|wav|m4a|ogg|oga|opus)(\?|$)/i.test(url);

const getYouTubeId = (url) => {
  const m = (url || '').match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
};

const getVimeoEmbed = (url) => {
  const m = (url || '').match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}?title=0&byline=0&portrait=0` : null;
};

const getDriveEmbed = (url) => {
  const m = (url || '').match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
};

const htmlShell = (body) =>
  `<!doctype html><html lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}</style></head><body>${body}</body></html>`;

/** Custom YouTube player: no logo/title/"Watch on YouTube", blocks YouTube UI overlays. */
function youtubePlayerHtml(vid) {
  return `<!doctype html><html lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
html,body{margin:0;height:100%;background:#000;overflow:hidden;font-family:Tahoma,Arial,sans-serif}
#wrap{position:relative;width:100%;height:100%;background:#000}
#player{position:absolute;top:0;left:0;width:100%;height:100%}#player iframe{width:100%;height:100%}
#guard{position:absolute;inset:0;z-index:3}
#mtop{position:absolute;top:0;left:0;right:0;height:64px;z-index:4;pointer-events:none;background:linear-gradient(to bottom,#000 0,rgba(0,0,0,.55) 55%,rgba(0,0,0,0))}
#mbot{position:absolute;bottom:0;left:0;right:0;height:128px;z-index:4;pointer-events:none;background:linear-gradient(to top,#000 0,#000 62%,rgba(0,0,0,0))}
#poster{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;background:#000;cursor:pointer}
#poster .b{width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;transition:.2s}
#poster:hover .b{background:rgba(255,255,255,.3);transform:scale(1.06)}
#poster svg{width:34px;height:34px;fill:#fff;margin-left:5px}
#bar{position:absolute;left:0;right:0;bottom:0;z-index:6;padding:8px 12px 12px;background:linear-gradient(transparent,rgba(0,0,0,.8));opacity:0;transition:.25s;color:#fff;direction:ltr}
#wrap.show #bar{opacity:1}
#seek{position:relative;height:5px;border-radius:6px;background:rgba(255,255,255,.28);cursor:pointer;margin-bottom:6px}
#buf{position:absolute;top:0;left:0;height:100%;width:0;background:rgba(255,255,255,.3);border-radius:6px}
#prog{position:absolute;top:0;left:0;height:100%;width:0;background:#e63946;border-radius:6px}
#dot{position:absolute;top:50%;left:0;transform:translate(-50%,-50%);width:12px;height:12px;border-radius:50%;background:#e63946;opacity:0;transition:.2s}
#seek:hover #dot{opacity:1}
.row{display:flex;align-items:center;gap:12px}
.ic{background:none;border:0;color:#fff;cursor:pointer;padding:2px;display:flex;align-items:center}
.ic svg{width:22px;height:22px;fill:#fff}
#time{font-size:12px;color:#eee;font-variant-numeric:tabular-nums}.sp{flex:1}
</style></head><body>
<div id="wrap">
<div id="player"></div>
<div id="guard"></div>
<div id="mtop"></div>
<div id="mbot"></div>
<div id="poster"><div class="b"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div></div>
<div id="bar">
<div id="seek"><div id="buf"></div><div id="prog"></div><div id="dot"></div></div>
<div class="row">
<button class="ic" id="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>
<button class="ic" id="mute"><svg viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3z"/></svg></button>
<span id="time">0:00 / 0:00</span><span class="sp"></span>
<button class="ic" id="fs"><svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>
</div></div></div>
<script>
var vid="${vid}",player,ready=false,pending=false,timer=null,ht=null;
var wrap=document.getElementById('wrap'),poster=document.getElementById('poster'),guard=document.getElementById('guard');
var seek=document.getElementById('seek'),prog=document.getElementById('prog'),buf=document.getElementById('buf'),dot=document.getElementById('dot');
var playBtn=document.getElementById('play'),muteBtn=document.getElementById('mute'),timeEl=document.getElementById('time'),fsBtn=document.getElementById('fs');
var PLAY='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',PAUSE='<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
var VOL='<svg viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3z"/></svg>',MUTED='<svg viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M15.6 8.8l4.6 4.6-1.2 1.2-4.6-4.6zm4.6 0l-4.6 4.6 1.2 1.2 4.6-4.6z"/></svg>';
window.onYouTubeIframeAPIReady=function(){player=new YT.Player('player',{videoId:vid,playerVars:{controls:0,modestbranding:1,rel:0,iv_load_policy:3,fs:0,disablekb:1,playsinline:1,autoplay:0,origin:location.origin},events:{onReady:onReady,onStateChange:onState}});};
(function(){var s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';document.head.appendChild(s);})();
function onReady(){ready=true;if(pending){pending=false;cover(false);player.playVideo();}setInterval(loop,120);}
function fmt(s){s=Math.floor(s||0);var m=Math.floor(s/60),x=s%60;return m+':'+(x<10?'0':'')+x;}
function cover(show){poster.style.display=show?'flex':'none';}
function toggle(){if(!ready){pending=true;return;}if(player.getPlayerState()===1){cover(true);player.pauseVideo();}else{cover(false);player.playVideo();}}
var END_HIDE=20;
function loop(){if(!ready)return;var st=player.getPlayerState();var playing=(st===1);var d=player.getDuration()||0,t=player.getCurrentTime()||0;var nearEnd=(d>0&&d-t<=END_HIDE);cover(!(st===1||st===3)||nearEnd);playBtn.innerHTML=playing?PAUSE:PLAY;if(playing){var p=d?t/d*100:0;prog.style.width=p+'%';dot.style.left=p+'%';buf.style.width=((player.getVideoLoadedFraction&&player.getVideoLoadedFraction()*100)||0)+'%';timeEl.textContent=fmt(t)+' / '+fmt(d);}}
function onState(e){var st=e.data;cover(!(st===1||st===3));if(st===1){sched();}}
poster.addEventListener('click',function(){if(!ready){pending=true;return;}if(player.getPlayerState()!==1){cover(false);player.playVideo();}});
guard.addEventListener('click',toggle);playBtn.addEventListener('click',toggle);
muteBtn.addEventListener('click',function(){if(!ready)return;if(player.isMuted()){player.unMute();muteBtn.innerHTML=VOL;}else{player.mute();muteBtn.innerHTML=MUTED;}});
seek.addEventListener('click',function(ev){if(!ready)return;var r=seek.getBoundingClientRect(),f=(ev.clientX-r.left)/r.width;f=f<0?0:f>1?1:f;player.seekTo(f*(player.getDuration()||0),true);});
fsBtn.addEventListener('click',function(){if(document.fullscreenElement){document.exitFullscreen();}else if(wrap.requestFullscreen){wrap.requestFullscreen();}});
function sched(){if(ht)clearTimeout(ht);ht=setTimeout(function(){if(ready&&player.getPlayerState()===1)wrap.classList.remove('show');},2200);}
wrap.addEventListener('mousemove',function(){wrap.classList.add('show');sched();});
wrap.addEventListener('contextmenu',function(e){e.preventDefault();});
</script></body></html>`;
}

function resolveMediaSrc(rawUrl) {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('http')) return rawUrl;
  if (rawUrl.startsWith('/uploads/')) return rawUrl;
  if (rawUrl.startsWith('uploads/')) return `/${rawUrl}`;
  return rawUrl;
}

/** HTML served inside our iframe — original URL never returned as JSON to the student app. */
function buildPlayerHtml(rawUrl) {
  const src = resolveMediaSrc(rawUrl);
  if (isAudioMedia(rawUrl)) {
    return htmlShell(
      `<div style="display:flex;align-items:center;justify-content:center;height:100%"><audio src="${src}" controls controlsList="nodownload" style="width:92%;max-width:640px"></audio></div>`,
    );
  }
  if (isDirectMedia(rawUrl)) {
    return htmlShell(
      `<video src="${src}" controls controlsList="nodownload" playsinline oncontextmenu="return false" style="width:100%;height:100%;background:#000"></video>`,
    );
  }
  const yt = getYouTubeId(rawUrl);
  if (yt) return youtubePlayerHtml(yt);
  const embed = getVimeoEmbed(rawUrl) || getDriveEmbed(rawUrl) || src;
  return htmlShell(
    `<iframe src="${embed}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border:0;width:100%;height:100%"></iframe>`,
  );
}

module.exports = {
  buildPlayerHtml,
  getYouTubeId,
  isDirectMedia,
  isAudioMedia,
};
