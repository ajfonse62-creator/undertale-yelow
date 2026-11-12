// 1. ФОНОВЫЙ ШЕЙДЕР (Психоделические волны в стиле EarthBound / Undertale)
const bgCanvas = document.getElementById('shader-bg');
const ctx = bgCanvas.getContext('2d');
bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight;
let t = 0;

function drawShader() {
    t += 0.03;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    for (let i = 0; i < 15; i++) {
        ctx.strokeStyle = `hsl(${(t * 20 + i * 20) % 360}, 70%, 30%)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < bgCanvas.width; x += 20) {
            let y = bgCanvas.height / 2 + Math.sin(x * 0.01 + t + i) * 120 * Math.cos(t * 0.5);
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    requestAnimationFrame(drawShader);
}
drawShader();

// 2. МЕХАНИКА БОЯ UNDERTALE YELLOW
const box = document.getElementById('battle-box');
const soul = document.getElementById('soul');
let hp = 20, soulX = 140, soulY = 100, isDefending = false;
let keys = {}, bullets = [], hazards = [];

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    // Стрельба желтой души на Z или Enter
    if ((e.code === 'KeyZ' || e.code === 'Enter') && isDefending) shoot();
    // Запуск музыки при первом нажатии
    document.getElementById('bgm').play().catch(() => {});
});
window.addEventListener('keyup', e => keys[e.code] = false);

function shoot() {
    if (bullets.length > 3) return; // Ограничение на 4 пули на экране
    const b = document.createElement('img');
    b.src = 'bullet.png'; b.className = 'bullet';
    b.style.left = (soulX + 5) + 'px'; b.style.top = (soulY - 15) + 'px';
    box.appendChild(b);
    bullets.push({ el: b, x: soulX + 5, y: soulY - 15 });
}

function startTurn(action) {
    if (isDefending) return;
    document.getElementById('bgm').play().catch(() => {});
    if (action === 'item') {
        hp = Math.min(20, hp + 10); updateHP();
    }
    isDefending = true;
    let attackTimer = 0;
    
    // Запуск волн атак босса (8 секунд)
    const waveInterval = setInterval(() => {
        attackTimer++;
        spawnAttack(attackTimer);
        if (attackTimer >= 16) {
            clearInterval(waveInterval);
            setTimeout(endTurn, 1500);
        }
    }, 500);
}

function spawnAttack(step) {
    // Чередуем круговые снаряды и препятствия из черной полосы
    if (step % 4 === 0) {
        const bar = document.createElement('img');
        bar.src = 'bar.png'; bar.className = 'enemy-bar';
        let w = 140; bar.style.width = w + 'px';
        let startX = Math.random() > 0.5 ? 0 : 160;
        bar.style.left = startX + 'px'; bar.style.top = '0px';
        box.appendChild(bar);
        hazards.push({ el: bar, x: startX, y: 0, w: w, h: 16, vy: 3, breakable: true });
    } else {
        const p = document.createElement('div');
        p.className = 'enemy-proj';
        let startX = Math.random() * 280;
        p.style.left = startX + 'px'; p.style.top = '0px';
        box.appendChild(p);
        hazards.push({ el: p, x: startX, y: 0, w: 12, h: 12, vy: 4, breakable: false });
    }
}

function endTurn() {
    isDefending = false;
    hazards.forEach(h => h.el.remove()); hazards = [];
    bullets.forEach(b => b.el.remove()); bullets = [];
}

function updateHP() {
    document.getElementById('hp-fill').style.width = (hp / 20 * 100) + '%';
    document.getElementById('hp-text').textContent = `${hp}/20`;
    if (hp <= 0) { alert("GAME OVER! Душа раскололась."); location.reload(); }
}

// Главный игровой цикл (60 FPS)
function gameLoop() {
    if (isDefending) {
        let speed = keys['ShiftLeft'] ? 2 : 4; // Замедление на Shift как в UT
        if (keys['ArrowLeft'] && soulX > 0) soulX -= speed;
        if (keys['ArrowRight'] && soulX < 280) soulX += speed;
        if (keys['ArrowUp'] && soulY > 0) soulY -= speed;
        if (keys['ArrowDown'] && soulY < 200) soulY += speed;
        soul.style.left = soulX + 'px'; soul.style.top = soulY + 'px';

        // Движение выстрелов игрока
        for (let i = bullets.length - 1; i >= 0; i--) {
            let b = bullets[i]; b.y -= 8; b.el.style.top = b.y + 'px';
            if (b.y < -20) { b.el.remove(); bullets.splice(i, 1); }
        }

        // Движение атак босса и проверка столкновений
        for (let i = hazards.length - 1; i >= 0; i--) {
            let h = hazards[i]; h.y += h.vy; h.el.style.top = h.y + 'px';

            // Проверка попадания пули игрока по разрушаемой полосе (bar.png)
            if (h.breakable) {
                for (let j = bullets.length - 1; j >= 0; j--) {
                    let b = bullets[j];
                    if (b.x < h.x + h.w && b.x + 10 > h.x && b.y < h.y + h.h && b.y + 22 > h.y) {
                        h.el.remove(); hazards.splice(i, 1);
                        b.el.remove(); bullets.splice(j, 1);
                        break;
                    }
                }
            }

            // Проверка урона по душе
            if (soulX < h.x + h.w && soulX + 18 > h.x && soulY < h.y + h.h && soulY + 18 > h.y) {
                hp = Math.max(0, hp - 4); updateHP();
                h.el.remove(); hazards.splice(i, 1);
            } else if (h.y > 230) {
                h.el.remove(); hazards.splice(i, 1);
            }
        }
    }
    requestAnimationFrame(gameLoop);
}
gameLoop();
