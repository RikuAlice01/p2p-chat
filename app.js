document.addEventListener("DOMContentLoaded", () => {
  const msgInput = document.getElementById("messageInput");
  const fileInput = document.getElementById("fileInput");
  const offerEl = document.getElementById("offer");
  const answerEl = document.getElementById("answer");
  const chatBox = document.getElementById("chatBox");

  let peerConnection;
  let dataChannel;
  const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

  let incomingFile = null;
  let receivedBuffers = [];
  let receivedSize = 0;

  function updateProgress(percent, id = "fileProgress") {
    const bar = document.getElementById(id);
    bar.style.display = "block";
    bar.value = percent;
    if (percent >= 100) {
      setTimeout(() => {
        bar.style.display = "none";
        bar.value = 0;
      }, 1000);
    }
  }

  function initPeer() {
    peerConnection = new RTCPeerConnection(config);

    peerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        const ip = extractIP(e.candidate);
        if (ip) document.getElementById("yourIP").textContent = ip;
      }
    };

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === "connected") {
        peerConnection.getStats().then(stats => {
          stats.forEach(report => {
            if (report.type === "candidate-pair" && report.state === "succeeded") {
              document.getElementById("peerIP").textContent = report.remoteAddress || "N/A";
            }
          });
        });
      }
    };

    peerConnection.ondatachannel = (e) => {
      setupDataChannel(e.channel);
    };
  }

  function setupDataChannel(dc) {
    dataChannel = dc;
    dataChannel.binaryType = "arraybuffer";
    dataChannel.onopen = () => console.log("DataChannel opened:", dataChannel.label);
    dataChannel.onmessage = handleIncomingMessage;
  }

  async function createOffer() {
    initPeer();
    setupDataChannel(peerConnection.createDataChannel("chat"));
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    offerEl.value = JSON.stringify(peerConnection.localDescription);
    showQRCode(offerEl.value);
  }

  async function createAnswer() {
    try {
      const offer = JSON.parse(offerEl.value);
      initPeer();
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      answerEl.value = JSON.stringify(peerConnection.localDescription);
      showQRCode(answerEl.value);
    } catch (err) {
      alert("Invalid Offer");
    }
  }

  answerEl.addEventListener("change", async () => {
    try {
      const ans = JSON.parse(answerEl.value);
      await peerConnection.setRemoteDescription(ans);
    } catch (err) {
      alert("Invalid Answer");
    }
  });

  function sendMessage() {
    const msg = msgInput.value.trim();
    if (!msg || !dataChannel || dataChannel.readyState !== "open") return;
    dataChannel.send(JSON.stringify({ type: "text", data: msg }));
    appendBubble(msg, "you");
    msgInput.value = "";
  }

  document.getElementById("sendBtn").onclick = sendMessage;
  document.getElementById("createOfferBtn").onclick = createOffer;
  document.getElementById("createAnswerBtn").onclick = createAnswer;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file || !dataChannel || dataChannel.readyState !== "open") return;
    sendFile(file);
  });

  function sendFile(file) {
    const reader = file.stream().getReader();
    dataChannel.send(JSON.stringify({ type: "file", name: file.name, size: file.size }));
    let offset = 0;

    function readChunk() {
      reader.read().then(({ done, value }) => {
        if (done) {
          updateProgress(100);
          return;
        }
        dataChannel.send(value);
        offset += value.byteLength;
        updateProgress(Math.round((offset / file.size) * 100));
        readChunk();
      });
    }

    readChunk();
    appendBubble(`📤 Sending file: ${file.name}`, "you");
  }

  function handleIncomingMessage(e) {
    if (typeof e.data === "string") {
      try {
        const obj = JSON.parse(e.data);
        if (obj.type === "text") {
          appendBubble(obj.data, "friend");
        } else if (obj.type === "file") {
          incomingFile = obj;
          receivedBuffers = [];
          receivedSize = 0;
        }
      } catch (err) {
        console.warn("Failed to parse message", e.data);
      }
    } else {
      // Binary file chunk
      if (!incomingFile) return;
      receivedBuffers.push(e.data);
      receivedSize += e.data.byteLength;
      updateProgress(Math.round((receivedSize / incomingFile.size) * 100), "recvProgress");

      if (receivedSize >= incomingFile.size) {
        const blob = new Blob(receivedBuffers);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = incomingFile.name;
        link.textContent = `📎 Download ${incomingFile.name}`;
        const bubble = document.createElement("div");
        bubble.className = "chat-bubble friend";
        bubble.appendChild(link);
        chatBox.appendChild(bubble);
        scrollChat();
        incomingFile = null;
        receivedBuffers = [];
        receivedSize = 0;
      }
    }
  }

  function appendBubble(text, sender) {
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble " + sender;
    bubble.textContent = text;
    chatBox.appendChild(bubble);
    scrollChat();
  }

  function scrollChat() {
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function showQRCode(text) {
    const el = document.getElementById("qrcode");
    el.innerHTML = "";
    new QRCode(el, { text, width: 200, height: 200 });
  }

  function extractIP(candidate) {
    const m = candidate.candidate.match(/([0-9a-fA-F:.]+)\s*$/);
    return m ? m[1] : null;
  }
});
