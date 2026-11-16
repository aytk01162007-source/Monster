
const joinButton = document.getElementById("joinButton");
const eventCode = document.getElementById("eventCode");
const message = document.getElementById("message");

joinButton.addEventListener("click", () => {
  const code = eventCode.value.trim();

  if (!code) {
    message.textContent = "イベントコードを入力してください。";
    return;
  }

  message.textContent =
    "コード照合機能は現在準備中です。正式公開までお待ちください。";
});

eventCode.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    joinButton.click();
  }
});
