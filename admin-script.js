const defaultData = {
    phone: "+91 99999 99999",
    cars: [
        { name: "प्रीमियम सेडान", price: "₹1500/तास", image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400" },
        { name: "एसयूव्ही", price: "₹2000/तास", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400" },
        { name: "लक्झरी कार", price: "₹3000/तास", image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400" },
        { name: "स्पोर्ट्स कार", price: "₹4000/तास", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400" },
        { name: "मिनी व्हॅन", price: "₹1200/तास", image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400" },
        { name: "टेम्पो ट्रॅव्हलर", price: "₹2500/तास", image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400" }
    ],
    ads: [
        { title: "आपली जाहिरात येथे", description: "आमच्या वेबसाइटवर जाहिरात द्या", image: "" }
    ]
};

let currentData = JSON.parse(localStorage.getItem('kaleshwariData')) || defaultData;
let currentCarIndex = null;

function init() {
    document.getElementById('phoneInput').value = currentData.phone;
    renderCars();
}

function renderCars() {
    const list = document.getElementById('carsList');
    list.innerHTML = currentData.cars.map((car, index) => `
        <div class="item-card">
            <img src="${car.image}" alt="${car.name}">
            <div class="item-info">
                <h3>${car.name}</h3>
                <p>${car.price}</p>
            </div>
            <button class="edit-btn" onclick="openEditCar(${index})">
                <i class="fas fa-edit"></i> बदला
            </button>
        </div>
    `).join('');
}

function savePhone() {
    const phone = document.getElementById('phoneInput').value;
    if (!phone) {
        showToast('कृपया फोन नंबर भरा!', 'error');
        return;
    }
    currentData.phone = phone;
    saveToStorage();
    showToast('फोन नंबर सफलतापूर्वक बदलला!');
}

function saveAd() {
    const title = document.getElementById('adTitle').value;
    const description = document.getElementById('adDescription').value;
    const image = document.getElementById('adImage').value;
    
    if (!title) {
        showToast('कृपया जाहिरात शीर्षक भरा!', 'error');
        return;
    }
    
    currentData.ads = [{
        title: title,
        description: description,
        image: image
    }];
    
    saveToStorage();
    showToast('जाहिरात सफलतापूर्वक जोडली!');
    clearAdForm();
}

function clearAdForm() {
    document.getElementById('adTitle').value = '';
    document.getElementById('adDescription').value = '';
    document.getElementById('adImage').value = '';
}

function openEditCar(index) {
    currentCarIndex = index;
    const car = currentData.cars[index];
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-car"></i> गाडी बदला</h3>
            <div class="form-group">
                <label>गाडीचे नाव</label>
                <input type="text" id="editCarName" value="${car.name}">
            </div>
            <div class="form-group">
                <label>किंमत</label>
                <input type="text" id="editCarPrice" value="${car.price}">
            </div>
            <div class="form-group">
                <label>फोटो URL</label>
                <input type="url" id="editCarImage" value="${car.image}">
            </div>
            <div class="modal-actions">
                <button class="cancel-btn" onclick="closeModal()">रद्द करा</button>
                <button class="save-btn" onclick="saveCarEdit()">सेव करा</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
}

function saveCarEdit() {
    const name = document.getElementById('editCarName').value;
    const price = document.getElementById('editCarPrice').value;
    const image = document.getElementById('editCarImage').value;
    
    if (!name || !price || !image) {
        showToast('कृपया सर्व माहिती भरा!', 'error');
        return;
    }
    
    currentData.cars[currentCarIndex] = { name, price, image };
    saveToStorage();
    renderCars();
    closeModal();
    showToast('गाडी सफलतापूर्वक बदलली!');
}

function resetData() {
    if (confirm('तुम्ही खात्री करा की तुम्हाला सर्व डेटा रीसेट करायचा आहे?')) {
        localStorage.removeItem('kaleshwariData');
        currentData = defaultData;
        init();
        showToast('डेटा रीसेट झाला!');
    }
}

function saveToStorage() {
    localStorage.setItem('kaleshwariData', JSON.stringify(currentData));
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#e74c3c' : '#2ecc71';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', init);