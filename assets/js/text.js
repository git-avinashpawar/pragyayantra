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
  if (textArea.value.split("\n").length === 1) {
    sanitize();
  }
  if (textArea.value.split("\n").length > 1) {
    textArea.style = "height:200px; overflow-y:visible";
    chatArea.style.height = "calc((var(--vh, 1vh) * 100) - 360px)";
  }
});

// Prevent form submission on Enter and handle Shift+Enter separately
textArea.addEventListener("keydown", function (event) {
  // Handle Shift + Enter for new line
  if (event.key === "Enter" && event.shiftKey) {
    event.preventDefault();
    addLine();
  }

  // Handle Enter for sending the message
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage(); // Call the function to send the message
  }
});
//----------------- JS For UI Management -----------------//

// Important note Gemini tracks the history itself no need to push messages in history on your own

//Import @google/generative-ai.
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

  const chat = model.startChat({
    history: history,
  });
  let result = await chat.sendMessage(message);
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
  // Add user message with profile picture
  addChatBubble(
    message,
    "user-bubble",
    "user-container",
    "./assets/img/user.png"
  );

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
  input.value = ""; // Clear input after sending message
  input.focus();
  // console.log(history);
  document.querySelectorAll("pre code").forEach((block) => {
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
  bubble.innerHTML = marked.parse(text);
  // Append image and bubble to the container
  if (containerClass === "user-container") {
    img.classList.add("profile-pic");
    bubbleContainer.appendChild(bubble);
    bubbleContainer.appendChild(img); // User picture on the right
  } else {
    img.classList.add("ai-profile-pic");
    bubbleContainer.appendChild(img); // AI picture on the left
    bubbleContainer.appendChild(bubble);
  }

  chatContainer.appendChild(bubbleContainer);

  // Scroll to bottom of chat
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

document.getElementById("send").onclick = function () {
  sendMessage();
};

