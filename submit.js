const submitButton = form.querySelector(".submit-button");
const LOCAL_ORDERS_KEY = "mulriver-order-experiment-orders-v1";
const CREATE_REQUEST_KEY = "mulriver-order-experiment-create-request-v1";

function makeCreateRequestId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return "create-" + window.crypto.randomUUID();
  return "create-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}
function getCreateRequestId() {
  let requestId = sessionStorage.getItem(CREATE_REQUEST_KEY);
  if (!requestId) {
    requestId = makeCreateRequestId();
    sessionStorage.setItem(CREATE_REQUEST_KEY, requestId);
  }
  return requestId;
}

form.addEventListener("reset", () => {
  sessionStorage.removeItem(CREATE_REQUEST_KEY);
  submitButton.disabled = false;
  submitButton.querySelector("span").textContent = "ยืนยันส่งออเดอร์";
  submitButton.querySelector("small").textContent = "ตรวจครบแล้วกดส่งได้เลย";
});

function readExperimentOrders() {
  try { return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || "[]"); } catch { return []; }
}
function writeExperimentOrders(orders) { localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders)); }
function makeExperimentOrderId() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return "T-" + stamp + "-" + suffix;
}
function makePayload() {
  const values = Object.fromEntries(new FormData(form));
  return { requestId:getCreateRequestId(), salesName:values.salesName, shopName:values.shopName, province:values.province, district:values.district, subdistrict:values.subdistrict, address:values.address, deliveryDate:values.deliveryDate, note:values.note, rawOrder:values.rawOrder || "", items:getItems() };
}
async function saveToExperiment(payload) {
  if (API_URL) {
    await fetch(API_URL, { method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify({action:"saveOrder", ...payload}) });
    return { orderId:"ส่งเข้า API ชุดทดลองแล้ว" };
  }
  const now = new Date().toISOString();
  const order = { orderId:makeExperimentOrderId(), createdAt:now, updatedAt:now, ...payload };
  const orders = readExperimentOrders();
  orders.unshift(order);
  writeExperimentOrders(orders.slice(0, 200));
  return order;
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!getItems().length || !form.checkValidity() || !getProvince() || !getDistrict() || !getSubdistrict()) return;
  const payload = makePayload();
  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = "กำลังบันทึก...";
  formMessage.className = "form-message";
  formMessage.textContent = "กำลังบันทึกในชุดทดลอง";
  try {
    const order = await saveToExperiment(payload);
    window.rememberShop?.({name:payload.shopName, province:payload.province, district:payload.district, subdistrict:payload.subdistrict});
    formMessage.innerHTML = API_URL ? "ส่งออเดอร์แล้ว ✓ ระบบล็อกปุ่มเพื่อป้องกันการส่งซ้ำ" : "บันทึกออเดอร์ทดลองแล้ว เลขที่ <strong>" + esc(order.orderId) + "</strong> — ระบบล็อกปุ่มเพื่อป้องกันการส่งซ้ำ";
    formMessage.classList.add("success");
    submitButton.querySelector("span").textContent = "บันทึกแล้ว ✓";
    submitButton.querySelector("small").textContent = "ปุ่มถูกล็อกเพื่อป้องกันการส่งซ้ำ";
  } catch {
    formMessage.textContent = "บันทึกไม่สำเร็จ กรุณาลองใหม่";
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "ลองบันทึกอีกครั้ง";
    submitButton.querySelector("small").textContent = "ยังไม่ได้บันทึก สามารถลองใหม่ได้";
  }
  formMessage.scrollIntoView({ behavior:"smooth", block:"center" });
});
