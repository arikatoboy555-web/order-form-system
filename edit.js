const EDIT_ORDERS_KEY = "mulriver-order-experiment-orders-v1";
const editForm = document.querySelector("#editForm");
const orderIdInput = document.querySelector("#orderId");
const searchButton = document.querySelector("#searchButton");
const editMessage = document.querySelector("#editMessage");
const editItems = document.querySelector("#editItems");
const editSubmitButton = editForm.querySelector(".submit-button");
const editCompleteNotice = document.querySelector("#editCompleteNotice");
let loadedOrder = null;
let editSubmitted = false;
let editRequestId = "";

function makeRequestId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return prefix + "-" + window.crypto.randomUUID();
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}

function resetEditSubmitState() {
  editSubmitted = false;
  editRequestId = makeRequestId("edit");
  editSubmitButton.disabled = false;
  editSubmitButton.querySelector("span").textContent = "บันทึกการแก้ไข";
  editSubmitButton.querySelector("small").textContent = "บันทึกเฉพาะออเดอร์ทดลอง";
  editCompleteNotice.hidden = true;
  editForm.classList.remove("edit-complete");
}

function ensureLegacyNameOption(select, name) {
  if (!name || [...select.options].some(option => option.value === name)) return;
  const option = document.createElement("option");
  option.value = name;
  option.textContent = name + " (ข้อมูลเดิม)";
  select.append(option);
}

function getLocalOrders() {
  try { return JSON.parse(localStorage.getItem(EDIT_ORDERS_KEY) || "[]"); } catch { return []; }
}
function setLocalOrders(orders) { localStorage.setItem(EDIT_ORDERS_KEY, JSON.stringify(orders)); }
function showMessage(text, success) {
  editMessage.textContent = text;
  editMessage.className = success ? "form-message success" : "form-message";
}
function addEditItem(item) {
  item = item || {};
  const row = document.createElement("div");
  row.className = "edit-item";
  row.innerHTML = "<label><span>สินค้า</span><input data-key=\"product\" value=\"" + escapeHtml(item.product || "") + "\" required></label>" +
    "<label><span>จำนวน</span><input data-key=\"quantity\" type=\"number\" min=\"0\" value=\"" + escapeHtml(item.quantity == null ? "" : item.quantity) + "\" required></label>" +
    "<label><span>หน่วย</span><input data-key=\"unit\" value=\"" + escapeHtml(item.unit || "") + "\"></label>" +
    "<label><span>แถม</span><input data-key=\"free\" type=\"number\" min=\"0\" value=\"" + escapeHtml(item.free == null ? "" : item.free) + "\"></label>" +
    "<label><span>ราคา/หน่วย</span><input data-key=\"price\" type=\"number\" min=\"0\" step=\"0.01\" value=\"" + escapeHtml(item.price == null ? "" : item.price) + "\"></label>" +
    "<button class=\"remove-edit-item\" type=\"button\" aria-label=\"ลบรายการ\">×</button>";
  row.querySelector(".remove-edit-item").addEventListener("click", () => row.remove());
  editItems.append(row);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[char]));
}
function readEditItems() {
  return [...editItems.querySelectorAll(".edit-item")].map(row => Object.fromEntries([...row.querySelectorAll("[data-key]")].map(input => [input.dataset.key, input.value.trim()])));
}
function fillOrder(order) {
  loadedOrder = order;
  resetEditSubmitState();
  document.querySelector("#loadedOrderId").textContent = order.orderId;
  ["shopName","province","district","subdistrict","deliveryDate","address","note"].forEach(key => { document.querySelector("#" + key).value = order[key] || ""; });
  const salesName = String(order.salesName || "").trim();
  const salesNameSelect = document.querySelector("#salesName");
  const editorNameSelect = document.querySelector("#editorName");
  ensureLegacyNameOption(salesNameSelect, salesName);
  ensureLegacyNameOption(editorNameSelect, salesName);
  salesNameSelect.value = salesName;
  editorNameSelect.value = "";
  editItems.innerHTML = "";
  (order.items || []).forEach(addEditItem);
  if (!editItems.children.length) addEditItem();
  editForm.hidden = false;
  editForm.scrollIntoView({ behavior:"smooth", block:"start" });
}
function jsonp() {
  return new Promise((resolve, reject) => {
    const callback = "experimentCallback_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const timer = setTimeout(() => { script.remove(); reject(new Error("timeout")); }, 10000);
    window[callback] = data => { clearTimeout(timer); delete window[callback]; script.remove(); resolve(data); };
    script.onerror = () => { clearTimeout(timer); delete window[callback]; script.remove(); reject(new Error("request failed")); };
    script.src = window.EXPERIMENT_CONFIG.apiUrl + "?action=findOrder&orderId=" + encodeURIComponent(orderIdInput.value.trim()) + "&callback=" + callback + "&_=" + Date.now();
    document.head.append(script);
  });
}
async function findOrder() {
  const orderId = orderIdInput.value.trim();
  if (!orderId) { showMessage("กรุณากรอกเลขที่ออเดอร์"); return; }
  searchButton.disabled = true;
  searchButton.querySelector("span").textContent = "กำลังค้นหา...";
  try {
    const order = window.EXPERIMENT_CONFIG.apiUrl ? (await jsonp()).order : getLocalOrders().find(item => item.orderId.toUpperCase() === orderId.toUpperCase());
    if (!order) { editForm.hidden = true; showMessage("ไม่พบเลขที่ออเดอร์ในชุดทดลอง"); return; }
    fillOrder(order);
    showMessage("พบออเดอร์แล้ว ตรวจข้อมูลก่อนบันทึก", true);
  } catch { showMessage("ค้นหาไม่สำเร็จ กรุณาตรวจ API ชุดทดลอง"); }
  finally { searchButton.disabled = false; searchButton.querySelector("span").textContent = "ค้นหาออเดอร์"; }
}
searchButton.addEventListener("click", findOrder);
orderIdInput.addEventListener("keydown", event => { if (event.key === "Enter") findOrder(); });
document.querySelector("#addEditItem").addEventListener("click", () => addEditItem());
editForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (editSubmitted) {
    showMessage("ออเดอร์นี้ส่งการแก้ไขแล้ว หากต้องการแก้อีกครั้งให้กดค้นหาออเดอร์ใหม่");
    editCompleteNotice.scrollIntoView({ behavior:"smooth", block:"center" });
    return;
  }
  if (!loadedOrder || !editItems.children.length || !editForm.reportValidity()) return;
  const originalSalesName = String(loadedOrder.salesName || "").trim();
  const editorName = document.querySelector("#editorName").value.trim();
  if (!originalSalesName) {
    showMessage("ออเดอร์นี้ไม่มีชื่อผู้กรอกเดิม กรุณาติดต่อผู้ดูแลระบบ");
    return;
  }
  if (editorName !== originalSalesName) {
    showMessage("ชื่อผู้แก้ไขต้องตรงกับชื่อเซลล์ผู้กรอกเดิม: " + originalSalesName);
    document.querySelector("#editorName").focus();
    return;
  }
  const updated = { ...loadedOrder, shopName:document.querySelector("#shopName").value.trim(), salesName:originalSalesName, editedBy:editorName, requestId:editRequestId, province:document.querySelector("#province").value.trim(), district:document.querySelector("#district").value.trim(), subdistrict:document.querySelector("#subdistrict").value.trim(), deliveryDate:document.querySelector("#deliveryDate").value.trim(), address:document.querySelector("#address").value.trim(), note:document.querySelector("#note").value.trim(), items:readEditItems(), updatedAt:new Date().toISOString() };
  editSubmitted = true;
  editSubmitButton.disabled = true;
  editSubmitButton.querySelector("span").textContent = "กำลังส่งการแก้ไข...";
  try {
    if (window.EXPERIMENT_CONFIG.apiUrl) await fetch(window.EXPERIMENT_CONFIG.apiUrl, { method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify({action:"updateOrder", ...updated}) });
    else setLocalOrders(getLocalOrders().map(item => item.orderId === updated.orderId ? updated : item));
    loadedOrder = updated;
    editForm.classList.add("edit-complete");
    editCompleteNotice.hidden = false;
    editSubmitButton.querySelector("span").textContent = "ส่งการแก้ไขแล้ว ✓";
    editSubmitButton.querySelector("small").textContent = "ปุ่มถูกล็อกเพื่อป้องกันการส่งซ้ำ";
    showMessage("ส่งการแก้ไขแล้ว ✓ ระบบป้องกันการส่งซ้ำเรียบร้อย", true);
    editCompleteNotice.scrollIntoView({ behavior:"smooth", block:"center" });
  } catch {
    editSubmitted = false;
    editSubmitButton.disabled = false;
    editSubmitButton.querySelector("span").textContent = "ลองบันทึกอีกครั้ง";
    showMessage("บันทึกไม่สำเร็จ กรุณาลองใหม่");
  }
});

const orderIdFromUrl = new URLSearchParams(window.location.search).get("orderId");
if (orderIdFromUrl) {
  orderIdInput.value = orderIdFromUrl;
  findOrder();
}
