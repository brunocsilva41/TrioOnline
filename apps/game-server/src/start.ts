import "./index";

process.on("uncaughtException", (err) => {
    console.error("[start wrapper] UNCAUGHT EXCEPTION:", err);
    console.error(err.stack);
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    console.error("[start wrapper] UNHANDLED REJECTION:", reason);
});
