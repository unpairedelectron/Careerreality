import "./index.css";

function startApp() {
  void import("./client-entry").catch((error) => {
    console.error("CareerReality could not finish loading.", error);
  });
}

if (document.querySelector("#root .snapshot-home")) {
  // Let the complete, crawlable homepage snapshot paint before React replaces it.
  window.setTimeout(startApp, 1200);
} else {
  startApp();
}
