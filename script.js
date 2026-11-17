
import { db, ensureSignedIn } from "./firebase.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

// Firebase匿名認証（動作確認用）
ensureSignedIn()
  .then((user) => {
    alert("Firebase認証成功！");
    console.log("Firebase接続成功！", user.uid);
  })
  .catch((error) => {
    alert("Firebase認証失敗：" + error.message);
    console.error("Firebase接続エラー:", error);
  });

const form = document.getElementById("characterForm");
const result = document.getElementById("result");
const resultContent = document.getElementById("resultContent");
const formMessage = document.getElementById("formMessage");
const rankMessage = document.getElementById("rankMessage");

const statNames = ["atk", "def", "spd", "mat", "mdf"];
const statLabels = {
  hp: "HP",
  atk: "ATK / 攻撃力",
  def: "DEF / 防御力",
  spd: "SPD / 素早さ",
  mat: "MAT / 魔法攻撃力",
  mdf: "MDF / 魔法防御力"
};

const weights = [6, 5, 4, 3, 2, 1];

function getStats() {
  const stats = {};

  statNames.forEach(name => {
    stats[name] = Number(document.getElementById(name).value);
  });

  return stats;
}

function updatePoints() {
  const stats = getStats();
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  document.getElementById("usedPoints").textContent = total;

  document.getElementById("pointBar").style.width =
    Math.min(total / 300 * 100, 100) + "%";

  document.getElementById("pointBar").style.background =
    total === 300 ? "#568f77" : "#bd9850";

  return total;
}

statNames.forEach(name => {
  document.getElementById(name).addEventListener("input", updatePoints);
});

function getGrowthRanks() {
  const ranks = {};

  document.querySelectorAll("[data-growth]").forEach(select => {
    ranks[select.dataset.growth] = Number(select.value);
  });

  return ranks;
}

function checkRanks() {
  const ranks = Object.values(getGrowthRanks());
  const unique = new Set(ranks);

  const valid =
    ranks.length === 6 &&
    unique.size === 6 &&
    ranks.every(rank => rank >= 1 && rank <= 6);

  rankMessage.textContent = valid
    ? "成長順位は正常に設定されています。"
    : "成長順位が重複しています。1位〜6位をそれぞれ1つずつ設定してください。";

  rankMessage.style.color = valid ? "#34836a" : "#a34c3e";

  return valid;
}

document.querySelectorAll("[data-growth]").forEach(select => {
  select.addEventListener("change", checkRanks);
});

function getGrowthWeights(ranks) {
  const result = {};

  Object.entries(ranks).forEach(([key, rank]) => {
    result[key] = weights[rank - 1];
  });

  return result;
}

async function registerCharacter(event) {
  event.preventDefault();

  formMessage.textContent = "";

  const name = document.getElementById("characterName").value.trim();
  const job = document.getElementById("characterJob").value.trim();
  const stats = getStats();
  const total = updatePoints();

  if (!name || !job) {
    formMessage.textContent = "名前と職業を入力してください。";
    return;
  }

  if (Object.values(stats).some(value =>
    !Number.isInteger(value) || value < 0 || value > 150
  )) {
    formMessage.textContent =
      "能力値は0〜150の整数で設定してください。";
    return;
  }

  if (total !== 300) {
    formMessage.textContent =
      "能力ポイントの合計を300にしてください。";
    return;
  }

  if (!checkRanks()) {
    formMessage.textContent =
      "成長順位を正しく設定してください。";
    return;
  }

  const ranks = getGrowthRanks();

  const character = {
    id: "character-" + Date.now(),
    name,
    job,
    level: 1,
    exp: 0,
    stats: {
      hp: 500,
      ...stats
    },
    growthRanks: ranks,
    growthWeights: getGrowthWeights(ranks),
    createdAt: new Date().toISOString()
  };

  try {
    // Firebaseの匿名認証を確認
    const user = await ensureSignedIn();

    // Firestoreに冒険者情報を保存
    await setDoc(doc(db, "characters", user.uid), {
      ...character,
      ownerUid: user.uid,
      updatedAt: serverTimestamp()
    });

    // 端末にも保存
    localStorage.setItem(
      "adventurerCharacter",
      JSON.stringify(character)
    );

    formMessage.textContent = "Firebaseへの保存に成功しました！";

    showResult(character);

  } catch (error) {
    console.error("冒険者保存エラー:", error);

    formMessage.textContent =
      "保存できませんでした。通信状況やFirebaseの設定を確認してください。";
  }
}
  event.preventDefault();

  formMessage.textContent = "";

  const name = document.getElementById("characterName").value.trim();
  const job = document.getElementById("characterJob").value.trim();
  const stats = getStats();
  const total = updatePoints();

  if (!name || !job) {
    formMessage.textContent = "名前と職業を入力してください。";
    return;
  }

  if (Object.values(stats).some(value =>
    !Number.isInteger(value) || value < 0 || value > 150
  )) {
    formMessage.textContent =
      "能力値は0〜150の整数で設定してください。";
    return;
  }

  if (total !== 300) {
    formMessage.textContent =
      "能力ポイントの合計を300にしてください。";
    return;
  }

  if (!checkRanks()) {
    formMessage.textContent =
      "成長順位を正しく設定してください。";
    return;
  }

  const ranks = getGrowthRanks();

  const character = {
    id: "character-" + Date.now(),
    name,
    job,
    level: 1,
    exp: 0,
    stats: {
      hp: 500,
      ...stats
    },
    growthRanks: ranks,
    growthWeights: getGrowthWeights(ranks),
    createdAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(
      "adventurerCharacter",
      JSON.stringify(character)
    );
  } catch (error) {
    formMessage.textContent =
      "保存できませんでした。ブラウザの設定を確認してください。";
    return;
  }

  showResult(character);
}

function showResult(character) {
  form.hidden = true;
  result.hidden = false;

  let html = `
    <div class="result-stat">
      <strong>冒険者名</strong>
      <span>${escapeHTML(character.name)}</span>
    </div>
    <div class="result-stat">
      <strong>職業</strong>
      <span>${escapeHTML(character.job)}</span>
    </div>
    <div class="result-stat">
      <strong>レベル</strong>
      <span>Lv.${character.level}</span>
    </div>
  `;

  Object.entries(character.stats).forEach(([key, value]) => {
    html += `
      <div class="result-stat">
        <strong>${statLabels[key]}</strong>
        <span>${value}</span>
      </div>
    `;
  });

  html += "<h4>成長傾向</h4>";

  Object.entries(character.growthRanks)
    .sort((a, b) => a[1] - b[1])
    .forEach(([key, rank]) => {
      html += `
        <div class="result-stat">
          <strong>${rank}位</strong>
          <span>${statLabels[key]}</span>
        </div>
      `;
    });

  resultContent.innerHTML = html;

  window.scrollTo({ top: result.offsetTop - 20, behavior: "smooth" });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

document.getElementById("editButton").addEventListener("click", () => {
  result.hidden = true;
  form.hidden = false;
  window.scrollTo({ top: form.offsetTop - 20, behavior: "smooth" });
});

form.addEventListener("submit", registerCharacter);

updatePoints();
checkRanks();


(() => {
  const STORAGE_KEY = "adventurerParty";

  const createButton = document.getElementById("createPartyButton");
  const joinButton = document.getElementById("joinPartyButton");
  const leaveButton = document.getElementById("leavePartyButton");

  const partyNameInput = document.getElementById("partyName");
  const partyCodeInput = document.getElementById("partyCode");
  const partyMessage = document.getElementById("partyMessage");
  const partyInfo = document.getElementById("partyInfo");

  const displayName = document.getElementById("displayPartyName");
  const displayCode = document.getElementById("displayPartyCode");
  const memberCount = document.getElementById("partyMemberCount");
  const memberList = document.getElementById("partyMembers");

  if (!createButton || !joinButton || !leaveButton) return;

  let party = null;

  function getCharacter() {
    try {
      return JSON.parse(localStorage.getItem("adventurerCharacter"));
    } catch {
      return null;
    }
  }

  function saveParty() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(party));
  }

  function makeCode() {
    return Math.random().toString(36)
      .substring(2, 8).toUpperCase();
  }

  function showMessage(message) {
    partyMessage.textContent = message;
  }

  function renderParty() {
    if (!party) {
      partyInfo.hidden = true;
      return;
    }

    partyInfo.hidden = false;
    displayName.textContent = party.name;
    displayCode.textContent = party.code;
    memberCount.textContent = `${party.members.length} / 6人`;

    memberList.replaceChildren();

    party.members.forEach((member, index) => {
      const card = document.createElement("div");
      card.className = "party-member";

      const name = document.createElement("strong");
      name.textContent =
        (index === 0 ? "👑 リーダー：" : "冒険者：") +
        member.name;

      const job = document.createElement("span");
      job.textContent = member.job;

      card.append(name, job);
      memberList.appendChild(card);
    });
  }

  createButton.addEventListener("click", () => {
    const character = getCharacter();
    const name = partyNameInput.value.trim();

    if (!character) {
      showMessage("先に冒険者登録を完了してください。");
      return;
    }

    if (!name) {
      showMessage("パーティー名を入力してください。");
      return;
    }

    if (party) {
      showMessage("すでにパーティーに参加しています。");
      return;
    }

    party = {
      name,
      code: makeCode(),
      members: [{
        id: character.id,
        name: character.name,
        job: character.job
      }]
    };

    saveParty();
    renderParty();
    showMessage("パーティーを結成しました！");
  });

  joinButton.addEventListener("click", () => {
    const character = getCharacter();
    const code = partyCodeInput.value.trim().toUpperCase();

    if (!character) {
      showMessage("先に冒険者登録を完了してください。");
      return;
    }

    if (!code) {
      showMessage("招待コードを入力してください。");
      return;
    }

    if (party) {
      showMessage("すでにパーティーに参加しています。");
      return;
    }

    showMessage(
      "この端末に保存されたパーティーを確認しています。"
    );

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

      if (!saved || saved.code !== code) {
        showMessage("パーティーが見つかりません。");
        return;
      }

      if (saved.members.length >= 6) {
        showMessage("このパーティーは満員です。");
        return;
      }

      if (saved.members.some(m => m.id === character.id)) {
        showMessage("すでに参加しています。");
        return;
      }

      saved.members.push({
        id: character.id,
        name: character.name,
        job: character.job
      });

      party = saved;
      saveParty();
      renderParty();
      showMessage("パーティーに参加しました！");
    } catch {
      showMessage("パーティー情報を読み込めませんでした。");
    }
  });

  leaveButton.addEventListener("click", () => {
    if (!party) return;

    const character = getCharacter();
    if (!character) return;

    party.members = party.members.filter(
      member => member.id !== character.id
    );

    if (party.members.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      saveParty();
    }

    party = null;
    renderParty();
    showMessage("パーティーから脱退しました。");
  });

  try {
    party = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (party && !Array.isArray(party.members)) party = null;
  } catch {
    party = null;
  }

  renderParty();
})();
