/**
 * De Blockertjes - Minecraft Community Scripts
 * - Real-time server status check via mcstatus.io
 * - Eén-klik IP-adres klembord kopieerfunctie met visuele toast
 */

document.addEventListener("DOMContentLoaded", () => {
  const serverAddress = "minecraft.deblockertjes.be";
  const copyBtn = document.getElementById("copy-ip-btn");
  const ipDisplay = document.getElementById("mc-ip-text");
  const toast = document.getElementById("mc-toast");
  const statusBadge = document.getElementById("mc-status-badge");
  const statusDot = document.getElementById("mc-status-dot");
  const statusText = document.getElementById("mc-status-text");

  // =========================================================================
  // 1. IP Kopieerfunctie met visuele feedback
  // =========================================================================
  let toastTimeout = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-active");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("is-active");
    }, 2800);
  }

  async function copyServerIp() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(serverAddress);
      } else {
        // Fallback voor browsers zonder Clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = serverAddress;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      showToast("✔ IP gekopieerd: " + serverAddress);
      
      // Korte knopanimatie
      if (copyBtn) {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = "<span>✔ Gekopieerd!</span>";
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error("Kopiëren mislukt", err);
      showToast("❌ Kopiëren mislukt. Typ handmatig: " + serverAddress);
    }
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", copyServerIp);
  }

  if (ipDisplay) {
    ipDisplay.addEventListener("click", copyServerIp);
    ipDisplay.style.cursor = "pointer";
    ipDisplay.title = "Klik om het adres te kopiëren";
  }

  // =========================================================================
  // 2. Realtime Server Status Ping
  // =========================================================================
  async function checkServerStatus() {
    if (!statusBadge || !statusText) return;

    try {
      const response = await fetch(`https://api.mcstatus.io/v2/status/java/${serverAddress}`);
      if (!response.ok) throw new Error("API antwoordt niet");

      const data = await response.json();

      if (data.online) {
        const onlinePlayers = data.players?.online ?? 0;
        const maxPlayers = data.players?.max ?? 20;
        
        statusBadge.classList.remove("mc-status-badge--offline");
        statusText.textContent = `Online · ${onlinePlayers}/${maxPlayers} spelers`;
      } else {
        statusBadge.classList.add("mc-status-badge--offline");
        statusText.textContent = "Server offline";
      }
    } catch (error) {
      console.log("Kon Minecraft status niet ophalen:", error);
      // Standaard vriendelijke status tonen bij timeout/netwerkblokkade
      statusText.textContent = "Server bereikbaar";
    }
  }

  // Voer direct uit en herhaal elke 60 seconden
  checkServerStatus();
  setInterval(checkServerStatus, 60000);
});
