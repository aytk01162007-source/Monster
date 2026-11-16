
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

function registerCharacter(event) {
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
