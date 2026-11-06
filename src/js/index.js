const form = document.querySelector("#qr-form");
const input = document.querySelector("#qr-input");
const image = document.querySelector("#qr-image");
const stage = document.querySelector("#qr-stage");
const placeholder = document.querySelector("#placeholder");
const generateButton = document.querySelector(".generate-btn");
const statusMessage = document.querySelector("#status-message");
const outputStatus = document.querySelector("#output-status");
const downloadButton = document.querySelector("#download-btn");
const charCount = document.querySelector("#char-count");

const QR_API = "https://api.qrserver.com/v1/create-qr-code/";
const MAX_LENGTH = 500;
let currentObjectUrl = null;
let requestToken = 0;

input.addEventListener("input", () => {
  charCount.textContent = `${input.value.length} / ${MAX_LENGTH}`;
  if (input.value.length > MAX_LENGTH) {
    charCount.classList.add("over-limit");
  } else {
    charCount.classList.remove("over-limit");
  }
});

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function resetOutput() {
  image.hidden = true;
  image.removeAttribute("src");
  placeholder.hidden = false;
  outputStatus.textContent = "NO SIGNAL";
  outputStatus.classList.remove("ready");
  downloadButton.disabled = true;
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

async function generateQrCode() {
  const value = input.value.trim();

  if (!value) {
    setStatus("ERRO: INSIRA UMA URL OU TEXTO.", true);
    input.focus();
    return;
  }
  if (value.length > MAX_LENGTH) {
    setStatus("ERRO: LIMITE DE 500 CARACTERES.", true);
    input.focus();
    return;
  }

  const token = ++requestToken;
  generateButton.disabled = true;
  generateButton.querySelector("span").textContent = "TRANSMITTING...";
  outputStatus.textContent = "PROCESSING";
  outputStatus.classList.remove("ready");
  setStatus("GERANDO MATRIZ VISUAL...");
  downloadButton.disabled = true;

  try {
    const params = new URLSearchParams({ size: "300x300", data: value, ecc: "M", margin: "12" });
    const response = await fetch(`${QR_API}?${params.toString()}`);
    if (!response.ok) throw new Error("A API não conseguiu gerar o código.");
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) throw new Error("A resposta recebida não é uma imagem válida.");

    const objectUrl = URL.createObjectURL(blob);
    const loaded = await new Promise((resolve, reject) => {
      const testImage = new Image();
      testImage.onload = () => resolve(true);
      testImage.onerror = () => reject(new Error("Não foi possível carregar o QR Code."));
      testImage.src = objectUrl;
    });

    if (token !== requestToken) {
      URL.revokeObjectURL(objectUrl);
      return;
    }

    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = objectUrl;
    image.src = currentObjectUrl;
    image.hidden = false;
    placeholder.hidden = true;
    outputStatus.textContent = "SIGNAL READY";
    outputStatus.classList.add("ready");
    downloadButton.disabled = false;
    setStatus("SINAL GERADO COM SUCESSO.");
  } catch (error) {
    if (token === requestToken) {
      setStatus("FALHA NA TRANSMISSÃO. VERIFIQUE A CONEXÃO E TENTE NOVAMENTE.", true);
      outputStatus.textContent = "SIGNAL ERROR";
      outputStatus.classList.remove("ready");
    }
  } finally {
    if (token === requestToken) {
      generateButton.disabled = false;
      generateButton.querySelector("span").textContent = "GENERATE SIGNAL";
    }
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  generateQrCode();
});

downloadButton.addEventListener("click", () => {
  if (!currentObjectUrl) return;
  const link = document.createElement("a");
  link.href = currentObjectUrl;
  link.download = "signal-lab-qr.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
});

window.addEventListener("beforeunload", () => {
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
});

resetOutput();
