let attachment = null;
let fileContent = null;

//----------------- JS For UI Management -----------------//

const textArea = document.getElementById("userInput");
const chatArea = document.getElementById("chat");

function err(errormsg) {
  document.getElementById("userInput").placeholder = errormsg;
  document.getElementById("chatbox").classList.add("err");
  document.getElementById("userInput").focus();
}

function sanitize() {
  textArea.style = "height:45px; overflow-y:hidden";
  if (document.getElementById("attachmentContainer").style.display != "block")
    chatArea.style.height = "calc((var(--vh, 1vh) * 100) - 205px";
}

function disableForm() {
  document.getElementById("userInput").disabled = true;
  document.getElementById("send").disabled = true;
  document.getElementById("chatbox").classList.add("think");
}

function enableForm() {
  document.getElementById("userInput").disabled = false;
  document.getElementById("send").disabled = false;
  document.getElementById("chatbox").classList.remove("think");
}

function addLine() {
  // Optionally insert a newline in the textarea
  const start = textArea.selectionStart;
  const end = textArea.selectionEnd;
  textArea.style = "height:200px; overflow-y:visible";
  chatArea.style.height = "calc((var(--vh, 1vh) * 100) - 360px)";
  textArea.value =
    textArea.value.substring(0, start) + "\n" + textArea.value.substring(end);
  textArea.selectionStart = textArea.selectionEnd = start + 1; // Move cursor to the next line
}

textArea.addEventListener("input", function () {
  document.getElementById("chatbox").classList.remove("err");
  if (document.getElementById("attachmentContainer").style.display != "block") {
    if (textArea.value.split("\n").length === 1) {
      sanitize();
    }
    if (textArea.value.split("\n").length > 1) {
      textArea.style = "height:200px; overflow-y:visible";
      chatArea.style.height = "calc((var(--vh, 1vh) * 100) - 360px)";
    }
  }
});

// Prevent form submission on Enter and handle Shift+Enter separately
textArea.addEventListener("keydown", function (event) {
  // Handle Shift + Enter for new line
  if (event.key === "Enter" && event.shiftKey) {
    event.preventDefault();
    if (document.getElementById("attachmentContainer").style.display != "block")
      addLine();
  }

  // Handle Enter for sending the message
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage(); // Call the function to send the message
  }
});
//----------------- JS For UI Management -----------------//

function previewAttachment() {
  const fileInput = document.getElementById("fileInput");
  const preview = document.getElementById("attachmentPreview");
  const file = fileInput.files[0];

  if (file) {
    const fileType = file.type;
    const fileSize = file.size;
    const maxSize = 1 * 1024 * 1024 * 1024; // 1BG in bytes

    if (fileSize > maxSize) {
      console.log("File is too large. Please upload a file smaller than 1GB.");
      err("File is too large. Please upload a file smaller than 1GB.");
      return; // Stop further execution if the file is too large
    }

    const imageTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    const audioTypes = [
      "audio/wav",
      "audio/mp3",
      "audio/aiff",
      "audio/aac",
      "audio/ogg",
      "audio/flac",
    ];
    const videoTypes = [
      "video/mp4",
      "video/mpeg",
      "video/mov",
      "video/avi",
      "video/x-flv",
      "video/mpg",
      "video/webm",
      "video/wmv",
      "video/3gpp",
    ];

    // Validate file type for image, audio, or video
    if (fileType.startsWith("image/")) {
      if (!imageTypes.includes(fileType)) {
        err("Invalid image file type.");
        return;
      }
    } else if (fileType.startsWith("audio/")) {
      if (!audioTypes.includes(fileType)) {
        err("Invalid audio file type.");
        return;
      }
    } else if (fileType.startsWith("video/")) {
      if (!videoTypes.includes(fileType)) {
        err("Invalid video file type.");
        return;
      }
    }

    // Read the file only if it passes the image, audio, or video validation
    const reader = new FileReader();
    reader.onload = function (e) {
      if (file.type.startsWith("image/")) {
        fileContent = e.target.result;
        preview.src = e.target.result;
        preview.style.display = "block"; // Show the preview
        document.getElementById("attachmentContainer").style.display = "block";
        document.getElementById("chat").style.height =
          "calc((var(--vh, 1vh)* 100) - 295px)";
      } else {
        fileContent = null;
        document.getElementById("attachmentFile").innerHTML =
          "📄 Attached File: " + file.name;
        document.getElementById("attachmentFile").style.display = "block";
        document.getElementById("attachmentPreview").style.display = "none";
        document.getElementById("attachmentContainer").style.display = "block";
        document.getElementById("chat").style.height =
          "calc((var(--vh, 1vh)* 100) - 228px)";
      }
      attachment = file; // Store the file for later use
    };
    reader.readAsDataURL(file);
  } else {
    removeAttachment(); // If no file, clear attachment
  }
}

function removeAttachment() {
  // Clear the file input and preview
  document.getElementById("fileInput").value = "";
  document.getElementById("attachmentPreview").src = "";
  document.getElementById("chat").style.height =
    "calc((var(--vh, 1vh)* 100) - 205px)";
  document.getElementById("attachmentContainer").style.display = "none"; // Hide the preview
  document.getElementById("attachmentFile").style.display = "none";
  document.getElementById("attachmentPreview").style.display = "none";
  attachment = null;
  fileContent = null;
}

// Important note Gemini tracks the history itself no need to push messages in history on your own

//Import @google/generative-ai.
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import { GoogleAIFileManager } from "./AIServer.mjs";

// Import Marked
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

// Import  AI_ABCD
import { ABCD } from "../config/config.js";

let history = [
  {
    role: "user",
    parts: [{ text: "Hello" }],
  },
  {
    role: "model",
    parts: [{ text: "Great to meet you. What would you like to know?" }],
  },
];

async function getResponse(message) {
  // Fetch your AI_ABCD
  const AI_ABCD = ABCD;
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(AI_ABCD);
  const fileManager = new GoogleAIFileManager(AI_ABCD);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  var imagedata = null;
  let result = null;

  const chat = model.startChat({
    history: history,
  });

  if (attachment != null) {
    const uploadResult = await fileManager.uploadFile(attachment, {
      mimeType: attachment.type,
      displayName: attachment.name,
    });
    // View the response.
    console.log(
      `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`
    );
    imagedata = {
      fileData: {
        fileUri: uploadResult.file.uri,
        mimeType: uploadResult.file.mimeType,
      },
    };

    result = await chat.sendMessage([message, imagedata]);
  } else {
    result = await chat.sendMessage(message);
  }

  var aiMessage = result.response.text();
  // console.log(aiMessage);
  return aiMessage;
}

async function sendMessage() {
  sanitize();
  const input = document.getElementById("userInput");
  const message = input.value.trim();

  if (message === "") {
    err("Please type your message here...");
    return;
  }
  disableForm();
  document.getElementById("info").style.display = "none";

  input.value = ""; // Clear input after sending message
  input.focus();

  // Add user message with profile picture
  addChatBubble(
    message,
    "user-bubble",
    "user-container",
    "./assets/img/user.png"
  );

  document.getElementById("attachmentContainer").style.display = "none";
  //Write function to get ai resonse
  var aiMessage = await getResponse(message);
  //var aiMessage = "To give you the best suggestions, I need to know more";
  // Simulate AI response (replace with actual AI integration)

  addChatBubble(
    aiMessage,
    "ai-bubble",
    "ai-container",
    "./assets/img/artificial-intelligence.png"
  );
  enableForm();
  removeAttachment();
  // console.log(history);
  document.querySelectorAll("pre, code").forEach((block) => {
    hljs.highlightElement(block); // Highlight each new code block
  });
}

function addChatBubble(text, bubbleClass, containerClass, profilePic) {
  const chatContainer = document.getElementById("chat");
  const bubbleContainer = document.createElement("div");
  bubbleContainer.classList.add("chat-bubble-container", containerClass);

  // Profile Picture
  const img = document.createElement("img");
  img.src = profilePic;
  img.alt = "Profile";

  // Chat Bubble
  const bubble = document.createElement("div");
  bubble.classList.add("chat-bubble", bubbleClass);

  // Append image and bubble to the container
  if (containerClass === "user-container") {
    bubble.textContent = text;
    if (attachment != null) {
      if (attachment.type.startsWith("image/")) {
        const uploading = document.createElement("img");
        uploading.src = fileContent;
        uploading.classList.add("attach-pic");
        bubble.appendChild(uploading);
      } else {
        const uploading = document.createElement("p");
        uploading.innerHTML = "📄 Attached File: " + attachment.name;
        uploading.classList.add("attach-file");
        bubble.appendChild(uploading);
      }
    }
    img.classList.add("profile-pic");
    bubbleContainer.appendChild(bubble);
    bubbleContainer.appendChild(img); // User picture on the right
  } else {
    bubble.innerHTML = marked.parse(text);
    img.classList.add("ai-profile-pic");
    bubbleContainer.appendChild(img); // AI picture on the left
    bubbleContainer.appendChild(bubble);
  }

  chatContainer.appendChild(bubbleContainer);

  // Scroll to bottom of chat
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

document.getElementById("removeAttachment").onclick = function () {
  removeAttachment();
};

document.getElementById("pin").onclick = function () {
  document.getElementById("chatbox").classList.remove("err");
  document.getElementById("userInput").placeholder =
    "Type your message here...";
  removeAttachment();
  document.getElementById("fileInput").click();
};

document.getElementById("fileInput").onchange = function () {
  previewAttachment();
};

document.getElementById("send").onclick = function () {
  sendMessage();
};
