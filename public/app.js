document.addEventListener('DOMContentLoaded', () => {
    const langSwitch = document.getElementById('lang-switch');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const resultsDiv = document.getElementById('results');
    let currentLang = 'en';

    // Language switch
    langSwitch.addEventListener('click', (e) => {
        e.preventDefault();
        currentLang = currentLang === 'en' ? 'ru' : 'en';
        langSwitch.textContent = currentLang === 'en' ? 'Русский' : 'English';
        loadAcupoints();
    });

    // Search functionality
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Load all acupoints on page load
    loadAcupoints();

    async function loadAcupoints() {
        try {
            const response = await fetch('/api/acupoints?limit=100');
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
                displayAcupoints(data.data);
            } else {
                resultsDiv.innerHTML = '<p>No acupoints found.</p>';
            }
        } catch (error) {
            resultsDiv.innerHTML = '<p>Error loading acupoints. Please try again.</p>';
            console.error('Error:', error);
        }
    }

    function displayAcupoints(acupoints) {
        resultsDiv.innerHTML = `
            <h2>Acupoints (${acupoints.length})</h2>
            <div class="acupoint-grid">
                ${acupoints.map(point => `
                    <div class="acupoint-card">
                        <h3>${currentLang === 'en' ? point.name : point.name_ru}</h3>
                        <p><strong>Meridian:</strong> ${point.meridian}</p>
                        <p><strong>Category:</strong> ${point.category}</p>
                        <p><strong>Location:</strong> ${currentLang === 'en' ? point.location : point.location_ru}</p>
                        <p><strong>Benefits:</strong> ${point.benefits}</p>
                        <img src="/images/acupoints/${point.image}" alt="${point.name}" class="acupoint-image" onerror="this.style.display='none'">
                        <a href="/api/acupoints/${point.id}" class="view-link" target="_blank">View Details →</a>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async function performSearch() {
        const term = searchInput.value.trim();
        if (!term) {
            loadAcupoints();
            return;
        }

        try {
            const response = await fetch(`/api/acupoints/search/${encodeURIComponent(term)}`);
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
                displayAcupoints(data.data);
            } else {
                resultsDiv.innerHTML = `<p>No results found for "${term}".</p>`;
            }
        } catch (error) {
            resultsDiv.innerHTML = '<p>Error searching. Please try again.</p>';
            console.error('Error:', error);
        }
    }
});
