const $ = (id) => document.getElementById(id);
const views = ["studio", "assistant", "editor", "text", "image", "free", "earn", "projects"];
const titles = {studio:"Studio overview",assistant:"AI Script Assistant",editor:"Video Editor",text:"Text to Video planner",image:"Image to Video planner",free:"Free Video Tools",earn:"Earn with AI-Studio",projects:"My Projects"};
let videoUrl = null;
let imageUrl = null;

function showGeneratedVideo(containerId, url) {
  const container = $(containerId); container.replaceChildren();
  const video = document.createElement("video"); video.src=url; video.controls=true; video.playsInline=true; video.preload="metadata";
  const link = document.createElement("a"); link.href=url; link.target="_blank"; link.rel="noopener noreferrer"; link.textContent="Open / download generated MP4";
  container.append(video,link);
}
async function generateVideoRequest(payload) {
  const response=await fetch("/api/generate-video",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await response.json(); if(!response.ok) throw new Error(data.error||"Video generation failed."); return data;
}
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
    $("connection-detail").textContent = (data.assistantConfigured ? "OpenAI connected" : "OpenAI key needed") + (data.videoGenerationConfigured ? " · Video API connected" : " · Video API key needed");
    $("provider-notice").innerHTML = data.videoGenerationConfigured ? "<span>✓</span><p><b>Video provider connected:</b> fal.ai is configured. AI video generation is available; each successful generation uses paid provider credits.</p>" : "<span>ⓘ</span><p><b>Generation provider:</b> Add FAL_KEY in Render Environment to enable real AI video rendering. Generation is paid per successful output.</p>";
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
  $("image-result").textContent = "Analyzing your image and preparing a tailored animation prompt…";
  const button = $("image-plan"); button.disabled = true;
  try {
    const imageData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read this image."));
      reader.readAsDataURL(file);
    });
    const response = await fetch("/api/image-prompt", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData, motion: $("motion-prompt").value, camera: $("camera-motion").value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Image analysis failed.");
    $("image-result").textContent = data.result;
  } catch(e) { $("image-result").textContent = e.message; }
  finally { button.disabled = false; }
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


$("text-generate").addEventListener("click", async () => {
  const prompt=$("text-idea").value.trim(); if(!prompt){$("text-result").textContent="Describe your video first.";return;}
  const button=$("text-generate"); button.disabled=true; button.textContent="Generating — please wait…";
  $("text-result").textContent="Sending request to the video model. This may take a few minutes…"; $("text-video-output").replaceChildren();
  const duration=Number($("text-duration").value), ratio=$("text-ratio").value;
  if(!confirm("Paid AI video generation\n\nModel: MiniMax H3 Max Turbo\nLength: "+duration+" seconds\nFormat: "+ratio+"\n\nfal.ai may charge your account for a successful output. Check current pricing and credits before continuing. Send generation request?")) return;
  try { const data=await generateVideoRequest({prompt,duration,aspectRatio:ratio}); showGeneratedVideo("text-video-output",data.videoUrl); $("text-result").textContent="Your AI video is ready."; }
  catch(e){$("text-result").textContent=e.message;}
  finally{button.disabled=false;button.textContent="Generate real AI video · paid";}
});
$("image-generate").addEventListener("click", async () => {
  const file=$("image-file").files[0]; if(!file){$("image-result").textContent="Choose an image first.";return;}
  if(!/^image\/(png|jpeg|webp)$/.test(file.type)){$("image-result").textContent="Choose a PNG, JPG or WEBP image.";return;}
  const button=$("image-generate"); button.disabled=true; button.textContent="Generating — please wait…"; $("image-video-output").replaceChildren();
  $("image-result").textContent="Sending your image and motion prompt to the video model…";
  if(!confirm("Paid image-to-video generation\n\nLength: 5 seconds\nFormat: 16:9\n\nfal.ai may charge your account for a successful output. Check current pricing and credits before continuing. Send generation request?")) { button.disabled=false; button.textContent="Generate real AI video · paid"; return; }
  try {
    const image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error("Could not read image."));reader.readAsDataURL(file);});
    const prompt=$("motion-prompt").value.trim()||"Animate the visible scene naturally with cinematic camera movement.";
    const data=await generateVideoRequest({prompt,image,duration:5,aspectRatio:"16:9"}); showGeneratedVideo("image-video-output",data.videoUrl); $("image-result").textContent="Your image-to-video clip is ready.";
  } catch(e){$("image-result").textContent=e.message;}
  finally{button.disabled=false;button.textContent="Generate real AI video · paid";}
});

$("free-prompt-build").addEventListener("click",()=>{
 const idea=$("free-prompt-idea").value.trim();
 if(!idea){$("free-prompt-result").textContent="Enter a video idea first.";return;}
 const format=$("free-prompt-format").value;
 $("free-prompt-result").textContent="Create a "+format+". Concept: "+idea+". Generate a coherent cinematic sequence with a clear subject, realistic movement, natural lighting, detailed environment, stable camera motion, consistent subject appearance and clean composition. Avoid flicker, morphing, extra limbs, distorted objects, text artifacts, abrupt cuts and unnatural motion. Keep the first and last frames visually clean.";
});
$("free-prompt-copy").addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText($("free-prompt-result").textContent);$("free-prompt-copy").textContent="Copied ✓";}catch{$("free-prompt-copy").textContent="Select and copy the prompt";}
});


// Local-first project library: data stays in this browser and is never uploaded.
const PROJECTS_KEY = "ai-studio-local-projects-v1";
function readProjects() {
  try { const value = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function renderProjects() {
  const list = $("project-list"); const projects = readProjects();
  $("project-count").textContent = projects.length + (projects.length === 1 ? " project" : " projects");
  list.replaceChildren();
  if (!projects.length) { const empty=document.createElement("div"); empty.className="panel muted"; empty.textContent="No saved projects yet. Save your first idea above."; list.append(empty); return; }
  projects.forEach((project) => {
    const card=document.createElement("article"); card.className="panel project-card";
    const info=document.createElement("div");
    const title=document.createElement("h4"); title.textContent=project.name;
    const date=document.createElement("small"); date.textContent=new Date(project.updatedAt).toLocaleString();
    const summary=document.createElement("p"); summary.textContent=(project.idea || project.textIdea || "Saved creative notes").slice(0,220);
    info.append(title,date,summary);
    const actions=document.createElement("div"); actions.className="project-actions";
    const load=document.createElement("button"); load.className="ghost"; load.textContent="Load into workspace";
    load.addEventListener("click",()=>{ $("idea").value=project.idea||""; $("assistant-output").textContent=project.output||"No assistant output saved."; $("assistant-output").classList.toggle("empty",!project.output); $("text-idea").value=project.textIdea||""; $("text-result").textContent=project.textResult||"Your scene plan will appear here."; $("free-prompt-idea").value=project.freeIdea||""; $("free-prompt-result").textContent=project.freePrompt||"Your ready-to-copy prompt will appear here."; $("project-status").textContent="Loaded: "+project.name; showView("assistant"); });
    const remove=document.createElement("button"); remove.className="ghost"; remove.textContent="Delete";
    remove.addEventListener("click",()=>{ if(!confirm("Delete this saved project from this device?")) return; localStorage.setItem(PROJECTS_KEY,JSON.stringify(readProjects().filter(p=>p.id!==project.id))); renderProjects(); $("project-status").textContent="Project deleted from this device."; });
    actions.append(load,remove); card.append(info,actions); list.append(card);
  });
}
$("save-project").addEventListener("click",()=>{
  const idea=$("idea").value.trim(), output=$("assistant-output").classList.contains("empty")?"":$("assistant-output").textContent;
  const textIdea=$("text-idea").value.trim(), textResult=$("text-result").textContent;
  const freeIdea=$("free-prompt-idea").value.trim(), freePrompt=$("free-prompt-result").textContent;
  if(!idea&&!output&&!textIdea&&!freeIdea){ $("project-status").textContent="Add an idea or prompt before saving."; return; }
  const name=$("project-name").value.trim() || (idea||textIdea||freeIdea).slice(0,60) || "Untitled project";
  const projects=readProjects(); projects.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),name,idea,output,textIdea,textResult,freeIdea,freePrompt,updatedAt:new Date().toISOString()});
  try { localStorage.setItem(PROJECTS_KEY,JSON.stringify(projects.slice(0,100))); $("project-name").value=""; $("project-status").textContent="Saved on this device. No cloud upload or API charge."; renderProjects(); }
  catch { $("project-status").textContent="Browser storage is full. Export or delete old projects, then try again."; }
});
$("export-projects").addEventListener("click",()=>{
  const projects=readProjects(); if(!projects.length){$("project-status").textContent="There are no projects to export yet.";return;}
  const blob=new Blob([JSON.stringify({app:"AI-Studio",exportedAt:new Date().toISOString(),projects},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="ai-studio-projects.json"; a.click(); URL.revokeObjectURL(url); $("project-status").textContent="Project backup exported. Keep the JSON file somewhere safe.";
});
renderProjects();


// Progressive Web App install support.
let deferredInstallPrompt = null;
const installButton = document.getElementById("install-app");
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault(); deferredInstallPrompt = event;
  if (installButton) installButton.hidden = false;
});
if (installButton) installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) { $("project-status") && ($("project-status").textContent = "On Android Chrome, open the browser menu and choose Install app or Add to Home screen."); return; }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null; installButton.hidden = true;
});
window.addEventListener("appinstalled", () => { if (installButton) installButton.hidden = true; });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
