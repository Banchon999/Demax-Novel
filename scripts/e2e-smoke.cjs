/**
 * End-to-end smoke test at phone size against a running production build.
 *   npm run build && npx next start -p 3100
 *   BASE_URL=http://localhost:3100 SHOTS=./shots node scripts/e2e-smoke.cjs
 * Needs the `playwright` package and a Chromium it can launch.
 */
const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3100";
const SHOTS = process.env.SHOTS || "";
const phone = { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } };

let step = 0;
async function shot(page, name) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${String(++step).padStart(2, "0")}-${name}.png`) });
}

function check(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
}

/**
 * ProseMirror reads a click's caret from the async `selectionchange` event;
 * give it a moment so instant synthetic key presses use the right position.
 */
async function focusEditor(page) {
  await page.locator(".prose-editor").click();
  await page.waitForTimeout(150);
}

async function waitSaved(page) {
  await page.getByText("บันทึกแล้ว", { exact: true }).waitFor();
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...phone, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // 1. Create a project and a prose chapter, type Thai, reload.
  await page.goto(BASE + "/");
  await page.getByRole("button", { name: "เรื่องใหม่" }).click();
  await page.getByLabel("ชื่อเรื่อง").fill("ราชันย์แห่งเงา");
  await page.getByLabel("เรื่องย่อ / แนวคิด (ไม่บังคับ)").fill("เด็กหนุ่มได้พลังเงาจากหอคอยต้องห้าม");
  await page.getByRole("button", { name: "สร้างเรื่อง" }).click();
  await page.waitForURL(/\/project\?id=/);
  const projectUrl = page.url();
  await page.getByRole("button", { name: "ตอนใหม่" }).click();
  await page.getByRole("button", { name: "เริ่มเขียน" }).click();
  await page.waitForURL(/\/write\?id=/);
  const proseUrl = page.url();
  await focusEditor(page);
  await page.keyboard.type("วันนี้อากาศดีมาก");
  await waitSaved(page);
  await page.reload();
  await page.locator(".prose-editor").getByText("วันนี้อากาศดีมาก").waitFor();
  check(await page.getByText("ตอนนี้ 5 คำ").isVisible(), "prose text persists after reload with Thai word count");
  await focusEditor(page);
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "ตัวหนา" }).click();
  await page.keyboard.type("ฉากต่อสู้");
  await waitSaved(page);
  check((await page.locator(".prose-editor strong").textContent()) === "ฉากต่อสู้", "toolbar bold applies");
  await shot(page, "write-prose");

  // 2. Snapshot, edit, restore.
  await page.getByRole("button", { name: "ประวัติเวอร์ชัน" }).click();
  await page.getByLabel("ชื่อเวอร์ชัน").fill("ก่อนแก้");
  await page.getByRole("button", { name: "บันทึกเวอร์ชัน" }).click();
  await page.getByText("ก่อนแก้", { exact: true }).waitFor();
  await shot(page, "history");
  await page.getByRole("button", { name: "ปิด" }).click();
  await focusEditor(page);
  await page.keyboard.press("Control+End");
  await page.keyboard.type(" แก้ใหม่หมด");
  await waitSaved(page);
  await page.getByRole("button", { name: "ประวัติเวอร์ชัน" }).click();
  await page.getByText("ก่อนแก้", { exact: true }).click();
  await page.getByRole("button", { name: "กู้คืนเวอร์ชันนี้" }).click();
  await page.getByRole("button", { name: "แตะอีกครั้งเพื่อกู้คืน" }).click();
  await page.waitForFunction(() => {
    const text = document.querySelector(".prose-editor")?.textContent ?? "";
    return text.includes("ฉากต่อสู้") && !text.includes("แก้ใหม่หมด");
  });
  await waitSaved(page);
  await page.reload();
  const restored = await page.locator(".prose-editor").textContent();
  check(restored.includes("ฉากต่อสู้") && !restored.includes("แก้ใหม่หมด"), "snapshot restore replaces content and persists");

  // 3. Chat chapter with two characters.
  await page.goto(projectUrl);
  await page.getByRole("button", { name: "ตอนใหม่" }).click();
  await page.getByRole("radio", { name: "แชทโนเวล" }).click();
  await page.getByRole("button", { name: "เริ่มเขียน" }).click();
  await page.waitForURL(/\/write\?id=/);
  const chatUrl = page.url();
  for (const name of ["ไลลา", "เรน"]) {
    await page.getByRole("button", { name: "ตัวละคร" }).click();
    await page.getByLabel("ชื่อตัวละคร").fill(name);
    await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  }
  const input = page.getByLabel("พิมพ์ข้อความ");
  await page.getByRole("radio", { name: "ไลลา" }).click();
  await input.fill("เธอเห็นเงานั่นไหม");
  await input.press("Enter");
  await page.getByRole("radio", { name: "เรน" }).click();
  await input.fill("เห็นสิ มันขยับได้");
  await input.press("Enter");
  await page.getByRole("radio", { name: "บรรยาย" }).click();
  await input.fill("ลมหนาวพัดผ่าน");
  await input.press("Enter");
  await waitSaved(page);
  await page.reload();
  await page.getByText("เห็นสิ มันขยับได้").waitFor();
  check(await page.getByText("ลมหนาวพัดผ่าน").isVisible(), "chat messages persist after reload");
  await shot(page, "write-chat");

  // 4. Project page, home, ideas, settings screenshots.
  await page.goto(projectUrl);
  await page.getByRole("heading", { name: "สารบัญ" }).waitFor();
  check((await page.locator("ol > li").count()) === 2, "project lists both chapters");
  await shot(page, "project");
  await page.goto(BASE + "/ideas");
  await page.getByLabel("ไอเดียใหม่").fill("หอคอยมีชั้นที่ 13 ที่ไม่มีใครเห็น");
  await page.getByLabel("เก็บไว้ในเรื่อง").selectOption({ label: "ราชันย์แห่งเงา" });
  await page.getByRole("button", { name: "จดไว้" }).click();
  await page.getByText("หอคอยมีชั้นที่ 13 ที่ไม่มีใครเห็น").waitFor();
  check(true, "idea captured");
  await shot(page, "ideas");
  await page.goto(BASE + "/");
  await page.getByText("เขียนต่อจากล่าสุด").waitFor();
  check(await page.getByText("ราชันย์แห่งเงา").first().isVisible(), "home shows project and continue card");
  await shot(page, "home");


  // 4b. Codex: types, entity fields, alias, progression, link, mentions, graph, timeline.
  await page.goto(projectUrl);
  await page.getByRole("link", { name: "Codex" }).click();
  await page.waitForURL(/\/codex\?p=/);
  await page.getByRole("tab", { name: /ตัวละคร/ }).waitFor();
  check(await page.getByRole("tab", { name: /สถานที่/ }).isVisible(), "codex has default types");
  async function addEntity(type, name) {
    await page.getByRole("button", { name: "เพิ่มข้อมูล" }).click();
    await page.getByRole("radio", { name: new RegExp(type) }).click();
    await page.getByLabel("ชื่อ", { exact: true }).fill(name);
    await page.getByRole("button", { name: "สร้างแล้วเปิดรายละเอียด" }).click();
    await page.waitForURL(/\/entity\?id=/);
  }
  await addEntity("สถานที่", "หอคอยเงา");
  const towerUrl = page.url();
  await page.goBack();
  await addEntity("ตัวละคร", "ไลลา");
  const lailaUrl = page.url();
  await page.getByLabel("ชื่อเรียกอื่น / ฉายา (ใช้ไฮไลต์ในเนื้อเรื่องด้วย)").fill("ราชินีเงา");
  await page.keyboard.press("Enter");
  await page.getByLabel("บทบาท").selectOption("ตัวเอก");
  await page.getByLabel("นิสัย").fill("ใจเย็น แต่เจ้าคิดเจ้าแค้น");
  await page.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" }).click();
  await page.getByLabel("ข้อมูลที่เปลี่ยน").selectOption({ label: "บทบาท" });
  await page.getByLabel("ค่าใหม่").fill("ตัวร้าย");
  await page.getByLabel("หมายเหตุ (ไม่บังคับ)").fill("ถูกเงากลืน");
  await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  await page.getByText("(ตั้งแต่ตอน 2)").waitFor();
  check(true, "progression shows in state as of latest chapter");
  await page.getByRole("button", { name: "เพิ่ม", exact: true }).click();
  await page.getByRole("radio", { name: /หอคอยเงา/ }).click();
  await page.getByRole("button", { name: "อาศัยอยู่ที่" }).click();
  await page.getByRole("button", { name: "เชื่อมความสัมพันธ์" }).click();
  await page.getByText("อาศัยอยู่ที่").first().waitFor();
  await page.waitForTimeout(700); // debounced field save
  await page.reload();
  check((await page.getByLabel("นิสัย").inputValue()) === "ใจเย็น แต่เจ้าคิดเจ้าแค้น", "entity fields persist");
  check(await page.getByText("ราชินีเงา").isVisible(), "alias persists");
  await shot(page, "entity");

  await page.goto(proseUrl);
  await focusEditor(page);
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("ราชินีเงามองไปที่หอคอยเงา");
  await waitSaved(page);
  check((await page.locator(".codex-mention").count()) === 2, "alias and place are highlighted in the manuscript");
  await page.locator(".codex-mention").first().click();
  const card = page.getByRole("complementary", { name: "ข้อมูลของ ไลลา" });
  await card.waitFor();
  check((await card.textContent()).includes("ตัวเอก"), "mention card shows state as of this chapter (before the change)");
  await shot(page, "mention-card");

  await page.goto(lailaUrl);
  await page.getByText(/ปรากฏ 2 จาก 2 ตอน/).waitFor();
  check(true, "appearances counted across prose and chat chapters");
  await page.goto(projectUrl.replace("/project?id=", "/graph?p="));
  await page.locator(".react-flow__node").nth(1).waitFor();
  check((await page.locator(".react-flow__node").count()) === 2, "relationship graph renders linked entities");
  await shot(page, "graph");
  await page.goto(projectUrl.replace("/project?id=", "/timeline?p="));
  await page.getByRole("button", { name: "เหตุการณ์" }).click();
  await page.getByLabel("ชื่อเหตุการณ์").fill("สงครามแยกแผ่นดิน");
  await page.getByLabel("เวลาในโลกของเรื่อง").fill("ปีที่ 1024");
  await page.getByRole("button", { name: /ไลลา/ }).click();
  await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  await page.getByText("สงครามแยกแผ่นดิน").waitFor();
  check(true, "timeline event saved");
  await shot(page, "timeline");
  void towerUrl;

  // 4c. Plot board: arc from template, place beats, thread, insights, chart.
  await page.goto(projectUrl.replace("/project?id=", "/plot?p="));
  await page.getByRole("button", { name: "ภาคใหม่" }).click();
  await page.getByLabel("ชื่อภาค").fill("ภาคหอคอยต้องห้าม");
  await page.getByLabel("เริ่มจากโครงสำเร็จรูป (ไม่บังคับ)").selectOption("webnovel");
  await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  await page.getByText("0/8 จังหวะเสร็จ").waitFor();
  check(true, "arc created from the web-novel template (8 beats)");
  await page.getByRole("button", { name: /^ตะขอเปิดภาค/ }).click();
  await page.getByLabel("วางไว้ในตอน").selectOption({ index: 1 });
  await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  await page.getByRole("button", { name: /ตะขอเปิดภาค.*ตอนที่ 1/ }).waitFor();
  await page.getByRole("checkbox", { name: "ตะขอเปิดภาค เสร็จแล้ว" }).click();
  await page.getByText("1/8 จังหวะเสร็จ").waitFor();
  await page.getByRole("button", { name: /^ชัยชนะเล็ก/ }).click();
  await page.getByLabel("วางไว้ในตอน").selectOption({ index: 2 });
  await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  await shot(page, "plot-arcs");
  await page.getByRole("radio", { name: /ปมที่ปูไว้/ }).click();
  await page.getByRole("button", { name: "ปมใหม่" }).click();
  await page.getByLabel("ปม / สิ่งที่ปูไว้").fill("ดาบหักในห้องใต้ดิน");
  await page.getByLabel("ปูไว้ในตอน").selectOption({ index: 2 });
  await page.getByLabel("เฉลยในตอน").selectOption({ index: 1 });
  await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  await page.getByText("ดาบหักในห้องใต้ดิน").waitFor();
  await page.getByRole("radio", { name: /ภาพรวม/ }).click();
  await page.getByText(/เฉลยตอนที่ 1 ก่อนปูตอนที่ 2/).waitFor();
  check(true, "insights catch a payoff placed before its setup");
  check((await page.locator("svg[aria-label='กราฟความตึงเครียดตามตอน'] circle").count()) === 2, "tension chart plots the placed beats");
  await page.locator("svg[aria-label='กราฟความตึงเครียดตามตอน']").hover();
  await shot(page, "plot-rhythm");
  await page.goto(proseUrl);
  await page.getByRole("button", { name: "ตัวเลือก" }).click();
  await page.getByRole("region", { name: "แผนของตอนนี้" }).getByText("ตะขอเปิดภาค").waitFor();
  check(true, "writing screen shows this chapter's plan");
  await page.getByRole("button", { name: "ปิด" }).click();

  // 5. Backup download, restore into a fresh "device".
  await page.goto(BASE + "/settings");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "ดาวน์โหลดไฟล์สำรองทั้งหมด" }).click(),
  ]);
  const file = await download.path();
  await shot(page, "settings");
  const ctx2 = await browser.newContext(phone);
  const page2 = await ctx2.newPage();
  await page2.goto(BASE + "/settings");
  await page2.getByLabel("เลือกไฟล์สำรอง").setInputFiles(file);
  await page2.getByRole("button", { name: "รวมกับข้อมูลในเครื่อง" }).click();
  await page2.getByText(/กู้คืนสำเร็จ: 1 เรื่อง 2 ตอน 1 ไอเดีย/).waitFor();
  await page2.goto(chatUrl);
  await page2.getByText("เธอเห็นเงานั่นไหม").waitFor();
  await page2.goto(lailaUrl);
  await page2.getByText("ราชินีเงา").waitFor();
  check(true, "backup restores on a fresh device");
  await ctx2.close();

  // 6. Offline: once the service worker is active, pages open with no network.
  await page.goto(BASE + "/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await ctx.setOffline(true);
  await page.goto(proseUrl);
  await page.locator(".prose-editor").getByText("วันนี้อากาศดีมาก").waitFor();
  await focusEditor(page);
  await page.keyboard.press("Control+End");
  await page.keyboard.type(" เขียนตอนออฟไลน์");
  await waitSaved(page);
  await page.goto(BASE + "/ideas");
  await page.getByText("หอคอยมีชั้นที่ 13 ที่ไม่มีใครเห็น").waitFor();
  await page.goto(proseUrl);
  await page.getByText("เขียนตอนออฟไลน์").waitFor();
  check(true, "app opens and saves while offline");
  await ctx.setOffline(false);

  check(errors.length === 0, `no page errors${errors.length ? ": " + errors.join(" | ") : ""}`);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
