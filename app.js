document.addEventListener("DOMContentLoaded", () => {
  const msgInput = document.getElementById("messageInput");
  const fileInput = document.getElementById("fileInput");
  const offerEl = document.getElementById("offer");
  const answerEl = document.getElementById("answer");
  const chatBox = document.getElementById("chatBox");
  const savedOffersSelect = document.getElementById("savedOffersSelect");
  const CHAT_STORAGE_KEY = "p2pChatHistory";
  const SAVED_OFFERS_KEY = "savedOffers";

  let peerConnection;
  let dataChannel;
  const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

  let incomingFile = null;
  let receivedBuffers = [];
  let receivedSize = 0;

  // Load saved chat history
  function loadChatHistory() {
    const history = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "[]");
    history.forEach(entry => {
      appendBubble(entry.message, entry.sender);
    });
  }

  // Save chat message
  function saveMessageToHistory(sender, message) {
    const history = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "[]");
    history.push({ sender, message, time: new Date().toISOString() });
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history));
  }

  // Progress bar update
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

  // Save Offer to localStorage
  function saveOffer(offer) {
    let saved = JSON.parse(localStorage.getItem(SAVED_OFFERS_KEY) || "[]");
    // ไม่บันทึกซ้ำ
    if (!saved.find(o => o.offer === offer)) {
      saved.push({ id: Date.now(), offer });
      localStorage.setItem(SAVED_OFFERS_KEY, JSON.stringify(saved));
      populateSavedOffers();
    }
  }

  // Load saved Offers
  function loadOffers() {
    return JSON.parse(localStorage.getItem(SAVED_OFFERS_KEY) || "[]");
  }

  // เติม select รายการ offer ที่เคยสร้าง
  function populateSavedOffers() {
    savedOffersSelect.innerHTML = '<option value="">-- เลือก Offer ที่เคยสร้าง --</option>';
    const offers = loadOffers();
    offers.forEach(({ id, offer }) => {
      const opt = document.createElement("option");
      opt.value = offer;
      opt.textContent = `Offer เมื่อ ${new Date(id).toLocaleString()}`;
      savedOffersSelect.appendChild(opt);
    });
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
    dataChannel.onopen = () => console.log("DataChannel opened");
    dataChannel.onmessage = handleIncomingMessage;
  }

  async function createOffer() {
    initPeer();
    setupDataChannel(peerConnection.createDataChannel("chat"));
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    offerEl.value = JSON.stringify(peerConnection.localDescription);
    showQRCode(offerEl.value);
    saveOffer(offerEl.value);
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
      showToast("Invalid Offer");
    }
  }

  answerEl.addEventListener("change", async () => {
    try {
      const ans = JSON.parse(answerEl.value);
      await peerConnection.setRemoteDescription(ans);
    } catch (err) {
      showToast("Invalid Answer");
    }
  });

  function sendMessage() {
    const msg = msgInput.value.trim();
    if (!msg || !dataChannel || dataChannel.readyState !== "open") return;
    dataChannel.send(JSON.stringify({ type: "text", data: msg }));
    appendBubble(msg, "you");
    saveMessageToHistory("you", msg);
    msgInput.value = "";
  }

  document.getElementById("sendBtn").onclick = sendMessage;
  document.getElementById("createOfferBtn").onclick = createOffer;
  document.getElementById("createAnswerBtn").onclick = createAnswer;

  // ใช้ Offer ที่เคยบันทึก
  document.getElementById("useOfferBtn").onclick = () => {
    const val = savedOffersSelect.value;
    if (!val) return showToast("กรุณาเลือก Offer");
    offerEl.value = val;
    showToast("โหลด Offer สำเร็จ");
  };

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
    saveMessageToHistory("you", `📤 Sending file: ${file.name}`);
  }

  function handleIncomingMessage(e) {
    if (typeof e.data === "string") {
      try {
        const obj = JSON.parse(e.data);
        if (obj.type === "text") {
          appendBubble(obj.data, "friend");
          saveMessageToHistory("friend", obj.data);
        } else if (obj.type === "file") {
          incomingFile = obj;
          receivedBuffers = [];
          receivedSize = 0;
        }
      } catch (err) {
        console.warn("Failed to parse message", e.data);
      }
    } else {
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
        saveMessageToHistory("friend", `📎 File: ${incomingFile.name}`);
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

  // Toast function
  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.opacity = "1";
    toast.style.pointerEvents = "auto";
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.pointerEvents = "none";
    }, 2500);
  }

  // Clear chat history button
  document.getElementById("clearHistoryBtn").onclick = () => {
    if (confirm("คุณต้องการล้างประวัติแชตหรือไม่?")) {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      chatBox.innerHTML = "";
    }
  };

  // Load chat history and saved offers on startup
  loadChatHistory();
  populateSavedOffers();
});
