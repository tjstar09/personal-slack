export default defineBackground(() => {
  const configureSidePanel = () => {
    if (!chrome.sidePanel?.setPanelBehavior) return;

    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.warn('Unable to configure side panel behavior', error));
  };

  chrome.runtime.onInstalled.addListener(configureSidePanel);
  chrome.runtime.onStartup.addListener(configureSidePanel);
  configureSidePanel();
});
