const API_URL = window.location.origin;

async function fetchData() {
    try {
        const response = await fetch(`${API_URL}/api/data`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch data');
        return await response.json();
    } catch (err) {
        console.error('Error fetching data:', err);
        return null;
    }
}

function updatePhoneDisplay(data) {
    const headerPhone = document.getElementById('headerPhone');
    const mainPhone = document.getElementById('mainPhone');
    
    if (headerPhone) headerPhone.textContent = data.phone;
    if (mainPhone) mainPhone.textContent = data.phone;
    
    const contactLinks = document.querySelectorAll('a[href^="tel:"]');
    contactLinks.forEach(link => {
        link.href = `tel:${data.phone.replace(/\s/g, '')}`;
    });
}

function renderCars(data) {
    const grid = document.getElementById('carsGrid');
    if (!grid) return;
    
    grid.innerHTML = data.cars.map((car) => {
        const shareText = `🚗 *${car.name}*\n💰 किंमत: ${car.price}\n📞 संपर्क: ${data.phone}\n\nकाळेश्वरी ट्रॅव्हलर - सर्वोत्तम कार भाड्याची सेवा!`;
        const whatsappLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        
        return `
        <div class="car-card">
            <div class="car-image">
                ${car.image ? `<img src="${car.image}?t=${Date.now()}" alt="${car.name}">` : '<div class="no-car-img"><i class="fas fa-car"></i></div>'}
                <a href="${whatsappLink}" target="_blank" class="whatsapp-share-btn" title="WhatsApp वर पाठवा">
                    <i class="fab fa-whatsapp"></i>
                </a>
            </div>
            <div class="car-info">
                <h3>${car.name}</h3>
                <p class="car-price">${car.price}</p>
                ${car.mobile ? `<p class="car-mobile"><i class="fas fa-phone"></i> <a href="tel:${car.mobile.replace(/\s/g, '')}">${car.mobile}</a></p>` : ''}
                <a href="tel:${data.phone.replace(/\s/g, '')}" class="book-btn">बुक करा</a>
            </div>
        </div>
        `;
    }).join('');
}

function renderAds(data) {
    const grid = document.getElementById('adsGrid');
    if (!grid) return;
    
    if (data.ads && data.ads.length > 0 && data.ads[0].title) {
        grid.innerHTML = data.ads.map(ad => `
            <div class="ad-card has-content">
                ${ad.image ? `<img src="${ad.image}?t=${Date.now()}" alt="Ad">` : ''}
                <div class="ad-content">
                    <h3>${ad.title}</h3>
                    <p>${ad.description || ''}</p>
                </div>
            </div>
        `).join('');
    } else {
        grid.innerHTML = `
            <div class="ad-card">
                <div class="ad-content">
                    <i class="fas fa-ad"></i>
                    <h3>आपली जाहिरात येथे</h3>
                    <p>आमच्या वेबसाइटवर जाहिरात द्या</p>
                </div>
            </div>
        `;
    }
}

function addShareButton() {
    const headerButtons = document.querySelector('.header-buttons');
    if (!headerButtons) return;
    
    const shareDiv = document.createElement('div');
    shareDiv.className = 'share-group';
    shareDiv.innerHTML = `
        <a href="https://wa.me/?text=${encodeURIComponent('🚗 काळेश्वरी ट्रॅव्हलर - सर्वोत्तम कार भाड्याची सेवा!\n\nगाड्या पहा: ')}${encodeURIComponent(window.location.href)}" target="_blank" class="share-website-btn" title="WhatsApp वर शेअर करा">
            <i class="fab fa-whatsapp"></i> शेअर
        </a>
    `;
    headerButtons.appendChild(shareDiv);
}

let lastDataHash = '';

async function refreshData() {
    const data = await fetchData();
    if (!data) return;
    
    const currentHash = JSON.stringify(data);
    if (currentHash !== lastDataHash) {
        lastDataHash = currentHash;
        updatePhoneDisplay(data);
        renderCars(data);
        renderAds(data);
    }
}

async function init() {
    await refreshData();
    setInterval(refreshData, 3000);
}

function toggleMenu() {
    const menu = document.getElementById('dropdownMenu');
    menu.classList.toggle('show');
}

function shareWebsiteLink() {
    const url = window.location.href;
    const text = `🚗 काळेश्वरी ट्रॅव्हलर - सर्वोत्तम कार भाड्याची सेवा!\n\nगाड्या पहा: ${url}`;
    
    if (navigator.share) {
        navigator.share({ title: 'काळेश्वरी ट्रॅव्हलर', text, url }).catch(() => {});
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
    toggleMenu();
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('dropdownMenu');
    if (menu && menu.classList.contains('show') && !e.target.closest('.menu-container')) {
        menu.classList.remove('show');
    }
});

document.addEventListener('DOMContentLoaded', init);