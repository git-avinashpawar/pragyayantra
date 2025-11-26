let attachments = [];
let fileContents = [];
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
  const files = fileInput.files; // Get all selected files

  // Enforce maximum of 5 files
  if (files.length > 5) {
    console.log("You can only upload a maximum of 5 files.");
    err("Please upload max 5 files.");
    return;
  }

  if (files.length > 0) {
    // Clear previous data
    attachments = [];
    fileContents = [];
    let fileNames = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type;
      const fileSize = file.size;
      const maxSize = 1 * 1024 * 1024 * 1024; // 1GB in bytes

      // File size validation
      if (fileSize > maxSize) {
        console.log(
          "File is too large. Please upload a file smaller than 1GB."
        );
        err("Please upload max 1GB Files.");
        return;
      }

      const fileName = file.name.toLowerCase();

      // File type validation (only .txt and .pdf)
      if (
        !fileName.endsWith(".txt") &&
        !fileName.endsWith(".pdf") &&
        !fileName.endsWith(".html") &&
        !fileName.endsWith(".csv")
      ) {
        console.log(
          "Invalid file type. Only .txt, .pdf, .html, and .csv files are allowed."
        );
        err("Only txt, pdf, html, and csv files are allowed.");
        return;
      }

      // Push file name to the fileNames array for display
      fileNames.push(file.name);

      // Read the file content asynchronously
      const reader = new FileReader();
      reader.onload = function (e) {
        fileContents.push(null); // Non-image files don’t need preview content
        document.getElementById("attachmentFile").style.display = "block";
        document.getElementById("attachmentPreview").style.display = "none";
        document.getElementById("attachmentContainer").style.display = "block";
        document.getElementById("chat").style.height =
          "calc((var(--vh, 1vh)* 100) - 228px)";

        attachments.push(file); // Store the file in the attachments array
      };
      reader.readAsDataURL(file); // Read each file
    }

    // Display all file names, separated by commas
    document.getElementById("attachmentFile").innerHTML =
      "📎 Attached Files: " + fileNames.join(", ");
  } else {
    removeAttachment(); // Clear attachment if no files are selected
  }
}

function removeAttachment() {
  // Clear the file input and preview
  document.getElementById("fileInput").value = "";
  document.getElementById("attachmentFile").innerHTML = "📎 Attached Files:";
  document.getElementById("attachmentPreview").src = "";
  document.getElementById("chat").style.height =
    "calc((var(--vh, 1vh)* 100) - 205px)";
  document.getElementById("attachmentContainer").style.display = "none"; // Hide the preview
  document.getElementById("attachmentFile").style.display = "none";
  document.getElementById("attachmentPreview").style.display = "none";
  attachments = [];
  fileContents = [];
}

// Important note Gemini tracks the history itself no need to push messages in history on your own

//Import @google/generative-ai.
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "https://esm.run/@google/generative-ai";
import { GoogleAIFileManager } from "./AIServer.mjs";

// Import Marked
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

// Import  AI_ABCD
import { ABCD } from "../config/config.js";

let history = [
  {
    role: "user",
    parts: [
      {
        text: 'You are playing the role of a Document Analyzer; you will process text-based documents. I will now provide you with text-based or PDF documents. If a PDF is uploaded, please extract the text and work with it. At the beginning of your answer, please state on which documents you are working in the format: "**Working on: [file names].**". Also When discussing content from any file, please mention the filename in format: **filename** without file extension and then content to new line. Answer the questions as precisely as possible using the provided documents. If the answer is not in the document, say, "Answer not available in document."',
      },
    ],
  },
];

async function getResponse(message) {
  // Fetch your AI_ABCD
  const AI_ABCD = ABCD;
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(AI_ABCD);
  const fileManager = new GoogleAIFileManager(AI_ABCD);

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings,
  });

  var imageParts = [];
  let result = null;

  const chat = model.startChat({
    history: history,
  });

  if (attachments.length > 0) {
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      const uploadResult = await fileManager.uploadFile(attachment, {
        mimeType: attachment.type,
        displayName: attachment.name,
      });
      console.log(
        `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`
      );
      imageParts.push({
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      });
    }
  }

  if (attachments.length > 0) {
    result = await chat.sendMessage([message, ...imageParts]); // Imp for Multifiles
    console.log(imageParts);
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
  // var aiMessage = "To give you the best suggestions, I need to know more";
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
    if (attachments.length > 0) {
      for (const attachment of attachments) {
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
