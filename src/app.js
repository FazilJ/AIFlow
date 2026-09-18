const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const errorHandler = require("./middleware/errorHandler");
const customerRoutes = require("./routes/customerRoutes");
const integrationRoutes = require("./routes/integrationRoutes");
const aiRoutes = require("./routes/aiRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const ticketRoutes = require("./routes/ticketRoutes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/customers", customerRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/tickets", ticketRoutes);

app.use(errorHandler);

module.exports = app;
