// カート管理
let cart = [];

// 在庫管理（デフォルト値）
let inventory = {
    '百花蜜（300g）': 0,
    '百花蜜（500g）': 0,
    // 'ギフトセット': 0
};

// スライドショー機能
function initSlideshow() {
    const images = document.querySelectorAll('.slideshow-image');
    const images2 = document.querySelectorAll('.slideshow-image2');
    if (images.length === 0) return; // 画像がない場合は実行しない

    let currentIndex = 0;

    setInterval(() => {
        images[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.add('active');
    }, 5000); // 3秒ごとに切り替え

    if (images2.length === 0) return; // 画像がない場合は実行しない

    let currentIndex2 = 0;

    setInterval(() => {
        images2[currentIndex2].classList.remove('active');
        currentIndex2 = (currentIndex2 + 1) % images2.length;
        images2[currentIndex2].classList.add('active');
    }, 5000); // 3秒ごとに切り替え
}

// Googleスプレッドシートから在庫情報を取得する関数
async function fetchInventoryFromGoogleSheets() {
    try {
        // ここに先ほどコピーしたウェブアプリのURLを貼り付け
        const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx29hGNaB45ejDkSoFeNm3vVLX00MWaTTf8Ii4hoYYq61rdUN11z1SDijAqSv3eY6SLyQ/exec';

        const response = await fetch(GOOGLE_SHEETS_URL);

        if (!response.ok) {
            throw new Error('在庫データの取得に失敗しました');
        }

        const data = await response.json();

        // 在庫データを更新
        Object.keys(data).forEach(productName => {
            inventory[productName] = data[productName].stock;
        });

        updateStockDisplay();
        console.log('在庫情報を更新しました:', inventory);

    } catch (error) {
        console.error('在庫情報の取得に失敗しました:', error);

        // エラー時のフォールバック（デフォルト在庫）
        Object.assign(inventory, {
            '百花蜜（300g）': 0,
            '百花蜜（500g）': 0,
            // 'ギフトセット': 0
        });
        updateStockDisplay();
    }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', function () {
    initSlideshow(); // スライドショー開始
    fetchInventoryFromGoogleSheets(); // 初回取得
    updateStockDisplay();
    initializeEventListeners();
});

// 定期的に在庫情報を更新（5分ごと）
setInterval(fetchInventoryFromGoogleSheets, 5 * 60 * 1000);

// 在庫表示を更新
function updateStockDisplay() {
    const products = ['百花蜜（300g）', '百花蜜（500g）', 'ギフトセット'];
    const stockIds = ['stock-acacia', 'stock-wildflower', 'stock-gift'];
    const buttonIds = ['btn-acacia', 'btn-wildflower', 'btn-gift'];

    products.forEach((product, index) => {
        const stockElement = document.getElementById(stockIds[index]);
        const buttonElement = document.getElementById(buttonIds[index]);
        const stock = inventory[product];

        if (stock > 0) {
            stockElement.textContent = `在庫あり（${stock}個）`;
            stockElement.className = 'stock-status';
            buttonElement.disabled = false;
            buttonElement.textContent = 'カートに追加';
        } else {
            stockElement.textContent = '在庫切れ';
            stockElement.className = 'stock-status out-of-stock';
            buttonElement.disabled = true;
            buttonElement.textContent = '在庫切れ';
        }
    });
}

// カートに商品を追加
function addToCart(name, price) {
    // 在庫チェック
    if (inventory[name] <= 0) {
        alert('申し訳ございません。この商品は在庫切れです。');
        return;
    }

    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        if (existingItem.quantity >= inventory[name]) {
            alert('在庫数を超えています。');
            return;
        }
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
                <div>
                    <strong>${item.name}</strong><br>
                    <small>¥${item.price.toLocaleString()} × ${item.quantity}</small>
                </div>
                <div>¥${(item.price * item.quantity).toLocaleString()}</div>
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

// Googleスプレッドシートから在庫情報を取得する関数（実装例）
async function fetchInventoryFromGoogleSheets() {
    // 実際の実装では、Google Sheets APIを使用してデータを取得
    // ここではサンプルデータを返す
    try {
        // const response = await fetch('YOUR_GOOGLE_SHEETS_API_URL');
        // const data = await response.json();

        // サンプルデータ
        const sampleData = {
            '百花蜜（300g）': Math.floor(Math.random() * 10),
            '百花蜜（500g）': Math.floor(Math.random() * 10),
            'ギフトセット': Math.floor(Math.random() * 5)
        };

        // 在庫データを更新
        Object.assign(inventory, sampleData);
        updateStockDisplay();

    } catch (error) {
        console.error('在庫情報の取得に失敗しました:', error);
    }
}

// 定期的に在庫情報を更新（5分ごと）
setInterval(fetchInventoryFromGoogleSheets, 5 * 60 * 1000);

// 注文データをGoogleフォームに送信する準備
function prepareOrderForGoogleForm() {
    if (cart.length === 0) {
        alert('商品を選択してください。');
        return;
    }

    // 注文内容をローカルストレージに保存（Googleフォームで参照）
    const orderData = {
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('pendingOrder', JSON.stringify(orderData));

    // Googleフォームのプリフィル用URLを生成
    const formUrl = 'https://forms.google.com/[あなたのフォームID]';
    const orderSummary = cart.map(item =>
        `${item.name} × ${item.quantity} = ¥${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');

    // プリフィル用のパラメータを追加（実際のフォームフィールドIDに合わせて調整）
    const prefilledUrl = `${formUrl}?usp=pp_url&entry.123456=${encodeURIComponent(orderSummary)}`;

    return prefilledUrl;
}

// エラーハンドリング
window.addEventListener('error', function (e) {
    console.error('エラーが発生しました:', e.error);
});

// パフォーマンス最適化：画像の遅延読み込み
document.addEventListener('DOMContentLoaded', function () {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
});

// Google Analytics tracking（オプション）
function trackEvent(action, category, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label
        });
    }
}

// 商品追加時のトラッキング
const originalAddToCart = addToCart;
addToCart = function (name, price) {
    trackEvent('add_to_cart', 'ecommerce', name);
    return originalAddToCart.call(this, name, price);
};