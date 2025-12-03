// カート管理
let cart = [];

// 在庫管理（デフォルト値）
let inventory = {
    '百花蜜(300g)': 0,
    '百花蜜(500g)': 0
};

// スライドショー機能
function initSlideshow() {
    const images = document.querySelectorAll('.slideshow-image');
    const images2 = document.querySelectorAll('.slideshow-image2');

    if (images.length > 0) {
        let currentIndex = 0;
        setInterval(() => {
            images[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % images.length;
            images[currentIndex].classList.add('active');
        }, 5000);
    }

    if (images2.length > 0) {
        let currentIndex2 = 0;
        setInterval(() => {
            images2[currentIndex2].classList.remove('active');
            currentIndex2 = (currentIndex2 + 1) % images2.length;
            images2[currentIndex2].classList.add('active');
        }, 5000);
    }
}

// Googleスプレッドシートから在庫情報を取得
async function fetchInventoryFromGoogleSheets() {
    try {
        const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwRbc1QcZw4I7yR6j8OA91FXzi_d_O3XlbrOP8yNsNadjJrSKHF3JSk5UD0tk-j66maDg/exec';

        console.log('在庫情報を取得中...');
        const response = await fetch(GOOGLE_SHEETS_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('取得したデータ:', data);

        // 在庫データを更新
        Object.keys(data).forEach(productName => {
            if (data[productName] && typeof data[productName].stock !== 'undefined') {
                inventory[productName] = parseInt(data[productName].stock) || 0;
            }
        });

        console.log('更新後の在庫:', inventory);
        updateStockDisplay();

    } catch (error) {
        console.error('在庫情報の取得に失敗しました:', error);

        // エラー時は「確認中」と表示
        const stockElements = document.querySelectorAll('.stock-status');
        stockElements.forEach(element => {
            element.textContent = '在庫確認中...';
            element.className = 'stock-status';
        });
    }
}

// 在庫表示を更新
function updateStockDisplay() {
    const products = [
        { name: '百花蜜(300g)', stockId: 'stock-300g', btnId: 'btn-300g' },
        { name: '百花蜜(500g)', stockId: 'stock-500g', btnId: 'btn-500g' }
    ];

    products.forEach(product => {
        const stockElement = document.getElementById(product.stockId);
        const button = document.getElementById(product.btnId);
        const stock = inventory[product.name] || 0;

        if (stockElement && button) {
            if (stock > 0) {
                stockElement.textContent = `在庫あり（${stock}個）`;
                stockElement.className = 'stock-status';
                button.disabled = false;
                button.textContent = 'カートに追加';
            } else {
                stockElement.textContent = '在庫切れ';
                stockElement.className = 'stock-status out-of-stock';
                button.disabled = true;
                button.textContent = '在庫切れ';
            }
        }
    });
}

// カートに商品を追加
function addToCart(name, price) {
    // 在庫チェック
    const availableStock = inventory[name] || 0;

    console.log(`商品: ${name}, 在庫: ${availableStock}`);

    if (availableStock <= 0) {
        alert('申し訳ございません。この商品は在庫切れです。');
        return;
    }

    // カート内の同じ商品の数量を確認
    const existingItem = cart.find(item => item.name === name);
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    // 在庫数を超えていないかチェック
    if (currentQuantity >= availableStock) {
        alert(`申し訳ございません。この商品の在庫は${availableStock}個までです。`);
        return;
    }

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }

    updateCartDisplay();
    showAddToCartAnimation(event.target);
}

// カート表示を更新
function updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    if (totalItems > 0) {
        cartCount.style.display = 'flex';
    } else {
        cartCount.style.display = 'none';
    }
}

// カート追加時のアニメーション
function showAddToCartAnimation(button) {
    const originalText = button.textContent;
    const originalBackground = button.style.background;

    button.style.background = '#4CAF50';
    button.textContent = '追加しました！';

    setTimeout(() => {
        button.style.background = originalBackground;
        button.textContent = originalText;
    }, 1000);
}

// カート内の商品数量を変更
function updateCartQuantity(name, change) {
    const availableStock = inventory[name] || 0;
    const item = cart.find(item => item.name === name);

    if (!item) return;

    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
        // カートから削除
        cart = cart.filter(item => item.name !== name);
    } else if (newQuantity <= availableStock) {
        item.quantity = newQuantity;
    } else {
        alert(`在庫は${availableStock}個までです。`);
        return;
    }

    updateCartDisplay();
    openOrderForm(); // 表示を更新
}

// カートから商品を削除
function removeFromCart(name) {
    cart = cart.filter(item => item.name !== name);
    updateCartDisplay();
    openOrderForm(); // 表示を更新
}

// 注文フォームを開く
function openOrderForm() {
    const modal = document.getElementById('order-modal');
    const orderItems = document.getElementById('order-items');
    const orderTotal = document.getElementById('order-total');

    if (cart.length === 0) {
        orderItems.innerHTML = '<p class="empty-cart">商品が選択されていません</p>';
        orderTotal.textContent = '合計：¥0';
    } else {
        orderItems.innerHTML = cart.map(item => `
            <div class="order-item">
                <div class="item-info">
                    <strong>${item.name}</strong><br>
                    <small>¥${item.price.toLocaleString()}</small>
                </div>
                <div class="quantity-controls">
                    <button onclick="updateCartQuantity('${item.name}', -1)" class="qty-btn">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button onclick="updateCartQuantity('${item.name}', 1)" class="qty-btn">+</button>
                </div>
                <div class="item-total">¥${(item.price * item.quantity).toLocaleString()}</div>
                <button onclick="removeFromCart('${item.name}')" class="remove-btn" title="削除">🗑️</button>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = total >= 5000 ? 0 : 600;
        const finalTotal = total + shipping;

        orderTotal.innerHTML = `
            小計：¥${total.toLocaleString()}<br>
            送料：¥${shipping.toLocaleString()}<br>
            <strong>合計：¥${finalTotal.toLocaleString()}</strong>
        `;
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 注文フォームを閉じる
function closeOrderForm() {
    document.getElementById('order-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', function () {
    initSlideshow();
    fetchInventoryFromGoogleSheets();
    updateStockDisplay();
    initializeEventListeners();
});

// 定期的に在庫情報を更新（5分ごと）
setInterval(fetchInventoryFromGoogleSheets, 5 * 60 * 1000);

// イベントリスナーを初期化
function initializeEventListeners() {
    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // モーダルの外側クリックで閉じる
    document.getElementById('order-modal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeOrderForm();
        }
    });

    // セクションにホバーエフェクトを追加
    const sections = document.querySelectorAll('.product-card, .contact-card');
    sections.forEach(section => {
        section.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
        });

        section.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });
}

// 注文データをGoogleフォームに送信する準備
function prepareOrderForGoogleForm() {
    if (cart.length === 0) {
        alert('商品を選択してください。');
        return;
    }

    const orderData = {
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('pendingOrder', JSON.stringify(orderData));

    const formUrl = 'https://forms.google.com/[あなたのフォームID]';
    const orderSummary = cart.map(item =>
        `${item.name} × ${item.quantity} = ¥${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');

    const prefilledUrl = `${formUrl}?usp=pp_url&entry.123456=${encodeURIComponent(orderSummary)}`;

    return prefilledUrl;
}

// エラーハンドリング
window.addEventListener('error', function (e) {
    console.error('エラーが発生しました:', e.error);
});

// パフォーマンス最適化：画像の遅延読み込み
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            }
        });
    });

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    });
}

// Google Analytics tracking（オプション）
function trackEvent(action, category, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label
        });
    }
}