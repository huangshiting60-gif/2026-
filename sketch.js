// 預先準備的 7 個作品資料 (包含名稱與網址)
const works = [
  { name: 'Week 1', url: './week1/index.html' },
  { name: 'Week 2', url: './week2/index.html' },
  { name: 'Week 3', url: './week3/index.html' },
  { name: 'Week 4', url: './week4/index.html' },
  { name: 'Week 5', url: './week5/index.html' },
  { name: 'Week 6', url: './week6/index.html' },
  { name: 'Week 7', url: './week7/index.html' }
];

let gashapons = [];

// --- 響應式佈局與縮放變數 ---
let machineX, machineY, machineScale;

// --- 背景裝飾變數 (改為遊樂園元素) ---
let bgElements = [];

// --- 背景顏色漸變變數 ---
let currentTopColor, currentBottomColor;
let targetTopColor, targetBottomColor;

// --- 手把動畫變數 ---
let handleAngle = 0;
let isHandleAnimating = false;
const HANDLE_ANIMATION_SPEED = 0.25; // 控制手把旋轉速度
let isFirstGachaDrawn = false; // 新增：記錄是否已經抽出第一顆扭蛋

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  
  // 美化：設定更柔和的顏色
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";

  // 初始化背景漸層顏色
  currentTopColor = color('#ffe5d9'); // powder-petal
  currentBottomColor = color('#d8e2dc'); // alabaster-grey-2
  targetTopColor = currentTopColor;
  targetBottomColor = currentBottomColor;
  
  // 網頁整合 (Iframe): 如果畫面中還沒有 #work-display，就幫忙動態生成並排版
  let iframe = select('#work-display');
  if (!iframe) {
    // 修正：直接取用 HTML 中已預留的隱藏容器
    let container = select('#canvas-container');
    container.style('position', 'relative'); // 確保內部絕對定位生效
    
    // 將 Canvas 放入容器
    canvas.parent(container);
    
    // 創建 Iframe
    iframe = createElement('iframe');
    iframe.id('work-display');
    iframe.parent(container);
    iframe.style('border', 'none'); // 美化：移除 iframe 邊框
    
    // 初始化：將 iframe 藏在右側畫面外，並加入滑動動畫
    iframe.style('position', 'absolute');
    iframe.style('top', '0');
    iframe.style('right', '0');
    iframe.style('transform', 'translateX(100%)'); // 一開始隱藏到畫面外
    iframe.style('transition', 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)'); // 平滑滑動過渡
    iframe.style('background', '#fff'); // 避免白底透明
    iframe.style('box-shadow', '-5px 0 20px rgba(0,0,0,0.15)'); // 加入一點陰影增加層次感
  }

  setupLayout();
  resetGashapons();

  // 建立左側快速選單的按鈕
  let menu = select('#work-menu');
  if (menu) {
    works.forEach((w, i) => {
      let btn = createButton(w.name);
      btn.class('work-btn');
      btn.parent(menu);
      // 點擊選單按鈕時，強制轉出該週的作品
      btn.mousePressed(() => forceDrawGashapon(i));
    });
  }
}

// 負責計算所有響應式佈局的函式
function setupLayout() {
  // 畫布始終保持滿版
  resizeCanvas(windowWidth, windowHeight);

  // 調整 iframe 樣式
  select('#work-display')
    .style('width', `60vw`)
    .style('height', `${windowHeight}px`);

  // 計算扭蛋機的中心位置與縮放比例
  // 如果還沒抽過扭蛋，機器在正中間 (50%)；抽過後，放到左側 40% 的正中間 (即 20%)
  let targetX = isFirstGachaDrawn ? windowWidth * 0.2 : windowWidth * 0.5;
  machineX = targetX; // 當視窗重置大小時，直接讓機器到定位
  machineY = height / 1.8; // 將機器稍微往下放
  // 根據左側 40% 的畫布寬度和高度來決定縮放，確保機器大小始終一致
  machineScale = min((windowWidth * 0.4) / 400, height / 550);

  // 初始化背景裝飾元素
  bgElements = [];
  let colors = ['#fec5bb', '#fcd5ce', '#fae1dd', '#e8e8e4', '#ece4db', '#ffd7ba', '#fec89a'];
  for (let i = 0; i < 35; i++) {
    let c = color(random(colors));
    c.setAlpha(150); // 設定半透明
    bgElements.push({
      type: random(['balloon', 'star', 'cloud', 'confetti']),
      x: random(width),
      y: random(height),
      s: random(0.5, 1.5) * machineScale,
      speed: random(0.3, 1.2) * machineScale,
      color: c,
      angle: random(TWO_PI),
      rotSpeed: random(-0.02, 0.02)
    });
  }
}

// 重設/初始化所有扭蛋
function resetGashapons() {
  gashapons = []; // 清空陣列

  let colors = [
    color('#fec5bb'), // powder-blush
    color('#fcd5ce'), // almond-silk
    color('#fae1dd'), // soft-blush
    color('#e8e8e4'), // alabaster-grey
    color('#ece4db'), // linen
    color('#ffd7ba'), // peach-fuzz
    color('#fec89a')  // peach-glow
  ];

  for (let i = 0; i < works.length; i++) {
    // 在扭蛋機的相對位置生成扭蛋，並轉換為全域座標
    let startX = machineX + random(-50, 50) * machineScale;
    let startY = machineY - 50 * machineScale + random(-20, 20) * machineScale;
    gashapons.push(new Gashapon(startX, startY, colors[i], works[i]));
  }
}

function windowResized() {
  setupLayout();
  resetGashapons();
}

// 美化：繪製漸層背景
function drawGradientBackground() {
  // 緩動更新當前背景色，製造平滑的漸變動畫
  currentTopColor = lerpColor(currentTopColor, targetTopColor, 0.03);
  currentBottomColor = lerpColor(currentBottomColor, targetBottomColor, 0.03);
  
  // 效能優化：每 2 像素畫一條線來繪製漸層
  for (let i = 0; i < height; i += 2) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(currentTopColor, currentBottomColor, inter);
    stroke(c);
    strokeWeight(2);
    line(0, i, width, i);
  }

  // 加入遠景的摩天輪與馬戲團帳篷
  drawFerrisWheel();
  drawCircusTent();

  // 繪製背景裝飾元素
  for (let i = 0; i < bgElements.length; i++) {
    let b = bgElements[i];
    
    push();
    translate(b.x, b.y);
    rotate(b.angle);
    scale(b.s);
    
    fill(b.color);
    noStroke();
    
    if (b.type === 'balloon') {
      // 氣球
      ellipse(0, 0, 30, 40);
      triangle(0, 20, -5, 25, 5, 25);
      stroke(255, 150);
      strokeWeight(1);
      noFill();
      line(0, 25, 0, 50);
      // 氣球高光
      noStroke();
      fill(255, 255, 255, 150);
      ellipse(-5, -8, 8, 12);
    } else if (b.type === 'star') {
      // 星星
      drawStar(0, 0, 10, 20, 5);
    } else if (b.type === 'cloud') {
      // 雲朵
      fill(255, 255, 255, 120); // 雲朵固定用白色半透明
      ellipse(0, 0, 60, 20);
      ellipse(-15, -10, 30, 30);
      ellipse(15, -5, 25, 25);
    } else if (b.type === 'confetti') {
      // 彩紙碎
      rectMode(CENTER);
      rect(0, 0, 15, 8, 3);
    }
    pop();
    
    b.y -= b.speed; // 向上漂浮
    if (b.type !== 'cloud' && b.type !== 'balloon') {
      b.angle += b.rotSpeed; // 旋轉
    } else {
      b.angle = sin(frameCount * 0.02 + i) * 0.1; // 微微搖擺
    }
    
    b.x += sin(frameCount * 0.02 + i) * 0.5; 
    
    // 飄出畫面頂部後，從底部重新生成
    if (b.y < -50 * b.s) {
      b.y = height + 50 * b.s;
      b.x = random(width);
    }
  }
}

// 繪製星星的輔助函式
function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// 繪製背景摩天輪
function drawFerrisWheel() {
  push();
  // 將摩天輪放在畫面右側偏下
  let fwX = width * 0.85;
  let fwY = height * 0.7;
  let fwScale = machineScale * 1.5;
  
  translate(fwX, fwY);
  scale(fwScale);
  
  // 摩天輪支架
  stroke('#d8e2dc'); // 使用灰白色
  strokeWeight(8);
  line(0, 0, -100, 300);
  line(0, 0, 100, 300);
  
  // 輪軸旋轉
  let fwAngle = frameCount * 0.002;
  rotate(fwAngle);
  
  // 摩天輪的骨架
  stroke('#ece4db');
  strokeWeight(4);
  noFill();
  circle(0, 0, 360);
  circle(0, 0, 180);
  
  for (let i = 0; i < 12; i++) {
    push();
    let a = i * TWO_PI / 12;
    rotate(a);
    line(0, 0, 0, -180);
    
    // 車廂
    translate(0, -180);
    rotate(-fwAngle - a); // 讓車廂保持正向
    noStroke();
    // 給車廂不同的粉色
    let cabinColors = ['#fec5bb', '#fcd5ce', '#fae1dd', '#ffd7ba', '#fec89a'];
    fill(cabinColors[i % cabinColors.length]);
    rectMode(CENTER);
    rect(0, 10, 35, 30, 5);
    fill('#ffffff'); // 車廂窗戶
    rect(0, 5, 25, 10, 2);
    fill(cabinColors[(i+1) % cabinColors.length]); // 頂蓋
    arc(0, -5, 35, 30, PI, TWO_PI);
    pop();
  }
  
  // 中心點
  fill('#fec89a');
  noStroke();
  circle(0, 0, 40);
  fill('#ffffff');
  circle(0, 0, 15);
  
  pop();
}

// 繪製背景馬戲團帳篷
function drawCircusTent() {
  push();
  // 放在畫面左側偏下
  let tentX = width * 0.15;
  let tentY = height * 0.75;
  let tentScale = machineScale * 1.5;
  
  translate(tentX, tentY);
  scale(tentScale);
  
  noStroke();
  
  // 帳篷底部主體
  fill('#f8edeb'); // seashell
  beginShape();
  vertex(-100, 0);
  vertex(100, 0);
  vertex(90, -100);
  vertex(-90, -100);
  endShape(CLOSE);
  
  // 帳篷紅白條紋 (粉色系)
  fill('#fae1dd'); // soft-blush
  beginShape();
  vertex(-50, 0);
  vertex(-10, 0);
  vertex(-20, -100);
  vertex(-60, -100);
  endShape(CLOSE);
  
  beginShape();
  vertex(10, 0);
  vertex(50, 0);
  vertex(60, -100);
  vertex(20, -100);
  endShape(CLOSE);
  
  // 帳篷屋頂
  fill('#fec5bb'); // powder-blush
  triangle(-110, -100, 110, -100, 0, -200);
  
  // 屋頂旗幟
  stroke('#d28c8c');
  strokeWeight(2);
  line(0, -200, 0, -250);
  noStroke();
  fill('#ffd7ba');
  triangle(0, -250, 30, -235, 0, -220);
  
  // 帳篷門
  fill('#d28c8c');
  arc(0, 0, 40, 60, PI, TWO_PI);
  
  pop();
}

function draw() {
  drawGradientBackground();

  // 新增：處理扭蛋機從中央滑動到左側的過渡動畫
  let targetMachineX = isFirstGachaDrawn ? windowWidth * 0.2 : windowWidth * 0.5;
  let oldMachineX = machineX;
  machineX = lerp(machineX, targetMachineX, 0.08); // 平滑移動
  let shiftX = machineX - oldMachineX;
  if (abs(shiftX) > 0.01) {
    for (let g of gashapons) g.x += shiftX; // 讓現存扭蛋跟著機器一起移動
  }

  // 美化：加入標題
  push();
  fill('#b5838d'); // 搭配主題的深粉棕色
  noStroke();
  textSize(24 * machineScale);
  textAlign(CENTER, CENTER);
  text("🎡 夢幻遊樂園扭蛋機 🎪", machineX, machineY - 230 * machineScale);
  pop();

  // --- 繪製扭蛋機本體 (使用相對座標與縮放) ---
  push();
  translate(machineX, machineY);
  scale(machineScale);

  // 美化：為本體加上陰影
  drawingContext.shadowBlur = 25 * machineScale;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.25)';
  drawingContext.shadowOffsetY = 5 * machineScale;

  // 1. 畫下方的紅色底座 (使用相對 vertex)
  fill('#fec89a'); // peach-glow 主體
  stroke('#d28c8c');
  strokeWeight(2);
  beginShape();
  vertex(-80, 0);   // 原 (120, 250)
  vertex(80, 0);    // 原 (280, 250)
  vertex(110, 140); // 原 (310, 390)
  vertex(-110, 140);// 原 (90, 390)
  endShape(CLOSE);

  // 裝飾用：扭蛋出口
  fill('#ece4db'); // linen 內部
  stroke('#d28c8c');
  beginShape();
  vertex(-40, 90);  // 原 (160, 340)
  vertex(40, 90);   // 原 (240, 340)
  vertex(40, 130);  // 原 (240, 380)
  vertex(-40, 130); // 原 (160, 380)
  endShape(CLOSE);

  // 畫出「轉動手把」(圓形) - 加入旋轉動畫
  push();
  translate(0, 65); // 1. 將圓心移動到手把的相對位置 (原 315-250)

  // 如果正在播放動畫，就持續增加角度
  if (isHandleAnimating) {
    handleAngle += HANDLE_ANIMATION_SPEED;
    if (handleAngle >= TWO_PI) { // TWO_PI 代表 360 度
      handleAngle = 0; // 轉完一圈後歸零
      isHandleAnimating = false; // 停止動畫
    }
  }
  rotate(handleAngle); // 2. 根據角度旋轉

  fill('#ffd7ba'); // peach-fuzz 轉把
  stroke('#d28c8c');
  strokeWeight(2);
  circle(0, 0, 20 * 2); // 3. 在 (0,0) 畫出手把 (原半徑 20)
  fill('#d28c8c');
  noStroke();
  circle(-8, 0, 6); // 4. 畫出手把上的細節，它會跟著旋轉
  pop();

  // 美化：清除陰影，避免影響玻璃
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetY = 0;

  // 2. 畫上方的透明半圓形儲存槽（背景）
  fill(255, 255, 255, 80); // 玻璃透明感
  stroke(255, 255, 255, 150);
  strokeWeight(3);
  beginShape();
  for (let a = PI; a <= TWO_PI; a += 0.05) {
    // 使用相對座標與半徑 95
    let x = 0 + 95 * cos(a);
    let y = 0 + 95 * sin(a);
    vertex(x, y);
  }
  vertex(95, 0); // 原 (295, 250)
  vertex(-95, 0); // 原 (105, 250)
  endShape(CLOSE);

  // 美化：在玻璃上加上高光
  noFill();
  stroke(255, 255, 255, 90);
  strokeWeight(15);
  arc(-35, -40, 100, 50, PI + 0.8, PI + 1.4);

  pop(); // --- 結束扭蛋機本體繪製 ---

  // 3. 更新並顯示所有扭蛋物件 (在全域座標中)
  for (let i = 0; i < gashapons.length; i++) {
    gashapons[i].update();
    gashapons[i].display();
  }
}

function mousePressed() {
  // 互動邏輯：當滑鼠點擊手把範圍時
  // 計算手把在全域座標中的位置與半徑
  let handleGlobalY = machineY + (315 - 250) * machineScale;
  let handleGlobalR = 20 * machineScale;
  let d = dist(mouseX, mouseY, machineX, handleGlobalY);

  // 加上 !isHandleAnimating 判斷，避免在動畫播放中重複觸發
  if (d < handleGlobalR && !isHandleAnimating) {
    isHandleAnimating = true; // 開始播放動畫

    // 如果是第一次抽扭蛋，將右側作品畫面滑入！
    if (!isFirstGachaDrawn) {
      isFirstGachaDrawn = true;
      select('#work-display').style('transform', 'translateX(0%)');
      document.getElementById('work-menu').style.left = '0px'; // 讓左側選單也跟著滑入
    }

    // 使用 for 迴圈遍歷 array，讓所有扭蛋產生震動位移
    for (let i = 0; i < gashapons.length; i++) {
      // 只搖晃還在機器內部的扭蛋
      if (gashapons[i].state === 'inside') {
        gashapons[i].shake();
      }
    }

    // 1. 找出所有在機器內的扭蛋
    const availableGashapons = gashapons.filter(g => g.state === 'inside');

    // 2. 如果還有可用的扭蛋，就隨機選一顆出來
    if (availableGashapons.length > 0) {
      const selectedGashapon = random(availableGashapons);
      
      // 3. 讓被選中的扭蛋開始掉落
      selectedGashapon.startFalling();
      
      // 4. 更新 iframe 的網址
      select('#work-display').attribute('src', selectedGashapon.url);
      
      // 更新選單的亮起狀態
      let selectedIndex = works.findIndex(w => w.name === selectedGashapon.name);
      updateMenuActive(selectedIndex);

      // 5. 根據扭蛋顏色設定新的目標背景色 (混合大量白色以保持背景柔和不刺眼)
      targetTopColor = lerpColor(selectedGashapon.color, color('#f8edeb'), 0.5);
      targetBottomColor = lerpColor(selectedGashapon.color, color('#d8e2dc'), 0.5);
    }
  }
}

// --- 點擊左側選單強制轉出特定扭蛋 ---
function forceDrawGashapon(index) {
  if (isHandleAnimating) return; // 如果正在轉動中就先忽略點擊
  isHandleAnimating = true; // 啟動把手旋轉動畫

  // 如果是第一次抽，把右邊畫面跟左邊選單滑進來
  if (!isFirstGachaDrawn) {
    isFirstGachaDrawn = true;
    select('#work-display').style('transform', 'translateX(0%)');
    document.getElementById('work-menu').style.left = '0px';
  }

  let targetGacha = gashapons[index];

  // 如果指定的扭蛋已經掉出來了，強制把它放回機器裡以便重新掉落
  if (targetGacha.state !== 'inside') {
    targetGacha.reset();
  }
  
  // 搖晃所有在機器內部的扭蛋
  for (let i = 0; i < gashapons.length; i++) {
    if (gashapons[i].state === 'inside') gashapons[i].shake();
  }
  
  targetGacha.startFalling();
  select('#work-display').attribute('src', targetGacha.url);
  targetTopColor = lerpColor(targetGacha.color, color('#f8edeb'), 0.5);
  targetBottomColor = lerpColor(targetGacha.color, color('#d8e2dc'), 0.5);
  
  updateMenuActive(index);
}

// --- 更新選單按鈕的啟用狀態 (亮起/反白) ---
function updateMenuActive(index) {
  let btns = document.querySelectorAll('.work-btn');
  btns.forEach((btn, i) => {
    if(i === index) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

// 定義扭蛋 Gashapon Class
class Gashapon {
  constructor(x, y, col, work) {
    this.x = x;
    this.y = y;
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.color = col;
    this.url = work.url;
    this.name = work.name;
    this.r = 15 * machineScale; // 扭蛋半徑也需要縮放
    this.state = 'inside'; // 扭蛋狀態: 'inside', 'falling', 'at_exit'
    this.timer = 0; // 用於控制掉落後的停留時間
    this.exitY = 0; // 儲存出口的 Y 座標，用於彈跳
    this.angle = random(TWO_PI); // 記錄扭蛋旋轉的角度
  }

  update() {
    // 如果扭蛋正在掉落，執行獨立的掉落動畫邏輯
    if (this.state === 'falling') {
      // 讓扭蛋朝著出口中心點移動
      let targetX = machineX;
      this.x += (targetX - this.x) * 0.08;

      // 加速下墜
      this.vy += 1.2;
      this.y += this.vy;
      this.angle += 0.2; // 掉落時持續旋轉

      // 掉落到出口位置時停止並改變狀態
      let stopY = machineY + 110 * machineScale;
      if (this.y >= stopY) {
        this.y = stopY;
        this.exitY = stopY; // 記錄下停止時的 Y 座標
        this.state = 'at_exit';
        this.timer = 120; // 停留約 2 秒 (以 60fps 計算)，讓特效更明顯
      }
      return; // 跳過後續的一般物理運算
    }

    // 如果扭蛋停留在出口
    if (this.state === 'at_exit') {
      // --- 微微彈跳特效 ---
      let bounceSpeed = 0.1;
      let bounceHeight = 3 * machineScale;
      this.y = this.exitY + sin(frameCount * bounceSpeed) * bounceHeight;

      this.timer--;
      if (this.timer <= 0) {
        this.reset();
      }
      return; // 停留時不執行一般物理運算
    }

    // 簡單重力邏輯
    this.vy += 0.6; // 重力加速度
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.vx * 0.05; // 依照水平移動速度產生滾動旋轉

    // 碰撞底部邏輯 (平底 y = 250)
    let bottomY = machineY; // 機器底座的 Y 座標
    if (this.y + this.r > bottomY) {
      this.y = bottomY - this.r;
      this.vy *= -0.75; // 彈力係數
      this.vx *= 0.9;   // 地面摩擦力
    }

    // 限制在玻璃圓頂內
    let cx = machineX;
    let cy = machineY;
    let domeR = 95 * machineScale; // 圓頂的縮放後半徑

    let d = dist(this.x, this.y, cx, cy);
    if (d + this.r > domeR && this.y < bottomY) {
      // 如果超出半圓形，將其往內推並反轉速度
      let angle = atan2(this.y - cy, this.x - cx);
      this.x = cx + (domeR - this.r) * cos(angle);
      this.y = cy + (domeR - this.r) * sin(angle);
      this.vx *= -0.8;
      this.vy *= -0.8;
    }
  }

  display() {
    // --- 特效：如果在出口，就加入發光效果 ---
    if (this.state === 'at_exit') {
      // 複製一份顏色來設定透明度，避免影響原始顏色
      let glowColor = color(hue(this.color), saturation(this.color), brightness(this.color), 0.6 * 255);
      // 使用 sin() 讓光暈產生呼吸感
      drawingContext.shadowBlur = 15 + sin(frameCount * 0.15) * 10;
      drawingContext.shadowColor = glowColor;
    }

    // --- 繪製立體質感的扭蛋本體 ---
    push();
    translate(this.x, this.y);
    rotate(this.angle); // 跟隨物理碰撞旋轉

    stroke('#d28c8c');
    strokeWeight(1);

    // 1. 畫下半部 (有顏色的塑膠殼)
    fill(this.color);
    arc(0, 0, this.r * 2, this.r * 2, 0, PI, CHORD);

    // 2. 畫上半部 (透明白色的塑膠殼)
    fill(255, 255, 255, 210);
    arc(0, 0, this.r * 2, this.r * 2, PI, TWO_PI, CHORD);

    // 3. 畫中間的凸起環帶 (結合線)
    fill('#ece4db');
    rectMode(CENTER);
    rect(0, 0, this.r * 2, this.r * 0.15, this.r * 0.1);
    pop();

    // --- 清除特效，避免影響後續繪圖 ---
    drawingContext.shadowBlur = 0;

    // 如果在出口，就顯示作品名稱標籤 (它會跟著彈跳)
    if (this.state === 'at_exit') {
      this.drawNameTag();
    }

    // --- 繪製不跟隨旋轉的立體高光 (模擬上方固定光源的玻璃反光) ---
    push();
    translate(this.x - this.r * 0.3, this.y - this.r * 0.3);
    rotate(-PI / 4);
    fill(255, 255, 255, 180);
    noStroke();
    ellipse(0, 0, this.r * 0.6, this.r * 0.25);
    pop();
  }

  shake() {
    // 賦予向上的強烈速度與隨機水平速度，模擬扭蛋機轉動翻攪的效果
    this.vy = random(-8, -14);
    this.vx = random(-6, 6);
  }

  startFalling() {
    this.state = 'falling';
    this.vx = 0;
    this.vy = 0;
  }

  reset() {
    this.state = 'inside';
    // 將扭蛋重設到玻璃罩上方，讓它重新自然落下
    this.x = machineX + random(-40, 40) * machineScale;
    this.y = machineY - (100 + random(20)) * machineScale;
    this.vx = random(-1, 1);
    this.vy = 0;
  }

  drawNameTag() {
    push();
    
    // --- 計算標籤位置與樣式 ---
    let tagX = this.x + this.r * 1.5;
    let tagY = this.y;
    let textSizeValue = 14 * machineScale;
    let padding = 8 * machineScale;

    // --- 繪製標籤背景 ---
    textSize(textSizeValue);
    let textW = textWidth(this.name);
    fill(255, 255, 255, 220); // 半透明白色背景
    stroke(180);
    strokeWeight(1);
    rect(tagX, tagY - (textSizeValue / 2 + padding), textW + padding * 2, textSizeValue + padding * 2, 5 * machineScale);

    // --- 繪製文字 ---
    fill('#8a6b5d');
    noStroke();
    textAlign(LEFT, CENTER);
    text(this.name, tagX + padding, tagY);
    pop();
  }
}
