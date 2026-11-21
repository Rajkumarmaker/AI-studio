const $ = (id) => document.getElementById(id);
const views = ["studio", "assistant", "editor", "text", "image"];
const titles = {studio:"Studio overview",assistant:"AI Script Assistant",editor:"Video Editor",text:"Text to Video planner",image:"Image to Video planner"};
let videoUrl = null;
let imageUrl = null;

function showView(name) {
  views.forEach(v => $("view-" + v).classList.toggle("active", v === name));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.section === name));
  $("page-title").textContent = titles[name] || "AI-Studio";
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => showView(b.dataset.go)));
document.querySelectorAll("[data-section]").forEach(b => b.addEventListener("click", () => showView(b.dataset.section)));
$("new-project").addEventListener("click", () => { $("idea").value = ""; $("assistant-output").textContent = "Your script, storyboard and prompts will appear here."; $("assistant-output").classList.add("empty"); showView("assistant"); });

async function checkHealth() {
  try {
    const r = await fetch("/api/health");
    const data = await r.json();
    $("connection-label").textContent = data.assistantConfigured ? "AI assistant connected" : "Workspace ready";
    $("connection-detail").textContent = data.assistantConfigured ? "OpenAI key detected" : "Add an OpenAI key for AI tools";
    $("connection-label").previousElementSibling.style.background = data.assistantConfigured ? "#61d6a1" : "#e3b65d";
  } catch {
    $("connection-label").textContent = "Service unavailable";
    $("connection-detail").textContent = "Refresh to reconnect";
  }
}
checkHealth();

async function requestAssistant(idea, task, duration=30, style="cinematic documentary") {
  const response = await fetch("/api/assistant", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({idea,task,duration,style})
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data.result;
}
$("generate").addEventListener("click", async () => {
  const idea = $("idea").value.trim();
  if (!idea) { $("assistant-status").textContent = "Enter your video idea first."; return; }
  const button = $("generate");
  button.disabled = true; button.textContent = "Generating…";
  $("assistant-status").textContent = "Connecting to the AI assistant…";
  try {
    const result = await requestAssistant(idea, $("task").value, $("duration").value, $("style").value);
    $("assistant-output").textContent = result;
    $("assistant-output").classList.remove("empty");
    $("assistant-status").textContent = "Done — review your creative output below.";
  } catch (e) { $("assistant-status").textContent = e.message; }
  finally { button.disabled = false; button.innerHTML = "<span>✧</span> Generate with AI"; }
});
$("copy-output").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("assistant-output").textContent); $("copy-output").textContent = "Copied ✓"; setTimeout(()=>$("copy-output").textContent="Copy text",1600); }
  catch { $("assistant-status").textContent = "Copy is unavailable in this browser."; }
});

$("text-plan").addEventListener("click", async () => {
  const idea = $("text-idea").value.trim();
  if (!idea) { $("text-result").textContent = "Please describe your video first."; return; }
  $("text-result").textContent = "Building your scene plan…";
  try { $("text-result").textContent = await requestAssistant(idea,"scenes",60,"cinematic, high-detail, coherent visual continuity"); }
  catch(e) { $("text-result").textContent = e.message; }
});
$("choose-image").addEventListener("click", (e) => { e.stopPropagation(); $("image-file").click(); });
$("image-drop").addEventListener("click", (e) => { if (e.target.id !== "choose-image") $("image-file").click(); });
$("image-file").addEventListener("change", () => {
  const file = $("image-file").files[0]; if (!file) return;
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = URL.createObjectURL(file);
  $("image-preview").src = imageUrl; $("image-preview").style.display = "block"; $("image-empty").style.display = "none";
});
$("image-plan").addEventListener("click", async () => {
  const file = $("image-file").files[0];
  if (!file) { $("image-result").textContent = "Choose an image first."; return; }
  const idea = "Create an image-to-video animation prompt for this image: " + $("motion-prompt").value + ". Camera: " + $("camera-motion").value + ". Include subject continuity, natural movement, lighting, and a negative prompt.";
  $("image-result").textContent = "Preparing animation prompt…";
  try { $("image-result").textContent = await requestAssistant(idea,"scenes",5,"photorealistic image animation"); }
  catch(e) { $("image-result").textContent = e.message; }
});

const video = $("preview-video");
function fmt(s) { if (!Number.isFinite(s)) return "00:00"; const m=Math.floor(s/60), sec=Math.floor(s%60); return String(m).padStart(2,"0")+":"+String(sec).padStart(2,"0"); }
$("video-file").addEventListener("change", () => {
  const file = $("video-file").files[0]; if (!file) return;
  if (videoUrl) URL.revokeObjectURL(videoUrl);
  videoUrl = URL.createObjectURL(file); video.src = videoUrl; video.style.display = "block";
  $("preview-stage").querySelector(".empty-preview").style.display = "none";
  video.onloadedmetadata = () => {
    $("video-meta").textContent = file.name;
    $("trim-start").value = "0"; $("trim-end").value = video.duration.toFixed(1);
    $("time-display").textContent = fmt(0)+" / "+fmt(video.duration);
    $("timeline-label").textContent = file.name + " • " + fmt(video.duration);
    $("track-content").innerHTML = "";
    const clip = document.createElement("b"); clip.textContent = file.name + "  ·  " + fmt(video.duration); $("track-content").append(clip);
    $("export-video").disabled = false;
  };
  $("download-link").hidden = true;
});
video.addEventListener("timeupdate", () => $("time-display").textContent = fmt(video.currentTime)+" / "+fmt(video.duration));
$("play-video").addEventListener("click", () => { if (video.paused) video.play(); else video.pause(); });
$("aspect").addEventListener("change", () => {
  const value = $("aspect").value;
  $("preview-stage").style.aspectRatio = value === "9:16" ? "9/16" : value === "1:1" ? "1/1" : "16/9";
});
$("export-video").addEventListener("click", async () => {
  if (!video.src || !Number.isFinite(video.duration)) return;
  const start = Math.max(0, Number($("trim-start").value) || 0);
  const end = Math.min(video.duration, Number($("trim-end").value) || video.duration);
  if (end <= start) { $("export-status").textContent = "End time must be greater than start time."; return; }
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { $("export-status").textContent = "This browser does not support WebM export. Try a recent Chrome browser."; return; }
  const button = $("export-video"); button.disabled = true; button.textContent = "Exporting…";
  $("export-status").textContent = "Rendering in your browser. Please keep this tab open…";
  const canvas = document.createElement("canvas"); canvas.width=1280; canvas.height=720;
  const ctx = canvas.getContext("2d");
  const stream = canvas.captureStream(30);
  let sourceStream;
  try {
    if (video.captureStream) {
      sourceStream = video.captureStream();
      if (!$("mute-video").checked) sourceStream.getAudioTracks().forEach(t=>stream.addTrack(t));
    }
  } catch {}
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
  const recorder = new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5000000});
  const chunks=[];
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  const finished = new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=reject;});
  const draw = () => {
    const w=canvas.width,h=canvas.height, vw=video.videoWidth,vh=video.videoHeight;
    ctx.fillStyle="#05070d";ctx.fillRect(0,0,w,h);
    const scale=Math.min(w/vw,h/vh), dw=vw*scale,dh=vh*scale;
    ctx.drawImage(video,(w-dw)/2,(h-dh)/2,dw,dh);
  };
  try {
    video.pause(); video.currentTime=start;
    await new Promise(resolve=>video.addEventListener("seeked",resolve,{once:true}));
    recorder.start(250);
    const renderFrame = () => { if(video.currentTime>=end || video.ended){recorder.stop();return;} draw(); requestAnimationFrame(renderFrame); };
    draw(); video.play(); requestAnimationFrame(renderFrame);
    await finished; video.pause();
    const blob=new Blob(chunks,{type:"video/webm"});
    const url=URL.createObjectURL(blob);
    const link=$("download-link"); link.href=url; link.download="ai-studio-export.webm"; link.hidden=false;
    $("export-status").textContent="Export complete. Your WebM file is ready to download.";
  } catch(err) {
    console.error(err); $("export-status").textContent="Export failed. Try another video format or a shorter clip.";
  } finally {
    if(sourceStream) sourceStream.getTracks().forEach(t=>t.stop());
    stream.getTracks().forEach(t=>t.stop());
    button.disabled=false;button.textContent="Export trimmed WebM";
  }
});
