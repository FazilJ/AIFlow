(function () {
  "use strict";

  // ==========================================
  // 1. SCRIPT CONFIG
  // ==========================================

  const script = document.currentScript;

  if (!script) {
    console.error("AIFlow: Widget script not found");
    return;
  }

  const widgetId = script.getAttribute("data-widget-id");

  if (!widgetId) {
    console.error(
      "AIFlow: data-widget-id is required"
    );
    return;
  }

  const API_URL = new URL(script.src).origin;

  // ==========================================
  // 2. STATE
  // ==========================================

  let widgetConfig = null;
  let customerId = null;
  let conversationId = null;
  let customerName = "";
  let customerEmail = "";
  let identifying = true;
  let sending = false;
  let handoffRequested = false;

  // ==========================================
  // 3. GLOBAL STYLE
  // ==========================================

  const style = document.createElement("style");

  style.textContent = `
    .aiflow-fab {
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      background: #2563eb;
      color: #ffffff;
      font-size: 26px;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0,0,0,.20);
      z-index: 999999;
      transition: transform .2s ease;
    }

    .aiflow-fab:hover {
      transform: scale(1.05);
    }

    .aiflow-window {
      position: fixed;
      right: 20px;
      bottom: 90px;
      width: 360px;
      height: 520px;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,.25);
      display: none;
      flex-direction: column;
      z-index: 999999;
      font-family: Arial, sans-serif;
      animation: aiflowOpen .2s ease-out;
    }

    .aiflow-header {
      background: #2563eb;
      color: #ffffff;
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .aiflow-header-title {
      font-size: 16px;
      font-weight: 600;
    }

    .aiflow-header-subtitle {
      font-size: 11px;
      opacity: .85;
      margin-top: 3px;
    }

    .aiflow-close {
      background: transparent;
      border: none;
      color: #ffffff;
      font-size: 22px;
      cursor: pointer;
    }

    .aiflow-identify {
      flex: 1;
      padding: 24px 20px;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .aiflow-identify h3 {
      margin: 0 0 8px;
      font-size: 20px;
      color: #111827;
    }

    .aiflow-identify p {
      margin: 0 0 20px;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }

    .aiflow-input {
      width: 100%;
      box-sizing: border-box;
      padding: 11px 12px;
      margin-bottom: 10px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      outline: none;
      font-size: 14px;
    }

    .aiflow-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,.10);
    }

    .aiflow-continue {
      width: 100%;
      padding: 11px;
      margin-top: 4px;
      border: none;
      border-radius: 10px;
      background: #2563eb;
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: .2s ease;
    }

    .aiflow-continue:hover {
      opacity: .9;
      transform: translateY(-1px);
    }

    .aiflow-error {
      color: #dc2626;
      font-size: 12px;
      margin-bottom: 10px;
      line-height: 1.4;
    }

    .aiflow-body {
      flex: 1;
      padding: 14px;
      background: #f8fafc;
      overflow-y: auto;
      scroll-behavior: smooth;
    }

    .aiflow-message {
      padding: 10px 12px;
      border-radius: 12px;
      margin-bottom: 9px;
      max-width: 80%;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .aiflow-ai {
      background: #ffffff;
      color: #111827;
      margin-right: auto;
    }

    .aiflow-user {
      background: #2563eb;
      color: #ffffff;
      margin-left: auto;
    }

    .aiflow-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 10px;
      width: fit-content;
      background: #ffffff;
      border-radius: 12px;
      margin-bottom: 9px;
    }

    .aiflow-typing span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #9ca3af;
      animation: aiflowTyping 1.2s infinite ease-in-out;
    }

    .aiflow-typing span:nth-child(2) {
      animation-delay: .15s;
    }

    .aiflow-typing span:nth-child(3) {
      animation-delay: .30s;
    }

    .aiflow-handoff {
      padding: 8px 12px;
      border-top: 1px solid #e5e7eb;
      background: #ffffff;
    }

    .aiflow-handoff-button {
      width: 100%;
      padding: 10px;
      border: 1px solid #2563eb;
      border-radius: 10px;
      background: #ffffff;
      color: #2563eb;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .aiflow-handoff-button:hover {
      background: #eff6ff;
    }

    .aiflow-handoff-button:disabled {
      opacity: .6;
      cursor: not-allowed;
    }

    .aiflow-handoff-success {
      text-align: center;
      padding: 9px;
      border-radius: 9px;
      background: #ecfdf5;
      color: #047857;
      font-size: 12px;
      font-weight: 600;
    }

    .aiflow-handoff-error {
      color: #dc2626;
      font-size: 11px;
      text-align: center;
      margin-top: 5px;
    }

    .aiflow-footer {
      padding: 10px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 7px;
      background: #ffffff;
    }

    .aiflow-message-input {
      flex: 1;
      min-width: 0;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      outline: none;
      font-size: 14px;
    }

    .aiflow-message-input:focus {
      border-color: #2563eb;
    }

    .aiflow-send {
      flex-shrink: 0;
      padding: 0 15px;
      border: none;
      border-radius: 10px;
      background: #2563eb;
      color: #ffffff;
      font-weight: 600;
      cursor: pointer;
    }

    .aiflow-send:disabled {
      opacity: .6;
      cursor: not-allowed;
    }

    @keyframes aiflowOpen {
      from {
        opacity: 0;
        transform: translateY(12px) scale(.98);
      }

      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes aiflowTyping {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: .4;
      }

      30% {
        transform: translateY(-4px);
        opacity: 1;
      }
    }

    @media (max-width: 480px) {
      .aiflow-window {
        width: calc(100vw - 20px);
        height: calc(100vh - 100px);
        right: 10px;
        bottom: 80px;
        border-radius: 14px;
      }

      .aiflow-fab {
        right: 15px;
        bottom: 15px;
      }
    }
  `;

  document.head.appendChild(style);

  // ==========================================
  // 4. FLOATING BUTTON
  // ==========================================

  const fab = document.createElement("button");

  fab.className = "aiflow-fab";
  fab.innerHTML = "💬";
  fab.setAttribute(
    "aria-label",
    "Open AIFlow support"
  );

  // ==========================================
  // 5. CHAT WINDOW
  // ==========================================

  const windowEl = document.createElement("div");

  windowEl.className = "aiflow-window";

  windowEl.innerHTML = `
    <div class="aiflow-header">

      <div>
        <div class="aiflow-header-title">
          AIFlow Support
        </div>

        <div class="aiflow-header-subtitle">
          AI Support
        </div>
      </div>

      <button
        class="aiflow-close"
        id="aiflow-close"
        type="button"
      >
        ×
      </button>

    </div>

    <div id="aiflow-content"></div>
  `;

  document.body.appendChild(windowEl);
  document.body.appendChild(fab);

  // ==========================================
  // 6. ELEMENTS
  // ==========================================

  const content =
    windowEl.querySelector("#aiflow-content");

  const closeButton =
    windowEl.querySelector("#aiflow-close");

  // ==========================================
  // 7. SHOW IDENTIFICATION SCREEN
  // ==========================================

  function showIdentification() {
    identifying = true;

    content.innerHTML = `
      <div class="aiflow-identify">

        <h3>
          Start a conversation
        </h3>

        <p>
          Please enter your details to continue.
        </p>

        <input
          id="aiflow-name"
          class="aiflow-input"
          type="text"
          placeholder="Your name"
          autocomplete="name"
        />

        <input
          id="aiflow-email"
          class="aiflow-input"
          type="email"
          placeholder="Your email"
          autocomplete="email"
        />

        <div
          id="aiflow-identify-error"
          class="aiflow-error"
        ></div>

        <button
          id="aiflow-continue"
          class="aiflow-continue"
          type="button"
        >
          Continue
        </button>

      </div>
    `;

    const nameInput =
      content.querySelector("#aiflow-name");

    const emailInput =
      content.querySelector("#aiflow-email");

    const errorEl =
      content.querySelector(
        "#aiflow-identify-error"
      );

    const continueButton =
      content.querySelector(
        "#aiflow-continue"
      );

    continueButton.addEventListener(
      "click",
      async () => {
        const name =
          nameInput.value.trim();

        const email =
          emailInput.value
            .trim()
            .toLowerCase();

        if (!name || !email) {
          errorEl.textContent =
            "Name and email are required";

          return;
        }

        if (
          !email.includes("@") ||
          !email.includes(".")
        ) {
          errorEl.textContent =
            "Please enter a valid email address";

          return;
        }

        errorEl.textContent = "";

        continueButton.disabled = true;
        continueButton.textContent =
          "Connecting...";

        try {
          const response =
            await fetch(
              `${API_URL}/api/customers/identify`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  businessId:
                    widgetConfig.business,
                  name,
                  email,
                }),
              }
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Customer identification failed"
            );
          }

          customerId =
            data.data?._id;

          customerName =
            data.data?.name || name;

          customerEmail =
            data.data?.email || email;

          identifying = false;

          showChat();

        } catch (error) {
          console.error(
            "AIFlow Customer Identification Error:",
            error
          );

          errorEl.textContent =
            error.message ||
            "Unable to identify customer";

          continueButton.disabled = false;
          continueButton.textContent =
            "Continue";
        }
      }
    );

    emailInput.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          continueButton.click();
        }
      }
    );
  }

  // ==========================================
  // 8. SHOW CHAT SCREEN
  // ==========================================

  function showChat() {
    content.innerHTML = `
      <div
        id="aiflow-messages"
        class="aiflow-body"
      >
        <div class="aiflow-message aiflow-ai">
          ${
            widgetConfig.welcomeMessage ||
            "Hi! How can I help you today?"
          }
        </div>
      </div>

      <div
        id="aiflow-handoff-container"
      ></div>

      <div class="aiflow-footer">

        <input
          id="aiflow-message-input"
          class="aiflow-message-input"
          type="text"
          placeholder="Type your message..."
        />

        <button
          id="aiflow-send"
          class="aiflow-send"
          type="button"
        >
          Send
        </button>

      </div>
    `;

    const input =
      content.querySelector(
        "#aiflow-message-input"
      );

    const sendButton =
      content.querySelector(
        "#aiflow-send"
      );

    input.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          sendMessage();
        }
      }
    );

    sendButton.addEventListener(
      "click",
      sendMessage
    );

    renderHandoffButton();

    input.focus();
  }

  // ==========================================
  // 9. ADD MESSAGE
  // ==========================================

  function addMessage(
    text,
    isUser = false
  ) {
    const messages =
      content.querySelector(
        "#aiflow-messages"
      );

    if (!messages) return;

    const div =
      document.createElement("div");

    div.className =
      "aiflow-message " +
      (isUser
        ? "aiflow-user"
        : "aiflow-ai");

    div.textContent = text;

    messages.appendChild(div);

    messages.scrollTop =
      messages.scrollHeight;
  }

  // ==========================================
  // 10. TYPING INDICATOR
  // ==========================================

  function showTyping() {
    const messages =
      content.querySelector(
        "#aiflow-messages"
      );

    if (!messages) return;

    removeTyping();

    const typing =
      document.createElement("div");

    typing.id =
      "aiflow-typing";

    typing.className =
      "aiflow-typing";

    typing.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;

    messages.appendChild(typing);

    messages.scrollTop =
      messages.scrollHeight;
  }

  function removeTyping() {
    const typing =
      content.querySelector(
        "#aiflow-typing"
      );

    if (typing) {
      typing.remove();
    }
  }

  // ==========================================
  // 11. SEND AI MESSAGE
  // ==========================================

  async function sendMessage() {
    if (sending) return;

    const input =
      content.querySelector(
        "#aiflow-message-input"
      );

    const sendButton =
      content.querySelector(
        "#aiflow-send"
      );

    if (!input || !sendButton) {
      return;
    }

    const text =
      input.value.trim();

    if (!text) return;

    if (!customerId) {
      addMessage(
        "Please identify yourself first."
      );

      return;
    }

    addMessage(text, true);

    input.value = "";

    sending = true;

    input.disabled = true;
    sendButton.disabled = true;
    sendButton.textContent = "...";

    showTyping();

    try {
      const response =
        await fetch(
          `${API_URL}/api/ai/widget-chat`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              message: text,
              businessId:
                widgetConfig.business,
              customerId,
              conversationId,
            }),
          }
        );

      const data =
        await response.json();

      removeTyping();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "AI request failed"
        );
      }

      const newConversationId =
        data.data?.conversationId;

      if (newConversationId) {
        conversationId =
          newConversationId;
      }

      const reply =
        data.data?.reply ||
        "Sorry, I could not generate a response.";

      addMessage(reply, false);

    } catch (error) {
      console.error(
        "AIFlow Widget AI Error:",
        error
      );

      removeTyping();

      addMessage(
        error.message ||
          "Sorry, something went wrong. Please try again.",
        false
      );
    } finally {
      sending = false;

      input.disabled = false;
      sendButton.disabled = false;
      sendButton.textContent = "Send";

      input.focus();
    }
  }

  // ==========================================
  // 12. HUMAN HANDOFF UI
  // ==========================================

  function renderHandoffButton() {
    const container =
      content.querySelector(
        "#aiflow-handoff-container"
      );

    if (!container) return;

    if (!conversationId) {
      container.innerHTML = "";
      return;
    }

    if (handoffRequested) {
      container.innerHTML = `
        <div class="aiflow-handoff">
          <div class="aiflow-handoff-success">
            ✓ Human support requested
          </div>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="aiflow-handoff">

        <button
          id="aiflow-handoff-button"
          class="aiflow-handoff-button"
          type="button"
        >
          👤 Talk to a Human
        </button>

        <div
          id="aiflow-handoff-error"
          class="aiflow-handoff-error"
        ></div>

      </div>
    `;

    const button =
      container.querySelector(
        "#aiflow-handoff-button"
      );

    button.addEventListener(
      "click",
      requestHumanHandoff
    );
  }

  // ==========================================
  // 13. HUMAN HANDOFF REQUEST
  // ==========================================

  async function requestHumanHandoff() {
    if (
      !conversationId ||
      !customerId ||
      handoffRequested
    ) {
      return;
    }

    const button =
      content.querySelector(
        "#aiflow-handoff-button"
      );

    const errorEl =
      content.querySelector(
        "#aiflow-handoff-error"
      );

    if (!button) return;

    button.disabled = true;
    button.textContent =
      "Connecting...";

    if (errorEl) {
      errorEl.textContent = "";
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/handoffs/widget`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              businessId:
                widgetConfig.business,

              conversationId,

              customerId,

              reason:
                "Customer requested human support",

              priority: "medium",

              notes:
                "Customer requested a human support agent from the website widget.",
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to request human support"
        );
      }

      handoffRequested = true;

      addMessage(
        "I've requested a human support agent for you. Someone from our support team will assist you shortly.",
        false
      );

      renderHandoffButton();

    } catch (error) {
      console.error(
        "AIFlow Human Handoff Error:",
        error
      );

      if (errorEl) {
        errorEl.textContent =
          error.message ||
          "Unable to request human support";
      }

      button.disabled = false;
      button.textContent =
        "👤 Talk to a Human";
    }
  }

  // ==========================================
  // 14. OPEN WIDGET
  // ==========================================

  fab.addEventListener(
    "click",
    () => {
      windowEl.style.display = "flex";
      fab.style.display = "none";

      const input =
        content.querySelector(
          "#aiflow-message-input"
        );

      if (input) {
        input.focus();
      }
    }
  );

  // ==========================================
  // 15. CLOSE WIDGET
  // ==========================================

  closeButton.addEventListener(
    "click",
    () => {
      windowEl.style.display = "none";
      fab.style.display = "block";
    }
  );

  // ==========================================
  // 16. LOAD WIDGET CONFIG
  // ==========================================

  async function loadWidget() {
    try {
      const response =
        await fetch(
          `${API_URL}/api/widgets/public/${widgetId}`
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to load widget"
        );
      }

      widgetConfig = data.data;

      // Apply widget color
      fab.style.background =
        widgetConfig.primaryColor ||
        "#2563eb";

      console.log(
        "AIFlow Widget Ready:",
        widgetId
      );

      console.log(
        "AIFlow Business:",
        widgetConfig.business
      );

    } catch (error) {
      console.error(
        "AIFlow Widget Load Error:",
        error
      );

      fab.style.display = "none";
    }
  }

  // ==========================================
  // 17. START
  // ==========================================

  loadWidget().then(() => {
    if (widgetConfig) {
      showIdentification();
    }
  });

})();