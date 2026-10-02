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

  // =========================================================================
  // 3. Whitelist Formulier & Realtime Skin Preview
  // =========================================================================
  const whitelistForm = document.getElementById("mc-whitelist-form");
  const ignInput = document.getElementById("mc-ign");
  const avatarImg = document.getElementById("mc-avatar-preview");
  const avatarUsername = document.getElementById("mc-avatar-username");
  const avatarStatus = document.getElementById("mc-avatar-status");
  const formStatus = document.getElementById("mc-form-status");
  const submitBtn = document.getElementById("mc-submit-btn");
  const submitText = document.getElementById("mc-submit-text");
  const submitSpinner = document.getElementById("mc-submit-spinner");
  const accessKeyInput = document.getElementById("mc-access-key");

  let ignDebounceTimer = null;
  const defaultAvatar = "https://mc-heads.net/avatar/MHF_Steve/80";

  function updateAvatarPreview() {
    if (!ignInput || !avatarImg) return;
    const ign = ignInput.value.trim();
    const isValidIgn = /^[a-zA-Z0-9_]{3,16}$/.test(ign);

    if (ign && isValidIgn) {
      avatarImg.src = `https://mc-heads.net/avatar/${encodeURIComponent(ign)}/80`;
      if (avatarUsername) avatarUsername.textContent = ign;
      if (avatarStatus) {
        avatarStatus.textContent = "Geldige Minecraft Java naam";
        avatarStatus.style.color = "var(--mc-grass)";
      }
    } else if (ign && !isValidIgn) {
      if (avatarUsername) avatarUsername.textContent = ign;
      if (avatarStatus) {
        avatarStatus.textContent = "3 tot 16 tekens (a-z, 0-9, _)";
        avatarStatus.style.color = "var(--mc-redstone)";
      }
    } else {
      avatarImg.src = defaultAvatar;
      if (avatarUsername) avatarUsername.textContent = "Minecraft Bouwer";
      if (avatarStatus) {
        avatarStatus.textContent = "Typ je gebruikersnaam";
        avatarStatus.style.color = "var(--color-text-muted)";
      }
    }
  }

  if (avatarImg) {
    avatarImg.addEventListener("error", () => {
      avatarImg.src = defaultAvatar;
    });
  }

  if (ignInput) {
    ignInput.addEventListener("input", () => {
      clearTimeout(ignDebounceTimer);
      ignDebounceTimer = setTimeout(updateAvatarPreview, 300);
    });
  }

  function setFormStatus(type, htmlContent) {
    if (!formStatus) return;
    formStatus.className = `mc-form-status mc-form-status--${type}`;
    formStatus.innerHTML = htmlContent;
    formStatus.style.display = "block";
  }

  function clearFormStatus() {
    if (!formStatus) return;
    formStatus.style.display = "none";
    formStatus.innerHTML = "";
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  if (whitelistForm) {
    whitelistForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFormStatus();

      const ign = ignInput ? ignInput.value.trim() : "";
      const isValidIgn = /^[a-zA-Z0-9_]{3,16}$/.test(ign);

      if (!isValidIgn) {
        setFormStatus("error", "Vul een geldige Minecraft Java gebruikersnaam in (3 tot 16 tekens, alleen letters, cijfers of underscores).");
        if (ignInput) ignInput.focus();
        return;
      }

      const accessKey = accessKeyInput ? accessKeyInput.value.trim() : "";
      if (!accessKey || accessKey === "JOUW_ACCESS_KEY_HIER") {
        setFormStatus(
          "warning",
          "<strong>Configuratie vereist:</strong> Er is nog geen Web3Forms Access Key ingesteld in het formulier. Vul je gratis Access Key in op regel 253 van index.html om aanvragen per mail te ontvangen. Vraag gratis je sleutel aan via web3forms.com."
        );
        return;
      }

      // Check honeypot
      const botField = whitelistForm.querySelector("input[name='botcheck']");
      if (botField && botField.checked) {
        setFormStatus("success", "Aanvraag ontvangen!");
        whitelistForm.reset();
        updateAvatarPreview();
        return;
      }

      // Start verzenden
      if (submitBtn) submitBtn.disabled = true;
      if (submitText) submitText.textContent = "Bezig met verzenden...";
      if (submitSpinner) submitSpinner.style.display = "inline-block";

      try {
        const formData = new FormData(whitelistForm);
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const safeIgn = escapeHtml(ign);
          setFormStatus(
            "success",
            `🎉 <strong>Aanvraag verzonden!</strong> Je whitelist aanvraag voor <strong>${safeIgn}</strong> is naar ons doorgestuurd. We voegen je snel toe aan de server!`
          );
          whitelistForm.reset();
          updateAvatarPreview();
        } else {
          setFormStatus(
            "error",
            data.message || "Er is een fout opgetreden bij het verzenden van je aanvraag. Probeer het later opnieuw."
          );
        }
      } catch (err) {
        console.error("Whitelist verzendfout:", err);
        setFormStatus(
          "error",
          "Kon geen verbinding maken met de verzendservice. Controleer je internetverbinding of neem contact met ons op."
        );
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitText) submitText.textContent = "✉️ Whitelist Aanvragen";
        if (submitSpinner) submitSpinner.style.display = "none";
      }
    });
  }
});
