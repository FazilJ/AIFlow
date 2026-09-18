const sendWhatsAppTextMessage = async ({
  to,
  message,
  phoneNumberId,
  accessToken,
}) => {
  try {
    // ==================================================
    // VALIDATION
    // ==================================================

    if (!to) {
      throw new Error("WhatsApp recipient number is required");
    }

    if (!message || !message.trim()) {
      throw new Error("WhatsApp message is required");
    }

    if (!phoneNumberId) {
      throw new Error("WhatsApp Phone Number ID is required");
    }

    if (!accessToken) {
      throw new Error("WhatsApp access token is required");
    }

    // ==================================================
    // WHATSAPP CLOUD API
    // ==================================================

    const response = await fetch(
      `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",

          to: to.trim(),

          type: "text",

          text: {
            preview_url: false,
            body: message.trim(),
          },
        }),
      }
    );

    // ==================================================
    // PARSE RESPONSE
    // ==================================================

    const data = await response.json();

    // ==================================================
    // HANDLE API ERROR
    // ==================================================

    if (!response.ok) {
      console.error(
        "WhatsApp API Error:",
        JSON.stringify(data, null, 2)
      );

      throw new Error(
        data?.error?.message ||
          data?.error?.error_user_msg ||
          "Failed to send WhatsApp message"
      );
    }

    // ==================================================
    // SUCCESS
    // ==================================================

    console.log(
      "WhatsApp message sent successfully ✅:",
      JSON.stringify(data, null, 2)
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(
      "WhatsApp Send Message Error:",
      error.message
    );

    throw error;
  }
};

// ==================================================
// CHECK WHATSAPP CONNECTION
// ==================================================

const checkWhatsAppConnection = async ({
  phoneNumberId,
  accessToken,
}) => {
  try {
    if (!phoneNumberId) {
      throw new Error("WhatsApp Phone Number ID is required");
    }

    if (!accessToken) {
      throw new Error("WhatsApp access token is required");
    }

    const response = await fetch(
      `https://graph.facebook.com/v25.0/${phoneNumberId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "WhatsApp Connection Error:",
        JSON.stringify(data, null, 2)
      );

      throw new Error(
        data?.error?.message ||
          data?.error?.error_user_msg ||
          "WhatsApp connection failed"
      );
    }

    console.log(
      "WhatsApp connection verified ✅"
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(
      "WhatsApp Connection Check Error:",
      error.message
    );

    throw error;
  }
};


module.exports = {
  sendWhatsAppTextMessage,
  checkWhatsAppConnection,
};