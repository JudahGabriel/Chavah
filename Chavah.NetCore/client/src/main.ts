import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "./shared/theme.css";
import "./shared/global.css";
import "./app-root";
import { startRouter } from "./shared/router";

// Boot the SPA once DOM is ready.
startRouter();
